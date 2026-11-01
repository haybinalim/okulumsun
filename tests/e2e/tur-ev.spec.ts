import { expect, test } from '@playwright/test';
import { TUR_URL } from '../../playwright.config';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';
import { BAYRAKLI_IZINLI_ANAHTARLAR, DERS_TUR_SINIF_ANAHTARI, IZINLI_ANAHTARLAR } from '../../src/persistence/depolamaIzinListesi';

/**
 * Okuma Yazma Adım 71 aşama 3 — eve link, veli kartı, Kaynaklar; YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`, 5174).
 *
 *  - Öğretmen: Set hazırla → Eve gönder: QR + bağlantı (yalnız ders, set kodu, küme kodu) + veli kartı ("Taslak").
 *  - Ev cihazı: bağlantı ev açılışını açar (veli kartı + Başla); gezinme yalnız ev açılışına döner, öğretmen ekranına
 *    yol yok; sınıf ayarı anahtarı okunmaz ve yazılmaz.
 *  - Kaynaklar: program sürümü ve adresi, TemelYazi, özgün içerik, ses kaynağı.
 * Görünümler: tahta 1920×1080, tahta 1080×810, tablet 1080×810.
 */
test.use({ baseURL: TUR_URL });

const gorunumler = (proje: string) =>
  proje === 'board'
    ? ([
        { ad: 'tahta 1920×1080', w: 1920, h: 1080, cihaz: 'board' },
        { ad: 'tahta 1080×810', w: 1080, h: 810, cihaz: 'board' },
      ] as const)
    : ([{ ad: 'tablet 1080×810', w: 1080, h: 810, cihaz: 'tablet' }] as const);

const IZINLI = new Set([...IZINLI_ANAHTARLAR, ...BAYRAKLI_IZINLI_ANAHTARLAR].map((a) => a.anahtar));

test('eve gönder → ev açılışı: veli kartı, aynı set, gezinme ev açılışına döner, sınıf ayarı okunmaz/yazılmaz', async ({ browser }, bilgi) => {
  test.setTimeout(150_000);
  for (const g of gorunumler(bilgi.project.name)) {
    // Öğretmen cihazı.
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    await sesKilidiniAc(page, `/?ders=tur&device=${g.cihaz}&tur=1kv`);
    await page.getByRole('button', { name: 'Set hazırla' }).click();
    await page.getByRole('button', { name: 'Destek', exact: true }).click();
    const setAdimlari = (await page.getByRole('list', { name: 'Setteki etkinlikler' }).getAttribute('data-set-adimlari'))!;
    await page.getByRole('button', { name: 'Eve gönder' }).click();
    await expect(page.getByRole('main', { name: 'Eve gönder' })).toBeVisible();
    await expect(page.getByTestId('tur-eve-qr')).toBeVisible();
    await expect(page.locator('main [data-veli-karti="bekliyor"] [data-teyit-bekliyor]')).toBeVisible();
    await geometriTemiz(page, `${g.ad} eve gönder`);
    const link = new URL((await page.getByTestId('tur-eve-link').textContent())!.trim());
    expect([...link.searchParams.keys()].sort()).toEqual(['ders', 'ev', 'tur']);
    expect(link.searchParams.get('ev')).toMatch(/^d[1-9][0-9]*$/);
    expect(link.searchParams.get('tur')).toBe('1kv');
    // Baskı kopyası #root dışında, ekranda gizli.
    await expect(page.locator('#tur-veli-baski [data-veli-karti]')).toBeHidden();
    await page.getByRole('button', { name: 'Geri' }).click();
    await expect(page.getByRole('main', { name: 'Set hazırla' })).toBeVisible();
    await ctx.close();

    // Ev cihazı: önceden başka bir sınıf ayarı olsa da okunmaz, değişmez.
    const ev = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const sinifDegeri = JSON.stringify({ v: 1, kume: 'zzz', akis: '21345678' });
    await ev.addInitScript(
      ([k, v]) => {
        if (!sessionStorage.getItem('tohum')) {
          localStorage.setItem(k, v);
          sessionStorage.setItem('tohum', '1');
        }
      },
      [DERS_TUR_SINIF_ANAHTARI, sinifDegeri] as const,
    );
    const p2 = await ev.newPage();
    await sesKilidiniAc(p2, `${link.pathname}${link.search}&device=${g.cihaz}`);
    const acilis = p2.getByRole('main', { name: 'Evde okuma yazma' });
    await expect(acilis).toBeVisible();
    await expect(acilis.locator('[data-veli-karti] [data-madde]')).toHaveCount(6);
    await expect(p2.getByRole('button', { name: 'Geri' })).toHaveCount(0);
    await expect(p2.getByRole('button', { name: 'Ana menü' })).toHaveCount(0);
    await geometriTemiz(p2, `${g.ad} ev açılışı`);
    await p2.waitForTimeout(400);
    await p2.getByRole('button', { name: 'Başla' }).click();
    await expect(p2.locator(`[data-set-sira="1/${setAdimlari.split(',').length}"]`)).toBeVisible();
    await p2.waitForTimeout(400);
    await p2.getByRole('button', { name: 'Ana menü' }).click();
    await expect(acilis).toBeVisible();
    await p2.waitForTimeout(400);
    await p2.getByRole('button', { name: 'Başla' }).click();
    await expect(p2.locator('[data-set-sira^="1/"]')).toBeVisible();
    await p2.waitForTimeout(400);
    await p2.getByRole('button', { name: 'Geri' }).click();
    await expect(acilis).toBeVisible();
    await expect(p2.getByRole('main', { name: 'Okuma Yazma', exact: true })).toHaveCount(0);
    const k = await p2.evaluate((a) => ({ hepsi: [...Object.keys(localStorage), ...Object.keys(sessionStorage)], sinif: localStorage.getItem(a) }), DERS_TUR_SINIF_ANAHTARI);
    expect(k.sinif).toBe(sinifDegeri);
    expect(k.hepsi.filter((a) => a !== 'tohum' && !IZINLI.has(a))).toEqual([]);
    await ev.close();
  }
});

test('bozuk eve link açıklama gösterir, öğretmen ekranı açılmaz', async ({ page }) => {
  await sesKilidiniAc(page, '/?ders=tur&ev=x9&tur=1kv&device=tablet');
  await expect(page.getByRole('main', { name: 'Bağlantı açılamadı' })).toBeVisible();
  await expect(page.getByRole('main', { name: 'Okuma Yazma', exact: true })).toHaveCount(0);
  await sesKilidiniAc(page, '/?ders=tur&ev=s3&device=tablet');
  await expect(page.getByRole('main', { name: 'Bağlantı açılamadı' })).toBeVisible();
});

test('Kaynaklar: program sürümü ve adresi, TemelYazi, özgün içerik, ses kaynağı', async ({ browser }, bilgi) => {
  for (const g of gorunumler(bilgi.project.name)) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    await sesKilidiniAc(page, `/?ders=tur&device=${g.cihaz}`);
    await page.getByRole('button', { name: 'Kaynaklar' }).click();
    const k = page.getByRole('main', { name: 'Kaynaklar (Okuma Yazma)' });
    await expect(k).toBeVisible();
    await expect(k.locator('[data-kaynak="program"]')).toContainText('tymm-turkce-2026-09-02');
    await expect(k.locator('[data-program-adresi]')).toContainText('https://tymm.meb.gov.tr/');
    await expect(k.locator('[data-kaynak="temelyazi"]')).toContainText('TemelYazi');
    await expect(k.locator('[data-kaynak="ozgun"]')).toContainText('özgün');
    await expect(k.locator('[data-kaynak="ses"]')).toContainText('henüz üretilmedi');
    await geometriTemiz(page, `${g.ad} Kaynaklar`);
    await page.getByRole('button', { name: 'Geri' }).click();
    await expect(page.getByRole('main', { name: 'Okuma Yazma' })).toBeVisible();
    await ctx.close();
  }
});
