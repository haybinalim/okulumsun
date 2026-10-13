// @vitest-environment happy-dom
/**
 * Rakam glifleri tek kaynağı (plan v2 Adım 30).
 * Path'ler öğretmen görüşü gelmeden değişmez; bu testler formu ve tek kaynağı korur.
 */
import { readFileSync } from 'node:fs';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { RAKAM_GLIFLERI, altYolBaslangiclari } from '../../src/ui/svg/rakamGlifleri';
import { Visual } from '../../src/ui/svg/Visual';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const glif = (r: number) => RAKAM_GLIFLERI.find((g) => g.rakam === r)!;

describe('rakam glifleri (plan v2 Adım 30)', () => {
  it('10 glif var', () => {
    expect(RAKAM_GLIFLERI).toHaveLength(10);
    expect(RAKAM_GLIFLERI.map((g) => g.rakam)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const g of RAKAM_GLIFLERI) {
      expect(g.path.startsWith('M')).toBe(true);
      expect(g.genislik).toBeGreaterThan(0);
      expect(g.genislik).toBeLessThanOrEqual(100);
      expect(g.yazimSirasi).toHaveLength(altYolBaslangiclari(g.path).length);
    }
  });

  it("'1' kancalı (path ilk segment yön kontrolü)", () => {
    const [ilk] = altYolBaslangiclari(glif(1).path);
    // Kanca: dik çizginin solundan başlar ve ilk segment sağa-yukarı gider.
    const dikX = 45;
    expect(ilk.x).toBeLessThan(dikX);
    expect(ilk.dx).toBeGreaterThan(0);
    expect(ilk.dy).toBeLessThan(0);
    // Ardından uzun dik iniş: path dikey bir L ile biter.
    expect(glif(1).path).toMatch(/L45 30 L45 82$/);
  });

  it("'7' çizgisiz", () => {
    const p = glif(7).path;
    // Tek alt yol (ayrı bir orta çizgi yok) ve üst çizgi dışında yatay segment yok.
    expect(altYolBaslangiclari(p)).toHaveLength(1);
    const noktalar = [...p.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const yataySegmentYlari = noktalar.slice(1)
      .map((n, i) => (n[1] === noktalar[i][1] && n[0] !== noktalar[i][0] ? n[1] : null))
      .filter((y): y is number => y !== null);
    expect(yataySegmentYlari).toEqual([20]);
  });

  it('Visual Rakam bileşeni RAKAM_GLIFLERI kullanır', () => {
    // Kaynakta path kopyası yok, tek kaynaktan içe aktarılıyor.
    const kaynak = readFileSync('src/ui/svg/Visual.tsx', 'utf8');
    expect(kaynak).toContain("from './rakamGlifleri'");
    expect(kaynak).not.toMatch(/RAKAM_PATHS\s*[:=]/);
    for (const g of RAKAM_GLIFLERI) expect(kaynak).not.toContain(g.path);

    // Çizilen path'ler birebir RAKAM_GLIFLERI'nden.
    const kap = document.createElement('div');
    const kok = createRoot(kap);
    act(() => kok.render(createElement(Visual, { spec: { type: 'rakam', sayi: 1907 }, width: 400, height: 200 })));
    const dler = [...kap.querySelectorAll('path')].map((p) => p.getAttribute('d'));
    expect(dler).toEqual([1, 9, 0, 7].map((r) => glif(r).path));
    act(() => kok.unmount());
  });
});
