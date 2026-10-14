import { expect, test, type Page } from '@playwright/test';
import { geometriIhlalleri } from './yardimci/geometri';

/**
 * Plan v2 KG-86: M-SAY (TapCountScreen) yerleşimi tahta ve tablet profillerinde.
 * Geliştirme önizlemesi (`?gelistirme=say`, yalnız dev sunucu) belirli adet/yerleşimi açar. Denetlenenler:
 * nesneler ≥ `--size-tap-min` (tahta 102, büyük hedefte 118 px) ve çakışmıyor; hiçbir dokunulabilir öğe
 * üst %35'e taşmıyor (tahtada kutunun üst kenarı da), hepsi pencerede; nesneler kartlar/çubukla çakışmıyor.
 */

const DURUMLAR = [
  { adet: 1, yerlesim: 'sira' },
  { adet: 6, yerlesim: 'sira' },
  { adet: 10, yerlesim: 'gruplu' },
  { adet: 10, yerlesim: 'onlukCerceve' },
  { adet: 20, yerlesim: 'onlukCerceve' },
  { adet: 16, yerlesim: 'dagınık' },
] as const;

interface Olcum {
  tapMin: number;
  nesneler: { x: number; y: number; w: number; h: number }[];
  digerleri: { ad: string; x: number; y: number; w: number; h: number }[];
}

async function olc(page: Page): Promise<Olcum> {
  return page.evaluate(() => {
    const kutu = (e: Element) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const tum = [...document.querySelectorAll('button')];
    return {
      tapMin: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-tap-min')),
      nesneler: tum.filter((b) => b.getAttribute('aria-label')?.startsWith('nesne ')).map(kutu),
      digerleri: tum
        .filter((b) => !b.getAttribute('aria-label')?.startsWith('nesne '))
        .map((b) => ({ ad: b.getAttribute('aria-label') ?? '', ...kutu(b) })),
    };
  });
}

const kesisir = (a: Olcum['nesneler'][number], b: Olcum['nesneler'][number], tol = 1): boolean =>
  a.x + a.w - tol > b.x && b.x + b.w - tol > a.x && a.y + a.h - tol > b.y && b.y + b.h - tol > a.y;

for (const buyukHedef of [false, true]) {
  for (const { adet, yerlesim } of DURUMLAR) {
    test(`M-SAY yerleşimi: ${adet} nesne, ${yerlesim}${buyukHedef ? ', büyük hedef' : ''}`, async ({ page }, info) => {
      const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(
        `/?gelistirme=say&device=${cihaz}&adet=${adet}&yerlesim=${encodeURIComponent(yerlesim)}${buyukHedef ? '#ayar=1.b' : ''}`,
      );
      await expect(page.getByRole('button', { name: `nesne ${adet}`, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Onayla' })).toBeVisible();
      const o = await olc(page);
      const beklenenTap = cihaz === 'board' ? (buyukHedef ? 118 : 102) : buyukHedef ? 74 : 64;
      expect(Math.round(o.tapMin)).toBe(beklenenTap);
      expect(o.nesneler).toHaveLength(adet);

      for (const [i, n] of o.nesneler.entries()) {
        expect(n.w, `nesne ${i + 1} genişlik`).toBeGreaterThanOrEqual(o.tapMin - 1);
        expect(n.h, `nesne ${i + 1} yükseklik`).toBeGreaterThanOrEqual(o.tapMin - 1);
        for (const [j, m] of o.nesneler.entries()) {
          if (j > i) expect(kesisir(n, m), `nesne ${i + 1} ↔ nesne ${j + 1} çakışıyor`).toBe(false);
        }
        for (const d of o.digerleri) expect(kesisir(n, d), `nesne ${i + 1} ↔ ${d.ad} çakışıyor`).toBe(false);
      }

      const { pencereH, pencereW } = await page.evaluate(() => ({ pencereH: innerHeight, pencereW: innerWidth }));
      for (const b of [...o.nesneler.map((n, i) => ({ ad: `nesne ${i + 1}`, ...n })), ...o.digerleri]) {
        // Tahtada kutunun ÜST kenarı da ölü bölgenin altında (kart/Onayla üst %35'e taşmaz); hepsi pencerede.
        if (cihaz === 'board') expect(b.y, `${b.ad} üst %35'e taşıyor`).toBeGreaterThanOrEqual(pencereH * 0.35 - 1);
        expect(b.y + b.h, `${b.ad} alttan taşıyor`).toBeLessThanOrEqual(pencereH + 1);
        expect(b.x, `${b.ad} soldan taşıyor`).toBeGreaterThanOrEqual(-1);
        expect(b.x + b.w, `${b.ad} sağdan taşıyor`).toBeLessThanOrEqual(pencereW + 1);
      }
      expect(await geometriIhlalleri(page)).toBe('');

      if (process.env.SAY_EKRAN_GORUNTUSU) await page.screenshot({ path: `${process.env.SAY_EKRAN_GORUNTUSU}/${cihaz}-${adet}-${yerlesim}${buyukHedef ? '-b' : ''}.png` });

      // Davranış: her nesneye bir kez dokunulur, sayaç ilerler; şık + Onayla erişilebilir.
      await page.getByRole('button', { name: 'nesne 1', exact: true }).click();
      await expect(page.getByText('📋 1')).toBeVisible();
    });
  }
}
