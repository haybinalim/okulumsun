import { expect, test } from '@playwright/test';
import { TUR_URL } from '../../playwright.config';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';

/**
 * Okuma Yazma Adım 83 — tam ekran ders seçimi, YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`, port 5174).
 *
 * Akış: Başla → mod seçimi (tahta / kişisel) → ana ekran yerine "Ders seç".
 * Okuma Yazma öğretmen girişini açar. Matematik matematik ana ekranına geçer.
 * Girişte Geri ve Ana menü ders seçimine döner. Tahtada üst çubuktaki "Ders seç" de döner.
 * Bayraksız sunucu (5173) ders seçimini çizmez.
 */
test.use({ baseURL: TUR_URL });

const gorunumler = (proje: string) =>
  proje === 'board'
    ? ([
        { ad: 'tahta 1920×1080', w: 1920, h: 1080, cihaz: 'board' },
        { ad: 'tahta 1080×810', w: 1080, h: 810, cihaz: 'board' },
      ] as const)
    : ([{ ad: 'tablet 1080×810', w: 1080, h: 810, cihaz: 'tablet' }] as const);

test('Başla → ders seçimi → Okuma Yazma; Matematik ana ekranı; geri dönüş', async ({ browser }, bilgi) => {
  test.setTimeout(120_000);
  for (const g of gorunumler(bilgi.project.name)) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    await sesKilidiniAc(page, `/?device=${g.cihaz}`);
    await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
    const kapi = page.getByRole('main', { name: 'Ders seç' });
    await expect(kapi).toBeVisible();
    await geometriTemiz(page, `${g.ad} ders seçimi`);
    await kapi.getByRole('button', { name: 'Okuma Yazma' }).click();
    await expect(page.locator('[data-tur-ekrani="giris"]')).toBeVisible();
    await geometriTemiz(page, `${g.ad} Okuma Yazma girişi`);
    await page.getByRole('button', { name: 'Geri' }).click();
    await expect(kapi).toBeVisible();
    await kapi.getByRole('button', { name: 'Okuma Yazma' }).click();
    await page.getByRole('button', { name: 'Ana menü' }).click();
    await expect(page.locator('[data-tur-ekrani]')).toHaveCount(0);
    await expect(kapi).toBeVisible();
    await kapi.getByRole('button', { name: 'Matematik' }).click();
    await expect(page.getByRole('button', { name: 'Öğretmen' })).toBeVisible();
    await expect(page.locator('[data-ders-kapisi]')).toHaveCount(0);
    if (g.w === 1920) await geometriTemiz(page, `${g.ad} matematik ana ekranı`);
    await page.getByRole('button', { name: 'Ders seç' }).click();
    await expect(kapi).toBeVisible();
    expect(await page.evaluate(() => Object.keys(localStorage).filter((a) => a.startsWith('okulumsun.tur')))).toEqual([]);
    await ctx.close();
  }
});

test('bayraksız sunucuda ders seçim ekranı yok', async ({ page }) => {
  await sesKilidiniAc(page, 'http://localhost:5173/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await expect(page.getByRole('button', { name: 'Öğretmen' })).toBeVisible();
  await expect(page.getByRole('main', { name: 'Ders seç' })).toHaveCount(0);
  await expect(page.locator('[data-ders-kapisi]')).toHaveCount(0);
  await expect(page.locator('[data-ders-secimi]')).toHaveCount(0);
});
