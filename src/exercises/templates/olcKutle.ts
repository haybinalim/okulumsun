/**
 * M-OLC-KUTLE — KÜTLE KIYASI
 *
 * Kütle, nesne sayısı veya boyuyla değil, kefeleri farklı yükseklikte olan
 * terazinin verdiği kanıtla karşılaştırılır. Aynı topun iki renkte gösterilmesi,
 * çocuğun yalnızca ağır/hafif ilişkisini izlemesini sağlar.
 */
import {
  makeItemId,
  varsayilanIpuclari,
  type AssetSpec,
  type AudioToImageExercise,
  type Difficulty,
  type ExerciseGenerator,
  type KazanimKodu,
  type Option,
  type Prompt,
  type Renk,
  type NesneSprite,
  type SkillId,
  type VisualSpec,
} from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';

export const OLC_KUTLE_TEMPLATE_ID = 'M-OLC-KUTLE' as const;

const RENKLER: readonly Renk[] = ['mavi', 'yesil', 'turuncu', 'pembe', 'mor', 'sari'];
// Aynı türden iki nesne, farklı renklerle terazide karşılaştırılır. Nesne değişse
// bile cevap yalnızca aşağı inen kefenin gösterdiği ağır/hafif ilişkisine dayanır.
const KUTLE_NESNELERI: readonly NesneSprite[] = ['top', 'elma', 'araba', 'balik'];

export interface OlcKutleParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function olcKutleUret(params: OlcKutleParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;
  const r = rng.fork('olc');
  const renkler = r.shuffle([...RENKLER]).slice(0, 2) as [Renk, Renk];
  const nesne = r.pick(KUTLE_NESNELERI);
  const agirIndex = r.pick([0, 1] as const);
  const hafifIndex = agirIndex === 0 ? 1 : 0;
  const hafifDeger = r.int(1, 2);
  const agirDeger = hafifDeger + Math.max(1, 3 - Math.floor(difficulty / 2));
  const soruAgirMi = r.bool();

  const agirRenk = renkler[agirIndex];
  const hafifRenk = renkler[hafifIndex];
  const dogruRenk = soruAgirMi ? agirRenk : hafifRenk;
  const yanlisRenk = soruAgirMi ? hafifRenk : agirRenk;
  const secenek = (id: string, renk: Renk, correct: boolean): Option => correct
    ? { id, deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: nesne, adet: 1, layout: 'sira', renk } }, correct: true }
    : {
        id,
        deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: nesne, adet: 1, layout: 'sira', renk } },
        correct: false,
        diagnosticTag: HATA_ETIKETLERI.BUYUKLUK_MIKTAR,
      };
  const options: Option[] = [secenek('secenek-0', dogruRenk, true), secenek('secenek-1', yanlisRenk, false)];
  const dogruOptionId = 'secenek-0';

  const degerler = [hafifDeger, hafifDeger] as [number, number];
  degerler[agirIndex] = agirDeger;
  const sahneGorsel: VisualSpec = {
    type: 'olcumKarsilastirma',
    boyut: 'kutle',
      sol: { nesne, renk: renkler[0], deger: degerler[0] },
      sag: { nesne, renk: renkler[1], deger: degerler[1] },
  };
  const soruSesi = { kind: 'key', key: soruAgirMi ? 'soru-olcme.hangisi-agir' : 'soru-olcme.hangisi-hafif' } as const;
  const prompt: Prompt = { ses: soruSesi, gorsel: sahneGorsel };
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
    talimatSesi: soruSesi,
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: ['secenek-1'],
    vurgulaIds: [dogruOptionId],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(OLC_KUTLE_TEMPLATE_ID, seed, `${nesne}|${agirDeger}|${hafifDeger}|${soruAgirMi ? 'a' : 'h'}|${agirIndex}`),
    templateId: OLC_KUTLE_TEMPLATE_ID,
    skillIds: ['mat.olcme.kutle-kiyas'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.8'] as readonly KazanimKodu[],
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

export const olcKutleGenerator: ExerciseGenerator<OlcKutleParams> = {
  templateId: OLC_KUTLE_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.8'],
  karsilananSkillIds: ['mat.olcme.kutle-kiyas'],
  readingLoad: 0,
  zorlukAraligi: [1, 3],
  uretebildigiHatalar: [HATA_ETIKETLERI.BUYUKLUK_MIKTAR],
  uret: olcKutleUret,
};
