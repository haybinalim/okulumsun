/**
 * M-TOPLA-ONA-TUMLE — 10'A TÜMLEME
 * ====================================================================
 * KAZANIM: MAT.1.2.2 — 10'a tümleme: `8 + ? = 10` (onluk çerçeve).
 * ÇELDİRİCİ: ONLUK_BOZMA, ESIT_ISLEM_SONUCU
 * ETKİLEŞİM: TAP_TO_PLACE — eksik sayıyı yuvaya yerleştir.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Yuva, type Option, type VisualSpec, type AssetSpec, type Prompt } from '../types';
import type { TapToPlaceExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const TOPLA_ONA_TUMLE_TEMPLATE_ID = 'M-TOPLA-ONA-TUMLE' as const;

export interface ToplaOnaTumleParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function toplaOnaTumleUret(params: ToplaOnaTumleParams, rng: Rng): TapToPlaceExercise {
  const { seed, difficulty } = params;

  // Hedef: a + ? = 10, a ∈ 1..9
  const sayiRng = rng.fork('sayi');
  const a = sayiRng.int(1, 9);
  const dogru = 10 - a;

  // Şık sayısı
  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış seçenekler
  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: number[] = [];
  const kullanilan = new Set<number>([dogru]);

  // Tanılayıcı: ±1
  for (const d of [1, -1, 2, -2]) {
    if (yanlislar.length >= sikSayisi - 1) break;
    const y = dogru + d;
    if (y >= 0 && y <= 10 && !kullanilan.has(y)) {
      yanlislar.push(y);
      kullanilan.add(y);
    }
  }
  while (yanlislar.length < sikSayisi - 1) {
    let y: number;
    do { y = celdiriciRng.int(0, 10); } while (kullanilan.has(y));
    yanlislar.push(y);
    kullanilan.add(y);
  }

  const dogruKartId = `sik-d-${dogru}`;

  const options: Option[] = [
    { id: dogruKartId, deger: { tur: 'gorsel', gorsel: { type: 'rakam', sayi: dogru } }, correct: true },
    ...yanlislar.map((y, i) => ({
      id: `sik-y-${i}`,
      deger: { tur: 'gorsel' as const, gorsel: { type: 'rakam' as const, sayi: y } },
      correct: false as const,
      diagnosticTag: (Math.abs(y - dogru) <= 1 ? HATA_ETIKETLERI.ONLUK_BOZMA : HATA_ETIKETLERI.ESIT_ISLEM_SONUCU) as HataEtiketi,
    })),
  ];

  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle([...options]);
  options.splice(0, options.length, ...karistirilmis);

  const yuvalar: readonly Yuva[] = [
    { id: 'yuva-eksik', konum: { x: 0.5, y: 0.5 }, bekleyen: 'gorsel' },
  ];

  // Sahne: a + ? = 10 (onluk çerçeve — a dolu, ? boş)
  const sahneGorsel: VisualSpec = {
    type: 'onlukCerceve',
    gruplar: [a],
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-islem.ona-tumle' },
    gorsel: sahneGorsel,
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-islem.ona-tumle' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: [dogruKartId],
  });

  return {
    kind: 'TAP_TO_PLACE',
    itemId: makeItemId(TOPLA_ONA_TUMLE_TEMPLATE_ID, seed, `${a}+?=${dogru}`),
    templateId: TOPLA_ONA_TUMLE_TEMPLATE_ID,
    skillIds: ['mat.toplama.ona-tumleme'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.2.2'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 12,
    prompt, hints, assets, options, yuvalar,
    validation: { mod: 'yerlesim', dogruEslesme: { 'yuva-eksik': dogruKartId }, siraOnemli: false },
    seed,
  };
}

export const toplaOnaTumleGenerator: ExerciseGenerator<ToplaOnaTumleParams> = {
  templateId: TOPLA_ONA_TUMLE_TEMPLATE_ID,
  kind: 'TAP_TO_PLACE',
  karsilananKazanimlar: ['MAT.1.2.2'],
  karsilananSkillIds: ['mat.toplama.ona-tumleme'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ONLUK_BOZMA, HATA_ETIKETLERI.ESIT_ISLEM_SONUCU],
  uret: toplaOnaTumleUret,
};
