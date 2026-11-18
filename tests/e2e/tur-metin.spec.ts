import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { TUR_URL } from '../../playwright.config';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';
import { sesiEksikKur } from './yardimci/turSes';
import { kumeKodla, resmiKume } from '../../src/content/dersler/tur/ogretilenKume';

/**
 * Okuma Yazma Adım 80 — okuma metinleri: T-13 "Metni oku, soruyu cevapla" (E3) ve "Metni oku" model okuma (E2), YALNIZ
 * bayraklı derlemede (`VITE_DERS_TUR=1`, port 5174). Metin parçası (`turMetin-*.js`) ve "Metni oku" parçası
 * (`MetinOkuma-*.js`) yalnız gerektiğinde iner. Her ekran üç görünümde: geometri temiz; metin satırları tek satırda
 * (sözcük bölünmez, D-22); okuma hedefli (açılışta yalnız yönerge, D-12); doğru cevaptan sonra cevabın cümlesi vurgulanır
 * ve cümle klibi istenir; "Dinle" metnin cümle klipleri ister, klip yoksa "Ses yok"; metin yüklenemezse açık hata.
 */
test.use({ baseURL: TUR_URL });

const HEPSI = kumeKodla(resmiKume('j', true));
const GRUP2 = kumeKodla(resmiKume('m', true));
const METIN_PARCASI = /\/assets\/turMetin-[^/]+\.js$|\/sablonlar\/metin\/turMetin\.ts(\?|$)/;
const OKUMA_PARCASI = /\/assets\/MetinOkuma-[^/]+\.js$|\/ui\/tur\/cumle\/MetinOkuma\.tsx(\?|$)/;
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

/** Seçili öğelerin her biri tek satırda mı (sözcük bölünmez, D-22). */
async function tekSatir(page: Page, secici: string): Promise<number[]> {
  return page.locator(secici).evaluateAll((l) =>
    l.map((e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      return new Set([...r.getClientRects()].filter((x) => x.width > 1).map((x) => Math.round(x.top))).size;
    }),
  );
}

test('T-13: metin parçası yüklenir, üç görünümde geometri temiz, okuma hedefli, cevap vurgulanır', async ({ browser }, bilgi) => {
  test.setTimeout(150_000);
  for (const g of gorunumler(bilgi.project.name)) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    const parcalar: string[] = [];
    page.on('request', (r) => {
      if (METIN_PARCASI.test(r.url())) parcalar.push(r.url());
    });
    for (const [zorluk, tohum] of [[1, 2], [2, 5], [3, 2], [5, 4]] as const) {
      const baglam = `T-13 z${zorluk} ${g.ad}`;
      await sesiEksikKur(page);
      await sesKilidiniAc(page, `/?ders=tur&etkinlik=T-13&zorluk=${zorluk}&tohum=${tohum}&device=${g.cihaz}&tur=${HEPSI}`);
      const main = page.locator('main[data-tur-etkinlik="T-13"]');
      await expect(main).toBeVisible();
      await expect(page.locator('[data-kartlar][data-satir]')).toBeVisible();
      await expect(page.locator('[data-uyaran-metin]')).toBeVisible();
      await geometriTemiz(page, baglam);
      await expect.poll(async () => (await klipler(page)).length).toBeGreaterThan(0);
      const acilis = await klipler(page);
      expect(acilis, `${baglam}: okuma sorusunda yalnız yönerge (D-12)`).toEqual(['tur.yonerge.t13']);
      // Metin satırları ve soru tek satırda; soru yazılı ve işaretle biter.
      const satirlar = await tekSatir(page, '[data-metin-satir], [data-uyaran-metni="soru"]');
      expect(satirlar.length, baglam).toBeGreaterThanOrEqual(3);
      expect(satirlar.every((n) => n === 1), `${baglam}: tek satır`).toBe(true);
      await expect(page.locator('[data-uyaran-metni="soru"]')).toHaveText(/\?$/);
      // Üstte (D-24) hiçbir şey dokunulabilir değil: kartlar ve çubuk altta (geometri taraması), vurgu yok.
      await expect(page.locator('[data-metin-satir][data-vurgulu]')).toHaveCount(0);
      const cevap = (await main.getAttribute('data-cevap')) ?? '';
      const yanlis = page.locator('[data-kart]').and(page.locator(`:not([data-kart="${cevap}"])`)).first();
      await yanlis.click();
      await expect(yanlis).toHaveAttribute('data-yanlis', 'true');
      expect((await klipler(page)).slice(acilis.length), `${baglam}: yanlış kart sessiz`).toEqual(['tur.geri.tekrar']);
      await page.locator(`[data-kart="${cevap}"]`).click();
      await expect(main).toHaveAttribute('data-durum', 'dogru');
      await expect(page.locator('[data-metin-satir][data-vurgulu]')).toHaveCount(1);
      const son = await klipler(page);
      expect(son.slice(-2)[0], baglam).toBe('tur.geri.dogru');
      expect(son.at(-1), `${baglam}: cümle klibi yalnız cevaptan sonra`).toMatch(/^tur\.cumle\.m\d{3}s\d$/);
      for (const k of son) expect(manifest.has(k), `${baglam}: ${k} manifestte`).toBe(true);
      await geometriTemiz(page, `${baglam} (doğru)`);
    }
    expect(parcalar.length, 'metin parçası indirildi').toBeGreaterThan(0);
    await ctx.close();
  }
});

test('T-13: sözcük ve resim kartı cevapları görünür; metin parçası sözcük etkinliğinde indirilmez; 1. grupta açıklanır', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'tablet', 'bir kez');
  const parcalar: string[] = [];
  page.on('request', (r) => {
    if (METIN_PARCASI.test(r.url())) parcalar.push(r.url());
  });
  await sesKilidiniAc(page, `/?ders=tur&etkinlik=T-08&zorluk=1&tohum=1&device=tablet&tur=${HEPSI}`);
  await expect(page.locator('main[data-tur-etkinlik="T-08"]')).toBeVisible();
  await page.waitForTimeout(500);
  expect(parcalar).toEqual([]);
  // 2. grup kümesi: resim cevaplı soru var (tohum taraması): resim kartı ve sözcük kartı biçimleri.
  const turler = new Set<string>();
  for (let tohum = 1; tohum <= 12 && turler.size < 2; tohum++) {
    await page.goto(`/?ders=tur&etkinlik=T-13&zorluk=2&tohum=${tohum}&device=tablet&tur=${GRUP2}`);
    const basla = page.getByRole('button', { name: 'Başla' });
    if (await basla.isVisible().catch(() => false)) await basla.click();
    await expect(page.locator('main[data-tur-etkinlik="T-13"]')).toBeVisible();
    turler.add((await page.locator('[data-kart-gorsel]').count()) > 0 ? 'resim' : 'sozcuk');
  }
  expect([...turler].sort()).toEqual(['resim', 'sozcuk']);
  // 1. grup: kurulamıyor, nedeni öğretmene yazılır.
  await page.goto(`/?ders=tur&etkinlik=T-13&zorluk=1&tohum=1&device=tablet&tur=${kumeKodla(resmiKume('l', true))}`);
  const basla = page.getByRole('button', { name: 'Başla' });
  if (await basla.isVisible().catch(() => false)) await basla.click();
  await expect(page.locator('[data-etkinlik-kurulamadi="T-13"]')).toBeVisible();
  await expect(page.locator('[data-etkinlik-kurulamadi="T-13"]')).toContainText('2. gruptan');
});

test('"Metni oku": tahtada sözcük sözcük vurgu, Dinle cümle klipleri ister, klip yoksa "Ses yok", ayrı parça', async ({ browser }, bilgi) => {
  test.setTimeout(150_000);
  for (const g of gorunumler(bilgi.project.name)) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    const parcalar: string[] = [];
    page.on('request', (r) => {
      if (OKUMA_PARCASI.test(r.url())) parcalar.push(r.url());
    });
    await sesiEksikKur(page);
    await sesKilidiniAc(page, `/?ders=tur&ekran=metin&device=${g.cihaz}&tur=${HEPSI}`);
    const main = page.locator('main[data-metin-okuma]');
    await expect(main).toBeVisible();
    await geometriTemiz(page, `metni oku ${g.ad}`);
    const satirSayisi = await page.locator('[data-uyaran-metni="metin"]').count();
    expect(satirSayisi).toBeGreaterThanOrEqual(2);
    expect((await tekSatir(page, '[data-uyaran-metni="metin"]')).every((n) => n === 1), `${g.ad}: tek satır`).toBe(true);
    const sozcukSayisi = await page.locator('[data-koro-sozcuk]').count();
    expect(sozcukSayisi).toBeGreaterThanOrEqual(4);
    expect(await klipler(page), 'Dinle\'ye dokunulmadan ses istenmez').toEqual([]);
    const sonraki = page.getByRole('button', { name: 'Sonraki sözcük', exact: true });
    for (let i = 0; i < sozcukSayisi; i++) {
      await page.waitForTimeout(300); // BigButton aynı düğmeye 250 ms soğuma
      await sonraki.click();
      await expect(main).toHaveAttribute('data-vurgu', String(i));
      await expect(page.locator('[data-vurgulu]')).toHaveCount(1);
    }
    await expect(sonraki).toBeDisabled();
    await expect(page.locator('[data-metin-durum]')).toContainText('Metin bitti');
    // Dinle: metnin cümle klipleri sırayla istenir; klipler eksik → "Ses yok".
    const metinNo = (await main.getAttribute('data-metin-okuma'))!;
    await page.getByRole('button', { name: 'Dinle', exact: true }).click();
    await expect.poll(async () => (await klipler(page)).length).toBe(satirSayisi);
    const istenen = await klipler(page);
    const onek = `tur.cumle.${metinNo.replace(/[.-]/g, '')}s`;
    expect(istenen).toEqual(Array.from({ length: satirSayisi }, (_, i) => `${onek}${i + 1}`));
    for (const k of istenen) expect(manifest.has(k), `${k} manifestte`).toBe(true);
    await expect(page.locator('[data-ses-yok]')).toBeVisible();
    await geometriTemiz(page, `metni oku ${g.ad} (ses yok)`);
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Sonraki metin', exact: true }).click();
    await expect(main).not.toHaveAttribute('data-metin-okuma', metinNo);
    await expect(page.locator('[data-ses-yok]')).toHaveCount(0);
    expect(parcalar.length, 'Metni oku parçası indirildi').toBeGreaterThan(0);
    await ctx.close();
  }
});

test('1. grup kümesinde "Metni oku" boş açıklama gösterir', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'tablet', 'bir kez');
  await sesKilidiniAc(page, `/?ders=tur&ekran=metin&device=tablet&tur=${kumeKodla(resmiKume('l', true))}`);
  await expect(page.locator('main[data-metin-bos]')).toContainText('2. harf grubundan');
});

test('günün akışı: 6. basamaktan "Metni oku", 7. basamaktan T-13 açılır', async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== 'tablet', 'bir kez');
  await sesKilidiniAc(page, `/?ders=tur&ekran=akis&device=tablet&tur=${HEPSI}`);
  await geometriTemiz(page, 'günün akışı (Metni oku düğmeleriyle)');
  await page.getByRole('button', { name: 'Hece ve sözcük: Metni oku', exact: true }).click();
  await expect(page.locator('main[data-metin-okuma]')).toBeVisible();
  await page.getByRole('button', { name: 'Geri', exact: true }).first().click();
  await page.getByRole('button', { name: 'Dikte: T-13', exact: true }).click();
  await expect(page.locator('main[data-tur-etkinlik="T-13"]')).toBeVisible();
});

test('set hazırla ve eve link: zenginleştirme setinde T-13; ev açılışı aynı seti listeler', async ({ browser }, bilgi) => {
  test.setTimeout(120_000);
  for (const g of gorunumler(bilgi.project.name)) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    await sesKilidiniAc(page, `/?ders=tur&ekran=setHazirla&device=${g.cihaz}&tur=${HEPSI}`);
    await page.getByRole('button', { name: 'Zenginleştirme', exact: true }).click();
    const liste = page.getByRole('list', { name: 'Setteki etkinlikler' });
    await expect(liste).toHaveAttribute('data-set-adimlari', /T-13\/4/);
    await expect(liste).toContainText('Metni oku, soruyu cevapla');
    await geometriTemiz(page, `${g.ad} set hazırla (T-13)`);
    await ctx.close();
    // Ev cihazı (öğretmen ekranına yolu yok): aynı küme + set kodu aynı seti kurar.
    const ev = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const p2 = await ev.newPage();
    await sesKilidiniAc(p2, `/?ders=tur&ev=z3&tur=${HEPSI}&device=${g.cihaz}`);
    const acilis = p2.getByRole('main', { name: 'Evde okuma yazma' });
    await expect(acilis).toBeVisible();
    await expect(acilis).toContainText('Metni oku, soruyu cevapla');
    await expect(p2.locator('[data-ev-set-hatasi]')).toHaveCount(0);
    await geometriTemiz(p2, `${g.ad} ev açılışı (T-13)`);
    await ev.close();
  }
});

test.describe('metin verisi yüklenemezse açık hata (sessiz boş ekran yok)', () => {
  test.beforeEach(async ({ page }, bilgi) => {
    test.skip(bilgi.project.name !== 'tablet', 'bir kez');
    await page.route('**/tur/icerik/metinler.json', (rota) => rota.fulfill({ status: 404, body: 'yok' }));
  });

  test('Metni oku ve T-13 etkinliği hata yazar', async ({ page }) => {
    await sesKilidiniAc(page, `/?ders=tur&ekran=metin&device=tablet&tur=${HEPSI}`);
    await expect(page.getByRole('alert')).toContainText('Metin verisi açılamadı');
    await expect(page.locator('main[data-metin-okuma]')).toHaveCount(0);
    await page.goto(`/?ders=tur&etkinlik=T-13&zorluk=1&tohum=1&device=tablet&tur=${HEPSI}`);
    const basla = page.getByRole('button', { name: 'Başla' });
    if (await basla.isVisible().catch(() => false)) await basla.click();
    await expect(page.getByRole('main', { name: 'Etkinlik' })).toContainText('Metin verisi açılamadı');
    await expect(page.locator('main[data-tur-etkinlik="T-13"]')).toHaveCount(0);
  });

  test('zenginleştirme seti sessizce yedeğe düşmez; ev açılışı hatayı gösterir ve Başla kapalı', async ({ page }) => {
    await sesKilidiniAc(page, `/?ders=tur&ekran=setHazirla&device=tablet&tur=${HEPSI}`);
    await page.getByRole('button', { name: 'Zenginleştirme', exact: true }).click();
    await expect(page.getByRole('main', { name: 'Set hazırla' })).toContainText('Metin verisi açılamadı');
    await expect(page.getByRole('list', { name: 'Setteki etkinlikler' })).toHaveCount(0);
    await page.goto(`/?ders=tur&ev=z3&tur=${HEPSI}&device=tablet`);
    const basla = page.getByRole('button', { name: 'Başla' });
    if (await basla.isVisible().catch(() => false)) await basla.click();
    await expect(page.locator('[data-ev-set-hatasi]')).toContainText('Metin verisi açılamadı');
    await expect(page.getByRole('button', { name: 'Başla' })).toBeDisabled();
  });
});
