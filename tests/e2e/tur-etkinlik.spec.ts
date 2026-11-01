import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { TUR_URL } from '../../playwright.config';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';

/**
 * Okuma Yazma Adım 69 — görselsiz şablonlar (T-02…T-07), YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`, port 5174).
 *
 * Her şablon üç görünümde (tahta 1920×1080, tahta 1080×810, tablet 1080×810) açılır ve çözülür:
 *  - geometri temiz (üst %35'te dokunma yok, hedefler ≥ tap-min) — yuvalar yalnız gösterir;
 *  - SES (istenen klipler listesi, `e2eKanca.istenenKlipler`): açılışta yönerge (+ dinleme sorusunda sözcükler);
 *    okuma hedefli soruda (T-03…T-06) yalnız yönerge (D-12); kartlara dokunmak hiçbir klip istemez (D-11, sessiz kart);
 *    istenen her klip manifestte ve hiçbiri tek başına ünsüz değil; doğru cevaptan sonra geri bildirim klipleri;
 *  - Türkçe ses dosyası yok (Adım 67): ekranda "Ses yok" görünür, akış sessiz çalışır.
 * Cevap e2e kancalı derlemede `main[data-cevap]`tan okunur (üretimde yok).
 */
test.use({ baseURL: TUR_URL });

const manifest = new Map(
  (
    JSON.parse(readFileSync('ders-verisi/tur/ses/klipler.json', 'utf8')) as { klipler: { anahtar: string; metin: string }[] }
  ).klipler.map((k) => [k.anahtar, k.metin]),
);
const UNLU = /[aeıioöuüâîû]/i;

export const SABLONLAR = ['T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07'] as const;
const OKUMA_HEDEFLI = new Set(['T-03', 'T-04', 'T-05', 'T-06']);

const gorunumler = (proje: string) =>
  proje === 'board'
    ? ([
        { ad: 'tahta 1920×1080', w: 1920, h: 1080, cihaz: 'board' },
        { ad: 'tahta 1080×810', w: 1080, h: 810, cihaz: 'board' },
      ] as const)
    : ([{ ad: 'tablet 1080×810', w: 1080, h: 810, cihaz: 'tablet' }] as const);

/**
 * Türkçe klipleri (`tur.*`). Ses kilidini açan "Başla" uygulamanın karşılama klibini (`ui.hosgeldin`), tembel
 * parça yüklenirken bekleme ekranı `ui.hazirlaniyor` ister; Türkçe ekranda bunlardan başka klip istenmemeli.
 */
const UYGULAMA_KLIPLERI = new Set(['ui.hosgeldin', 'ui.hazirlaniyor']);
async function klipler(page: Page): Promise<string[]> {
  const hepsi = await page.evaluate(() => [...(window.__okulumsunE2E?.istenenKlipler ?? [])]);
  expect(hepsi.filter((k) => !k.startsWith('tur.') && !UYGULAMA_KLIPLERI.has(k)), 'Türkçe ekranda başka klip yok').toEqual([]);
  return hepsi.filter((k) => k.startsWith('tur.'));
}

function klipleriDenetle(liste: readonly string[], baglam: string) {
  for (const k of liste) {
    expect(k, `${baglam}: harf klibi istenmez (D-11)`).not.toMatch(/^tur\.harf\./);
    expect(manifest.has(k), `${baglam}: ${k} manifestte`).toBe(true);
    expect(manifest.get(k), `${baglam}: ${k} tek başına ünsüz değil (D-11)`).toMatch(UNLU);
  }
}

async function ac(page: Page, sablon: string, zorluk: number, tohum: number, cihaz: string) {
  await sesKilidiniAc(page, `/?ders=tur&etkinlik=${sablon}&zorluk=${zorluk}&tohum=${tohum}&device=${cihaz}`);
  const main = page.locator(`main[data-tur-etkinlik="${sablon}"]`);
  await expect(main).toBeVisible();
  await expect(page.locator('[data-kartlar][data-satir]')).toBeVisible();
  return main;
}

/** Soruyu çözer: önce (varsa) bir yanlış kart, sonra doğru cevap. Kart dokunuşları klip istemez. */
async function coz(page: Page, sablon: string, baglam: string) {
  const main = page.locator('main[data-tur-etkinlik]');
  const cevap = (await main.getAttribute('data-cevap')) ?? '';
  const kartlar = page.locator('[data-kart]');
  const ilk = await klipler(page);
  if (await main.locator('[data-yuvalar], [data-sozcuk-bosluklu]').count()) {
    // Yerleştir: cevaptaki metinleri sırayla kullanılmamış kartlardan seç.
    for (const parca of cevap.split('|')) {
      const kart = page.locator(`[data-kart][data-kart-metin="${parca}"]:not([data-kullanildi])`).first();
      await kart.click();
      expect(await klipler(page), `${baglam}: kart sessiz (D-11)`).toEqual(ilk);
    }
    await page.getByRole('button', { name: 'Onayla', exact: true }).click();
  } else {
    const yanlis = kartlar.and(page.locator(`:not([data-kart="${cevap}"])`)).first();
    await yanlis.click();
    await expect(yanlis).toHaveAttribute('data-yanlis', 'true');
    const sonra = await klipler(page);
    // Yanlış dokunuş yalnız "Bir daha deneyelim." ister; kartın harfi/hecesi asla.
    expect(sonra.slice(ilk.length), `${baglam}: yanlış kart`).toEqual(['tur.geri.tekrar']);
    await page.waitForTimeout(300); // BigButton soğuması değil, ayrı kart; görsel durum otursun
    await page.locator(`[data-kart="${cevap}"]`).click();
  }
  await expect(main).toHaveAttribute('data-durum', 'dogru');
  await expect(page.getByRole('button', { name: 'Sonraki', exact: true })).toBeVisible();
  const son = await klipler(page);
  expect(son.slice(-1)[0], `${baglam}: geri bildirim istendi`).toMatch(/^tur\.(sozcuk|hece|geri)\./);
  expect(son, `${baglam}: geri bildirimde övgü`).toContain('tur.geri.dogru');
  klipleriDenetle(son, baglam);
  void sablon;
}

for (const sablon of SABLONLAR) {
  test(`${sablon}: üç görünümde açılır, geometri temiz, ses kuralları (D-11, D-12), çözülür`, async ({ browser }, bilgi) => {
    test.setTimeout(150_000);
    for (const g of gorunumler(bilgi.project.name)) {
      // Her görünüm kendi bağlamında (tahta profilinde tam ekran isteği pencere boyutlandırmayı engelleyebilir).
      const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
      const page = await ctx.newPage();
      for (const zorluk of [1, 3, 5]) {
        const baglam = `${sablon} z${zorluk} ${g.ad}`;
        await ac(page, sablon, zorluk, 1, g.cihaz);
        await geometriTemiz(page, baglam);
        await expect(page.locator('[data-ses-yok]')).toBeVisible();
        const acilis = await klipler(page);
        expect(acilis[0], `${baglam}: önce yönerge`).toMatch(/^tur\.yonerge\./);
        if (OKUMA_HEDEFLI.has(sablon)) expect(acilis, `${baglam}: okuma sorusunda yalnız yönerge (D-12)`).toHaveLength(1);
        else expect(acilis.slice(1).every((k) => k.startsWith('tur.sozcuk.')), baglam).toBe(true);
        klipleriDenetle(acilis, baglam);
        // ↻ aynı listeyi yeniden ister (D-12: okuma sorusunda yine yalnız yönerge).
        await page.getByRole('button', { name: 'Tekrar dinle', exact: true }).click();
        await expect.poll(() => klipler(page)).toEqual([...acilis, ...acilis]);
        await coz(page, sablon, baglam);
        await geometriTemiz(page, `${baglam} (doğru)`);
      }
      await ctx.close();
    }
  });
}

test('etkinlik seçimi: öğretilen küme adreste (?tur=), kartlar yalnız öğretilen harflerden; kurulamayan küme açıklanır', async ({
  page,
}, bilgi) => {
  test.skip(bilgi.project.name !== 'tablet', 'öğretmen ekranı akışı bir kez');
  test.setTimeout(90_000);
  await sesKilidiniAc(page, '/?ders=tur&device=tablet');
  await page.getByRole('button', { name: 'Etkinlikler' }).click();
  await expect(page.getByRole('main', { name: 'Etkinlikler' })).toBeVisible();
  // Bugünkü ses "t" → küme a n e t (küçük).
  await page.getByLabel('Bugünkü ses').selectOption('t');
  await expect.poll(() => new URL(page.url()).searchParams.get('tur')).not.toBeNull();
  for (const g of ['a', 'n', 'e', 't'])
    await expect(page.getByRole('button', { name: `${g} öğretildi`, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'i öğretilmedi', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^T-03 / }).click();
  await page.getByRole('button', { name: 'Zorluk 5', exact: true }).click();
  await page.getByRole('button', { name: 'Başlat', exact: true }).click();
  await expect(page.locator('main[data-tur-etkinlik="T-03"]')).toBeVisible();
  const metinler = await page.locator('[data-kart]').evaluateAll((l) => l.map((e) => e.getAttribute('data-kart-metin') ?? ''));
  expect(metinler.length).toBeGreaterThan(1);
  for (const m of metinler) expect('ante'.includes(m), `"${m}" öğretilen kümede`).toBe(true);
  expect(new URL(page.url()).searchParams.get('tur')).not.toBeNull();
  // Yalnız "a": T-02 kurulamaz, öğretmene açıklanır (çocuğa boş ekran yok).
  await page.goto('/?ders=tur&etkinlik=T-02&zorluk=1&tohum=1&device=tablet&tur=1');
  const basla = page.getByRole('button', { name: 'Başla' });
  if (await basla.isVisible().catch(() => false)) await basla.click();
  await expect(page.locator('[data-etkinlik-kurulamadi="T-02"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Etkinlik seçimi' })).toBeVisible();
});
