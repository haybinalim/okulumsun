/**
 * M-PARA-TANI — BANKNOT TANIMA
 * ====================================================================
 * KAZANIM: MAT.1.1.9 — Banknot tanıma (1, 5, 10, 20, 50, 100, 200 TL).
 * Toplama YASAK — kazanım sadece tanıma.
 * ÇELDİRİCİ: PARA_BOYUT_DEGER (büyük banknot = daha değerli sanma)
 * ETKİLEŞİM: AUDIO_TO_IMAGE — sesli "Kaç lira?" sorusu, banknot görseli seç.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type Option, type VisualSpec, type AssetSpec, type Prompt } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';
import type { SpeechKey } from '../../audio/audioManifest.generated';

export const PARA_TANI_TEMPLATE_ID = 'M-PARA-TANI' as const;

const BANKNOTLAR = [1, 5, 10, 20, 50, 100, 200] as const;
type BanknotDeger = (typeof BANKNOTLAR)[number];

function banknotKey(n: number): SpeechKey {
  // sayi.N klip'leri 0-100 arası mevcut; 200 için ayrı klip yok
  // ama tip güvenliği için SpeechKey cast yeterli
  return `sayi.${n}` as SpeechKey;
}

export interface ParaTaniParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function paraTaniUret(params: ParaTaniParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('para');
  // Difficulty arttıkça büyük banknotlar
  const maxIdx = Math.min(2 + difficulty * 2, BANKNOTLAR.length - 1);
  const hedef = r.pick(BANKNOTLAR.slice(0, maxIdx + 1));

  // Şık sayısı
  const sikSayisi = Math.min(2 + Math.floor((difficulty - 1) / 2), 4);

  // Yanlış seçenekler
  const celdiriciRng = rng.fork('celdirici');
  const yanlislar: BanknotDeger[] = [];
  const kullanilan = new Set<number>([hedef]);

  // PARA_BOYUT_DEGER: hedefe yakın banknot
  const hedefIdx = BANKNOTLAR.indexOf(hedef);
  const yakinlar = [BANKNOTLAR[hedefIdx - 1], BANKNOTLAR[hedefIdx + 1]].filter(
    (n) => n != null && !kullanilan.has(n),
  );
  if (yakinlar.length > 0) {
    const y = celdiriciRng.pick(yakinlar as BanknotDeger[]);
    yanlislar.push(y);
    kullanilan.add(y);
  }

  while (yanlislar.length < sikSayisi - 1) {
    const kalan = BANKNOTLAR.filter((n) => !kullanilan.has(n));
    if (kalan.length === 0) break;
    const y = celdiriciRng.pick(kalan);
    yanlislar.push(y);
    kullanilan.add(y);
  }

  const siraRng = rng.fork('sira');
  const tumSecenekler = [
    { dogru: true, deger: hedef },
    ...yanlislar.map((d) => ({ dogru: false, deger: d })),
  ];
  const karistirilmis = siraRng.shuffle(tumSecenekler);

  const options: Option[] = karistirilmis.map((sec, i) => {
    const id = `secenek-${i}`;
    const gorsel: VisualSpec = { type: 'banknot', deger: sec.deger };
    const etiket: HataEtiketi = HATA_ETIKETLERI.PARA_BOYUT_DEGER;
    return sec.dogru
      ? { id, deger: { tur: 'gorsel', gorsel }, correct: true }
      : { id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: etiket };
  });

  const dogruOptionId = options.find((o) => 'correct' in o && o.correct)?.id ?? options[0].id;

  const prompt: Prompt = {
    ses: { kind: 'sequence', keys: [banknotKey(hedef), 'para.lira'] as SpeechKey[] },
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'sequence', keys: [banknotKey(hedef), 'para.lira'] as SpeechKey[] },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [dogruOptionId],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(PARA_TANI_TEMPLATE_ID, seed, String(hedef)),
    templateId: PARA_TANI_TEMPLATE_ID,
    skillIds: ['mat.para.banknot-tanima'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.1.9'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 10,
    prompt, hints, assets, options,
    validation: { mod: 'tekSecim', dogruOptionId },
    seed,
  };
}

export const paraTaniGenerator: ExerciseGenerator<ParaTaniParams> = {
  templateId: PARA_TANI_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.1.9'],
  karsilananSkillIds: ['mat.para.banknot-tanima'],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.PARA_BOYUT_DEGER],
  uret: paraTaniUret,
};
