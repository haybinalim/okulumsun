import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, sesKilidiniAc, temayiBaslat, klipIstendi } from './yardimci/akis';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';

/**
 * Plan v2 Adım 46 aşama 2 (KG-67): tema sonu turu. Tahtada konu seçiminin son kartı "Tema turu",
 * kişiselde yetişkin alanındaki "Tema turu başlat". 8–10 soru → kutlama → yetişkine beceri başına
 * nitel düzey (sayı/yüzde/puan yok) → ana ekran. Ağa hiçbir şey gitmez, depolama boş.
 */

async function aktif(page: Page): Promise<number | null> {
  return page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null);
}

async function turuCoz(page: Page): Promise<number> {
  let onceki: number | null = null;
  let adet = 0;
  for (;;) {
    const bitti = page.getByRole('main', { name: 'Tema turu bitti' });
    await expect
      .poll(async () => (await bitti.isVisible()) || ((await aktif(page)) !== null && (await aktif(page)) !== onceki), {
        timeout: 15_000,
      })
      .toBe(true);
    if (await bitti.isVisible()) return adet;
    onceki = await aktif(page);
    if (adet === 0) await geometriTemiz(page, 'tema turu 1. soru');
    if (adet === 0) await klipIstendi(page, 'tematuru.basliyor');
    expect(await page.evaluate(() => window.__okulumsunE2E!.dogruCevapla())).toBe(true);
    adet++;
    expect(adet).toBeLessThanOrEqual(10);
  }
}

async function sonuDogrula(page: Page): Promise<void> {
  await klipIstendi(page, 'tematuru.bitti');
  await page.getByRole('button', { name: 'Devam etmek için dokun' }).click();
  await page.getByRole('button', { name: 'Yetişkin: tur özetini aç' }).click();
  await expect(page.getByRole('heading', { name: /^Tema turu: / })).toBeVisible();
  const satir = page.getByTestId('tur-duzey');
  expect(await satir.count()).toBeGreaterThan(0);
  // Hepsi ilk denemede doğru → hepsi "rahat".
  for (const d of await satir.evaluateAll((x) => x.map((e) => e.getAttribute('data-duzey')))) expect(d).toBe('rahat');
  await expect(page.locator('main')).not.toContainText(/yanlış|puan|skor|%/i);
  await page.getByRole('button', { name: 'Bitti', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
}

test('tema turu (tahta): konu seçiminde son kart, 8–10 soru, nitel özet; ağ ve depolama temiz', async ({
  page,
  baseURL,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'board', 'Tahta akışı yalnız board projesinde.');
  test.setTimeout(120_000);
  const ag = agKaydet(page);
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await temayiBaslat(page);
  await page.getByRole('button', { name: 'Tema turu', exact: true }).click();
  const adet = await turuCoz(page);
  expect(adet).toBeGreaterThanOrEqual(8);
  await sonuDogrula(page);
  expect(agIhlalleri(ag.istekler, new URL(baseURL!).origin)).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('tema turu (kişisel): yetişkin alanından başlar; ağ ve depolama temiz', async ({ page, baseURL }, testInfo) => {
  test.skip(testInfo.project.name === 'board', 'Kişisel akış tablet/telefon projelerinde.');
  test.setTimeout(120_000);
  const ag = agKaydet(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?device=tablet');
  await page.getByRole('button', { name: 'Başla' }).click();
  await page.getByRole('button', { name: 'Kendi başıma çalışacağım.' }).click();
  await page.getByRole('button', { name: 'Kedi' }).click();
  await page.getByRole('button', { name: 'Renk mor' }).click();
  await page.getByRole('button', { name: 'Ayarlar' }).click();
  const sayilar = await page
    .locator('button[aria-label$="sıradaki sayı olarak seç"]')
    .evaluateAll((b) => b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a));
  for (const s of sayilar) await page.getByRole('button', { name: `${s}, sıradaki sayı olarak seç` }).click();
  await expect(page.getByRole('heading', { name: 'Yetişkin alanı' })).toBeVisible();
  await page.getByRole('button', { name: 'Tema turu başlat' }).click();
  const adet = await turuCoz(page);
  expect(adet).toBeGreaterThanOrEqual(8);
  await sonuDogrula(page);
  expect(agIhlalleri(ag.istekler, new URL(baseURL!).origin)).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});
