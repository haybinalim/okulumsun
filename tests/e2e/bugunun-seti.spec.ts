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

test('ekranda banknot TCMB örnek görseli (KG-122): raster yüklenir, kupürler gerçek birbirine göre boyutta (KG-123)', async ({ page }) => {
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
  // KG-123: kupürler gerçek birbirine göre boyutlarında — en büyük kupür (200 TL) kart iç genişliğinin %88'i,
  // diğerleri gerçek uzunluk oranıyla (5 TL 130/160). 200 TL'ye göre normalize edilen pay kartı doldurur.
  const UZUNLUK_MM: Record<string, number> = { 5: 130, 10: 136, 20: 142, 50: 148, 100: 154, 200: 160 };
  const olculer = await page.locator('img[data-banknot]').evaluateAll((imgs) =>
    imgs.map((i) => {
      const kart = i.closest('button')!.getBoundingClientRect();
      const r = i.getBoundingClientRect();
      return { deger: i.getAttribute('data-banknot')!, en: r.width, boy: r.height, kart: kart.width };
    }),
  );
  expect(olculer.length).toBeGreaterThan(1);
  for (const o of olculer) {
    const goreli = UZUNLUK_MM[o.deger] / 160;
    expect(o.en / o.kart / goreli).toBeGreaterThan(0.75);
  }
  // Aynı ekrandaki iki kupürün genişlik ve yükseklik oranı gerçek ölçü oranı (±%2).
  const BOY_MM: Record<string, number> = { 5: 64, 10: 64, 20: 68, 50: 68, 100: 72, 200: 72 };
  const [a, b] = olculer;
  expect(Math.abs(a.en / b.en / (UZUNLUK_MM[a.deger] / UZUNLUK_MM[b.deger]) - 1)).toBeLessThan(0.02);
  expect(Math.abs(a.boy / b.boy / (BOY_MM[a.deger] / BOY_MM[b.deger]) - 1)).toBeLessThan(0.03);
});
