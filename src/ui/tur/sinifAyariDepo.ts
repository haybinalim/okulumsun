import { DERS_TUR_SINIF_ANAHTARI } from '../../persistence/depolamaIzinListesi';
import { sinifAyariCoz, sinifAyariYaz, type SinifAyari } from '../../content/dersler/tur/sinifAyari';

/**
 * K-7 SINIF AYARI DEPOSU (Okuma Yazma Adım 71; ADR-0002 Ek 1) — YALNIZ `VITE_DERS_TUR=1` derlemesinde.
 *
 * Tek `localStorage` anahtarı; değer öğretilen harf kümesi kodu ve günün akışı sırası (öğrenci verisi değil). Yalnız
 * öğretmen bir ayarı değiştirince yazılır; açılışta okunur. Eve link (`?ev=`) ile açılan cihazda (veli/çocuk) ne okunur
 * ne yazılır: orada küme yalnız adresten gelir. Depolama erişilemezse (gizli sekme, kota) sessizce bellekte kalınır.
 * `npm run gizlilik:tara` bu anahtarın yalnız bu dosyada yazılmasına izin verir.
 */
export function evKipiMi(arama: string = typeof location === 'undefined' ? '' : location.search): boolean {
  return new URLSearchParams(arama).has('ev');
}

export function sinifAyariOku(): SinifAyari {
  if (evKipiMi() || typeof localStorage === 'undefined') return {};
  try {
    return sinifAyariCoz(localStorage.getItem(DERS_TUR_SINIF_ANAHTARI)) ?? {};
  } catch {
    return {};
  }
}

export function sinifAyariGuncelle(degisiklik: SinifAyari): void {
  if (evKipiMi() || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DERS_TUR_SINIF_ANAHTARI, sinifAyariYaz({ ...sinifAyariOku(), ...degisiklik }));
  } catch {
    // Depolama kapalıysa ayar yalnız bu oturumda (bellekte ve adreste) kalır.
  }
}

/** Öğretmen "Sınıf ayarını sil" derse anahtar kaldırılır. */
export function sinifAyariSil(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(DERS_TUR_SINIF_ANAHTARI);
  } catch {
    // yok sayılır
  }
}
