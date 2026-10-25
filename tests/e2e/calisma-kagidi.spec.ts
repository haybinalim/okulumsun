import { expect, test, type Page } from '@playwright/test';
import { BASKI_BEYANI_IFADESI, sayfaUyusmazligi, type BaskiBeyani } from '../../scripts/denetim/pdfSayfa';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';

/**
 * Plan v2 Adım 35: öğretmen bugünün setinden A4 çalışma kâğıdı + cevap anahtarı hazırlar.
 * Tahta profili zorlanır (hem board hem tablet projesinde koşar). Yazdırma: `emulateMedia('print')` + `page.pdf`.
 */
const MM = 96 / 25.4;

async function kagitEkraninaGit(page: Page, kareler = 3): Promise<void> {
  // Gerçek akıllı tahta çözünürlüğü: ayar satırları kaydırmasız sığmalı (geometri denetimi kaydırılmış öğeyi ihlal sayar).
  await page.setViewportSize({ width: 1920, height: 1080 });
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Öğretmen', exact: true }).click();
  const sirali = await page.locator('button[aria-label$="sıradaki sayı olarak seç"]').evaluateAll((b) =>
    b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a),
  );
  for (const sayi of sirali) await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await page.getByRole('button', { name: 'Bugünün setini hazırla' }).click();
  await page.getByRole('button', { name: 'Sayılar', exact: true }).click();
  const kartlar = page.locator('section[aria-label="Etkinlikler"] button:not([aria-label="Bu haftanın önerisini seç"])');
  for (let i = 0; i < kareler; i++) await kartlar.nth(i).click();
  // Tohum tarayıcı saatinden türer: görsel taban ve karşılaştırma için sabitle (yalnız bu tıklama süresince).
  await page.evaluate(() => {
    const w = window as unknown as { __pn?: () => number };
    w.__pn = performance.now.bind(performance);
    performance.now = () => 4242;
  });
  await page.getByRole('button', { name: 'Çalışma kâğıdı yazdır' }).click();
  await page.evaluate(() => {
    const w = window as unknown as { __pn?: () => number };
    if (w.__pn) performance.now = w.__pn;
  });
  await expect(page.getByRole('heading', { name: 'Çalışma kâğıdı' })).toBeVisible();
  await expect(page.locator('[data-kagit-onizleme] .kg-sayfa').first()).toBeVisible();
}

const onizlemeSayfalari = (page: Page) => page.locator('[data-kagit-onizleme] .kg-sayfa');

test('kâğıt: 8 madde → 2 soru sayfası + cevap anahtarı; geometri temiz; kutular ≥ 25 mm; PDF sayfa sayısı', async ({ page }) => {
  test.setTimeout(120_000);
  await kagitEkraninaGit(page);
  await geometriTemiz(page, 'çalışma kâğıdı');

  await page.getByRole('button', { name: 'Madde sayısı: 8' }).click();
  await expect(onizlemeSayfalari(page)).toHaveCount(3);
  await geometriTemiz(page, 'çalışma kâğıdı (8 madde)');
  await expect(page.locator('[data-kagit-onizleme] .kg-madde')).toHaveCount(8);

  // Kâğıt kodu ekranda ve altbilgide.
  const kod = (await page.locator('[data-kagit-durum]').innerText()).match(/OK-[a-z0-9.]+-8-2x3-d/)?.[0];
  expect(kod).toBeTruthy();
  await expect(page.locator('[data-kagit-onizleme] .kg-alt').first()).toContainText(kod!);
  await expect(page.locator('[data-kagit-onizleme] .kg-alt').first()).toContainText('okulumsun, MEB 2024 1. sınıf matematik');
  await expect(page.locator('[data-kagit-onizleme] .kg-alt').first()).toContainText('Sayfa 1 / 3');
  await expect(page.locator('[data-kagit-onizleme] .kg-ust').first()).toContainText('Adım:');

  // Cevap anahtarı: her madde için doğru cevap, "yanlış" kelimesi yok.
  const anahtar = page.locator('[data-kagit-onizleme] .kg-anahtar');
  await expect(anahtar.locator('tbody tr')).toHaveCount(8);
  expect((await anahtar.innerText()).toLowerCase()).not.toContain('yanlış');

  // Yazdırma görünümü: kabuk gizli, yalnız kâğıt; seçenek kutuları ≥ 25×25 mm, madde taşması yok.
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#root')).toBeHidden();
  const olcu = await page.evaluate(() => {
    const kok = document.querySelector('#kagit-baski .kg-kok--baski')!;
    const kutular = [...kok.querySelectorAll<HTMLElement>('.kg-secenek')].map((e) => {
      const r = e.getBoundingClientRect();
      return { w: r.width, h: r.height };
    });
    const tasan = [...kok.querySelectorAll<HTMLElement>('.kg-madde')]
      .filter((e) => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1)
      .map((e) => `${e.dataset.sablon}#${e.dataset.madde}`);
    const sayfalar = kok.querySelectorAll('.kg-sayfa').length;
    return { kutular, tasan, sayfalar };
  });
  expect(olcu.sayfalar).toBe(3);
  expect(olcu.kutular.length).toBeGreaterThan(0);
  for (const k of olcu.kutular) {
    expect(k.w).toBeGreaterThanOrEqual(25 * MM);
    expect(k.h).toBeGreaterThanOrEqual(25 * MM);
  }
  expect(olcu.tasan, `taşan maddeler: ${olcu.tasan.join(', ')}`).toEqual([]);

  // Çevrimdışı PDF: A4 sayfa sayısı = 2 soru + 1 anahtar.
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const sayfaSayisi = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  expect(sayfaSayisi).toBe(3);
});

test('kâğıt: aynı ayarlar → aynı SVG özeti; düzen ve madde sayısı sayfa sayısını belirler', async ({ page }) => {
  test.setTimeout(120_000);
  await kagitEkraninaGit(page);

  const ozet = () => onizlemeSayfalari(page).evaluateAll((s) => s.map((x) => x.innerHTML).join('|'));
  const ilk = await ozet();
  await page.getByRole('button', { name: 'Madde sayısı: 12' }).click();
  await expect(onizlemeSayfalari(page)).toHaveCount(3); // 12 madde 2x3 → 2 sayfa + anahtar (iki hücreli maddeler 3. sayfaya taşabilir)
  await page.getByRole('button', { name: 'Madde sayısı: 6' }).click();
  await expect(onizlemeSayfalari(page)).toHaveCount(2);
  expect(await ozet()).toBe(ilk);

  await page.getByRole('button', { name: 'Düzen: Tek sütun × 4 sıra' }).click();
  await page.getByRole('button', { name: 'Madde sayısı: 4' }).click();
  await expect(onizlemeSayfalari(page)).toHaveCount(2);
  await page.getByRole('button', { name: 'Cevap anahtarı dahil' }).click();
  await expect(onizlemeSayfalari(page)).toHaveCount(1);
  await geometriTemiz(page, 'çalışma kâğıdı (1x4, anahtarsız)');
});

/** KG-102: ekranın her seçeneğinde basılan PDF sayfa sayısı = altbilgideki "Sayfa n / N" toplamı. */
test('kâğıt: tüm seçeneklerde PDF sayfa sayısı = altbilgi toplamı', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'Seçenek taraması tek projede (yazdırma çıktısı profilden bağımsız).');
  test.setTimeout(240_000);
  await kagitEkraninaGit(page);
  const basili = async (aciklama: string) => {
    await page.emulateMedia({ media: 'print' });
    const beyan = await page.evaluate<BaskiBeyani>(BASKI_BEYANI_IFADESI);
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    expect(sayfaUyusmazligi(pdf, beyan), aciklama).toBeNull();
    await page.emulateMedia({ media: 'screen' });
  };
  const anahtar = page.getByRole('button', { name: 'Cevap anahtarı dahil' });
  for (const yanit of ['Daire içine al', 'Yazmalı da olur']) {
    await page.getByRole('button', { name: `Yanıt biçimi: ${yanit}` }).click();
    for (const duzen of ['2 sütun × 3 sıra', 'Tek sütun × 4 sıra']) {
      await page.getByRole('button', { name: `Düzen: ${duzen}` }).click();
      for (const madde of [4, 6, 8, 12]) {
        await page.getByRole('button', { name: `Madde sayısı: ${madde}` }).click();
        for (const dahil of ['true', 'false']) {
          if ((await anahtar.getAttribute('aria-pressed')) !== dahil) await anahtar.click();
          await basili(`${yanit}, ${duzen}, ${madde} madde, anahtar ${dahil}`);
        }
      }
    }
  }
  await page.getByRole('button', { name: 'Siyah-beyaz' }).click();
  await basili('siyah-beyaz');
});

test('kâğıt: depolamaya yazılmaz; yazdırma kopyası ekranda görünmez', async ({ page }) => {
  await kagitEkraninaGit(page);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  await expect(page.locator('#kagit-baski')).toBeHidden();
  await page.getByRole('button', { name: 'Siyah-beyaz' }).click();
  await expect(page.locator('[data-kagit-onizleme] .kg-kok--gri')).toHaveCount(1);
});

test('kâğıt: görsel taban (yazdırma ortamı, 2x3, 6 madde)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'Görsel taban tek projede tutulur.');
  await kagitEkraninaGit(page);
  await page.emulateMedia({ media: 'print' });
  const sayfa = page.locator('#kagit-baski .kg-sayfa').first();
  await expect(sayfa).toBeVisible();
  await expect(sayfa).toHaveScreenshot('kagit-2x3.png', { maxDiffPixelRatio: 0.03 });
});
