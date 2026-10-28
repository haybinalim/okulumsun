import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, kisiselModaGir, klipIstendi, sesKilidiniAc } from './yardimci/akis';

/**
 * Plan v2 Adım 45 aşama 2 (KG-112): derin tema girişi.
 *  · Tahta: konu seçiminin ilk kartı "Temaya giriş" → hikâye açılışı (Adım 54, KG-116) + 4 adımlı sesli giriş (izle → dokun → dokun → izle);
 *    dokun hedefi alt bölgede, ≥ 102 px, merkezi üst %35'in altında; bitince konu seçimine döner.
 *  · "Girişi geç" (yetişkin) her an çıkar.
 *  · Kişisel: oturumdaki ilk tema seçimi derin, sonraki kısa (yalnız bellek).
 * Chromium AAC çözemez: klip çalınmaz, alımı ölçülür (`klipIstendi`); anlatım hemen biter, bekleme süreleri
 * (izle 2,5 sn, dokun 8 sn) gerçek zamanlıdır.
 */

const ekran = (page: Page) => page.locator('[data-ekran="tema-girisi-derin"]');

async function tahtadaKonuSecimi(page: Page): Promise<void> {
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
  await page.getByRole('button', { name: 'Yön ve Yerler', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Temaya giriş', exact: true })).toBeVisible();
}

async function adimBekle(page: Page, adim: number, timeout = 15_000): Promise<void> {
  await expect(ekran(page)).toHaveAttribute('data-giris-adim', String(adim), { timeout });
}

test('tahta: "Temaya giriş" kartı → 4 adımlı derin giriş, dokunma hedefi erişim bölgesinde, bitince konu seçimi', async ({ page }) => {
  test.setTimeout(90_000);
  await tahtadaKonuSecimi(page);

  // İlk kart "Temaya giriş" (konu kartlarından önce).
  const ilkKart = await page.locator('main button').evaluateAll((b) =>
    b.map((x) => x.getAttribute('aria-label') ?? x.textContent ?? '').find((e) => !/Geri|Ana menü|Yardım|Ayarlar|tekrar dinle/i.test(e)),
  );
  expect(ilkKart).toBe('Temaya giriş');
  await page.getByRole('button', { name: 'Temaya giriş', exact: true }).click();

  await expect(ekran(page)).toBeVisible({ timeout: 15_000 }); // tembel parça (dev sunucusunda ilk dönüşüm)
  await expect(ekran(page)).toHaveAttribute('data-giris-tema', '1');
  // Adım 54 (KG-116): önce hikâye açılışı — maskot selamı + 1. sahne (dokunulmaz), sonra adımlar.
  await klipIstendi(page, 'maskot.selam');
  await klipIstendi(page, 'hikaye.t1-1');
  // Hikâye açılışı anlatım + 1,2 sn sürer (CI'da klip alımı yavaş olabilir): 1. adımı cömert süreyle bekle.
  await adimBekle(page, 0, 20_000);
  await expect(ekran(page)).toHaveAttribute('data-giris-eylem', 'izle');
  await klipIstendi(page, 'giris.t1-1');
  await geometriTemiz(page, 'derin giriş — izle');

  // 1. adım izle: anlatımdan sonra kendiliğinden ilerler.
  await adimBekle(page, 1);
  await expect(ekran(page)).toHaveAttribute('data-giris-eylem', 'dokun');
  await klipIstendi(page, 'giris.t1-2');
  await geometriTemiz(page, 'derin giriş — dokun');
  const hedef = page.getByRole('button', { name: 'Yön ve Yerler: resme dokun' });
  const kutu = (await hedef.boundingBox())!;
  const vh = page.viewportSize()!.height;
  expect(kutu.height).toBeGreaterThanOrEqual(102);
  expect(kutu.width).toBeGreaterThanOrEqual(102);
  expect(kutu.y + kutu.height / 2, 'dokun hedefinin merkezi üst %35 altında').toBeGreaterThan(vh * 0.35);
  expect(kutu.y, 'dokun hedefi alt %65 bölgesinde başlar').toBeGreaterThanOrEqual(vh * 0.35 - 1);

  // Dokun → övgü → 3. adım (yine dokun) → dokun → 4. adım izle → konu seçimine dönüş.
  await hedef.click();
  await adimBekle(page, 2);
  await klipIstendi(page, 'giris.t1-3');
  await page.getByRole('button', { name: 'Yön ve Yerler: resme dokun' }).click();
  await adimBekle(page, 3);
  await expect(ekran(page)).toHaveAttribute('data-giris-eylem', 'izle');
  await klipIstendi(page, 'giris.t1-4');
  await expect(page.getByRole('button', { name: 'Temaya giriş', exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(ekran(page)).toHaveCount(0);
});

test('tahta: dokunulmazsa bir kez tekrarlanır, sonra kendiliğinden ilerler', async ({ page }) => {
  test.setTimeout(90_000);
  await tahtadaKonuSecimi(page);
  await page.getByRole('button', { name: 'Temaya giriş', exact: true }).click();
  await adimBekle(page, 0, 20_000); // hikâye açılışı (KG-116) bitti
  await adimBekle(page, 1);
  // Dokun adımı: 8 sn sonra anlatım tekrarı, 8 sn daha sonra sonraki adım (toplam ≈16 sn).
  await page.waitForTimeout(9_000);
  await expect(ekran(page)).toHaveAttribute('data-giris-adim', '1');
  await adimBekle(page, 2, 15_000);
});

test('tahta: "Girişi geç" konu seçimine döner; Geri de konu seçimine döner', async ({ page }) => {
  test.setTimeout(60_000);
  await tahtadaKonuSecimi(page);
  await page.getByRole('button', { name: 'Temaya giriş', exact: true }).click();
  await expect(ekran(page)).toBeVisible({ timeout: 15_000 }); // tembel parça (dev sunucusunda ilk dönüşüm)
  await page.getByRole('button', { name: 'Girişi geç', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Temaya giriş', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Temaya giriş', exact: true }).click();
  await expect(ekran(page)).toBeVisible({ timeout: 15_000 }); // tembel parça (dev sunucusunda ilk dönüşüm)
  await page.getByRole('button', { name: 'Geri', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Temaya giriş', exact: true })).toBeVisible();
});

test('kişisel: oturumdaki ilk tema derin girişle, ikincisi kısa girişle açılır', async ({ page }) => {
  test.setTimeout(60_000);
  // Kişisel mod tablet profiliyle (avatar seçiminin tahta geometrisi kapsam dışı; gezinme.spec ile aynı).
  await sesKilidiniAc(page, '/?device=tablet');
  await kisiselModaGir(page);
  await page.getByRole('button', { name: 'Başla', exact: true }).click();
  await expect(ekran(page)).toBeVisible({ timeout: 15_000 }); // tembel parça (dev sunucusunda ilk dönüşüm)
  await klipIstendi(page, 'giris.t1-1');
  await geometriTemiz(page, 'kişisel derin giriş');
  await page.getByRole('button', { name: 'Girişi geç', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null), { timeout: 15_000 }).not.toBeNull();

  // Kişisel etkinlikte Geri ana ekrana döner, oturum sürer (KG-103).
  await page.getByRole('button', { name: 'Geri', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
  await page.getByRole('button', { name: 'Başla', exact: true }).click();
  await expect(page.locator('[data-ekran="tema-girisi-kisa"]')).toBeVisible();
  await expect(ekran(page)).toHaveCount(0);
});
