import { expect, test, type Page } from '@playwright/test';

/**
 * KG-101: elle seçilen tahta profili + 1920×1080 olmayan ekran. Kişisel ana ekranda "Başla" (ve Keşif Masası)
 * konu kartlarının üstüne binmemeli. Hem `board` hem `tablet` projesinde koşar; görünüm boyutu test içinde verilir.
 * Ölçüt: alt düğmelerin sınır kutusu hiçbir konu kartıyla kesişmez ve düğmeler görünüm alanının içindedir.
 */
const EKRANLAR = [
  { width: 1080, height: 810 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
] as const;

interface Kutu {
  readonly ad: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

async function kutular(page: Page): Promise<{ kartlar: Kutu[]; dugmeler: Kutu[]; vh: number; vw: number }> {
  return page.evaluate(() => {
    const kutu = (e: Element, ad: string) => {
      const r = e.getBoundingClientRect();
      return { ad, x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const kartlar = [...document.querySelectorAll('[data-tema-kart]')].map((e) => kutu(e, e.querySelector('button')?.getAttribute('aria-label') ?? '?'));
    const dugmeler = [...document.querySelectorAll('[data-ana-ekran-alt] button')].map((e) =>
      kutu(e, e.getAttribute('aria-label') ?? e.textContent ?? '?'),
    );
    return { kartlar, dugmeler, vh: window.innerHeight, vw: window.innerWidth };
  });
}

const kesisir = (a: Kutu, b: Kutu): boolean =>
  a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;

for (const profil of ['board', 'tablet'] as const) {
  for (const ekran of EKRANLAR) {
    test(`kişisel ana ekran: ${profil} profili, ${ekran.width}×${ekran.height} — Başla kartlara binmez`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'board', 'Görünüm boyutu test içinde verilir; bir projede koşmak yeter.');
      await page.setViewportSize(ekran);
      await page.addInitScript((p) => window.localStorage.setItem('okulumsun.deviceOverride', p), profil);
      await page.goto('/');
      await page.getByRole('button', { name: 'Başla' }).click();
      await page.getByRole('button', { name: 'Kendi başıma çalışacağım.' }).click();
      await page.getByRole('button', { name: 'Kedi' }).click();
      await page.getByRole('button', { name: 'Renk mor' }).click();
      await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.dataset.device)).toBe(profil);
      await page.waitForTimeout(400); // kart giriş animasyonu

      const { kartlar, dugmeler, vh, vw } = await kutular(page);
      expect(kartlar.length).toBeGreaterThanOrEqual(7);
      expect(dugmeler.length).toBe(2);
      const cakisma = dugmeler.flatMap((d) => kartlar.filter((k) => kesisir(d, k)).map((k) => `${d.ad} ∩ ${k.ad}`));
      expect(cakisma, `çakışma: ${cakisma.join(', ')}`).toEqual([]);
      for (const d of dugmeler) {
        expect(d.y + d.h, `${d.ad} görünüm alanının altına taşıyor`).toBeLessThanOrEqual(vh + 0.5);
        expect(d.x + d.w).toBeLessThanOrEqual(vw + 0.5);
      }
      // Kartlar da görünüm içinde (kaydırma gerekmeden erişilir).
      for (const k of kartlar) expect(k.y + k.h, `${k.ad} görünüm dışında`).toBeLessThanOrEqual(vh + 0.5);
    });
  }
}
