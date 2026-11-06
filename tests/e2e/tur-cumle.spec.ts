import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { TUR_URL } from '../../playwright.config';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';
import { kumeKodla, resmiKume } from '../../src/content/dersler/tur/ogretilenKume';

/**
 * Okuma Yazma Adım 74 — cümle şablonları (T-10, T-11, T-12) ve koro okuma (M-3), YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`, port 5174).
 * Cümle parçası (`turCumle-*.js`, KG-156) yalnız cümle şablonu açılınca indirilir. Her şablon üç görünümde açılır ve
 * çözülür: geometri temiz; okuma hedefli (açılışta yalnız yönerge, D-12); kartlar sessiz (D-11); doğru cevaptan sonra
 * övgü + cümle klibi; cümle tek satırda (D-22).
 */
test.use({ baseURL: TUR_URL });

/** 5. grup dahil bütün harfler, büyükleriyle. */
const HEPSI = kumeKodla(resmiKume('j', true));
/** Cümle parçası: üretim derlemesinde `assets/turCumle-*.js`, geliştirme sunucusunda (CI) kaynak modül. */
const CUMLE_PARCASI = /\/assets\/turCumle-[^/]+\.js$|\/sablonlar\/cumle\/turCumle\.ts(\?|$)/;
/** Koro okuma parçası: üretim derlemesinde `assets/KoroOkuma-*.js`, geliştirme sunucusunda kaynak modül. */
const KORO_PARCASI = /\/assets\/KoroOkuma-[^/]+\.js$|\/ui\/tur\/cumle\/KoroOkuma\.tsx(\?|$)/;
const manifest = new Set(
  (JSON.parse(readFileSync('ders-verisi/tur/ses/klipler.json', 'utf8')) as { klipler: { anahtar: string }[] }).klipler.map((k) => k.anahtar),
);

const gorunumler = (proje: string) =>
  proje === 'board'
    ? ([
        { ad: 'tahta 1920×1080', w: 1920, h: 1080, cihaz: 'board' },
        { ad: 'tahta 1080×810', w: 1080, h: 810, cihaz: 'board' },
      ] as const)
    : ([{ ad: 'tablet 1080×810', w: 1080, h: 810, cihaz: 'tablet' }] as const);

async function klipler(page: Page): Promise<string[]> {
  const hepsi = await page.evaluate(() => [...(window.__okulumsunE2E?.istenenKlipler ?? [])]);
  return hepsi.filter((k) => k.startsWith('tur.'));
}

export const CUMLE_SABLONLARI = ['T-10', 'T-11', 'T-12'] as const;

for (const sablon of CUMLE_SABLONLARI) {
  test(`${sablon}: cümle parçası yüklenir, üç görünümde geometri temiz, okuma hedefli, çözülür`, async ({ browser }, bilgi) => {
    test.setTimeout(150_000);
    for (const g of gorunumler(bilgi.project.name)) {
      const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
      const page = await ctx.newPage();
      const parcalar: string[] = [];
      page.on('request', (r) => {
        if (CUMLE_PARCASI.test(r.url())) parcalar.push(r.url());
      });
      for (const zorluk of [1, 3, 5]) {
        const baglam = `${sablon} z${zorluk} ${g.ad}`;
        await sesKilidiniAc(page, `/?ders=tur&etkinlik=${sablon}&zorluk=${zorluk}&tohum=2&device=${g.cihaz}&tur=${HEPSI}`);
        const main = page.locator(`main[data-tur-etkinlik="${sablon}"]`);
        await expect(main).toBeVisible();
        await expect(page.locator('[data-kartlar][data-satir]')).toBeVisible();
        await geometriTemiz(page, baglam);
        const acilis = await klipler(page);
        expect(acilis, `${baglam}: okuma sorusunda yalnız yönerge (D-12)`).toHaveLength(1);
        expect(acilis[0], `${baglam}: okuma sorusunda yalnız yönerge (D-12)`).toMatch(
          new RegExp(`^tur\\.yonerge\\.${sablon.replace('-', '').toLowerCase()}(-ozel)?$`),
        );
        // T-12: üstte uyaran yok; her cümle kartı tek satırda.
        if (sablon === 'T-12') {
          for (const kart of await page.locator('[data-kart]').all()) {
            const n = await kart.evaluate((e) => {
              const r = document.createRange();
              r.selectNodeContents(e);
              return new Set([...r.getClientRects()].filter((x) => x.width > 1).map((x) => Math.round(x.top))).size;
            });
            expect(n, `${baglam}: cümle kartı tek satır`).toBe(1);
          }
        }
        // Cümle tek satırda (sözcük bölünmez, D-22).
        const model = page.locator('[data-uyaran-metni="model"]');
        if (sablon !== 'T-12') await expect(model).toBeVisible();
        const satir = sablon === 'T-12' ? 1 : await model.evaluate((e) => {
          // T-11: cümle metni ilk çocukta, yanında boş yuva kutusu (satır sayımına girmez).
          const metin = e.hasAttribute('data-noktalama-yuvasi') ? e.firstElementChild! : e;
          const r = document.createRange();
          r.selectNodeContents(metin);
          return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size;
        });
        expect(satir, `${baglam}: tek satır`).toBe(1);
        const cevap = (await main.getAttribute('data-cevap')) ?? '';
        const yanlis = page.locator('[data-kart]').and(page.locator(`:not([data-kart="${cevap}"])`)).first();
        await yanlis.click();
        await expect(yanlis).toHaveAttribute('data-yanlis', 'true');
        expect((await klipler(page)).slice(acilis.length), `${baglam}: yanlış kart sessiz`).toEqual(['tur.geri.tekrar']);
        await page.locator(`[data-kart="${cevap}"]`).click();
        await expect(main).toHaveAttribute('data-durum', 'dogru');
        await expect(page.locator('[data-uyaran-metni="dogru-yazilis"], [data-uyaran-metni="model"]').first()).toBeVisible();
        const son = await klipler(page);
        expect(son.slice(-2)[0], baglam).toBe('tur.geri.dogru');
        expect(son.at(-1), `${baglam}: cümle klibi yalnız cevaptan sonra`).toMatch(/^tur\.cumle\./);
        for (const k of son) expect(manifest.has(k), `${baglam}: ${k} manifestte`).toBe(true);
        if (sablon === 'T-11') await expect(page.locator('[data-uyaran-metni="dogru-yazilis"]')).toHaveText(/[.?!]$/);
        await geometriTemiz(page, `${baglam} (doğru)`);
      }
      expect(parcalar.length, 'cümle parçası indirildi').toBeGreaterThan(0);
      await ctx.close();
    }
  });
}

test('cümle parçası sözcük etkinliğinde indirilmez; 1. grupta cümle etkinliği açıklanır', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'tablet', 'bir kez');
  const parcalar: string[] = [];
  page.on('request', (r) => {
    if (CUMLE_PARCASI.test(r.url())) parcalar.push(r.url());
  });
  await sesKilidiniAc(page, `/?ders=tur&etkinlik=T-08&zorluk=1&tohum=1&device=tablet&tur=${HEPSI}`);
  await expect(page.locator('main[data-tur-etkinlik="T-08"]')).toBeVisible();
  await page.waitForTimeout(500);
  expect(parcalar).toEqual([]);
  await page.goto(`/?ders=tur&etkinlik=T-10&zorluk=1&tohum=1&device=tablet&tur=${kumeKodla(resmiKume('l', true))}`);
  const basla = page.getByRole('button', { name: 'Başla' });
  if (await basla.isVisible().catch(() => false)) await basla.click();
  await expect(page.locator('[data-etkinlik-kurulamadi="T-10"]')).toBeVisible();
  await expect(page.locator('[data-etkinlik-kurulamadi="T-10"]')).toContainText('2. gruptan');
});

test('T-11 noktalama kartlarının erişilebilir adları; ünlem kartı 5. grupta z5', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'tablet', 'bir kez');
  await sesKilidiniAc(page, `/?ders=tur&etkinlik=T-11&zorluk=5&tohum=1&device=tablet&tur=${HEPSI}`);
  await expect(page.locator('main[data-tur-etkinlik="T-11"]')).toBeVisible();
  for (const ad of ['Nokta', 'Soru işareti', 'Ünlem işareti'])
    await expect(page.getByRole('button', { name: ad, exact: true })).toBeVisible();
  await page.goto(`/?ders=tur&etkinlik=T-11&zorluk=5&tohum=1&device=tablet&tur=${kumeKodla(resmiKume('m', true))}`);
  const basla = page.getByRole('button', { name: 'Başla' });
  if (await basla.isVisible().catch(() => false)) await basla.click();
  await expect(page.locator('main[data-tur-etkinlik="T-11"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ünlem işareti', exact: true })).toHaveCount(0);
});

test('M-3 koro / yankılayıcı okuma: tahtada sözcük sözcük vurgu, yankı kipi, ses istemez, ayrı parça', async ({ browser }, bilgi) => {
  test.setTimeout(120_000);
  for (const g of gorunumler(bilgi.project.name)) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    const parcalar: string[] = [];
    page.on('request', (r) => {
      if (KORO_PARCASI.test(r.url())) parcalar.push(r.url());
    });
    await sesKilidiniAc(page, `/?ders=tur&ekran=koro&device=${g.cihaz}&tur=${HEPSI}`);
    const main = page.locator('main[data-koro-okuma]');
    await expect(main).toBeVisible();
    await geometriTemiz(page, `koro ${g.ad}`);
    const sozcukSayisi = await page.locator('[data-koro-sozcuk]').count();
    expect(sozcukSayisi).toBeGreaterThanOrEqual(2);
    const sonraki = page.getByRole('button', { name: 'Sonraki sözcük', exact: true });
    for (let i = 0; i < sozcukSayisi; i++) {
      await sonraki.click();
      await expect(main).toHaveAttribute('data-vurgu', String(i));
      await expect(page.locator('[data-vurgulu]')).toHaveAttribute('data-koro-sozcuk', String(i));
    }
    await expect(sonraki).toBeDisabled();
    // Yankı: öğretmen okur → sınıf tekrar eder, vurgu baştan.
    await page.getByRole('button', { name: 'Kip: koro', exact: true }).click();
    await expect(main).toHaveAttribute('data-kip', 'yanki');
    for (let i = 0; i < sozcukSayisi; i++) await sonraki.click();
    await expect(main).toHaveAttribute('data-asama', 'ogretmen');
    await sonraki.click();
    await expect(main).toHaveAttribute('data-asama', 'sinif');
    await expect(main).toHaveAttribute('data-vurgu', '0');
    const once = await main.getAttribute('data-koro-okuma');
    await page.getByRole('button', { name: 'Sonraki cümle', exact: true }).click();
    await expect(main).not.toHaveAttribute('data-koro-okuma', once ?? '');
    await geometriTemiz(page, `koro ${g.ad} (yankı)`);
    const klip = await page.evaluate(() => [...(window.__okulumsunE2E?.istenenKlipler ?? [])].filter((k) => k.startsWith('tur.')));
    expect(klip, 'koro okuma ses istemez').toEqual([]);
    expect(parcalar.length, 'koro parçası indirildi').toBeGreaterThan(0);
    await ctx.close();
  }
});

test('günün akışı: 6. basamaktan koro okuma ve T-10, 7. basamaktan T-11/T-12 açılır', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'tablet', 'bir kez');
  await sesKilidiniAc(page, `/?ders=tur&ekran=akis&device=tablet&tur=${HEPSI}`);
  await page.getByRole('button', { name: 'Hece ve sözcük: Koro', exact: true }).click();
  await expect(page.locator('main[data-koro-okuma]')).toBeVisible();
  await page.getByRole('button', { name: 'Geri', exact: true }).click();
  await page.getByRole('button', { name: 'Dikte: T-12', exact: true }).click();
  await expect(page.locator('main[data-tur-etkinlik="T-12"]')).toBeVisible();
});
