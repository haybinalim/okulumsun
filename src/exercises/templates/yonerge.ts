/**
 * M-YONERGE — IZGARADA KARAKTERİ YÖNERGEYLE HEDEFE GÖTÜRME
 * ====================================================================
 *
 * KAZANIM: MAT.1.3.1 — "Hedefe ulaşmak için mesafeleri ve yönleri içeren
 * yönergeleri çözümleyebilme"
 *
 * Süreç bileşeni (b): "Mesafeleri ve yönleri içeren yönergeleri uygular."
 *
 * M-KONUM (a)'yı ölçer (konum ifadesini tanıma); M-YONERGE (b)'yi ölçer
 * (yönergeyi uygulama). Çocuk bir dizi yön+adım yönergesini dinler ve
 * karakteri hedefe ulaştıracak doğru ADIM SIRASINI seçer.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER (src/content/skills.json):
 *   · mat.uzam.yonerge-uygulama — "Yönergeyi izle ve hedefe ulaş"
 *
 * MÜFREDAT SINIRI: Yön kavramı 1. sınıfta 'ileri', 'geri', 'sağa', 'sola',
 * 'yukarı', 'aşağı' ile sınırlıdır (SAYFA 40). Adım sayısı 1–5 arası.
 * Izgara boyutu 4×4'tür (1. sınıf çocuğu daha büyük ızgarada kaybolur).
 *
 * ÇELDİRİCİ ETİKETLERİ:
 *   · GOREV_ANLASILMADI — yön karıştırıldı (sağa↔sola) veya adım sayısı yanlış
 *
 * ETKİLEŞİM: SEQUENCE_ORDER — çocuk yön+adım kartlarını doğru sırayla dokunur.
 *   Her kart bir adımı temsil eder: "2 adım ileri", "1 adım sağa" vb.
 *   Doğru sıra = yönergedeki sıra. Kartlar GÖRSEL (rakam + ses) — metin YOK
 *   çünkü readingLoad 0 (çocuk okuyamıyor).
 *
 * SAF VE SENKRON: Date.now(), Math.random(), IndexedDB ÇAĞRILMAZ.
 */

import {
  YON_KART_YONLER,
  makeItemId,
  varsayilanIpuclari,
  type Difficulty,
  type KazanimKodu,
  type SkillId,
  type YonKartiYonu,
} from '../types';
import type { SequenceOrderExercise, ExerciseGenerator, Option, VisualSpec, AssetSpec, Prompt } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';
import type { SpeechKey } from '../../audio/audioManifest.generated';

// ---------------------------------------------------------------- sabitler

export const YONERGE_TEMPLATE_ID = 'M-YONERGE' as const;

/** Yönler — §4.5 ses envanteriyle uyumlu. */
export const YONLER = YON_KART_YONLER;
export type Yon = YonKartiYonu;

/** Yön → speechKey eşlemesi. */
const YON_SPEECH_KEY: Record<Yon, SpeechKey> = {
  ileri: 'yon.ileri',
  geri: 'yon.geri',
  saga: 'yon.saga',
  sola: 'yon.sola',
};

/** Adım sayıları — 1–5 arası (§4.5). */
const ADIMLAR = [1, 2, 3, 4, 5] as const;
export type AdimSayisi = (typeof ADIMLAR)[number];

/** Adım → speechKey eşlemesi. */
const ADIM_SPEECH_KEY: Record<AdimSayisi, SpeechKey> = {
  1: 'adim.bir-adim',
  2: 'adim.iki-adim',
  3: 'adim.uc-adim',
  4: 'adim.dort-adim',
  5: 'adim.bes-adim',
};

/** Bir adım: yön + adım sayısı. */
export interface Adim {
  readonly yon: Yon;
  readonly adim: AdimSayisi;
}

/** Izgara boyutu. */
const IZGARA_BOYUTU = 4;

// ---------------------------------------------------------------- params

export interface YonergeParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

// ---------------------------------------------------------------- üretim

export function yonergeUret(params: YonergeParams, rng: Rng): SequenceOrderExercise {
  const { seed, difficulty } = params;

  // Sıralama etkinliği olabilmesi için en az iki kart gerekir.
  // Zorluk yükseldikçe hatırlanacak adım sayısı 2'den 4'e çıkar.
  const adimSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yönerge adımlarını üret
  const yonergeRng = rng.fork('yonerge');
  const adimlar: Adim[] = [];
  for (let i = 0; i < adimSayisi; i++) {
    const yon = yonergeRng.pick(YONLER);
    const adim = yonergeRng.pick(ADIMLAR.slice(0, Math.min(2 + difficulty, 5)) as readonly AdimSayisi[]);
    adimlar.push({ yon, adim });
  }

  // Doğru sıra — adımların ID'leri
  const dogruSira = adimlar.map((_, i) => `adim-${i}`);

  // Prompt — yönergeyi seslendir (adım sayısı + yön)
  const yonergeSesKeys: SpeechKey[] = [];
  for (const adim of adimlar) {
    yonergeSesKeys.push(ADIM_SPEECH_KEY[adim.adim]);
    yonergeSesKeys.push(YON_SPEECH_KEY[adim.yon]);
  }

  // Doğru kartlar — adım sayısını rakam olarak göster, ses tam talimat
  const options: Option[] = adimlar.map((adim, i) => {
    const id = `adim-${i}`;
    const sesKey = ADIM_SPEECH_KEY[adim.adim];
    const yonKey = YON_SPEECH_KEY[adim.yon];
    const gorsel: VisualSpec = { type: 'yonKarti', yon: adim.yon, adim: adim.adim };
    return {
      id,
      deger: { tur: 'gorsel' as const, gorsel },
      ses: { kind: 'sequence' as const, keys: [...[sesKey, yonKey]] as SpeechKey[] },
      correct: true,
    };
  });

  // Sıralama sorusunda kart havuzu yönergede duyulan adımlardan oluşur.
  // Başka kart eklemek "hangi sırada?" sorusunu "hangileri?" sorusuna dönüştürür.

  // Izgara görseli — prompt'ta gösterilir
  const promptGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: [
      { gorsel: { type: 'rakam', sayi: IZGARA_BOYUTU }, konum: { x: 0.5, y: 0.5 } },
    ],
  };

  const prompt: Prompt = {
    ses: { kind: 'sequence', keys: yonergeSesKeys, gapMs: 300 },
    gorsel: promptGorsel,
    // metin YOK — readingLoad 0, çocuk okuyamıyor
  };

  // Asset'ler
  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  // Hints
  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'sequence', keys: yonergeSesKeys, gapMs: 300 },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: dogruSira,
  });

  return {
    kind: 'SEQUENCE_ORDER',
    itemId: makeItemId(YONERGE_TEMPLATE_ID, seed, adimlar.map((a) => `${a.adim}${a.yon}`).join('|')),
    templateId: YONERGE_TEMPLATE_ID,
    skillIds: ['mat.uzam.yon-yonerge'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.3.1'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 20,
    prompt,
    hints,
    assets,
    options,
    validation: {
      mod: 'siralama',
      dogruSira,
    },
    seed,
  };
}

// ---------------------------------------------------------------- generator

export const yonergeGenerator: ExerciseGenerator<YonergeParams> = {
  templateId: YONERGE_TEMPLATE_ID,
  kind: 'SEQUENCE_ORDER',
  karsilananKazanimlar: ['MAT.1.3.1'],
  karsilananSkillIds: ['mat.uzam.yon-yonerge'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.GOREV_ANLASILMADI],
  uret: yonergeUret,
};
