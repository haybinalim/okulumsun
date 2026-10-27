import { expect, test } from '@playwright/test';
import { alistirmalariCoz, geometriTemiz, sesKilidiniAc, temayiBaslat } from './yardimci/akis';

/**
 * Plan v2 Adım 26: akıllı tahtada sınıfça mod — ses kilidi → tahta → tema →
 * konu seç → 5 soru. Her ekranda tahta geometrisi (üst %35 ölü bölge + 102 px).
 */
test('tahta: sınıfça modda konu seçip 5 soru', async ({ page }) => {
  test.setTimeout(90_000);

  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
  await geometriTemiz(page, 'ana ekran (tahta)');
  await temayiBaslat(page);

  // Konu seçimi: ilk açık konu.
  await expect(page.getByRole('button', { name: 'Geri', exact: true })).toBeVisible();
  // Konu seçimi öğretmen ekranıdır (yetişkin); çocuk erişim bölgesi kuralı uygulanmaz.
  const konu = page.locator('button:not([disabled])').filter({ hasNotText: /^(Geri|Yardım)$/ });
  const etiketler = await konu.evaluateAll((b) => b.map((x) => x.getAttribute('aria-label') ?? x.textContent ?? ''));
  const ilk = etiketler.find((e) => e && !/Geri|Ana menü|Yardım|Yönergeyi|tekrar dinle/i.test(e));
  expect(ilk, `açık konu yok: ${etiketler.join(' | ')}`).toBeTruthy();
  await page.getByRole('button', { name: ilk!, exact: true }).first().click();

  const turler = await alistirmalariCoz(page, 5);
  expect(turler).toHaveLength(5);
});
