/**
 * M-PARA-SIRALA — BANKNOT SIRALAMA
 * ====================================================================
 * KAZANIM: MAT.1.1.9 — Banknotları değer büyüklüğüne göre sırala.
 * ÇELDİRİCİ: PARA_BOYUT_DEGER, BUYUKLUK_MIKTAR
 * ETKİLEŞİM: SEQUENCE_ORDER — banknot kartlarını küçükten büyüğe
 * (veya büyükten küçüğe) sırala.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Option, type VisualSpec, type AssetSpec, type Prompt } from '../types';
import type { SequenceOrderExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';
import type { SpeechKey } from '../../audio/audioManifest.generated';

export const PARA_SIRALA_TEMPLATE_ID = 'M-PARA-SIRALA' as const;

// 1 TL madeni paradır; bu şablon yalnız resmî örnek görseli bulunan banknotları üretir.
const BANKNOTLAR = [5, 10, 20, 50, 100, 200] as const;
type BanknotDeger = (typeof BANKNOTLAR)[number];

function banknotSesi(deger: BanknotDeger) {
  return { kind: 'sequence' as const, keys: [`sayi.${deger}` as SpeechKey, 'para.lira' as SpeechKey] };
}

export interface ParaSiralaParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function paraSiralaUret(params: ParaSiralaParams, rng: Rng): SequenceOrderExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('para');
  // Sıralanacak banknot sayısı: 3-5
  const adet = Math.min(2 + difficulty, 5);

  // Rastgele banknotlar seç — benzersiz değerler
  const secimRng = rng.fork('secim');
  const secilenler = secimRng.shuffle([...BANKNOTLAR]).slice(0, adet);

  // Sıralama yönü
  const kucuktenBuyuge = r.bool();

  // Doğru sıra
  const sirali = [...secilenler].sort((a, b) => kucuktenBuyuge ? a - b : b - a);
  const dogruSira = sirali.map((_, i) => `banknot-${i}`);

  // Options — doğru sırada kartlar
  const options: Option[] = secilenler.map((deger) => {
    const siradakiYer = sirali.indexOf(deger);
    const id = `banknot-${siradakiYer}`;
    const gorsel: VisualSpec = { type: 'banknot', deger };
    return {
      id,
      deger: { tur: 'gorsel' as const, gorsel },
      ses: banknotSesi(deger),
      correct: true,
    };
  });

  // Sıralama etkinliğinde her banknot doğru son sırada yer almalıdır.
  // Ek "yanlış" banknotlar, etkinliği sıralama yerine eleme sorusuna dönüştürür.

  const prompt: Prompt = {
    // Kartlar zaten seçenek alanında görünür; sıralanmış bir sahne göstermek cevabı açık ederdi.
    ses: { kind: 'key', key: kucuktenBuyuge ? 'para.sirala-kucukten' : 'para.sirala-buyukten' },
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: kucuktenBuyuge ? 'para.sirala-kucukten' : 'para.sirala-buyukten' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    vurgulaIds: dogruSira,
  });

  return {
    kind: 'SEQUENCE_ORDER',
    itemId: makeItemId(PARA_SIRALA_TEMPLATE_ID, seed, `${kucuktenBuyuge ? 'k' : 'b'}|${secilenler.join('-')}`),
    templateId: PARA_SIRALA_TEMPLATE_ID,
    skillIds: ['mat.para.deger-siralama'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.9'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 20,
    prompt, hints, assets, options,
    validation: { mod: 'siralama', dogruSira },
    seed,
  };
}

export const paraSiralaGenerator: ExerciseGenerator<ParaSiralaParams> = {
  templateId: PARA_SIRALA_TEMPLATE_ID,
  kind: 'SEQUENCE_ORDER',
  karsilananKazanimlar: ['MAT.1.1.9'],
  karsilananSkillIds: ['mat.para.deger-siralama'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.PARA_BOYUT_DEGER, HATA_ETIKETLERI.BUYUKLUK_MIKTAR],
  uret: paraSiralaUret,
};
