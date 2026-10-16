// @vitest-environment happy-dom
/**
 * Rakam glifleri tek kaynağı (plan v2 Adım 30, KG-95: MEB TYMM TemelYazi).
 * Path'ler `scripts/rakam-glif-uret.py` ile TemelYazi'den üretilir; bu testler
 * MEB formunu (bayraklı 1, çizgili 7, açık üstlü 4) ve tek kaynağı korur.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { RAKAM_GLIFLERI } from '../../src/ui/svg/rakamGlifleri';
import { RAKAM_KILAVUZ_YOLLARI } from '../../src/ui/svg/rakamKilavuzYollari';
import { Visual } from '../../src/ui/svg/Visual';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const glif = (r: number) => RAKAM_GLIFLERI.find((g) => g.rakam === r)!;
/** Path'teki alt yol (kontur) sayısı. */
const konturSayisi = (p: string) => (p.match(/M/g) ?? []).length;
/** Path'teki tüm koordinat çiftleri (yalnız M/L/C komutlarının sayı dizileri; H/V hariç). */
function noktalar(p: string): [number, number][] {
  const sonuc: [number, number][] = [];
  for (const m of p.matchAll(/[MLC]([^A-Za-z]*)/g)) {
    const s = m[1]
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    for (let i = 0; i + 1 < s.length; i += 2) sonuc.push([s[i], s[i + 1]]);
  }
  return sonuc;
}

describe('rakam glifleri (KG-95, MEB TemelYazi)', () => {
  it('10 glif var, dolgulu path ve MEB yazım yönü', () => {
    expect(RAKAM_GLIFLERI).toHaveLength(10);
    expect(RAKAM_GLIFLERI.map((g) => g.rakam)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const g of RAKAM_GLIFLERI) {
      expect(g.path.startsWith('M')).toBe(true);
      expect(g.path.trim().endsWith('Z')).toBe(true); // kapalı kontur: dolgu
      expect(g.genislik).toBeGreaterThan(0);
      expect(g.genislik).toBeLessThanOrEqual(100);
      expect(g.yazimSirasi.length).toBeGreaterThan(0);
      // Ortak çizgiler: taban y=85, üst ~y=15 (rakam yüksekliği 70).
      const ys = noktalar(g.path).map((n) => n[1]);
      expect(Math.max(...ys)).toBeGreaterThan(84);
      expect(Math.max(...ys)).toBeLessThanOrEqual(85.3);
      expect(Math.min(...ys)).toBeLessThan(16);
      expect(Math.min(...ys)).toBeGreaterThan(13.5);
    }
    // MEB Kılavuz okları: 4, 5 ve 7 iki hamle; diğerleri tek hamle.
    expect(RAKAM_GLIFLERI.filter((g) => g.yazimSirasi.length === 2).map((g) => g.rakam)).toEqual([4, 5, 7]);
  });

  it("'1' bayraklı ve tabansız (dar, tek kontur)", () => {
    const p = glif(1).path;
    expect(konturSayisi(p)).toBe(1);
    expect(glif(1).genislik).toBeLessThan(20); // taban çizgisi yok
    // Bayrak: tepe noktası glifin sağında, bayrağın ucu solda ve tepeden aşağıda.
    const n = noktalar(p);
    const tepe = n.reduce((a, b) => (b[1] < a[1] ? b : a));
    const enSol = n.reduce((a, b) => (b[0] < a[0] ? b : a));
    expect(enSol[0]).toBeLessThan(tepe[0] - 5);
    expect(enSol[1]).toBeGreaterThan(tepe[1] + 5);
    expect(enSol[1]).toBeLessThan(50);
  });

  it("'7' ortası çizgili (MEB TYMM), kılavuzda iki hamle", () => {
    // Orta çizgi gövdeyle birleşik çizilir: orta yükseklikte (y 40–60) gövdeden
    // sağa/sola taşan yatay kenarlar var.
    const n = noktalar(glif(7).path);
    const ortaX = n.filter(([, y]) => y > 40 && y < 60).map(([x]) => x);
    expect(Math.max(...ortaX) - Math.min(...ortaX)).toBeGreaterThan(20);
    expect(glif(7).yazimSirasi[1]).toMatch(/orta/i);
  });

  it("'4' açık üstlü (çapraz ile dik çizgi tepede birleşmez)", () => {
    // MEB 4: çapraz en üste (y≈15) çıkar; sağdaki dik çizgi kısa, tepesi orta çizgiye yakın.
    const n = noktalar(glif(4).path);
    expect(Math.min(...n.map(([, y]) => y))).toBeLessThan(16);
    const sagdakiTepe = Math.min(...n.filter(([x]) => x > 61).map(([, y]) => y));
    expect(sagdakiTepe).toBeGreaterThan(30);
  });

  it('kılavuz yolları 10 rakam için var (geliştirme/öğretmen formu)', () => {
    expect(RAKAM_KILAVUZ_YOLLARI).toHaveLength(10);
    for (const [i, k] of RAKAM_KILAVUZ_YOLLARI.entries()) {
      expect(konturSayisi(k)).toBeGreaterThan(konturSayisi(glif(i).path)); // oklar + numaralar
    }
  });

  it('metin rakamları: TemelYaziRakam alt kümesi ve CSS yığını', () => {
    expect(existsSync('public/fonts/TemelYazi-Rakam.woff2')).toBe(true);
    expect(statSync('public/fonts/TemelYazi-Rakam.woff2').size).toBeLessThan(8000);
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toContain("font-family: 'TemelYaziRakam'");
    expect(css).toMatch(/unicode-range: U\+0030-0039/);
    // KG-96: rakam alt kümesi yetişkin yığınında (Andika harfleriyle); çocuk yığınında harf dosyasından sonra.
    expect(css).toContain("--font-yetiskin: 'TemelYaziRakam', 'Andika'");
    expect(css).toContain("--font-sans: 'TemelYazi', 'TemelYaziRakam', 'Andika'");
    expect(readFileSync('src/ui/print/kagit.css', 'utf8')).toContain("'TemelYazi', 'TemelYaziRakam', 'Andika'");
  });

  it('Visual Rakam bileşeni RAKAM_GLIFLERI kullanır, dolgulu çizer', () => {
    const kaynak = readFileSync('src/ui/svg/Visual.tsx', 'utf8');
    expect(kaynak).toContain("from './rakamGlifleri'");
    expect(kaynak).not.toContain('rakamKilavuzYollari'); // kılavuz paket dışı
    expect(kaynak).not.toMatch(/RAKAM_PATHS\s*[:=]/);
    for (const g of RAKAM_GLIFLERI) expect(kaynak).not.toContain(g.path);

    const kap = document.createElement('div');
    const kok = createRoot(kap);
    act(() => kok.render(createElement(Visual, { spec: { type: 'rakam', sayi: 1907 }, width: 400, height: 200 })));
    const yollar = [...kap.querySelectorAll('path')];
    expect(yollar.map((p) => p.getAttribute('d'))).toEqual([1, 9, 0, 7].map((r) => glif(r).path));
    for (const p of yollar) {
      expect(p.getAttribute('fill')).toBe('var(--color-ink)');
      expect(p.getAttribute('stroke')).toBeNull();
    }
    act(() => kok.unmount());
  });
});
