import { expect, test } from '@playwright/test';
import { geometriTemiz, kisiselModaGir, sesKilidiniAc } from './yardimci/akis';

/** Plan v2 Adım 44 aşama 2 (KG-64): kişisel modda (tablet) Keşif Masası girişi ve beş aracın geometrisi. */
test('tablet: kişisel modda Keşif Masası', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'board', 'Tahta akışı board-kesif-masasi.spec.ts içinde.');
  await sesKilidiniAc(page, '/?device=tablet');
  await kisiselModaGir(page);
  await page.getByRole('button', { name: 'Keşif Masası' }).click();
  for (const arac of ['Onluk çerçeve', 'Nesneler', 'Sayı doğrusu']) {
    await page.getByRole('button', { name: arac, exact: true }).click();
    await expect(page.getByRole('main', { name: 'Keşif Masası' })).toHaveAttribute('data-kesif-sayi', '0');
    // Aynı düğmeye ardışık dokunuşlar arasında 250 ms soğuma var (BigButton); test bunu bekler.
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Bir ekle' }).click();
    await expect(page.getByRole('main', { name: 'Keşif Masası' })).toHaveAttribute('data-kesif-sayi', '1');
    await geometriTemiz(page, `Keşif Masası — ${arac} (tablet)`);
  }
  // KG-124: tablette 11 nokta tek sıraya sığar (zikzak yalnız küçük tahtada).
  await expect(page.locator('[data-arac="sayiDogrusu"]')).toHaveAttribute('data-duzen', 'sira');
  for (const arac of ['Terazi', 'Ayır ve birleştir']) {
    await page.getByRole('button', { name: arac, exact: true }).click();
    // KG-125: tablette terazi olağan boyutta.
    if (arac === 'Terazi') await expect(page.locator('[data-arac="terazi"]')).not.toHaveAttribute('data-siki', /.*/);
    await geometriTemiz(page, `Keşif Masası — ${arac} (tablet)`);
  }
  await page.getByRole('button', { name: 'Ana menü', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Başla', exact: true })).toBeVisible();
});
