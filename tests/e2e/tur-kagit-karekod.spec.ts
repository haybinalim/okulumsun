import { expect, test, type Page } from '@playwright/test';
import { TUR_URL } from '../../playwright.config';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';
import { BAYRAKLI_IZINLI_ANAHTARLAR, IZINLI_ANAHTARLAR } from '../../src/persistence/depolamaIzinListesi';

/**
 * Okuma Yazma Adım 81 — YALNIZ bayraklı derlemede (`VITE_DERS_TUR=1`, 5174).
 *  - E4 kâğıttan dijitale: Set hazırla → "Dikte kâğıdı": alt bilgide aynı setin karekodu + kısa bağlantı; karekodun
 *    taşıdığı bağlantı evde AYNI seti açar; baskıda kalibrasyon karesi 1 cm, karekod 2 cm; telefon (390) ve
 *    masaüstü (1280) görünümü taşmaz.
 *  - E5 oturum özeti: set bitince "Bu derste ne yaptık" (nitel; sayı/yüzde/puan yok); ekrandan çıkınca silinir;
 *    depolamaya yazılmaz.
 */
test.use({ baseURL: TUR_URL });

const IZINLI = new Set([...IZINLI_ANAHTARLAR, ...BAYRAKLI_IZINLI_ANAHTARLAR].map((a) => a.anahtar));
const MM = 96 / 25.4;

test('set kâğıdında eve karekodu: kalibrasyon 1 cm bozulmaz, karekod aynı seti evde açar', async ({ browser }, bilgi) => {
  test.setTimeout(120_000);
  const cihaz = bilgi.project.name === 'board' ? 'board' : 'tablet';
  const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: 1080, height: 810 }, hasTouch: true });
  const page = await ctx.newPage();
  await sesKilidiniAc(page, `/?ders=tur&device=${cihaz}&tur=1kv`);
  await page.getByRole('button', { name: 'Set hazırla' }).click();
  await page.getByRole('button', { name: 'Destek', exact: true }).click();
  const adimlar = (await page.getByRole('list', { name: 'Setteki etkinlikler' }).getAttribute('data-set-adimlari'))!;
  await geometriTemiz(page, 'set hazırla (kâğıt düğmeleri)');
  await page.getByRole('button', { name: 'Dikte kâğıdı, eve karekodlu' }).click();
  const onizleme = page.getByRole('main', { name: 'Kâğıt önizlemesi' });
  await expect(onizleme).toBeVisible();
  await expect(onizleme.locator('[data-tur-kagit-hazir]')).toBeVisible();
  const eve = onizleme.locator('.tk-kok--onizleme [data-eve-karekod="hazir"]');
  await expect(eve).toHaveCount(1);
  await expect(onizleme.locator('[data-eve-karekod-hata]')).toHaveCount(0);
  const baglanti = (await eve.getAttribute('data-eve-baglanti'))!;
  const kisa = ((await eve.locator('[data-eve-kisa]').textContent()) ?? '').trim();
  expect(baglanti.endsWith(kisa)).toBe(true);
  const u = new URL(baglanti);
  expect([...u.searchParams.keys()].sort()).toEqual(['ders', 'ev', 'tur']);
  expect(u.searchParams.get('tur')).toBe('1kv');
  expect(u.searchParams.get('ev')).toMatch(/^d[1-9][0-9]*$/); // destek düzeyi
  await geometriTemiz(page, 'dikte kâğıdı önizleme (karekodlu)');

  // Baskı: kalibrasyon karesi 10 mm, karekod 20 mm; ikisi sayfa içinde ve çakışmasız.
  await page.emulateMedia({ media: 'print' });
  const olcu = await page.evaluate(() => {
    const k = document.querySelector('.tk-kok--baski [data-kalibrasyon]')!.getBoundingClientRect();
    const q = document.querySelector('.tk-kok--baski [data-eve-karekod="hazir"] svg')!.getBoundingClientRect();
    const s = document.querySelector('.tk-kok--baski .tk-sayfa')!.getBoundingClientRect();
    return { k: [k.width, k.height, k.right], q: [q.width, q.height, q.left, q.right, q.bottom], s: [s.width, s.height] };
  });
  await page.emulateMedia({ media: 'screen' });
  expect(Math.abs(olcu.k[0] - 10 * MM)).toBeLessThan(0.6);
  expect(Math.abs(olcu.k[1] - 10 * MM)).toBeLessThan(0.6);
  expect(Math.abs(olcu.q[0] - 20 * MM)).toBeLessThan(0.6);
  expect(olcu.k[2]).toBeLessThan(olcu.q[2]); // kalibrasyon karekodun solunda
  expect(olcu.q[3]).toBeLessThanOrEqual(olcu.s[0] + 0.5);
  expect(olcu.q[4]).toBeLessThanOrEqual(olcu.s[1] + 0.5);

  // Karşı parça: karekodun taşıdığı bağlantı evde aynı setin adım sayısını açar.
  const ev = await browser.newContext({ baseURL: TUR_URL, viewport: { width: 390, height: 844 }, hasTouch: true });
  const p2 = await ev.newPage();
  await sesKilidiniAc(p2, `${u.pathname}${u.search}&device=tablet`);
  await expect(p2.getByRole('main', { name: 'Evde okuma yazma' })).toBeVisible();
  await p2.waitForTimeout(400);
  await p2.getByRole('button', { name: 'Başla' }).click();
  await expect(p2.locator(`[data-set-sira="1/${adimlar.split(',').length}"]`)).toBeVisible();
  await ev.close();

  // Geri: set hazırla ekranına döner.
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Geri' }).click();
  await expect(page.getByRole('main', { name: 'Set hazırla' })).toBeVisible();
  // Harf kâğıdı da karekodlu (bugünkü ses: kümenin en yenisi).
  await page.getByRole('button', { name: /harf kâğıdı, eve karekodlu$/ }).click();
  await expect(page.locator('.tk-kok--onizleme [data-eve-karekod="hazir"]')).toHaveCount(1);
  // Kâğıtlar menüsünden açılan kâğıtta (set bağlamı yok) karekod YOK: yalnız set kâğıdında.
  await ctx.close();
  const c2 = await browser.newContext({ baseURL: TUR_URL, viewport: { width: 1080, height: 810 }, hasTouch: true });
  const p3 = await c2.newPage();
  await sesKilidiniAc(p3, `/?ders=tur&device=${cihaz}&tur=1kv`);
  await p3.getByRole('button', { name: /^Kâğıtlar/ }).click();
  await p3.getByRole('button', { name: 'Dikte sayfası' }).click();
  await expect(p3.locator('.tk-kok--onizleme [data-tur-kagit="tur-dikte"]')).toBeVisible();
  await expect(p3.locator('[data-eve-karekod]')).toHaveCount(0);
  await c2.close();
});

test('karekodlu kâğıt telefon (390) ve masaüstü (1280) genişliğinde taşmaz', async ({ browser }, bilgi) => {
  test.skip(bilgi.project.name !== 'tablet', 'tek proje yeter');
  for (const [w, h] of [
    [390, 844],
    [1280, 800],
  ] as const) {
    const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: w, height: h }, hasTouch: true });
    const page = await ctx.newPage();
    await sesKilidiniAc(page, '/?ders=tur&device=tablet&tur=1kv&ekran=setHazirla');
    await geometriTemiz(page, `set hazırla ${w}`);
    await page.getByRole('button', { name: 'Dikte kâğıdı, eve karekodlu' }).click();
    await expect(page.locator('.tk-kok--onizleme [data-eve-karekod="hazir"]')).toHaveCount(1);
    await geometriTemiz(page, `kâğıt önizleme ${w}`);
    await ctx.close();
  }
});

async function coz(page: Page, secenek: { yanlisOnce: boolean; tekrarDinle: boolean }): Promise<string> {
  const main = page.locator('main[data-tur-etkinlik]');
  await expect(page.locator('[data-kartlar][data-satir]')).toBeVisible();
  const cevap = (await main.getAttribute('data-cevap')) ?? '';
  const tur = (await main.getAttribute('data-tur-kind')) ?? '';
  if (secenek.tekrarDinle) {
    await page.getByRole('button', { name: 'Tekrar dinle', exact: true }).click();
    await page.waitForTimeout(400);
  }
  if (tur === 'secim') {
    if (secenek.yanlisOnce) {
      await page.locator('[data-kart]').and(page.locator(`:not([data-kart="${cevap}"])`)).first().click();
      await page.waitForTimeout(400);
    }
    await page.locator(`[data-kart="${cevap}"]`).click();
  } else if (tur === 'eslestir') {
    for (const c of cevap.split('|').map((x) => x.split('-'))) {
      await page.locator(`[data-kart="${c[0]}"]`).click();
      await page.locator(`[data-kart="${c[1]}"]`).click();
    }
  } else if (tur === 'coklu') {
    for (const d of cevap.split('|')) await page.locator(`[data-kart="${d}"]`).click();
    await page.getByRole('button', { name: 'Onayla', exact: true }).click();
  } else {
    for (const parca of cevap.split('|'))
      await page.locator(`[data-kart][data-kart-metin="${parca}"]:not([data-kullanildi])`).first().click();
    await page.getByRole('button', { name: 'Onayla', exact: true }).click();
  }
  await expect(main).toHaveAttribute('data-durum', 'dogru');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Sonraki', exact: true }).click();
  return tur;
}

test('oturum özeti: set bitince nitel "Bu derste ne yaptık"; sayı/puan yok; ekrandan çıkınca silinir; depolama yazımı yok', async ({
  browser,
}, bilgi) => {
  test.setTimeout(240_000);
  test.skip(bilgi.project.name !== 'tablet', 'uzun akış tek projede');
  const ctx = await browser.newContext({ baseURL: TUR_URL, viewport: { width: 1080, height: 810 }, hasTouch: true });
  const page = await ctx.newPage();
  await sesKilidiniAc(page, '/?ders=tur&device=tablet&tur=1kv&ekran=setHazirla');
  await page.getByRole('button', { name: 'Seti başlat' }).click();
  const n = Number((await page.locator('[data-set-sira]').getAttribute('data-set-sira'))!.split('/')[1]);
  const once = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  const idbAd = () => page.evaluate(async () => ((await indexedDB.databases?.()) ?? []).map((d) => d.name).sort());
  const idbOnce = await idbAd();
  let yanlisVerildi = false;
  const turler: string[] = [];
  for (let i = 0; i < n; i++) {
    await expect(page.locator(`[data-set-sira="${i + 1}/${n}"]`)).toBeVisible();
    const tur = await page.locator('main[data-tur-etkinlik]').getAttribute('data-tur-kind');
    const yanlisOnce = !yanlisVerildi && i >= 1 && tur === 'secim';
    if (yanlisOnce) yanlisVerildi = true;
    turler.push(await coz(page, { yanlisOnce, tekrarDinle: i === 0 }));
  }
  const bitti = page.getByRole('main', { name: 'Set bitti' });
  await expect(bitti).toBeVisible();
  const ozet = bitti.locator('[data-oz-ekran] [data-oturum-ozeti]');
  await expect(ozet).toBeVisible();
  await expect(ozet.locator('[data-ozet="harfler"]')).toContainText('Harfler:');
  await expect(ozet.locator('[data-ozet="turler"]')).toContainText('Etkinlik türleri:');
  await expect(ozet.locator('li')).toHaveCount(n);
  await expect(ozet.locator('li[data-duzey="yardim"], li[data-duzey="birlikteVeYardim"]').first()).toBeVisible(); // 1. adımda "Tekrar dinle"
  if (yanlisVerildi) await expect(ozet.locator('li[data-duzey="birlikte"], li[data-duzey="birlikteVeYardim"]').first()).toBeVisible();
  const metin = (await ozet.textContent())!;
  expect(metin).not.toMatch(/%|puan|yüzde|saniye|dakika/i);
  await geometriTemiz(page, 'set bitti özeti');
  // Baskı kopyası #root dışında; yazdırmada yalnız özet görünür.
  await expect(page.locator('#tur-ozet-baski [data-oturum-ozeti]')).toBeHidden();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#tur-ozet-baski [data-oturum-ozeti]')).toBeVisible();
  await expect(page.locator('#root')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  // Hiçbir depoya yazılmadı: yerel depo ayarlı anahtarlar dışında değişmedi.
  const sonra = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(sonra).toBe(once);
  for (const k of Object.keys(JSON.parse(sonra) as Record<string, string>)) expect(IZINLI.has(k), k).toBe(true);
  expect(await idbAd()).toEqual(idbOnce); // yeni veritabanı açılmadı
  // Ekrandan çıkınca silinir: Bitir → set hazırla; yeniden başlatınca önceki özet yok.
  await page.getByRole('button', { name: 'Bitir' }).click();
  await expect(page.getByRole('main', { name: 'Set hazırla' })).toBeVisible();
  await expect(page.locator('[data-oturum-ozeti]')).toHaveCount(0);
  await expect(page.locator('#tur-ozet-baski')).toHaveCount(0);
  await ctx.close();
});
