/**
 * M-TAHMIN-ISLEM — İŞLEM SONUCU TAHMİNİ
 * ====================================================================
 * KAZANIM: MAT.1.2.2 — Sonucu tahmin et, sonra zihinden doğrula.
 * ÇELDİRİCİ: BUYUKLUK_MIKTAR, ESIT_ISLEM_SONUCU
 * ETKİLEŞİM: AUDIO_TO_IMAGE. SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type VisualSpec, type AssetSpec, type Prompt } from '../types';
import type { AudioToImageExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';
import { sayisalCeldiricilerKesin, celdiricileriSikaCevir } from '../distractors';
import { sayExpression } from '../../audio/speech';
import { ISLEM_ARALIGI } from '../types';

export const TAHMIN_ISLEM_TEMPLATE_ID = 'M-TAHMIN-ISLEM' as const;

export interface TahminIslemParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function tahminIslemUret(params: TahminIslemParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;

  const sayiRng = rng.fork('sayilar');
  const islem: '+' | '-' = sayiRng.pick(['+', '-'] as const);
  const a = sayiRng.int(5, 15);
  const b = islem === '+' ? sayiRng.int(1, Math.min(ISLEM_ARALIGI.max - a, 5)) : sayiRng.int(1, Math.min(a - 1, 5));
  const sonuc = islem === '+' ? a + b : a - b;

  const sikSayisi = Math.min(3 + Math.floor((difficulty - 1) / 3), 4);

  const celdiriciRng = rng.fork('celdirici');
  const celdiriciler = sayisalCeldiricilerKesin(
    sonuc,
    [HATA_ETIKETLERI.BUYUKLUK_MIKTAR, HATA_ETIKETLERI.ESIT_ISLEM_SONUCU],
    { min: 0, max: ISLEM_ARALIGI.max },
    sikSayisi - 1,
    celdiriciRng,
    { baglam: { a, b, islem }, yedekStrateji: 'yakinKomsu' },
  );
  const siklar = celdiricileriSikaCevir(sonuc, celdiriciler, celdiriciRng);

  const talimat = sayExpression(a, islem, b);

  const prompt: Prompt = {
    ses: { kind: 'sequence', keys: [...(talimat as { keys: readonly unknown[] }).keys, 'tahmin.kac-tahmin'] as unknown as import('../../audio/audioManifest.generated').SpeechKey[] },
    gorsel: undefined,
  };

  const assets: readonly AssetSpec[] = siklar.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: { type: 'rakam', sayi: (o.deger as { tur: 'sayi'; sayi: number }).sayi } as VisualSpec,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: talimat,
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: siklar.filter((o) => !('correct' in o && o.correct)).map((o) => o.id).slice(0, 1),
    vurgulaIds: [`sik-d-${sonuc}`],
  });

  return {
    kind: 'AUDIO_TO_IMAGE',
    itemId: makeItemId(TAHMIN_ISLEM_TEMPLATE_ID, seed, `d${difficulty}|${a}${islem}${b}=${sonuc}`),
    templateId: TAHMIN_ISLEM_TEMPLATE_ID,
    skillIds: ['mat.toplama.tahmin-zihinden'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.2.2'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 15,
    prompt, hints, assets,
    options: siklar,
    validation: { mod: 'tekSecim', dogruOptionId: `sik-d-${sonuc}` },
    seed,
  };
}

export const tahminIslemGenerator: ExerciseGenerator<TahminIslemParams> = {
  templateId: TAHMIN_ISLEM_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: ['MAT.1.2.2'],
  karsilananSkillIds: ['mat.toplama.tahmin-zihinden'],
  readingLoad: 0,
  zorlukAraligi: [3, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.BUYUKLUK_MIKTAR, HATA_ETIKETLERI.ESIT_ISLEM_SONUCU],
  uret: tahminIslemUret,
};
