import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, klipIstendi, sesKilidiniAc } from './yardimci/akis';

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
    // KG-110: setin ilk sorusu "Bugünün etkinlikleri başlıyor." ile açılır.
    if (i === 0) await klipIstendi(page, 'ui.set-basliyor');
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
  // KG-110: tek seferlik duyuru "Bugünkü etkinlikleri bitirdik." ana ekran talimatından önce.
  await klipIstendi(page, 'ui.set-bitti');
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

test('ekranda banknot TCMB örnek görseli (KG-122): raster yüklenir, kartı doldurur', async ({ page }) => {
  test.setTimeout(60_000);
  const istekler: string[] = [];
  page.on('request', (r) => istekler.push(r.url()));
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Öğretmen', exact: true }).click();
  const sirali = await page.locator('button[aria-label$="sıradaki sayı olarak seç"]').evaluateAll((b) =>
    b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a),
  );
  for (const sayi of sirali) await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await page.getByRole('button', { name: 'Bugünün setini hazırla' }).click();
  await page.getByRole('button', { name: 'Paralarımız', exact: true }).click();
  await page.getByRole('button', { name: 'Bu kaç lira?', exact: true }).click();
  await page.getByRole('button', { name: 'Tahtada başlat' }).click();
  const banknot = page.locator('img[data-banknot]').first();
  await expect(banknot).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(() => banknot.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), { timeout: 10_000 })
    .toBe(true);
  expect(await page.locator('[data-sematik-banknot]').count(), 'şematik banknot yok').toBe(0);
  await geometriTemiz(page, 'para sorusu (TCMB banknot)');
  expect(istekler.some((u) => /images\/banknotlar\/\d+-tl-on-yuz-resmi\.webp/.test(u))).toBe(true);
  // Banknot kartın iç genişliğini doldurur (önce ~320 px kartta ~130 px'ti).
  const oranlar = await page.locator('img[data-banknot]').evaluateAll((imgs) =>
    imgs.map((i) => {
      const kart = i.closest('button')!.getBoundingClientRect();
      return i.getBoundingClientRect().width / kart.width;
    }),
  );
  expect(oranlar.length).toBeGreaterThan(1);
  for (const o of oranlar) expect(o).toBeGreaterThan(0.75);
});
