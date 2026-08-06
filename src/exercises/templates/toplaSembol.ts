/**
 * M-TOPLA-SEMBOL — SEMBOLİK TOPLAMA (sonuç ≤20)
 * ====================================================================
 *
 * KAZANIM: MAT.1.2.1, MAT.1.2.2 — Sembolik toplama, görsel destek şıklarda.
 *
 * `7 + 5 = ?` biçiminde sembolik işlem. Sonuç ≤20. Görsel destek şıklarda
 * (onluk çerçeve veya nesne kümesi) bulunur.
 *
 * M-TOPLA-GORSEL'den farkı: işlem GÖRSEL DEĞİL SEMBOLİK sunulur.
 * Çocuk rakamları görür ve işareti tanır.
 *
 * ÇELDİRİCİ ETİKETLERİ: ONLUK_BOZMA, FAZLA_SAYMA, EKSIK_SAYMA
 * ETKİLEŞİM: AUDIO_TO_IMAGE — sesli işlem + rakam şıkları.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type VisualSpec, type AssetSpec, type Prompt } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';
import { sayisalCeldiricilerKesin, celdiricileriSikaCevir } from '../distractors';
import { sayExpression } from '../../audio/speech';
import { ISLEM_ARALIGI } from '../types';

export const TOPLA_SEMBOL_TEMPLATE_ID = 'M-TOPLA-SEMBOL' as const;

export interface ToplaSembolParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function toplaSembolUret(params: ToplaSembolParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  // Sayıları üret — sonuç ≤20
  const sayiRng = rng.fork('sayilar');
  // Difficulty arttıkça büyük sayılar
  const minA = Math.min(difficulty, 5);
  const a = sayiRng.int(minA, Math.min(10 + difficulty, 15));
  const maxB = ISLEM_ARALIGI.max - a;
  const b = sayiRng.int(1, Math.min(maxB, 10));
  const sonuc = a + b;

  // Şık sayısı
  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Çeldiriciler
  const celdiriciRng = rng.fork('celdirici');
  const celdiriciler = sayisalCeldiricilerKesin(
    sonuc,
    [HATA_ETIKETLERI.ONLUK_BOZMA, HATA_ETIKETLERI.FAZLA_SAYMA, HATA_ETIKETLERI.EKSIK_SAYMA],
    { min: 0, max: ISLEM_ARALIGI.max },
    sikSayisi - 1,
    celdiriciRng,
    { baglam: { a, b, islem: '+' }, yedekStrateji: 'yakinKomsu' },
  );

  const siklar = celdiricileriSikaCevir(sonuc, celdiriciler, celdiriciRng);

  // Görsel — sembolik işlem (rakam + işaret)
  // Sahne olarak rakam dizisi: a + b = ?
  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: [
      { gorsel: { type: 'rakam', sayi: a }, konum: { x: 0.25, y: 0.5 } },
      { gorsel: { type: 'rakam', sayi: b }, konum: { x: 0.75, y: 0.5 } },
    ],
  };

  const talimat = sayExpression(a, '+', b);

  const prompt: Prompt = {
    ses: talimat,
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
    talimatSesi: talimat,
    k2Ses: { kind: 'key', key: 'yardim.ustune-sayma' },
    eleOptionIds: siklar.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: ['sahne'],
    k3Gorsel: { type: 'onlukCerceve', gruplar: sonuc >= 10 ? [10, sonuc - 10] : [sonuc] },
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(TOPLA_SEMBOL_TEMPLATE_ID, seed, `d${difficulty}|${a}+${b}=${sonuc}|${sikSayisi}`),
    templateId: TOPLA_SEMBOL_TEMPLATE_ID,
    skillIds: ['mat.toplama.onu-gecen-20'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.2.1', 'MAT.1.2.2'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 15,
    prompt,
    hints,
    assets,
    options: siklar,
    validation: { mod: 'tekSecim', dogruOptionId: `sik-d-${sonuc}` },
    seed,
  };
}

export const toplaSembolGenerator: ExerciseGenerator<ToplaSembolParams> = {
  templateId: TOPLA_SEMBOL_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.2.1', 'MAT.1.2.2'],
  karsilananSkillIds: ['mat.toplama.onu-gecen-20'],
  readingLoad: 0,
  zorlukAraligi: [3, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ONLUK_BOZMA, HATA_ETIKETLERI.FAZLA_SAYMA, HATA_ETIKETLERI.EKSIK_SAYMA],
  uret: toplaSembolUret,
};
