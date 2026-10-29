import { useRef, useState } from 'react';
import { useSikisikKartBoyu } from '../secenekKartBoyu';
import { GameShell } from '../layout/GameShell';
import { ChoiceCard, type ChoiceState } from '../primitives/ChoiceCard';
import { SpeakButton } from '../primitives/SpeakButton';
import { BigButton } from '../primitives/BigButton';
import { Visual } from '../svg/Visual';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { useGeriBildirim } from '../useGeriBildirim';
import type { TapToPlaceExercise } from '../../exercises/types';
import type { Vurgu } from '../../design/tokens';
import type { YanlisBilgisi } from '../../progress/basitMaddeSonucu';
import { yanlisSecimBilgisi } from '../../exercises/hataDestek';

/**
 * M-RITMIK (TAP_TO_PLACE) ekranı — parça dokun → yuvaya dokun (sürükleme yok).
 *
 * Sahne bir örüntü dizisi (oruntu), boşluklar yuvadır. Çocuk önce bir parça
 * kartı seçer (büyür), sonra bir yuvaya dokunur — parça yerleşir. Tüm yuvalar
 * dolunca Onayla. `siraOnemli:false` olduğu için doldurma sırası serbesttir.
 *
 * KG-129: parça kartları varsayılan boyda sığmıyorsa (1080×810 tahtada 2–5 kart iki satıra kırılıp üst %35'e
 * taşıyor, ↻ ve Onayla ekran dışında kalıyordu; tablette M-VERİ-SIKLIK 5 kart) tek satıra ve alt alana sığacak kadar
 * küçülür (KG-127 `sikisikKartBoyu`). Yuvanın dokunma alanı en az `--size-tap-min` (önce sahne ölçeğiyle 56 px:
 * tablette 56, tahtada 90 px). Tahtada yuvaların sahnede, üst %35'te durması ayrı bir tasarım kararıdır (KG-129 notu).
 */
export function TapToPlaceScreen({
  exercise,
  accent,
  onDone,
  onYanlis,
}: {
  exercise: TapToPlaceExercise;
  accent: Vurgu;
  onDone: (dogruMu: boolean) => void;
  /** Adım 36: her yanlış denemede (Sınıf Turu ikinci yanlışı sayar). */
  onYanlis?: (bilgi: YanlisBilgisi) => void;
}) {
  useScreenSpeech(exercise.prompt.ses, [exercise.itemId], exercise.prompt.tekrarSes);
  const geriBildirim = useGeriBildirim(exercise.itemId);

  // yuvaId → yerleştirilen optionId (yerleştirilmediyse null)
  const [yerlesim, setYerlesim] = useState<Record<string, string | null>>({});
  const [seciliParca, setSeciliParca] = useState<string | null>(null);
  const [cozum, setCozum] = useState<'bos' | 'dogru' | 'tekrar'>('bos');

  const eslesme = exercise.validation.dogruEslesme;
  const yuvaIdleri = Object.keys(eslesme);
  const hepsiDolu = yuvaIdleri.every((y) => yerlesim[y]);

  const yerlesmisOptionIdler = new Set(Object.values(yerlesim).filter(Boolean));

  const handleParca = (id: string) => {
    if (cozum !== 'bos') return;
    // Zaten yerleşmiş parça tekrar seçilemez.
    if (yerlesmisOptionIdler.has(id)) return;
    setSeciliParca(id);
    const o = exercise.options.find((x) => x.id === id);
    if (o?.ses) void speak(o.ses);
  };

  const handleYuva = (yuvaId: string) => {
    if (cozum !== 'bos' || !seciliParca) return;
    setYerlesim((onceki) => ({ ...onceki, [yuvaId]: seciliParca }));
    setSeciliParca(null);
  };

  const handleConfirm = () => {
    const dogruMu = yuvaIdleri.every((y) => yerlesim[y] === eslesme[y]);
    if (dogruMu) {
      setCozum('dogru');
      void speak(geriBildirim.ovgu());
      window.setTimeout(() => onDone(true), 900);
    } else {
      setCozum('tekrar');
      void speak(geriBildirim.tekrar());
      onYanlis?.(
        yanlisSecimBilgisi(
          exercise,
          yerlesim[yuvaIdleri.find((y) => yerlesim[y] !== eslesme[y]) ?? ''],
          false,
        ),
      );
      window.setTimeout(() => {
        setCozum('bos');
        setYerlesim({});
        setSeciliParca(null);
      }, 1600);
    }
  };

  // Parça kartlarının durumu: seçili / yerleşmiş (devre dışı) / boş.
  const parcaStateOf = (id: string): ChoiceState => {
    if (cozum === 'dogru') return 'bos';
    if (cozum === 'tekrar') return 'tekrar';
    if (yerlesmisOptionIdler.has(id)) return 'tekrar'; // soluk, kullanılmış
    if (id === seciliParca) return 'secili';
    return 'bos';
  };

  const scene = exercise.prompt.gorsel;
  const sceneW = 560;
  const sceneH = 200;
  const kartlar = useRef<HTMLDivElement>(null);
  const sikisik = useSikisikKartBoyu(kartlar, exercise.options.length);

  return (
    <GameShell
      accent={accent.hex}
      stimulus={
        scene ? (
          <div style={{ position: 'relative', transform: 'scale(var(--scale,1))', transformOrigin: 'center' }}>
            <Visual spec={scene} width={sceneW} height={sceneH} />
            {/* Yuvaları tıklanabilir kaplama olarak üret. */}
            {exercise.yuvalar.map((y) => (
              <button
                key={y.id}
                type="button"
                aria-label={`boşluk ${y.id}`}
                onClick={() => handleYuva(y.id)}
                disabled={cozum !== 'bos' || !seciliParca || !!yerlesim[y.id]}
                style={{
                  position: 'absolute',
                  left: `${y.konum.x * 100}%`,
                  top: `${y.konum.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  // Sahne `scale(var(--scale))` içinde: tap-min / ölçek = ekranda tam `--size-tap-min` (KG-129).
                  width: 'max(56px, calc(var(--size-tap-min) / var(--scale, 1)))',
                  height: 'max(56px, calc(var(--size-tap-min) / var(--scale, 1)))',
                  borderRadius: 10,
                  border: seciliParca && !yerlesim[y.id] ? '3px dashed var(--color-accent)' : 'none',
                  background: 'transparent',
                  cursor: seciliParca && !yerlesim[y.id] ? 'pointer' : 'default',
                }}
              />
            ))}
          </div>
        ) : null
      }
      interaction={
        <>
          <div
            ref={kartlar}
            data-secenekler=""
            data-sikisik={sikisik ?? undefined}
            style={{ display: 'flex', gap: 'var(--size-gap)', flexWrap: sikisik !== null ? 'nowrap' : 'wrap', justifyContent: 'center' }}
          >
            {exercise.options.map((o) => {
              const yerlesti = yerlesmisOptionIdler.has(o.id);
              return (
                <ChoiceCard
                  key={o.id}
                  option={o}
                  size={sikisik ?? 140}
                  sabitBoyut={sikisik !== null}
                  state={parcaStateOf(o.id)}
                  onSelect={() => !yerlesti && handleParca(o.id)}
                />
              );
            })}
          </div>
          <div className="alt-cubuk" style={{ display: 'flex', gap: 'var(--size-gap)', alignItems: 'center' }}>
            <SpeakButton />
            <BigButton
              label="Onayla"
              size="primary"
              variant="accent"
              disabled={!hepsiDolu}
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
