/**
 * M-SIRA-SAYI — SIRA SAYISI
 * ====================================================================
 *
 * KAZANIM: MAT.1.1.3 — "Nesnelerin sıra sayısını gösterebilme"
 *
 * Çocuk bir nesne dizisinde işaretlenen nesnenin kaçıncı sırada olduğunu
 * söyler. Sıra sayısı ses klipleri ZORUNLU (§4.5).
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER:
 *   · mat.sayi.sira-sayisi — birinci…onuncu
 *
 * MÜFREDAT SINIRI: 1-10 arası sıra sayıları (1. sınıf).
 *
 * ÇELDİRİCİ ETİKETLERİ:
 *   · BIREBIR_ESLESME — sayarken atladı
 *   · GOREV_ANLASILMADI — sıra sayısı karıştırıldı
 *
 * ETKİLEŞİM: AUDIO_TO_IMAGE — "Kaçıncı sırada?" sesli talimatı,
 * sıra sayısı kartı seç (rakam glifi gösterilir).
 *
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId } from '../types';
import type { AudioToImageExercise, ExerciseGenerator, Option, VisualSpec, AssetSpec, Prompt } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import type { NesneSprite } from '../types';
import type { SpeechKey } from '../../audio/audioManifest.generated';

export const SIRA_SAYI_TEMPLATE_ID = 'M-SIRA-SAYI' as const;

const MAX_SIRA = 10;
const SPRITES: readonly NesneSprite[] = ['elma', 'top', 'balon', 'kus', 'cicek', 'yildiz', 'kelebek', 'balik', 'araba', 'kalem'];

function siraKey(n: number): SpeechKey {
  return `sira.${n}` as SpeechKey;
}

export interface SiraSayiParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly tercihEdilenSprite?: NesneSprite;
  readonly mod?: 'tahta' | 'kisisel';
}

export function siraSayiUret(params: SiraSayiParams, rng: Rng): SiraSayiExercise {
  const { seed, difficulty } = params;

  // Dizi uzunluğu: difficulty 1→3, 2→5, 3→7, 4→8, 5→10
  const diziUzunlugu = Math.min(1 + difficulty * 2, MAX_SIRA);

  const dizRng = rng.fork('dizi');
  const sprite = dizRng.pick(SPRITES);

  // Hedef sıra: dizinin içinde rastgele
  const hedefSira = dizRng.int(1, diziUzunlugu);

  // Şık sayısı
  const secenekSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış seçenekler
  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: number[] = [];
  const kullanilan = new Set<number>([hedefSira]);

  // En tanılayıcı: ±1
  const yakinlar = [hedefSira - 1, hedefSira + 1].filter((n) => n >= 1 && n <= diziUzunlugu && !kullanilan.has(n));
  if (yakinlar.length > 0) {
    const y = celdiriciRng.pick(yakinlar);
    yanlislar.push(y);
    kullanilan.add(y);
  }

  while (yanlislar.length < secenekSayisi - 1) {
    const kalan: number[] = [];
    for (let i = 1; i <= diziUzunlugu; i++) if (!kullanilan.has(i)) kalan.push(i);
    if (kalan.length === 0) break;
    const y = celdiriciRng.pick(kalan);
    yanlislar.push(y);
    kullanilan.add(y);
  }

  const siraRng = rng.fork('sira');
  const tumSecenekler = [
    { dogru: true, sira: hedefSira },
    ...yanlislar.map((s) => ({ dogru: false, sira: s })),
  ];
  const karistirilmis = siraRng.shuffle(tumSecenekler);

  const options: Option[] = karistirilmis.map((sec, i) => {
    const id = `secenek-${i}`;
    const gorsel: VisualSpec = { type: 'rakam', sayi: sec.sira };
    const etiket: HataEtiketi = Math.abs(sec.sira - hedefSira) === 1
      ? HATA_ETIKETLERI.BIREBIR_ESLESME
      : HATA_ETIKETLERI.GOREV_ANLASILMADI;
    return sec.dogru
      ? { id, deger: { tur: 'gorsel', gorsel }, correct: true, ses: { kind: 'key' as const, key: siraKey(sec.sira) } }
      : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: etiket, ses: { kind: 'key' as const, key: siraKey(sec.sira) } };
  });

  const dogruOptionId = options.find((o) => 'correct' in o && o.correct)?.id ?? options[0].id;

  // Sahne — nesne dizisi (sıralı), hedef sıradaki nesne vurgulanır
  const sahneGorsel: VisualSpec = {
    type: 'nesneKumesi',
    sprite,
    adet: diziUzunlugu,
    layout: 'sira',
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru.kacinci' },
    gorsel: sahneGorsel,
  };

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru.kacinci' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
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
    itemId: makeItemId(SIRA_SAYI_TEMPLATE_ID, seed, `${diziUzunlugu}|${hedefSira}`),
    templateId: SIRA_SAYI_TEMPLATE_ID,
    skillIds: ['mat.sayi.sira-sayisi'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.3'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 12,
    prompt,
    hints,
    assets,
    options,
    validation: { mod: 'tekSecim', dogruOptionId },
    seed,
  };
}

// AudioToImageExercise tipine SiraSayiExercise alias
type SiraSayiExercise = AudioToImageExercise;

export const siraSayiGenerator: ExerciseGenerator<SiraSayiParams> = {
  templateId: SIRA_SAYI_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.3'],
  karsilananSkillIds: ['mat.sayi.sira-sayisi'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.BIREBIR_ESLESME, HATA_ETIKETLERI.GOREV_ANLASILMADI],
  uret: siraSayiUret,
};
