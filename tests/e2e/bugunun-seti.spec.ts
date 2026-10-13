import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';

/**
 * Plan v2 Adım 34: tahtada öğretmen "Bugünün seti"ni hazırlar (2 düğüm), tahtada başlatır;
 * ilk 4 soru iki düğüme dağılır. Hem tahta hem tablet projesinde, tahta profili zorlanarak koşar.
 * SetHazirla tahta erişim bölgesine ve hedef boyutuna uyar (geometri denetimi).
 */
async function sonrakiSoru(page: Page, onceki: number | null): Promise<{ sira: number; itemId: string }> {
  await expect
    .poll(async () => (await page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null)) !== onceki, {
      message: 'yeni alıştırma bekleniyor',
      timeout: 15_000,
    })
    .toBe(true);
  return (await page.evaluate(() => {
    const a = window.__okulumsunE2E!.alistirma!;
    return { sira: a.sira, itemId: a.itemId };
  }))!;
}

test('tahta: bugünün seti — 2 düğüm seç, başlat, ilk 4 soru iki düğüme dağılır', async ({ page }) => {
  test.setTimeout(90_000);

  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await expect(page.getByRole('button', { name: 'Öğretmen', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Öğretmen', exact: true }).click();

  // Veli kapısı: sayıları büyükten küçüğe seç.
  const sirali = await page.locator('button[aria-label$="sıradaki sayı olarak seç"]').evaluateAll((b) =>
    b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a),
  );
  for (const sayi of sirali) await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await expect(page.getByRole('heading', { name: 'Öğretmen alanı' })).toBeVisible();

  await page.getByRole('button', { name: 'Bugünün setini hazırla' }).click();
  await expect(page.getByRole('heading', { name: 'Bugünün setini hazırla' })).toBeVisible();
  await geometriTemiz(page, 'set hazırla (boş)');

  const baslat = page.getByRole('button', { name: 'Tahtada başlat' });
  await expect(baslat).toHaveAttribute('aria-disabled', 'true');

  await page.getByRole('button', { name: 'Nerede?', exact: true }).click();
  await page.getByRole('button', { name: 'İleri mi geri mi?', exact: true }).click();
  await expect(page.getByText('2/4 seçildi')).toBeVisible();
  await geometriTemiz(page, 'set hazırla (2 seçili)');
  await expect(baslat).not.toHaveAttribute('aria-disabled', 'true');
  await baslat.click();

  const itemIdler: string[] = [];
  let onceki: number | null = null;
  for (let i = 0; i < 4; i++) {
    const soru = await sonrakiSoru(page, onceki);
    itemIdler.push(soru.itemId);
    await geometriTemiz(page, `set sorusu ${i + 1}`);
    expect(await page.evaluate(() => window.__okulumsunE2E!.dogruCevapla())).toBe(true);
    onceki = soru.sira;
  }
  const sablonlar = itemIdler.map((id) => id.split('#')[0]);
  expect(new Set(sablonlar.slice(0, 2))).toEqual(new Set(['M-KONUM', 'M-YONERGE']));
  expect(new Set(sablonlar)).toEqual(new Set(['M-KONUM', 'M-YONERGE']));

  // Set yalnız bellekte: depolamaya yazılmadı.
  const depo = await page.evaluate(() => localStorage.length + sessionStorage.length);
  expect(depo).toBe(0);

  // Öğretmen çıkışı ana ekrana döner.
  await page.getByRole('button', { name: 'Seti bitir' }).click();
  await expect(page.getByRole('button', { name: 'Öğretmen', exact: true })).toBeVisible();
});

test('tahta: dörtten fazla etkinlik seçilemez', async ({ page }) => {
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Öğretmen', exact: true }).click();
  const sirali = await page.locator('button[aria-label$="sıradaki sayı olarak seç"]').evaluateAll((b) =>
    b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a),
  );
  for (const sayi of sirali) await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await page.getByRole('button', { name: 'Bugünün setini hazırla' }).click();
  await page.getByRole('button', { name: 'Sayılar', exact: true }).click();
  const kartlar = page.locator('section[aria-label="Etkinlikler"] button:not([aria-label="Bu haftanın önerisini seç"])');
  const adet = await kartlar.count();
  expect(adet).toBeGreaterThan(4);
  for (let i = 0; i < 5; i++) await kartlar.nth(i).click();
  await expect(page.getByText('4/4 seçildi — önce birini kaldır.')).toBeVisible();
});
