import { useState } from 'react';
import { GameShell } from '../layout/GameShell';
import { ChoiceCard, type ChoiceState } from '../primitives/ChoiceCard';
import { SpeakButton } from '../primitives/SpeakButton';
import { BigButton } from '../primitives/BigButton';
import { Sprite } from '../svg/Sprite';
import { nesneKonumlari } from '../svg/positions';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { randomPraise, randomRetry } from '../../audio/speech';
import type { TapCountExercise, Renk } from '../../exercises/types';
import type { Accent } from '../../design/tokens';
import { ACCENTS } from '../../design/tokens';

/** Renk adı → hex (ACCENTS tek kaynak). Visual.tsx ile aynı harita. */
const RENK_HEX: Record<Renk, string> = Object.fromEntries(
  ACCENTS.map((a) => [a.id, a.hex]),
) as Record<Renk, string>;

/**
 * M-SAY (TAP_COUNT) ekranı — iki aşamalı dokun-say → rakam seç.
 *
 * Aşama 1: nesnelere tek tek dokunur (birebir eşleşmeyi görünür kılar).
 * Aşama 2: doğru rakamı seçer (kardinalite).
 * Üst bölge BOŞ: sayılacak nesneler etkileşimli olduğu için alt %65'te durur
 * (erisimBolgesi 'alt65', ürün kısıtı #6). Üstte yalız küçük bir sayma ikonu.
 */
export function TapCountScreen({
  exercise,
  accent,
  onDone,
}: {
  exercise: TapCountExercise;
  accent: Accent;
  onDone: (dogruMu: boolean) => void;
}) {
  useScreenSpeech(exercise.prompt.ses, [exercise.itemId]);

  const [dokunulan, setDokunulan] = useState<Set<string>>(new Set());
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [cozum, setCozum] = useState<'bos' | 'dogru' | 'tekrar'>('bos');

  // Sahne bir nesneKumesi olmalı (M-SAY her zaman öyle üretir).
  const sahne = exercise.prompt.gorsel;
  if (!sahne || sahne.type !== 'nesneKumesi') {
    return (
      <GameShell accent={accent.hex} stimulus={null} interaction={<SpeakButton />} />
    );
  }

  const sprite = sahne.sprite;
  const renk = sahne.renk;
  const hedefIds = exercise.validation.hedefIds;
  const yerler = nesneKonumlari(sahne);

  const handleNesne = (id: string) => {
    if (cozum !== 'bos' || dokunulan.has(id)) return; // herNesneBirKez
    setDokunulan((onceki) => {
      const yen = new Set(onceki);
      yen.add(id);
      return yen;
    });
    void speak({ kind: 'key', key: `sayi.${dokunulan.size + 1}` as never });
  };

  const dogruId = exercise.validation.dogruOptionId!;
  const stateOf = (id: string): ChoiceState => {
    if (cozum === 'dogru' && id === dogruId) return 'dogru';
    if (cozum === 'tekrar' && id === seciliId) return 'tekrar';
    if (id === seciliId && cozum === 'bos') return 'secili';
    return 'bos';
  };

  const handleConfirm = () => {
    if (seciliId === null) return;
    const dogruMu = seciliId === dogruId;
    if (dogruMu) {
      setCozum('dogru');
      void speak(randomPraise());
      window.setTimeout(() => onDone(true), 900);
    } else {
      setCozum('tekrar');
      void speak(randomRetry());
      window.setTimeout(() => {
        setCozum('bos');
        setSeciliId(null);
      }, 1600);
    }
  };

  const sayildi = dokunulan.size;
  const sceneH = 240;

  return (
    <GameShell
      accent={accent.hex}
      stimulus={
        <div style={{ fontSize: 'var(--text-ui)', color: 'var(--color-ink-soft)' }}>
          {sayildi > 0 ? `📋 ${sayildi}` : ''}
        </div>
      }
      interaction={
        <>
          {/* Sayma sahnesi — dokunulabilir nesneler alt bölgede. */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: sceneH,
              maxWidth: 520,
            }}
          >
            {yerler.map((p, i) => {
              const id = hedefIds[i];
              const isaretli = dokunulan.has(id);
              const size = 64;
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={`nesne ${i + 1}`}
                  onClick={() => handleNesne(id)}
                  style={{
                    position: 'absolute',
                    left: `${p.x * 100}%`,
                    top: `${p.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: size,
                    height: size,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    opacity: isaretli ? 0.4 : 1,
                    filter: isaretli ? 'grayscale(0.6)' : 'none',
                    transition: 'opacity 200ms',
                  }}
                >
                  <Sprite name={sprite} fill={renk ? RENK_HEX[renk] : undefined} size={size} />
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 'var(--size-gap)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {exercise.options.map((o) => (
              <ChoiceCard
                key={o.id}
                option={o}
                size={160}
                state={stateOf(o.id)}
                onSelect={() => {
                  if (cozum === 'bos') {
                    setSeciliId(o.id);
                    if (o.ses) void speak(o.ses);
                  }
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--size-gap)', alignItems: 'center' }}>
            <SpeakButton />
            <BigButton
              label="Onayla"
              size="primary"
              variant="accent"
              disabled={seciliId === null}
              onBlockedPress={() => void speak({ kind: 'key', key: 'ui.once-cevap-sec' })}
              onPress={handleConfirm}
            >
              Onayla
            </BigButton>
          </div>
        </>
      }
    />
  );
}
