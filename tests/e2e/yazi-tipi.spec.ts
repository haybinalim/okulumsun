import { expect, test, type Page } from '@playwright/test';
import { alistirmalariCoz, kisiselModaGir, sesKilidiniAc, temayiBaslat, yetiskinAlaniniAc } from './yardimci/akis';

/**
 * KG-98: çocuk yüzeyi yalnız TemelYazi harf dosyasını indirir (fontta olmayan · – — … kaldırıldı; aksi hâlde
 * tarayıcı o karakter için Andika woff2 indirirdi); yetişkin yüzeyleri Andika'da kalır (KG-96). Ayrıca küçük
 * kart etiketleri okunur boyutta ve kartın içinde kalır.
 */

function fontIstekleri(page: Page): string[] {
  const liste: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith('/fonts/')) liste.push(u.pathname.slice('/fonts/'.length));
  });
  return liste;
}

const andika = (l: string[]) => l.filter((f) => f.startsWith('Andika'));

/** Ana ekrandaki konu kartı etiketleri: yazı boyutu ≥ eşik, kartın içinde (taşma yok), en çok iki satır. */
async function kartEtiketleriOkunur(page: Page, esik: number): Promise<void> {
  const olcum = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLButtonElement>('main button')]
      .map((b) => ({ b, span: [...b.querySelectorAll<HTMLSpanElement>(':scope > span')].find((s) => s.textContent?.trim() && !s.getAttribute('aria-hidden')) }))
      .filter((x) => x.span && x.b.getBoundingClientRect().width >= 110)
      .map(({ b, span }) => {
        const k = b.getBoundingClientRect();
        const s = span!.getBoundingClientRect();
        const st = getComputedStyle(span!);
        return {
          ad: span!.textContent!.trim(),
          boyut: parseFloat(st.fontSize),
          satir: Math.round(s.height / parseFloat(st.lineHeight)),
          icinde: s.left >= k.left - 0.5 && s.right <= k.right + 0.5 && s.top >= k.top - 0.5 && s.bottom <= k.bottom + 0.5,
          tasma: span!.scrollWidth > span!.clientWidth + 1,
        };
      }),
  );
  expect(olcum.length, 'konu kartı bulunamadı').toBeGreaterThanOrEqual(7);
  for (const o of olcum) {
    expect(o.boyut, `${o.ad}: yazı boyutu`).toBeGreaterThanOrEqual(esik);
    expect(o.icinde && !o.tasma, `${o.ad}: kartın dışına taşıyor`).toBe(true);
    expect(o.satir, `${o.ad}: satır sayısı`).toBeLessThanOrEqual(2);
  }
}

test('tablet: çocuk akışında Andika indirilmez, kart etiketleri okunur; yetişkin alanı Andika', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'Tablet akışı.');
  test.setTimeout(90_000);
  const fontlar = fontIstekleri(page);

  await sesKilidiniAc(page, '/?device=tablet');
  await kisiselModaGir(page);
  await kartEtiketleriOkunur(page, 20);
  await temayiBaslat(page);
  await alistirmalariCoz(page, 3);
  await expect.poll(() => fontlar.includes('TemelYazi-Harf.woff2')).toBe(true);
  expect(andika(fontlar), 'çocuk yüzeyinde Andika isteği').toEqual([]);

  // Ana ekrana dön (yeniden yükle → mod seçimi → profil seçimi), oradan veli kapısı.
  await page.goto('/?device=tablet');
  await page.getByRole('button', { name: 'Başla' }).click();
  await page.getByRole('button', { name: 'Kendi başıma çalışacağım.' }).click();
  const kedi = page.getByRole('button', { name: 'Kedi' });
  const ayarlar = page.getByRole('button', { name: 'Ayarlar' });
  await expect(kedi.or(ayarlar).first()).toBeVisible();
  if (await kedi.isVisible()) {
    await kedi.click();
    await page.getByRole('button', { name: 'Renk mor' }).click();
  }
  await expect(ayarlar).toBeVisible();
  expect(andika(fontlar), 'çocuk yüzeyinde Andika isteği').toEqual([]);
  await yetiskinAlaniniAc(page);
  await expect.poll(() => andika(fontlar).length, { message: 'yetişkin alanı Andika indirmeli' }).toBeGreaterThan(0);
  const baslikYazisi = await page.getByRole('heading', { name: /Yetişkin alanı|Öğretmen alanı/ }).evaluate((h) => getComputedStyle(h).fontFamily);
  expect(baslikYazisi.startsWith("'TemelYaziRakam', Andika") || baslikYazisi.startsWith('TemelYaziRakam, Andika')).toBe(true);
});

test('tahta: ana ekran, konu seçimi ve Keşif Masası metni TemelYazi kapsamında; kart etiketleri ≥ 32 px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'board', 'Tahta akışı.');
  test.setTimeout(60_000);
  const fontlar = fontIstekleri(page);
  await page.addInitScript(() => {
    // Çocuk yüzeyine eklenen her metindeki · – — … (TemelYazi'de yok → Andika'ya düşer).
    const disari: string[] = [];
    (window as unknown as { __disari: string[] }).__disari = disari;
    const tara = (n: Node): void => {
      if (n.nodeType === Node.TEXT_NODE) {
        const el = n.parentElement;
        if (!el || el.closest('[data-yetiskin],[data-yazi="yetiskin"],[data-harness],style,script')) return;
        if (/[·–—…]/.test(n.textContent ?? '')) disari.push((n.textContent ?? '').trim().slice(0, 40));
      } else n.childNodes.forEach(tara);
    };
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(tara))).observe(document, { subtree: true, childList: true });
  });

  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
  await kartEtiketleriOkunur(page, 32);
  // Yönerge şeridinin alt metni de aynı ölçüde (tahtada 32 px).
  const serit = await page.locator('aside span').first().evaluate((s) => parseFloat(getComputedStyle(s).fontSize));
  expect(serit).toBeGreaterThanOrEqual(32);
  await page.getByRole('button', { name: 'Yön ve Yerler', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Geri', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Geri', exact: true }).click();
  await page.getByRole('button', { name: 'Keşif Masası' }).first().click();
  await expect(page.getByRole('button', { name: 'Sayı doğrusu' })).toBeVisible();
  await expect.poll(() => fontlar.includes('TemelYazi-Harf.woff2')).toBe(true);
  // Tahtada "Öğretmen" ve "Dersi bitir" yetişkin düğmeleri (data-yetiskin) bilerek Andika indirir; bu yüzden
  // burada istek değil, gezilen çocuk ekranlarındaki metnin karakterleri denetlenir.
  expect(await page.evaluate(() => (window as unknown as { __disari: string[] }).__disari)).toEqual([]);
});

test('kâğıt görünümü (?arsiv=): etki formu ve arşiv kâğıdı Andika indirmez; kod metni aynı', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'Tek projede yeter.');
  const fontlar = fontIstekleri(page);
  for (const kod of ['ETKI-1-A', 'OK-1.de.2t-6-2x3-y', 'OK-1.a2.2t-6-2x3-y']) {
    await page.goto(`/?arsiv=${kod}`);
    await expect(page.locator('[data-arsiv-hazir]')).toBeAttached();
    await expect(page.getByRole('status')).toHaveText(`Kâğıt kodu: ${kod}`);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(fontlar).toContain('TemelYazi-Harf.woff2');
  expect(andika(fontlar), 'kâğıtta Andika isteği').toEqual([]);
});
