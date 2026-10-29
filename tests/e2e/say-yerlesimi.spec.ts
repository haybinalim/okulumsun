import { expect, test, type Page } from '@playwright/test';
import { geometriIhlalleri } from './yardimci/geometri';

/**
 * Plan v2 KG-86: M-SAY (TapCountScreen) yerleşimi tahta ve tablet profillerinde.
 * Geliştirme önizlemesi (`?gelistirme=say`, yalnız dev sunucu) belirli adet/yerleşimi açar. Denetlenenler:
 * nesneler ≥ `--size-tap-min` (tahta 102, büyük hedefte 118 px) ve çakışmıyor; hiçbir dokunulabilir öğe
 * üst %35'e taşmıyor (tahtada kutunun üst kenarı da), hepsi pencerede; nesneler kartlar/çubukla çakışmıyor.
 */

const DURUMLAR = [
  { adet: 1, yerlesim: 'sira' },
  { adet: 6, yerlesim: 'sira' },
  { adet: 10, yerlesim: 'gruplu' },
  { adet: 10, yerlesim: 'onlukCerceve' },
  { adet: 20, yerlesim: 'onlukCerceve' },
  { adet: 16, yerlesim: 'dagınık' },
] as const;

interface Olcum {
  tapMin: number;
  nesneler: { x: number; y: number; w: number; h: number }[];
  digerleri: { ad: string; x: number; y: number; w: number; h: number }[];
}

async function olc(page: Page): Promise<Olcum> {
  return page.evaluate(() => {
    const kutu = (e: Element) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const tum = [...document.querySelectorAll('button')];
    return {
      tapMin: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-tap-min')),
      nesneler: tum.filter((b) => b.getAttribute('aria-label')?.startsWith('nesne ')).map(kutu),
      digerleri: tum
        .filter((b) => !b.getAttribute('aria-label')?.startsWith('nesne '))
        .map((b) => ({ ad: b.getAttribute('aria-label') ?? '', ...kutu(b) })),
    };
  });
}

const kesisir = (a: Olcum['nesneler'][number], b: Olcum['nesneler'][number], tol = 1): boolean =>
  a.x + a.w - tol > b.x && b.x + b.w - tol > a.x && a.y + a.h - tol > b.y && b.y + b.h - tol > a.y;

/** Yerleşim oturunca: nesneler ≥ tapMin, çakışmasız; hiçbir düğme üst %35'te ya da pencere dışında; geometri temiz. */
async function denetle(page: Page, cihaz: string, adet: number, beklenenTap: number): Promise<void> {
  // Yerleşim oturana kadar bekle (profil değişkenleri ve ölçüm aynı karede olmayabilir).
  let onceki = '';
  await expect
    .poll(async () => {
      const simdi = JSON.stringify(await olc(page));
      const sabit = simdi === onceki;
      onceki = simdi;
      return sabit;
    })
    .toBe(true);
  const o = await olc(page);
  expect(Math.round(o.tapMin)).toBe(beklenenTap);
  expect(o.nesneler).toHaveLength(adet);

  for (const [i, n] of o.nesneler.entries()) {
    expect(n.w, `nesne ${i + 1} genişlik`).toBeGreaterThanOrEqual(o.tapMin - 1);
    expect(n.h, `nesne ${i + 1} yükseklik`).toBeGreaterThanOrEqual(o.tapMin - 1);
    for (const [j, m] of o.nesneler.entries()) {
      if (j > i) expect(kesisir(n, m), `nesne ${i + 1} ↔ nesne ${j + 1} çakışıyor`).toBe(false);
    }
    for (const d of o.digerleri) expect(kesisir(n, d), `nesne ${i + 1} ↔ ${d.ad} çakışıyor`).toBe(false);
  }

  const { pencereH, pencereW } = await page.evaluate(() => ({ pencereH: innerHeight, pencereW: innerWidth }));
  for (const b of [...o.nesneler.map((n, i) => ({ ad: `nesne ${i + 1}`, ...n })), ...o.digerleri]) {
    // Tahtada kutunun ÜST kenarı da ölü bölgenin altında (kart/Onayla üst %35'e taşmaz); hepsi pencerede.
    if (cihaz === 'board') expect(b.y, `${b.ad} üst %35'e taşıyor`).toBeGreaterThanOrEqual(pencereH * 0.35 - 1);
    expect(b.y + b.h, `${b.ad} alttan taşıyor`).toBeLessThanOrEqual(pencereH + 1);
    expect(b.x, `${b.ad} soldan taşıyor`).toBeGreaterThanOrEqual(-1);
    expect(b.x + b.w, `${b.ad} sağdan taşıyor`).toBeLessThanOrEqual(pencereW + 1);
  }
  expect(await geometriIhlalleri(page)).toBe('');
  // KG-130: kartlar, ↻ ve Onayla da birbiriyle çakışmaz.
  for (const [i, a] of o.digerleri.entries())
    for (const b of o.digerleri.slice(i + 1)) expect(kesisir(a, b), `${a.ad} ↔ ${b.ad} çakışıyor`).toBe(false);
}

for (const buyukHedef of [false, true]) {
  for (const { adet, yerlesim } of DURUMLAR) {
    test(`M-SAY yerleşimi: ${adet} nesne, ${yerlesim}${buyukHedef ? ', büyük hedef' : ''}`, async ({ page }, info) => {
      const cihaz = info.project.name === 'board' ? 'board' : 'tablet';
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(
        `/?gelistirme=say&device=${cihaz}&adet=${adet}&yerlesim=${encodeURIComponent(yerlesim)}${buyukHedef ? '#ayar=1.b' : ''}`,
      );
      await expect(page.getByRole('button', { name: `nesne ${adet}`, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Onayla' })).toBeVisible();
      const beklenenTap = cihaz === 'board' ? (buyukHedef ? 118 : 102) : buyukHedef ? 74 : 64;
      await denetle(page, cihaz, adet, beklenenTap);

      if (process.env.SAY_EKRAN_GORUNTUSU)
        await page.screenshot({
          path: `${process.env.SAY_EKRAN_GORUNTUSU}/${cihaz}-${adet}-${yerlesim}${buyukHedef ? '-b' : ''}.png`,
        });

      // Davranış: her nesneye bir kez dokunulur, sayaç ilerler; şık + Onayla erişilebilir.
      await page.getByRole('button', { name: 'nesne 1', exact: true }).click();
      await expect(page.getByText('📋 1')).toBeVisible();
    });
  }
}

/**
 * KG-130: elle seçilen küçük tahta (1080×810). Önce alan 1004 × 409, kart 240 px: sahne yüksekliği 0 (nesne yok),
 * kartlar ↻ ve Onayla'nın üstüne biniyordu. Şimdi kart küçülür ya da çubuğun iki yanına geçer; 1–8 nesne tam sığar.
 */
for (const { adet, yerlesim } of [
  { adet: 3, yerlesim: 'sira' },
  { adet: 6, yerlesim: 'sira' },
  { adet: 8, yerlesim: 'gruplu' },
  { adet: 8, yerlesim: 'dagınık' },
] as const) {
  test(`KG-130 M-SAY 1080×810 tahta: ${adet} nesne, ${yerlesim} — nesneler ekranda, kartlar ↻/Onayla ile çakışmaz`, async ({ page }, info) => {
    test.skip(info.project.name !== 'board', 'yalnız tahta profili');
    await page.setViewportSize({ width: 1080, height: 810 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?gelistirme=say&device=board&adet=${adet}&yerlesim=${encodeURIComponent(yerlesim)}`);
    await expect(page.getByRole('button', { name: `nesne ${adet}`, exact: true })).toBeVisible();
    await denetle(page, 'board', adet, 102);
    if (process.env.SAY_EKRAN_GORUNTUSU)
      await page.screenshot({ path: `${process.env.SAY_EKRAN_GORUNTUSU}/board1080-${adet}-${yerlesim}.png` });
    await page.getByRole('button', { name: 'nesne 1', exact: true }).click();
    await expect(page.getByText('📋 1')).toBeVisible();
  });
}

/**
 * KG-131 (kullanıcı kararı 2026-10-30): 1080×810 elle seçilen tahtada zorluk 4–5'in 10–20 nesnesi sığmaz; ölçülen
 * yerleşim taşıyamayınca soru zorluk 3'te (6–10 nesne) gösterilir — nesneler çakışmasız ve pencerede.
 * 1920 tahta aynı istekte zorluk 4–5 sayılarını göstermeyi sürdürür.
 */
const ADET_ARALIGI: Record<number, [number, number]> = { 3: [6, 10], 4: [10, 15], 5: [14, 20] };
for (const zorluk of [4, 5] as const) {
  for (const tohum of [1, 2, 3]) {
    test(`KG-131 M-SAY zorluk ${zorluk} tohum ${tohum}: 1080×810 tahtada zorluk 3, 1920 tahtada zorluk ${zorluk}`, async ({ page }, info) => {
      test.skip(info.project.name !== 'board', 'yalnız tahta profili');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const [w, h, beklenen] of [
        [1080, 810, 3],
        [1920, 1080, zorluk],
      ] as const) {
        await page.setViewportSize({ width: w, height: h });
        await page.goto(`/?gelistirme=soru&sablon=M-SAY&tohum=${tohum}&zorluk=${zorluk}&device=board&mod=tahta`);
        await page.getByRole('button', { name: 'Sesi aç' }).click();
        await expect(page.locator(`[data-say-zorluk="${beklenen}"]`)).toBeVisible();
        await expect(page.getByRole('button', { name: 'nesne 1', exact: true })).toBeVisible();
        const adet = await page.locator('button[aria-label^="nesne "]').count();
        const [lo, hi] = ADET_ARALIGI[beklenen];
        expect(adet, `${w}×${h} nesne sayısı`).toBeGreaterThanOrEqual(lo);
        expect(adet, `${w}×${h} nesne sayısı`).toBeLessThanOrEqual(hi);
        await denetle(page, 'board', adet, 102);
        if (process.env.SAY_EKRAN_GORUNTUSU)
          await page.screenshot({ path: `${process.env.SAY_EKRAN_GORUNTUSU}/kg131-${w}-z${zorluk}-t${tohum}.png` });
      }
    });
  }
}
