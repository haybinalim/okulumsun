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
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const PARA_SIRALA_TEMPLATE_ID = 'M-PARA-SIRALA' as const;

const BANKNOTLAR = [1, 5, 10, 20, 50, 100, 200] as const;

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
      correct: true,
    };
  });

  // Yanlış kartlar — değer karıştırılmış
  const celdiriciRng = rng.fork('celdirici');
  const yanlisKartSayisi = Math.min(adet - 1, 2);
  const kullanilanDegerler = new Set(secilenler);

  for (let i = 0; i < yanlisKartSayisi; i++) {
    const yanlisDegerler = BANKNOTLAR.filter((n) => !kullanilanDegerler.has(n));
    if (yanlisDegerler.length === 0) break;
    const yd = celdiriciRng.pick(yanlisDegerler);
    kullanilanDegerler.add(yd);
    const id = `yanlis-${i}`;
    const gorsel: VisualSpec = { type: 'banknot', deger: yd };
    options.push({
      id,
      deger: { tur: 'gorsel' as const, gorsel },
      correct: false,
      diagnosticTag: HATA_ETIKETLERI.PARA_BOYUT_DEGER as HataEtiketi,
    });
  }

  // Sahne görseli — sıralama alanı
  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: sirali.map((d, i) => ({
      gorsel: { type: 'banknot', deger: d } as VisualSpec,
      konum: { x: 0.15 + i * (0.7 / Math.max(sirali.length - 1, 1)), y: 0.5 },
    })),
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: kucuktenBuyuge ? 'para.sirala-kucukten' : 'para.sirala-buyukten' },
    gorsel: sahneGorsel,
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
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
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
