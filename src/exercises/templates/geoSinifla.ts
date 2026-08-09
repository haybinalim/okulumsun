/**
 * M-GEO-SINIFLA — ŞEKİL SINIFLANDIRMA
 * ====================================================================
 * KAZANIM: MAT.1.3.5 — Şekilleri sınıfla; öğelerin ≥%40'ı döndürülmüş.
 * ÇELDİRİCİ: SEKIL_PROTOTIP
 * ETKİLEŞİM: HOTSPOT_FIND — hedef şekil türündeki tüm şekillere dokun.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type VisualSpec, type AssetSpec, type Prompt, type Bolge, type SekilAdi, type Renk } from '../types';
import type { HotspotFindExercise, ExerciseGenerator, HotspotOption } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';

export const GEO_SINIFLA_TEMPLATE_ID = 'M-GEO-SINIFLA' as const;

const SEKILLER: readonly SekilAdi[] = ['ucgen', 'kare', 'dikdortgen', 'cember'];
const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

export interface GeoSiniflaParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function geoSiniflaUret(params: GeoSiniflaParams, rng: Rng): HotspotFindExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('geo');
  const hedefSekil = r.pick(SEKILLER);

  // Toplam şekil sayısı
  const toplamSekil = Math.min(4 + difficulty, 8);
  const dogruSayisi = Math.max(2, Math.floor(toplamSekil * 0.4));

  const renkRng = rng.fork('renk');
  const yerRng = rng.fork('yer');
  const donderRng = rng.fork('donder');

  const hotspots: HotspotOption[] = [];
  const dogruIds: string[] = [];
  const kullanilanPos = new Set<string>();

  for (let i = 0; i < toplamSekil; i++) {
    const isDogru = i < dogruSayisi;
    const sekil = isDogru
      ? hedefSekil
      : r.pick(SEKILLER.filter((s) => s !== hedefSekil));
    const renk = renkRng.pick(RENKLER);

    // Difficulty ≥4: döndürülmüş şekiller (prototip hatasını düzelt)
    const dondur = difficulty >= 4 && donderRng.bool();

    let cx: number, cy: number;
    do {
      cx = 0.1 + yerRng.next() * 0.8;
      cy = 0.1 + yerRng.next() * 0.8;
    } while (kullanilanPos.has(`${Math.round(cx * 10)},${Math.round(cy * 10)}`));
    kullanilanPos.add(`${Math.round(cx * 10)},${Math.round(cy * 10)}`);

    const id = `hotspot-${i}`;
    const bolge: Bolge = { sekil: 'daire', cx, cy, r: 0.08 };
    const gorsel: VisualSpec = { type: 'sekil', sekil, renk, ...(dondur ? { dondur: true } : {}) };

    if (isDogru) {
      dogruIds.push(id);
      hotspots.push({ id, deger: { tur: 'gorsel', gorsel }, correct: true, bolge });
    } else {
      hotspots.push({ id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: HATA_ETIKETLERI.SEKIL_PROTOTIP, bolge });
    }
  }

  // Karıştır
  const siraRng = rng.fork('sira');
  const karistirilmis = siraRng.shuffle([...hotspots]);
  hotspots.splice(0, hotspots.length, ...karistirilmis);

  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: hotspots.map((h) => ({
      gorsel: (h.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
      konum: { x: (h.bolge as { cx: number; cy: number }).cx, y: (h.bolge as { cx: number; cy: number }).cy },
    })),
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-geo.siniflandir' },
    gorsel: sahneGorsel,
  };

  const assets: readonly AssetSpec[] = [
    { id: 'sahne', rol: 'sahne', gorsel: sahneGorsel, erisimBolgesi: 'serbest' },
  ];

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-geo.siniflandir' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: hotspots.filter((o) => !o.correct).map((o) => o.id).slice(0, 1),
    vurgulaIds: dogruIds,
  });

  // Skill: dondurulmus-sekil (difficulty ≥4)
  const skillId: SkillId = 'mat.geometri.dondurulmus-sekil';

  return {
    kind: 'HOTSPOT_FIND',
    itemId: makeItemId(GEO_SINIFLA_TEMPLATE_ID, seed, `${hedefSekil}|${toplamSekil}|${dogruSayisi}${difficulty >= 4 ? '|don' : ''}`),
    templateId: GEO_SINIFLA_TEMPLATE_ID,
    skillIds: [skillId] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.3.5'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 20,
    prompt, hints, assets,
    options: hotspots,
    validation: { mod: 'hotspot', dogruHotspotIds: dogruIds, hepsiGerekli: true },
    seed,
  };
}

export const geoSiniflaGenerator: ExerciseGenerator<GeoSiniflaParams> = {
  templateId: GEO_SINIFLA_TEMPLATE_ID,
  kind: 'HOTSPOT_FIND',
  karsilananKazanimlar: ['MAT.1.3.5'],
  karsilananSkillIds: ['mat.geometri.dondurulmus-sekil'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.SEKIL_PROTOTIP],
  uret: geoSiniflaUret,
};
