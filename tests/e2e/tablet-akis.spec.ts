import { expect, test } from '@playwright/test';
import { geometriTemiz, oturumuBitir, kisiselModaGir, sesKilidiniAc, temayiBaslat } from './yardimci/akis';

/**
 * Plan v2 Adım 26: tabletteki kişisel mod, baştan sona — ses kilidi → kişisel mod
 * → avatar → renk → ana ekran → tema → 8 soru → oturum sonu → Bahçem → ev.
 * Her ekranda tablet geometrisi (`--size-tap-min`) denetlenir.
 */
test('tablet: kişisel modda tam oturum ve Bahçem', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'Tablet akışı.');
  test.setTimeout(90_000);

  await sesKilidiniAc(page, '/?device=tablet');
  await kisiselModaGir(page);
  await temayiBaslat(page);

  const adet = await oturumuBitir(page);
  expect(adet).toBeGreaterThanOrEqual(5);

  // Oturum sonu ≤2 sn içinde kendiliğinden Bahçem'e geçer; hâlâ görünüyorsa dokun.
  const bahcem = page.getByRole('button', { name: 'Bahçem' });
  if (await bahcem.isVisible()) {
    await geometriTemiz(page, 'oturum sonu');
    await bahcem.click().catch(() => undefined);
  }

  const ev = page.getByRole('button', { name: 'Ev' });
  await expect(ev).toBeVisible();
  await geometriTemiz(page, 'Bahçem');
  await ev.click();
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
});
