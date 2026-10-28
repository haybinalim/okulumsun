import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, kisiselModaGir, klipIstendi, oturumuBitir, sesKilidiniAc } from './yardimci/akis';

/**
 * Plan v2 Adım 54 aşama 2 (KG-116): maskot hikâyesi uygulamaya bağlı.
 *  · Derin tema girişinin açılışı: maskot kendini tanıtır (`maskot.selam`) ve temanın 1. sahnesini anlatır; sahne
 *    dokunulmaz (maskot dahil), sonra 4 adımlı giriş başlar.
 *  · Kişisel oturum sonu: temanın sıradaki sahnesi (1. oturumdan sonra 2. sahne) arka planda, klibi istenir.
 * Chromium AAC çözemez: klip alımı ölçülür (`klipIstendi`).
 */

const derin = (page: Page) => page.locator('[data-ekran="tema-girisi-derin"]');

test('kişisel: derin giriş hikâye açılışıyla başlar, oturum sonunda sıradaki sahne', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'Kişisel akış tablet profilinde.');
  test.setTimeout(120_000);
  await sesKilidiniAc(page, '/?device=tablet');
  await kisiselModaGir(page);
  await page.getByRole('button', { name: 'Başla', exact: true }).click();

  // Hikâye açılışı: selam + 1. sahne.
  await expect(derin(page)).toHaveAttribute('data-giris-asama', 'hikaye');
  const tema = await derin(page).getAttribute('data-giris-tema');
  expect(tema).toMatch(/^[1-7]$/);
  const sahne = page.locator(`[data-hikaye-sahnesi="hikaye.t${tema}-1"]`);
  await expect(sahne).toBeAttached();
  await expect(sahne).toHaveAttribute('aria-hidden', 'true');
  // Sahnede (maskot dahil) dokunulabilir hiçbir şey yok.
  expect(await sahne.locator('button, a, [role="button"], [tabindex="0"]').count()).toBe(0);
  await klipIstendi(page, 'maskot.selam');
  await klipIstendi(page, `hikaye.t${tema}-1`);
  await geometriTemiz(page, 'hikâye açılışı');

  // Sonra derin girişin 1. adımı.
  await expect(derin(page)).toHaveAttribute('data-giris-adim', '0', { timeout: 10_000 });
  await expect(derin(page)).not.toHaveAttribute('data-giris-asama', 'hikaye');
  await klipIstendi(page, `giris.t${tema}-1`);
  await page.getByRole('button', { name: 'Girişi geç', exact: true }).click();

  // Oturumu bitir → oturum sonunda 2. sahne.
  const adet = await oturumuBitir(page);
  expect(adet).toBeGreaterThanOrEqual(5);
  await klipIstendi(page, `hikaye.t${tema}-2`);
  const bahcem = page.getByRole('button', { name: 'Bahçem' });
  if (await bahcem.isVisible()) {
    await expect(page.locator(`[data-hikaye-sahnesi="hikaye.t${tema}-2"]`)).toBeAttached();
    await geometriTemiz(page, 'oturum sonu hikâyesi');
  }
});

test('kişisel: "Girişi geç" hikâye açılışında da tüm girişi atlar', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'Kişisel akış tablet profilinde.');
  test.setTimeout(60_000);
  await sesKilidiniAc(page, '/?device=tablet');
  await kisiselModaGir(page);
  await page.getByRole('button', { name: 'Başla', exact: true }).click();
  await expect(derin(page)).toHaveAttribute('data-giris-asama', 'hikaye');
  await page.getByRole('button', { name: 'Girişi geç', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null), { timeout: 15_000 }).not.toBeNull();
  await expect(derin(page)).toHaveCount(0);
});
