/**
 * Adım 65 — Türkçe kâğıt ailesi v1 (`src/ui/tur/kagit/`): kâğıt kodu (68 glif + dikte + gözlem, gidiş-dönüş),
 * ölçüler (1 cm satır dizgesi 0,5 + 0,5, dizge arası 10 mm, kalibrasyon 10 mm), sayfa tavanı (her kâğıt 1 sayfa),
 * taşma yok, kendi orta çizgimiz (font yok), renk / `<mask>` / puan yok; matematik kâğıt koduna dokunulmadı.
 */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hamleDosyasiniAyristir } from '../../src/content/schema/turHamle';
import { SATIR } from '../../src/ui/tur/hamleCizim';
import { TurKagitSayfasi } from '../../src/ui/tur/kagit/TurKagitSayfasi';
import {
  A4,
  BIRIM_MM,
  DESTEK_EN_COK,
  CIZGI_MM,
  DIZGE_ARASI_MM,
  DIZGE_MM,
  GOZLEM_BOLUMLERI,
  ICERIK,
  KALIBRASYON_MM,
  KALIBRASYON_NOTU,
  kopyaKonumlari,
  sayfaTasmasi,
  turKagitKodu,
  turKagitKoduCoz,
  turKagitSayfalari,
  type TurKagitIstegi,
} from '../../src/ui/tur/kagit/turKagidi';

const VERI = hamleDosyasiniAyristir(JSON.parse(readFileSync('ders-verisi/tur/hamleler.json', 'utf8')));
const istek = (g: (typeof VERI.glifler)[number]): TurKagitIstegi =>
  g.bicim === 'rakam' ? { tur: 'rakam', bicim: 'rakam', glif: g.glif } : { tur: 'harf', bicim: g.bicim, glif: g.glif };

describe('kâğıt kodu', () => {
  it('68 glifin hepsi + dikte + gözlem gidiş-dönüş; büyük/küçük ve i/İ, ı/I ayrı', () => {
    const kodlar = new Set<string>();
    for (const g of VERI.glifler) {
      const kod = turKagitKodu(istek(g));
      kodlar.add(kod);
      expect(turKagitKoduCoz(kod)).toEqual(istek(g));
      expect(turKagitKoduCoz(encodeURIComponent(kod))).toEqual(istek(g));
    }
    expect(kodlar.size).toBe(68);
    expect(turKagitKoduCoz('tur-dikte')).toEqual({ tur: 'dikte' });
    expect(turKagitKoduCoz('tur-gozlem')).toEqual({ tur: 'gozlem' });
    expect(turKagitKoduCoz('tur-harf-i')).toEqual({ tur: 'harf', bicim: 'kucuk', glif: 'i' });
    expect(turKagitKoduCoz('tur-harf-İ')).toEqual({ tur: 'harf', bicim: 'buyuk', glif: 'İ' });
    expect(turKagitKoduCoz('tur-harf-ı')).toEqual({ tur: 'harf', bicim: 'kucuk', glif: 'ı' });
    expect(turKagitKoduCoz('tur-harf-I')).toEqual({ tur: 'harf', bicim: 'buyuk', glif: 'I' });
  });

  it('geçersiz kodlar reddedilir (Türkçe dışı harf, birden çok karakter, matematik kodu, bozuk kodlama)', () => {
    for (const k of [
      'tur-harf-q',
      'tur-harf-w',
      'tur-harf-x',
      'tur-harf-ab',
      'tur-rakam-10',
      'tur-rakam-a',
      'tur-harf-',
      'tur-',
      'ETKI-1-A',
      'tur-harf-%E0%A4%A',
    ])
      expect(turKagitKoduCoz(k), k).toBeNull();
  });
});

describe('ölçüler', () => {
  it('satır dizgesi 1 cm (0,5 + 0,5), 1 birim = 1/6 mm, dizge arası 10 mm, çizgiler 0,35 / 0,25 mm', () => {
    expect(DIZGE_MM).toBe(10);
    expect(BIRIM_MM * SATIR.cmBirim).toBeCloseTo(10, 9);
    expect((SATIR.kilavuz - SATIR.ust) * BIRIM_MM).toBeCloseTo(5, 9);
    expect(DIZGE_ARASI_MM).toBe(10);
    expect(CIZGI_MM.ust).toBe(0.35);
    expect(CIZGI_MM.taban).toBe(0.35);
    expect(CIZGI_MM.kilavuz).toBe(0.25);
    expect(KALIBRASYON_MM).toBe(10);
    expect(A4).toEqual({ en: 210, boy: 297, kenar: 12 });
  });

  it('kopyalar satıra sığar ve üst üste binmez', () => {
    for (const g of VERI.glifler) {
      const k = kopyaKonumlari(g, 40, ICERIK.x + ICERIK.en - 2);
      expect(k.length, g.glif).toBeGreaterThanOrEqual(4);
      for (let i = 1; i < k.length; i++) expect(k[i] - k[i - 1]).toBeGreaterThan(g.genislik * BIRIM_MM + 8);
      expect(k[k.length - 1] + g.genislik * BIRIM_MM).toBeLessThanOrEqual(ICERIK.x + ICERIK.en - 2 + 1e-9);
    }
  });
});

describe('sayfalar', () => {
  const tum = [...VERI.glifler.map(istek), { tur: 'dikte' } as const, { tur: 'gozlem' } as const];

  it('her kâğıt tek sayfa (sayfa tavanı), içerik alanından taşmaz', () => {
    for (const i of tum) {
      const s = turKagitSayfalari(i, VERI.glifler);
      expect(s, turKagitKodu(i)).toHaveLength(1);
      expect(sayfaTasmasi(s[0].sayfa), turKagitKodu(i)).toEqual([]);
    }
  });

  it('harf/rakam: 3 izleme, 3 birleştirme, 3 bağımsız satır; satır başında örnek; hamle başına yazılış karesi', () => {
    const [{ sayfa, glif }] = turKagitSayfalari({ tur: 'harf', bicim: 'buyuk', glif: 'M' }, VERI.glifler);
    expect(sayfa.satirlar.map((s) => s.kip)).toEqual([
      'izle',
      'izle',
      'izle',
      'birlestir',
      'birlestir',
      'birlestir',
      'bagimsiz',
      'bagimsiz',
      'bagimsiz',
    ]);
    expect(sayfa.satirlar.every((s) => s.ornekX !== undefined)).toBe(true);
    expect(sayfa.satirlar.filter((s) => s.kip === 'bagimsiz').every((s) => s.kopyalar.length === 0)).toBe(true);
    const html = renderToStaticMarkup(createElement(TurKagitSayfasi, { sayfa: sayfa, glif: glif }));
    expect(html.match(/data-yazilis-karesi=/g)).toHaveLength(glif!.hamleler.length);
    for (let k = 1; k < sayfa.satirlar.length; k++)
      expect(sayfa.satirlar[k].y - sayfa.satirlar[k - 1].y).toBeCloseTo(DIZGE_MM + DIZGE_ARASI_MM, 6);
  });

  it('dikte boş satırlar; gözlem listesi puansız (kutu + not), iki bölüm', () => {
    const [{ sayfa: d }] = turKagitSayfalari({ tur: 'dikte' }, VERI.glifler);
    expect(d.satirlar.length).toBeGreaterThanOrEqual(11);
    expect(d.satirlar.every((s) => s.kip === 'bos' && s.kopyalar.length === 0)).toBe(true);
    const [{ sayfa: g }] = turKagitSayfalari({ tur: 'gozlem' }, VERI.glifler);
    expect(g.gozlem).toBe(GOZLEM_BOLUMLERI);
    const html = renderToStaticMarkup(createElement(TurKagitSayfasi, { sayfa: g }));
    const olcutSayisi = GOZLEM_BOLUMLERI.reduce((t, b) => t + b.olcutler.length, 0);
    expect(html.match(/data-kutu=""/g)).toHaveLength(2 * olcutSayisi);
    expect(html).not.toMatch(/puan(ı|lama)?\s*[:0-9]|\b[123]\s*\/\s*[123]\b|\b[0-3]\s*puan/i);
    expect(html).toContain('Puan yok');
  });

  it('SVG: A4 mm, kalibrasyon karesi + not, renk yok (yalnız siyah/gri/beyaz), mask ve font konturu yok', () => {
    for (const i of [...tum.slice(0, 3), tum[60], tum[66], tum[68], tum[69]]) {
      const [{ sayfa, glif }] = turKagitSayfalari(i, VERI.glifler);
      const html = renderToStaticMarkup(createElement(TurKagitSayfasi, { sayfa: sayfa, glif: glif }));
      expect(html).toContain('width="210mm"');
      expect(html).toContain('height="297mm"');
      expect(html).toContain('viewBox="0 0 210 297"');
      expect(html).toMatch(/<rect[^>]*width="10"[^>]*height="10"[^>]*data-kalibrasyon=""/);
      expect(html).toContain(KALIBRASYON_NOTU);
      expect(html).not.toMatch(/<mask|<image|<use|<text[^>]*>[^<]*(Kilavuz|KesikCizgi)/);
      const renkler = new Set(
        [...html.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1].toUpperCase()),
      );
      for (const r of renkler) {
        const h =
          r.length === 4
            ? r
                .slice(1)
                .split('')
                .map((c) => c + c)
                .join('')
            : r.slice(1);
        expect(h.slice(0, 2) === h.slice(2, 4) && h.slice(2, 4) === h.slice(4, 6), `${turKagitKodu(i)} ${r}`).toBe(
          true,
        );
      }
    }
  });
});

describe('destek kâğıdı (tür 8)', () => {
  it('kod: seçim sırası korunur, rakam/küçük/büyük ayrılır; 1–6 glif, tekrarsız, Türkçe dışı yok', () => {
    const i = turKagitKoduCoz('tur-destek-a.N.ı.İ.4.ğ');
    expect(i).toEqual({
      tur: 'destek',
      glifler: [
        { bicim: 'kucuk', glif: 'a' },
        { bicim: 'buyuk', glif: 'N' },
        { bicim: 'kucuk', glif: 'ı' },
        { bicim: 'buyuk', glif: 'İ' },
        { bicim: 'rakam', glif: '4' },
        { bicim: 'kucuk', glif: 'ğ' },
      ],
    });
    expect(turKagitKodu(i!)).toBe('tur-destek-a.N.ı.İ.4.ğ');
    expect(turKagitKoduCoz(encodeURIComponent('tur-destek-a.N.ı.İ.4.ğ'))).toEqual(i);
    expect(DESTEK_EN_COK).toBe(6);
    for (const k of [
      'tur-destek-',
      'tur-destek-a.a',
      'tur-destek-a.b.c.d.e.f.g',
      'tur-destek-q',
      'tur-destek-ab',
      'tur-destek-a..b',
    ])
      expect(turKagitKoduCoz(k), k).toBeNull();
  });

  it('glif başına izleme + bağımsız satır, tek sayfa, en geniş 6 glifle bile taşmaz; her satır kendi glifi', () => {
    const genis = [...VERI.glifler].sort((a, b) => b.genislik - a.genislik).slice(0, 6);
    const i: TurKagitIstegi = { tur: 'destek', glifler: genis.map((g) => ({ bicim: g.bicim, glif: g.glif })) };
    const s = turKagitSayfalari(i, VERI.glifler);
    expect(s).toHaveLength(1);
    const { sayfa, glifler } = s[0];
    expect(sayfaTasmasi(sayfa)).toEqual([]);
    expect(sayfa.satirlar.map((r) => r.kip)).toEqual(genis.flatMap(() => ['izle', 'bagimsiz']));
    expect(sayfa.satirlar.map((r) => r.glifSirasi)).toEqual(genis.flatMap((_, n) => [n, n]));
    expect(glifler).toEqual(genis);
    const html = renderToStaticMarkup(createElement(TurKagitSayfasi, { sayfa, glifler }));
    expect(html).toContain(`data-tur-kagit="${turKagitKodu(i)}"`);
    expect(html.match(/data-glif-kalem="ornek"/g)).toHaveLength(12);
  });

  it('veride olmayan glif → kâğıt yok (sessizce eksik basılmaz)', () => {
    expect(turKagitSayfalari({ tur: 'destek', glifler: [{ bicim: 'rakam', glif: 'a' }] }, VERI.glifler)).toEqual([]);
  });
});

describe('ayrım', () => {
  it('Türkçe kâğıt modülleri matematik kâğıt kodunu içe aktarmaz; main.tsx dalı bayrak korumalı; adlı @page', () => {
    const css = readFileSync('src/ui/tur/kagit/turKagit.css', 'utf8');
    // Adlı sayfa: aynı oturumdaki matematik kâğıdının `@page` kuralıyla (kenar 12 mm) çakışmaz.
    expect(css).toMatch(/@page tur \{\s*size: A4;\s*margin: 0;/);
    expect(css).not.toMatch(/@page\s*\{/);
    expect(css).toMatch(/page: tur;/);
    for (const d of ['turKagidi.ts', 'TurKagitSayfasi.tsx', 'TurArsivKagidi.tsx', '../TurKagitEkranlari.tsx']) {
      const k = readFileSync(`src/ui/tur/kagit/${d}`, 'utf8');
      expect(k, d).not.toMatch(/from '[^']*(ogretmen\/calismaKagidi|ui\/print\/)/);
      expect(k, d).not.toMatch(/localStorage|indexedDB|speechSynthesis/);
    }
    const main = readFileSync('src/main.tsx', 'utf8');
    expect(main).toMatch(/import\.meta\.env\.VITE_DERS_TUR === '1' && arsivKodu\?\.startsWith\('tur-'\)/);
  });
});
