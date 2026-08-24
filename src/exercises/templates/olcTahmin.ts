/**
 * M-OLC-TAHMIN — ÖLÇÜM TAHMİNİ
 * ====================================================================
 * KAZANIM: MAT.1.1.8 — Nesnenin uzunluğunu birim bloklarla tahmin et.
 * "Sence kaç birim uzunluğunda?"
 * ÇELDİRİCİ: BUYUKLUK_MIKTAR, GOREV_ANLASILMADI
 * ETKİLEŞİM: AUDIO_TO_IMAGE. SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Option, type VisualSpec, type AssetSpec, type Prompt, type Renk } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const OLC_TAHMIN_TEMPLATE_ID = 'M-OLC-TAHMIN' as const;

const RENKLER: readonly Renk[] = ['mavi', 'yesil', 'turuncu', 'pembe', 'mor', 'sari'];

export interface OlcTahminParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function olcTahminUret(params: OlcTahminParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('olc');
  // Nesne uzunluğu
  const birimSayisi = Math.min(3 + difficulty * 2, 12);
  const renk = r.pick(RENKLER);

  const sikSayisi = Math.min(3 + Math.floor((difficulty - 1) / 3), 4);

  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: number[] = [];
  const kullanilan = new Set<number>([birimSayisi]);

  for (const d of [1, -1, 2, -2, 3, -3]) {
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
      diagnosticTag: (Math.abs(y - birimSayisi) <= 1 ? HATA_ETIKETLERI.BUYUKLUK_MIKTAR : HATA_ETIKETLERI.GOREV_ANLASILMADI) as HataEtiketi,
    })),
  ];

  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle([...options]);
  options.splice(0, options.length, ...karistirilmis);

  // Çocuk, nesnenin altında verilen TEK referans birimi kullanarak uzunluğu
  // tahmin eder. Birimler gizli olsa da tahmin rastgele değildir: çubuğun
  // başlangıcı ile referans birim aynı hizadadır ve uzunluk onun katıdır.
  const sahneGorsel: VisualSpec = {
    type: 'olcumSahnesi',
    nesne: 'kalem',
    birim: 'yildiz',
    birimAdedi: birimSayisi,
    boyut: 'uzunluk',
    gorunum: 'tahmin',
    renk,
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-olcme.kac-tahmin-uzun' },
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
    talimatSesi: { kind: 'key', key: 'soru-olcme.kac-tahmin-uzun' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [`sik-d-${birimSayisi}`],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(OLC_TAHMIN_TEMPLATE_ID, seed, String(birimSayisi)),
    templateId: OLC_TAHMIN_TEMPLATE_ID,
    skillIds: ['mat.olcme.olcum-tahmini'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.8'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 12,
    prompt, hints, assets, options,
    validation: { mod: 'tekSecim', dogruOptionId: `sik-d-${birimSayisi}` },
    seed,
  };
}

export const olcTahminGenerator: ExerciseGenerator<OlcTahminParams> = {
  templateId: OLC_TAHMIN_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.8'],
  karsilananSkillIds: ['mat.olcme.olcum-tahmini'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.BUYUKLUK_MIKTAR, HATA_ETIKETLERI.GOREV_ANLASILMADI],
  uret: olcTahminUret,
};
