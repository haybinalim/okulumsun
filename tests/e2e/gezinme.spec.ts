import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, kisiselModaGir, sesKilidiniAc, temayiBaslat } from './yardimci/akis';

/**
 * KG-103: her ekranda "Geri" ve "Ana menü" (kullanıcı bildirimi: etkinlik içinde geri/ana menü yoktu).
 * Tahta ve tablet projelerinde koşar; tahta profili tablet boyutunda (1080×810, elle seçilen tahta —
 * KG-101'deki küçük tahta durumu) da denenir. Her ekranda: iki düğme görünür, hiçbir düğmeyle
 * çakışmaz, yatay taşma yok ve tahta geometrisi (üst %35 + 102 px) temiz.
 */

const geri = (page: Page) => page.getByRole('button', { name: 'Geri', exact: true });
const anaMenu = (page: Page) => page.getByRole('button', { name: 'Ana menü', exact: true });

/**
 * Gezinme düğmeleri görünür, hedef boyutunda (`--size-tap-min`; tahtada 102 px ve merkezi üst %35'in
 * altında), başka düğmeyle çakışmıyor, yatay taşma yok. `tamGeometri`: ekranın tamamı da tahta geometrisine
 * uyar (yalnız bu kuralın zaten geçerli olduğu çocuk ekranlarında; öğretmen/veli ekranları ve tablet
 * boyutundaki tahtada önceden bilinen ihlaller kapsam dışı).
 */
async function gezinmeDuzgun(page: Page, ekran: string, tamGeometri = false): Promise<void> {
  await expect(geri(page), `${ekran}: Geri`).toBeVisible();
  await expect(anaMenu(page), `${ekran}: Ana menü`).toBeVisible();
  const sorun = await page.evaluate(() => {
    const tahta = document.documentElement.dataset.device === 'board';
    const tapMin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-tap-min'));
    const hedef = [...document.querySelectorAll('[data-gezinme] button')]
      .map((b) => ({ ad: b.getAttribute('aria-label') ?? '', r: b.getBoundingClientRect() }))
      .filter((d) => d.r.width < tapMin - 1 || d.r.height < tapMin - 1 || (tahta && d.r.top + d.r.height / 2 < innerHeight * 0.35))
      .map((d) => `${d.ad} ${Math.round(d.r.width)}×${Math.round(d.r.height)} @y${Math.round(d.r.top)}`);
    const kutu = (e: Element) => e.getBoundingClientRect();
    const nav = [...document.querySelectorAll('[data-gezinme] button')].map(kutu);
    const digerleri = [...document.querySelectorAll('button')]
      .filter((b) => !b.closest('[data-gezinme]') && !b.closest('[data-harness]'))
      .filter((b) => getComputedStyle(b).position !== 'fixed') // yetişkin köşe düğmeleri (Seti bitir) ayrı katman
      .map((b) => ({ ad: b.getAttribute('aria-label') ?? b.textContent ?? '', r: kutu(b) }))
      .filter((d) => d.r.width > 0 && d.r.height > 0);
    const ust = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    const cakisan = digerleri.filter((d) => nav.some((n) => ust(n, d.r))).map((d) => d.ad);
    const tasma = document.documentElement.scrollWidth > window.innerWidth + 1;
    return { cakisan, tasma, hedef };
  });
  expect(sorun.hedef, `${ekran}: gezinme düğmesi boyut/erişim`).toEqual([]);
  expect(sorun.cakisan, `${ekran}: gezinme düğmeleriyle çakışan`).toEqual([]);
  expect(sorun.tasma, `${ekran}: yatay taşma`).toBe(false);
  if (tamGeometri) await geometriTemiz(page, ekran);
}

async function konuyuSec(page: Page): Promise<void> {
  const etiketler = await page
    .locator('button:not([disabled])')
    .evaluateAll((b) => b.map((x) => x.getAttribute('aria-label') ?? x.textContent ?? ''));
  const ilk = etiketler.find((e) => e && !/Geri|Ana menü|Yardım|Yönergeyi|tekrar dinle|Tema turu/i.test(e));
  await page.getByRole('button', { name: ilk!, exact: true }).first().click();
  await expect.poll(() => page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null)).not.toBeNull();
}

async function ogretmenAlaninaGir(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Öğretmen', exact: true }).click();
  await gezinmeDuzgun(page, 'veli kapısı');
  const sirali = await page.locator('button[aria-label$="sıradaki sayı olarak seç"]').evaluateAll((b) =>
    b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a),
  );
  for (const sayi of sirali) await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await expect(page.getByRole('heading', { name: 'Öğretmen alanı' })).toBeVisible();
}

for (const boyut of ['proje', 'kucuk-tahta'] as const) {
  test.describe(`gezinme (${boyut})`, () => {
    // proje: tahta projesinde 1920×1080 tahta, tablet projesinde tablet profili; küçük tahta: 1080×810 + tahta profili.
    let adres = '/?device=board';
    test.beforeEach(async ({ page: _sayfa }, testInfo) => {
      if (boyut === 'kucuk-tahta') {
        test.skip(testInfo.project.name !== 'tablet', 'küçük tahta yalnız tablet projesinde (1080×810 + tahta profili)');
      }
      adres = boyut === 'proje' && testInfo.project.name === 'tablet' ? '/?device=tablet' : '/?device=board';
    });

    test('tahta: konu seçimi ve etkinlikte Geri / Ana menü; tarayıcı geri tuşu aynı', async ({ page }) => {
      test.setTimeout(90_000);
      await sesKilidiniAc(page, adres);
      await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
      await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
      // Ana ekranın kendisinde gezinme yok (belgeli: KG-103).
      await expect(geri(page)).toHaveCount(0);
      await expect(anaMenu(page)).toHaveCount(0);

      await temayiBaslat(page);
      await gezinmeDuzgun(page, 'konu seçimi');
      await konuyuSec(page);
      await gezinmeDuzgun(page, 'etkinlik (tahta)', true);

      // Etkinlikte Geri → konu seçimi (serbest tek soru: onay yok).
      await geri(page).click();
      await expect(page.locator('[data-ekran-cercevesi="konuSecimi"]')).toBeVisible();
      await expect(page.getByRole('alertdialog')).toHaveCount(0);

      // Tarayıcı / Android geri tuşu = Geri: etkinlik → konu seçimi → ana ekran.
      await konuyuSec(page);
      await page.goBack();
      await expect(page.locator('[data-ekran-cercevesi="konuSecimi"]')).toBeVisible();
      await page.goBack();
      await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
      expect(new URL(page.url()).search).toContain('device='); // uygulamadan çıkılmadı

      // Etkinlikte Ana menü → ana ekran.
      await temayiBaslat(page);
      await konuyuSec(page);
      await anaMenu(page).click();
      await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
    });

    test('tahta seti: çıkışta büyük düğmeli onay (Hayır kalır, Evet çıkar); geri tuşu da onay sorar', async ({ page }) => {
      test.setTimeout(90_000);
      await sesKilidiniAc(page, adres);
      await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
      await ogretmenAlaninaGir(page);
      await gezinmeDuzgun(page, 'öğretmen alanı');
      await page.getByRole('button', { name: 'Bugünün setini hazırla' }).click();
      await gezinmeDuzgun(page, 'set hazırla');
      await page.getByRole('button', { name: 'Nerede?', exact: true }).click();
      await page.getByRole('button', { name: 'Tahtada başlat' }).click();
      await expect.poll(() => page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null)).not.toBeNull();
      await gezinmeDuzgun(page, 'set etkinliği', true);

      await geri(page).click();
      const pencere = page.getByRole('alertdialog');
      await expect(pencere).toContainText('Etkinlikten çıkmak istiyor musun?');
      await geometriTemiz(page, 'çıkış onayı');
      await page.getByRole('button', { name: 'Hayır, devam et' }).click();
      await expect(pencere).toHaveCount(0);
      await expect(page.locator('[data-ekran-cercevesi="alistirma"]')).toBeVisible();

      // Geri tuşu da aynı onayı açar; pencere açıkken geri tuşu = Hayır.
      await page.goBack();
      await expect(pencere).toBeVisible();
      await page.goBack();
      await expect(pencere).toHaveCount(0);
      await expect(page.locator('[data-ekran-cercevesi="alistirma"]')).toBeVisible();

      await anaMenu(page).click();
      await page.getByRole('button', { name: 'Evet, çık' }).click();
      await expect(page.getByRole('button', { name: 'Öğretmen', exact: true })).toBeVisible();
    });
  });
}

test('tablet: kişisel etkinlikte Geri ve Ana menü (oturum kaybolmaz, onay yok)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'kişisel mod tablet projesinde');
  test.setTimeout(60_000);
  await sesKilidiniAc(page, '/');
  await kisiselModaGir(page);
  await temayiBaslat(page);
  await expect.poll(() => page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null), { timeout: 15_000 }).not.toBeNull();
  await gezinmeDuzgun(page, 'kişisel etkinlik', true);
  const ilk = await page.evaluate(() => window.__okulumsunE2E!.alistirma!.itemId);
  await geri(page).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
  // Aynı oturum kaldığı yerden sürer.
  await temayiBaslat(page);
  await expect.poll(() => page.evaluate(() => window.__okulumsunE2E?.alistirma?.itemId ?? null), { timeout: 15_000 }).toBe(ilk);
  await anaMenu(page).click();
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
});

test('Keşif Masası, Sınıf Turu kurulumu ve kâğıt önizlemesinde de gezinme var', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  // Keşif Masası tablet boyutundaki tahtada main'de de üst bölgeye taşıyor (KG-103 kapsamı dışı, açık kalan).
  const tam = testInfo.project.name === 'board';
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Keşif Masası' }).first().click();
  await expect(page.getByRole('button', { name: 'Sayı doğrusu' })).toBeVisible();
  await gezinmeDuzgun(page, 'Keşif Masası', tam);
  await geri(page).click();
  await page.getByRole('button', { name: 'Sınıf Turu' }).first().click();
  await gezinmeDuzgun(page, 'Sınıf Turu kurulumu', tam);
  await anaMenu(page).click();
  await ogretmenAlaninaGir(page);
  await page.getByRole('button', { name: 'Haftalık planı aç' }).click();
  await gezinmeDuzgun(page, 'haftalık plan');
  await page.getByRole('button', { name: 'Bu haftanın kâğıdı' }).click();
  await expect(page.getByRole('button', { name: 'Yazdır' })).toBeVisible();
  await gezinmeDuzgun(page, 'kâğıt önizleme');
  await geri(page).click(); // kâğıda haftalık plandan gelindi
  await expect(page.getByRole('button', { name: 'Bu haftanın kâğıdı' })).toBeVisible();
});
