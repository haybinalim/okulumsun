import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';

/**
 * Plan v2 Adım 40 aşama 3: tahtada bugünün seti → 6 soru (konum sorularında iki tanılı yanlış)
 * → "Seti bitir" → "Dersi bitir" → ders sonu özeti (zorlanılan beceri + baskın tanı + sınıf etkinliği)
 * → "Yarın için set" yeni seti başlatır ve olayları siler. Yenileme de olayları siler (yalnız bellek).
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

async function tahtaVeOgretmenAlani(page: Page): Promise<void> {
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Öğretmen', exact: true }).click();
  const sirali = await page
    .locator('button[aria-label$="sıradaki sayı olarak seç"]')
    .evaluateAll((b) => b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a));
  for (const sayi of sirali) await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await expect(page.getByRole('heading', { name: 'Öğretmen alanı' })).toBeVisible();
}

async function setiBaslat(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Bugünün setini hazırla' }).click();
  await page.getByRole('button', { name: 'Nerede?', exact: true }).click();
  await page.getByRole('button', { name: 'İleri mi geri mi?', exact: true }).click();
  await page.getByRole('button', { name: 'Tahtada başlat' }).click();
}

/** `adet` soru çözer; M-KONUM sorularında önce iki yanlış (tanılı) deneme bildirir. */
async function sorulariCoz(page: Page, adet: number): Promise<string[]> {
  const sablonlar: string[] = [];
  let onceki: number | null = null;
  for (let i = 0; i < adet; i++) {
    const soru = await sonrakiSoru(page, onceki);
    const sablon = soru.itemId.split('#')[0]!;
    sablonlar.push(sablon);
    if (sablon === 'M-KONUM') {
      expect(await page.evaluate(() => window.__okulumsunE2E!.yanlisCevapla())).toBe(true);
      expect(await page.evaluate(() => window.__okulumsunE2E!.yanlisCevapla())).toBe(true);
    }
    expect(await page.evaluate(() => window.__okulumsunE2E!.dogruCevapla())).toBe(true);
    onceki = soru.sira;
  }
  return sablonlar;
}

test('tahta: 6 soru → ders sonu özeti (tanı + etkinlik) → yarın için set', async ({ page }) => {
  test.setTimeout(120_000);
  await tahtaVeOgretmenAlani(page);
  await setiBaslat(page);

  const sablonlar = await sorulariCoz(page, 6);
  expect(sablonlar.filter((s) => s === 'M-KONUM').length).toBeGreaterThanOrEqual(2);

  await page.getByRole('button', { name: 'Seti bitir' }).click();
  await page.getByRole('button', { name: 'Dersi bitir' }).click();
  await expect(page.getByRole('heading', { name: 'Ders sonu özeti' })).toBeVisible();

  const kartlar = page.getByTestId('ozet-kart');
  await expect(kartlar).toHaveCount(1);
  await expect(kartlar.first()).toHaveAttribute('data-duzey', 'zorlandi');
  await expect(kartlar.first()).toContainText('Sınıf zorlandı');
  await expect(kartlar.first().getByTestId('ozet-tani')).toBeVisible();
  await expect(kartlar.first()).toContainText('Sınıfta:');
  // Özette sayı/yüzde yok (puan/skor yok).
  expect(await kartlar.first().innerText()).not.toMatch(/%|\bpuan\b|\bskor\b/i);
  await geometriTemiz(page, 'ders sonu özeti');

  // Olaylar yalnız bellekte: depolamaya yazılmadı.
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);

  // Yarın için set: zorlanılan düğümden yeni set başlar; olaylar silinir.
  await page.getByRole('button', { name: 'Yarın için set' }).click();
  const yeni = await sonrakiSoru(page, null);
  expect(yeni.itemId.split('#')[0]).toBe('M-KONUM');
  await page.getByRole('button', { name: 'Seti bitir' }).click();
  await page.getByRole('button', { name: 'Dersi bitir' }).click();
  await expect(page.getByTestId('ozet-bos')).toBeVisible();
});

test('tahta: sayfa yenilenince ders olayları silinir', async ({ page }) => {
  test.setTimeout(90_000);
  await tahtaVeOgretmenAlani(page);
  await setiBaslat(page);
  await sorulariCoz(page, 3);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Başla' })).toBeVisible();
  await page.getByRole('button', { name: 'Başla' }).click();
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Dersi bitir' }).click();
  await expect(page.getByTestId('ozet-bos')).toBeVisible();
  await expect(page.getByTestId('ozet-kart')).toHaveCount(0);
});
