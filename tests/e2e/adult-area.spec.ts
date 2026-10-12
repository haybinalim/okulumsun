import { expect, test } from '@playwright/test';

test.describe('yetişkin alanı', () => {
  test('veli kapısı seçili sırayı duyurur ve veri saklamayan paneli açar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'board', 'Yetişkin akışı tablet profili için doğrulanır.');

    await page.goto('/?device=tablet');
    await page.getByRole('button', { name: 'Başla' }).click();
    await page.getByRole('button', { name: 'Kendi başıma çalışacağım.' }).click();
    await page.getByRole('button', { name: 'Kedi' }).click();
    await page.getByRole('button', { name: 'Renk mor' }).click();
    await page.getByRole('button', { name: 'Ayarlar' }).click();

    await expect(page.getByRole('heading', { name: 'Yetişkin alanı' })).toBeVisible();
    await expect(page.getByText('Bu kontrol hiçbir veri kaydetmez.')).toBeVisible();

    const siraliSayilar = await page.locator('button[aria-label$="sıradaki sayı olarak seç"]').evaluateAll((buttons) =>
      buttons
        .map((button) => Number(button.getAttribute('aria-label')?.split(',')[0]))
        .sort((a, b) => b - a),
    );

    for (const sayi of siraliSayilar) {
      await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
    }

    await expect(page.getByText('Henüz öğrenci geçmişi gösterilmiyor.')).toBeVisible();
    await expect(page.getByText('Çocuk profili, yanıtlar, ilerleme özeti ve oturum geçmişi')).toBeVisible();
    await expect(page.getByLabel('Okuma seviyesi')).toBeVisible();
    await expect(page.getByLabel('Okul ayı')).toBeVisible();
    await expect(page.getByLabel('Ses hızı')).toBeVisible();
  });
});
