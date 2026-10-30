import { expect, test, type Page } from '@playwright/test';
import { TUR_URL } from '../../playwright.config';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';

/**
 * Okuma Yazma Adım 64 — tahta yazılış gösterimi, YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`, port 5174).
 * Giriş `?ders=tur` → "Harf ve rakam yazılışı" → grup → glif → gösterim (numaralı oklar, adım/oynat/hız/kesikli).
 * 1920×1080 tahta, 1080×810 tahta ve tablette geometri temiz (üst %35'te dokunma yok, hedef ≥ 102 px tahtada);
 * azaltılmış harekette adım kipi; sol el glifi aynalamaz; Türkçe ekranlarda ses yok (oynatılmak istenen klip ve
 * konuşma sentezi yok); ağ aynı köken; depolama boş. BigButton aynı düğmeye 250 ms soğuma uyguladığından aynı
 * düğmeye ardışık basışlar arasında kısa bekleme var.
 */
test.use({ baseURL: TUR_URL });

/** Konuşma sentezi çağrılarını sayar (gösterimde hiç konuşma yok). */
async function konusmaSayaci(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __turKonusma: number };
    w.__turKonusma = 0;
    if ('speechSynthesis' in window) {
      const asil = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
        w.__turKonusma++;
        asil(u);
      };
    }
  });
}

/** Oynatılmak üzere istenen klipler (geliştirme kancası; önbellekten çalınsa da sayılır, KG-127). */
const istenenKlipler = (page: Page) => page.evaluate(() => [...(window.__okulumsunE2E?.istenenKlipler ?? [])]);

async function turGirisi(page: Page, cihaz: string): Promise<void> {
  await sesKilidiniAc(page, `/?ders=tur${cihaz}`);
  await expect(page.getByRole('main', { name: 'Okuma Yazma' })).toBeVisible();
}

test('yazılış gösterimi: seçim, adım kipi, kesikli, sol el, gezinme; geometri ve gizlilik', async ({
  page,
  baseURL,
}, bilgi) => {
  test.setTimeout(120_000);
  const tahta = bilgi.project.name === 'board';
  const ag = agKaydet(page);
  await konusmaSayaci(page);
  await turGirisi(page, tahta ? '&device=board' : '');
  const klipOnce = await istenenKlipler(page);
  await geometriTemiz(page, 'Okuma Yazma girişi');

  await page.getByRole('button', { name: 'Harf ve rakam yazılışı' }).click();
  const secim = page.getByRole('main', { name: 'Harf ve rakam yazılışı' });
  await expect(secim).toBeVisible();
  const glifDugmeleri = page.getByRole('group', { name: 'Harfler ve rakamlar' }).getByRole('button');
  await expect(glifDugmeleri).toHaveCount(12);
  await geometriTemiz(page, 'yazılış seçimi (1. grup)');

  // Altı sekme: 5 harf grubu (küçük + büyük) ve rakamlar → 68 glif.
  const sekmeler = page.getByRole('group', { name: 'Gruplar' }).getByRole('button');
  await expect(sekmeler).toHaveCount(6);
  let toplam = 0;
  for (let i = 0; i < 6; i++) {
    await sekmeler.nth(i).click();
    await expect(sekmeler.nth(i)).toHaveAttribute('aria-pressed', 'true');
    toplam += await glifDugmeleri.count();
  }
  expect(toplam).toBe(68);
  await expect(glifDugmeleri).toHaveCount(10); // rakamlar
  await geometriTemiz(page, 'yazılış seçimi (rakamlar)');

  // i / İ / ı / I dört ayrı düğme.
  await sekmeler.nth(0).click();
  await expect(page.getByRole('button', { name: 'Küçük i', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Büyük İ', exact: true })).toBeVisible();
  await sekmeler.nth(1).click();
  await expect(page.getByRole('button', { name: 'Küçük ı', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Büyük I', exact: true })).toBeVisible();

  // Gösterim (azaltılmış hareket: adım kipi, ilk hamle).
  await page.waitForTimeout(300);
  await sekmeler.nth(0).click();
  await page.getByRole('button', { name: 'Küçük a', exact: true }).click();
  const gosterim = page.getByRole('main', { name: 'Yazılış: Küçük a' });
  await expect(gosterim).toHaveAttribute('data-hamle-sayisi', '2');
  const svg = gosterim.locator('svg[data-yazilis-kip]');
  await expect(svg).toHaveAttribute('data-yazilis-kip', 'adim');
  await expect(svg).toHaveAttribute('data-yazilis-adim', '1');
  await expect(page.getByRole('button', { name: 'Baştan oynat' })).toHaveCount(0);
  await expect(gosterim.locator('[data-yon-oku="1"]')).toHaveCount(1);
  await expect(gosterim.getByText('1. hamle / 2')).toBeVisible();
  await geometriTemiz(page, 'yazılış gösterimi (adım kipi)');
  await page.getByRole('button', { name: 'Sonraki hamle' }).click();
  await expect(svg).toHaveAttribute('data-yazilis-adim', '2');
  await expect(gosterim.locator('[data-yon-oku="2"]')).toHaveCount(1);
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Sonraki hamle' }).click(); // sınırda kalır
  await expect(svg).toHaveAttribute('data-yazilis-adim', '2');
  await page.getByRole('button', { name: 'Önceki hamle' }).click();
  await expect(svg).toHaveAttribute('data-yazilis-adim', '1');
  await page.getByRole('button', { name: 'Kesik çizgili göster' }).click();
  await expect(svg).toHaveAttribute('data-yazilis-kip', 'kesikli');
  await expect(gosterim.locator('path[stroke-dasharray="3.2 3"]')).toHaveCount(2);

  // Sol el: arayüz aynalanır, glif aynalanmaz (K-OY-19).
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Önceki hamle' }).click();
  await expect(svg).toHaveAttribute('data-yazilis-kip', 'adim');
  const yolOnce = await gosterim.locator('path[data-hamle="1"]').getAttribute('d');
  const donusumOnce = await svg.evaluate((e) => getComputedStyle(e).transform);
  await page.evaluate(() => document.documentElement.setAttribute('data-sol-el', ''));
  expect(await gosterim.locator('path[data-hamle="1"]').getAttribute('d')).toBe(yolOnce);
  expect(await svg.evaluate((e) => getComputedStyle(e).transform)).toBe(donusumOnce);
  await page.evaluate(() => document.documentElement.removeAttribute('data-sol-el'));

  // Türkçe ekranlarda ses yok.
  expect(await istenenKlipler(page), 'Türkçe ekranında klip istenmemeli').toEqual(klipOnce);
  expect(await page.evaluate(() => (window as unknown as { __turKonusma: number }).__turKonusma)).toBe(0);

  // Gezinme: Geri → seçim (aynı sekme) → giriş; Ana menü → uygulama.
  await page.getByRole('button', { name: 'Geri' }).click();
  await expect(secim).toBeVisible();
  await expect(glifDugmeleri).toHaveCount(12);
  await page.waitForTimeout(300); // gezinme çubuğu ekranlar arasında aynı düğme
  await page.getByRole('button', { name: 'Geri' }).click();
  await expect(page.getByRole('main', { name: 'Okuma Yazma' })).toBeVisible();
  await page.getByRole('button', { name: 'Ana menü' }).click();
  await expect(page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' })).toBeVisible();

  expect(agIhlalleri(ag.istekler, new URL(baseURL!).origin)).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('küçük tahta 1080×810: seçim ve gösterim geometrisi', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'board', 'yalnız tahta profili (tablet zaten 1080×810)');
  await page.setViewportSize({ width: 1080, height: 810 });
  await turGirisi(page, '&device=board');
  await geometriTemiz(page, 'Okuma Yazma girişi 1080×810');
  await page.getByRole('button', { name: 'Harf ve rakam yazılışı' }).click();
  await expect(page.getByRole('group', { name: 'Harfler ve rakamlar' }).getByRole('button')).toHaveCount(12);
  await geometriTemiz(page, 'yazılış seçimi 1080×810');
  await page.getByRole('button', { name: 'Büyük E', exact: true }).click();
  await expect(page.getByRole('main', { name: 'Yazılış: Büyük E' })).toHaveAttribute('data-hamle-sayisi', '4');
  await geometriTemiz(page, 'yazılış gösterimi 1080×810');
});

test('hareket açıkken oynat: hamleler sırayla çizilir, numaralar belirir, hız değişir', async ({ page }, bilgi) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`/?ders=tur${bilgi.project.name === 'board' ? '&device=board' : ''}`);
  await page.getByRole('button', { name: 'Başla' }).click();
  await page.getByRole('button', { name: 'Harf ve rakam yazılışı' }).click();
  await page.getByRole('button', { name: 'Küçük a', exact: true }).click();
  const gosterim = page.getByRole('main', { name: 'Yazılış: Küçük a' });
  const svg = gosterim.locator('svg[data-yazilis-kip]');
  // Açılışta bir kez oynar.
  await expect(svg).toHaveAttribute('data-yazilis-kip', 'oynat');
  const cizilen = gosterim.locator('path.tur-hamle-ciz');
  await expect(cizilen).toHaveCount(2);
  await expect(gosterim.locator('[data-yon-oku]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Hız: Orta' }).click();
  await expect(page.getByRole('button', { name: 'Hız: Hızlı' })).toBeVisible();
  await page.getByRole('button', { name: 'Baştan oynat' }).click();
  const ofset = (i: number) =>
    cizilen.nth(i).evaluate((e) => Number(getComputedStyle(e).strokeDashoffset.replace('px', '')));
  await expect.poll(() => ofset(1), { timeout: 10_000 }).toBeLessThan(0.01);
  expect(await ofset(0)).toBeLessThan(0.01);
  await geometriTemiz(page, 'yazılış gösterimi (oynat)');
});

test('bayraksız derlemede ?ders=tur hiçbir şey açmaz', async ({ page }) => {
  await sesKilidiniAc(page, 'http://localhost:5173/?ders=tur');
  await expect(page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' })).toBeVisible();
  await expect(page.getByRole('main', { name: 'Okuma Yazma' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.dataset.dersTur)).toBeUndefined();
});
