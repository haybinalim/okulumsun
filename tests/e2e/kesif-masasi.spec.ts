import { expect, test } from '@playwright/test';
import { geometriTemiz, kisiselModaGir, sesKilidiniAc } from './yardimci/akis';

/** Plan v2 Adım 44 aşama 2 (KG-64): kişisel modda (tablet) Keşif Masası girişi ve üç aracın geometrisi. */
test('tablet: kişisel modda Keşif Masası', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'board', 'Tahta akışı board-kesif-masasi.spec.ts içinde.');
  await sesKilidiniAc(page, '/?device=tablet');
  await kisiselModaGir(page);
  await page.getByRole('button', { name: 'Keşif Masası' }).click();
  for (const arac of ['Onluk çerçeve', 'Nesneler', 'Sayı doğrusu']) {
    await page.getByRole('button', { name: arac, exact: true }).click();
    await page.getByRole('button', { name: 'Bir ekle' }).click();
    await expect(page.getByRole('main', { name: 'Keşif Masası' })).toHaveAttribute('data-kesif-sayi', '1');
    await geometriTemiz(page, `Keşif Masası — ${arac} (tablet)`);
  }
  await page.getByRole('button', { name: 'Ev', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Başla', exact: true })).toBeVisible();
});
