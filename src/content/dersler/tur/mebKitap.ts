/**
 * MEB TYMM İlk Okuma Yazma kitabı eşlemesi (Okuma Yazma planı "E6 sonucu", Adım 82). SAF; yalnız YETİŞKİN yüzeyi
 * (öğretmen "Bugünkü ses", haftalık ses planı, Kaynaklar) kullanır; çocuk yüzeyine girmez.
 *
 * Her harf için: hangi MEB kitabı (1 ya da 2), harf bölümünün baskı sayfası ve kitabın teması. TEK KAYNAK burasıdır.
 * TEMA ≠ HARF GRUBU: temalar program Şekil 1 gruplarıyla örtüşmez (Tema 1 = a n e t; Tema 2 = i l + 2. grup;
 * Tema 3 = 3. grup; Tema 4 = 4. ve 5. grup). Gruba bakılarak tema türetilmez; her satır kendi temasını taşır.
 *
 * Kaynak: https://tymm.meb.gov.tr/kitap/31 (Kitap 1) ve https://tymm.meb.gov.tr/kitap/32 (Kitap 2), PDF içindekiler.
 * TEYİT: BEKLİYOR. Harf sırası ve sayfalar yüksek güvenli; numara–başlık eşleşmesi (tema) orta-yüksek güvenli, görsel
 * kontrol edilmedi.
 */
import { OGRETIM_SIRASI, type Harf } from './alfabe';

export type MebKitapNo = 1 | 2;

export const MEB_KITAP_TEYIDI: 'bekliyor' | 'onaylandi' = 'bekliyor';

export const MEB_KITAPLARI: Readonly<Record<MebKitapNo, { readonly ad: string; readonly adres: string }>> = {
  1: { ad: 'İlk Okuma Yazma Kitabı, Kitap 1', adres: 'https://tymm.meb.gov.tr/kitap/31' },
  2: { ad: 'İlk Okuma Yazma Kitabı, Kitap 2', adres: 'https://tymm.meb.gov.tr/kitap/32' },
};

export const MEB_TEMALARI: Readonly<Record<1 | 2 | 3 | 4, string>> = {
  1: 'Güzel Davranışlarımız',
  2: "Mustafa Kemal'den Atatürk'e",
  3: 'Çevremizdeki Yaşam',
  4: 'Yol Arkadaşımız Kitaplar',
};

export interface MebKitapSatiri {
  readonly harf: Harf;
  readonly kitap: MebKitapNo;
  /** Harf bölümünün başladığı baskı sayfası. */
  readonly sayfa: number;
  readonly tema: 1 | 2 | 3 | 4;
}

/** 29 harf, öğretim sırasıyla (sesPlani ile aynı). */
export const MEB_KITAP_ESLEMESI: readonly MebKitapSatiri[] = [
  { harf: 'a', kitap: 1, sayfa: 52, tema: 1 },
  { harf: 'n', kitap: 1, sayfa: 64, tema: 1 },
  { harf: 'e', kitap: 1, sayfa: 80, tema: 1 },
  { harf: 't', kitap: 1, sayfa: 98, tema: 1 },
  { harf: 'i', kitap: 1, sayfa: 120, tema: 2 },
  { harf: 'l', kitap: 1, sayfa: 134, tema: 2 },
  { harf: 'o', kitap: 1, sayfa: 152, tema: 2 },
  { harf: 'k', kitap: 1, sayfa: 164, tema: 2 },
  { harf: 'u', kitap: 1, sayfa: 180, tema: 2 },
  { harf: 'r', kitap: 1, sayfa: 198, tema: 2 },
  { harf: 'ı', kitap: 1, sayfa: 210, tema: 2 },
  { harf: 'm', kitap: 1, sayfa: 224, tema: 2 },
  { harf: 'ü', kitap: 2, sayfa: 14, tema: 3 },
  { harf: 's', kitap: 2, sayfa: 26, tema: 3 },
  { harf: 'ö', kitap: 2, sayfa: 42, tema: 3 },
  { harf: 'y', kitap: 2, sayfa: 54, tema: 3 },
  { harf: 'd', kitap: 2, sayfa: 68, tema: 3 },
  { harf: 'z', kitap: 2, sayfa: 80, tema: 3 },
  { harf: 'ç', kitap: 2, sayfa: 98, tema: 4 },
  { harf: 'b', kitap: 2, sayfa: 110, tema: 4 },
  { harf: 'g', kitap: 2, sayfa: 122, tema: 4 },
  { harf: 'c', kitap: 2, sayfa: 136, tema: 4 },
  { harf: 'ş', kitap: 2, sayfa: 146, tema: 4 },
  { harf: 'p', kitap: 2, sayfa: 158, tema: 4 },
  { harf: 'h', kitap: 2, sayfa: 170, tema: 4 },
  { harf: 'v', kitap: 2, sayfa: 182, tema: 4 },
  { harf: 'ğ', kitap: 2, sayfa: 194, tema: 4 },
  { harf: 'f', kitap: 2, sayfa: 206, tema: 4 },
  { harf: 'j', kitap: 2, sayfa: 216, tema: 4 },
];

/** Harf (küçük ya da büyük) için satır; öğretim harfi değilse `null`. */
export function mebKitapSatiri(harf: string): MebKitapSatiri | null {
  const k = harf.toLocaleLowerCase('tr-TR');
  return MEB_KITAP_ESLEMESI.find((s) => s.harf === k) ?? null;
}

/** "MEB kitabı: Kitap 1, s. 52 · Tema 1 Güzel Davranışlarımız"; harf yoksa `null`. */
export function mebKitapMetni(harf: string): string | null {
  const s = mebKitapSatiri(harf);
  return s ? `MEB kitabı: Kitap ${s.kitap}, s. ${s.sayfa} · Tema ${s.tema} ${MEB_TEMALARI[s.tema]}` : null;
}

/** Bir hafta için (birden çok yeni ses olabilir) tek satır; ses yoksa `null`. */
export function mebKitapHaftaMetni(sesler: readonly string[]): string | null {
  const satirlar = sesler.map(mebKitapSatiri).filter((s): s is MebKitapSatiri => s !== null);
  if (!satirlar.length) return null;
  if (satirlar.length === 1) return mebKitapMetni(satirlar[0].harf);
  const ilk = satirlar[0];
  const ayniTema = satirlar.every((s) => s.kitap === ilk.kitap && s.tema === ilk.tema);
  if (ayniTema) {
    const sayfalar = satirlar.map((s) => `${s.harf} s. ${s.sayfa}`).join(', ');
    return `MEB kitabı: Kitap ${ilk.kitap}, ${sayfalar} · Tema ${ilk.tema} ${MEB_TEMALARI[ilk.tema]}`;
  }
  return `MEB kitabı: ${satirlar.map((s) => `${s.harf} Kitap ${s.kitap} s. ${s.sayfa} (Tema ${s.tema} ${MEB_TEMALARI[s.tema]})`).join('; ')}`;
}

/** Doğrulayıcı: hata listesi (boş = geçerli). 29 harf birer kez, sıra `OGRETIM_SIRASI`, sayfalar kitap içinde artan. */
export function mebKitapDogrula(satirlar: readonly MebKitapSatiri[] = MEB_KITAP_ESLEMESI): string[] {
  const hatalar: string[] = [];
  const harfler = satirlar.map((s) => s.harf);
  if (satirlar.length !== OGRETIM_SIRASI.length) hatalar.push(`satır sayısı ${satirlar.length} (29 olmalı)`);
  for (const h of OGRETIM_SIRASI) {
    const n = harfler.filter((x) => x === h).length;
    if (n !== 1) hatalar.push(`"${h}" ${n} kez (bir kez olmalı)`);
  }
  if (harfler.join('') !== OGRETIM_SIRASI.join('')) hatalar.push('harf sırası sesPlani/OGRETIM_SIRASI ile aynı değil');
  for (const kitap of [1, 2] as const) {
    const s = satirlar.filter((x) => x.kitap === kitap);
    for (let i = 1; i < s.length; i++) if (s[i].sayfa <= s[i - 1].sayfa) hatalar.push(`Kitap ${kitap}: "${s[i].harf}" sayfası ${s[i].sayfa} artan değil`);
  }
  for (let i = 1; i < satirlar.length; i++) {
    if (satirlar[i].kitap < satirlar[i - 1].kitap) hatalar.push(`"${satirlar[i].harf}" kitap sırası geri gidiyor`);
    if (satirlar[i].tema < satirlar[i - 1].tema) hatalar.push(`"${satirlar[i].harf}" tema sırası geri gidiyor`);
  }
  return hatalar;
}
