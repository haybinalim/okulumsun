import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * SIKIŞIK EKRANDA SEÇENEK KARTI BOYU (KG-127) — AUDIO_TO_IMAGE alt alanı.
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

function px(cs: CSSStyleDeclaration, ad: string): number {
  return parseFloat(cs.getPropertyValue(ad)) || 0;
}

/**
 * `isaret` öğesinin EBEVEYNİNİN (GameShell etkileşim bölümü; `flex: 1`, boyu içerikten bağımsız) boyunu boyamadan önce ölçer (KG-126: ilk kare taşmasın) ve yeniden
 * boyutlanınca günceller. `null` = varsayılan kart boyu.
 */
export function useSikisikKartBoyu(isaret: RefObject<HTMLElement | null>, adet: number): number | null {
  const [boy, setBoy] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = isaret.current?.parentElement;
    if (!el) return;
    const olc = () => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(document.documentElement);
      setBoy(
        sikisikKartBoyu({
          alanGenislik: r.width,
          alanYukseklik: r.height,
          adet,
          secim: px(cs, '--size-choice'),
          birincil: px(cs, '--size-primary'),
          aralik: px(cs, '--size-gap'),
          tapMin: px(cs, '--size-tap-min'),
        }),
      );
    };
    olc();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isaret, adet]);
  return boy;
}
