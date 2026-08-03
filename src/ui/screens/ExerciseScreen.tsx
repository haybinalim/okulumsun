import { useState, type ReactNode } from 'react';
import { GameShell } from '../layout/GameShell';
import { ChoiceCard, type ChoiceState } from '../primitives/ChoiceCard';
import { SpeakButton } from '../primitives/SpeakButton';
import { BigButton } from '../primitives/BigButton';
import { Visual } from '../svg/Visual';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { randomPraise, randomRetry } from '../../audio/speech';
import type { Exercise } from '../../exercises/types';
import type { Accent } from '../../design/tokens';

/**
 * Alıştırma ekranı — bir Exercise'i ekrana getirir (plan Adım 4).
 *
 * Şimdilik AUDIO_TO_IMAGE (tek seçim) akışını yönetir; diğer etkileşim türleri
 * (TAP_COUNT, TAP_TO_PLACE) ayrı bileşenlere ayrılacak. Akış §7.3'ün "seç→onayla"
 * kuralını izler: çocuk önce bir şık dokunur (büyür + çerçeve), sonra "Onayla".
 * Bu, yanlışlıkla çift dokunuşu veri kirliliği olmaktan çıkarır.
 */
export function ExerciseScreen({
  exercise,
  accent,
  onDone,
}: {
  exercise: Exercise;
  accent: Accent;
  onDone: (dogruMu: boolean) => void;
}) {
  // Ekrana girince talimatı söyle, çıkınca kes (useScreenSpeech bunu yapar).
  useScreenSpeech(exercise.prompt.ses, [exercise.itemId]);

  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [cozum, setCozum] = useState<'bos' | 'dogru' | 'tekrar'>('bos');

  // AUDIO_TO_IMAGE dışındaki türler henüz bu ekranda desteklenmiyor.
  if (exercise.kind !== 'AUDIO_TO_IMAGE') {
    return (
      <GameShell
        accent={accent.hex}
        stimulus={<p style={{ color: 'var(--color-ink-soft)' }}>{exercise.kind} henüz desteklenmiyor</p>}
        interaction={<SpeakButton />}
      />
    );
  }

  const dogruId = exercise.validation.dogruOptionId;

  const stateOf = (id: string): ChoiceState => {
    if (cozum === 'dogru' && id === dogruId) return 'dogru';
    if (cozum === 'tekrar' && id === seciliId) return 'tekrar';
    if (id === seciliId && cozum === 'bos') return 'secili';
    if (id === seciliId && cozum === 'tekrar') return 'tekrar';
    return 'bos';
  };

  const handleSelect = (id: string) => {
    if (cozum !== 'bos') return;
    setSeciliId(id);
    // Şıkkın kendi sesi varsa söyle (ör. "yedi").
    const o = exercise.options.find((x) => x.id === id);
    if (o?.ses) void speak(o.ses);
  };

  const handleConfirm = () => {
    if (seciliId === null) return;
    const dogruMu = seciliId === dogruId;
    if (dogruMu) {
      setCozum('dogru');
      void speak(randomPraise());
      // Plan §6: doğru cevap sonra oturum motoruna bildirilecek; şimdilik bitir.
      window.setTimeout(() => onDone(true), 900);
    } else {
      setCozum('tekrar');
      void speak(randomRetry());
      // Biraz sonra seçimi sıfırla — çocuk tekrar denesin, ama doğruyu öğrenmeden.
      window.setTimeout(() => {
        setCozum('bos');
        setSeciliId(null);
      }, 1600);
    }
  };

  const scene = exercise.prompt.gorsel;
  const sceneSize = 380; // px; deviceProfile ölçeklemesine göre büyür/küçülür

  return (
    <GameShell
      accent={accent.hex}
      stimulus={
        scene ? (
          <div style={{ transform: 'scale(var(--scale, 1))', transformOrigin: 'center' }}>
            <Visual spec={scene} width={sceneSize} height={sceneSize * 0.7} />
          </div>
        ) : null
      }
      interaction={
        <InteractionArea
          options={exercise.options}
          choiceSize={200}
          stateOf={stateOf}
          onSelect={handleSelect}
          onConfirm={handleConfirm}
          canConfirm={seciliId !== null && cozum === 'bos'}
        />
      }
    />
  );
}

function InteractionArea({
  options,
  choiceSize,
  stateOf,
  onSelect,
  onConfirm,
  canConfirm,
}: {
  options: readonly Exercise['options'][number][];
  choiceSize: number;
  stateOf: (id: string) => ChoiceState;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  canConfirm: boolean;
}): ReactNode {
  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--size-gap)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((o) => (
          <ChoiceCard
            key={o.id}
            option={o}
            size={choiceSize}
            state={stateOf(o.id)}
            onSelect={() => onSelect(o.id)}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 'var(--size-gap)', alignItems: 'center' }}>
        <SpeakButton />
        <BigButton
          label="Onayla"
          size="primary"
          variant="accent"
          disabled={!canConfirm}
          onBlockedPress={() => void speak({ kind: 'key', key: 'ui.once-cevap-sec' })}
          onPress={onConfirm}
        >
          Onayla
        </BigButton>
      </div>
    </>
  );
}
