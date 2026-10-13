import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';

/**
 * Plan v2 Adım 44 aşama 2 (KG-64): tahtada Keşif Masası — ana ekrandan giriş, üç araç (onluk çerçeve,
 * nesneler, sayı doğrusu) erişim bölgesinde ve ≥102 px; dokunuşlar sayıyı değiştirir, sınır 20'de durur;
 * azaltılmış harekette animasyon yok; ağ ve depolama temiz.
 */

const sayi = (page: Page) => page.getByRole('main', { name: 'Keşif Masası' }).getAttribute('data-kesif-sayi');

test('tahta: Keşif Masası üç araç, geometri ve sınırlar', async ({ page, baseURL }) => {
  test.setTimeout(90_000);
  const ag = agKaydet(page);
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await expect(page.getByRole('button', { name: 'Keşif Masası' })).toBeVisible();
  await geometriTemiz(page, 'ana ekran (tahta, Keşif Masası girişi)');
  await page.getByRole('button', { name: 'Keşif Masası' }).click();

  // Onluk çerçeve (varsayılan): 20 göz.
  await expect(page.getByRole('main', { name: 'Keşif Masası' })).toHaveAttribute('data-kesif-arac', 'onlukCerceve');
  await expect(page.getByRole('button', { name: /^Göz \d+/ })).toHaveCount(20);
  await geometriTemiz(page, 'Keşif Masası — onluk çerçeve');
  await page.getByRole('button', { name: 'Göz 3, boş' }).click();
  await page.getByRole('button', { name: 'Göz 12, boş' }).click();
  await expect.poll(() => sayi(page)).toBe('2');
  await page.waitForTimeout(260); // aynı düğmeye ardışık dokunuş soğuması (250 ms)
  await page.getByRole('button', { name: 'Göz 3, dolu' }).click();
  await expect.poll(() => sayi(page)).toBe('1');
  // Azaltılmış hareket: sayaç anında tam görünür (ölçek/saydamlık animasyonu yok).
  const stil = await page
    .getByRole('button', { name: 'Göz 12, dolu' })
    .locator('span:has(> svg)')
    .evaluate((el) => ({ op: getComputedStyle(el).opacity, tr: getComputedStyle(el).transform }));
  expect(stil.op).toBe('1');
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(stil.tr);

  // Nesneler: +1 ile 22 kez → 20'de durur; nesneye dokunmak bir çıkarır.
  await page.getByRole('button', { name: 'Nesneler' }).click();
  await expect.poll(() => sayi(page)).toBe('0');
  // Aynı düğmeye ardışık dokunuşlar arasında 250 ms soğuma var (BigButton); her dokunuşu bekle.
  for (let i = 1; i <= 22; i++) {
    await page.getByRole('button', { name: 'Bir ekle' }).click();
    await expect.poll(() => sayi(page)).toBe(String(Math.min(i, 20)));
    await page.waitForTimeout(260);
  }
  await expect.poll(() => sayi(page)).toBe('20');
  await geometriTemiz(page, 'Keşif Masası — 20 nesne');
  await page.getByRole('button', { name: 'Nesne 5', exact: true }).click();
  await expect.poll(() => sayi(page)).toBe('19');

  // Sayı doğrusu: noktaya zıpla, pencere 10'u geçince kayar.
  await page.getByRole('button', { name: 'Sayı doğrusu' }).click();
  await geometriTemiz(page, 'Keşif Masası — sayı doğrusu');
  await page.getByRole('button', { name: 'Sayı 10', exact: true }).click();
  await expect.poll(() => sayi(page)).toBe('10');
  await page.waitForTimeout(260);
  await page.getByRole('button', { name: 'Bir ekle' }).click();
  await expect.poll(() => sayi(page)).toBe('11');
  await expect(page.getByRole('button', { name: 'Sayı 20', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Baştan' }).click();
  await expect.poll(() => sayi(page)).toBe('0');

  await page.getByRole('button', { name: 'Ev', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keşif Masası' })).toBeVisible();

  expect(agIhlalleri(ag.istekler, new URL(baseURL!).origin)).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});
