import { expect, test, type Page } from '@playwright/test';
import { TUR_URL } from '../../playwright.config';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';
import { haftaBul, haftalikSesPlani, sonOnerilenSes } from '../../src/content/dersler/tur/sesPlani';
import { BAYRAKLI_IZINLI_ANAHTARLAR, DERS_TUR_SINIF_ANAHTARI, IZINLI_ANAHTARLAR } from '../../src/persistence/depolamaIzinListesi';

/**
 * Okuma Yazma Adım 71 — öğretmen akışı, YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`, port 5174).
 *
 *  - Ana ekranda (tahta) ders seçimi; Okuma Yazma öğretmen ekranını açar, Matematik geri döner (gezinme sözleşmesi).
 *  - "Bugünkü ses" tek dokunuş; K-7 sınıf ayarı tek anahtarda (öğrenci verisi değil), yeniden açılışta korunur;
 *    adresteki `?tur=` sınıf ayarından önce gelir.
 *  - Günün akışı: basamak sırası değişir ve sınıf ayarında kalır; basamaklar var olan ekranlara gider, Geri akışa döner.
 *  - Tarayıcıda yalnız izinli anahtarlar (cihaz profili + Türkçe sınıf ayarı).
 * Görünümler: tahta 1920×1080, tahta 1080×810, tablet 1080×810.
 */
test.use({ baseURL: TUR_URL });

const gorunumler = (proje: string) =>
  proje === 'board'
    ? ([
        { ad: 'tahta 1920×1080', w: 1920, h: 1080, cihaz: 'board' },
        { ad: 'tahta 1080×810', w: 1080, h: 810, cihaz: 'board' },
      ] as const)
    : ([{ ad: 'tablet 1080×810', w: 1080, h: 810, cihaz: 'tablet' }] as const);

const IZINLI = new Set([...IZINLI_ANAHTARLAR, ...BAYRAKLI_IZINLI_ANAHTARLAR].map((a) => a.anahtar));

async function anahtarlar(page: Page): Promise<{ yerel: string[]; oturum: string[]; sinif: string | null }> {
  return page.evaluate((k) => ({ yerel: Object.keys(localStorage), oturum: Object.keys(sessionStorage), sinif: localStorage.getItem(k) }), DERS_TUR_SINIF_ANAHTARI);
}

async function turGiris(page: Page, cihaz: string, ek = '') {
  await sesKilidiniAc(page, `/?ders=tur&device=${cihaz}${ek}`);
  await expect(page.getByRole('main', { name: 'Okuma Yazma' })).toBeVisible();
}

test('ders seçimi: tahtada ana ekrandan Okuma Yazma açılır, Matematik geri döner', async ({ browser }, bilgi) => {
  test.setTimeout(90_000);
  for (const g of gorunumler(bilgi.project.name)) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    await sesKilidiniAc(page, `/?device=${g.cihaz}`);
    await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
    const ders = page.getByRole('group', { name: 'Ders' });
    await expect(ders).toBeVisible();
    // Matematik ana ekranının kendi yerleşimi bu adımın kapsamı dışında (tahta 1080×810'da "Yardım" üst bölgede, Adım 71
    // öncesinden); tam geometri 1920×1080'de, diğer görünümde yalnız ders seçimi denetlenir.
    if (g.w === 1920) await geometriTemiz(page, `${g.ad} ana ekran + ders seçimi`);
    // Ders seçimi "Öğretmen" ve "Ayarlar" düğmeleriyle çakışmaz.
    const kutular = await page.evaluate(() =>
      ['[data-ders-secimi]', '[aria-label="Öğretmen"]', '[aria-label="Ayarlar"]'].map((s) => {
        const r = document.querySelector(s)!.getBoundingClientRect();
        return { l: r.left, r: r.right, t: r.top, b: r.bottom };
      }),
    );
    for (const k of kutular.slice(1)) expect(kutular[0].r <= k.l || kutular[0].l >= k.r || kutular[0].b <= k.t, g.ad).toBe(true);
    await ders.getByRole('button', { name: 'Okuma Yazma' }).click();
    await expect(page.getByRole('main', { name: 'Okuma Yazma' })).toBeVisible();
    await expect(page.locator('[data-tur-ekrani="giris"]')).toBeVisible();
    await geometriTemiz(page, `${g.ad} Okuma Yazma öğretmen ekranı`);
    // Öğretmen ekranındaki ders seçimi: Matematik → uygulamanın ana ekranı.
    await page.getByRole('group', { name: 'Ders' }).getByRole('button', { name: 'Matematik' }).click();
    await expect(page.locator('[data-tur-ekrani]')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Ders' })).toBeVisible();
    // Ana menü de aynı yere döner (gezinme sözleşmesi).
    await page.getByRole('group', { name: 'Ders' }).getByRole('button', { name: 'Okuma Yazma' }).click();
    await page.getByRole('button', { name: 'Ana menü' }).click();
    await expect(page.locator('[data-tur-ekrani]')).toHaveCount(0);
    await ctx.close();
  }
});

test('bugünkü ses tek dokunuş; K-7 sınıf ayarı yeniden açılışta korunur, ?tur= önce gelir', async ({ page }, bilgi) => {
  const cihaz = bilgi.project.name === 'board' ? 'board' : 'tablet';
  await turGiris(page, cihaz);
  const ses = page.locator('[data-bugunku-ses]');
  await expect(ses).toHaveAttribute('data-bugunku-ses', 'l');
  expect((await anahtarlar(page)).sinif, 'açılışta yazım yok').toBeNull();
  await page.getByRole('button', { name: 'Sonraki ses: o' }).click();
  await expect(ses).toHaveAttribute('data-bugunku-ses', 'o');
  const a = await anahtarlar(page);
  expect(a.oturum).toEqual([]);
  for (const k of a.yerel) expect(IZINLI.has(k), `izinli anahtar: ${k}`).toBe(true);
  const deger = JSON.parse(a.sinif ?? '{}') as Record<string, unknown>;
  expect(Object.keys(deger).sort(), 'yalnız sürüm + küme kodu').toEqual(['kume', 'v']);
  expect(page.url()).toContain(`tur=${deger.kume as string}`);
  // Yeniden açılış (adreste küme yok): sınıf ayarından "o".
  await turGiris(page, cihaz);
  await expect(page.locator('[data-bugunku-ses]')).toHaveAttribute('data-bugunku-ses', 'o');
  // Adresteki küme sınıf ayarından önce gelir (eve link, öğretmen bağlantısı).
  await turGiris(page, cihaz, '&tur=7');
  await expect(page.locator('[data-bugunku-ses]')).toHaveAttribute('data-bugunku-ses', 'n');
  // Harfleri düzenle → gelişmiş düzenleme; "Büyük harflere geçtik" büyük harfleri ekler.
  await page.getByRole('button', { name: 'Harfleri düzenle' }).click();
  await expect(page.getByRole('main', { name: 'Öğretilen harfler' })).toBeVisible();
  await geometriTemiz(page, 'öğretilen harfler');
  await page.getByRole('button', { name: 'Büyük harflere geçtik' }).click();
  await expect(page.getByRole('button', { name: 'N öğretildi', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Geri' }).click();
  await expect(page.locator('[data-tur-ekrani="giris"]')).toBeVisible();
});

test('günün akışı: sıra değişir ve sınıf ayarında kalır; basamaklar ekran açar, Geri akışa döner', async ({ browser }, bilgi) => {
  test.setTimeout(120_000);
  for (const g of gorunumler(bilgi.project.name)) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    await turGiris(page, g.cihaz);
    await page.getByRole('button', { name: 'Günün akışı' }).click();
    const liste = page.getByRole('list', { name: 'Basamaklar' });
    await expect(liste).toHaveAttribute('data-akis-sirasi', '12345678');
    await geometriTemiz(page, `${g.ad} günün akışı`);
    await expect(page.locator('[data-basamak="1"] [data-dalga-c]')).toBeVisible();
    await page.getByRole('button', { name: 'Ses hissettirme: aşağı taşı' }).click();
    await expect(liste).toHaveAttribute('data-akis-sirasi', '21345678');
    expect(JSON.parse((await anahtarlar(page)).sinif ?? '{}')).toMatchObject({ v: 1, akis: '21345678' });
    // T-01 → etkinlik; Geri akışa.
    await page.getByRole('button', { name: 'Sesin geçtiği görseli seçme: Aç' }).click();
    await expect(page.locator('[data-tur-ekrani="etkinlik"]')).toBeVisible();
    await page.getByRole('button', { name: 'Geri' }).click();
    await expect(page.locator('[data-tur-ekrani="akis"]')).toBeVisible();
    // Yazılış gösterimi bugünkü sesin küçük harfini açar; İzle → Geri → gösterim → Geri → akış.
    await page.getByRole('button', { name: 'Yazılış gösterimi: Aç (l)' }).click();
    await expect(page.locator('[data-yazilis-glif="kucuk:l"]')).toBeVisible();
    await page.getByRole('button', { name: 'Parmakla izle' }).click();
    // İzleme ekranı açılmadan basılan Geri gösterimi atlayıp akışa dönerdi (CI tablet yarışı).
    await expect(page.locator('[data-izleme-glif="kucuk:l"]')).toBeVisible();
    await page.waitForTimeout(400); // kalıcı Geri (GezinmeCubugu): BigButton çift dokunma soğuması
    await page.getByRole('button', { name: 'Geri' }).click();
    await expect(page.locator('[data-yazilis-glif="kucuk:l"]')).toBeVisible();
    await page.waitForTimeout(400); // aynı yerdeki Geri: BigButton çift dokunma soğuması
    await page.getByRole('button', { name: 'Geri' }).click();
    await expect(page.locator('[data-tur-ekrani="akis"]')).toBeVisible();
    // Kâğıt basamakları önizleme açar; Geri akışa.
    await page.getByRole('button', { name: 'Kâğıt ve gözlem formu: Gözlem' }).click();
    await expect(page.locator('[data-tur-ekrani="kagit"]')).toBeVisible();
    await page.getByRole('button', { name: 'Geri' }).click();
    // Yeniden açılışta sıra korunur; programdaki sıraya dönülebilir.
    await turGiris(page, g.cihaz);
    await page.getByRole('button', { name: 'Günün akışı' }).click();
    await expect(liste).toHaveAttribute('data-akis-sirasi', '21345678');
    await page.getByRole('button', { name: 'Programdaki sıraya dön' }).click();
    await expect(liste).toHaveAttribute('data-akis-sirasi', '12345678');
    await ctx.close();
  }
});

test('haftalık ses planı: bu hafta işaretli, "Bu haftayı uygula" bugünkü sesi plana getirir; set hazırla 6 adım, Başlat → Geri', async ({ browser }, bilgi) => {
  test.setTimeout(120_000);
  // Sabit gün: 2 Kasım 2026 (pazartesi), ders yılının içinde.
  const GUN = '2026-11-02';
  const plan = haftalikSesPlani();
  const hafta = haftaBul(plan, GUN)!;
  const oneri = sonOnerilenSes(plan, hafta.pazartesi)!;
  expect(oneri).toBeTruthy();
  for (const g of gorunumler(bilgi.project.name)) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: g.w, height: g.h }, hasTouch: true });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date(`${GUN}T10:00:00`));
    await turGiris(page, g.cihaz, '&tur=1');
    await page.getByRole('button', { name: 'Haftalık ses planı' }).click();
    const ana = page.getByRole('main', { name: 'Haftalık ses planı' });
    await expect(ana).toBeVisible();
    const bu = page.locator('[data-bu-hafta]');
    await expect(bu).toHaveCount(1);
    await expect(bu).toHaveAttribute('data-hafta', hafta.pazartesi);
    await expect(bu).toBeInViewport();
    await geometriTemiz(page, `${g.ad} haftalık ses planı`);
    // Öneri yalnız tek dokunuşla uygulanır; başka bir şey değişmez.
    const uygula = page.getByRole('button', { name: `Bu haftayı uygula: ${oneri}` });
    await expect(uygula).toBeVisible();
    await uygula.click();
    await expect(ana.locator('strong[data-glif]')).toHaveAttribute('data-glif', oneri);
    await expect(uygula).toHaveCount(0);
    await page.getByRole('button', { name: 'Geri' }).click();
    await expect(page.locator('[data-bugunku-ses]')).toHaveAttribute('data-bugunku-ses', oneri);
    // Set hazırla: 6 adım; düzey değişince set değişir; Başlat → 1/6, Geri set hazırla ekranına döner.
    await page.getByRole('button', { name: 'Set hazırla' }).click();
    const adimlar = page.getByRole('list', { name: 'Setteki etkinlikler' });
    await expect(adimlar).toBeVisible();
    const sinif = (await adimlar.getAttribute('data-set-adimlari'))!;
    expect(sinif.split(',')).toHaveLength(6);
    await geometriTemiz(page, `${g.ad} set hazırla`);
    await page.getByRole('button', { name: 'Destek', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Destek', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(adimlar).not.toHaveAttribute('data-set-adimlari', sinif);
    await page.getByRole('button', { name: 'Seti başlat' }).click();
    await expect(page.locator('[data-set-sira="1/6"]')).toBeVisible();
    await geometriTemiz(page, `${g.ad} set adım 1`);
    await page.waitForTimeout(400); // kalıcı Geri: BigButton çift dokunma soğuması
    await page.getByRole('button', { name: 'Geri' }).click();
    await expect(page.getByRole('main', { name: 'Set hazırla' })).toBeVisible();
    const k = await anahtarlar(page);
    expect([...k.yerel, ...k.oturum].filter((a) => !IZINLI.has(a))).toEqual([]);
    await ctx.close();
  }
});
