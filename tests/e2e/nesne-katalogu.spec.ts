import { expect, test } from '@playwright/test';
import { NESNE_SPRITELARI } from '../../src/exercises/types';

/**
 * Plan v2 Adım 59 (KG-104): nesne sprite + materyal kataloğu (`?gelistirme=nesneler`, yalnız dev sunucu).
 * Denetlenenler: her nesne 64 ve 102 px'te ve altı vurgu renginde çiziliyor, her çizim boş değil (kutusu dolu),
 * konsol hatası yok; gri (baskı) görünüm açılıyor; görsel taban (yalnız tablet projesinde).
 */

test('katalog: 10 nesne × 8 örnek, materyaller ve konum sahneleri çiziliyor', async ({ page }) => {
  const hatalar: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') hatalar.push(m.text());
  });
  page.on('pageerror', (e) => hatalar.push(e.message));
  await page.goto('/?gelistirme=nesneler');
  await expect(page.locator('[data-nesne-katalogu]')).toBeVisible();

  for (const ad of NESNE_SPRITELARI) {
    await expect(page.locator(`[data-nesne="${ad}"] svg[data-sprite="${ad}"]`)).toHaveCount(8);
  }
  // Her sprite gerçekten bir şey çiziyor: içerik kutusu viewBox'un önemli kısmını kaplar.
  const kaplamalar = await page.locator('svg[data-sprite]').evaluateAll((svgler) =>
    svgler.map((s) => {
      const b = (s as SVGSVGElement).getBBox();
      return (b.width * b.height) / 10_000;
    }),
  );
  expect(kaplamalar.length).toBeGreaterThanOrEqual(80);
  for (const k of kaplamalar) expect(k).toBeGreaterThan(0.3);

  await expect(page.locator('[data-katalog="materyaller"] figure')).toHaveCount(13);
  await expect(page.locator('[data-katalog="konum"] svg[data-konum]')).toHaveCount(16);
  await expect(page.locator('[data-katalog="konum"] [data-referans="kutu"]').first()).toBeVisible();
  expect(hatalar).toEqual([]);
});

test('katalog: gri (siyah-beyaz baskı) görünüm', async ({ page }) => {
  await page.goto('/?gelistirme=nesneler&gri=1');
  const filtre = await page.locator('[data-nesne-katalogu]').evaluate((e) => getComputedStyle(e).filter);
  expect(filtre).toContain('grayscale');
});

test('katalog: nesneler görsel tabanı', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'Görsel taban tek projede tutulur.');
  await page.goto('/?gelistirme=nesneler');
  const nesneler = page.locator('[data-katalog="nesneler"]');
  await expect(nesneler).toBeVisible();
  // Etiket yazıları maskelenir: taban yalnız çizimleri karşılaştırır (sistem yazı tipi farkı tabanı bozmasın).
  await expect(nesneler).toHaveScreenshot('nesneler.png', {
    maxDiffPixelRatio: 0.03,
    timeout: 20_000,
    mask: [nesneler.locator('span')],
  });
});
