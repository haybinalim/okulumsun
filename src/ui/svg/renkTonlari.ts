/**
 * NESNE TONLARI — tek temel renkten gölge / ışık / kontur türetir (plan v2 Adım 59, KG-104).
 *
 * Sprite'ların API'si tek `fill` kabul eder (jeneratörün `renk` alanı ya da nesnenin doğal rengi).
 * Çocuk kitabı kalitesindeki düz illüstrasyon için her nesne 3–5 tonla çizilir; tonlar burada,
 * saf ve deterministik olarak, HSL uzayında temel renkten türetilir. Böylece "mavi top" isteyen
 * soru gerçekten mavi (gölgesi koyu mavi, ışığı açık mavi) bir top görür ve renk adı değişmez.
 *
 * Siyah-beyaz baskı (çalışma kâğıdı `filter: grayscale(1)`) için kontur her zaman koyudur
 * (göreli parlaklık ≤ 0,06) ve ışık/temel/gölge parlaklıkça sıralıdır — test hesaplar
 * (`tests/unit/renkTonlari.spec.ts`).
 */

export interface NesneTonlari {
  /** Gövde rengi (verilen renk, değişmeden). */
  readonly temel: string;
  /** Sağ alt gölge yüzeyi. */
  readonly golge: string;
  /** Sol üst ışık yüzeyi. */
  readonly isik: string;
  /** İnce koyu dış çizgi: aynı tonun çok koyusu (saf siyah değil, sıcak görünüm). */
  readonly kontur: string;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function hexRgb(hex: string): [number, number, number] | null {
  if (!HEX.test(hex)) return null;
  let h = hex.slice(1);
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbHsl([r, g, b]: [number, number, number]): Hsl {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
  else if (max === gg) h = (bb - rr) / d + 2;
  else h = (rr - gg) / d + 4;
  return { h: h * 60, s, l };
}

function hslHex({ h, s, l }: Hsl): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const x = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${x(f(0))}${x(f(8))}${x(f(4))}`.toUpperCase();
}

const sinirla = (v: number, alt: number, ust: number) => Math.max(alt, Math.min(ust, v));

/** WCAG göreli parlaklığı (0 siyah … 1 beyaz). Gri tonlu baskıda okunurluğu ölçmek için. */
export function goreliParlaklik(hex: string): number {
  const rgb = hexRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const onbellek = new Map<string, NesneTonlari>();

/**
 * Temel renkten nesne tonları. Hex olmayan girdi (ör. `var(--color-accent)`) için türetme
 * yapılamaz: temel aynen döner, gölge/ışık yarı saydam siyah/beyaz örtü olur, kontur mürekkep.
 */
export function nesneTonlari(temel: string): NesneTonlari {
  const kayitli = onbellek.get(temel);
  if (kayitli) return kayitli;
  const rgb = hexRgb(temel);
  let sonuc: NesneTonlari;
  if (!rgb) {
    sonuc = { temel, golge: 'rgba(15,23,42,0.24)', isik: 'rgba(255,255,255,0.42)', kontur: '#2B2B2B' };
  } else {
    const c = rgbHsl(rgb);
    // Gölge: biraz daha doygun ve belirgin koyu; sarılar çamurlaşmasın diye ton hafif sıcağa kayar.
    const golge = hslHex({ h: c.h, s: sinirla(c.s * 1.05, 0, 1), l: sinirla(c.l * 0.72, 0.08, 0.6) });
    // Işık: açık ve hafif doygunluğu düşük (kâğıt üstüne düşen ışık gibi).
    const isik = hslHex({ h: c.h, s: sinirla(c.s * 0.9, 0, 1), l: sinirla(c.l + (1 - c.l) * 0.45, 0.35, 0.92) });
    // Kontur: aynı tonun çok koyusu; gri tonda da koyu kalmalı.
    const kontur = hslHex({ h: c.h, s: sinirla(c.s * 0.7, 0, 0.75), l: 0.16 });
    sonuc = { temel: temel.toUpperCase(), golge, isik, kontur };
  }
  onbellek.set(temel, sonuc);
  return sonuc;
}
