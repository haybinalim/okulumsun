/**
 * SEQUENCE_ORDER ekranı — kartlara doğru sırayla dokun.
 *
 * M-YONERGE ve M-PARA-SIRALA için. Çocuk kartlara sırayla dokunur;
 * dokunma sırası = sıralama. Doğru sıra validation.dogruSira'da.
 *
 * TAP_TO_PLACE'e benzer ama yuva yok — kartlar kendileri sıralanır.
 * Dokunulan kart numaralanır, yanlış sıra tekrar deneme üretir.
 */

import { useState } from 'react';
import { GameShell } from '../layout/GameShell';
import { ChoiceCard, type ChoiceState } from '../primitives/ChoiceCard';
import { SpeakButton } from '../primitives/SpeakButton';
import { BigButton } from '../primitives/BigButton';
import { Visual } from '../svg/Visual';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { randomPraise, randomRetry } from '../../audio/speech';
import type { SequenceOrderExercise } from '../../exercises/types';
import type { Accent } from '../../design/tokens';

export function SequenceOrderScreen({
  exercise,
  accent,
  onDone,
}: {
  exercise: SequenceOrderExercise;
  accent: Accent;
  onDone: (dogruMu: boolean) => void;
}) {
  useScreenSpeech(exercise.prompt.ses, [exercise.itemId]);

  const [dokunmaSirasi, setDokunmaSirasi] = useState<string[]>([]);
  const [cozum, setCozum] = useState<'bos' | 'dogru' | 'tekrar'>('bos');

  const dogruSira = exercise.validation.dogruSira;
  const hepsiSecili = dokunmaSirasi.length === dogruSira.length;

  const handleKart = (id: string) => {
    if (cozum !== 'bos') return;
    if (dokunmaSirasi.includes(id)) return;
    setDokunmaSirasi((onceki) => [...onceki, id]);
    const o = exercise.options.find((x) => x.id === id);
    if (o?.ses) void speak(o.ses);
  };

  const handleConfirm = () => {
    const dogruMu = dokunmaSirasi.every((id, i) => id === dogruSira[i]);
    if (dogruMu) {
      setCozum('dogru');
      void speak(randomPraise());
      window.setTimeout(() => onDone(true), 900);
    } else {
      setCozum('tekrar');
      void speak(randomRetry());
      window.setTimeout(() => {
        setCozum('bos');
        setDokunmaSirasi([]);
      }, 1600);
    }
  };

  const kartStateOf = (id: string): ChoiceState => {
    if (cozum === 'dogru') return 'bos';
    if (cozum === 'tekrar') return 'tekrar';
    if (dokunmaSirasi.includes(id)) return 'secili';
    return 'bos';
  };

  const siraNo = (id: string): number | null => {
    const idx = dokunmaSirasi.indexOf(id);
    return idx >= 0 ? idx + 1 : null;
  };

  const scene = exercise.prompt.gorsel;

  return (
    <GameShell
      accent={accent.hex}
      stimulus={
        scene ? (
          <div style={{ transform: 'scale(var(--scale,1))', transformOrigin: 'center' }}>
            <Visual spec={scene} width={560} height={200} />
          </div>
        ) : null
      }
      interaction={
        <>
          <div style={{ display: 'flex', gap: 'var(--size-gap)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {exercise.options.map((o) => (
              <div key={o.id} style={{ position: 'relative' }}>
                <ChoiceCard
                  option={o}
                  size={120}
                  state={kartStateOf(o.id)}
                  onSelect={() => handleKart(o.id)}
                />
                {siraNo(o.id) != null && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {siraNo(o.id)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--size-gap)', alignItems: 'center' }}>
            <SpeakButton />
            <BigButton
              label="Onayla"
              size="primary"
              variant="accent"
              disabled={!hepsiSecili}
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
