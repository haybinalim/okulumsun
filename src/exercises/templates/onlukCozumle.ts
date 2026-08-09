/**
 * M-ONLUK-COZUMLE — ONLUK+BİRLİK ÇÖZÜMLEME
 * ====================================================================
 *
 * KAZANIM: MAT.1.1.1, MAT.1.1.2 — 11-20 arası sayıyı onluk+birlik olarak
 * çözümle (onluk çerçeve).
 *
 * Çocuk bir sayı görür (ör. 15) ve onluk çerçevede doğru parçaları yerleştirir:
 * 1 onluk kart + 5 birlik kart.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER:
 *   · mat.sayi.onluk-birlik — 11-20 onluk+birlik
 *
 * MÜFREDAT SINIRI: 11-20 arası.
 *
 * ÇELDİRİCİ ETİKETLERİ:
 *   · ONLUK_BOZMA — onluğu düşürdü veya basamakları yer değiştirdi
 *   · KARDINALITE — sayının nicelik karşılığını bilmiyor
 *
 * ETKİLEŞİM: TAP_TO_PLACE — onluk ve birlik kartlarını yuvalara yerleştir.
 *   2 yuva: "onluk" ve "birlik".
 *
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Yuva, type Option, type VisualSpec, type AssetSpec, type Prompt } from '../types';
import type { TapToPlaceExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import type { SpeechKey } from '../../audio/audioManifest.generated';

export const ONLUK_COZUMLE_TEMPLATE_ID = 'M-ONLUK-COZUMLE' as const;

const ARALIK = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;

function sayiKey(n: number): SpeechKey {
  return `sayi.${n}` as SpeechKey;
}

export interface OnlukCozumleParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function onlukCozumleUret(params: OnlukCozumleParams, rng: Rng): TapToPlaceExercise {
  const { seed, difficulty } = params;

  const sayiRng = rng.fork('sayi');
  const hedef = sayiRng.pick(ARALIK);

  const onluk = Math.floor(hedef / 10);
  const birlik = hedef % 10;

  // Doğru kartlar
  const dogruOnlukId = 'kart-onluk';
  const dogruBirlikId = `kart-birlik-${birlik}`;

  // Yanlış kartlar

  // Yanlış onluk: 2 (hedef 11-20 ise 2 onluk = 21+ oluyor, açıkça yanlış)
  const yanlisOnlukId = 'kart-yanlis-onluk';
  const yanlisOnlukDeger = 2;

  // Yanlış birlik: basamakları yer değiştir (18 → 8 onluk 1 birlik gibi)
  const yanlisBirlikId = 'kart-yanlis-birlik';
  const yanlisBirlikDeger = onluk; // basamak değişimi → ONLUK_BOZMA

  const options: Option[] = [
    // Doğru onluk kartı
    {
      id: dogruOnlukId,
      deger: { tur: 'gorsel', gorsel: { type: 'onlukCerceve', gruplar: [10] } },
      correct: true,
    },
    // Doğru birlik kartı
    {
      id: dogruBirlikId,
      deger: { tur: 'gorsel', gorsel: { type: 'onlukCerceve', gruplar: [birlik] } },
      correct: true,
    },
  ];

  // Yanlış kartlar ekle (difficulty ≥ 2)
  if (difficulty >= 2) {
    options.push({
      id: yanlisOnlukId,
      deger: { tur: 'gorsel', gorsel: { type: 'onlukCerceve', gruplar: [yanlisOnlukDeger * 10] } as VisualSpec },
      correct: false,
      diagnosticTag: HATA_ETIKETLERI.ONLUK_BOZMA as HataEtiketi,
    });
  }

  if (difficulty >= 3 && birlik !== onluk) {
    options.push({
      id: yanlisBirlikId,
      deger: { tur: 'gorsel', gorsel: { type: 'onlukCerceve', gruplar: [yanlisBirlikDeger] } },
      correct: false,
      diagnosticTag: HATA_ETIKETLERI.ONLUK_BOZMA as HataEtiketi,
    });
  }

  // Şıkları karıştır
  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle([...options]);
  options.splice(0, options.length, ...karistirilmis);

  // Yuvalar: onluk ve birlik
  const yuvalar: readonly Yuva[] = [
    { id: 'yuva-onluk', konum: { x: 0.3, y: 0.5 }, bekleyen: 'gorsel' },
    { id: 'yuva-birlik', konum: { x: 0.7, y: 0.5 }, bekleyen: 'gorsel' },
  ];

  const prompt: Prompt = {
    ses: { kind: 'key', key: sayiKey(hedef) },
    gorsel: { type: 'rakam', sayi: hedef },
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: sayiKey(hedef) },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: [dogruOnlukId, dogruBirlikId],
  });

  return {
    kind: 'TAP_TO_PLACE',
    itemId: makeItemId(ONLUK_COZUMLE_TEMPLATE_ID, seed, String(hedef)),
    templateId: ONLUK_COZUMLE_TEMPLATE_ID,
    skillIds: ['mat.sayi.onluk-birlik'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.2', 'MAT.1.1.1'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 15,
    prompt,
    hints,
    assets,
    options,
    yuvalar,
    validation: {
      mod: 'yerlesim',
      dogruEslesme: {
        'yuva-onluk': dogruOnlukId,
        'yuva-birlik': dogruBirlikId,
      },
      siraOnemli: false,
    },
    seed,
  };
}

export const onlukCozumleGenerator: ExerciseGenerator<OnlukCozumleParams> = {
  templateId: ONLUK_COZUMLE_TEMPLATE_ID,
  kind: 'TAP_TO_PLACE',
  karsilananKazanimlar: ['MAT.1.1.2', 'MAT.1.1.1'],
  karsilananSkillIds: ['mat.sayi.onluk-birlik'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.ONLUK_BOZMA, HATA_ETIKETLERI.KARDINALITE],
  uret: onlukCozumleUret,
};
