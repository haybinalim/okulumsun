/**
 * M-GEO-AYIR — YUVARLAK/KÖŞELİ AYIR
 * ====================================================================
 * KAZANIM: MAT.1.3.3 — Günlük nesneleri yuvarlak/köşeli ayır.
 * ÇELDİRİCİ: SEKIL_PROTOTIP, GOREV_ANLASILMADI
 * ETKİLEŞİM: HOTSPOT_FIND — yuvarlak nesnelere dokun (köşelileri seçme).
 * SAF VE SENKRON.
 */

import { makeItemId, varsayilanIpuclari, type Difficulty, type KazanimKodu, type SkillId, type VisualSpec, type AssetSpec, type Prompt, type Bolge, type SekilAdi, type Renk } from '../types';
import type { HotspotFindExercise, ExerciseGenerator, HotspotOption } from '../types';
import type { Rng } from '../rng';
import { HATA_ETIKETLERI } from '../distractors';

export const GEO_AYIR_TEMPLATE_ID = 'M-GEO-AYIR' as const;

const RENKLER: readonly Renk[] = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'];

export interface GeoAyirParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mod?: 'tahta' | 'kisisel';
}

export function geoAyirUret(params: GeoAyirParams, rng: Rng): HotspotFindExercise {
  const { seed, difficulty } = params;

  const r = rng.fork('geo');
  // Hedef kategori: yuvarlak mı köşeli mi?
  const hedefYuvarlakMi = r.bool();

  // Şekil havuzu
  const yuvarlakSekiller: SekilAdi[] = ['cember'];
  const koseliSekiller: SekilAdi[] = ['ucgen', 'kare', 'dikdortgen'];

  const hedefSekiller = hedefYuvarlakMi ? yuvarlakSekiller : koseliSekiller;
  const yanlisSekiller = hedefYuvarlakMi ? koseliSekiller : yuvarlakSekiller;

  // Nesne sayısı
  const nesneSayisi = Math.min(4 + difficulty, 8);
  const dogruSayisi = Math.max(1, Math.floor(nesneSayisi / 2));

  const renkRng = rng.fork('renk');
  const yerRng = rng.fork('yer');

  const hotspots: HotspotOption[] = [];
  const dogruIds: string[] = [];
  const kullanilanPos = new Set<string>();

  for (let i = 0; i < nesneSayisi; i++) {
    const isDogru = i < dogruSayisi;
    const sekil = isDogru
      ? r.pick(hedefSekiller)
      : r.pick(yanlisSekiller);
    const renk = renkRng.pick(RENKLER);

    let cx: number, cy: number;
    do {
      cx = 0.1 + yerRng.next() * 0.8;
      cy = 0.1 + yerRng.next() * 0.8;
    } while (kullanilanPos.has(`${Math.round(cx * 10)},${Math.round(cy * 10)}`));
    kullanilanPos.add(`${Math.round(cx * 10)},${Math.round(cy * 10)}`);

    const id = `hotspot-${i}`;
    const bolge: Bolge = { sekil: 'daire', cx, cy, r: 0.08 };
    const gorsel: VisualSpec = { type: 'sekil', sekil, renk };

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
    ses: { kind: 'key', key: hedefYuvarlakMi ? 'soru-geo.yuvarlak-mi-koseli-mi' : 'soru-geo.yuvarlak-mi-koseli-mi' },
    gorsel: sahneGorsel,
  };

  const assets: readonly AssetSpec[] = [
    { id: 'sahne', rol: 'sahne', gorsel: sahneGorsel, erisimBolgesi: 'serbest' },
  ];

  const hints = varsayilanIpuclari({
    talimatSesi: { kind: 'key', key: 'soru-geo.yuvarlak-mi-koseli-mi' },
    k2Ses: { kind: 'key', key: 'yardim.k2-eleme' },
    eleOptionIds: hotspots.filter((o) => !o.correct).map((o) => o.id).slice(0, 1),
    vurgulaIds: dogruIds,
  });

  return {
    kind: 'HOTSPOT_FIND',
    itemId: makeItemId(GEO_AYIR_TEMPLATE_ID, seed, `${hedefYuvarlakMi ? 'yuvarlak' : 'koseli'}|${nesneSayisi}|${dogruSayisi}`),
    templateId: GEO_AYIR_TEMPLATE_ID,
    skillIds: ['mat.geometri.yuvarlak-koseli'] as readonly SkillId[],
    kazanimKodlari: ['MAT.1.3.3'] as readonly KazanimKodu[],
    readingLoad: 0,
    difficulty,
    estimatedSec: 15,
    prompt, hints, assets,
    options: hotspots,
    validation: { mod: 'hotspot', dogruHotspotIds: dogruIds, hepsiGerekli: false },
    seed,
  };
}

export const geoAyirGenerator: ExerciseGenerator<GeoAyirParams> = {
  templateId: GEO_AYIR_TEMPLATE_ID,
  kind: 'HOTSPOT_FIND',
  karsilananKazanimlar: ['MAT.1.3.3'],
  karsilananSkillIds: ['mat.geometri.yuvarlak-koseli'],
  readingLoad: 0,
  zorlukAraligi: [1, 4],
  uretebildigiHatalar: [HATA_ETIKETLERI.SEKIL_PROTOTIP, HATA_ETIKETLERI.GOREV_ANLASILMADI],
  uret: geoAyirUret,
};
