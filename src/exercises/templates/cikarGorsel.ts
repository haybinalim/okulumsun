/**
 * M-CIKAR-GORSEL — GÖRSEL ÇIKARMA (ayırma/geriye sayma)
 * ====================================================================
 * KAZANIM: MAT.1.2.1 — Ayırma/geriye sayma modeliyle çıkarma.
 * ÇELDİRİCİ: ISLEM_YONU, TEK_KUMEYI_ALMA, FAZLA_SAYMA, EKSIK_SAYMA
 * ETKİLEŞİM: AUDIO_TO_IMAGE. SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type VisualSpec, type AssetSpec, type Prompt, type NesneSprite } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';
import { sayisalCeldiricilerKesin, celdiricileriSikaCevir } from '../distractors';
import { sayExpression } from '../../audio/speech';
import { ISLEM_ARALIGI, NESNE_SPRITELARI, RENKLER } from '../types';

export const CIKAR_GORSEL_TEMPLATE_ID = 'M-CIKAR-GORSEL' as const;

export interface CikarGorselParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly tercihEdilenSprite?: NesneSprite;
  readonly mod?: 'tahta' | 'kisisel';
}

export function cikarGorselUret(params: CikarGorselParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const sayiRng = rng.fork('sayilar');
  // Difficulty arttıkça büyük sayılar, sonuç pozitif
  const minA = Math.min(3 + difficulty * 2, 15);
  const a = sayiRng.int(minA, Math.min(10 + difficulty * 2, 18));
  const b = sayiRng.int(1, Math.min(a - 1, 8));
  const sonuc = a - b;

  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  const celdiriciRng = rng.fork('celdirici');
  const celdiriciler = sayisalCeldiricilerKesin(
    sonuc,
    [HATA_ETIKETLERI.ISLEM_YONU, HATA_ETIKETLERI.TEK_KUMEYI_ALMA, HATA_ETIKETLERI.FAZLA_SAYMA],
    { min: 0, max: ISLEM_ARALIGI.max },
    sikSayisi - 1,
    celdiriciRng,
    { baglam: { a, b, islem: '-' }, yedekStrateji: 'yakinKomsu' },
  );
  const siklar = celdiricileriSikaCevir(sonuc, celdiriciler, celdiriciRng);

  // Sahne — a nesne dizisinden b tanesi ayrılıyor
  const spriteRng = rng.fork('sprite');
  const sprite = params.tercihEdilenSprite ?? spriteRng.pick(NESNE_SPRITELARI);
  const renk = spriteRng.pick(RENKLER);

  const sahneGorsel: VisualSpec = {
    type: 'nesneKumesi',
    sprite,
    adet: a,
    layout: 'sira',
    renk,
  };

  const talimat = sayExpression(a, '-', b);

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
    k2Ses: { kind: 'key', key: 'yardim.k2-birlikte-sayalim' },
    eleOptionIds: siklar.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: ['sahne'],
    k3Gorsel: { type: 'onlukCerceve', gruplar: sonuc >= 10 ? [10, sonuc - 10] : [sonuc] },
  });

  // Skill seçimi: ayırma vs geriye sayma
  const skillId: SkillId = difficulty <= 2 ? 'mat.cikarma.ayirma' : 'mat.cikarma.geriye-sayarak';

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(CIKAR_GORSEL_TEMPLATE_ID, seed, `d${difficulty}|${a}-${b}=${sonuc}|${sikSayisi}`),
    templateId: CIKAR_GORSEL_TEMPLATE_ID,
    skillIds: [skillId] as readonly SkillId[],
    kazanimKodlari: difficulty <= 2 ? ['MAT.1.2.1'] as readonly KazanimKodu[] : ['MAT.1.2.1', 'MAT.1.2.2'] as readonly KazanimKodu[],
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

export const cikarGorselGenerator: ExerciseGenerator<CikarGorselParams> = {
  templateId: CIKAR_GORSEL_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.2.1', 'MAT.1.2.2'],
  karsilananSkillIds: ['mat.cikarma.ayirma', 'mat.cikarma.geriye-sayarak'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ISLEM_YONU, HATA_ETIKETLERI.TEK_KUMEYI_ALMA, HATA_ETIKETLERI.FAZLA_SAYMA, HATA_ETIKETLERI.EKSIK_SAYMA],
  uret: cikarGorselUret,
};
