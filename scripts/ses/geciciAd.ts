/**
 * Üretim betiğinin GEÇİCİ klip dosyası soneki (`<ad>.yeni.m4a`). Tek tanım: üretim (`turDogrulama.ts`) ve yayın
 * (`yayin/dersVerisi.ts`) aynı sabiti kullanır; kill -9 sonrası arkada kalan geçici dosya yayına girmez.
 */
export const GECICI_KLIP_SONEKI = '.yeni.m4a';

/** `sozcuk/kale.m4a` → `sozcuk/kale.yeni.m4a`. */
export function geciciKlipYolu(hedef: string): string {
  return hedef.replace(/\.m4a$/, GECICI_KLIP_SONEKI);
}
