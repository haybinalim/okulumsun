/**
 * Plan v2 Adım 59 (KG-104): nesne sprite'ları ve materyal çizimleri.
 *
 * - Renk tonu yardımcısı saf ve gri tonda okunur (kontur koyu, ışık > temel > gölge).
 * - Her sprite kodla çizilmiş SVG: dış kaynak, <image>, metin/emoji yok; verilen `fill` temel renk olur.
 * - Aynı sahnede birden çok örnek: maske/kırpma kimlikleri tekil ve her `url(#…)` aynı belgede çözülür.
 */
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { ACCENTS, ACCENTS_RENK_KORLUGU } from '../../src/design/tokens';
import {
  KONUM_ILISKILERI,
  KONUM_REFERANSLARI,
  NESNE_SPRITELARI,
  SEKILLER,
  type VisualSpec,
} from '../../src/exercises/types';
import { aynala, daire, golgeKaydirmasi, guvenliKimlik, materyalKonturu } from '../../src/ui/svg/cizimYardimcilari';
import { goreliParlaklik, hexRgb, nesneTonlari } from '../../src/ui/svg/renkTonlari';
import { Sprite } from '../../src/ui/svg/Sprite';
import { Visual } from '../../src/ui/svg/Visual';

const DOGAL = [
  '#D4334A',
  '#2563EB',
  '#DB2777',
  '#059669',
  '#CA8A04',
  '#0EA5E9',
  '#EC4899',
  '#EAB308',
  '#EA580C',
  '#7C3AED',
];
const TUM_RENKLER = [...new Set([...ACCENTS.map((a) => a.hex), ...Object.values(ACCENTS_RENK_KORLUGU), ...DOGAL])];

/** WCAG kontrast oranı. */
function kontrast(a: string, b: string): number {
  const [x, y] = [goreliParlaklik(a), goreliParlaklik(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

/** Bir işaretlemedeki tanımlı kimlikler ve `url(#…)` başvuruları. */
function kimlikler(html: string) {
  const tanimli = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
  const basvuru = [...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]!);
  return { tanimli, basvuru };
}

describe('nesneTonlari', () => {
  test.each(TUM_RENKLER)('%s: ışık > temel > gölge > kontur (gri tonda da sıralı)', (hex) => {
    const t = nesneTonlari(hex);
    expect(t.temel).toBe(hex.toUpperCase());
    for (const v of [t.golge, t.isik, t.kontur]) expect(hexRgb(v)).not.toBeNull();
    const L = (c: string) => goreliParlaklik(c);
    expect(L(t.isik)).toBeGreaterThan(L(t.temel));
    expect(L(t.temel)).toBeGreaterThan(L(t.golge));
    expect(L(t.golge)).toBeGreaterThan(L(t.kontur));
    // Siyah-beyaz baskıda kontur koyu kalır, gövde ile ayrışır.
    expect(L(t.kontur)).toBeLessThanOrEqual(0.06);
    // Açık/orta renklerde ≥ 1,8:1; zaten koyu renklerde (renk körlüğü paleti) ≥ 1,4:1.
    expect(kontrast(t.temel, t.kontur)).toBeGreaterThanOrEqual(L(t.temel) >= 0.08 ? 1.8 : 1.4);
    // Gölge ve ışık griye çevrilince de görünür (ayrım ≥ 1,2:1).
    expect(kontrast(t.temel, t.golge)).toBeGreaterThanOrEqual(1.2);
    expect(kontrast(t.isik, t.temel)).toBeGreaterThanOrEqual(1.2);
  });

  test('saf ve deterministik; hex olmayan girdi (CSS değişkeni) örtüye düşer', () => {
    expect(nesneTonlari('#2563eb')).toEqual(nesneTonlari('#2563EB'));
    const v = nesneTonlari('var(--color-accent)');
    expect(v.temel).toBe('var(--color-accent)');
    expect(v.golge).toMatch(/^rgba\(/);
    expect(v.isik).toMatch(/^rgba\(/);
    expect(v.kontur).toBe('#2B2B2B');
    expect(nesneTonlari('#abc').temel).toBe('#ABC');
  });

  test('ton adı aynı aileden: kontur temel rengin tonunu korur (saf siyah değil)', () => {
    const t = nesneTonlari('#2563EB');
    const [r, , b] = hexRgb(t.kontur)!;
    expect(b).toBeGreaterThan(r);
  });
});

describe('çizim yardımcıları', () => {
  test('daire ve aynala', () => {
    expect(daire(50, 50, 10)).toBe('M40 50A10 10 0 1 0 60 50A10 10 0 1 0 40 50Z');
    expect(aynala('M10 20L30 40C1 2 3 4 5 6Z')).toBe('M90 20L70 40C99 2 97 4 95 6Z');
    expect(aynala(aynala('M12.5 3L40 7'))).toBe('M12.5 3L40 7');
  });

  test('gölge kaydırması dönüşte de ekranda sağ altta kalır', () => {
    for (const donus of [0, 18, 30, 90, 180, 270]) {
      const [x, y] = golgeKaydirmasi(10, donus);
      const a = (donus * Math.PI) / 180;
      const ex = x * Math.cos(a) - y * Math.sin(a);
      const ey = x * Math.sin(a) + y * Math.cos(a);
      // Kaydırılan kopya sol üste gider → hilal sağ altta.
      expect(ex).toBeCloseTo(-8, 1);
      expect(ey).toBeCloseTo(-10, 1);
    }
  });

  test('kimlik ve kontur', () => {
    expect(guvenliKimlik('«r1»')).toBe('cr1');
    expect(guvenliKimlik(':r2:')).toBe('cr2');
    expect(materyalKonturu(10)).toBe(2);
    expect(materyalKonturu(200)).toBeCloseTo(4.4, 5);
  });
});

describe('Sprite', () => {
  test.each(NESNE_SPRITELARI)('%s: kodla çizilmiş SVG, dış kaynak/metin yok, verilen renk temel olur', (ad) => {
    const html = renderToStaticMarkup(createElement(Sprite, { name: ad, size: 64, fill: '#2563EB' }));
    expect(html).toContain(`data-sprite="${ad}"`);
    expect(html).toContain('viewBox="0 0 100 100"');
    expect(html).not.toMatch(/<image|<text|<foreignObject|href=|https?:/);
    expect(html).toContain('#2563EB');
    expect(html).toContain(nesneTonlari('#2563EB').kontur);
    // 3–5 tonlu düz illüstrasyon: en az temel + gölge + kontur.
    expect(html).toContain(nesneTonlari('#2563EB').golge);
  });

  test('aynı sahnede 20 örnek: kimlikler tekil, her url(#…) çözülür', () => {
    const cocuklar = NESNE_SPRITELARI.flatMap((ad) => [
      createElement(Sprite, { key: `${ad}1`, name: ad, size: 64 }),
      createElement(Sprite, { key: `${ad}2`, name: ad, size: 102 }),
    ]);
    const html = renderToStaticMarkup(createElement(Fragment, null, ...cocuklar));
    const { tanimli, basvuru } = kimlikler(html);
    expect(new Set(tanimli).size).toBe(tanimli.length);
    for (const b of basvuru) expect(tanimli).toContain(b);
  });
});

describe('Visual materyalleri', () => {
  const ornekler: VisualSpec[] = [
    ...SEKILLER.map((sekil) => ({ type: 'sekil', sekil, donusDerece: 30 }) as VisualSpec),
    ...SEKILLER.map((sekil) => ({ type: 'sekil', sekil, renk: 'mavi' }) as VisualSpec),
    { type: 'onlukCerceve', gruplar: [10, 3] },
    { type: 'nesneKumesi', sprite: 'elma', adet: 7, layout: 'gruplu' },
    { type: 'islemSahnesi', nesne: 'balon', ilkAdet: 4, degisimAdedi: 2, islem: '-' },
    {
      type: 'olcumSahnesi',
      nesne: 'kalem',
      birim: 'yildiz',
      birimAdedi: 5,
      boyut: 'uzunluk',
      gorunum: 'birimlerleOlcum',
    },
    {
      type: 'olcumKarsilastirma',
      boyut: 'kutle',
      sol: { nesne: 'elma', renk: 'pembe', deger: 3 },
      sag: { nesne: 'top', renk: 'mavi', deger: 1 },
    },
    {
      type: 'olcumKarsilastirma',
      boyut: 'uzunluk',
      sol: { nesne: 'kalem', renk: 'mor', deger: 6 },
      sag: { nesne: 'kalem', renk: 'yesil', deger: 4 },
    },
    ...KONUM_REFERANSLARI.flatMap((referans) =>
      KONUM_ILISKILERI.map((iliski) => ({ type: 'konumSahnesi', iliski, referans, hedef: 'top' }) as VisualSpec),
    ),
  ];

  test('her materyal tek belgede birlikte çizilince kimlikler tekil, başvurular çözülür, dış kaynak yok', () => {
    const html = renderToStaticMarkup(
      createElement(
        Fragment,
        null,
        ...ornekler.map((spec, i) => createElement(Visual, { key: i, spec, width: 200, height: 200 })),
      ),
    );
    const { tanimli, basvuru } = kimlikler(html);
    expect(new Set(tanimli).size).toBe(tanimli.length);
    for (const b of basvuru) expect(tanimli).toContain(b);
    expect(html).not.toMatch(/<image|https?:/);
  });

  test('onluk çerçeve dolu göz sayısı kadar pul çizer (yapı korunur)', () => {
    const html = renderToStaticMarkup(
      createElement(Visual, { spec: { type: 'onlukCerceve', gruplar: [10, 3] }, width: 360, height: 200 }),
    );
    // Her pul bir gölge maskesi taşır.
    expect(html.match(/<mask /g)?.length).toBe(13);
  });

  test('içinde: hedef arka duvar ile ön duvarın arasında çizilir', () => {
    for (const referans of KONUM_REFERANSLARI) {
      const html = renderToStaticMarkup(
        createElement(Visual, {
          spec: { type: 'konumSahnesi', iliski: 'icinde', referans, hedef: 'elma' },
          width: 200,
          height: 200,
        }),
      );
      const sira = [...html.matchAll(/data-(referans|sprite)="([^"]+)"/g)].map((m) => m[1]);
      expect(sira).toEqual(['referans', 'sprite', 'referans']);
    }
  });
});
