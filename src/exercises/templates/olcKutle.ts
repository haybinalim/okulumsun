/**
 * M-OLC-KUTLE — KÜTLE KIYASI
 * ====================================================================
 * KAZANIM: MAT.1.1.8 — İki nesnenin kütlesini kıyasla (ağır/hafif).
 * ÇELDİRİCİ: BUYUKLUK_MIKTAR (büyük = ağır sanma)
 * ETKİLEŞİM: AUDIO_TO_IMAGE. SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Option, type VisualSpec, type AssetSpec, type Prompt, type NesneSprite, type Renk } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';

export const OLC_KUTLE_TEMPLATE_ID = 'M-OLC-KUTLE' as const;

// Ağır nesneler: büyük sprite'lar (daha fazla nesne = daha ağır)
const AGIR_SPRITES: readonly NesneSprite[] = ['araba', 'kalem', 'top'];
const HAFIF_SPRITES: readonly NesneSprite[] = ['kus', 'kelebek', 'cicek', 'balon'];
const RENKLER: readonly Renk[] = ['mavi', 'yesil', 'turuncu', 'pembe', 'mor', 'sari'];

export interface OlcKutleParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function olcKutleUret(params: OlcKutleParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('olc');
  const agirSprite = r.pick(AGIR_SPRITES);
  const hafifSprite = r.pick(HAFIF_SPRITES);
  const renkler = r.shuffle([...RENKLER]).slice(0, 2);

  // Ağırlık temsili: nesne adedi (daha fazla = daha ağır)
  const hafifAdet = r.int(1, 3);
  const fark = Math.max(1, 3 - Math.floor(difficulty / 2));
  const agirAdet = hafifAdet + fark;

  const soruAgirMi = r.bool();

  const options: Option[] = soruAgirMi
    ? [
        { id: 'secenek-0', deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: agirSprite, adet: agirAdet, layout: 'sira' } }, correct: true },
        { id: 'secenek-1', deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: hafifSprite, adet: hafifAdet, layout: 'sira' } }, correct: false, diagnosticTag: HATA_ETIKETLERI.BUYUKLUK_MIKTAR },
      ]
    : [
        { id: 'secenek-0', deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: agirSprite, adet: agirAdet, layout: 'sira' } }, correct: false, diagnosticTag: HATA_ETIKETLERI.BUYUKLUK_MIKTAR },
        { id: 'secenek-1', deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: hafifSprite, adet: hafifAdet, layout: 'sira' } }, correct: true },
      ];

  const dogruOptionId = soruAgirMi ? 'secenek-0' : 'secenek-1';

  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: [
      { gorsel: { type: 'nesneKumesi', sprite: agirSprite, adet: agirAdet, layout: 'sira', renk: renkler[0] }, konum: { x: 0.3, y: 0.5 } },
      { gorsel: { type: 'nesneKumesi', sprite: hafifSprite, adet: hafifAdet, layout: 'sira', renk: renkler[1] }, konum: { x: 0.7, y: 0.5 } },
    ],
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: soruAgirMi ? 'soru-olcme.hangisi-agir' : 'soru-olcme.hangisi-hafif' },
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
    talimatSesi: { kind: 'key', key: soruAgirMi ? 'soru-olcme.hangisi-agir' : 'soru-olcme.hangisi-hafif' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: [dogruOptionId],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(OLC_KUTLE_TEMPLATE_ID, seed, `${agirAdet}|${hafifAdet}|${soruAgirMi ? 'a' : 'h'}`),
    templateId: OLC_KUTLE_TEMPLATE_ID,
    skillIds: ['mat.olcme.kutle-kiyas'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.8'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 10,
    prompt, hints, assets, options,
    validation: { mod: 'tekSecim', dogruOptionId },
    seed,
  };
}

export const olcKutleGenerator: ExerciseGenerator<OlcKutleParams> = {
  templateId: OLC_KUTLE_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.8'],
  karsilananSkillIds: ['mat.olcme.kutle-kiyas'],
  readingLoad: 0,
  zorlukAraligi: [1, 3],
  uretebildigiHatalar: [HATA_ETIKETLERI.BUYUKLUK_MIKTAR],
  uret: olcKutleUret,
};
