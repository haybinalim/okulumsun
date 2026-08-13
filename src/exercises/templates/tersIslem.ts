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
import { HATA_ETIKETLERI } from '../distractors';
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

  // MATCH_PAIRS içinde her kartın bir eşi vardır; "yanlış" işlem kartı yoktur.
  // Bu nedenle ek kartlar da a − b = c eşitliğini sağlayan, ana üçlüden farklı
  // geçerli işlem aileleri olarak üretilir.
  const celdiriciRng = rng.fork('ek-ciftler');
  const ekUcluler: { a: number; b: number; c: number }[] = [];
  const kullanilan = new Set<string>([`${a}-${b}-${c}`]);

  while (ekUcluler.length < 2) {
    const ya = celdiriciRng.int(3, ISLEM_ARALIGI.max);
    const yb = celdiriciRng.int(1, ya - 1);
    const yc = ya - yb;
    const key = `${ya}-${yb}-${yc}`;
    if (!kullanilan.has(key)) {
      ekUcluler.push({ a: ya, b: yb, c: yc });
      kullanilan.add(key);
    }
  }

  // İki eşdeğer işlem ailesi dönüşümlü kullanılır. Aynı sayı üçlüsü, yalnızca
  // işlem yönü değil parçanın/bütünün hangi tarafta bulunduğu bakımından da değişir.
  const aile = rng.fork(`aile|d${difficulty}`).bool() ? 'cikar-topla' : 'topla-cikar';
  const solGorsel = (u: { a: number; b: number; c: number }): VisualSpec =>
    aile === 'cikar-topla'
      ? { type: 'islemKarti', ilkSayi: u.a, ikinciSayi: u.b, sonuc: u.c, islem: '-' }
      : { type: 'islemKarti', ilkSayi: u.b, ikinciSayi: u.c, sonuc: u.a, islem: '+' };
  const sagGorsel = (u: { a: number; b: number; c: number }): VisualSpec =>
    aile === 'cikar-topla'
      ? { type: 'islemKarti', ilkSayi: u.c, ikinciSayi: u.b, sonuc: u.a, islem: '+' }
      : { type: 'islemKarti', ilkSayi: u.a, ikinciSayi: u.c, sonuc: u.b, islem: '-' };

  // MATCH_PAIRS'te her kart eşleştirilebilir bir çifttir; "yanlış kart" yoktur.
  // Çeldirici, kartın kendisi değil aynı anda görünür başka işlem çiftleridir.
  const solKartlar: EslesmeKarti[] = [];
  const sagKartlar: EslesmeKarti[] = [];

  // Doğru çift
  const dogruSolId = 'sol-0';
  const dogruSagId = 'sag-0';
  solKartlar.push({
    id: dogruSolId,
    taraf: 'sol',
    deger: { tur: 'gorsel', gorsel: solGorsel({ a, b, c }) },
    correct: true,
  });
  sagKartlar.push({
    id: dogruSagId,
    taraf: 'sag',
    deger: { tur: 'gorsel', gorsel: sagGorsel({ a, b, c }) },
    correct: true,
  });

  // Aynı ilişkiyi taşıyan ek çiftler. Ekranda karışık sıralandıkları için çocuk
  // her çıkarma/toplama eşdeğerliğini görseldeki işleç ve sayılardan bulur.
  ekUcluler.forEach((u, i) => {
    const solId = `sol-${i + 1}`;
    const sagId = `sag-${i + 1}`;
    solKartlar.push({
      id: solId, taraf: 'sol',
      deger: { tur: 'gorsel', gorsel: solGorsel(u) },
      correct: true,
    });
    sagKartlar.push({
      id: sagId, taraf: 'sag',
      deger: { tur: 'gorsel', gorsel: sagGorsel(u) },
      correct: true,
    });
  });

  // Karıştır
  const siraRng = rng.fork('sira');
  const karistikSol = siraRng.shuffle([...solKartlar]);
  const karistikSag = siraRng.shuffle([...sagKartlar]);

  const options = [...karistikSol, ...karistikSag];

  // Çiftler: [solOptionId, sagOptionId] — her işlem ailesi matematiksel olarak geçerlidir.
  const ciftler: readonly (readonly [string, string])[] = [
    [dogruSolId, dogruSagId],
    ...ekUcluler.map((_, i) => [`sol-${i + 1}`, `sag-${i + 1}`] as const),
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
    eleOptionIds: [],
    vurgulaIds: [dogruSolId, dogruSagId],
  });

  return {
    kind: 'MATCH_PAIRS',
    itemId: makeItemId(TERS_ISLEM_TEMPLATE_ID, seed, `${a}-${b}=${c}|aile:${aile}`),
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
