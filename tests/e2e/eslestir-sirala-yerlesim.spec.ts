import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz } from './yardimci/akis';
import { DEAD_TOP_RATIO } from './yardimci/geometri';

/**
 * KG-128 EŞLEŞTİRME (MATCH_PAIRS) VE SIRALAMA (SEQUENCE_ORDER) YERLEŞİMİ — tahta 1920×1080 ve 1080×810, tablet
 * 1080×810. Önce: M-GEO-EŞLE (3 + 5) ve M-TERS-İŞLEM (3 + 3) kartları iki sütunda 1920 tahtada bile üst %35'e ve
 * ekranın üstüne/altına taşıyor, soru hoparlörünün üstüne biniyordu; M-PARA-SIRALA (5 banknot) 1080×810 tahtada
 * iki satıra kırılıp üst %35'e taşıyor, Onayla ekran dışında kalıyordu. Denetim: her düğme pencerede, geometri
 * temiz (üst %35 — yalnız yedek hoparlör muaf —, ≥ tap-min, ↻ eşi), hoparlör hiçbir düğmeyle çakışmaz, kartlar
 * birbiriyle çakışmaz, Onayla görünür. Geliştirme önizlemesi `?gelistirme=soru` (yalnız dev sunucu).
 */

const EKRAN_KLASORU = process.env.KG128_EKRAN_KLASORU;

const SORULAR = [
  { sablon: 'M-GEO-ESLE', zorluk: 3, tur: 'eslestir', adet: 8 },
  { sablon: 'M-TERS-ISLEM', zorluk: 3, tur: 'eslestir', adet: 6 },
  { sablon: 'M-PARA-SIRALA', zorluk: 3, tur: 'sirala', adet: 5 },
  { sablon: 'M-YONERGE', zorluk: 5, tur: 'sirala', adet: 4 },
] as const;

async function ac(page: Page, sablon: string, zorluk: number, cihaz: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/?gelistirme=soru&sablon=${sablon}&tohum=1&zorluk=${zorluk}&device=${cihaz}`);
  await page.getByRole('button', { name: 'Sesi aç' }).click();
  await expect(page.getByRole('button', { name: 'Tekrar dinle', exact: true })).toBeVisible();
}

interface Kutu {
  ad: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
async function dugmeler(page: Page): Promise<{ vw: number; vh: number; tapMin: number; kutular: Kutu[] }> {
  return page.evaluate(() => {
    const kutular = [...document.querySelectorAll('button')]
      .filter((b) => !b.closest('[data-harness]'))
      .map((b) => {
        const r = b.getBoundingClientRect();
        return { ad: b.getAttribute('aria-label') ?? '', x: r.x, y: r.y, w: r.width, h: r.height };
      })
      .filter((k) => k.w > 0 && k.h > 0);
    return {
      vw: innerWidth,
      vh: innerHeight,
      tapMin: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-tap-min')),
      kutular,
    };
  });
}

const kesisir = (a: Kutu, b: Kutu, tol = 1): boolean =>
  a.x + a.w - tol > b.x && b.x + b.w - tol > a.x && a.y + a.h - tol > b.y && b.y + b.h - tol > a.y;

async function denetle(page: Page, ekran: string, soru: (typeof SORULAR)[number], cihaz: string): Promise<void> {
  await geometriTemiz(page, ekran);
  const { vw, vh, tapMin, kutular } = await dugmeler(page);
  for (const k of kutular) {
    expect(k.x >= -1 && k.y >= -1 && k.x + k.w <= vw + 1 && k.y + k.h <= vh + 1, `${ekran}: "${k.ad}" pencere dışında (${JSON.stringify(k)})`).toBe(
      true,
    );
  }
  const kartlar = kutular.filter((k) => k.ad.startsWith('Seçenek'));
  expect(kartlar, `${ekran}: kart sayısı`).toHaveLength(soru.adet);
  for (const k of kartlar) {
    expect(Math.min(k.w, k.h), `${ekran}: "${k.ad}" ≥ tap-min`).toBeGreaterThanOrEqual(tapMin - 1);
    if (cihaz === 'board') expect(k.y + k.h / 2, `${ekran}: "${k.ad}" üst %35'te`).toBeGreaterThanOrEqual(vh * DEAD_TOP_RATIO);
  }
  for (let i = 0; i < kutular.length; i++)
    for (let j = i + 1; j < kutular.length; j++)
      expect(kesisir(kutular[i], kutular[j]), `${ekran}: "${kutular[i].ad}" × "${kutular[j].ad}" çakışıyor`).toBe(false);
  const hoparlor = kutular.find((k) => k.ad === 'Soruyu tekrar dinle');
  if (soru.sablon !== 'M-YONERGE') expect(hoparlor, `${ekran}: soru hoparlörü`).toBeTruthy();
  if (soru.tur === 'sirala') await expect(page.getByRole('button', { name: 'Onayla' })).toBeInViewport({ ratio: 1 });
}

for (const soru of SORULAR) {
  test(`KG-128 ${soru.sablon}: kartlar ekranda, üst %35'in altında, hoparlörle çakışmıyor`, async ({ page }, info) => {
    const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
    await ac(page, soru.sablon, soru.zorluk, cihaz);
    const ad = `${soru.sablon} ${cihaz} ${page.viewportSize()!.width}×${page.viewportSize()!.height}`;
    await denetle(page, ad, soru, cihaz);
    if (EKRAN_KLASORU) await page.screenshot({ path: `${EKRAN_KLASORU}/${soru.sablon}-${cihaz}-${page.viewportSize()!.width}.png` });
    if (cihaz !== 'board') return;
    // Elle seçilen küçük tahta (1080×810): yerleşim ölçüme bağlı, yeniden boyutlanınca oturur.
    await page.setViewportSize({ width: 1080, height: 810 });
    await expect.poll(() => page.evaluate(() => innerHeight)).toBe(810);
    await expect(async () => denetle(page, `${soru.sablon} board 1080×810`, soru, cihaz)).toPass({ timeout: 5_000 });
    if (EKRAN_KLASORU) await page.screenshot({ path: `${EKRAN_KLASORU}/${soru.sablon}-board-1080.png` });
  });
}
