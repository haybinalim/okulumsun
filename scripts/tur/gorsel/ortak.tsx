/**
 * Türkçe sözcük görselleri — ortak çizim yardımcıları (Okuma Yazma planı §2.4.8, Adım 68).
 *
 * Matematik nesneleriyle aynı stil (`docs/tasarim/nesne-cizim-rehberi.md`): `Govde` (temel + sağ alt gölge hilali
 * + sol üst ışık + koyu kontur, maske yok), `Parca`, `Zemin`; tonlar `nesneTonlari` ile paletten (`gorselPaleti.ts`).
 * Yalnız üretici (`scripts/tur/gorsel-uret.tsx`) kullanır; çalışma anı paketine girmez.
 */
import type { ReactNode } from 'react';
import { Govde, Parca, Zemin } from '../../../src/ui/svg/Govde';
import { nesneTonlari } from '../../../src/ui/svg/renkTonlari';
import { INCE, KONTUR, daire, yuvarlakDikdortgen, aynala } from '../../../src/ui/svg/cizimYardimcilari';
import { TUR_TEMEL } from '../../../src/content/dersler/tur/gorselPaleti';

export { Zemin, daire, yuvarlakDikdortgen, aynala, INCE, KONTUR };

export type Risk = 'dusuk' | 'orta' | 'yuksek';

/** Kimlik üreticisi: aynı dosyada her gövdeye tek kırpma kimliği. */
export type K = () => string;

export interface GorselTanimi {
  /** ASCII kimlik (ı → i), dosya adı. */
  readonly id: string;
  readonly sozcuk: string;
  readonly taslakNo: number;
  readonly aciklama: string;
  readonly risk: Risk;
  readonly ciz: (k: K) => ReactNode;
}

export interface ResimsizTanimi {
  readonly sozcuk: string;
  readonly taslakNo: number;
  readonly neden: string;
}

/** Paletteki temel rengin hex değeri. */
export function renk(ad: string): string {
  const r = TUR_TEMEL[ad];
  if (!r) throw new Error(`palette yok: ${ad}`);
  return r;
}

export const ton = (ad: string) => nesneTonlari(renk(ad));

/** Gölgeli gövde (paletten renk adıyla). */
export function G({
  d,
  r,
  k,
  ofset,
  sw,
  ic,
  isik,
}: {
  d: string;
  r: string;
  k: K;
  ofset?: number;
  sw?: number;
  ic?: ReactNode;
  isik?: ReactNode;
}) {
  return <Govde d={d} t={ton(r)} k={k()} ofset={ofset} sw={sw} ic={ic} isik={isik} />;
}

/** Tek tonlu parça: renk adı, kontur aynı rengin koyusu. `t` ile türetilmiş ton seçilir. */
export function P({ d, r, t = 'temel', sw }: { d: string; r: string; t?: 'temel' | 'golge' | 'isik'; sw?: number }) {
  const n = ton(r);
  return <Parca d={d} fill={n[t]} kontur={n.kontur} sw={sw} />;
}

/** Dolgusuz çizgi (renk adı + ton). */
export function C({
  d,
  r,
  t = 'kontur',
  w = INCE,
}: {
  d: string;
  r: string;
  t?: 'temel' | 'golge' | 'isik' | 'kontur';
  w?: number;
}) {
  return <path d={d} fill="none" stroke={ton(r)[t]} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
}

/** Konturlu tek tonlu yuvarlak (göz bebeği, düğme…). */
export function D({ x, y, rr, r, t = 'temel' }: { x: number; y: number; rr: number; r: string; t?: 'temel' | 'kontur' | 'golge' | 'isik' }) {
  const n = ton(r);
  return <circle cx={x} cy={y} r={rr} fill={n[t]} />;
}

/** Işık parıltısı (gövdeye kırpılmış `isik` katmanı için). */
export function Isik({ d, r }: { d: string; r: string }) {
  return <path d={d} fill={ton(r).isik} />;
}

/** Basit yüz: iki göz + gülümseme (kişi çizimlerinde; ifade nötr-sıcak). */
export function Yuz({ x, y, o = 1 }: { x: number; y: number; o?: number }) {
  const m = ton('ten').kontur;
  const gx = 4.2 * o;
  return (
    <g>
      <circle cx={x - gx} cy={y - 1 * o} r={1.5 * o} fill={m} />
      <circle cx={x + gx} cy={y - 1 * o} r={1.5 * o} fill={m} />
      <path
        d={`M${x - 3 * o} ${y + 3 * o}Q${x} ${y + 5.6 * o} ${x + 3 * o} ${y + 3 * o}`}
        fill="none"
        stroke={m}
        strokeWidth={1.5 * o}
        strokeLinecap="round"
      />
    </g>
  );
}
