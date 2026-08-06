/**
 * M-OLC-UZUNLUK — UZUNLUK KIYASI
 * ====================================================================
 * KAZANIM: MAT.1.1.8 — İki nesnenin boyunu kıyasla (uzun/kısa).
 * ÇELDİRİCİ: BUYUKLUK_MIKTAR, GOREV_ANLASILMADI
 * ETKİLEŞİM: AUDIO_TO_IMAGE. SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Option, type VisualSpec, type AssetSpec, type Prompt, type Renk } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';

export const OLC_UZUNLUK_TEMPLATE_ID = 'M-OLC-UZUNLUK' as const;

const RENKLER: readonly Renk[] = ['mavi', 'yesil', 'turuncu', 'pembe', 'mor', 'sari'];

export interface OlcUzunlukParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function olcUzunlukUret(params: OlcUzunlukParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('olc');
  // İki nesne: biri uzun, biri kısa
  const renkler = r.shuffle([...RENKLER]).slice(0, 2);
  const uzunIndex = r.pick([0, 1] as const);
  const kisaIndex = uzunIndex === 0 ? 1 : 0;

  // Difficulty arttıkça fark küçülür
  const fark = Math.max(1, 4 - Math.floor(difficulty / 2));
  const kisaBoy = r.int(1, 3);
  const uzunBoy = kisaBoy + fark;

  // Şık: uzun mu kısa mı?
  const soruUzunMu = r.bool();

  const options: Option[] = soruUzunMu
    ? [
        { id: 'secenek-0', deger: { tur: 'gorsel', gorsel: { type: 'sekil', sekil: 'dikdortgen', renk: renkler[uzunIndex] } }, correct: true },
        { id: 'secenek-1', deger: { tur: 'gorsel', gorsel: { type: 'sekil', sekil: 'dikdortgen', renk: renkler[kisaIndex] } }, correct: false, diagnosticTag: HATA_ETIKETLERI.BUYUKLUK_MIKTAR },
      ]
    : [
        { id: 'secenek-0', deger: { tur: 'gorsel', gorsel: { type: 'sekil', sekil: 'dikdortgen', renk: renkler[uzunIndex] } }, correct: false, diagnosticTag: HATA_ETIKETLERI.BUYUKLUK_MIKTAR },
        { id: 'secenek-1', deger: { tur: 'gorsel', gorsel: { type: 'sekil', sekil: 'dikdortgen', renk: renkler[kisaIndex] } }, correct: true },
      ];

  const dogruOptionId = soruUzunMu ? 'secenek-0' : 'secenek-1';

  // Sahne: iki dikdörtgen yan yana (uzunluk farkı)
  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: [
      { gorsel: { type: 'sekil', sekil: 'dikdortgen', renk: renkler[0] }, konum: { x: 0.3, y: 0.5 } },
      { gorsel: { type: 'sekil', sekil: 'dikdortgen', renk: renkler[1] }, konum: { x: 0.7, y: 0.5 } },
    ],
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: soruUzunMu ? 'soru-olcme.hangisi-uzun' : 'soru-olcme.hangisi-kisa' },
    gorsel: sahneGorsel,
  };

  const assets: readonly AssetSpec[] = [
    { id: 'sahne', rol: 'sahne', gorsel: sahneGorsel, erisimBolgesi: 'serbest' },
    ...options.map((o) => ({
      id: o.id,
      rol: 'secenek' as const,
      gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
      erisimBolgesi: 'alt65' as const,
    })),
  ];

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: soruUzunMu ? 'soru-olcme.hangisi-uzun' : 'soru-olcme.hangisi-kisa' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: [dogruOptionId],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(OLC_UZUNLUK_TEMPLATE_ID, seed, `${uzunBoy}|${kisaBoy}|${soruUzunMu ? 'u' : 'k'}`),
    templateId: OLC_UZUNLUK_TEMPLATE_ID,
    skillIds: ['mat.olcme.uzunluk-kiyas'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.8'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 10,
    prompt, hints, assets, options,
    validation: { mod: 'tekSecim', dogruOptionId },
    seed,
  };
}

export const olcUzunlukGenerator: ExerciseGenerator<OlcUzunlukParams> = {
  templateId: OLC_UZUNLUK_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.8'],
  karsilananSkillIds: ['mat.olcme.uzunluk-kiyas'],
  readingLoad: 0,
  zorlukAraligi: [1, 3],
  uretebildigiHatalar: [HATA_ETIKETLERI.BUYUKLUK_MIKTAR, HATA_ETIKETLERI.GOREV_ANLASILMADI],
  uret: olcUzunlukUret,
};
