import { expect, test } from '@playwright/test';
const ONIZLEME_URL = process.env.E2E_HEDEF_URL ?? 'http://localhost:4173/';

/**
 * Plan v2 Adım 48 aşama 2 (KG-70): /kagitlar/ statik arşiv dizini üretim derlemesinde açılır; yalnız aynı kökenden
 * kaynak yükler, çerez yazmaz; kazanım sayfasından PDF iner. `?arsiv=<kod>` görünümü kâğıdı çizer.
 */
test('kâğıt arşivi: dizin aynı köken, çerez yok, PDF iner; arşiv görünümü kâğıdı çizer', async ({ page, context }) => {
  const koken = new URL(ONIZLEME_URL).origin;
  const istekler: string[] = [];
  page.on('request', (r) => istekler.push(r.url()));

  const yanit = await page.goto(new URL('kagitlar/', ONIZLEME_URL).href);
  expect(yanit!.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('1. sınıf matematik çalışma kâğıtları');
  await page.getByRole('link', { name: 'MAT.1.3.1' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('MAT.1.3.1 çalışma kâğıtları');
  const pdfAdresi = await page.getByRole('link', { name: 'Kâğıt 1 (PDF)' }).first().getAttribute('href');
  const pdf = await page.request.get(new URL(pdfAdresi!, page.url()).href);
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');

  expect(istekler.filter((u) => !u.startsWith('data:') && new URL(u).origin !== koken)).toEqual([]);
  expect(await context.cookies()).toEqual([]);

  // Arşiv görünümü: uygulama kabuğu açılmaz, kâğıt çizilir.
  const satir = await page.locator('li').filter({ hasText: 'Kâğıt 1 (PDF)' }).first().textContent();
  const kod = satir!.split('·').pop()!.trim();
  expect(kod).toMatch(/^OK-/);
  await page.goto(new URL(`?arsiv=${encodeURIComponent(kod)}`, ONIZLEME_URL).href);
  await expect(page.locator('[data-arsiv-hazir]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Başla' })).toHaveCount(0);
  await expect(page.locator('.kg-kok--onizleme .kg-sayfa').first()).toBeVisible();
});
