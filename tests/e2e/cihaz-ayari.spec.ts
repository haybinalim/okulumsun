import { expect, test } from '@playwright/test';
import { yetiskinAlaniniAc } from './yardimci/akis';

/**
 * Plan v2 Adım 27: yetişkin alanından ekran boyutunu elle seçme. URL'de `?device=`
 * YOK: geçersiz kılma o zaman ayardan değil URL'den gelirdi.
 */
test.describe('cihaz profili ayarı', () => {
  test('Akıllı tahta seçimi ölçeği değiştirir, yenilemede kalır, Otomatik geri döner', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet', 'Otomatik tespitin tablet olduğu projede doğrulanır.');

    const veliPaneliniAc = async () => {
      await page.getByRole('button', { name: 'Başla' }).click();
      await page.getByRole('button', { name: 'Kendi başıma çalışacağım.' }).click();
      await page.getByRole('button', { name: 'Kedi' }).click();
      await page.getByRole('button', { name: 'Renk mor' }).click();
      await yetiskinAlaniniAc(page);
      await expect(page.getByRole('heading', { name: 'Ekran boyutu' })).toBeVisible();
    };
    const cihaz = () => page.evaluate(() => document.documentElement.dataset.device);
    const olcek = () => page.evaluate(() => document.documentElement.style.getPropertyValue('--scale'));

    await page.goto('/');
    expect(await cihaz()).toBe('tablet');
    await veliPaneliniAc();

    const grup = page.getByRole('group', { name: 'Ekran boyutu' });
    await expect(grup.getByRole('button', { name: 'Otomatik (önerilen)' })).toHaveAttribute('aria-pressed', 'true');
    const onizleme = page.getByTestId('cihaz-profili-onizleme');
    const tabletGenislik = (await onizleme.boundingBox())!.width;

    await grup.getByRole('button', { name: 'Akıllı tahta' }).click();
    await expect.poll(cihaz).toBe('board');
    expect(await olcek()).toBe('1.6');
    await expect(grup.getByRole('button', { name: 'Akıllı tahta' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await onizleme.boundingBox())!.width).toBeGreaterThan(tabletGenislik * 1.5);

    await page.reload();
    expect(await cihaz()).toBe('board');
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['okulumsun.deviceOverride']);

    await veliPaneliniAc();
    await page.getByRole('group', { name: 'Ekran boyutu' }).getByRole('button', { name: 'Otomatik (önerilen)' }).click();
    await expect.poll(cihaz).toBe('tablet');
    expect(await olcek()).toBe('1');
    expect(await page.evaluate(() => localStorage.getItem('okulumsun.deviceOverride'))).toBeNull();
  });
});
