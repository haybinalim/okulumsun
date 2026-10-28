import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';

/**
 * Plan v2 Adım 36 aşama 2b (KG-47): Sınıf Turu — 3 takım × 3 tur → kavanoz kutlaması.
 * Her ekran tahta erişim bölgesinde; ekranda puan/skor yok; depolamaya yazılmaz.
 */
const PUAN_SKOR = /\d+\s*(puan|skor)/i;

async function sinifTurunuAc(page: Page): Promise<void> {
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Sınıf Turu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sınıf Turu' })).toBeVisible();
}

async function soruBekle(page: Page, onceki: number | null): Promise<number> {
  await expect
    .poll(async () => (await page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null)) !== onceki, {
      message: 'yeni alıştırma bekleniyor',
      timeout: 15_000,
    })
    .toBe(true);
  return page.evaluate(() => window.__okulumsunE2E!.alistirma!.sira);
}

async function puanSkorYok(page: Page, ekran: string): Promise<void> {
  const metin = await page.locator('body').innerText();
  expect(metin, `${ekran}: puan/skor metni`).not.toMatch(PUAN_SKOR);
}

test('tahta: Sınıf Turu — 3 takım × 3 tur → kavanoz kutlaması', async ({ page }) => {
  test.setTimeout(150_000);
  await sinifTurunuAc(page);
  await geometriTemiz(page, 'sınıf turu kurulum');
  await expect(page.getByRole('button', { name: '3 takım' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Orta kavanoz' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Sınıf Turunu başlat' }).click();

  const main = page.getByRole('main', { name: 'Sınıf Turu' });
  const sira = ['mor', 'turuncu', 'yesil'];
  let onceki: number | null = null;
  for (let tur = 0; tur < 9; tur++) {
    await expect(main).toHaveAttribute('data-asama', 'siraDuyurusu');
    await expect(page.locator(`[data-sira="${sira[tur % 3]}"]`)).toBeVisible();
    if (tur < 3) await geometriTemiz(page, `sıra duyurusu ${tur + 1}`);
    await page.getByRole('button', { name: 'Hazırız' }).click();

    await expect(main).toHaveAttribute('data-asama', 'soru');
    onceki = await soruBekle(page, onceki);
    if (tur < 3) await geometriTemiz(page, `tur sorusu ${tur + 1}`);
    if (tur === 1) {
      // İlk yanlış: aynı takım tekrar dener (sıra geçmez); ikinci yanlış: "hep birlikte".
      expect(await page.evaluate(() => window.__okulumsunE2E!.yanlisCevapla())).toBe(true);
      await expect(page.getByText('Hep birlikte çözelim.')).toHaveCount(0);
      await expect(main).toHaveAttribute('data-asama', 'soru');
      expect(await page.evaluate(() => window.__okulumsunE2E!.yanlisCevapla())).toBe(true);
      await expect(page.getByText('Hep birlikte çözelim.')).toBeVisible();
      await geometriTemiz(page, 'hep birlikte');
    }
    expect(await page.evaluate(() => window.__okulumsunE2E!.dogruCevapla())).toBe(true);

    await expect(main).toHaveAttribute('data-asama', 'kutlama');
    // Doğru/yanlıştan bağımsız: tamamlanan her tur sıradaki takıma bir yıldız.
    await expect(page.locator(`li[data-takim="${sira[tur % 3]}"]`).first()).toHaveAttribute(
      'data-yildiz',
      String(Math.floor(tur / 3) + 1),
    );
    if (tur < 3) {
      await geometriTemiz(page, `tur kutlaması ${tur + 1}`);
      await puanSkorYok(page, `tur kutlaması ${tur + 1}`);
    }
    await page.getByRole('button', { name: 'Devam' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Kavanozu birlikte doldurduk!' })).toBeVisible();
  await expect(page.locator('[data-kavanoz="dolu"]')).toBeVisible();
  await geometriTemiz(page, 'sınıf turu sonu');
  await puanSkorYok(page, 'sınıf turu sonu');

  // Yalnız bellek: depolamaya hiçbir şey yazılmadı.
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);

  await page.getByRole('button', { name: 'Ana ekran' }).click();
  await expect(page.getByRole('button', { name: 'Sınıf Turu', exact: true })).toBeVisible();
});

test('tahta: öğretmen "Bitir" ikinci dokunuşta onaylanır; renk seçimi takım sayısına bağlı', async ({ page }) => {
  await sinifTurunuAc(page);
  await page.getByRole('button', { name: '2 takım' }).click();
  await expect(page.getByRole('button', { name: 'mor takım (kedi)' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'mor takım (kedi)' }).click();
  await expect(page.getByRole('button', { name: 'Sınıf Turunu başlat' })).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('button', { name: 'mavi takım (balina)' }).click();
  await expect(page.getByRole('button', { name: 'Sınıf Turunu başlat' })).not.toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('button', { name: 'Sınıf Turunu başlat' }).click();

  const main = page.getByRole('main', { name: 'Sınıf Turu' });
  await expect(main).toHaveAttribute('data-asama', 'siraDuyurusu');
  await expect(page.locator('[data-sira="turuncu"]')).toBeVisible();
  await page.getByRole('button', { name: 'Bitir', exact: true }).click();
  await expect(main).toHaveAttribute('data-asama', 'siraDuyurusu');
  // BigButton çift dokunuş soğuması (250 ms): onay ayrı, bilinçli bir ikinci dokunuş.
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Emin misiniz? Turu bitir' }).click();
  await expect(page.getByRole('heading', { name: 'Bugün birlikte çalıştık!' })).toBeVisible();
  await puanSkorYok(page, 'erken bitiş');
});
