/**
 * Türkçe alfabe, harf grupları ve tr-TR büyük/küçük yardımcıları (Okuma Yazma planı Adım 62;
 * `docs/mufredat-kisitlari-turkce.md` §2, K-OY-01). SAF.
 *
 * Türkçede noktalı/noktasız i iki ayrı harftir: i ↔ İ, ı ↔ I. `String.prototype.toUpperCase()` "i"yi "I" yapar
 * (yanlış); bu yüzden her dönüşüm tr-TR yerel ayarıyla yapılır.
 */

/** İçerik dosyalarındaki `programSurumu` (MEB TYMM 2026 Türkçe programı, 2 Eylül 2026 baskısı). */
export const PROGRAM_SURUMU = 'tymm-turkce-2026-09-02';

/** Alfabe sırası (29 harf). */
export const ALFABE = [
  'a', 'b', 'c', 'ç', 'd', 'e', 'f', 'g', 'ğ', 'h', 'ı', 'i', 'j', 'k', 'l',
  'm', 'n', 'o', 'ö', 'p', 'r', 's', 'ş', 't', 'u', 'ü', 'v', 'y', 'z',
] as const; // prettier-ignore

export type Harf = (typeof ALFABE)[number];

/** Program Şekil 1: öğretim sırası ve harf grupları. */
export const HARF_GRUPLARI: readonly (readonly Harf[])[] = [
  ['a', 'n', 'e', 't', 'i', 'l'],
  ['o', 'k', 'u', 'r', 'ı', 'm'],
  ['ü', 's', 'ö', 'y', 'd', 'z'],
  ['ç', 'b', 'g', 'c', 'ş'],
  ['p', 'h', 'v', 'ğ', 'f', 'j'],
];

/** Öğretim sırasıyla 29 harf. */
export const OGRETIM_SIRASI: readonly Harf[] = HARF_GRUPLARI.flat();

export const UNLULER: ReadonlySet<string> = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü']);
/** Düzeltme işaretli ünlüler (hecelemede ünlü sayılır; öğretim envanterinde yoktur). */
const SAPKALI_UNLULER: ReadonlySet<string> = new Set(['â', 'î', 'û']);

export const trKucuk = (s: string): string => s.toLocaleLowerCase('tr-TR');
export const trBuyuk = (s: string): string => s.toLocaleUpperCase('tr-TR');

/** Tek karakter Türkçe harf mi (büyük ya da küçük; şapkalılar dahil değil). */
export function harfMi(ch: string): boolean {
  return (ALFABE as readonly string[]).includes(trKucuk(ch)) && ch.length === 1;
}

/** Tek karakter büyük harf mi (tr-TR). */
export function buyukMu(ch: string): boolean {
  return harfMi(ch) && trBuyuk(ch) === ch && trKucuk(ch) !== ch;
}

/** Ünlü mü (büyük/küçük, şapkalılar dahil). */
export function unluMu(ch: string): boolean {
  const k = trKucuk(ch);
  return UNLULER.has(k) || SAPKALI_UNLULER.has(k);
}

export function unsuzMu(ch: string): boolean {
  return harfMi(ch) && !unluMu(ch);
}

/** Harfin öğretim grubu (1–5). */
export function harfGrubu(harf: string): number {
  const k = trKucuk(harf);
  const i = HARF_GRUPLARI.findIndex((g) => (g as readonly string[]).includes(k));
  if (i < 0) throw new Error(`Türkçe harf değil: ${harf}`);
  return i + 1;
}

/** Metnin harfleri (boşluk ve noktalama atılır), özgün büyük/küçük biçimiyle. */
export function harfleri(metin: string): string[] {
  return [...metin].filter(harfMi);
}

/** Yalnız ünsüzlerden oluşan (en az bir harfli) metin mi — tek başına ünsüz sesletimi (K-OY-03). */
export function yalnizUnsuzMu(metin: string): boolean {
  const h = [...metin].filter((c) => harfMi(c) || SAPKALI_UNLULER.has(trKucuk(c)));
  return h.length > 0 && h.every((c) => !unluMu(c));
}
