/**
 * M-GEO-KENAR-KOSE — KENAR/KÖŞE SAYISIYLA ŞEKİL TANIMLAMA
 * ====================================================================
 * KAZANIM: MAT.1.3.4 — Kenar/köşe sayısıyla şekli tanımla.
 * ÇELDİRİCİ: FAZLA_SAYMA, EKSIK_SAYMA, SEKIL_PROTOTIP
 * ETKİLEŞİM: AUDIO_TO_IMAGE — "Kaç kenarı var?" sorusu, rakam şıkkı seç.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Option, type VisualSpec, type AssetSpec, type Prompt, type SekilAdi, type Renk } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const GEO_KENAR_KOSE_TEMPLATE_ID = 'M-GEO-KENAR-KOSE' as const;

const SEKILLER: readonly SekilAdi[] = ['ucgen', 'kare', 'dikdortgen', 'cember'];
const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

const SEKIL_KENAR_SAYISI: Record<SekilAdi, number> = {
  ucgen: 3,
  kare: 4,
  dikdortgen: 4,
  cember: 0,
};

const SEKIL_KOSE_SAYISI: Record<SekilAdi, number> = {
  ucgen: 3,
  kare: 4,
  dikdortgen: 4,
  cember: 0,
};

export interface GeoKenarKoseParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function geoKenarKoseUret(params: GeoKenarKoseParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('geo');
  const sekil = r.pick(SEKILLER);
  const renk = r.pick(RENKLER);

  // Kenar mı köşe mi?
  const soruKenarMi = r.bool();
  const dogruSayi = soruKenarMi ? SEKIL_KENAR_SAYISI[sekil] : SEKIL_KOSE_SAYISI[sekil];

  // Şık sayısı
  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış seçenekler — ±1 en tanılayıcı
  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: number[] = [];
  const kullanilan = new Set<number>([dogruSayi]);

  for (const d of [1, -1, 2, -2]) {
    if (yanlislar.length >= sikSayisi - 1) break;
    const y = dogruSayi + d;
    if (y >= 0 && y <= 8 && !kullanilan.has(y)) {
      yanlislar.push(y);
      kullanilan.add(y);
    }
  }
  while (yanlislar.length < sikSayisi - 1) {
    let y: number;
    do { y = celdiriciRng.int(0, 8); } while (kullanilan.has(y));
    yanlislar.push(y);
    kullanilan.add(y);
  }

  const siraRng = rng.fork('sira');
  const tumSecenekler = [
    { dogru: true, sayi: dogruSayi },
    ...yanlislar.map((s) => ({ dogru: false, sayi: s })),
  ];
  const karistirilmis = siraRng.shuffle(tumSecenekler);

  const options: Option[] = karistirilmis.map((sec, i) => {
    const id = `secenek-${i}`;
    const gorsel: VisualSpec = { type: 'rakam', sayi: sec.sayi };
    const etiket: HataEtiketi = sec.sayi < dogruSayi
      ? HATA_ETIKETLERI.EKSIK_SAYMA
      : HATA_ETIKETLERI.FAZLA_SAYMA;
    return sec.dogru
      ? { id, deger: { tur: 'gorsel', gorsel }, correct: true }
      : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: etiket };
  });

  const dogruOptionId = options.find((o) => 'correct' in o && o.correct)?.id ?? options[0].id;

  // Sahne — şekil göster
  const sahneGorsel: VisualSpec = { type: 'sekil', sekil, renk };

  const prompt: Prompt = {
    ses: { kind: 'key', key: soruKenarMi ? 'soru-geo.kac-kenar' : 'soru-geo.kac-kose' },
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
    talimatSesi: { kind: 'key', key: soruKenarMi ? 'soru-geo.kac-kenar' : 'soru-geo.kac-kose' },
    k2Ses: { kind: 'key', key: 'yardim.k2-birlikte-sayalim' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [dogruOptionId],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(GEO_KENAR_KOSE_TEMPLATE_ID, seed, `${sekil}|${soruKenarMi ? 'kenar' : 'kose'}|${dogruSayi}`),
    templateId: GEO_KENAR_KOSE_TEMPLATE_ID,
    skillIds: ['mat.geometri.kenar-kose'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.3.4'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 12,
    prompt, hints, assets, options,
    validation: { mod: 'tekSecim', dogruOptionId },
    seed,
  };
}

export const geoKenarKoseGenerator: ExerciseGenerator<GeoKenarKoseParams> = {
  templateId: GEO_KENAR_KOSE_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.3.4'],
  karsilananSkillIds: ['mat.geometri.kenar-kose'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.FAZLA_SAYMA, HATA_ETIKETLERI.EKSIK_SAYMA, HATA_ETIKETLERI.SEKIL_PROTOTIP],
  uret: geoKenarKoseUret,
};
