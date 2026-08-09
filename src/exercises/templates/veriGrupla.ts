/**
 * M-VERI-GRUPLA — NESNE GRUPLAMA
 * ====================================================================
 * KAZANIM: MAT.1.4.1 — Karışık nesneleri kategoriye göre grupla.
 * ÇELDİRİCİ: TEK_KUMEYI_ALMA, GOREV_ANLASILMADI
 * ETKİLEŞİM: TAP_TO_PLACE — nesneleri doğru kategori yuvasına yerleştir.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Yuva, type Option, type VisualSpec, type AssetSpec, type Prompt, type NesneSprite, type Renk } from '../types';
import type { TapToPlaceExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const VERI_GRUPLA_TEMPLATE_ID = 'M-VERI-GRUPLA' as const;

const NESNELER: readonly NesneSprite[] = ['elma', 'top', 'balon', 'kus', 'cicek', 'yildiz', 'balik', 'kelebek'];
const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

export interface VeriGruplaParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function veriGruplaUret(params: VeriGruplaParams, rng: Rng): TapToPlaceExercise {
  const { seed, difficulty } = params;

  // Kategori sayısı: 2-3
  const kategoriSayisi = Math.min(1 + difficulty, 3);

  // Kategorileri seç (nesne türleri)
  const secimRng = rng.fork('secim');
  const kategoriler = secimRng.shuffle([...NESNELER]).slice(0, kategoriSayisi);

  // Her kategori için nesne sayısı
  const renkRng = rng.fork('renk');
  const yerRng = rng.fork('yer');

  // Yuvalar — her kategori için bir yuva
  const yuvalar: Yuva[] = kategoriler.map((_, i) => ({
    id: `yuva-${i}`,
    konum: { x: 0.2 + i * (0.6 / Math.max(kategoriSayisi - 1, 1)), y: 0.3 },
    bekleyen: 'gorsel' as const,
  }));

  // Options — her kategoriden 1 doğru kart
  const options: Option[] = [];
  const dogruEslesme: Record<string, string> = {};

  for (let i = 0; i < kategoriSayisi; i++) {
    const nesne = kategoriler[i];
    const renk = renkRng.pick(RENKLER);

    const id = `nesne-${i}`;
    const gorsel: VisualSpec = { type: 'nesneKumesi', sprite: nesne, adet: 1, layout: 'sira', renk };
    options.push({
      id,
      deger: { tur: 'gorsel', gorsel },
      correct: true,
    });
    dogruEslesme[`yuva-${i}`] = id;
  }

  // Yanlış kart ekle (difficulty ≥ 2)
  if (difficulty >= 2) {
    const kullanilanKategoriler = new Set(kategoriler);
    const yanlisNesneler = NESNELER.filter((n) => !kullanilanKategoriler.has(n));
    if (yanlisNesneler.length > 0) {
      const yanlisNesne = yerRng.pick(yanlisNesneler);
      const renk = renkRng.pick(RENKLER);
      options.push({
        id: 'yanlis-0',
        deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: yanlisNesne, adet: 1, layout: 'sira', renk } },
        correct: false,
        diagnosticTag: HATA_ETIKETLERI.GOREV_ANLASILMADI as HataEtiketi,
      });
    }
  }

  // Karıştır
  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle([...options]);
  options.splice(0, options.length, ...karistirilmis);

  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: kategoriler.map((kategori, i) => ({
      gorsel: { type: 'nesneKumesi', sprite: kategori, adet: 1, layout: 'sira', renk: renkRng.pick(RENKLER) } as VisualSpec,
      konum: { x: 0.2 + i * (0.6 / Math.max(kategoriSayisi - 1, 1)), y: 0.3 },
    })),
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-veri.grupla' },
    gorsel: sahneGorsel,
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-veri.grupla' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: Object.values(dogruEslesme),
  });

  return {
    kind: 'TAP_TO_PLACE',
    itemId: makeItemId(VERI_GRUPLA_TEMPLATE_ID, seed, kategoriler.join('|')),
    templateId: VERI_GRUPLA_TEMPLATE_ID,
    skillIds: ['mat.veri.gruplama'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.4.1'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 20,
    prompt, hints, assets, options, yuvalar,
    validation: { mod: 'yerlesim', dogruEslesme, siraOnemli: false },
    seed,
  };
}

export const veriGruplaGenerator: ExerciseGenerator<VeriGruplaParams> = {
  templateId: VERI_GRUPLA_TEMPLATE_ID,
  kind: 'TAP_TO_PLACE',
  karsilananKazanimlar: ['MAT.1.4.1'],
  karsilananSkillIds: ['mat.veri.gruplama'],
  readingLoad: 0,
  zorlukAraligi: [1, 4],
  uretebildigiHatalar: [HATA_ETIKETLERI.TEK_KUMEYI_ALMA, HATA_ETIKETLERI.GOREV_ANLASILMADI],
  uret: veriGruplaUret,
};
