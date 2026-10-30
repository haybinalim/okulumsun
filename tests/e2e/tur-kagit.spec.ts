import { expect, test } from '@playwright/test';
import { TUR_URL } from '../../playwright.config';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';

/**
 * Okuma Yazma Adım 65 — Türkçe kâğıt ailesi v1, YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`, port 5174):
 * `?arsiv=tur-…` harf, rakam, dikte ve gözlem kâğıtları. PDF tek sayfa A4; kalibrasyon karesi CSS'te 10 mm
 * (+ 0,3 mm kontur); yazdırma kopyası `#root` dışında ve baskıda yalnız o görünür. Ağ aynı köken, depolama boş.
 * Bayraksız sunucuda `?arsiv=tur-harf-a` Türkçe kâğıt çizmez (matematik arşiv görünümü "geçersiz" der).
 */
test.use({ baseURL: TUR_URL });

const MM = 96 / 25.4;

for (const kod of ['tur-harf-a', 'tur-harf-İ', 'tur-rakam-4', 'tur-dikte', 'tur-gozlem']) {
  test(`kâğıt ${kod}: tek sayfa A4, kalibrasyon karesi 1 cm, baskıda yalnız kâğıt`, async ({ page }, bilgi) => {
    test.skip(bilgi.project.name !== 'board', 'kâğıt çıktısı cihazdan bağımsız; bir projede yeter');
    const ag = agKaydet(page);
    await page.goto(`/?arsiv=${encodeURIComponent(kod)}`);
    await expect(page.locator('[data-tur-kagit-hazir]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const kare = await page.locator('.tk-kok--onizleme [data-kalibrasyon]').boundingBox();
    expect(kare).not.toBeNull();
    expect(Math.abs(kare!.width - 10.3 * MM)).toBeLessThan(0.6);
    expect(Math.abs(kare!.height - 10.3 * MM)).toBeLessThan(0.6);
    await expect(page.locator(`#tur-kagit-baski [data-tur-kagit="${kod}"]`)).toHaveCount(1);

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#root')).toBeHidden();
    await expect(page.locator('#tur-kagit-baski .tk-sayfa')).toBeVisible();
    const pdf = (await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString('latin1');
    expect(pdf.match(/\/Type\s*\/Page[^s]/g) ?? []).toHaveLength(1);
    const kutu = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf);
    expect(kutu).not.toBeNull();
    expect(Math.abs(Number(kutu![1]) - 595.28)).toBeLessThan(1);
    expect(Math.abs(Number(kutu![2]) - 841.89)).toBeLessThan(1);

    expect(agIhlalleri(ag.istekler, new URL(TUR_URL).origin)).toEqual([]);
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  });
}

test('geçersiz Türkçe kâğıt kodu: bilgi metni, kâğıt yok', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'board', 'bir projede yeter');
  await page.goto('/?arsiv=tur-harf-q');
  await expect(page.getByRole('status')).toHaveText('Bu kâğıt kodu geçersiz.');
  await expect(page.locator('[data-tur-kagit]')).toHaveCount(0);
});

test('bayraksız derlemede ?arsiv=tur-harf-a Türkçe kâğıt çizmez', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'board', 'bir projede yeter');
  await page.goto('http://localhost:5173/?arsiv=tur-harf-a');
  await expect(page.getByRole('status')).toHaveText('Bu kâğıt kodu geçersiz.');
  await expect(page.locator('[data-tur-kagit]')).toHaveCount(0);
});
