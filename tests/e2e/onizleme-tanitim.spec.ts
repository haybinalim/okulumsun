import { expect, test } from '@playwright/test';
const ONIZLEME_URL = process.env.E2E_HEDEF_URL ?? 'http://localhost:4173/';

/**
 * Plan v2 Adım 38 aşama 2 (KG-52): /ogretmen/ statik tanıtım sayfası üretim derlemesinde (vercel.json başlıklarıyla)
 * açılır; yalnız aynı kökenden kaynak yükler, çerez yazmaz, CSP ihlali yok, uygulamaya bağlantı çalışır.
 */
test('öğretmen sayfası: aynı köken, çerez yok, CSP temiz, uygulamaya bağlantı', async ({ page, context }) => {
  const koken = new URL(ONIZLEME_URL).origin;
  const istekler: string[] = [];
  const ihlaller: string[] = [];
  page.on('request', (r) => istekler.push(r.url()));
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) ihlaller.push(m.text());
  });

  const yanit = await page.goto(new URL('ogretmen/', ONIZLEME_URL).href);
  expect(yanit!.status()).toBe(200);
  expect(yanit!.headers()['content-security-policy']).toContain("default-src 'self'");
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    '1. sınıf matematik — akıllı tahta için, hesapsız ve ücretsiz',
  );
  await expect(page.getByRole('heading', { name: 'Veri almıyoruz' })).toBeVisible();
  const fontYuklu = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].some((f) => f.family.includes('Andika') && f.status === 'loaded');
  });
  expect(fontYuklu).toBe(true);

  expect(istekler.filter((u) => !u.startsWith('data:') && new URL(u).origin !== koken)).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(ihlaller).toEqual([]);

  await page.getByRole('link', { name: 'Uygulamayı aç' }).click();
  await expect(page.getByRole('button', { name: 'Başla' })).toBeVisible();
});
