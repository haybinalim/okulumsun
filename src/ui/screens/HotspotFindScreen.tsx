/**
 * HOTSPOT_FIND ekranı — sahnedeki hedef bölgelere dokun.
 *
 * M-GEO-YAPI, M-GEO-AYIR, M-GEO-SINIFLA için. Çocuk sahnede doğru
 * bölgelere dokunur. Yanlış bölge tekrar deneme üretir.
 *
 * validation.dogruHotspotIds: doğru bölge ID'leri.
 * validation.hepsiGerekli: true ise tüm doğru bölgeler gerekli,
 * false ise biri yeterli.
 */

import { useState } from 'react';
import { GameShell } from '../layout/GameShell';
import { SpeakButton } from '../primitives/SpeakButton';
import { BigButton } from '../primitives/BigButton';
import { Visual } from '../svg/Visual';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { randomPraise, randomRetry } from '../../audio/speech';
import type { HotspotFindExercise, HotspotOption } from '../../exercises/types';
import type { Accent } from '../../design/tokens';

export function HotspotFindScreen({
  exercise,
  accent,
  onDone,
}: {
  exercise: HotspotFindExercise;
  accent: Accent;
  onDone: (dogruMu: boolean) => void;
}) {
  useScreenSpeech(exercise.prompt.ses, [exercise.itemId]);

  const [dokunulan, setDokunulan] = useState<Set<string>>(new Set());
  const [hatalar, setHatalar] = useState<Set<string>>(new Set());
  const [cozum, setCozum] = useState<'bos' | 'dogru' | 'tekrar'>('bos');

  const dogruIds = exercise.validation.dogruHotspotIds;
  const hepsiGerekli = exercise.validation.hepsiGerekli;

  const dogruSayisi = dogruIds.filter((id) => dokunulan.has(id)).length;
  const tamamlandi = hepsiGerekli
    ? dogruIds.every((id) => dokunulan.has(id))
    : dogruSayisi >= 1;

  const handleHotspot = (id: string) => {
    if (cozum !== 'bos') return;
    if (dokunulan.has(id)) return;

    if (dogruIds.includes(id)) {
      setDokunulan((onceki) => new Set([...onceki, id]));
      if (tamamlandi || (hepsiGerekli && dogruIds.every((d) => d === id || dokunulan.has(d)))) {
        // Tamamlandı — tüm doğrular bulundu
        setCozum('dogru');
        void speak(randomPraise());
        window.setTimeout(() => onDone(true), 900);
      }
    } else {
      // Yanlış bölge
      setHatalar((onceki) => new Set([...onceki, id]));
      setCozum('tekrar');
      void speak(randomRetry());
      window.setTimeout(() => {
        setCozum('bos');
        setHatalar(new Set());
      }, 1600);
    }
  };

  const scene = exercise.prompt.gorsel;
  const hotspotOptions = exercise.options as readonly HotspotOption[];

  const sceneW = 560;
  const sceneH = 280;

  return (
    <GameShell
      accent={accent.hex}
      stimulus={
        scene ? (
          <div style={{ position: 'relative', transform: 'scale(var(--scale,1))', transformOrigin: 'center' }}>
            <Visual spec={scene} width={sceneW} height={sceneH} />
            {/* Hotspot bölgeleri */}
            {hotspotOptions.map((o) => {
              const bolge = o.bolge;
              const isDokunulan = dokunulan.has(o.id);
              const isHata = hatalar.has(o.id);

              // Bölge tipine göre stil
              const bolgeStyle: React.CSSProperties =
                bolge.sekil === 'daire'
                  ? {
                      left: `${bolge.cx * 100}%`,
                      top: `${bolge.cy * 100}%`,
                      width: `${bolge.r * 2 * 100}%`,
                      height: `${bolge.r * 2 * 100}%`,
                      borderRadius: '50%',
                    }
                  : {
                      left: `${bolge.x * 100}%`,
                      top: `${bolge.y * 100}%`,
                      width: `${bolge.w * 100}%`,
                      height: `${bolge.h * 100}%`,
                      borderRadius: 8,
                    };

              return (
                <button
                  key={o.id}
                  type="button"
                  aria-label={`bölge ${o.id}`}
                  onClick={() => handleHotspot(o.id)}
                  disabled={cozum !== 'bos' || isDokunulan}
                  style={{
                    position: 'absolute',
                    transform: 'translate(-50%, -50%)',
                    border: 'none',
                    background: isDokunulan
                      ? 'rgba(22, 163, 74, 0.3)'
                      : isHata
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'transparent',
                    cursor: cozum === 'bos' && !isDokunulan ? 'pointer' : 'default',
                    transition: 'background 0.2s',
                    ...bolgeStyle,
                  }}
                />
              );
            })}
          </div>
        ) : null
      }
      interaction={
        <>
          <div style={{ display: 'flex', gap: 'var(--size-gap)', alignItems: 'center', justifyContent: 'center' }}>
            <SpeakButton />
            {hepsiGerekli && (
              <div style={{ fontSize: 'var(--text-adult)', color: 'var(--color-ink-soft)' }}>
                {dogruSayisi} / {dogruIds.length}
              </div>
            )}
            {!hepsiGerekli && tamamlandi && (
              <BigButton
                label="Devam"
                size="primary"
                variant="accent"
                onPress={() => {
                  setCozum('dogru');
                  void speak(randomPraise());
                  window.setTimeout(() => onDone(true), 900);
                }}
              >
                Devam
              </BigButton>
            )}
          </div>
        </>
      }
    />
  );
}
