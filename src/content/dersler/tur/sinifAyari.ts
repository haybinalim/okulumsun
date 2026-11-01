/**
 * SINIF DÜZEYİ AYAR — öğretilen harfler + günün akışı sırası (Okuma Yazma planı K-7, Adım 71; ADR-0002 Ek 1). SAF.
 *
 * Tek yerel anahtarın (`DERS_TUR_SINIF_ANAHTARI`) değeri. Öğrenci verisi DEĞİLDİR: ad, cevap, ilerleme, süre veya
 * "kaldığı harf" yoktur; yalnız sınıfın öğretmence seçilmiş harf kümesi kodu (`?tur=` ile aynı base36 kodu) ve
 * akış sırası. Değer küçük ve katı biçimlidir; bozuk ya da fazladan alanlı değer yok sayılır (varsayılana dönülür).
 */
import { kumeCoz, kumeKodla } from './ogretilenKume';
import { akisSirasiCoz } from './gununAkisi';

export interface SinifAyari {
  /** Öğretilen küme kodu (`kumeKodla`). */
  readonly kume?: string;
  /** Günün akışı sırası ("12345678" gibi). */
  readonly akis?: string;
}

export const SINIF_AYARI_SURUMU = 1;
const EN_UZUN = 80;
const ALANLAR = new Set(['v', 'kume', 'akis']);

export function sinifAyariCoz(ham: string | null | undefined): SinifAyari | null {
  if (typeof ham !== 'string' || ham.length === 0 || ham.length > EN_UZUN) return null;
  let v: unknown;
  try {
    v = JSON.parse(ham);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  if (o.v !== SINIF_AYARI_SURUMU || !Object.keys(o).every((k) => ALANLAR.has(k))) return null;
  const sonuc: { kume?: string; akis?: string } = {};
  if (o.kume !== undefined) {
    if (typeof o.kume !== 'string' || !kumeCoz(o.kume)) return null;
    sonuc.kume = o.kume;
  }
  if (o.akis !== undefined) {
    if (!akisSirasiCoz(o.akis)) return null;
    sonuc.akis = o.akis as string;
  }
  return sonuc;
}

export function sinifAyariYaz(a: SinifAyari): string {
  const o: Record<string, unknown> = { v: SINIF_AYARI_SURUMU };
  const kume = a.kume === undefined ? null : kumeCoz(a.kume);
  if (kume) o.kume = kumeKodla(kume);
  if (a.akis !== undefined && akisSirasiCoz(a.akis)) o.akis = a.akis;
  return JSON.stringify(o);
}
