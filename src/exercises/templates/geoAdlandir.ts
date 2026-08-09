/**
 * M-GEO-ADLANDIR — ŞEKİL ADLANDIRMA
 * ====================================================================
 * KAZANIM: MAT.1.3.5 — Üçgen/kare/dikdörtgen/çember adlandır.
 * "Daire" değil "çember" (MEB 2024 programı).
 * ÇELDİRİCİ: SEKIL_PROTOTIP
 * ETKİLEŞİM: AUDIO_TO_IMAGE — sesli şekil adını dinle, şekli seç.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Option, type VisualSpec, type AssetSpec, type Prompt, type SekilAdi, type Renk } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';
import type { SpeechKey } from '../../audio/audioManifest.generated';

export const GEO_ADLANDIR_TEMPLATE_ID = 'M-GEO-ADLANDIR' as const;

const SEKILLER: readonly SekilAdi[] = ['ucgen', 'kare', 'dikdortgen', 'cember'];
const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

const SEKIL_SPEECH_KEY: Record<SekilAdi, SpeechKey> = {
  ucgen: 'sekil.ucgen',
  kare: 'sekil.kare',
  dikdortgen: 'sekil.dikdortgen',
  cember: 'sekil.cember',
};

export interface GeoAdlandirParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function geoAdlandirUret(params: GeoAdlandirParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('geo');
  const hedefSekil = r.pick(SEKILLER);

  // Difficulty ≥4: döndürülmüş şekil (prototip hatasını ölç)
  const dondurulmus = difficulty >= 4;

  // Şık sayısı
  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış seçenekler
  const celdiriciRng = rng.fork('celdirici');
  const yanlisSekiller = celdiriciRng.shuffle([...SEKILLER.filter((s) => s !== hedefSekil)]).slice(0, sikSayisi - 1);

  // Renkler
  const renkler = r.shuffle([...RENKLER]).slice(0, sikSayisi);

  const tumSecenekler = [
    { dogru: true, sekil: hedefSekil },
    ...yanlisSekiller.map((s) => ({ dogru: false, sekil: s })),
  ];

  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle(tumSecenekler);

  const options: Option[] = karistirilmis.map((sec, i) => {
    const id = `secenek-${i}`;
    const gorsel: VisualSpec = {
      type: 'sekil',
      sekil: sec.sekil,
      renk: renkler[i],
      ...(dondurulmus ? { dondur: true } : {}),
    };
    return sec.dogru
      ? { id, deger: { tur: 'gorsel', gorsel }, correct: true }
      : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: HATA_ETIKETLERI.SEKIL_PROTOTIP };
  });

  const dogruOptionId = options.find((o) => 'correct' in o && o.correct)?.id ?? options[0].id;

  const prompt: Prompt = {
    ses: { kind: 'key', key: SEKIL_SPEECH_KEY[hedefSekil] },
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: SEKIL_SPEECH_KEY[hedefSekil] },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [dogruOptionId],
  });

  // Skill: difficulty ≤3 → sekil-adlandirma, ≥4 → dondurulmus-sekil
  const skillId: SkillId = difficulty <= 3 ? 'mat.geometri.sekil-adlandirma' : 'mat.geometri.dondurulmus-sekil';

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(GEO_ADLANDIR_TEMPLATE_ID, seed, `${hedefSekil}|d${difficulty}${dondurulmus ? '|don' : ''}`),
    templateId: GEO_ADLANDIR_TEMPLATE_ID,
    skillIds: [skillId] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.3.5'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 10,
    prompt, hints, assets, options,
    validation: { mod: 'tekSecim', dogruOptionId },
    seed,
  };
}

export const geoAdlandirGenerator: ExerciseGenerator<GeoAdlandirParams> = {
  templateId: GEO_ADLANDIR_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.3.5'],
  karsilananSkillIds: ['mat.geometri.sekil-adlandirma', 'mat.geometri.dondurulmus-sekil'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.SEKIL_PROTOTIP],
  uret: geoAdlandirUret,
};
