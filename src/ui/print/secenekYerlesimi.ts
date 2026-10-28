/**
 * KÜME SEÇENEKLERİNİN KÂĞIT YERLEŞİMİ — saf, JSX'siz (plan v2 Adım 59 aşama 4, KG-106).
 *
 * Karşılaştırma maddesinde ("Hangisinde daha çok var?") iki küme seçeneği 26 mm'lik kutulara sıkışıyordu
 * (14 nesnede ≈ 4 mm), maddenin alt yarısı boştu. Sığma kararı (`maddeKaplama`) ve sayfa planı DEĞİŞMEZ; yalnız
 * maddede zaten var olan boş yer küme kutularına verilir. Üç aday düzen ölçülür, ortak nesne boyu en büyük olan
 * seçilir (eşitlikte sıra: yan yana, alt alta, üstte kümeler):
 *  · 'yan'     : K K [D]   — iki küme kutusu ve (varsa) "eşit" kutusu tek satırda, küme kutuları tam yükseklik;
 *  · 'altAlta' : K / K [D] — küme kutuları alt alta tam genişlik, "eşit" kutusu sağda ortada;
 *  · 'ust'     : K K / D   — küme kutuları üst satırda, "eşit" kutusu altta.
 * İki küme kutusu HEP AYNI ölçüde ve nesneler AYNI boyda (karsilastir.ts: miktarla ilişkili boy ya da alan ipucu
 * doğmaz). Seçilen düzende serbest kenar, aynı nesne boyunu koruyan en küçük ölçüye (≥ 26 mm) indirilir.
 * Metin seçenekleri ("eşit") 26 × 26 mm kalır (baskı kuralı ≥ 25 mm).
 */
import type { KagitMaddesi } from '../../ogretmen/calismaKagidi/kagitMaddesi';
import type { KagitDuzeni } from '../../ogretmen/calismaKagidi/kagitPlani';
import {
  maddeIcOlcusu,
  maddeKaplama,
  SECENEK_KUTUSU_MM,
  yonergeYuksekligi,
} from '../../ogretmen/calismaKagidi/kagitYerlesimi';
import {
  KAGIT_NESNE_BOSLUK_MM,
  KAGIT_NESNE_EN_AZ_MM,
  KAGIT_NESNE_EN_BUYUK_MM,
  kagitKumeYerlesimi,
  ortakKumeBoyutu,
  type KumeTarifi,
} from '../svg/kumeYerlesimi';

/** Seçenek kutusu konturu ve iç dolgusu (mm; `kagit.css` `.kg-secenek`, `.kg-secenek--yerlesik`). */
export const SECENEK_KONTUR_MM = 1.2;
export const YERLESIK_DOLGU_MM = 0.6;
/**
 * Harf rozeti 5,5 mm; dolgu kutusuna göre −1,2 mm, yani dış kenardan 0–5,5 mm'yi kaplar. Nesneler kontur + dolgu
 * + bu şeridin (0,3 mm payla) dışında kalır.
 */
export const ROZET_SERIDI_MM = 5.5 - SECENEK_KONTUR_MM - YERLESIK_DOLGU_MM + 0.3;
const ARA_MM = 3;
/** Yönerge ile seçenekler arası (madde `gap`) + ölçüm payı. */
const UST_PAY_MM = 1 + 1;
/** 1 çizim birimi = 0,1 mm. */
export const SECENEK_MM_BIRIM = 0.1;

export type SecenekDuzeni = 'yan' | 'altAlta' | 'ust';

export interface KutuOlcusu {
  readonly w: number;
  readonly h: number;
}

export interface SecenekYerlesimi {
  readonly duzen: SecenekDuzeni;
  /** Küme kutusunun dış ölçüsü (mm). */
  readonly kume: KutuOlcusu;
  /** Nesnelerin çizildiği iç alan (mm) ve rozet şeridi: 'sol' ya da 'ust'. */
  readonly ic: KutuOlcusu;
  readonly serit: 'sol' | 'ust';
  /** Ortak nesne boyu (çizim birimi, 0,1 mm). */
  readonly boyut: number;
  /** CSS ızgarası (mm). */
  readonly sutunlar: readonly number[];
  readonly satirlar: readonly number[];
  /** Seçenek sırasıyla ızgara yeri (1 tabanlı; `bitis` dahil değil). */
  readonly yerler: readonly {
    readonly satir: number;
    readonly satirBitis: number;
    readonly sutun: number;
    readonly sutunBitis: number;
  }[];
}

function kumeTarifi(m: KagitMaddesi, i: number): KumeTarifi | null {
  const d = m.secenekler[i]?.deger;
  return d && d.tur === 'gorsel' && d.gorsel.type === 'nesneKumesi' ? (d.gorsel as KumeTarifi) : null;
}

/** Kutu dış ölçüsünden nesne alanı (mm) — kontur, dolgu ve rozet şeridi düşülür. */
function icAlan(w: number, h: number): { ic: KutuOlcusu; serit: 'sol' | 'ust' } {
  const iw = w - 2 * (SECENEK_KONTUR_MM + YERLESIK_DOLGU_MM);
  const ih = h - 2 * (SECENEK_KONTUR_MM + YERLESIK_DOLGU_MM);
  // Şerit, kutunun uzun kenarından düşülür (kısa kenar nesne boyunu sınırlar).
  return w >= h
    ? { ic: { w: iw - ROZET_SERIDI_MM, h: ih }, serit: 'sol' }
    : { ic: { w: iw, h: ih - ROZET_SERIDI_MM }, serit: 'ust' };
}

const ENB = KAGIT_NESNE_EN_BUYUK_MM / SECENEK_MM_BIRIM;
const ENA = KAGIT_NESNE_EN_AZ_MM / SECENEK_MM_BIRIM;
/** Komşu nesne kutuları arası en az boşluk (çizim birimi). */
export const SECENEK_BOSLUK = KAGIT_NESNE_BOSLUK_MM / SECENEK_MM_BIRIM;
const BOS = SECENEK_BOSLUK;

function ortakBoy(kumeler: readonly KumeTarifi[], w: number, h: number): number {
  const { ic } = icAlan(w, h);
  if (ic.w <= 0 || ic.h <= 0) return 0;
  const k = kumeler.map((spec) => ({ spec, w: ic.w / SECENEK_MM_BIRIM, h: ic.h / SECENEK_MM_BIRIM }));
  return (
    ortakKumeBoyutu(k, ENB, ENA, BOS) ?? kagitKumeYerlesimi(kumeler[0], k[0].w, k[0].h, ENB, undefined, ENA, BOS).boyut
  );
}

/**
 * Küme seçenekli dar madde için genişletilmiş seçenek yerleşimi; uygun değilse null (eski 26 mm satırı).
 * Yalnız: 2x3 tek hücre, sahnesiz, iki küme seçeneği + en çok bir metin seçeneği, yazma kutusu yok.
 */
export function kumeSecenekYerlesimi(m: KagitMaddesi, duzen: KagitDuzeni): SecenekYerlesimi | null {
  if (duzen !== '2x3' || m.sahne || m.kutular.length > 0) return null;
  if (m.yanitBicimi === 'cizgiyleEsle' || m.yanitBicimi === 'siraNumarasiYaz') return null;
  if (maddeKaplama(m, duzen) !== 1) return null;
  const kumeIdx = m.secenekler.flatMap((_, i) => (kumeTarifi(m, i) ? [i] : []));
  const digerIdx = m.secenekler.flatMap((_, i) => (kumeTarifi(m, i) ? [] : [i]));
  if (kumeIdx.length !== 2 || digerIdx.length > 1) return null;
  if (digerIdx.some((i) => m.secenekler[i].deger.tur === 'gorsel' || m.secenekler[i].deger.tur === 'banknot'))
    return null;
  const kumeler = kumeIdx.map((i) => kumeTarifi(m, i)!);
  const ic = maddeIcOlcusu(duzen, 1);
  const W = ic.w;
  const H = ic.h - yonergeYuksekligi(m.yonergeMetni, ic.w) - UST_PAY_MM;
  const D = digerIdx.length;
  const S = SECENEK_KUTUSU_MM;

  type Aday = { duzen: SecenekDuzeni; w: number; h: number; serbest: 'w' | 'h' };
  const adaylar: Aday[] = [
    { duzen: 'yan', w: (W - D * (S + ARA_MM) - ARA_MM) / 2, h: H, serbest: 'h' },
    { duzen: 'altAlta', w: W - D * (S + ARA_MM), h: (H - ARA_MM) / 2, serbest: 'w' },
  ];
  if (D > 0) adaylar.push({ duzen: 'ust', w: (W - ARA_MM) / 2, h: H - S - ARA_MM, serbest: 'h' });
  let en: (Aday & { boyut: number }) | null = null;
  for (const a of adaylar) {
    if (a.w < S || a.h < S) continue;
    const boyut = ortakBoy(kumeler, a.w, a.h);
    if (en === null || boyut > en.boyut + 1e-6) en = { ...a, boyut };
  }
  if (en === null) return null;
  // Serbest kenar: aynı nesne boyunu koruyan en küçük ölçü (≥ 26 mm) — az nesnede dev kutu olmasın.
  let w = en.w;
  let h = en.h;
  let alt = S;
  let ust = en.serbest === 'w' ? w : h;
  if (ortakBoy(kumeler, en.serbest === 'w' ? S : w, en.serbest === 'w' ? h : S) >= en.boyut - 1e-6) ust = S;
  for (let i = 0; i < 30 && ust - alt > 0.05; i++) {
    const orta = (alt + ust) / 2;
    const b = en.serbest === 'w' ? ortakBoy(kumeler, orta, h) : ortakBoy(kumeler, w, orta);
    if (b >= en.boyut - 1e-6) ust = orta;
    else alt = orta;
  }
  if (en.serbest === 'w') w = Math.round(ust * 10) / 10;
  else h = Math.round(ust * 10) / 10;
  w = Math.floor(w * 10) / 10;
  h = Math.floor(h * 10) / 10;
  const boyut = ortakBoy(kumeler, w, h);
  const alan = icAlan(w, h);

  const yerler: SecenekYerlesimi['yerler'][number][] = [];
  let sutunlar: number[];
  let satirlar: number[];
  const yer = (satir: number, sutun: number, satirBitis = satir + 1, sutunBitis = sutun + 1) => ({
    satir,
    satirBitis,
    sutun,
    sutunBitis,
  });
  if (en.duzen === 'yan') {
    sutunlar = D > 0 ? [w, w, S] : [w, w];
    satirlar = [Math.max(h, S)];
  } else if (en.duzen === 'altAlta') {
    sutunlar = D > 0 ? [w, S] : [w];
    satirlar = [h, h];
  } else {
    sutunlar = [w, w];
    satirlar = [h, S];
  }
  let k = 0;
  m.secenekler.forEach((_, i) => {
    if (kumeIdx.includes(i)) {
      const n = k++;
      if (en.duzen === 'altAlta') yerler.push(yer(n + 1, 1));
      else yerler.push(yer(1, n + 1));
    } else if (en.duzen === 'yan') yerler.push(yer(1, 3));
    else if (en.duzen === 'altAlta') yerler.push(yer(1, 2, 3));
    else yerler.push(yer(2, 1, 3, 3));
  });
  return { duzen: en.duzen, kume: { w, h }, ic: alan.ic, serit: alan.serit, boyut, sutunlar, satirlar, yerler };
}
