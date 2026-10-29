import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, klipIstendi } from './yardimci/akis';
import { DEAD_TOP_RATIO } from './yardimci/geometri';

/**
 * KG-127 SORU HOPARLÖRÜ. Soru yalnız sesten ibaretse (uyaran alanı boş) üst alanda büyük bir hoparlör durur;
 * dokununca ekranın sorusu yeniden istenir (`alinanKlipler`; Chromium AAC çözemez, alım ölçülür). ↻ "Tekrar dinle"
 * alt çubukta kalır. Geliştirme önizlemesi `?gelistirme=soru` (yalnız dev sunucu) tek şablon sorusunu açar.
 * Tahtada 1920×1080 ve 1080×810, tablette 1080×810: hoparlör görünür, ≥ `--size-tap-min`, pencerede, merkezi üst
 * %35'te (yedek hedef), alt çubukla/kartlarla çakışmaz; geometri yardımcısı ↻'nin erişilebilir eşini de ister.
 */

/** AUDIO_TO_IMAGE, uyaran alanı boş. */
const SESLI = [
  'M-PARA-TANI',
  'M-RAKAM-TANI',
  'M-GEO-ADLANDIR',
  'M-KONUM',
  'M-TAHMIN-ISLEM',
  'M-KARSILASTIR', // tohum 1: "Hangisi çok?" (görselsiz)
] as const;
/**
 * SEQUENCE_ORDER / MATCH_PAIRS, uyaran alanı boş: hoparlör var. Bu ekranların kartları tahtada ÖNCEDEN de
 * üst %35'e taşıyor (MATCH_PAIRS 1920'de, SEQUENCE_ORDER 1080×810'da; KG-127 notu, ayrı iş) — burada yalnız
 * hoparlörün kendisi denetlenir.
 */
const SESLI_DIGER = ['M-PARA-SIRALA', 'M-TERS-ISLEM', 'M-GEO-ESLE'] as const;

const HOPARLOR = 'Soruyu tekrar dinle';
const EKRAN_KLASORU = process.env.HOPARLOR_EKRAN_KLASORU;

async function ac(page: Page, sablon: string, cihaz: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/?gelistirme=soru&sablon=${sablon}&tohum=1&zorluk=3&device=${cihaz}`);
  await page.getByRole('button', { name: 'Sesi aç' }).click();
  await expect(page.getByRole('button', { name: HOPARLOR, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tekrar dinle', exact: true })).toBeVisible();
}

interface Kutu {
  x: number;
  y: number;
  w: number;
  h: number;
}
async function olc(page: Page): Promise<{ tapMin: number; vh: number; vw: number; hop: Kutu; digerleri: (Kutu & { ad: string })[] }> {
  return page.evaluate((ad) => {
    const kutu = (e: Element) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const tum = [...document.querySelectorAll('button')];
    return {
      tapMin: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-tap-min')),
      vh: window.innerHeight,
      vw: window.innerWidth,
      hop: kutu(tum.find((b) => b.getAttribute('aria-label') === ad)!),
      digerleri: tum.filter((b) => b.getAttribute('aria-label') !== ad).map((b) => ({ ad: b.getAttribute('aria-label') ?? '', ...kutu(b) })),
    };
  }, HOPARLOR);
}

const kesisir = (a: Kutu, b: Kutu, tol = 1): boolean =>
  a.x + a.w - tol > b.x && b.x + b.w - tol > a.x && a.y + a.h - tol > b.y && b.y + b.h - tol > a.y;

async function yerlesimDenetle(page: Page, ekran: string, cihaz: string): Promise<void> {
  await geometriTemiz(page, ekran);
  const o = await olc(page);
  const { hop } = o;
  expect(hop.w, `${ekran}: hoparlör ≥ tap-min`).toBeGreaterThanOrEqual(o.tapMin - 1);
  expect(Math.abs(hop.w - hop.h), `${ekran}: daire`).toBeLessThanOrEqual(1);
  expect(hop.x >= 0 && hop.y >= 0 && hop.x + hop.w <= o.vw && hop.y + hop.h <= o.vh, `${ekran}: pencerede`).toBe(true);
  if (cihaz === 'board') expect(hop.y + hop.h / 2, `${ekran}: üst %35 uyaran alanında`).toBeLessThan(o.vh * DEAD_TOP_RATIO);
  for (const d of o.digerleri) expect(kesisir(hop, d), `${ekran}: hoparlör "${d.ad}" ile çakışıyor`).toBe(false);
}

for (const sablon of SESLI) {
  test(`soru hoparlörü: ${sablon} — görünür, yerleşim temiz`, async ({ page }, info) => {
    const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
    await ac(page, sablon, cihaz);
    await yerlesimDenetle(page, `${sablon} (${cihaz})`, cihaz);
  });
}

for (const sablon of SESLI_DIGER) {
  test(`soru hoparlörü: ${sablon} — görünür, boyutu yeterli`, async ({ page }, info) => {
    const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
    await ac(page, sablon, cihaz);
    const o = await olc(page);
    expect(o.hop.w).toBeGreaterThanOrEqual(o.tapMin - 1);
    expect(o.hop.y >= 0 && o.hop.y + o.hop.h <= o.vh).toBe(true);
  });
}

test('soru hoparlörü: sahneli soruda (M-TOPLA-GORSEL) yok, ↻ var', async ({ page }, info) => {
  const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
  await page.goto(`/?gelistirme=soru&sablon=M-TOPLA-GORSEL&tohum=1&zorluk=2&device=${cihaz}`);
  await page.getByRole('button', { name: 'Sesi aç' }).click();
  await expect(page.getByRole('button', { name: 'Tekrar dinle', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: HOPARLOR, exact: true })).toHaveCount(0);
});

test('soru hoparlörü: dokununca para sorusu ("… lira") yeniden istenir — şıkka dokunduktan sonra da', async ({ page }, info) => {
  const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
  await ac(page, 'M-PARA-TANI', cihaz);
  // Açılış talimatı (sayi.N + para.lira) alındı; liste boşaltılır, dokunuşun isteği ayrıca görülsün.
  await klipIstendi(page, 'para.lira');
  // Çocuk bir banknota dokunur (şıkkın adı söylenir) — hoparlör yine SORUYU çalmalı.
  await page.locator('main section').last().getByRole('button').first().click();
  await page.waitForTimeout(400);
  const soruSayisi = await page.evaluate(() => {
    const k = window.__okulumsunE2E!;
    k.alinanKlipler.length = 0;
    return 0;
  });
  expect(soruSayisi).toBe(0);
  await page.getByRole('button', { name: HOPARLOR, exact: true }).click();
  await klipIstendi(page, 'para.lira');
  // Soru = tohum 1'in hedefi (sayi.100 + para.lira); sadece şık adı değil.
  await klipIstendi(page, 'sayi.100');
});

test('soru hoparlörü: tahta 1080×810 geometrisi + ekran görüntüleri', async ({ page }, info) => {
  test.skip(info.project.name !== 'board', 'yalnız tahta profili');
  await ac(page, 'M-PARA-TANI', 'board');
  await yerlesimDenetle(page, 'M-PARA-TANI 1920×1080', 'board');
  if (EKRAN_KLASORU) await page.screenshot({ path: `${EKRAN_KLASORU}/tahta-1920.png` });
  await page.setViewportSize({ width: 1080, height: 810 });
  await expect.poll(async () => (await olc(page)).vh).toBe(810);
  // Kart boyu ResizeObserver ile yeniden ölçülür; sıkışık düzen oturana dek bekle (CI'da bir kare geç gelebilir).
  await expect(page.locator('[data-secenekler][data-sikisik]')).toBeVisible();
  await yerlesimDenetle(page, 'M-PARA-TANI 1080×810', 'board');
  for (const sablon of ['M-GEO-ADLANDIR', 'M-KONUM', 'M-RAKAM-TANI', 'M-TAHMIN-ISLEM', 'M-KARSILASTIR'] as const) {
    await ac(page, sablon, 'board');
    await expect(page.locator('[data-secenekler][data-sikisik]')).toBeVisible();
    await yerlesimDenetle(page, `${sablon} 1080×810`, 'board');
  }
  if (EKRAN_KLASORU) {
    await ac(page, 'M-PARA-TANI', 'board');
    await page.screenshot({ path: `${EKRAN_KLASORU}/tahta-1080.png` });
  }
});
