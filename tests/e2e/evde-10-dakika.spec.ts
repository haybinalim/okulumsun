import { expect, test } from '@playwright/test';
import { geometriTemiz } from './yardimci/akis';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';

/**
 * Plan v2 Adım 43 aşama 2 (KG-62): veli kapısı → "Evde 10 dakika başlat" → bu haftanın 8 sorusu → kutlama →
 * yetişkin ipucu kartı (gözlem / soru / etkinlik) → çocuk ekranı. Ağa hiçbir şey gitmez, depolama boş.
 * "Bugün" sabitlenir (2026-10-14, 5. öğretim haftası) ki test takvimden bağımsız olsun.
 */

async function aktif(page: import('@playwright/test').Page): Promise<number | null> {
  return page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null);
}

test('evde 10 dakika: veli başlatır, 8 soru, ipucu kartı; ağ ve depolama temiz', async ({
  page,
  baseURL,
}, testInfo) => {
  test.skip(testInfo.project.name === 'board', 'Evde 10 dakika yalnız kişisel moddadır (tablet/telefon).');
  test.setTimeout(120_000);
  await page.clock.setFixedTime(new Date('2026-10-14T10:00:00'));
  const ag = agKaydet(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?device=tablet');
  await page.getByRole('button', { name: 'Başla' }).click();
  await page.getByRole('button', { name: 'Kendi başıma çalışacağım.' }).click();
  await page.getByRole('button', { name: 'Kedi' }).click();
  await page.getByRole('button', { name: 'Renk mor' }).click();
  await page.getByRole('button', { name: 'Ayarlar' }).click();

  // Veli kapısı: sayıları büyükten küçüğe seç.
  const sayilar = await page
    .locator('button[aria-label$="sıradaki sayı olarak seç"]')
    .evaluateAll((b) => b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a));
  for (const s of sayilar) await page.getByRole('button', { name: `${s}, sıradaki sayı olarak seç` }).click();

  await expect(page.getByRole('heading', { name: 'Yetişkin alanı' })).toBeVisible();
  await page.getByRole('button', { name: 'Evde 10 dakika başlat' }).click();

  let onceki: number | null = null;
  for (let i = 0; i < 8; i++) {
    await expect
      .poll(async () => (await aktif(page)) !== null && (await aktif(page)) !== onceki, { timeout: 15_000 })
      .toBe(true);
    onceki = await aktif(page);
    if (i === 0) await geometriTemiz(page, 'evde 10 dakika 1. soru');
    expect(await page.evaluate(() => window.__okulumsunE2E!.dogruCevapla())).toBe(true);
  }

  await expect(page.getByRole('main', { name: 'Ev çalışması bitti' })).toBeVisible();
  await page.getByRole('button', { name: 'Devam etmek için dokun' }).click();
  // Öğretmen bağlantısındaki [Ev] yerine yetişkine ipucu kartı düğmesi.
  await expect(page.getByRole('button', { name: 'Ev', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Yetişkin: ipucu kartını aç' }).click();

  await expect(page.getByRole('heading', { name: 'Evde 10 dakika — sizin için ipucu' })).toBeVisible();
  for (const b of ['Gözlemleyin', 'Sorun', 'Birlikte yapın'])
    await expect(page.getByRole('heading', { name: b, exact: true })).toBeVisible();
  await expect(page.getByText(/Bu haftanın konusu: /)).toBeVisible();
  // Puan/skor yok; "yanlış" sözcüğü yok.
  await expect(page.locator('main')).not.toContainText(/yanlış|puan|skor/i);
  await geometriTemiz(page, 'ipucu kartı');
  await page.getByRole('button', { name: 'Tamam, çocuk ekranına dön' }).click();
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();

  expect(agIhlalleri(ag.istekler, new URL(baseURL!).origin)).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});
