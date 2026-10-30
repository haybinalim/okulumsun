import { expect, test, type Page } from '@playwright/test';
import { TUR_URL } from '../../playwright.config';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';

/**
 * Okuma Yazma Adım 65 — Türkçe kâğıt ailesi v1, YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`, port 5174):
 * `?arsiv=tur-…` harf, rakam, dikte ve gözlem kâğıtları. PDF tek sayfa A4; kalibrasyon karesi CSS'te 10 mm
 * (+ 0,3 mm kontur); yazdırma kopyası `#root` dışında ve baskıda yalnız o görünür. Ağ aynı köken, depolama boş.
 * Bayraksız sunucuda `?arsiv=tur-harf-a` Türkçe kâğıt çizmez (matematik arşiv görünümü "geçersiz" der).
 */
test.use({ baseURL: TUR_URL });

const MM = 96 / 25.4;

for (const kod of ['tur-harf-a', 'tur-harf-İ', 'tur-rakam-4', 'tur-dikte', 'tur-gozlem', 'tur-destek-a.N.4']) {
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

/* ---------- Aşama 2: Okuma Yazma ekranında "Kâğıtlar" (önizle + yazdır) ve destek kâğıdı ---------- */

async function kagitlaraGir(page: Page, cihaz: string): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __yazdir: number };
    w.__yazdir = 0;
    window.print = () => {
      w.__yazdir++;
    };
  });
  await sesKilidiniAc(page, `/?ders=tur${cihaz}`);
  await page.getByRole('button', { name: 'Kâğıtlar' }).click();
  await expect(page.getByRole('main', { name: 'Kâğıtlar' })).toBeVisible();
}

test('Kâğıtlar: harf kâğıdı seç → önizle → Yazdır; dikte ve gözlem; geometri, ağ, depolama', async ({
  page,
}, bilgi) => {
  test.setTimeout(90_000);
  const tahta = bilgi.project.name === 'board';
  const ag = agKaydet(page);
  await kagitlaraGir(page, tahta ? '&device=board' : '');
  await geometriTemiz(page, 'Kâğıtlar menüsü');

  await page.getByRole('button', { name: 'Harf ve rakam kâğıdı' }).click();
  await expect(page.getByRole('main', { name: 'Harf ve rakam kâğıdı' })).toBeVisible();
  await geometriTemiz(page, 'kâğıt için glif seçimi');
  await page.getByRole('button', { name: 'Küçük a', exact: true }).click();
  const onizleme = page.getByRole('main', { name: 'Kâğıt önizlemesi' });
  await expect(onizleme).toHaveAttribute('data-kagit-onizleme', 'tur-harf-a');
  await expect(page.locator('.tk-kok--onizleme [data-tur-kagit="tur-harf-a"]')).toBeVisible();
  // Sayfa ayrılan alana sığar (kırpılmaz), A4 oranı korunur.
  const kutu = await page.locator('.tk-kok--onizleme .tk-sayfa').boundingBox();
  const vp = page.viewportSize()!;
  expect(kutu!.y + kutu!.height).toBeLessThanOrEqual(vp.height);
  expect(Math.abs(kutu!.width / kutu!.height - 210 / 297)).toBeLessThan(0.01);
  await geometriTemiz(page, 'kâğıt önizlemesi');
  await page.getByRole('button', { name: 'Yazdır' }).click();
  expect(await page.evaluate(() => (window as unknown as { __yazdir: number }).__yazdir)).toBe(1);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#root')).toBeHidden();
  await expect(page.locator('#tur-kagit-baski [data-tur-kagit="tur-harf-a"]')).toBeVisible();
  await page.emulateMedia({ media: 'screen' });

  // Geri → seçim (aynı sekme) → Geri → menü → Dikte → Geri → Gözlem. Gezinme çubuğu aynı düğme: 250 ms soğuma.
  const geri = async () => {
    await page.getByRole('button', { name: 'Geri' }).click();
    await page.waitForTimeout(300);
  };
  await geri();
  await expect(page.getByRole('main', { name: 'Harf ve rakam kâğıdı' })).toBeVisible();
  await geri();
  await page.getByRole('button', { name: 'Dikte sayfası' }).click();
  await expect(page.getByRole('main', { name: 'Kâğıt önizlemesi' })).toHaveAttribute(
    'data-kagit-onizleme',
    'tur-dikte',
  );
  await geri();
  await page.getByRole('button', { name: 'Gözlem listesi' }).click();
  await expect(page.getByRole('main', { name: 'Kâğıt önizlemesi' })).toHaveAttribute(
    'data-kagit-onizleme',
    'tur-gozlem',
  );
  await geometriTemiz(page, 'gözlem listesi önizlemesi');

  expect(agIhlalleri(ag.istekler, new URL(TUR_URL).origin)).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('destek kâğıdı: en çok 6 glif seçilir, seçim sırasıyla tek sayfa; seçim saklanmaz', async ({ page }, bilgi) => {
  test.setTimeout(90_000);
  const tahta = bilgi.project.name === 'board';
  await kagitlaraGir(page, tahta ? '&device=board' : '');
  await page.getByRole('button', { name: 'Destek kâğıdı' }).click();
  await expect(page.getByRole('main', { name: 'Destek kâğıdı' })).toBeVisible();
  const onizle = page.getByRole('button', { name: /^Önizle/ });
  await expect(onizle).toHaveAttribute('aria-disabled', 'true');
  const sec = async (ad: string) => {
    await page.getByRole('button', { name: ad, exact: true }).click();
    await page.waitForTimeout(300); // BigButton aynı düğmeye 250 ms soğuma
  };
  await sec('Küçük a');
  await sec('Büyük N');
  await sec('Küçük e');
  await expect(page.getByRole('button', { name: 'Küçük a', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await sec('Küçük a'); // seçimden çıkar
  await expect(page.getByRole('button', { name: 'Küçük a', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('group', { name: 'Gruplar' }).getByRole('button', { name: 'Rakamlar' }).click();
  for (const r of ['4', '7', '1', '0']) await sec(`Rakam ${r}`);
  // 6 seçildi (N, e, 4, 7, 1, 0); yedinci eklenmez.
  await sec('Rakam 9');
  await expect(page.getByRole('button', { name: 'Rakam 9', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Önizle, 6 seçili' })).toBeVisible();
  await geometriTemiz(page, 'destek seçimi');
  await page.getByRole('button', { name: 'Önizle, 6 seçili' }).click();
  await expect(page.getByRole('main', { name: 'Kâğıt önizlemesi' })).toHaveAttribute(
    'data-kagit-onizleme',
    'tur-destek-N.e.4.7.1.0',
  );
  await expect(page.locator('.tk-kok--onizleme [data-satir-kipi]')).toHaveCount(12);
  await geometriTemiz(page, 'destek önizlemesi');
  // Geri: seçim bellekte duruyor; depolama boş.
  await page.getByRole('button', { name: 'Geri' }).click();
  await expect(page.getByRole('button', { name: 'Önizle, 6 seçili' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('küçük tahta 1080×810: Kâğıtlar menüsü, seçim ve önizleme geometrisi', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'board', 'yalnız tahta profili (tablet zaten 1080×810)');
  await page.setViewportSize({ width: 1080, height: 810 });
  await kagitlaraGir(page, '&device=board');
  await geometriTemiz(page, 'Kâğıtlar menüsü 1080×810');
  await page.getByRole('button', { name: 'Destek kâğıdı' }).click();
  await page.getByRole('button', { name: 'Büyük E', exact: true }).click();
  await geometriTemiz(page, 'destek seçimi 1080×810');
  await page.getByRole('button', { name: /^Önizle/ }).click();
  await expect(page.locator('.tk-kok--onizleme [data-tur-kagit="tur-destek-E"]')).toBeVisible();
  await geometriTemiz(page, 'destek önizlemesi 1080×810');
});
