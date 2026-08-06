/**
 * M-TAHMIN-MIKTAR — MİKTAR TAHMİNİ
 * ====================================================================
 *
 * KAZANIM: MAT.1.1.7 — "Verilen bir çokluktaki ilişkilerden yararlanarak
 * 20'ye kadar olan nesnelerin sayısını tahmin edebilme"
 *
 * Çocuk küme görür (~2 sn), tahmin eder, sonra birlikte sayılır.
 * DOĞRU/YANLIŞ YOK — yakınlık ölçülür (§6.1 q değerleri).
 *
 * Bu şablon AUDIO_TO_IMAGE kullanır ama scoring farklidir: çocuğun tahmini
 * ne kadar yakınsa q o kadar yüksek. Tam isabet = 1.0, ±1 = 0.85, ±2 = 0.45,
 * daha uzak = 0.20.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER:
 *   · mat.sayma.tahmin — tahmin 5-20 arası
 *
 * MÜFREDAT SINIRI: 5-20 arası (5'ten azda tahmin anlamsız).
 *
 * ÇELDİRİCİ ETİKETLERİ:
 *   · BUYUKLUK_MIKTAR — büyük nesneler = daha çok sandı
 *   · EKSIK_SAYMA — eksik saydı
 *
 * ETKİLEŞİM: AUDIO_TO_IMAGE — "Sence kaç tane var?" sesli talimatı,
 * rakam şıkkı seç.
 *
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId } from '../types';
import type { AudioToImageExercise, ExerciseGenerator, Option, VisualSpec, AssetSpec, Prompt } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import type { NesneSprite } from '../types';

export const TAHMIN_MIKTAR_TEMPLATE_ID = 'M-TAHMIN-MIKTAR' as const;

const TAHMIN_ARALIK = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;
const SPRITES: readonly NesneSprite[] = ['elma', 'top', 'balon', 'kus', 'cicek', 'yildiz', 'kelebek', 'balik'];


export interface TahminMiktarParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly tercihEdilenSprite?: NesneSprite;
  readonly mod?: 'tahta' | 'kisisel';
}

export function tahminMiktarUret(params: TahminMiktarParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const sayiRng = rng.fork('sayi');
  const minIdx = Math.min(difficulty - 1, 5);
  const maxIdx = Math.min(minIdx + 5 + difficulty, 15);
  const hedef = sayiRng.pick(TAHMIN_ARALIK.slice(minIdx, maxIdx + 1));

  const spriteRng = rng.fork('sprite');
  const sprite = spriteRng.pick(SPRITES);

  // Layout: dağınık (tahmin için)
  const layout = 'dagınık' as const;

  // Şık sayısı: 3-4
  const secenekSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış seçenekler — hedefe yakın
  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: number[] = [];
  const kullanilan = new Set<number>([hedef]);

  // ±1, ±2, ±3
  const uzakliklar = [1, -1, 2, -2, 3, -3];
  for (const d of uzakliklar) {
    if (yanlislar.length >= secenekSayisi - 1) break;
    const aday = hedef + d;
    if (aday >= 1 && aday <= 20 && !kullanilan.has(aday)) {
      yanlislar.push(aday);
      kullanilan.add(aday);
    }
  }

  while (yanlislar.length < secenekSayisi - 1) {
    const kalan = TAHMIN_ARALIK.filter((n) => !kullanilan.has(n));
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
    const fark = Math.abs(sec.sayi - hedef);
    const etiket: HataEtiketi = fark <= 1
      ? HATA_ETIKETLERI.EKSIK_SAYMA
      : HATA_ETIKETLERI.BUYUKLUK_MIKTAR;
    return sec.dogru
      ? { id, deger: { tur: 'gorsel', gorsel }, correct: true }
      : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: etiket };
  });

  const dogruOptionId = options.find((o) => 'correct' in o && o.correct)?.id ?? options[0].id;

  const sahneGorsel: VisualSpec = {
    type: 'nesneKumesi',
    sprite,
    adet: hedef,
    layout,
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'tahmin.kac-tahmin' },
    gorsel: sahneGorsel,
  };

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'tahmin.kac-tahmin' },
    k2Ses: { kind: 'key', key: 'tahmin.birlikte-sayalim' },
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
    itemId: makeItemId(TAHMIN_MIKTAR_TEMPLATE_ID, seed, `${hedef}|${sprite}`),
    templateId: TAHMIN_MIKTAR_TEMPLATE_ID,
    skillIds: ['mat.sayma.tahmin'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.7'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 15,
    prompt,
    hints,
    assets,
    options,
    validation: { mod: 'tekSecim', dogruOptionId },
    seed,
  };
}

export const tahminMiktarGenerator: ExerciseGenerator<TahminMiktarParams> = {
  templateId: TAHMIN_MIKTAR_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.7'],
  karsilananSkillIds: ['mat.sayma.tahmin'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.BUYUKLUK_MIKTAR, HATA_ETIKETLERI.EKSIK_SAYMA],
  uret: tahminMiktarUret,
};
