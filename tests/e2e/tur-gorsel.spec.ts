import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { TUR_URL } from '../../playwright.config';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';

/**
 * Okuma Yazma Adım 68 — sözcük görselleri kataloğu, YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`, port 5174).
 * Giriş `?ders=tur` → "Görseller": 1. grubun dizinindeki her görsel aynı kökenden yüklenir (bozuk resim yok), altında
 * sözcüğü; "Siyah-beyaz" gri tona çevirir; grup değişince o grubun dizini okunur. Geometri temiz (üst %35'te dokunma
 * yok), ses yok, ağ aynı köken, depolama boş. Bayraksız sunucuda `/tur/gorseller/` sunulmaz.
 */
test.use({ baseURL: TUR_URL });

const dizin = (grup: number) =>
  JSON.parse(readFileSync(`ders-verisi/tur/gorseller/grup-${grup}.json`, 'utf8')) as {
    gorseller: { id: string; sozcuk: string }[];
  };

test('görseller kataloğu: 1. grup tam ve yüklü, siyah-beyaz, grup geçişi; geometri ve gizlilik', async ({
  page,
}, bilgi) => {
  test.setTimeout(90_000);
  const tahta = bilgi.project.name === 'board';
  const ag = agKaydet(page);
  await sesKilidiniAc(page, `/?ders=tur${tahta ? '&device=board' : ''}`);
  await expect(page.getByRole('main', { name: 'Okuma Yazma' })).toBeVisible();
  const klipler = () => page.evaluate(() => [...(window.__okulumsunE2E?.istenenKlipler ?? [])]);
  const klipOnce = await klipler();
  await page.getByRole('button', { name: 'Görseller' }).click();
  const katalog = page.locator('[data-tur-gorsel-katalogu="1"]');
  await expect(katalog).toBeVisible();

  const beklenen = dizin(1).gorseller;
  const resimler = katalog.locator('img[data-tur-gorsel]');
  await expect(resimler).toHaveCount(beklenen.length);
  await expect
    .poll(() => resimler.evaluateAll((l) => l.filter((i) => (i as HTMLImageElement).naturalWidth > 0).length))
    .toBe(beklenen.length);
  const altlar = await resimler.evaluateAll((l) => l.map((i) => (i as HTMLImageElement).alt));
  expect(altlar).toEqual(beklenen.map((g) => g.sozcuk));
  await geometriTemiz(page, 'Görseller');

  await page.getByRole('button', { name: 'Siyah-beyaz' }).click();
  await expect(page.getByRole('button', { name: 'Siyah-beyaz' })).toHaveAttribute('aria-pressed', 'true');
  expect(await resimler.first().evaluate((i) => getComputedStyle(i).filter)).toBe('grayscale(1)');

  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /^2\. grup/ }).click();
  await expect(page.locator('[data-tur-gorsel-katalogu="1"]')).toHaveCount(0);
  let ikinci = 0;
  try {
    ikinci = dizin(2).gorseller.length;
  } catch {
    ikinci = 0;
  }
  if (ikinci > 0) await expect(page.locator('[data-tur-gorsel-katalogu="2"] img')).toHaveCount(ikinci);
  else await expect(page.getByRole('status')).toHaveText('Bu grubun görselleri henüz yok.');

  expect(agIhlalleri(ag.istekler, new URL(TUR_URL).origin)).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  expect(await klipler()).toEqual(klipOnce);
});

test('bayraksız sunucuda Türkçe görseller sunulmaz', async ({ request }, bilgi) => {
  test.skip(bilgi.project.name !== 'board', 'bir projede yeter');
  const y = await request.get('http://localhost:5173/tur/gorseller/at.svg');
  expect(y.headers()['content-type'] ?? '').not.toContain('image/svg+xml');
});
