import { expect, test, type Page } from '@playwright/test';
import { DEAD_TOP_RATIO } from './yardimci/geometri';

/**
 * KG-129 YERLEŞTİRME (TAP_TO_PLACE) YERLEŞİMİ — tahta 1920×1080 ve 1080×810, tablet 1080×810. Önce: 1080×810
 * tahtada 2–5 parça kartı (320 px) iki satıra kırılıp üst %35'e taşıyor, ↻ ve Onayla ekran dışında kalıyordu;
 * tablette M-VERİ-SIKLIK (5 kart) Onayla'yı ekrandan itiyordu; yuvalar 56 × ölçek px (tahtada 90 < tap-min 102).
 * Denetim: her düğme pencerede; kartlar ≥ tap-min, tahtada üst %35'in altında, tek satırda; düğmeler birbiriyle
 * çakışmaz (yuvalar dahil); her yuva ≥ tap-min ve merkezine dokunulunca yuvanın kendisi yakalanır; Onayla görünür.
 * Yuvaların tahtada üst %35'te (sahnede) durması ayrı bir tasarım kararıdır — burada denetlenmez.
 */

const SORULAR = [
  { sablon: 'M-RITMIK', zorluk: 1 },
  { sablon: 'M-VERI-SIKLIK', zorluk: 2 },
  { sablon: 'M-ORUNTU-SEKIL', zorluk: 1 },
] as const;

interface Kutu {
  ad: string;
  x: number;
  y: number;
  w: number;
  h: number;
  yakalanan: boolean;
}

async function olc(page: Page): Promise<{ vw: number; vh: number; tapMin: number; kutular: Kutu[] }> {
  return page.evaluate(() => {
    const kutular = [...document.querySelectorAll('button')]
      .filter((b) => !b.closest('[data-harness]'))
      .map((b) => {
        const r = b.getBoundingClientRect();
        const ust = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          ad: b.getAttribute('aria-label') ?? b.textContent?.trim() ?? '',
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
          yakalanan: !!ust && (ust === b || b.contains(ust)),
        };
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

async function denetle(page: Page, ekran: string, cihaz: string): Promise<void> {
  const { vw, vh, tapMin, kutular } = await olc(page);
  for (const k of kutular)
    expect(k.x >= -1 && k.y >= -1 && k.x + k.w <= vw + 1 && k.y + k.h <= vh + 1, `${ekran}: "${k.ad}" pencere dışında (${JSON.stringify(k)})`).toBe(true);
  const kartlar = kutular.filter((k) => k.ad.startsWith('Seçenek'));
  const yuvalar = kutular.filter((k) => k.ad.startsWith('boşluk'));
  expect(kartlar.length, `${ekran}: kart`).toBeGreaterThan(1);
  expect(yuvalar.length, `${ekran}: yuva`).toBeGreaterThan(0);
  for (const k of kartlar) {
    expect(Math.min(k.w, k.h), `${ekran}: "${k.ad}" ≥ tap-min`).toBeGreaterThanOrEqual(tapMin - 1);
    if (cihaz === 'board') expect(k.y + k.h / 2, `${ekran}: "${k.ad}" üst %35'te`).toBeGreaterThanOrEqual(vh * DEAD_TOP_RATIO);
  }
  const satirlar = new Set(kartlar.map((k) => Math.round(k.y)));
  expect(satirlar.size, `${ekran}: kartlar tek satırda`).toBe(1);
  for (const y of yuvalar) {
    expect(Math.min(y.w, y.h), `${ekran}: "${y.ad}" ≥ tap-min`).toBeGreaterThanOrEqual(tapMin - 1);
    expect(y.yakalanan, `${ekran}: "${y.ad}" merkezi başka öğenin altında`).toBe(true);
  }
  for (let i = 0; i < kutular.length; i++)
    for (let j = i + 1; j < kutular.length; j++)
      expect(kesisir(kutular[i], kutular[j]), `${ekran}: "${kutular[i].ad}" × "${kutular[j].ad}" çakışıyor`).toBe(false);
  await expect(page.getByRole('button', { name: 'Onayla' })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('button', { name: 'Tekrar dinle', exact: true })).toBeInViewport({ ratio: 1 });
}

for (const soru of SORULAR) {
  test(`KG-129 ${soru.sablon}: parça kartları tek satır ekranda, yuvalar ≥ tap-min, ↻/Onayla ile çakışma yok`, async ({ page }, info) => {
    const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?gelistirme=soru&sablon=${soru.sablon}&tohum=1&zorluk=${soru.zorluk}&device=${cihaz}`);
    await page.getByRole('button', { name: 'Sesi aç' }).click();
    await expect(page.getByRole('button', { name: 'Tekrar dinle', exact: true })).toBeVisible();
    const ad = `${soru.sablon} ${cihaz} ${page.viewportSize()!.width}×${page.viewportSize()!.height}`;
    await denetle(page, ad, cihaz);
    if (cihaz !== 'board') return;
    await page.setViewportSize({ width: 1080, height: 810 });
    await expect.poll(() => page.evaluate(() => innerHeight)).toBe(810);
    await expect(async () => denetle(page, `${soru.sablon} board 1080×810`, cihaz)).toPass({ timeout: 5_000 });
    // Küçük tahtada da yerleştirme çalışır: kart seç → ilk yuvaya dokun → kart kullanılmış (soluk) olur.
    const kart = page.getByRole('button', { name: /^Seçenek/ }).first();
    await kart.click();
    await page.getByRole('button', { name: /^boşluk/ }).first().click();
    await expect(page.getByRole('button', { name: /^boşluk/ }).first()).toBeDisabled();
  });
}
