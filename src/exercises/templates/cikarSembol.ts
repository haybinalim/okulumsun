/**
 * M-CIKAR-SEMBOL — SEMBOLİK ÇIKARMA
 * ====================================================================
 * KAZANIM: MAT.1.2.1 — `9 − 4 = ?` sembolik; fark bulma dahil.
 * ÇELDİRİCİ: ISLEM_YONU, TEK_KUMEYI_ALMA, BUYUKLUK_MIKTAR, ONLUK_BOZMA
 * ETKİLEŞİM: AUDIO_TO_IMAGE. SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type VisualSpec, type AssetSpec, type Prompt } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';
import { sayisalCeldiricilerKesin, celdiricileriSikaCevir } from '../distractors';
import { sayExpression } from '../../audio/speech';
import { ISLEM_ARALIGI } from '../types';

export const CIKAR_SEMBOL_TEMPLATE_ID = 'M-CIKAR-SEMBOL' as const;

export interface CikarSembolParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function cikarSembolUret(params: CikarSembolParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const sayiRng = rng.fork('sayilar');
  const minA = Math.min(5 + difficulty * 2, 18);
  const a = sayiRng.int(minA, Math.min(10 + difficulty * 3, 20));
  const b = sayiRng.int(1, Math.min(a - 1, 10));
  const sonuc = a - b;

  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  const celdiriciRng = rng.fork('celdirici');
  const celdiriciler = sayisalCeldiricilerKesin(
    sonuc,
    [HATA_ETIKETLERI.ISLEM_YONU, HATA_ETIKETLERI.TEK_KUMEYI_ALMA, HATA_ETIKETLERI.ONLUK_BOZMA],
    { min: 0, max: ISLEM_ARALIGI.max },
    sikSayisi - 1,
    celdiriciRng,
    { baglam: { a, b, islem: '-' }, yedekStrateji: 'yakinKomsu' },
  );
  const siklar = celdiricileriSikaCevir(sonuc, celdiriciler, celdiriciRng);

  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: [
      { gorsel: { type: 'rakam', sayi: a }, konum: { x: 0.25, y: 0.5 } },
      { gorsel: { type: 'rakam', sayi: b }, konum: { x: 0.75, y: 0.5 } },
    ],
  };

  const talimat = sayExpression(a, '-', b);

  const prompt: Prompt = { ses: talimat, gorsel: sahneGorsel };

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

  // Skill: difficulty ≤3 → fark-bulma, ≥4 → onluk-bozmadan
  const skillId: SkillId = difficulty <= 3 ? 'mat.cikarma.fark-bulma' : 'mat.cikarma.onluk-bozmadan-20';

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(CIKAR_SEMBOL_TEMPLATE_ID, seed, `d${difficulty}|${a}-${b}=${sonuc}|${sikSayisi}`),
    templateId: CIKAR_SEMBOL_TEMPLATE_ID,
    skillIds: [skillId] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.2.1'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 15,
    prompt, hints, assets,
    options: siklar,
    validation: { mod: 'tekSecim', dogruOptionId: `sik-d-${sonuc}` },
    seed,
  };
}

export const cikarSembolGenerator: ExerciseGenerator<CikarSembolParams> = {
  templateId: CIKAR_SEMBOL_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.2.1'],
  karsilananSkillIds: ['mat.cikarma.fark-bulma', 'mat.cikarma.onluk-bozmadan-20'],
  readingLoad: 0,
  zorlukAraligi: [3, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ISLEM_YONU, HATA_ETIKETLERI.TEK_KUMEYI_ALMA, HATA_ETIKETLERI.BUYUKLUK_MIKTAR, HATA_ETIKETLERI.ONLUK_BOZMA],
  uret: cikarSembolUret,
};
