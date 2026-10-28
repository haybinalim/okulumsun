import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';
import { agKaydet } from './yardimci/gizlilik';

/**
 * Plan v2 Adım 37 aşama 2 (KG-50): öğretmen haftalık MEB planını açar; "bu hafta" vurgusu, haftalar arası gezinme,
 * CSV/HTML yerel indirme (ağ isteği yok), seçili haftadan tahtada set ve çalışma kâğıdı; SetHazirla'da bu haftanın
 * önerisi. Tarayıcı saati 13 Ekim 2026'ya (5. öğretim haftası) sabitlenir. Tahta profili zorlanır.
 */
const BUGUN = new Date('2026-10-13T10:00:00');

async function ogretmenAlani(page: Page, boyut = { width: 1920, height: 1080 }): Promise<void> {
  await page.clock.setFixedTime(BUGUN);
  // Gerçek tahta çözünürlüğü: eylem satırları kaydırmasız sığmalı. (Ses kilidi tam ekran ister → boyut sonradan değişmez.)
  await page.setViewportSize(boyut);
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Öğretmen', exact: true }).click();
  const sirali = await page
    .locator('button[aria-label$="sıradaki sayı olarak seç"]')
    .evaluateAll((b) => b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a));
  for (const sayi of sirali) await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await expect(page.getByRole('heading', { name: 'Öğretmen alanı' })).toBeVisible();
}

async function planiAc(page: Page, boyut?: { width: number; height: number }): Promise<void> {
  await ogretmenAlani(page, boyut);
  await page.getByRole('button', { name: 'Haftalık planı aç' }).click();
  await expect(page.getByRole('heading', { name: 'Haftalık plan 2026–2027' })).toBeVisible();
}

const seciliHafta = (page: Page) => page.getByRole('region', { name: 'Seçili hafta' });

test('haftalık plan: bu hafta vurgulu, gezinme, geometri, yerel CSV/HTML indirme ağsız', async ({ page }) => {
  test.setTimeout(90_000);
  await planiAc(page);
  await expect(seciliHafta(page)).toContainText('5. hafta · 12.10.2026 haftası (bu hafta)');
  await expect(page.locator('tbody tr')).toHaveCount(37);
  await expect(page.locator('tbody tr[aria-current="true"]')).toContainText('12.10.2026');
  await geometriTemiz(page, 'haftalık plan');
  // KG-118: sığan ekranda son çare kaydırma devreye girmez.
  expect(await page.locator('main').evaluate((m) => m.scrollHeight > m.clientHeight + 1), '1920×1080: kaydırma yok').toBe(false);

  await page.getByRole('button', { name: 'Sonraki hafta' }).click();
  await expect(seciliHafta(page)).toContainText('6. hafta · 19.10.2026 haftası');
  await expect(seciliHafta(page)).not.toContainText('(bu hafta)');
  await page.getByRole('button', { name: 'Bu hafta', exact: true }).click();
  await expect(seciliHafta(page)).toContainText('5. hafta');
  await geometriTemiz(page, 'haftalık plan (gezinme sonrası)');

  // İndirme: Blob + <a download>; yalnız bu adımlar sırasında ağ kaydı.
  const ag = agKaydet(page);
  const [csv] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Planı CSV indir' }).click(),
  ]);
  expect(csv.suggestedFilename()).toBe('okulumsun-haftalik-plan-2026-2027.csv');
  const csvMetni = readFileSync((await csv.path())!, 'utf8');
  expect(csvMetni.startsWith('\uFEFFHafta;Pazartesi;Tema;Kazanımlar;Etkinlikler;Not\r\n')).toBe(true);
  expect(csvMetni.trimEnd().split('\r\n')).toHaveLength(38);
  expect(csvMetni).toContain('5;12.10.2026;');

  const [html] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Yazdırılabilir planı indir' }).click(),
  ]);
  expect(html.suggestedFilename()).toBe('okulumsun-haftalik-plan-2026-2027.html');
  expect(readFileSync((await html.path())!, 'utf8')).toContain(
    '<title>1. sınıf matematik haftalık plan 2026-2027</title>',
  );
  await expect(page.getByRole('status').filter({ hasText: 'indirildi' })).toBeVisible();
  expect(ag.istekler.filter((i) => !/^(data|blob):/.test(i.url)).map((i) => i.url)).toEqual([]);
  expect(ag.soketler).toEqual([]);

  // Hiçbir şey saklanmadı.
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('haftalık plan: seçili haftanın seti tahtada başlar', async ({ page }) => {
  test.setTimeout(90_000);
  await planiAc(page);
  await page.getByRole('button', { name: 'Bu haftanın setini tahtada başlat' }).click();
  await expect
    .poll(() => page.evaluate(() => window.__okulumsunE2E?.alistirma?.itemId ?? null), { timeout: 15_000 })
    .not.toBeNull();
  // Soru ekranı geometrisi burada denetlenmez: set soruları bugunun-seti/board-* testlerinde, sayma (M-SAY)
  // ekranı tahta/tablet profillerinde say-yerlesimi.spec.ts'te denetlenir (KG-50 notundaki eksik KG-86 ile kapandı).
  await page.getByRole('button', { name: 'Seti bitir' }).click();
  await expect(page.getByRole('button', { name: 'Öğretmen', exact: true })).toBeVisible();
});

test('haftalık plan: bu haftanın kâğıdı, Geri plana döner', async ({ page }) => {
  test.setTimeout(90_000);
  await planiAc(page);
  await page.getByRole('button', { name: 'Bu haftanın kâğıdı' }).click();
  await expect(page.getByRole('heading', { name: 'Çalışma kâğıdı' })).toBeVisible();
  await expect(page.locator('[data-kagit-onizleme] .kg-sayfa').first()).toBeVisible();
  await page.getByRole('button', { name: 'Geri', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Haftalık plan 2026–2027' })).toBeVisible();
});

test('set hazırla: bu haftanın önerisi tek dokunuşla seçilir', async ({ page }) => {
  test.setTimeout(90_000);
  await ogretmenAlani(page);
  await page.getByRole('button', { name: 'Bugünün setini hazırla' }).click();
  await expect(page.getByText('Henüz seçim yok.')).toBeVisible();
  await expect(page.getByText(/^Bu haftanın önerisi \(5\. hafta\): /)).toBeVisible();
  await page.getByRole('button', { name: 'Bu haftanın önerisini seç' }).click();
  await expect(page.getByText(/^[1-4]\/4 seçildi$/)).toBeVisible();
  await geometriTemiz(page, 'set hazırla (öneri seçili)');
  const baslat = page.getByRole('button', { name: 'Tahtada başlat' });
  await expect(baslat).not.toHaveAttribute('aria-disabled', 'true');
});

/**
 * KG-118: tablet boyutunda elle seçilen tahta (1080×810 + tahta profili) — eskiden başlık %30'da kırpılıyor
 * ("Etkinlikler" satırı kesik), tablo 4 px'e iniyor, "Bu haftanın kâğıdı" / "Tahtada başlat" ekranın altında
 * kırpılıp erişilemiyordu (main `overflow: hidden`). Şimdi: başlık tam, tablo görünür, sığmayınca main kayar ve
 * alt eylemler kaydırınca ekrana girer. 1920×1080'de kaydırma yok (yerleşim aynı).
 */
test('haftalık plan: küçük tahtada (1080×810) başlık kırpılmaz, alt eylemler kaydırınca erişilir', async ({ page }) => {
  test.setTimeout(90_000);
  await planiAc(page, { width: 1080, height: 810 });
  const kaydirilabilir = () =>
    page.locator('main').evaluate((m) => m.scrollHeight > m.clientHeight + 1);
  await expect(seciliHafta(page)).toContainText('Etkinlikler:');
  const olc = await page.evaluate(() => {
    const baslik = document.querySelector('main > header')!.getBoundingClientRect();
    const satirlar = [...document.querySelectorAll('main > header p')].map((p) => p.getBoundingClientRect());
    const tablo = document.querySelector('main table')!.parentElement!.getBoundingClientRect();
    return { kirpik: satirlar.filter((r) => r.bottom > baslik.bottom + 1).length, tabloYuksekligi: tablo.height };
  });
  expect(olc.kirpik, 'başlıkta kırpılan satır').toBe(0);
  expect(olc.tabloYuksekligi, 'tablo görünür kalır').toBeGreaterThan(100);
  expect(await kaydirilabilir(), '1080×810 tahta: sığmıyor → main kayar').toBe(true);

  // Kullanıcı gibi kaydır (scrollIntoView değil): main'in sonuna in, iki eylem de ekranda.
  await page.locator('main').evaluate((m) => m.scrollTo(0, m.scrollHeight));
  for (const ad of ['Bu haftanın kâğıdı', 'Bu haftanın setini tahtada başlat']) {
    const r = await page.getByRole('button', { name: ad }).boundingBox();
    expect(r, ad).not.toBeNull();
    expect(r!.y + r!.height, `${ad}: ekranın içinde`).toBeLessThanOrEqual(810 + 1);
    expect(r!.y, `${ad}: ekranın içinde`).toBeGreaterThanOrEqual(0);
  }
});
