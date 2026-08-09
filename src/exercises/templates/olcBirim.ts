/**
 * M-OLC-BIRIM — STANDART OLMAYAN BİRİMLE ÖLÇME
 * ====================================================================
 * KAZANIM: MAT.1.1.8 — Nesneyi birim bloklarla ölç: "3 blok uzunluğunda".
 * ÇELDİRİCİ: BIREBIR_ESLESME, FAZLA_SAYMA, EKSIK_SAYMA
 * ETKİLEŞİM: AUDIO_TO_IMAGE — "Kaç birim uzunluğunda?" sorusu.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Option, type VisualSpec, type AssetSpec, type Prompt, type Renk } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const OLC_BIRIM_TEMPLATE_ID = 'M-OLC-BIRIM' as const;

const RENKLER: readonly Renk[] = ['mavi', 'yesil', 'turuncu', 'pembe', 'mor', 'sari'];

export interface OlcBirimParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function olcBirimUret(params: OlcBirimParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('olc');
  // Nesne uzunluğu: birim sayısı
  const birimSayisi = Math.min(3 + difficulty, 10);
  const renk = r.pick(RENKLER);

  // Şık sayısı
  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış seçenekler
  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: number[] = [];
  const kullanilan = new Set<number>([birimSayisi]);

  for (const d of [1, -1, 2, -2]) {
    if (yanlislar.length >= sikSayisi - 1) break;
    const y = birimSayisi + d;
    if (y >= 1 && y <= 15 && !kullanilan.has(y)) {
      yanlislar.push(y);
      kullanilan.add(y);
    }
  }
  while (yanlislar.length < sikSayisi - 1) {
    let y: number;
    do { y = celdiriciRng.int(1, 15); } while (kullanilan.has(y));
    yanlislar.push(y);
    kullanilan.add(y);
  }

  const options: Option[] = [
    { id: `sik-d-${birimSayisi}`, deger: { tur: 'gorsel', gorsel: { type: 'rakam', sayi: birimSayisi } }, correct: true },
    ...yanlislar.map((y, i) => ({
      id: `sik-y-${i}`,
      deger: { tur: 'gorsel' as const, gorsel: { type: 'rakam' as const, sayi: y } },
      correct: false as const,
      diagnosticTag: (y < birimSayisi ? HATA_ETIKETLERI.EKSIK_SAYMA : HATA_ETIKETLERI.FAZLA_SAYMA) as HataEtiketi,
    })),
  ];

  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle([...options]);
  options.splice(0, options.length, ...karistirilmis);

  // Sahne: birim bloklar dizisi + ölçülen nesne
  const bloklar: VisualSpec[] = Array.from({ length: birimSayisi }, () => ({
    type: 'sekil', sekil: 'kare', renk,
  }));

  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: bloklar.map((b, i) => ({
      gorsel: b,
      konum: { x: 0.1 + i * (0.8 / birimSayisi), y: 0.5 },
    })),
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-olcme.kac-birim' },
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
    talimatSesi: { kind: 'key', key: 'soru-olcme.kac-birim' },
    k2Ses: { kind: 'key', key: 'yardim.k2-birlikte-sayalim' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [`sik-d-${birimSayisi}`],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(OLC_BIRIM_TEMPLATE_ID, seed, String(birimSayisi)),
    templateId: OLC_BIRIM_TEMPLATE_ID,
    skillIds: ['mat.olcme.birimle-olcme'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.8'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 12,
    prompt, hints, assets, options,
    validation: { mod: 'tekSecim', dogruOptionId: `sik-d-${birimSayisi}` },
    seed,
  };
}

export const olcBirimGenerator: ExerciseGenerator<OlcBirimParams> = {
  templateId: OLC_BIRIM_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.8'],
  karsilananSkillIds: ['mat.olcme.birimle-olcme'],
  readingLoad: 0,
  zorlukAraligi: [1, 4],
  uretebildigiHatalar: [HATA_ETIKETLERI.BIREBIR_ESLESME, HATA_ETIKETLERI.FAZLA_SAYMA, HATA_ETIKETLERI.EKSIK_SAYMA],
  uret: olcBirimUret,
};
