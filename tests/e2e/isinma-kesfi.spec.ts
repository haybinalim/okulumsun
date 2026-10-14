import { expect, test, type Page } from '@playwright/test';
import {
  geometriTemiz,
  kisiselModaGir,
  oturumuBitir,
  sesKilidiniAc,
  temayiBaslat,
  yetiskinAlaniniAc,
} from './yardimci/akis';
import { depolamaDurumu, depolamaIhlalleri } from './yardimci/gizlilik';

/**
 * Plan v2 Adım 47 aşama 3: Isınma Keşfi (PLAN §6.5, ADR-0007 Kabul). Varsayılan kapalı; veli
 * kişisel modda yetişkin alanından açar; ısınma en çok 8 madde, ardışık 2 yanlışta biter; sonra
 * normal oturum gelir. Hiçbir şey kaydedilmez; tahtada anahtar yoktur.
 */

const ANAHTAR = /^Oturuma kısa ısınmayla başla: (açık|kapalı)$/;

async function isinmada(page: Page): Promise<boolean> {
  return (await page.locator('[data-isinma]').count()) > 0;
}

async function alistirmaSirasi(page: Page): Promise<number | null> {
  return page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null);
}

test('kişisel: anahtar varsayılan kapalı; açınca ısınma, 2 yanlışta biter, sonra oturum; kayıt yok', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'Kişisel mod tablet profilinde sınanır.');
  test.setTimeout(120_000);

  await sesKilidiniAc(page, '/?device=tablet');
  await kisiselModaGir(page);
  await yetiskinAlaniniAc(page);

  const anahtar = page.getByRole('button', { name: ANAHTAR });
  await expect(anahtar).toHaveAccessibleName('Oturuma kısa ısınmayla başla: kapalı');
  await expect(anahtar).toHaveAttribute('aria-pressed', 'false');
  await anahtar.click();
  await expect(anahtar).toHaveAccessibleName('Oturuma kısa ısınmayla başla: açık');

  await page.getByRole('button', { name: 'Çocuk ekranına dön' }).click();
  await temayiBaslat(page);

  // Isınma: her madde önce yanlış denenir, sonra doğru bitirilir → ilk deneme yanlış sayılır.
  await expect.poll(() => isinmada(page), { timeout: 15_000 }).toBe(true);
  let isinmaMaddesi = 0;
  while (await isinmada(page)) {
    await expect.poll(() => alistirmaSirasi(page), { timeout: 15_000 }).not.toBeNull();
    const sira = await alistirmaSirasi(page);
    await geometriTemiz(page, `ısınma ${isinmaMaddesi + 1}`);
    expect(await page.evaluate(() => window.__okulumsunE2E!.yanlisCevapla())).toBe(true);
    expect(await page.evaluate(() => window.__okulumsunE2E!.dogruCevapla())).toBe(true);
    isinmaMaddesi += 1;
    expect(isinmaMaddesi, 'ısınma 8 maddeden uzun').toBeLessThanOrEqual(8);
    await expect.poll(() => alistirmaSirasi(page), { timeout: 15_000 }).not.toBe(sira);
  }
  expect(isinmaMaddesi).toBe(2);

  // Ardından normal oturum (en çok 8 soru) ve oturum sonu.
  const adet = await oturumuBitir(page);
  expect(adet).toBeGreaterThanOrEqual(5);
  expect(await isinmada(page)).toBe(false);

  expect(depolamaIhlalleri(await depolamaDurumu(page))).toEqual([]);

  // Yalnız bellekte: yenileyince anahtar yine kapalı.
  await sesKilidiniAc(page, '/?device=tablet');
  await kisiselModaGir(page);
  await yetiskinAlaniniAc(page);
  await expect(page.getByRole('button', { name: ANAHTAR })).toHaveAccessibleName(
    'Oturuma kısa ısınmayla başla: kapalı',
  );
});

test('kişisel: anahtar kapalıyken ısınma yok', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'Kişisel mod tablet profilinde sınanır.');
  test.setTimeout(90_000);
  await sesKilidiniAc(page, '/?device=tablet');
  await kisiselModaGir(page);
  await temayiBaslat(page);
  await expect.poll(() => alistirmaSirasi(page), { timeout: 15_000 }).not.toBeNull();
  expect(await isinmada(page)).toBe(false);
});

test('tahta: öğretmen alanında ısınma anahtarı yok', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'board', 'Tahta profili.');
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
  await yetiskinAlaniniAc(page);
  await expect(page.getByRole('heading', { name: 'Öğretmen alanı' })).toBeVisible();
  await expect(page.getByRole('button', { name: ANAHTAR })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Isınma' })).toHaveCount(0);
});
