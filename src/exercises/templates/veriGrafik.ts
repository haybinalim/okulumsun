/**
 * M-VERI-GRAFIK — NESNE GRAFİĞİ OKUMA
 * ====================================================================
 * KAZANIM: MAT.1.4.1 — Nesne grafiğini oku, soruyu cevapla.
 * "En çok hangisi?", "En az hangisi?", "Toplam kaç tane?"
 * ÇELDİRİCİ: BUYUKLUK_MIKTAR, TEK_KUMEYI_ALMA
 * ETKİLEŞİM: AUDIO_TO_IMAGE — grafik göster, sesli soru, rakam/nesne şıkkı.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Option, type VisualSpec, type AssetSpec, type Prompt, type NesneSprite, type Renk } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const VERI_GRAFIK_TEMPLATE_ID = 'M-VERI-GRAFIK' as const;

const NESNELER: readonly NesneSprite[] = ['elma', 'top', 'balon', 'kus', 'cicek', 'yildiz', 'balik', 'kelebek'];
const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

type SoruTipi = 'en-cok' | 'en-az' | 'kac-tane';

export interface VeriGrafikParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function veriGrafikUret(params: VeriGrafikParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  // Kategori sayısı: 3
  const kategoriSayisi = 3;

  // Kategorileri seç
  const secimRng = rng.fork('secim');
  const kategoriler = secimRng.shuffle([...NESNELER]).slice(0, kategoriSayisi);

  // Her kategori için sayım — benzersiz olmalı (en çok/en az soruları için)
  const sayimRng = rng.fork('sayim');
  const sayilar: number[] = [];
  const kullanilanSayilar = new Set<number>();
  while (sayilar.length < kategoriSayisi) {
    const s = sayimRng.int(1, Math.min(5 + difficulty, 10));
    if (!kullanilanSayilar.has(s)) {
      sayilar.push(s);
      kullanilanSayilar.add(s);
    }
  }

  // Soru tipi seç
  const soruRng = rng.fork('soru');
  const soruTipi = soruRng.pick(['en-cok', 'en-az', 'kac-tane'] as readonly SoruTipi[]);

  // Doğru cevabı belirle
  let dogruCevap: number | NesneSprite;
  let dogruIndex: number;

  if (soruTipi === 'en-cok') {
    dogruIndex = sayilar.indexOf(Math.max(...sayilar));
    dogruCevap = kategoriler[dogruIndex];
  } else if (soruTipi === 'en-az') {
    dogruIndex = sayilar.indexOf(Math.min(...sayilar));
    dogruCevap = kategoriler[dogruIndex];
  } else {
    // Sesli soru “Toplam kaç tane?” der; doğru cevap tek bir sütun değil,
    // grafikteki üç kategorinin birlikte sayısı olmalıdır.
    dogruIndex = 0;
    dogruCevap = sayilar.reduce((toplam, sayi) => toplam + sayi, 0);
  }

  // Şık sayısı
  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış seçenekler
  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: (number | NesneSprite)[] = [];
  const kullanilanCevaplar = new Set<string>([String(dogruCevap)]);

  if (soruTipi === 'en-cok' || soruTipi === 'en-az') {
    // Nesne şıkları
    const yanlisNesneler = kategoriler.filter((_, i) => i !== dogruIndex);
    for (const n of celdiriciRng.shuffle([...yanlisNesneler])) {
      if (yanlislar.length >= sikSayisi - 1) break;
      yanlislar.push(n);
      kullanilanCevaplar.add(String(n));
    }
  } else {
    // Önce çocuğun sık yapacağı “yalnız bir sütunu sayma” hatasını seçenek
    // olarak sun; kalan çeldiriciler toplamın yakınındaki sayılardır.
    for (const y of celdiriciRng.shuffle([...sayilar, (dogruCevap as number) - 1, (dogruCevap as number) + 1, (dogruCevap as number) - 2])) {
      if (yanlislar.length >= sikSayisi - 1) break;
      if (y >= 0 && y <= 30 && !kullanilanCevaplar.has(String(y))) {
        yanlislar.push(y);
        kullanilanCevaplar.add(String(y));
      }
    }
    while (yanlislar.length < sikSayisi - 1) {
      let y: number;
      do { y = celdiriciRng.int(0, 30); } while (kullanilanCevaplar.has(String(y)));
      yanlislar.push(y);
      kullanilanCevaplar.add(String(y));
    }
  }

  // Şıkları oluştur
  const siraRng = rng.fork('sira');
  const tumSecenekler = [
    { dogru: true, deger: dogruCevap },
    ...yanlislar.map((d) => ({ dogru: false, deger: d })),
  ];
  const karistirilmis = siraRng.shuffle(tumSecenekler);

  const options: Option[] = karistirilmis.map((sec, i) => {
    const id = `secenek-${i}`;
    const isNesne = typeof sec.deger !== 'number';
    const gorsel: VisualSpec = isNesne
      ? { type: 'nesneKumesi', sprite: sec.deger as NesneSprite, adet: 1, layout: 'sira' }
      : { type: 'rakam', sayi: sec.deger as number };
    const etiket: HataEtiketi = soruTipi === 'kac-tane' && sayilar.includes(sec.deger as number)
      ? HATA_ETIKETLERI.TEK_KUMEYI_ALMA
      : HATA_ETIKETLERI.BUYUKLUK_MIKTAR;
    return sec.dogru
      ? { id, deger: { tur: 'gorsel', gorsel }, correct: true }
      : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: etiket };
  });

  const dogruOptionId = options.find((o) => 'correct' in o && o.correct)?.id ?? options[0].id;

  // Sahne — nesne grafiği (sütun grafiği)
  const renkRng = rng.fork('renk');
  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: kategoriler.map((kategori, i) => ({
      gorsel: { type: 'nesneKumesi', sprite: kategori, adet: sayilar[i], layout: 'sira', renk: renkRng.pick(RENKLER) } as VisualSpec,
      konum: { x: 0.2 + i * 0.3, y: 0.5 },
    })),
  };

  // Sesli soru
  const soruKey = soruTipi === 'en-cok'
    ? 'soru-veri.en-cok-hangisi'
    : soruTipi === 'en-az'
    ? 'soru-veri.en-az-hangisi'
    : 'soru-veri.toplam-kac';

  const prompt: Prompt = {
    ses: { kind: 'key', key: soruKey },
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
    talimatSesi: { kind: 'key', key: soruKey },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [dogruOptionId],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(VERI_GRAFIK_TEMPLATE_ID, seed, `${soruTipi}|${kategoriler.map((k, i) => `${k}:${sayilar[i]}`).join('|')}`),
    templateId: VERI_GRAFIK_TEMPLATE_ID,
    skillIds: ['mat.veri.nesne-grafigi'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.4.1'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 20,
    prompt, hints, assets, options,
    validation: { mod: 'tekSecim', dogruOptionId },
    seed,
  };
}

export const veriGrafikGenerator: ExerciseGenerator<VeriGrafikParams> = {
  templateId: VERI_GRAFIK_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.4.1'],
  karsilananSkillIds: ['mat.veri.nesne-grafigi'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.BUYUKLUK_MIKTAR, HATA_ETIKETLERI.TEK_KUMEYI_ALMA],
  uret: veriGrafikUret,
};
