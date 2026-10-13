/**
 * Keşif Masası ekranının saf yardımcıları (plan v2 Adım 44 aşama 2). Bileşen dosyalarından ayrı
 * (hızlı yenileme kuralı); saat/depolama yok.
 */
import { doluSayisi, type KesifAraci, type KesifDurumu } from '../../kesif/kesifMasasi';

/** Bu aşamada ekranda olan araçlar (terazi ve ayır-birleştir aşama 3). */
export const EKRAN_ARACLARI: readonly { arac: KesifAraci; ad: string; ikon: string }[] = [
  { arac: 'onlukCerceve', ad: 'Onluk çerçeve', ikon: '▦' },
  { arac: 'nesneKumesi', ad: 'Nesneler', ikon: '●●●' },
  { arac: 'sayiDogrusu', ad: 'Sayı doğrusu', ikon: '0—10' },
];

/** Üst bölgede gösterilen sayı (gösterim; dokunulmaz). */
export function gosterilenSayi(d: KesifDurumu): number {
  switch (d.arac) {
    case 'onlukCerceve':
      return doluSayisi(d.dolu);
    case 'nesneKumesi':
      return d.sayi;
    case 'sayiDogrusu':
      return d.konum;
    case 'terazi':
      return d.sol;
    case 'ayirBirlestir':
      return d.toplam;
  }
}

/** Sayı doğrusu penceresi (11 nokta): konum ≤10 ise 0–10, değilse 10–20. */
export function pencereBaslangici(konum: number): number {
  return konum <= 10 ? 0 : 10;
}
