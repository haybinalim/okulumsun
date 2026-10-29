import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * SIKIŞIK EKRANDA SEÇENEK KARTI BOYU (KG-127) — AUDIO_TO_IMAGE alt alanı; KG-128'den beri SEQUENCE_ORDER da.
 *
 * Varsayılan kart `--size-choice` (tahta 320 px). 1080×810 elle seçilen tahtada alt alan ≈ 1004 × 409 px:
 * üç kart (3×320 + 2×51 = 1062 px) iki satıra kırılıyor, ilk satır üst %35'e taşıyor (kart merkezi y=218 <
 * 283,5) ve "Onayla" ekranın altından çıkıyordu (y=800+224). Soru hoparlörü üst alana konunca kartlar onun
 * üstüne biniyordu. Kural: varsayılan sığıyorsa DOKUNMA (1920 tahta ve tablet aynı kalır); sığmıyorsa kart =
 * min(yan yana sığan, alt alan − birincil düğme) — dikeyde en çok bir `--size-gap` taşmaya izin verilir
 * (ortalanır; kenar boşluğu karşılar) — ve asla `--size-tap-min` altı değil.
 *
 * Saf: piksel girer, piksel (veya varsayılan için `null`) çıkar.
 */
export function sikisikKartBoyu(o: {
  /** Etkileşim alanının (GameShell alt bölümü) genişliği ve yüksekliği, px. */
  alanGenislik: number;
  alanYukseklik: number;
  adet: number;
  /** `--size-choice`, `--size-primary`, `--size-gap`, `--size-tap-min` (px). */
  secim: number;
  birincil: number;
  aralik: number;
  tapMin: number;
}): number | null {
  const { alanGenislik, alanYukseklik, adet, secim, birincil, aralik, tapMin } = o;
  if (!(alanGenislik > 0) || !(alanYukseklik > 0) || adet < 1 || !(secim > 0)) return null;
  const yanYana = (alanGenislik - (adet - 1) * aralik) / adet;
  const dikey = alanYukseklik - birincil;
  const sinir = Math.min(yanYana, dikey);
  if (secim <= sinir) return null;
  return Math.max(tapMin, Math.floor(sinir));
}

/**
 * EŞLEŞTİRME (MATCH_PAIRS) YERLEŞİMİ (KG-128) — sol ve sağ kart grupları.
 *
 * Eski düzen iki SÜTUN (sol | sağ), her kart en az `--size-choice` (tahta 320 px, tablet 200 px): M-GEO-EŞLE
 * 3 + 5 kartta sağ sütun 5 × 320 + 4 × 51 = 1804 px — 1920×1080 tahtada bile alt alanı (≈ 585 px) aşıyor, kartlar
 * üst %35'e ve ekranın üstüne/altına taşıyor, soru hoparlörünün üstüne biniyordu (tablette de 5 × 200 > 453).
 * Kural: varsayılan iki sütun sığıyorsa DOKUNMA; sığmıyorsa iki yön de ölçülür — SÜTUN (n satır × 2) ve SATIR
 * (üstte sol grup, altta sağ grup; 2 satır × n) — hangisinde kart büyükse o seçilir (eşitse sütun), kart
 * `--size-choice`'u geçmez ve asla `--size-tap-min` altına inmez. Dikey alan = alt alan − alt çubuk; KG-127 gibi
 * en çok bir `--size-gap` taşma (ortalanır; bölümler arası boşluk ve alt kenar karşılar) kabul edilir.
 *
 * Saf: piksel girer; `null` = varsayılan düzen.
 */
export interface EslestirmeDuzeni {
  yon: 'sutun' | 'satir';
  /** Kartın yüksekliği ve genişliği, px (`enBoy` 1 ise kare). */
  kart: number;
  genislik: number;
}

export function eslestirmeDuzeni(o: {
  alanGenislik: number;
  alanYukseklik: number;
  sol: number;
  sag: number;
  /** `--size-choice`, alt çubuk yüksekliği (`--size-control`: yalnız ↻), `--size-gap`, `--size-tap-min` (px). */
  secim: number;
  altCubuk: number;
  aralik: number;
  tapMin: number;
  /**
   * İstenen kart en/boy oranı (varsayılan 1, kare). İşlem kartı ("5 + 2 = 7") yatay bir şerittir: kare kartta
   * rakamları okunmayacak kadar küçülür; 2,8 verilince kart yüksekliği aynı kalır, genişlik sığdığı kadar büyür.
   */
  enBoy?: number;
}): EslestirmeDuzeni | null {
  const { alanGenislik: W, alanYukseklik, sol, sag, secim, altCubuk, aralik: a, tapMin } = o;
  const enBoy = Math.max(1, o.enBoy ?? 1);
  const n = Math.max(sol, sag);
  if (!(W > 0) || !(alanYukseklik > 0) || n < 1 || !(secim > 0)) return null;
  const H = alanYukseklik - altCubuk;
  if (enBoy === 1 && n * secim + (n - 1) * a <= H && 2 * secim + a <= W) return null;
  // Her yön için kart yüksekliği (h) ve o yükseklikte en/boy oranına göre genişlik (w); yükseklik genişliğe de sığmalı.
  const yerlesim = (yon: 'sutun' | 'satir') => {
    const hBos = yon === 'satir' ? (H - a) / 2 : (H - (n - 1) * a) / n;
    const wBos = yon === 'satir' ? (W - (n - 1) * a) / n : (W - a) / 2;
    const h = Math.min(secim, hBos, wBos);
    const w = Math.min(h * enBoy, wBos);
    return { yon, h, w };
  };
  const sutun = yerlesim('sutun');
  const satir = yerlesim('satir');
  const iyi = satir.h > sutun.h ? satir : sutun;
  const kart = Math.max(tapMin, Math.floor(iyi.h));
  return { yon: iyi.yon, kart, genislik: Math.max(kart, Math.floor(iyi.w)) };
}

function px(cs: CSSStyleDeclaration, ad: string): number {
  return parseFloat(cs.getPropertyValue(ad)) || 0;
}

export interface EtkilesimAlani {
  genislik: number;
  yukseklik: number;
  /** Kök CSS değişkenleri, px. */
  secim: number;
  birincil: number;
  kontrol: number;
  aralik: number;
  tapMin: number;
}

/**
 * `isaret` öğesinin EBEVEYNİNİN (GameShell etkileşim bölümü; `flex: 1`, boyu içerikten bağımsız) boyunu boyamadan
 * önce ölçer (KG-126: ilk kare taşmasın) ve yeniden boyutlanınca günceller. Ölçüm yoksa `null`.
 */
export function useEtkilesimAlani(isaret: RefObject<HTMLElement | null>): EtkilesimAlani | null {
  const [alan, setAlan] = useState<EtkilesimAlani | null>(null);
  useLayoutEffect(() => {
    const el = isaret.current?.parentElement;
    if (!el) return;
    const olc = () => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(document.documentElement);
      const yeni: EtkilesimAlani = {
        genislik: r.width,
        yukseklik: r.height,
        secim: px(cs, '--size-choice'),
        birincil: px(cs, '--size-primary'),
        kontrol: px(cs, '--size-control'),
        aralik: px(cs, '--size-gap'),
        tapMin: px(cs, '--size-tap-min'),
      };
      setAlan((eski) =>
        eski && (Object.keys(yeni) as (keyof EtkilesimAlani)[]).every((k) => eski[k] === yeni[k]) ? eski : yeni,
      );
    };
    olc();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isaret]);
  return alan;
}

/** AUDIO_TO_IMAGE ve SEQUENCE_ORDER (alt çubukta Onayla): `null` = varsayılan kart boyu. */
export function useSikisikKartBoyu(isaret: RefObject<HTMLElement | null>, adet: number): number | null {
  const a = useEtkilesimAlani(isaret);
  if (!a) return null;
  return sikisikKartBoyu({
    alanGenislik: a.genislik,
    alanYukseklik: a.yukseklik,
    adet,
    secim: a.secim,
    birincil: a.birincil,
    aralik: a.aralik,
    tapMin: a.tapMin,
  });
}

/** MATCH_PAIRS (alt çubukta yalnız ↻): `null` = varsayılan iki sütun. */
export function useEslestirmeDuzeni(
  isaret: RefObject<HTMLElement | null>,
  sol: number,
  sag: number,
  enBoy = 1,
): EslestirmeDuzeni | null {
  const a = useEtkilesimAlani(isaret);
  if (!a) return null;
  return eslestirmeDuzeni({
    alanGenislik: a.genislik,
    alanYukseklik: a.yukseklik,
    sol,
    sag,
    secim: a.secim,
    altCubuk: a.kontrol,
    aralik: a.aralik,
    tapMin: a.tapMin,
    enBoy,
  });
}
