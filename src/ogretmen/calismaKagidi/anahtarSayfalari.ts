/**
 * CEVAP ANAHTARI SAYFA PLANI (KG-102). Saf; saat ve DOM yok.
 *
 * Sorun: MAT.1.3.4 (f5) kâğıtlarında her madde 5 çeldirici × aynı tanı + aynı telafi cümlesiyle 30 satırlık bir
 * anahtar çıkıyordu; tek "yüksekliği serbest" anahtar sayfası yazdırmada 2. PDF sayfasına taşıyor, altbilgi ise
 * "Sayfa 2 / 2" yazıyordu (CSS `counter(pages)` Chromium'da yalnız @page kenar kutusunda çalışır, gövdede değil).
 *
 * Çözüm iki katman:
 * 1. Sıkı düzen: bir maddedeki aynı tanılı çeldiriciler tek cümlede birleşir ("3, 4 ya da 5 seçtiyse: …"); telafi
 *    önerisi her satırda yinelenmez, anahtarın altında her tanı için bir kez ("Telafi önerileri") yazılır.
 * 2. Sayfa planı kodda: satır/telafi yükseklikleri mm cinsinden (bilerek cömert) kestirilir ve anahtar sayfalara
 *    bölünür; altbilgideki toplam = soru sayfaları + bu planın sayfa sayısı. Her anahtar sayfası sabit A4 kutusudur.
 *    Kestirim gerçeği tutmazsa `tests/e2e/kagit-sayfa-sayisi.spec.ts` ve arşiv betiğinin denetimi (PDF sayfa sayısı
 *    = altbilgi toplamı, anahtar gövdesi taşmıyor) kırmızı yanar.
 *
 * `CevapSatiri` verisi değişmez (arşiv metin özetleri aynı kalır); yalnız görüntü ve sayfalama buradan.
 */
import type { CevapSatiri } from './cevapAnahtari';

export interface CeldiriciGrubu {
  /** Aynı tanıya düşen seçenekler, anahtardaki sırayla. */
  readonly secenekler: readonly string[];
  readonly tani: string;
}

export interface AnahtarSatiri {
  readonly no: number;
  readonly dogru: string;
  readonly gruplar: readonly CeldiriciGrubu[];
}

export interface TelafiNotu {
  readonly tani: string;
  readonly ipucu: string;
}

export interface AnahtarSayfasi {
  readonly satirlar: readonly AnahtarSatiri[];
  readonly telafi: readonly TelafiNotu[];
  /** Telafi listesinin başlığı bu sayfada mı (liste ilk bu sayfada başlıyorsa). */
  readonly telafiBasligi: boolean;
}

/** Bir maddedeki çeldiricileri tanıya göre birleştirir (ilk görülme sırası korunur). */
export function celdiriciGruplari(s: CevapSatiri): CeldiriciGrubu[] {
  const gruplar: { secenekler: string[]; tani: string }[] = [];
  for (const n of s.celdiriciNotlari) {
    const g = gruplar.find((x) => x.tani === n.tani);
    if (g) g.secenekler.push(n.secenek);
    else gruplar.push({ secenekler: [n.secenek], tani: n.tani });
  }
  return gruplar;
}

/** "B seçtiyse: Fazla sayma." · "3, 4 ya da 5 seçtiyse: …" (dil kuralı: "yanlış" yok). */
export function grupCumlesi(g: CeldiriciGrubu): string {
  const s = g.secenekler;
  const liste = s.length === 1 ? s[0] : `${s.slice(0, -1).join(', ')} ya da ${s[s.length - 1]}`;
  return `${liste} seçtiyse: ${g.tani}.`;
}

/** Anahtardaki her tanı için bir telafi önerisi (ilk görülme sırası); boş öneri yazılmaz. */
export function telafiNotlari(satirlar: readonly CevapSatiri[]): TelafiNotu[] {
  const gorulen = new Map<string, string>();
  for (const s of satirlar) for (const n of s.celdiriciNotlari) if (!gorulen.has(n.tani)) gorulen.set(n.tani, n.ipucu);
  return [...gorulen].filter(([, ipucu]) => ipucu.trim() !== '').map(([tani, ipucu]) => ({ tani, ipucu }));
}

/**
 * Ölçüler (mm); `kagit.css` aynı sayıları kullanır. Yazdırma kutusu 186×272 mm (A4 − 12 mm kenar). Karakter genişliği
 * TemelYazi/Andika için cömert (ortalama ≈ 0,5 em ölçüldü; 0,56 em alınır), böylece kestirim gerçeği hep aşar.
 */
export const ANAHTAR_OLCU = {
  sayfaYuksekligi: 272,
  ustBilgi: 10,
  altBilgi: 8,
  /** Tablo üstü boşluk + başlık satırı. */
  tabloBasi: 2 + 7,
  yazi: 3.4,
  satirAraligi: 1.3,
  hucreDikeyPay: 2 * 1 + 0.3 + 0.3,
  /** Sütun içi yazı genişlikleri (hücre payı düşülmüş). */
  noSutunu: 10,
  dogruSutunu: 36 - 3,
  notSutunu: 186 - 12 - 36 - 3,
  telafiBaslik: 2.5 + 6,
  telafiYazi: 3.2,
  telafiAralik: 1,
  telafiGenislik: 186,
  /** Kestirim payı: kalan alanın en çok bu kadarı doldurulur. */
  doluluk: 0.9,
  karakterEm: 0.56,
} as const;

const O = ANAHTAR_OLCU;

/** Metnin verilen genişlikte kaç satıra kırılacağı (sözcük bazlı, cömert). */
export function satirSayisi(metin: string, genislikMm: number, yaziMm: number): number {
  const karakter = yaziMm * O.karakterEm;
  const sigan = Math.max(1, Math.floor(genislikMm / karakter));
  let satir = 1;
  let dolu = 0;
  for (const s of metin.split(/\s+/).filter(Boolean)) {
    const uzunluk = s.length;
    if (dolu === 0) {
      satir += Math.floor(Math.max(0, uzunluk - 1) / sigan);
      dolu = uzunluk % sigan || sigan;
    } else if (dolu + 1 + uzunluk <= sigan) {
      dolu += 1 + uzunluk;
    } else {
      satir += 1 + Math.floor(Math.max(0, uzunluk - 1) / sigan);
      dolu = uzunluk % sigan || sigan;
    }
  }
  return satir;
}

const satirMm = (n: number, yazi: number) => n * yazi * O.satirAraligi;

/** Bir anahtar satırının kestirilen yüksekliği (mm). */
export function anahtarSatiriYuksekligi(s: AnahtarSatiri): number {
  const dogru = satirSayisi(s.dogru, O.dogruSutunu, O.yazi);
  const notlar = s.gruplar.length === 0 ? 1 : s.gruplar.reduce((a, g) => a + satirSayisi(grupCumlesi(g), O.notSutunu, O.yazi), 0);
  return satirMm(Math.max(dogru, notlar), O.yazi) + O.hucreDikeyPay;
}

export function telafiYuksekligi(t: TelafiNotu): number {
  return satirMm(satirSayisi(`${t.tani}: ${t.ipucu}`, O.telafiGenislik - 4, O.telafiYazi), O.telafiYazi) + O.telafiAralik;
}

/** Bir anahtar sayfasında satır ve telafi için kullanılabilir yükseklik (mm). */
export const ANAHTAR_KAPASITESI = (O.sayfaYuksekligi - O.ustBilgi - O.altBilgi) * O.doluluk;

/**
 * Anahtarı A4 sayfalarına böler (açgözlü; satır bölünmez). Telafi listesi satırlardan sonra gelir, sığdığı kadarı
 * aynı sayfada kalır. Boş anahtar → tek sayfa (yalnız başlık). Her sayfa ≥ 1 öğe taşır (dev satır yine de ilerler).
 */
export function anahtarSayfalari(satirlar: readonly CevapSatiri[]): AnahtarSayfasi[] {
  const satirListesi: AnahtarSatiri[] = satirlar.map((s) => ({ no: s.no, dogru: s.dogru, gruplar: celdiriciGruplari(s) }));
  const telafi = telafiNotlari(satirlar);
  const sayfalar: { satirlar: AnahtarSatiri[]; telafi: TelafiNotu[]; telafiBasligi: boolean }[] = [];
  let sayfa = { satirlar: [] as AnahtarSatiri[], telafi: [] as TelafiNotu[], telafiBasligi: false };
  let kalan = ANAHTAR_KAPASITESI;
  const yeniSayfa = () => {
    sayfalar.push(sayfa);
    sayfa = { satirlar: [], telafi: [], telafiBasligi: false };
    kalan = ANAHTAR_KAPASITESI;
  };
  for (const s of satirListesi) {
    const bas = sayfa.satirlar.length === 0 ? O.tabloBasi : 0;
    const h = anahtarSatiriYuksekligi(s) + bas;
    if (h > kalan && sayfa.satirlar.length > 0) {
      yeniSayfa();
      kalan -= O.tabloBasi;
    } else kalan -= bas;
    sayfa.satirlar.push(s);
    kalan -= anahtarSatiriYuksekligi(s);
  }
  let baslikYazildi = false;
  for (const t of telafi) {
    const bas = baslikYazildi ? 0 : O.telafiBaslik;
    const h = telafiYuksekligi(t) + bas;
    const sayfaBos = sayfa.satirlar.length === 0 && sayfa.telafi.length === 0;
    if (h > kalan && !sayfaBos) yeniSayfa();
    if (!baslikYazildi) {
      sayfa.telafiBasligi = true;
      baslikYazildi = true;
    }
    sayfa.telafi.push(t);
    kalan -= h;
  }
  sayfalar.push(sayfa);
  return sayfalar;
}

/** Kâğıdın basılı toplam sayfa sayısı: soru sayfaları + (dahilse) anahtar sayfaları. Altbilgi "Sayfa n / N"nin N'i. */
export function kagitToplamSayfa(
  plan: { readonly sayfalar: readonly unknown[]; readonly cevapAnahtari: readonly CevapSatiri[] },
  cevapAnahtariDahil: boolean,
): number {
  return plan.sayfalar.length + (cevapAnahtariDahil ? anahtarSayfalari(plan.cevapAnahtari).length : 0);
}
