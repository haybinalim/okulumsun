/**
 * Keşif Masası ekranının saf yardımcıları (plan v2 Adım 44 aşama 2). Bileşen dosyalarından ayrı
 * (hızlı yenileme kuralı); saat/depolama yok.
 */
import { doluSayisi, type KesifAraci, type KesifDurumu } from '../../kesif/kesifMasasi';

/** Ekrandaki araçlar (aşama 2: ilk üçü; aşama 3: terazi ve ayır-birleştir). */
export const EKRAN_ARACLARI: readonly { arac: KesifAraci; ad: string; ikon: string }[] = [
  { arac: 'onlukCerceve', ad: 'Onluk çerçeve', ikon: '▦' },
  { arac: 'nesneKumesi', ad: 'Nesneler', ikon: '●●●' },
  { arac: 'sayiDogrusu', ad: 'Sayı doğrusu', ikon: '0—10' },
  { arac: 'terazi', ad: 'Terazi', ikon: '⚖' },
  { arac: 'ayirBirlestir', ad: 'Ayır ve birleştir', ikon: '●●|●' },
];

/** Genel "+1/−1" düğmelerinin anlamlı olduğu araçlar (terazide her kefenin kendi düğmeleri var). */
export function genelArtiEksiVarMi(arac: KesifAraci): boolean {
  return arac !== 'terazi';
}

/** Üst bölgedeki gösterim metni: ayrılmışsa "a + b", terazide "sol = sağ" ya da iki sayı. */
export function gosterilenMetin(d: KesifDurumu): string {
  if (d.arac === 'terazi') return d.sol === d.sag ? `${d.sol} = ${d.sag}` : `${d.sol}   ${d.sag}`;
  if (d.arac === 'ayirBirlestir' && d.ayirma !== null) return `${d.ayirma} + ${d.toplam - d.ayirma}`;
  return String(gosterilenSayi(d));
}

/** Terazi eğimi (derece): ağır taraf aşağı; fark başına 4°, en çok ±16°. Sağ ağırsa pozitif (saat yönü). */
export function teraziEgimi(sol: number, sag: number): number {
  return Math.max(-16, Math.min(16, (sag - sol) * 4));
}

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
