/**
 * KÂĞIT YERLEŞİMİ — SAF (plan v2 Adım 35). Bir maddenin A4 hücresine sığıp sığmadığını mm tahminiyle söyler;
 * sığmayan madde yatayda/dikeyde iki hücre kaplar, o da yetmezse kâğıda girmez. Seçenek kutusu ≥ 25×25 mm kuralı
 * (plan "baskı kuralları") burada sabit tutulur; ölçüler `kagit.css` ile aynı sayıları kullanır, e2e taşma testiyle doğrulanır.
 */
import type { KagitMaddesi } from './kagitMaddesi';
import type { KagitDuzeni } from './kagitPlani';

/** Seçenek kutusunun en küçük kenarı (mm). */
export const SECENEK_KUTUSU_MM = 26;
const GENIS_KUTU_MM: Readonly<Record<string, number>> = { banknot: 40, islemKarti: 38 };
const BOSLUK_MM = 3;
const YONERGE_MM = 10;
/** Dar (tek sütun) hücrede sahne yüksekliği; geniş hücrede sahne solda, seçenekler sağdadır. */
const SAHNE_DAR_MM = 28;
const SAHNE_GENIS_MM = 34;
const KUTU_SATIRI_MM = 11;
const ESLE_BOSLUGU_MM = 10;
const GENIS_ESIK_MM = 150;
const SAHNE_SUTUNU_MM = 78;

/** Hücre iç ölçüsü (mm): A4 − 12 mm kenar − üst/alt bilgi, düzene bölünmüş. */
export const HUCRE_MM: Readonly<Record<KagitDuzeni, { readonly w: number; readonly h: number }>> = {
  '2x3': { w: 88, h: 78 },
  '1x4': { w: 180, h: 58 },
};
/** Bir sayfadaki hücre sayısı. */
export const SAYFA_HUCRESI: Readonly<Record<KagitDuzeni, number>> = { '2x3': 6, '1x4': 4 };

/** Seçenek kutusunun mm genişliği (banknot ve işlem kartı daha geniştir). */
export function secenekGenisligi(m: KagitMaddesi): number {
  const turler = m.secenekler.map((s) =>
    s.deger.tur === 'banknot' ? 'banknot' : s.deger.tur === 'gorsel' ? s.deger.gorsel.type : s.deger.tur,
  );
  return Math.max(SECENEK_KUTUSU_MM, ...turler.map((t) => GENIS_KUTU_MM[t] ?? 0));
}

function satirdakiKutu(genislik: number, kutuW: number): number {
  return Math.max(1, Math.floor((genislik + BOSLUK_MM) / (kutuW + BOSLUK_MM)));
}

/** `genislik` mm'lik alanda maddenin tahmini yüksekliği (mm). */
function istenenYukseklik(m: KagitMaddesi, genislik: number): number {
  const genis = genislik >= GENIS_ESIK_MM;
  const kutuW = secenekGenisligi(m);
  const kutuH = SECENEK_KUTUSU_MM + BOSLUK_MM + (m.yanitBicimi === 'siraNumarasiYaz' ? 10 : 0);
  if (m.yanitBicimi === 'cizgiyleEsle') {
    const sol = m.secenekler.filter((s) => s.taraf === 'sol').length;
    const sag = m.secenekler.length - sol;
    const satir = satirdakiKutu(genislik, kutuW);
    return YONERGE_MM + (Math.ceil(sol / satir) + Math.ceil(sag / satir)) * kutuH + ESLE_BOSLUGU_MM;
  }
  let h = YONERGE_MM;
  const sahneH = m.sahne ? (genis ? SAHNE_GENIS_MM : SAHNE_DAR_MM) : 0;
  let secenekH = 0;
  if (m.secenekler.length > 0) {
    const alan = genis && m.sahne ? genislik - SAHNE_SUTUNU_MM : genislik;
    secenekH = Math.ceil(m.secenekler.length / satirdakiKutu(alan, kutuW)) * kutuH;
  }
  h += genis ? Math.max(sahneH, secenekH) : sahneH + secenekH;
  if (m.kutular.length > 0 && m.yanitBicimi !== 'siraNumarasiYaz') h += KUTU_SATIRI_MM;
  return h;
}

/** 1 = tek hücre, 2 = iki hücre (2x3'te tam satır, 1x4'te iki satır), null = bu düzene sığmaz. */
export function maddeKaplama(m: KagitMaddesi, duzen: KagitDuzeni): 1 | 2 | null {
  const hucre = HUCRE_MM[duzen];
  if (istenenYukseklik(m, hucre.w) <= hucre.h) return 1;
  const w2 = duzen === '2x3' ? 2 * hucre.w + 6 : hucre.w;
  const h2 = duzen === '2x3' ? hucre.h : 2 * hucre.h + 6;
  return istenenYukseklik(m, w2) <= h2 ? 2 : null;
}

/** Maddeleri sayfalara hücre kapasitesine göre dağıtır (iki hücrelik madde 2x3'te yeni satıra başlar). */
export function sayfalaraDagit(maddeler: readonly KagitMaddesi[], duzen: KagitDuzeni): KagitMaddesi[][] {
  const kapasite = SAYFA_HUCRESI[duzen];
  const sayfalar: KagitMaddesi[][] = [];
  let sayfa: KagitMaddesi[] = [];
  let dolu = 0;
  for (const m of maddeler) {
    const kaplama = maddeKaplama(m, duzen) ?? 1;
    if (duzen === '2x3' && kaplama === 2 && dolu % 2 === 1) dolu += 1; // boş hücre bırak, satır başı
    if (dolu + kaplama > kapasite) {
      sayfalar.push(sayfa);
      sayfa = [];
      dolu = 0;
    }
    sayfa.push(m);
    dolu += kaplama;
  }
  if (sayfa.length > 0) sayfalar.push(sayfa);
  return sayfalar;
}

// ------------------------------------------------------------ sahne kutusu (KG-105)

/**
 * Basılı sayfanın gerçek ölçüleri (`kagit.css`: A4 − 12 mm kenar = 186 × 272; üst 10, alt 8, ızgara dolgusu 2 × 3,
 * hücre aralığı 3; madde çerçevesi 0,5 + dolgu 1,5/2). `HUCRE_MM` sığma kararı için ihtiyatlı (küçük) kalır;
 * sahne kutusu ise kalan GERÇEK yeri doldurur.
 */
const SAYFA_IC = { w: 186, h: 272 } as const;
const IZGARA_H = SAYFA_IC.h - 10 - 8 - 6;
const HUCRE_ARASI = 3;
const MADDE_IC_W = 1 + 4;
const MADDE_IC_H = 1 + 3;
/** Yönerge satırı: 4 mm × 1,32; alt eylem satırı 2,8 mm × 1,3; numara + ikon + aralıklar 17 mm. */
const YONERGE_SATIRI_MM = 5.28;
const EYLEM_SATIRI_MM = 3.64;
const YONERGE_YAN_MM = 17;
/** TemelYazi kalın 4 mm'de ortalama harf genişliği (ihtiyatlı; ölçülen ≈ 1,92 mm). */
const HARF_MM = 2.05;
/** Dar hücrede sahnenin en az yüksekliği (eski sabit değer); yatayda sahne sütunu. */
export const SAHNE_EN_AZ_MM = SAHNE_DAR_MM;
export const SAHNE_YATAY_EN_AZ_MM = SAHNE_GENIS_MM;
export const SAHNE_YATAY_GENISLIK_MM = SAHNE_SUTUNU_MM - BOSLUK_MM;

/** Maddenin basılı iç ölçüsü (mm). */
export function maddeIcOlcusu(duzen: KagitDuzeni, kaplama: 1 | 2): { readonly w: number; readonly h: number } {
  const sutun = duzen === '2x3' ? 2 : 1;
  const satir = duzen === '2x3' ? 3 : 4;
  const w1 = (SAYFA_IC.w - (sutun - 1) * HUCRE_ARASI) / sutun;
  const h1 = (IZGARA_H - (satir - 1) * HUCRE_ARASI) / satir;
  const w = duzen === '2x3' && kaplama === 2 ? 2 * w1 + HUCRE_ARASI : w1;
  const h = duzen === '1x4' && kaplama === 2 ? 2 * h1 + HUCRE_ARASI : h1;
  return { w: w - MADDE_IC_W, h: h - MADDE_IC_H };
}

/** Yönerge bloğunun tahmini yüksekliği (mm): kelime kaydırmalı satır sayısı × satır + eylem satırı. */
export function yonergeYuksekligi(metin: string, icGenislik: number): number {
  const satirHarf = Math.max(8, Math.floor((icGenislik - YONERGE_YAN_MM) / HARF_MM));
  let satir = 1;
  let uzunluk = 0;
  for (const kelime of metin.split(/\s+/).filter(Boolean)) {
    const ek = uzunluk === 0 ? kelime.length : uzunluk + 1 + kelime.length;
    if (ek > satirHarf && uzunluk > 0) {
      satir += 1;
      uzunluk = kelime.length;
    } else uzunluk = ek;
  }
  return Math.max(9, satir * YONERGE_SATIRI_MM + EYLEM_SATIRI_MM);
}

/**
 * Sahnenin basılı kutusu (mm): dar hücrede tam genişlik × yönerge, seçenek satırları ve yazma kutusundan kalan
 * yükseklik (en az eski 28 mm); yatayda (iki hücre / 1x4) 75 mm sütun × kalan yükseklik. Yalnız çizimin en-boy
 * oranı ve mm ölçeği için tahmindir; CSS kutuyu gerçek kalan yerle doldurur, çizim oranıyla içine sığar.
 * Sığma kararı (`maddeKaplama`) DEĞİŞMEZ: sayfa planı ve metin özeti aynı kalır.
 */
export function sahneKutusu(m: KagitMaddesi, duzen: KagitDuzeni): { readonly w: number; readonly h: number } {
  const kaplama = maddeKaplama(m, duzen) ?? 1;
  const ic = maddeIcOlcusu(duzen, kaplama);
  const yatay = duzen === '1x4' || kaplama === 2;
  const yonerge = yonergeYuksekligi(m.yonergeMetni, ic.w);
  const sirali = m.yanitBicimi === 'siraNumarasiYaz';
  const kutuSatiri = m.kutular.length > 0 && !sirali ? 1 + 9 : 0;
  if (yatay) {
    return { w: SAHNE_YATAY_GENISLIK_MM, h: Math.max(SAHNE_YATAY_EN_AZ_MM, ic.h - yonerge - 1 - kutuSatiri) };
  }
  let secenek = 0;
  if (m.secenekler.length > 0) {
    const kutuW = secenekGenisligi(m);
    const satir = Math.ceil(m.secenekler.length / satirdakiKutu(ic.w, kutuW));
    secenek = 1 + satir * (SECENEK_KUTUSU_MM + (sirali ? 10 : 0)) + (satir - 1) * BOSLUK_MM;
  }
  return { w: ic.w, h: Math.max(SAHNE_EN_AZ_MM, ic.h - yonerge - 1 - secenek - kutuSatiri) };
}
