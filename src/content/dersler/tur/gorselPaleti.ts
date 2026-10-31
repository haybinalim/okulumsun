/**
 * Türkçe sözcük görsellerinin paleti (Okuma Yazma planı §2.4.8, Adım 68). SAF.
 *
 * Görseller statik SVG'dir (ADR-0016) ama matematik nesneleriyle (`src/ui/svg/Sprite.tsx`) aynı stilde çizilir:
 * temel renk + `nesneTonlari` ile türetilen gölge, ışık ve kontur (`docs/tasarim/nesne-cizim-rehberi.md`).
 * `NESNE_TEMEL` matematik sprite'larının doğal renkleri ve parça renkleriyle bayt bayt aynıdır (test); `TUR_EK`
 * yalnız Türkçe sözcükler için eklenen temel renklerdir (ten, saç, toprak, taş…). Her SVG yalnız bu temellerden
 * ve türetilmiş tonlarından boyanır (`gorselDenetimi.ts`). Bu modül çalışma anı paketine girmez (üretici ve CI).
 */
import { nesneTonlari } from '../../../ui/svg/renkTonlari';

/** Matematik nesnelerinin doğal renkleri ve parça renkleri (Sprite.tsx DOGAL_RENK + PARCA). */
export const NESNE_TEMEL = {
  elma: '#D4334A',
  top: '#2563EB',
  balon: '#DB2777',
  araba: '#059669',
  kalem: '#CA8A04',
  kus: '#0EA5E9',
  cicek: '#EC4899',
  yildiz: '#EAB308',
  balik: '#EA580C',
  kelebek: '#7C3AED',
  yaprak: '#4C9A3F',
  sap: '#7A4A26',
  krem: '#FFF6E2',
  cam: '#D5ECF6',
  lastik: '#3A3D44',
  jant: '#C9CFD8',
  far: '#FFD978',
  ahsap: '#F1C98E',
  grafit: '#3B3B3B',
  metal: '#BCC4CF',
  silgi: '#F2A0B6',
  gaga: '#F4A62A',
  gobek: '#F2B33D',
  govde: '#4A3426',
  murekkep: '#2B2B2B',
} as const;

/** Türkçe görsellerinde eklenen temel renkler (gri tonda da ayrışacak parlaklıkta). */
export const TUR_EK = {
  ten: '#E2A776',
  sac: '#5B3A24',
  agir: '#C7CBD1',
  toprak: '#9A6B43',
  at: '#A8683A',
  et: '#E8858A',
  nane: '#3FA34D',
  kumas: '#5B8DEF',
  beyaz: '#F7F7F2',
  tas: '#A3A9B3',
  gok: '#9CC9E8',
  sari: '#F6C445',
  koyuYesil: '#2F7D45',
  kakao: '#7A4B2E',
} as const;

export const TUR_TEMEL: Readonly<Record<string, string>> = { ...NESNE_TEMEL, ...TUR_EK };

/** SVG'de izin verilen bütün renkler: temeller + türetilmiş tonları + zemin gölgesi mürekkebi + beyaz. */
export function izinliRenkler(): ReadonlySet<string> {
  const k = new Set<string>(['#2B2B2B', '#FFFFFF', '#FFF']);
  for (const hex of Object.values(TUR_TEMEL)) {
    const t = nesneTonlari(hex);
    for (const r of [hex, t.temel, t.golge, t.isik, t.kontur]) k.add(r.toUpperCase());
  }
  return k;
}
