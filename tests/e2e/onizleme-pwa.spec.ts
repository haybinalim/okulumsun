import { expect, test } from '@playwright/test';

/** Plan v2 Adım 26 (Adım 25'in kanıtı): üretim manifesti ve ikonları sunuluyor. */
test('manifest alanları doğru, ikonların hepsi 200', async ({ page, request, baseURL }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href, 'index.html manifest bağlantısı').toBeTruthy();
  const manifestUrl = new URL(href!, page.url()).href;

  const yanit = await request.get(manifestUrl);
  expect(yanit.status()).toBe(200);
  const m = (await yanit.json()) as {
    display: string;
    orientation: string;
    theme_color: string;
    start_url: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };
  expect(m.display).toBe('standalone');
  expect(m.orientation).toBe('any');
  expect(m.theme_color).toBe('#FFFDF8');
  expect(m.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(m.icons.some((i) => i.purpose === 'maskable')).toBe(true);

  for (const ikon of m.icons) {
    const r = await request.get(new URL(ikon.src, manifestUrl).href);
    expect(r.status(), ikon.src).toBe(200);
    expect(r.headers()['content-type']).toContain('image/png');
  }
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect((await request.get(new URL(apple!, baseURL ?? page.url()).href)).status()).toBe(200);
});
