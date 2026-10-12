import { expect, test } from '@playwright/test';

/**
 * Plan v2 Adım 22: üretim derlemesi, üretim güvenlik başlıklarıyla (vercel.json →
 * `vite preview`) açıldığında CSP ihlali olmamalı; font, ses ve service worker
 * politika altında çalışmalı. `E2E_HEDEF_URL` verilirse canlı/önizleme adresine koşar.
 */
const HEDEF = process.env.E2E_HEDEF_URL ?? 'http://localhost:4173/';

test('üretim başlıklarıyla CSP ihlali yok; font ve SW çalışıyor', async ({ page }) => {
  const ihlaller: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) ihlaller.push(m.text());
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) =>
      console.error(`Refused to load (CSP): ${e.violatedDirective} ${e.blockedURI}`),
    );
  });

  const yanit = await page.goto(`${HEDEF}?device=tablet`);
  const basliklar = yanit!.headers();
  expect(basliklar['content-security-policy']).toContain("connect-src 'self'");
  expect(basliklar['permissions-policy']).toContain('microphone=()');

  await page.getByRole('button', { name: 'Başla' }).click();
  await page.getByRole('button', { name: 'Kendi başıma çalışacağım.' }).click();

  const fontYuklu = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].some((f) => f.family.includes('Andika') && f.status === 'loaded');
  });
  expect(fontYuklu).toBe(true);

  const swHazir = await page.evaluate(async () => {
    const kayit = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((r) => setTimeout(() => r(null), 10_000)),
    ]);
    return kayit !== null;
  });
  expect(swHazir).toBe(true);

  // speech.ts klipleri fetch ile alır (sonra decodeAudioData) → connect-src 'self' altında izinli olmalı.
  // Çözme adımı sınanmaz: Playwright Chromium'da AAC kod çözücü yok (CSP ile ilgisiz).
  const sesBayt = await page.evaluate(async () => {
    const yanit = await fetch('./audio/adim/bir-adim.m4a');
    return yanit.ok ? (await yanit.arrayBuffer()).byteLength : 0;
  });
  expect(sesBayt).toBeGreaterThan(0);

  expect(ihlaller).toEqual([]);
});
