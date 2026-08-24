/**
 * M-ISLEM-HIKAYE — GÜNLÜK YAŞAM PROBLEMİ
 * ====================================================================
 * KAZANIM: MAT.1.2.1 — Sesli günlük yaşam problemi.
 * "5 kuş vardı, 2'si uçtu" — toplama/çıkarma senaryoları.
 * ÇELDİRİCİ: ISLEM_YONU, GOREV_ANLASILMADI, TEK_KUMEYI_ALMA
 * ETKİLEŞİM: AUDIO_TO_IMAGE. SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type VisualSpec, type AssetSpec, type Prompt, type NesneSprite } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';
import { sayisalCeldiricilerKesin, celdiricileriSikaCevir } from '../distractors';
import { sayExpression } from '../../audio/speech';
import { ISLEM_ARALIGI } from '../types';

export const ISLEM_HIKAYE_TEMPLATE_ID = 'M-ISLEM-HIKAYE' as const;

/** Hikaye senaryoları — basit, günlük yaşam. */
interface HikayeSenaryo {
  readonly islem: '+' | '-';
  readonly nesne: NesneSprite;
  readonly eylem: string; // "vardı", "uçtu" etc
}

const SENARYOLAR: readonly HikayeSenaryo[] = [
  { islem: '-', nesne: 'kus', eylem: 'uçtu' },
  { islem: '-', nesne: 'elma', eylem: 'yendi' },
  { islem: '+', nesne: 'cicek', eylem: 'açtı' },
  { islem: '+', nesne: 'top', eylem: 'geldi' },
  { islem: '-', nesne: 'balon', eylem: 'patladı' },
  { islem: '+', nesne: 'kelebek', eylem: 'kondu' },
];

export interface IslemHikayeParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function islemHikayeUret(params: IslemHikayeParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const senaryoRng = rng.fork('senaryo');
  const senaryo = senaryoRng.pick(SENARYOLAR);

  const sayiRng = rng.fork('sayilar');
  const a = sayiRng.int(3, Math.min(10 + difficulty, 15));
  const b = sayiRng.int(1, Math.min(a - 1, 8));
  const sonuc = senaryo.islem === '+' ? a + b : a - b;

  // Sonuç kontrolü
  if (sonuc < 0 || sonuc > ISLEM_ARALIGI.max) {
    // Güvenli yeniden üretim
    return islemHikayeUret(params, rng.fork('retry'));
  }

  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  const celdiriciRng = rng.fork('celdirici');
  const celdiriciler = sayisalCeldiricilerKesin(
    sonuc,
    [HATA_ETIKETLERI.ISLEM_YONU, HATA_ETIKETLERI.GOREV_ANLASILMADI, HATA_ETIKETLERI.TEK_KUMEYI_ALMA],
    { min: 0, max: ISLEM_ARALIGI.max },
    sikSayisi - 1,
    celdiriciRng,
    { baglam: { a, b, islem: senaryo.islem }, yedekStrateji: 'yakinKomsu' },
  );
  const siklar = celdiricileriSikaCevir(sonuc, celdiriciler, celdiriciRng);

  // Sahne: ilk miktar, eklenen/ayrılan miktar ve sonuç aynı nesneyle görünür.
  // Çıkarma için ayrılan nesneler soluk ve çarpı işaretli gösterilir.
  const sahneGorsel: VisualSpec = {
    type: 'islemSahnesi',
    nesne: senaryo.nesne,
    ilkAdet: a,
    degisimAdedi: b,
    islem: senaryo.islem,
  };

  // Talimat: hikaye + işlem ifadesi
  const islemTalimat = sayExpression(a, senaryo.islem, b);

  const prompt: Prompt = {
    ses: islemTalimat,
    gorsel: sahneGorsel,
  };

  const assets: readonly AssetSpec[] = [
    { id: 'sahne', rol: 'sahne', gorsel: sahneGorsel, erisimBolgesi: 'serbest' },
    ...siklar.map((o) => ({
      id: o.id,
      rol: 'secenek' as const,
      gorsel: { type: 'rakam', sayi: (o.deger as { tur: 'sayi'; sayi: number }).sayi } as VisualSpec,
      erisimBolgesi: 'alt65' as const,
    })),
  ];

  const hints = varsayilanIpuclari({
    talimatSesi: islemTalimat,
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: siklar.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: ['sahne'],
    k3Gorsel: { type: 'onlukCerceve', gruplar: sonuc >= 10 ? [10, sonuc - 10] : [sonuc] },
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(ISLEM_HIKAYE_TEMPLATE_ID, seed, `d${difficulty}|${senaryo.islem}|${a}|${b}|${sonuc}`),
    templateId: ISLEM_HIKAYE_TEMPLATE_ID,
    skillIds: ['mat.cebir.islem-hikayesi'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.2.1'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 20,
    prompt, hints, assets,
    options: siklar,
    validation: { mod: 'tekSecim', dogruOptionId: `sik-d-${sonuc}` },
    seed,
  };
}

export const islemHikayeGenerator: ExerciseGenerator<IslemHikayeParams> = {
  templateId: ISLEM_HIKAYE_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.2.1'],
  karsilananSkillIds: ['mat.cebir.islem-hikayesi'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ISLEM_YONU, HATA_ETIKETLERI.GOREV_ANLASILMADI, HATA_ETIKETLERI.TEK_KUMEYI_ALMA],
  uret: islemHikayeUret,
};
