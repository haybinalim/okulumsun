/**
 * M-EKSIK-TOPLANAN — EKSİK TOPLANAN
 * ====================================================================
 * KAZANIM: MAT.1.2.3, MAT.1.2.4 — `3 + ? = 8` eksik toplanan.
 * ÇELDİRİCİ: ESIT_ISLEM_SONUCU, ISLEM_YONU, HEPSINI_SAYMA
 * ETKİLEŞİM: TAP_TO_PLACE — eksik sayıyı yuvaya yerleştir.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Yuva, type Option, type VisualSpec, type AssetSpec, type Prompt } from '../types';
import type { TapToPlaceExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import { ISLEM_ARALIGI } from '../types';

export const EKSIK_TOPLANAN_TEMPLATE_ID = 'M-EKSIK-TOPLANAN' as const;

export interface EksikToplananParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function eksikToplananUret(params: EksikToplananParams, rng: Rng): TapToPlaceExercise {
  const { seed, difficulty } = params;

  const sayiRng = rng.fork('sayi');
  // a + ? = toplam → ? = toplam - a
  const toplam = sayiRng.int(5, Math.min(10 + difficulty * 2, 18));
  const a = sayiRng.int(1, toplam - 1);
  const dogru = toplam - a;

  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: number[] = [];
  const kullanilan = new Set<number>([dogru]);

  // Tanılayıcı: ISLEM_YONU — toplam yerine a + toplam
  const islemYonuYanlis = a + toplam;
  if (islemYonuYanlis <= ISLEM_ARALIGI.max && !kullanilan.has(islemYonuYanlis)) {
    yanlislar.push(islemYonuYanlis);
    kullanilan.add(islemYonuYanlis);
  }

  for (const d of [1, -1, 2, -2]) {
    if (yanlislar.length >= sikSayisi - 1) break;
    const y = dogru + d;
    if (y >= 0 && y <= ISLEM_ARALIGI.max && !kullanilan.has(y)) {
      yanlislar.push(y);
      kullanilan.add(y);
    }
  }
  while (yanlislar.length < sikSayisi - 1) {
    let y: number;
    do { y = celdiriciRng.int(0, ISLEM_ARALIGI.max); } while (kullanilan.has(y));
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
      diagnosticTag: (y === islemYonuYanlis ? HATA_ETIKETLERI.ISLEM_YONU : Math.abs(y - dogru) <= 1 ? HATA_ETIKETLERI.ESIT_ISLEM_SONUCU : HATA_ETIKETLERI.HEPSINI_SAYMA) as HataEtiketi,
    })),
  ];

  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle([...options]);
  options.splice(0, options.length, ...karistirilmis);

  const yuvalar: readonly Yuva[] = [
    { id: 'yuva-eksik', konum: { x: 0.5, y: 0.5 }, bekleyen: 'gorsel' },
  ];

  // Sahne: a + ? = toplam
  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: [
      { gorsel: { type: 'rakam', sayi: a }, konum: { x: 0.25, y: 0.5 } },
      { gorsel: { type: 'rakam', sayi: toplam }, konum: { x: 0.75, y: 0.5 } },
    ],
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-islem.eksik-bul' },
    gorsel: sahneGorsel,
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-islem.eksik-bul' },
    k2Ses: { kind: 'key', key: 'yardim.ustune-sayma' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: [dogruKartId],
  });

  return {
    kind: 'TAP_TO_PLACE',
    itemId: makeItemId(EKSIK_TOPLANAN_TEMPLATE_ID, seed, `d${difficulty}|${a}+?=${toplam}|${dogru}`),
    templateId: EKSIK_TOPLANAN_TEMPLATE_ID,
    skillIds: ['mat.cebir.eksik-toplanan'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.2.4', 'MAT.1.2.3'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 15,
    prompt, hints, assets, options, yuvalar,
    validation: { mod: 'yerlesim', dogruEslesme: { 'yuva-eksik': dogruKartId }, siraOnemli: false },
    seed,
  };
}

export const eksikToplananGenerator: ExerciseGenerator<EksikToplananParams> = {
  templateId: EKSIK_TOPLANAN_TEMPLATE_ID,
  kind: 'TAP_TO_PLACE',
  karsilananKazanimlar: ['MAT.1.2.4', 'MAT.1.2.3'],
  karsilananSkillIds: ['mat.cebir.eksik-toplanan'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ESIT_ISLEM_SONUCU, HATA_ETIKETLERI.ISLEM_YONU, HATA_ETIKETLERI.HEPSINI_SAYMA],
  uret: eksikToplananUret,
};
