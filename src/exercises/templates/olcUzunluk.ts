/**
 * M-OLC-UZUNLUK — UZUNLUK KIYASI
 *
 * Soru kökü, sahne ve seçenek aynı ilişkiyi taşır: iki aynı tür kalem ortak
 * başlangıç çizgisinden başlar; yalnız uzunlukları değişir. Çocuk renkli seçeneği
 * sahnedeki aynı kalemle eşler ve "uzun/kısa" kararını görünür uzunluktan verir.
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

export const OLC_UZUNLUK_TEMPLATE_ID = 'M-OLC-UZUNLUK' as const;

const RENKLER: readonly Renk[] = ['mavi', 'yesil', 'turuncu', 'pembe', 'mor', 'sari'];
// Nesne adı sesle sorulmadığı için çocuk yalnızca ortak başlangıç çizgisi ve
// uzunluğa odaklanır; bağlam değişir ama ölçülen ilişki sabit kalır.
const UZUNLUK_NESNELERI: readonly NesneSprite[] = ['kalem', 'araba', 'balik', 'cicek'];

export interface OlcUzunlukParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function olcUzunlukUret(params: OlcUzunlukParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;
  const r = rng.fork('olc');
  const renkler = r.shuffle([...RENKLER]).slice(0, 2) as [Renk, Renk];
  const nesne = r.pick(UZUNLUK_NESNELERI);
  const uzunIndex = r.pick([0, 1] as const);
  const kisaIndex = uzunIndex === 0 ? 1 : 0;
  const fark = Math.max(1, 4 - Math.floor(difficulty / 2));
  const kisaBoy = r.int(2, 4);
  const uzunBoy = kisaBoy + fark;
  const soruUzunMu = r.bool();

  const uzunRenk = renkler[uzunIndex];
  const kisaRenk = renkler[kisaIndex];
  const secenek = (id: string, renk: Renk, correct: boolean): Option => correct
    ? { id, deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: nesne, adet: 1, layout: 'sira', renk } }, correct: true }
    : {
        id,
        deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: nesne, adet: 1, layout: 'sira', renk } },
        correct: false,
        diagnosticTag: HATA_ETIKETLERI.BUYUKLUK_MIKTAR,
      };

  const dogruRenk = soruUzunMu ? uzunRenk : kisaRenk;
  const yanlisRenk = soruUzunMu ? kisaRenk : uzunRenk;
  const options: Option[] = [
    secenek('secenek-0', dogruRenk, true),
    secenek('secenek-1', yanlisRenk, false),
  ];
  const dogruOptionId = 'secenek-0';

  const uzunluklar = [kisaBoy, kisaBoy] as [number, number];
  uzunluklar[uzunIndex] = uzunBoy;
  const sahneGorsel: VisualSpec = {
    type: 'olcumKarsilastirma',
    boyut: 'uzunluk',
      sol: { nesne, renk: renkler[0], deger: uzunluklar[0] },
      sag: { nesne, renk: renkler[1], deger: uzunluklar[1] },
  };
  const soruSesi = { kind: 'key', key: soruUzunMu ? 'soru-olcme.hangisi-uzun' : 'soru-olcme.hangisi-kisa' } as const;
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
    itemId: makeItemId(OLC_UZUNLUK_TEMPLATE_ID, seed, `${nesne}|${uzunBoy}|${kisaBoy}|${soruUzunMu ? 'u' : 'k'}|${uzunIndex}`),
    templateId: OLC_UZUNLUK_TEMPLATE_ID,
    skillIds: ['mat.olcme.uzunluk-kiyas'] as readonly SkillId[],
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

export const olcUzunlukGenerator: ExerciseGenerator<OlcUzunlukParams> = {
  templateId: OLC_UZUNLUK_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.8'],
  karsilananSkillIds: ['mat.olcme.uzunluk-kiyas'],
  readingLoad: 0,
  zorlukAraligi: [1, 3],
  uretebildigiHatalar: [HATA_ETIKETLERI.BUYUKLUK_MIKTAR, HATA_ETIKETLERI.GOREV_ANLASILMADI],
  uret: olcUzunlukUret,
};
