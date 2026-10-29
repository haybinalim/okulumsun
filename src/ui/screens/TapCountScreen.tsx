import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GameShell } from '../layout/GameShell';
import { ChoiceCard, type ChoiceState } from '../primitives/ChoiceCard';
import { SpeakButton } from '../primitives/SpeakButton';
import { BigButton } from '../primitives/BigButton';
import { Sprite } from '../svg/Sprite';
import { ekranDuzeni, type EkranOlculeri } from '../svg/sayYerlesimi';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { useGeriBildirim } from '../useGeriBildirim';
import { sayZorlukTavani } from '../sayZorlukTavani';
import { hataDestekKarari, yanlisSecimBilgisi, type HataDestekKarari } from '../../exercises/hataDestek';
import type { TapCountExercise, Renk } from '../../exercises/types';
import type { Vurgu } from '../../design/tokens';
import { ACCENTS } from '../../design/tokens';
import type { YanlisBilgisi } from '../../progress/basitMaddeSonucu';

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
 *
 * Yerleşim (KG-86): alt %65 ölçülür; nesneler en az `--size-tap-min` (tahtada 102, büyük hedefte
 * 118 px) ve adet/yerleşime göre seçilen ızgarayla dizilir (`sayYerlesimi.ts`). Geniş ekranda sahne
 * solda tüm yüksekliği kullanır, kartlar (`--size-choice-min`) sağ üstte; alt çubuk her zaman altta
 * ortada. Dar ekranda sahne üstte, kartlar altında. KG-130: varsayılan kartla nesneler tapMin hücreye sığmıyorsa
 * (1080×810 elle seçilen tahta) kart küçülür ya da alt çubuğun iki yanına geçer (`ekranDuzeni`).
 * KG-131: ölçülen yerleşim zorluk 4–5 maddesini taşıyamıyorsa soru zorluk 3'te gösterilir (`sayZorlukTavani`).
 */
export function TapCountScreen({
  exercise: girdi,
  accent,
  onDone,
  onYanlis,
}: {
  exercise: TapCountExercise;
  accent: Vurgu;
  onDone: (dogruMu: boolean) => void;
  /** Adım 36: her yanlış denemede (Sınıf Turu ikinci yanlışı sayar). */
  onYanlis?: (bilgi: YanlisBilgisi) => void;
}) {
  useScreenSpeech(girdi.prompt.ses, [girdi.itemId], girdi.prompt.tekrarSes);
  const geriBildirim = useGeriBildirim(girdi.itemId);

  const [dokunulan, setDokunulan] = useState<Set<string>>(new Set());
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [cozum, setCozum] = useState<'bos' | 'dogru' | 'tekrar'>('bos');
  const [hataDestegi, setHataDestegi] = useState<HataDestekKarari | null>(null);
  const alanRef = useRef<HTMLDivElement>(null);
  const cubukRef = useRef<HTMLDivElement>(null);
  const [olcu, setOlcu] = useState<Omit<EkranOlculeri, 'kartSayisi'> | null>(null);

  useLayoutEffect(() => {
    const alan = alanRef.current;
    const cubuk = cubukRef.current;
    if (!alan || !cubuk) return;
    const olc = () => {
      const kok = getComputedStyle(document.documentElement);
      const px = (ad: string, yedek: number) => parseFloat(kok.getPropertyValue(ad)) || yedek;
      const a = alan.getBoundingClientRect();
      const c = cubuk.getBoundingClientRect();
      const yeni = {
        w: Math.floor(a.width),
        h: Math.floor(a.height),
        kart: Math.round(px('--size-choice-min', 150)),
        bosluk: Math.round(px('--size-gap', 32)),
        darBosluk: Math.round(px('--size-gap-tight', 24)),
        cubukW: Math.ceil(c.width),
        cubukH: Math.ceil(c.height),
        tapMin: Math.round(px('--size-tap-min', 64)),
      };
      setOlcu((o) =>
        o && (Object.keys(yeni) as (keyof typeof yeni)[]).every((k) => o[k] === yeni[k]) ? o : yeni,
      );
    };
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(alan);
    ro.observe(cubuk);
    // Profil/kapsayıcılık CSS değişkenleri kökte değişince (ör. ilk açılışta üst bileşenin efekti bu
    // efektten SONRA çalışır) yeniden ölç; aksi hâlde kart/boşluk eski değerle hesaplanabilir.
    const mo = new MutationObserver(olc);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'data-device'] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  // KG-131: ölçümden sonra gösterilecek madde (sığmayan zorluk 4–5 → zorluk 3; diğerleri aynen).
  const exercise = useMemo(() => (olcu ? sayZorlukTavani(girdi, olcu) : girdi), [girdi, olcu]);
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
  const duzen = olcu ? ekranDuzeni({ ...olcu, kartSayisi: exercise.options.length }, sahne) : null;

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
    if (cozum === 'tekrar' && hataDestegi?.solukOptionIds.includes(id)) return 'soluk';
    if (id === seciliId && cozum === 'bos') return 'secili';
    return 'bos';
  };

  const handleConfirm = () => {
    if (seciliId === null) return;
    const dogruMu = seciliId === dogruId;
    if (dogruMu) {
      setCozum('dogru');
      void speak(geriBildirim.ovgu());
      window.setTimeout(() => onDone(true), 900);
    } else {
      const destek = hataDestekKarari(exercise, seciliId);
      setHataDestegi(destek);
      setCozum('tekrar');
      void speak(geriBildirim.tekrar());
      onYanlis?.(yanlisSecimBilgisi(exercise, seciliId, destek != null));
      if (destek != null) void speak(destek.destek.ses);
      window.setTimeout(() => {
        setCozum('bos');
        setSeciliId(null);
        setHataDestegi(null);
      }, 1600);
    }
  };

  const sayildi = dokunulan.size;

  return (
    <GameShell
      accent={accent.hex}
      stimulus={
        <div style={{ fontSize: 'var(--text-ui)', color: 'var(--color-ink-soft)' }}>
          {sayildi > 0 ? `📋 ${sayildi}` : ''}
        </div>
      }
      interaction={
        <div
          ref={alanRef}
          data-say-alani={duzen?.tur}
          data-say-zorluk={exercise.difficulty}
          style={{ position: 'relative', alignSelf: 'stretch', flex: 1, minHeight: 0 }}
        >
          {/* Sayma sahnesi — dokunulabilir nesneler alt bölgede, ölçülen kutuda. */}
          {duzen && (
            <div
              data-say-sahnesi
              style={{
                position: 'absolute',
                left: duzen.sahne.x,
                top: duzen.sahne.y,
                width: duzen.sahne.w,
                height: duzen.sahne.h,
              }}
            >
              {duzen.yerlesim.noktalar.map((p, i) => {
                const id = hedefIds[i];
                const isaretli = dokunulan.has(id);
                const size = duzen.yerlesim.boyut;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-label={`nesne ${i + 1}`}
                    onClick={() => handleNesne(id)}
                    style={{
                      position: 'absolute',
                      left: p.x - size / 2,
                      top: p.y - size / 2,
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
          )}

          {duzen && olcu && (
            <div
              data-say-kartlari
              style={{
                position: 'absolute',
                left: duzen.kartlar.x,
                top: duzen.kartlar.y,
                width: duzen.kartlar.w,
                height: duzen.kartlar.h,
                display: 'grid',
                // KG-130 'cubuk': kartlar alt çubuğun iki yanında (orta sütun çubuğun yeri).
                gridTemplateColumns: duzen.tur === 'cubuk' ? `1fr ${olcu.cubukW + 2 * olcu.bosluk}px 1fr` : '1fr',
                alignItems: 'center',
              }}
            >
              {(duzen.tur === 'cubuk'
                ? [exercise.options.slice(0, Math.ceil(exercise.options.length / 2)), [], exercise.options.slice(Math.ceil(exercise.options.length / 2))]
                : [exercise.options]
              ).map((grup, gi) => (
                <div
                  key={gi}
                  style={{
                    display: 'flex',
                    gap: 'var(--size-gap-tight)',
                    flexWrap: 'wrap',
                    justifyContent: duzen.tur !== 'cubuk' ? 'center' : gi ? 'flex-start' : 'flex-end',
                  }}
                >
                  {grup.map((o) => (
                    <ChoiceCard
                      key={o.id}
                      option={o}
                      size={duzen.kart}
                      sabitBoyut
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
              ))}
            </div>
          )}

          {/* Alt çubuk: diğer ekranlarla aynı yerde (altta ortada). */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center' }}>
            <div
              ref={cubukRef}
              className="alt-cubuk"
              style={{ display: 'flex', gap: 'var(--size-gap)', alignItems: 'center' }}
            >
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
          </div>
        </div>
      }
    />
  );
}
