/**
 * M-RAKAM-TANI — RAKAM TANIMA
 * ====================================================================
 *
 * KAZANIM: MAT.1.1.1 — "Rakamları ve 20'ye kadar olan sayıları niceliklerin
 * büyüklüklerini temsil etmek için kullanabilme"
 *
 * Çocuk sesi dinler ("yedi"), rakam glifini seçer. Rakam okuma yazma değildir
 * — bir sembolü tanımadır. readingLoad 0.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER:
 *   · mat.sayi.rakam-tanima — 0-9 rakam tanıma
 *
 * MÜFREDAT SINIRI: 0-9 rakamları (10-20 iki rakamdan oluşur, ayrı şablon).
 *
 * ÇELDİRİCİ ETİKETLERİ:
 *   · GOREV_ANLASILMADI — rastgele seçim
 *   · KARDINALITE — sayının nicelik karşılığını bilmiyor
 *
 * ETKİLEŞİM: AUDIO_TO_IMAGE — sesli sayıyı dinle, rakam glifini seç.
 *
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId } from '../types';
import type { AudioToImageExercise, ExerciseGenerator, Option, VisualSpec, AssetSpec, Prompt } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import type { SpeechKey } from '../../audio/audioManifest.generated';

export const RAKAM_TANI_TEMPLATE_ID = 'M-RAKAM-TANI' as const;

/** Rakam aralığı — 0-9. */
const RAKAMLAR = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** Sayı → speechKey. */
function sayiKey(n: number): SpeechKey {
  return `sayi.${n}` as SpeechKey;
}

export interface RakamTaniParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function rakamTaniUret(params: RakamTaniParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  // Hedef sayı seç
  const sayiRng = rng.fork('sayi');
  const hedef = sayiRng.pick(RAKAMLAR);

  // Şık sayısı: difficulty 1-2 → 2, 3-4 → 3, 5 → 4
  const secenekSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış seçenekleri üret
  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: number[] = [];
  const kullanilan = new Set<number>([hedef]);

  // En tanılayıcı yanlış: hedefe yakın sayı (±1, ±2)
  const yakinlar = [hedef - 1, hedef + 1, hedef - 2, hedef + 2].filter(
    (n) => n >= 0 && n <= 9 && !kullanilan.has(n),
  );
  if (yakinlar.length > 0) {
    const y = celdiriciRng.pick(yakinlar);
    yanlislar.push(y);
    kullanilan.add(y);
  }

  // Kalan yanlışlar
  while (yanlislar.length < secenekSayisi - 1) {
    const kalan = RAKAMLAR.filter((n) => !kullanilan.has(n));
    if (kalan.length === 0) break;
    const y = celdiriciRng.pick(kalan);
    yanlislar.push(y);
    kullanilan.add(y);
  }

  // Şıkları karıştır
  const siraRng = rng.fork('sira');
  const tumSecenekler = [
    { dogru: true, sayi: hedef },
    ...yanlislar.map((s) => ({ dogru: false, sayi: s })),
  ];
  const karistirilmis = siraRng.shuffle(tumSecenekler);

  const options: Option[] = karistirilmis.map((sec, i) => {
    const id = `secenek-${i}`;
    const gorsel: VisualSpec = { type: 'rakam', sayi: sec.sayi };
    const etiket: HataEtiketi = Math.abs(sec.sayi - hedef) <= 1
      ? HATA_ETIKETLERI.KARDINALITE
      : HATA_ETIKETLERI.GOREV_ANLASILMADI;
    return sec.dogru
      ? { id, deger: { tur: 'gorsel', gorsel }, correct: true }
      : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: etiket };
  });

  const dogruOptionId = options.find((o) => 'correct' in o && o.correct)?.id ?? options[0].id;

  const prompt: Prompt = {
    ses: { kind: 'key', key: sayiKey(hedef) },
  };

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-rakam.dinle-sec' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [dogruOptionId],
  });

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(RAKAM_TANI_TEMPLATE_ID, seed, String(hedef)),
    templateId: RAKAM_TANI_TEMPLATE_ID,
    skillIds: ['mat.sayi.rakam-tanima'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.1'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 10,
    prompt,
    hints,
    assets,
    options,
    validation: { mod: 'tekSecim', dogruOptionId },
    seed,
  };
}

export const rakamTaniGenerator: ExerciseGenerator<RakamTaniParams> = {
  templateId: RAKAM_TANI_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.1'],
  karsilananSkillIds: ['mat.sayi.rakam-tanima'],
  readingLoad: 0,
  zorlukAraligi: [1, 3],
  uretebildigiHatalar: [HATA_ETIKETLERI.GOREV_ANLASILMADI, HATA_ETIKETLERI.KARDINALITE],
  uret: rakamTaniUret,
};
