/**
 * M-SIPSAK — ŞIPŞAK SAYILAMA (SUBITIZING)
 * ====================================================================
 *
 * KAZANIM: MAT.1.1.2, MAT.1.1.7 — Düzenli küme ≤1 sn gösterilir,
 * saymadan tanınır.
 *
 * Çocuk kısa süre gösterilen düzenli kümenin sayısını seçer.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER:
 *   · mat.sayma.sipsak-sayilama — subitizing 1-10
 *
 * MÜFREDAT SINIRI: 1-10 arası, düzenli layout (onlukCerceve veya sira).
 *
 * ÇELDİRİCİ ETİKETLERİ:
 *   · EKSIK_SAYMA — eksik saydı
 *   · FAZLA_SAYMA — fazla saydı
 *
 * ETKİLEŞİM: AUDIO_TO_IMAGE — "Hızlıca kaç tane gördün?" sesli talimatı,
 * rakam şıkkı seç.
 *
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId } from '../types';
import type { AudioToImageExercise, ExerciseGenerator, Option, VisualSpec, AssetSpec, Prompt } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import type { NesneSprite } from '../types';

export const SIPSAK_TEMPLATE_ID = 'M-SIPSAK' as const;

const SIPSAK_ARALIK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const SPRITES: readonly NesneSprite[] = ['elma', 'top', 'balon', 'kus', 'cicek', 'yildiz', 'kelebek', 'balik'];


export interface SipsakParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly tercihEdilenSprite?: NesneSprite;
  readonly mod?: 'tahta' | 'kisisel';
}

export function sipsakUret(params: SipsakParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const sayiRng = rng.fork('sayi');
  // Difficulty arttıkça büyük sayılar daha olası
  const maxIndex = Math.min(4 + difficulty, 9);
  const hedef = sayiRng.pick(SIPSAK_ARALIK.slice(0, maxIndex + 1));

  const spriteRng = rng.fork('sprite');
  const sprite = spriteRng.pick(SPRITES);

  // Layout: difficulty ≤2 → sira, >2 → onlukCerceve (5+ için)
  const layout: 'sira' | 'onlukCerceve' = hedef <= 5 || difficulty <= 2 ? 'sira' : 'onlukCerceve';

  // Şık sayısı
  const secenekSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış seçenekler — ±1 en tanılayıcı
  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: number[] = [];
  const kullanilan = new Set<number>([hedef]);

  const yakinlar = [hedef - 1, hedef + 1, hedef - 2, hedef + 2].filter(
    (n) => n >= 1 && n <= 10 && !kullanilan.has(n),
  );
  if (yakinlar.length > 0) {
    const y = celdiriciRng.pick(yakinlar);
    yanlislar.push(y);
    kullanilan.add(y);
  }

  while (yanlislar.length < secenekSayisi - 1) {
    const kalan = SIPSAK_ARALIK.filter((n) => !kullanilan.has(n));
    if (kalan.length === 0) break;
    const y = celdiriciRng.pick(kalan);
    yanlislar.push(y);
    kullanilan.add(y);
  }

  const siraRng = rng.fork('sira');
  const tumSecenekler = [
    { dogru: true, sayi: hedef },
    ...yanlislar.map((s) => ({ dogru: false, sayi: s })),
  ];
  const karistirilmis = siraRng.shuffle(tumSecenekler);

  const options: Option[] = karistirilmis.map((sec, i) => {
    const id = `secenek-${i}`;
    const gorsel: VisualSpec = { type: 'rakam', sayi: sec.sayi };
    const etiket: HataEtiketi = sec.sayi < hedef
      ? HATA_ETIKETLERI.EKSIK_SAYMA
      : HATA_ETIKETLERI.FAZLA_SAYMA;
    return sec.dogru
      ? { id, deger: { tur: 'gorsel', gorsel }, correct: true }
      : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: etiket };
  });

  const dogruOptionId = options.find((o) => 'correct' in o && o.correct)?.id ?? options[0].id;

  // Sahne — nesne kümesi
  const sahneGorsel: VisualSpec = {
    type: 'nesneKumesi',
    sprite,
    adet: hedef,
    layout,
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-sipsak.kac-tane-hizli' },
    gorsel: sahneGorsel,
  };

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-sipsak.kac-tane-hizli' },
    k2Ses: { kind: 'key', key: 'yardim.k2-birlikte-sayalim' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [dogruOptionId],
  });

  const assets: readonly AssetSpec[] = [
    { id: 'sahne', rol: 'sahne' as const, gorsel: sahneGorsel, erisimBolgesi: 'serbest' as const },
    ...options.map((o) => ({
      id: o.id,
      rol: 'secenek' as const,
      gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
      erisimBolgesi: 'alt65' as const,
    })),
  ];

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(SIPSAK_TEMPLATE_ID, seed, `${hedef}|${sprite}`),
    templateId: SIPSAK_TEMPLATE_ID,
    skillIds: ['mat.sayma.sipsak-sayilama'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.7', 'MAT.1.1.2'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 8,
    prompt,
    hints,
    assets,
    options,
    validation: { mod: 'tekSecim', dogruOptionId },
    seed,
  };
}

export const sipsakGenerator: ExerciseGenerator<SipsakParams> = {
  templateId: SIPSAK_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.7', 'MAT.1.1.2'],
  karsilananSkillIds: ['mat.sayma.sipsak-sayilama'],
  readingLoad: 0,
  zorlukAraligi: [1, 4],
  uretebildigiHatalar: [HATA_ETIKETLERI.EKSIK_SAYMA, HATA_ETIKETLERI.FAZLA_SAYMA],
  uret: sipsakUret,
};
