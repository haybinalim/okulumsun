/**
 * M-VERI-CETELE — SAYARAK ÇETELE İŞARETLEME
 * ====================================================================
 * KAZANIM: MAT.1.4.1 — Nesneleri sayarak çetele işaretle.
 * ÇELDİRİCİ: BIREBIR_ESLESME, EKSIK_SAYMA
 * ETKİLEŞİM: TAP_COUNT — nesnelere dokunarak say, sayaçtan cevap oku.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Option, type VisualSpec, type AssetSpec, type Prompt, type NesneSprite, type Renk } from '../types';
import type { TapCountExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';

export const VERI_CETELE_TEMPLATE_ID = 'M-VERI-CETELE' as const;

const NESNELER: readonly NesneSprite[] = ['elma', 'top', 'balon', 'kus', 'cicek', 'yildiz', 'balik', 'kelebek'];
const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

export interface VeriCeteleParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function veriCeteleUret(params: VeriCeteleParams, rng: Rng): TapCountExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('veri');
  const nesne = r.pick(NESNELER);
  const renk = r.pick(RENKLER);

  // Sayılacak nesne adedi
  const adet = Math.min(3 + difficulty * 2, 12);

  // Hedef nesneler — her biri bir kez dokunulacak
  const hedefIds: string[] = [];
  const yerRng = rng.fork('yer');
  const kullanilanPos = new Set<string>();

  const options: Option[] = [];
  for (let i = 0; i < adet; i++) {
    let cx: number, cy: number;
    do {
      cx = 0.1 + yerRng.next() * 0.8;
      cy = 0.1 + yerRng.next() * 0.8;
    } while (kullanilanPos.has(`${Math.round(cx * 10)},${Math.round(cy * 10)}`));
    kullanilanPos.add(`${Math.round(cx * 10)},${Math.round(cy * 10)}`);

    const id = `nesne-${i}`;
    hedefIds.push(id);

    options.push({
      id,
      deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: nesne, adet: 1, layout: 'sira', renk } },
      correct: true,
    });
  }

  // Sahne — nesneler dağınık düzen
  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: options.map((o, i) => {
      // Pozisyonları kullan
      return {
        gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
        konum: { x: 0.1 + (i / adet) * 0.8, y: 0.5 },
      };
    }),
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-veri.say-isaretle' },
    gorsel: sahneGorsel,
  };

  const assets: readonly AssetSpec[] = [
    { id: 'sahne', rol: 'sahne', gorsel: sahneGorsel, erisimBolgesi: 'serbest' },
  ];

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-veri.say-isaretle' },
    k2Ses: { kind: 'key', key: 'yardim.k2-birlikte-sayalim' },
    eleOptionIds: [],
    vurgulaIds: hedefIds,
  });

  return {
    kind: 'TAP_COUNT',
    itemId: makeItemId(VERI_CETELE_TEMPLATE_ID, seed, `${nesne}|${adet}`),
    templateId: VERI_CETELE_TEMPLATE_ID,
    skillIds: ['mat.veri.cetele'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.4.1'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 25,
    prompt, hints, assets, options,
    validation: {
      mod: 'sayim',
      beklenenAdet: adet,
      hedefIds,
      herNesneBirKez: true,
      cevapSecimi: 'sayac',
    },
    seed,
  };
}

export const veriCeteleGenerator: ExerciseGenerator<VeriCeteleParams> = {
  templateId: VERI_CETELE_TEMPLATE_ID,
  kind: 'TAP_COUNT',
  karsilananKazanimlar: ['MAT.1.4.1'],
  karsilananSkillIds: ['mat.veri.cetele'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.BIREBIR_ESLESME, HATA_ETIKETLERI.EKSIK_SAYMA],
  uret: veriCeteleUret,
};
