/**
 * M-GEO-ESLE — NESNE-ŞEKİL EŞLEŞTİRME
 * ====================================================================
 * KAZANIM: MAT.1.3.3 — Nesneyi biçimce benzediği şekille eşle.
 * ÇELDİRİCİ: SEKIL_PROTOTIP, GOREV_ANLASILMADI
 * ETKİLEŞİM: MATCH_PAIRS — sol: nesne, sağ: şekil. Eşleşeni bul.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type VisualSpec, type AssetSpec, type Prompt, type EslesmeKarti, type SekilAdi, type NesneSprite, type Renk } from '../types';
import type { MatchPairsExercise, ExerciseGenerator } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI, type HataEtiketi } from '../distractors';

export const GEO_ESLE_TEMPLATE_ID = 'M-GEO-ESLE' as const;

const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

/** Nesne → şekil eşlemesi (prototipik benzerlik). */
const NESNE_SEKIL_ESLEME: Readonly<Record<NesneSprite, SekilAdi>> = {
  top: 'cember',
  balon: 'cember',
  balik: 'cember',
  elma: 'cember',
  kalem: 'dikdortgen',
  araba: 'dikdortgen',
  cicek: 'cember',
  kus: 'ucgen',
  yildiz: 'ucgen',
  kelebek: 'dikdortgen',
};

const NESNELER = Object.keys(NESNE_SEKIL_ESLEME) as readonly NesneSprite[];
const SEKILLER: readonly SekilAdi[] = ['ucgen', 'kare', 'dikdortgen', 'cember'];

export interface GeoEsleParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function geoEsleUret(params: GeoEsleParams, rng: Rng): MatchPairsExercise {
  const { seed, difficulty } = params;

  // Çift sayısı: 2-3
  const ciftSayisi = Math.min(1 + difficulty, 3);

  // Nesne seç
  const secimRng = rng.fork('secim');
  const secilenNesneler = secimRng.shuffle([...NESNELER]).slice(0, ciftSayisi);

  // Doğru şekiller
  const dogruSekiller = secilenNesneler.map((n) => NESNE_SEKIL_ESLEME[n]);

  // Yanlış şekiller — doğru olmayanlardan seç
  const yanlisSekilHavuzu = SEKILLER.filter((s) => !dogruSekiller.includes(s));

  const renkRng = rng.fork('renk');
  const celdiriciRng = rng.fork('celdirici');

  const solKartlar: EslesmeKarti[] = [];
  const sagKartlar: EslesmeKarti[] = [];
  const ciftler: (readonly [string, string])[] = [];

  for (let i = 0; i < ciftSayisi; i++) {
    const nesne = secilenNesneler[i];
    const dogruSekil = dogruSekiller[i];
    const renk = renkRng.pick(RENKLER);

    const solId = `sol-${i}`;
    const sagId = `sag-${i}`;

    solKartlar.push({
      id: solId,
      taraf: 'sol',
      deger: { tur: 'gorsel', gorsel: { type: 'nesneKumesi', sprite: nesne, adet: 1, layout: 'sira', renk } },
      correct: true,
    });

    sagKartlar.push({
      id: sagId,
      taraf: 'sag',
      deger: { tur: 'gorsel', gorsel: { type: 'sekil', sekil: dogruSekil, renk } },
      correct: true,
    });

    ciftler.push([solId, sagId] as const);
  }

  // Yanlış sağ kartlar — farklı şekiller
  const yanlisKartSayisi = Math.min(ciftSayisi, 2);
  for (let i = 0; i < yanlisKartSayisi; i++) {
    if (yanlisSekilHavuzu.length === 0) break;
    const yanlisSekil = celdiriciRng.pick(yanlisSekilHavuzu);
    yanlisSekilHavuzu.splice(yanlisSekilHavuzu.indexOf(yanlisSekil), 1);
    const renk = renkRng.pick(RENKLER);
    const id = `yanlis-sag-${i}`;
    sagKartlar.push({
      id,
      taraf: 'sag',
      deger: { tur: 'gorsel', gorsel: { type: 'sekil', sekil: yanlisSekil, renk } },
      correct: false,
      diagnosticTag: HATA_ETIKETLERI.SEKIL_PROTOTIP as HataEtiketi,
    });
  }

  // Karıştır
  const siraRng = rng.fork('sira');
  const karistikSol = siraRng.shuffle([...solKartlar]);
  const karistikSag = siraRng.shuffle([...sagKartlar]);

  const options = [...karistikSol, ...karistikSag];

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-geo.esleseni-bul' },
  };

  const assets: readonly AssetSpec[] = options.map((o) => ({
    id: o.id,
    rol: 'secenek' as const,
    gorsel: (o.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
    erisimBolgesi: 'alt65' as const,
  }));

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-geo.esleseni-bul' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: options.filter((o) => !('correct' in o && o.correct)).map((o) => o.id),
    vurgulaIds: ciftler.flat(),
  });

  return {
    kind: 'MATCH_PAIRS',
    itemId: makeItemId(GEO_ESLE_TEMPLATE_ID, seed, secilenNesneler.join('|')),
    templateId: GEO_ESLE_TEMPLATE_ID,
    skillIds: ['mat.geometri.yuvarlak-koseli'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.3.3'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 20,
    prompt, hints, assets, options,
    validation: { mod: 'eslestirme', ciftler },
    seed,
  };
}

export const geoEsleGenerator: ExerciseGenerator<GeoEsleParams> = {
  templateId: GEO_ESLE_TEMPLATE_ID,
  kind: 'MATCH_PAIRS',
  karsilananKazanimlar: ['MAT.1.3.3'],
  karsilananSkillIds: ['mat.geometri.yuvarlak-koseli'],
  readingLoad: 0,
  zorlukAraligi: [1, 4],
  uretebildigiHatalar: [HATA_ETIKETLERI.SEKIL_PROTOTIP, HATA_ETIKETLERI.GOREV_ANLASILMADI],
  uret: geoEsleUret,
};
