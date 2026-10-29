/**
 * Keşif Masası ekranının saf yardımcıları (plan v2 Adım 44 aşama 2). Bileşen dosyalarından ayrı
 * (hızlı yenileme kuralı); saat/depolama yok.
 */
import { doluSayisi, type KesifAraci, type KesifDurumu } from '../../kesif/kesifMasasi';

/** Ekrandaki araçlar (aşama 2: ilk üçü; aşama 3: terazi ve ayır-birleştir). */
export const EKRAN_ARACLARI: readonly { arac: KesifAraci; ad: string; ikon: string }[] = [
  { arac: 'onlukCerceve', ad: 'Onluk çerçeve', ikon: '▦' },
  { arac: 'nesneKumesi', ad: 'Nesneler', ikon: '●●●' },
  { arac: 'sayiDogrusu', ad: 'Sayı doğrusu', ikon: '0-10' },
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

/**
 * Küçük ekran yerleşimi (KG-120): araç alanının ölçülen genişliğine göre iki onluk yan yana sığar mı?
 * Sığmazsa ekran tek onluk gösterir + "İkinci onluk" düğmesi (102 px hedef ve üst %35 kuralı korunur;
 * iki onluğu alt alta dizmek 1080×810 tahtada ilk satırı üst %35'e iter, alt düğmeleri ekran dışına atar).
 * Ölçüler px: `tapMin` = `--size-tap-min`, `olcek` = `--scale`, `aralik` = `--size-gap`.
 */
export interface KesifOlcu {
  readonly genislik: number;
  readonly tapMin: number;
  readonly olcek: number;
  readonly aralik: number;
}

/** Izgara boşluğu px (`ortak.tsx` `izgaraBoslugu` = 12px × ölçek). */
export const izgaraBoslukPx = (olcek: number): number => 12 * olcek;

/** Bir 2×5 onluk çerçevenin genişliği: 5 göz + 4 iç boşluk + 2 kenar dolgusu + 3 px'lik iki çizgi. */
export function onlukCerceveGenisligi(o: Pick<KesifOlcu, 'tapMin' | 'olcek'>): number {
  return 5 * o.tapMin + 6 * izgaraBoslukPx(o.olcek) + 6;
}

/** Onluk çerçeve: iki çerçeve yan yana sığmıyorsa tek onluk + geçiş düğmesi. */
export function onlukTekMi(o: KesifOlcu): boolean {
  return o.genislik + 0.5 < 2 * onlukCerceveGenisligi(o) + o.aralik;
}

/** Nesneler: 10'arlı sıra sığmıyorsa 5'li iki sıra (bir onluk) + geçiş düğmesi. */
export function nesneTekOnlukMu(o: KesifOlcu): boolean {
  return o.genislik + 0.5 < 10 * o.tapMin + 9 * izgaraBoslukPx(o.olcek);
}

/** Tek onluk görünümünde son değişikliğin onluğu (0 | 1): ekran değişen gözü/nesneyi gösterir. */
export function onlukSirasi(indeks: number): 0 | 1 {
  return indeks >= 10 ? 1 : 0;
}

/**
 * Sayı doğrusu düzeni (KG-124). 11 nokta (`tapMin` kare) tek sırada `11 × tapMin + 10 × ızgara boşluğu` ister;
 * 1080×810 elle seçilen tahtada (araç alanı 825 px, 11 × 102 = 1122 px) sığmaz ve yatayda kırpılırdı.
 * Sığmıyorsa **zikzak**: 0–10 çizgisi ölçülen genişliğe göre ölçeklenir (nokta aralığı `adim`), çift sayılar
 * çizginin üstünde, tekler altında; her düğme yine `tapMin` kare ve aynı sıradaki komşusundan en az bir ızgara
 * boşluğu uzakta (2 × adim − tapMin ≥ boşluk). Genişlik bunu da karşılamıyorsa `adim` bu alt sınırda kalır.
 */
export type SayiDogrusuDuzeni = { readonly tur: 'sira' } | { readonly tur: 'zikzak'; readonly adim: number };

export function sayiDogrusuDuzeni(o: KesifOlcu): SayiDogrusuDuzeni {
  const bosluk = izgaraBoslukPx(o.olcek);
  if (o.genislik + 0.5 >= 11 * o.tapMin + 10 * bosluk) return { tur: 'sira' };
  return { tur: 'zikzak', adim: Math.max((o.genislik - o.tapMin) / 10, (o.tapMin + bosluk) / 2) };
}
