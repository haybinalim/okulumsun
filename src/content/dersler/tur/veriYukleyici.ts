/**
 * Türkçe ders verisi yükleyicisi (ADR-0016): içerik JSON'ları JS'e gömülmez; bayraklı derlemede
 * `dist/tur/` altına kopyalanır (`scripts/yayin/dersVerisi.ts`) ve buradan AYNI KÖKENDEN, göreli yolla
 * okunur (CSP `connect-src 'self'`; okul sunucusu/alt dizin uyumlu, `base: './'`). Dış adres, `..` ve
 * mutlak yol reddedilir. K9 taraması bu dosyadaki `fetch`'e yalnız `TUR_VERI_KOKU` ile izin verir.
 */

/** Uygulama köküne göre veri kökü (ADR-0016 `yayinYolu`). */
export const TUR_VERI_KOKU = './tur/';

const GECERLI_YOL = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*\.json$/;

/** Göreli veri yolunu doğrular; geçersizse hata (dış adres, `..`, mutlak yol, JSON olmayan dosya). */
export function turVeriYolu(dosya: string): string {
  if (!GECERLI_YOL.test(dosya)) throw new Error(`Geçersiz Türkçe veri yolu: ${dosya}`);
  return `${TUR_VERI_KOKU}${dosya}`;
}

export async function turVerisiniOku(dosya: string): Promise<unknown> {
  const yanit = await fetch(turVeriYolu(dosya), { credentials: 'same-origin' });
  if (!yanit.ok) throw new Error(`Türkçe veri okunamadı (${yanit.status}): ${dosya}`);
  return (await yanit.json()) as unknown;
}
