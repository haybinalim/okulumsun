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
import { TapCountScreen } from './TapCountScreen';
import { TapToPlaceScreen } from './TapToPlaceScreen';
import { SequenceOrderScreen } from './SequenceOrderScreen';
import { MatchPairsScreen } from './MatchPairsScreen';
import { HotspotFindScreen } from './HotspotFindScreen';

/**
 * Alıştırma ekranı — bir Exercise'i kind'ına göre ilgili alt ekrana yönlendirir.
 *
 * AUDIO_TO_IMAGE (M-KARSILASTIR, M-TOPLA-GORSEL, M-SAY pickOnly) bu dosyada;
 * TAP_COUNT (M-SAY) ve TAP_TO_PLACE (M-RITMIK) ayrı ekranlarda. Her akış §7.3'ün
 * "seç→onayla" kuralını izler: yanlışlıkla çift dokunuş veri kirliliği olmasın.
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
  // Etkileşim türüne göre ilgili ekrana yönlendir.
  if (exercise.kind === 'TAP_COUNT') {
    return <TapCountScreen exercise={exercise} accent={accent} onDone={onDone} />;
  }
  if (exercise.kind === 'TAP_TO_PLACE') {
    return <TapToPlaceScreen exercise={exercise} accent={accent} onDone={onDone} />;
  }
  if (exercise.kind === 'SEQUENCE_ORDER') {
    return <SequenceOrderScreen exercise={exercise} accent={accent} onDone={onDone} />;
  }
  if (exercise.kind === 'MATCH_PAIRS') {
    return <MatchPairsScreen exercise={exercise} accent={accent} onDone={onDone} />;
  }
  if (exercise.kind === 'HOTSPOT_FIND') {
    return <HotspotFindScreen exercise={exercise} accent={accent} onDone={onDone} />;
  }
  if (exercise.kind === 'AUDIO_TO_IMAGE') {
    return <AudioToImageFlow exercise={exercise} accent={accent} onDone={onDone} />;
  }

  // Henüz ekranı yazılmamış etkileşim biçimleri sessizce yanlış
  // doğrulanmamalı. Yeni tür ekleyen kişi burada ilgili ekranı bağlar.
  return null;
}

/**
 * AUDIO_TO_IMAGE akışı ayrı bileşendir. Böylece üst bileşen etkileşim türüne
 * göre erken dönebilir; hook'ların çağrı sırası hiçbir render'da değişmez.
 */
function AudioToImageFlow({
  exercise,
  accent,
  onDone,
}: {
  exercise: Extract<Exercise, { kind: 'AUDIO_TO_IMAGE' }>;
  accent: Accent;
  onDone: (dogruMu: boolean) => void;
}) {
  useScreenSpeech(exercise.prompt.ses, [exercise.itemId]);

  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [cozum, setCozum] = useState<'bos' | 'dogru' | 'tekrar'>('bos');

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
