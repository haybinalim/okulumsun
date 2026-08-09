/**
 * M-TERS-ISLEM — TOPLAMA-ÇIKARMA İLİŞKİSİ
 * ====================================================================
 * KAZANIM: MAT.1.2.4 — `8 − 3 = 5` gösterilir, `5 + 3 = 8` kurulur.
 * Çocuk aynı sayı üçlüsünün ters işlemini eşleştirir.
 * ÇELDİRİCİ: ISLEM_YONU, ESIT_ISLEM_SONUCU
 * ETKİLEŞİM: MATCH_PAIRS — sol: çıkarma işlemi, sağ: toplama işlemi.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type VisualSpec, type AssetSpec, type Prompt, type EslesmeKarti } from '../types';
import type { MatchPairsExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import { ISLEM_ARALIGI } from '../types';

export const TERS_ISLEM_TEMPLATE_ID = 'M-TERS-ISLEM' as const;

export interface TersIslemParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function tersIslemUret(params: TersIslemParams, rng: Rng): MatchPairsExercise {
  const { seed, difficulty } = params;

  const sayiRng = rng.fork('sayi');
  // Üçlü: a - b = c → c + b = a
  const a = sayiRng.int(5, Math.min(10 + difficulty * 2, 18));
  const b = sayiRng.int(1, Math.min(a - 1, 8));
  const c = a - b;

  // Yanlış çiftler üret
  const celdiriciRng = rng.fork('celdirici');
  const yanlisUcluler: { a: number; b: number; c: number }[] = [];
  const kullanilan = new Set<string>([`${a}-${b}-${c}`]);

  // ISLEM_YONU: a + b = c (işlem yönü karıştırıldı)
  const islemYonu = { a: c + b, b, c: b + c };
  const islemYonuKey = `${islemYonu.a}-${islemYonu.b}-${islemYonu.c}`;
  if (islemYonu.a <= ISLEM_ARALIGI.max && !kullanilan.has(islemYonuKey)) {
    yanlisUcluler.push(islemYonu);
    kullanilan.add(islemYonuKey);
  }

  // Rastgele yanlış
  while (yanlisUcluler.length < 2) {
    const ya = celdiriciRng.int(3, ISLEM_ARALIGI.max);
    const yb = celdiriciRng.int(1, ya - 1);
    const yc = ya - yb;
    const key = `${ya}-${yb}-${yc}`;
    if (!kullanilan.has(key)) {
      yanlisUcluler.push({ a: ya, b: yb, c: yc });
      kullanilan.add(key);
    }
  }

  // Match pairs: sol = çıkarma, sağ = toplama
  // Doğru çift: (a-b=c) ↔ (c+b=a)
  // Yanlış çiftler: rastgele işlemler

  const solKartlar: EslesmeKarti[] = [];
  const sagKartlar: EslesmeKarti[] = [];

  // Doğru çift
  const dogruSolId = 'sol-0';
  const dogruSagId = 'sag-0';
  solKartlar.push({
    id: dogruSolId,
    taraf: 'sol',
    deger: { tur: 'gorsel', gorsel: { type: 'sahne', parcalar: [
      { gorsel: { type: 'rakam', sayi: a }, konum: { x: 0.2, y: 0.5 } },
      { gorsel: { type: 'rakam', sayi: b }, konum: { x: 0.5, y: 0.5 } },
      { gorsel: { type: 'rakam', sayi: c }, konum: { x: 0.8, y: 0.5 } },
    ] } },
    correct: true,
  });
  sagKartlar.push({
    id: dogruSagId,
    taraf: 'sag',
    deger: { tur: 'gorsel', gorsel: { type: 'sahne', parcalar: [
      { gorsel: { type: 'rakam', sayi: c }, konum: { x: 0.2, y: 0.5 } },
      { gorsel: { type: 'rakam', sayi: b }, konum: { x: 0.5, y: 0.5 } },
      { gorsel: { type: 'rakam', sayi: a }, konum: { x: 0.8, y: 0.5 } },
    ] } },
    correct: true,
  });

  // Yanlış çiftler
  yanlisUcluler.forEach((u, i) => {
    const solId = `sol-${i + 1}`;
    const sagId = `sag-${i + 1}`;
    const etiket: HataEtiketi = i === 0 ? HATA_ETIKETLERI.ISLEM_YONU : HATA_ETIKETLERI.ESIT_ISLEM_SONUCU;
    solKartlar.push({
      id: solId, taraf: 'sol',
      deger: { tur: 'gorsel', gorsel: { type: 'sahne', parcalar: [
        { gorsel: { type: 'rakam', sayi: u.a }, konum: { x: 0.2, y: 0.5 } },
        { gorsel: { type: 'rakam', sayi: u.b }, konum: { x: 0.5, y: 0.5 } },
        { gorsel: { type: 'rakam', sayi: u.c }, konum: { x: 0.8, y: 0.5 } },
      ] } },
      correct: false, diagnosticTag: etiket,
    });
    sagKartlar.push({
      id: sagId, taraf: 'sag',
      deger: { tur: 'gorsel', gorsel: { type: 'sahne', parcalar: [
        { gorsel: { type: 'rakam', sayi: u.c }, konum: { x: 0.2, y: 0.5 } },
        { gorsel: { type: 'rakam', sayi: u.b }, konum: { x: 0.5, y: 0.5 } },
        { gorsel: { type: 'rakam', sayi: u.a }, konum: { x: 0.8, y: 0.5 } },
      ] } },
      correct: false, diagnosticTag: etiket,
    });
  });

  // Karıştır
  const siraRng = rng.fork('sira');
  const karistikSol = siraRng.shuffle([...solKartlar]);
  const karistikSag = siraRng.shuffle([...sagKartlar]);

  const options = [...karistikSol, ...karistikSag];

  // Çiftler: [solOptionId, sagOptionId] — doğru çift + yanlış çiftler
  const ciftler: readonly (readonly [string, string])[] = [
    [dogruSolId, dogruSagId],
    ...yanlisUcluler.map((_, i) => [`sol-${i + 1}`, `sag-${i + 1}`] as const),
  ];

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-islem.ters-islem' },
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-islem.ters-islem' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: [dogruSolId, dogruSagId],
  });

  return {
    kind: 'MATCH_PAIRS',
    itemId: makeItemId(TERS_ISLEM_TEMPLATE_ID, seed, `${a}-${b}=${c}|${a}+${b}=?`),
    templateId: TERS_ISLEM_TEMPLATE_ID,
    skillIds: ['mat.cebir.ters-islem'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.2.4'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 20,
    prompt, hints, assets, options,
    validation: { mod: 'eslestirme', ciftler },
    seed,
  };
}

export const tersIslemGenerator: ExerciseGenerator<TersIslemParams> = {
  templateId: TERS_ISLEM_TEMPLATE_ID,
  kind: 'MATCH_PAIRS',
  karsilananKazanimlar: ['MAT.1.2.4'],
  karsilananSkillIds: ['mat.cebir.ters-islem'],
  readingLoad: 0,
  zorlukAraligi: [3, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ISLEM_YONU, HATA_ETIKETLERI.ESIT_ISLEM_SONUCU],
  uret: tersIslemUret,
};
