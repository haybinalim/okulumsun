import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { TUR_URL } from '../../playwright.config';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';

/**
 * Okuma Yazma Adım 70 — parmakla izleme (M-4; K-6: hoşgörülü, puansız, P2), YALNIZ bayraklı derlemede (5174).
 *
 * Tahta 1920×1080, 1080×810 ve tablet: çizim alanı tahtada üst %35'in altında; doğru yönde izlenen hamle geçer,
 * ters yön ve uzak başlangıç geçmez; üç denemeden sonra hamle gösterilip geçilir; puan/yıldız/süre yok, ses istenmez;
 * çizim yalnız bellekte — Geri ile ekran değişip dönülünce çizim YOK; depolama boş.
 */
test.use({ baseURL: TUR_URL });

const veri = JSON.parse(readFileSync('ders-verisi/tur/hamleler.json', 'utf8')) as {
  glifler: { glif: string; bicim: string; genislik: number; hamleler: { noktalar: [number, number][] }[] }[];
};
const hamleler = (anahtar: string) => veri.glifler.find((g) => `${g.bicim}:${g.glif}` === anahtar)!.hamleler;

/** Glif koordinatındaki noktaları ekran koordinatına çevirip fareyle (işaretçi) çizer. */
async function ciz(page: Page, noktalar: readonly [number, number][]) {
  const ekran = await page.locator('[data-izleme-alani]').evaluate((svg, n) => {
    const s = svg as SVGSVGElement;
    const m = s.getScreenCTM()!;
    const dx = Number(s.querySelector('g[transform]')!.getAttribute('transform')!.match(/translate\(([-\d.]+)/)![1]);
    return n.map(([x, y]) => {
      const p = new DOMPoint(x + dx, y).matrixTransform(m);
      return [p.x, p.y] as [number, number];
    });
  }, noktalar as [number, number][]);
  await page.mouse.move(ekran[0][0], ekran[0][1]);
  await page.mouse.down();
  for (const [x, y] of ekran.slice(1)) await page.mouse.move(x, y, { steps: 2 });
  await page.mouse.up();
}

async function ac(page: Page, anahtar: string, cihaz: string) {
  await sesKilidiniAc(page, `/?ders=tur&izle=${anahtar}&device=${cihaz}`);
  await expect(page.locator(`main[data-izleme-glif="${anahtar}"]`)).toBeVisible();
}

const gorunumler = (proje: string) =>
  proje === 'board'
    ? ([
        { ad: 'tahta 1920×1080', w: 1920, h: 1080, cihaz: 'board' },
        { ad: 'tahta 1080×810', w: 1080, h: 810, cihaz: 'board' },
      ] as const)
    : ([{ ad: 'tablet 1080×810', w: 1080, h: 810, cihaz: 'tablet' }] as const);

test('izleme: geometri, doğru/ters yön, üç deneme, puan ve ses yok', async ({ browser }, bilgi) => {
  test.setTimeout(120_000);
  for (const g of gorunumler(bilgi.project.name)) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    await ac(page, 'kucuk:a', g.cihaz);
    await geometriTemiz(page, `izleme ${g.ad}`);
    const alan = await page.locator('[data-izleme-alani]').boundingBox();
    if (g.cihaz === 'board') expect(alan!.y, `${g.ad}: çizim alanı üst %35'in altında (D-24)`).toBeGreaterThanOrEqual(g.h * 0.35 - 1);
    const main = page.locator('main[data-izleme-glif]');
    const [daire, dik] = hamleler('kucuk:a');
    // Ters yön (daire saat yönüne): geçmez, aynı hamle, deneme 1.
    const ters: [number, number][] = [daire.noktalar[0], ...[...daire.noktalar.slice(1)].reverse()];
    await ciz(page, ters);
    await expect(main).toHaveAttribute('data-izleme-deneme', '1');
    await expect(main).toHaveAttribute('data-izleme-hamle', '1');
    await expect(main).toHaveAttribute('data-cizim-sayisi', '0'); // geçmeyen çizim silinir
    // Doğru: geçer, 2. hamleye geçilir; çocuğun çizimi kalır.
    await ciz(page, daire.noktalar);
    await expect(main).toHaveAttribute('data-izleme-hamle', '2');
    await expect(main).toHaveAttribute('data-cizim-sayisi', '1');
    // 2. hamle: üç kez uzaktan başla → gösterilir, geçilir, biter.
    const uzak = dik.noktalar.map(([x, y]) => [x + 25, y] as [number, number]);
    for (let i = 0; i < 3; i++) await ciz(page, uzak);
    await expect(main).toHaveAttribute('data-izleme-bitti', 'true');
    await expect(main).toHaveAttribute('data-izleme-biten', 'cizdi,gosterildi');
    // Puan, yıldız, süre yok; ses istenmez.
    const metin = (await main.textContent()) ?? '';
    expect(metin).not.toMatch(/puan|yıldız|saniye|süre|%/i);
    const klipler = await page.evaluate(() => [...(window.__okulumsunE2E?.istenenKlipler ?? [])]);
    expect(klipler.filter((k) => k.startsWith('tur.'))).toEqual([]);
    // Baştan: çizim silinir.
    await page.getByRole('button', { name: 'Baştan', exact: true }).click();
    await expect(main).toHaveAttribute('data-cizim-sayisi', '0');
    await expect(main).toHaveAttribute('data-izleme-hamle', '1');
    await ctx.close();
  }
});

test('izleme: çizim yalnız bellekte — ekran değişince silinir, hiçbir şey saklanmaz', async ({ page }, bilgi) => {
  test.setTimeout(60_000);
  const cihaz = bilgi.project.name === 'board' ? 'board' : 'tablet';
  await sesKilidiniAc(page, `/?ders=tur&device=${cihaz}`);
  await page.getByRole('button', { name: 'Harf ve rakam yazılışı' }).click();
  await page.getByRole('button', { name: 'Küçük a', exact: true }).click();
  await page.getByRole('button', { name: 'Parmakla izle', exact: true }).click();
  const main = page.locator('main[data-izleme-glif="kucuk:a"]');
  await expect(main).toBeVisible();
  await ciz(page, hamleler('kucuk:a')[0].noktalar);
  await expect(main).toHaveAttribute('data-cizim-sayisi', '1');
  await expect(page.locator('[data-cocuk-cizimi]')).toHaveCount(1);
  // Geri → yazılış gösterimi; yeniden izlemeye dönünce çizim yok, ilk hamleden başlar.
  await page.getByRole('button', { name: 'Geri', exact: true }).click();
  await expect(page.locator('main[data-yazilis-glif="kucuk:a"]')).toBeVisible();
  await expect(page.locator('[data-cocuk-cizimi]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Parmakla izle', exact: true }).click();
  await expect(main).toHaveAttribute('data-cizim-sayisi', '0');
  await expect(main).toHaveAttribute('data-izleme-hamle', '1');
  await expect(page.locator('[data-cocuk-cizimi]')).toHaveCount(0);
  // Depolama boş (öğrenci verisi yok).
  const depo = await page.evaluate(async () => ({
    yerel: Object.keys(localStorage).filter((k) => /tur|izle|cizim/i.test(k)),
    oturum: Object.keys(sessionStorage).filter((k) => /tur|izle|cizim/i.test(k)),
    idb: ((await indexedDB.databases?.()) ?? []).map((d) => d.name).filter((n) => n && /tur|izle|cizim/i.test(n)),
  }));
  expect(depo).toEqual({ yerel: [], oturum: [], idb: [] });
});

test('bayraksız (üretim) sunucuda ?izle= hiçbir şey açmaz', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'tablet', 'bir kez');
  await page.goto('http://localhost:5173/?ders=tur&izle=kucuk:a');
  await expect(page.locator('[data-izleme-glif]')).toHaveCount(0);
});
