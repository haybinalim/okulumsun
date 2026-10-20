/** Kâğıt metninin TemelYazi karşılığı (KG-98); KagitSayfalari.tsx'ten ayrıldı (bileşen dosyası yalnız bileşen dışa aktarır). */

/*
 * KG-98: kâğıt metni yalnız TemelYazi'de olan karakterleri kullanır (· – — … yok); yoksa sayfa Andika
 * dosyası indirir ve o karakter başka yazı tipiyle basılır. Ayraç virgül.
 */
export const KAGIT_ALT_YAZI = 'okulumsun, MEB 2024 1. sınıf matematik';
/** Altbilgideki kazanım kodları ayracı (KG-98; eskiden ' · '). */
export const KAGIT_AYRAC = ', ';

/**
 * Basılan metin için TemelYazi karşılığı (KG-98): '…' → '...', '–'/'—' → '-', '·' → ','. YALNIZ görüntüde;
 * kâğıt planı (yönerge, cevap "2–A") değişmez, böylece kâğıt kodu ve `kagitMetinOzeti` (arşiv/etki formu
 * kimliği) aynı kalır.
 */
export function kagitYazisi(metin: string): string {
  return metin.replace(/…/g, '...').replace(/[–—]/g, '-').replace(/ ?· ?/g, ', ');
}
