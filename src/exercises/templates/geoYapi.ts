/**
 * M-GEO-YAPI — YAPIDAKİ ŞEKİLLERİ BUL
 * ====================================================================
 * KAZANIM: MAT.1.3.4 — Ev/robot resmindeki şekilleri bul (hotspot).
 * ÇELDİRİCİ: SEKIL_PROTOTIP, EKSIK_SAYMA
 * ETKİLEŞİM: HOTSPOT_FIND — sahnedeki şekil bölgelerine dokun.
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type VisualSpec, type AssetSpec, type Prompt, type Bolge, type SekilAdi, type Renk } from '../types';
import type { HotspotFindExercise, ExerciseGenerator, HotspotOption } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';

export const GEO_YAPI_TEMPLATE_ID = 'M-GEO-YAPI' as const;

const SEKILLER: readonly SekilAdi[] = ['ucgen', 'kare', 'dikdortgen', 'cember'];
const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

export interface GeoYapiParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function geoYapiUret(params: GeoYapiParams, rng: Rng): HotspotFindExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('geo');
  // Hedef şekil — çocuk bu şekli sahnede bulacak
  const hedefSekil = r.pick(SEKILLER);

  // Sahne — bir yapı (ev/robot) içinde çeşitli şekiller
  // Difficulty arttıkça daha çok şekil
  const sekilSayisi = Math.min(3 + difficulty, 7);

  const renkRng = rng.fork('renk');
  const yerRng = rng.fork('yer');

  // En az 1 doğru hotspot olmalı
  const dogruSayisi = Math.max(1, Math.floor(sekilSayisi / 3));

  const hotspots: HotspotOption[] = [];
  const dogruIds: string[] = [];

  const kullanilanPos = new Set<string>();

  for (let i = 0; i < sekilSayisi; i++) {
    const sekil = i < dogruSayisi ? hedefSekil : r.pick(SEKILLER.filter((s) => s !== hedefSekil));
    const renk = renkRng.pick(RENKLER);

    // Rastgele pozisyon (0.1-0.9 arası, çakışmayı önle)
    let cx: number, cy: number;
    do {
      cx = 0.1 + yerRng.next() * 0.8;
      cy = 0.1 + yerRng.next() * 0.8;
    } while (kullanilanPos.has(`${Math.round(cx * 10)},${Math.round(cy * 10)}`));
    kullanilanPos.add(`${Math.round(cx * 10)},${Math.round(cy * 10)}`);

    const id = `hotspot-${i}`;
    const bolge: Bolge = { sekil: 'daire', cx, cy, r: 0.08 };
    const gorsel: VisualSpec = { type: 'sekil', sekil, renk };
    const isDogru = sekil === hedefSekil;

    if (isDogru) {
      dogruIds.push(id);
      hotspots.push({ id, deger: { tur: 'gorsel', gorsel }, correct: true, bolge });
    } else {
      hotspots.push({ id, deger: { tur: 'gorsel', gorsel }, correct: false, diagnosticTag: HATA_ETIKETLERI.SEKIL_PROTOTIP, bolge });
    }
  }

  // Sahne görseli — yapı (ev/robot)
  const sahneGorsel: VisualSpec = {
    type: 'sahne',
    parcalar: hotspots.map((h) => ({
      gorsel: (h.deger as { tur: 'gorsel'; gorsel: VisualSpec }).gorsel,
      konum: { x: (h.bolge as { cx: number; cy: number }).cx, y: (h.bolge as { cx: number; cy: number }).cy },
    })),
  };

  const prompt: Prompt = {
    ses: { kind: 'key', key: 'soru-geo.sekli-bul' },
    gorsel: sahneGorsel,
  };

  const assets: readonly AssetSpec[] = [
    { id: 'sahne', rol: 'sahne', gorsel: sahneGorsel, erisimBolgesi: 'serbest' },
  ];

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-geo.sekli-bul' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: hotspots.filter((o) => !o.correct).map((o) => o.id).slice(0, 1),
    vurgulaIds: dogruIds,
  });

  return {
    kind: 'HOTSPOT_FIND',
    itemId: makeItemId(GEO_YAPI_TEMPLATE_ID, seed, `${hedefSekil}|${sekilSayisi}|${dogruSayisi}`),
    templateId: GEO_YAPI_TEMPLATE_ID,
    skillIds: ['mat.geometri.yapidaki-sekiller'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.3.4'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 20,
    prompt, hints, assets,
    options: hotspots,
    validation: { mod: 'hotspot', dogruHotspotIds: dogruIds, hepsiGerekli: false },
    seed,
  };
}

export const geoYapiGenerator: ExerciseGenerator<GeoYapiParams> = {
  templateId: GEO_YAPI_TEMPLATE_ID,
  kind: 'HOTSPOT_FIND',
  karsilananKazanimlar: ['MAT.1.3.4'],
  karsilananSkillIds: ['mat.geometri.yapidaki-sekiller'],
  readingLoad: 0,
  zorlukAraligi: [2, 5],
  uretebildigiHatalar: [HATA_ETIKETLERI.SEKIL_PROTOTIP, HATA_ETIKETLERI.EKSIK_SAYMA],
  uret: geoYapiUret,
};
