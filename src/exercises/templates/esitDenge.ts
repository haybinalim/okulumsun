/**
 * M-ESIT-DENGE — EŞİT İŞARETİNİN ANLAMI (terazi metaforu)
 * ====================================================================
 * KAZANIM: MAT.1.2.3 — `7 = 3 + ?`, `4 + 3 = ? + 5`.
 * Programın vurguladığı, çoğu uygulamanın atladığı kazanım.
 * ÇELDİRİCİ: ESIT_ISLEM_SONUCU, TEK_KUMEYI_ALMA, ISLEM_YONU
 * ETKİLEŞİM: TAP_TO_PLACE — eksik değeri teraziye yerleştir.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Yuva, type Option, type VisualSpec, type AssetSpec, type Prompt } from '../types';
import type { TapToPlaceExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import { ISLEM_ARALIGI } from '../types';

export const ESIT_DENGE_TEMPLATE_ID = 'M-ESIT-DENGE' as const;

export interface EsitDengeParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function esitDengeUret(params: EsitDengeParams, rng: Rng): TapToPlaceExercise {
  const { seed, difficulty } = params;

  const sayiRng = rng.fork('sayi');
  // İki biçim: (i) a = b + ? (ii) a + b = ? + c
  const bicim = sayiRng.pick([1, 2] as const);

  let solIfade: string;
  let sagIfade: string;
  let dogru: number;
  let a: number, b: number, c = 0;

  if (bicim === 1) {
    // a = b + ? → ? = a - b
    a = sayiRng.int(5, Math.min(10 + difficulty, 15));
    b = sayiRng.int(1, a - 1);
    dogru = a - b;
    solIfade = `${a}`;
    sagIfade = `${b} + ?`;
  } else {
    // a + b = ? + c → ? = a + b - c
    a = sayiRng.int(2, 8);
    b = sayiRng.int(1, 8);
    c = sayiRng.int(1, Math.min(a + b - 1, 10));
    dogru = a + b - c;
    if (dogru < 0 || dogru > ISLEM_ARALIGI.max) {
      return esitDengeUret(params, rng.fork('retry'));
    }
    solIfade = `${a} + ${b}`;
    sagIfade = `? + ${c}`;
  }

  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: number[] = [];
  const kullanilan = new Set<number>([dogru]);

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
      diagnosticTag: (Math.abs(y - dogru) <= 1 ? HATA_ETIKETLERI.ESIT_ISLEM_SONUCU : HATA_ETIKETLERI.TEK_KUMEYI_ALMA) as HataEtiketi,
    })),
  ];

  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle([...options]);
  options.splice(0, options.length, ...karistirilmis);

  const yuvalar: readonly Yuva[] = [
    { id: 'yuva-eksik', konum: { x: 0.5, y: 0.5 }, bekleyen: 'gorsel' },
  ];

  // Sahne: terazi — sol ve sağ ifade
  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: [
      { gorsel: { type: 'rakam', sayi: bicim === 1 ? a : a + b }, konum: { x: 0.25, y: 0.4 } },
      { gorsel: { type: 'rakam', sayi: bicim === 1 ? b : c }, konum: { x: 0.75, y: 0.4 } },
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

  // Skill: difficulty ≤3 → esit-isareti, ≥4 → esitligi-donusturme
  const skillId: SkillId = difficulty <= 3 ? 'mat.cebir.esit-isareti' : 'mat.cebir.esitligi-donusturme';

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-islem.eksik-bul' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: [dogruKartId],
  });

  return {
    kind: 'TAP_TO_PLACE',
    itemId: makeItemId(ESIT_DENGE_TEMPLATE_ID, seed, `d${difficulty}|${solIfade}=${sagIfade}|${dogru}`),
    templateId: ESIT_DENGE_TEMPLATE_ID,
    skillIds: [skillId] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.2.3'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 18,
    prompt, hints, assets, options, yuvalar,
    validation: { mod: 'yerlesim', dogruEslesme: { 'yuva-eksik': dogruKartId }, siraOnemli: false },
    seed,
  };
}

export const esitDengeGenerator: ExerciseGenerator<EsitDengeParams> = {
  templateId: ESIT_DENGE_TEMPLATE_ID,
  kind: 'TAP_TO_PLACE',
  karsilananKazanimlar: ['MAT.1.2.3'],
  karsilananSkillIds: ['mat.cebir.esit-isareti', 'mat.cebir.esitligi-donusturme'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ESIT_ISLEM_SONUCU, HATA_ETIKETLERI.TEK_KUMEYI_ALMA, HATA_ETIKETLERI.ISLEM_YONU],
  uret: esitDengeUret,
};
