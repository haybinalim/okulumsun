/**
 * M-VERI-SIKLIK — SIKLIK TABLOSU DOLDURMA
 * ====================================================================
 * KAZANIM: MAT.1.4.1 — Çeteleden sıklık tablosu doldur.
 * ÇELDİRİCİ: KARDINALITE, TEK_KUMEYI_ALMA
 * ETKİLEŞİM: TAP_TO_PLACE — doğru sayıyı tablodaki yuvaya yerleştir.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Yuva, type Option, type VisualSpec, type AssetSpec, type Prompt, type NesneSprite, type Renk } from '../types';
import type { TapToPlaceExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const VERI_SIKLIK_TEMPLATE_ID = 'M-VERI-SIKLIK' as const;

const NESNELER: readonly NesneSprite[] = ['elma', 'top', 'balon', 'kus', 'cicek', 'yildiz', 'balik', 'kelebek'];
const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

export interface VeriSiklikParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function veriSiklikUret(params: VeriSiklikParams, rng: Rng): TapToPlaceExercise {
  const { seed, difficulty } = params;

  // Kategori sayısı: 2-3
  const kategoriSayisi = Math.min(1 + difficulty, 3);

  // Kategorileri seç
  const secimRng = rng.fork('secim');
  const kategoriler = secimRng.shuffle([...NESNELER]).slice(0, kategoriSayisi);

  // Her kategori için sayım
  const sayimRng = rng.fork('sayim');
  const sayilar = kategoriler.map(() => sayimRng.int(1, Math.min(5 + difficulty, 10)));

  // Yuvalar — her kategori için bir sayı yuvası
  const yuvalar: Yuva[] = kategoriler.map((_, i) => ({
    id: `yuva-${i}`,
    konum: { x: 0.2 + i * (0.6 / Math.max(kategoriSayisi - 1, 1)), y: 0.3 },
    bekleyen: 'gorsel' as const,
  }));

  // Doğru kartlar — her yuva için doğru sayı
  const options: Option[] = [];
  const dogruEslesme: Record<string, string> = {};
  const kullanilanSayilar = new Set<number>();

  for (let i = 0; i < kategoriSayisi; i++) {
    const id = `kart-${i}`;
    const sayi = sayilar[i];
    kullanilanSayilar.add(sayi);
    options.push({
      id,
      deger: { tur: 'gorsel', gorsel: { type: 'rakam', sayi } },
      correct: true,
    });
    dogruEslesme[`yuva-${i}`] = id;
  }

  // Yanlış kartlar — ±1 hatalı sayılar
  const celdiriciRng = rng.fork('celdirici');
  const yanlisKartSayisi = Math.min(kategoriSayisi, 2);

  for (let i = 0; i < yanlisKartSayisi; i++) {
    let yanlisSayi: number;
    const deneme = sayilar[i % kategoriSayisi] + (celdiriciRng.bool() ? 1 : -1);
    yanlisSayi = deneme >= 0 && deneme <= 15 && !kullanilanSayilar.has(deneme) ? deneme : sayilar[i % kategoriSayisi] + 2;

    if (kullanilanSayilar.has(yanlisSayi)) {
      // Farklı bir sayı bul
      do { yanlisSayi = celdiriciRng.int(0, 15); } while (kullanilanSayilar.has(yanlisSayi));
    }
    kullanilanSayilar.add(yanlisSayi);

    options.push({
      id: `yanlis-${i}`,
      deger: { tur: 'gorsel', gorsel: { type: 'rakam', sayi: yanlisSayi } },
      correct: false,
      diagnosticTag: HATA_ETIKETLERI.KARDINALITE as HataEtiketi,
    });
  }

  // Karıştır
  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle([...options]);
  options.splice(0, options.length, ...karistirilmis);

  // Sahne — çetele görünümü (nesneler + sayılmış)
  const renkRng = rng.fork('renk');
  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: kategoriler.map((kategori, i) => ({
      gorsel: { type: 'nesneKumesi', sprite: kategori, adet: sayilar[i], layout: 'sira', renk: renkRng.pick(RENKLER) } as VisualSpec,
      konum: { x: 0.2 + i * (0.6 / Math.max(kategoriSayisi - 1, 1)), y: 0.7 },
    })),
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-veri.tablo-doldur' },
    gorsel: sahneGorsel,
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-veri.tablo-doldur' },
    k2Ses: { kind: 'key', key: 'yardim.k2-birlikte-sayalim' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: Object.values(dogruEslesme),
  });

  return {
    kind: 'TAP_TO_PLACE',
    itemId: makeItemId(VERI_SIKLIK_TEMPLATE_ID, seed, kategoriler.map((k, i) => `${k}:${sayilar[i]}`).join('|')),
    templateId: VERI_SIKLIK_TEMPLATE_ID,
    skillIds: ['mat.veri.siklik-tablosu'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.4.1'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 20,
    prompt, hints, assets, options, yuvalar,
    validation: { mod: 'yerlesim', dogruEslesme, siraOnemli: false },
    seed,
  };
}

export const veriSiklikGenerator: ExerciseGenerator<VeriSiklikParams> = {
  templateId: VERI_SIKLIK_TEMPLATE_ID,
  kind: 'TAP_TO_PLACE',
  karsilananKazanimlar: ['MAT.1.4.1'],
  karsilananSkillIds: ['mat.veri.siklik-tablosu'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.KARDINALITE, HATA_ETIKETLERI.TEK_KUMEYI_ALMA],
  uret: veriSiklikUret,
};
