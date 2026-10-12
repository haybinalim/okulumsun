import { expect, test } from '@playwright/test';
import { kisiselModaGir, oturumuBitir, temayiBaslat } from './yardimci/akis';

/**
 * Plan v2 Adım 26 (Adım 9 Bitti maddesi): ilk ziyaretten sonra ağ tamamen
 * kesildiğinde uygulama açılır, tam bir oturum biter ve ses klipleri service
 * worker önbelleğinden alınır.
 */
test('çevrimdışı: yeniden yükleme, tam oturum ve ses klibi', async ({ page, context }) => {
  test.skip(!!process.env.E2E_HEDEF_URL, 'E2E kancası yalnız test derlemesinde var.');
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  // 1) Çevrimiçi ilk ziyaret: SW kurulur, precache dolar, sayfayı kontrol eder.
  await page.goto('./?device=tablet');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), { timeout: 20_000 })
    .toBe(true);

  // 2) Ağ yok.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Başla' })).toBeVisible();
  await page.getByRole('button', { name: 'Başla' }).click();
  await kisiselModaGir(page);
  await temayiBaslat(page);
  expect(await oturumuBitir(page)).toBeGreaterThanOrEqual(5);

  // 3) Ses: en az bir klip ağ olmadan (SW önbelleğinden) başarıyla alındı.
  const klipler = await page.evaluate(() => window.__okulumsunE2E?.alinanKlipler ?? []);
  expect(klipler.length, 'çevrimdışı alınan klip').toBeGreaterThan(0);
  await context.setOffline(false);
});
