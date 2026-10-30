import { expect, test } from '@playwright/test';

/**
 * Okuma Yazma Adım 64 (ADR-0016): üretim derlemesinde (bayraksız) `?ders=tur` HİÇBİR ŞEY açmaz — her zamanki
 * açılış ekranı, Türkçe ekranı yok, `tur/` altından veri istenmez.
 */
test('üretim derlemesinde ?ders=tur Türkçe ekranı açmaz, tur/ verisi istenmez', async ({ page }) => {
  const turIstekleri: string[] = [];
  page.on('request', (r) => {
    if (/\/tur\//.test(new URL(r.url()).pathname)) turIstekleri.push(r.url());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('?ders=tur');
  await expect(page.getByRole('button', { name: 'Başla' })).toBeVisible();
  await page.getByRole('button', { name: 'Başla' }).click();
  await expect(page.getByRole('button', { name: 'Kendi başıma çalışacağım.' })).toBeVisible();
  await expect(page.getByRole('main', { name: 'Okuma Yazma' })).toHaveCount(0);
  expect(turIstekleri).toEqual([]);
});
