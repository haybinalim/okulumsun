import { expect, test, type Page } from '@playwright/test';
import { geometriTemiz, klipIstendi, sesKilidiniAc } from './yardimci/akis';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';

/**
 * Plan v2 Adım 44 aşama 2 (KG-64): tahtada Keşif Masası — ana ekrandan giriş, beş araç (onluk çerçeve,
 * nesneler, sayı doğrusu, terazi, ayır-birleştir; aşama 3) erişim bölgesinde ve ≥102 px; dokunuşlar sayıyı değiştirir, sınır 20'de durur;
 * azaltılmış harekette animasyon yok; ağ ve depolama temiz.
 */

const sayi = (page: Page) => page.getByRole('main', { name: 'Keşif Masası' }).getAttribute('data-kesif-sayi');

test('tahta: Keşif Masası beş araç, geometri ve sınırlar', async ({ page, baseURL }) => {
  test.setTimeout(90_000);
  const ag = agKaydet(page);
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await expect(page.getByRole('button', { name: 'Keşif Masası' })).toBeVisible();
  await geometriTemiz(page, 'ana ekran (tahta, Keşif Masası girişi)');
  await page.getByRole('button', { name: 'Keşif Masası' }).click();

  // Onluk çerçeve (varsayılan): 20 göz.
  await expect(page.getByRole('main', { name: 'Keşif Masası' })).toHaveAttribute('data-kesif-arac', 'onlukCerceve');
  await klipIstendi(page, 'kesif.hosgeldin');
  await expect(page.getByRole('button', { name: /^Göz \d+/ })).toHaveCount(20);
  // KG-120: 1920×1080 tahtada iki onluk yan yana sığar → geçiş düğmesi yok.
  await expect(page.getByRole('button', { name: 'İkinci onluk', exact: true })).toHaveCount(0);
  await geometriTemiz(page, 'Keşif Masası — onluk çerçeve');
  await page.getByRole('button', { name: 'Göz 3, boş' }).click();
  await page.getByRole('button', { name: 'Göz 12, boş' }).click();
  await expect.poll(() => sayi(page)).toBe('2');
  await page.waitForTimeout(260); // aynı düğmeye ardışık dokunuş soğuması (250 ms)
  await page.getByRole('button', { name: 'Göz 3, dolu' }).click();
  await expect.poll(() => sayi(page)).toBe('1');
  // Azaltılmış hareket: sayaç anında tam görünür (ölçek/saydamlık animasyonu yok).
  const stil = await page
    .getByRole('button', { name: 'Göz 12, dolu' })
    .locator('span:has(> svg)')
    .evaluate((el) => ({ op: getComputedStyle(el).opacity, tr: getComputedStyle(el).transform }));
  expect(stil.op).toBe('1');
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(stil.tr);

  // Nesneler: +1 ile 22 kez → 20'de durur; nesneye dokunmak bir çıkarır.
  await page.getByRole('button', { name: 'Nesneler' }).click();
  await expect.poll(() => sayi(page)).toBe('0');
  // Aynı düğmeye ardışık dokunuşlar arasında 250 ms soğuma var (BigButton); her dokunuşu bekle.
  for (let i = 1; i <= 22; i++) {
    await page.getByRole('button', { name: 'Bir ekle' }).click();
    await expect.poll(() => sayi(page)).toBe(String(Math.min(i, 20)));
    await page.waitForTimeout(260);
  }
  await expect.poll(() => sayi(page)).toBe('20');
  await geometriTemiz(page, 'Keşif Masası — 20 nesne');
  await page.getByRole('button', { name: 'Nesne 5', exact: true }).click();
  await expect.poll(() => sayi(page)).toBe('19');

  // Sayı doğrusu: noktaya zıpla, pencere 10'u geçince kayar.
  await page.getByRole('button', { name: 'Sayı doğrusu' }).click();
  await geometriTemiz(page, 'Keşif Masası — sayı doğrusu');
  await page.getByRole('button', { name: 'Sayı 10', exact: true }).click();
  await expect.poll(() => sayi(page)).toBe('10');
  await page.waitForTimeout(260);
  await page.getByRole('button', { name: 'Bir ekle' }).click();
  await expect.poll(() => sayi(page)).toBe('11');
  await expect(page.getByRole('button', { name: 'Sayı 20', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Baştan' }).click();
  await expect.poll(() => sayi(page)).toBe('0');

  // Terazi (aşama 3): kefe düğmeleri; genel +1/−1 yok; eşitlikte "=".
  await page.getByRole('button', { name: 'Terazi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bir ekle', exact: true })).toHaveCount(0);
  await geometriTemiz(page, 'Keşif Masası — terazi');
  await page.getByRole('button', { name: 'Sol kefeye bir ekle' }).click();
  await page.getByRole('button', { name: 'Sağ kefeye bir ekle' }).click();
  await expect(page.locator('[data-arac="terazi"]')).toHaveAttribute('data-egim', '0');
  await expect(page.locator('output')).toHaveText('1 = 1');
  await page.waitForTimeout(260);
  await page.getByRole('button', { name: 'Sağ kefeye bir ekle' }).click();
  await expect(page.locator('[data-arac="terazi"]')).toHaveAttribute('data-egim', '4');

  // Ayır ve birleştir (aşama 3): 5'i 2 + 3'e ayır, sonra birleştir.
  await page.getByRole('button', { name: 'Ayır ve birleştir', exact: true }).click();
  await geometriTemiz(page, 'Keşif Masası — ayır ve birleştir');
  await page.getByRole('button', { name: 'Sayaç 2, buradan ayır' }).click();
  await expect(page.locator('output')).toHaveText('2 + 3');
  await page.getByRole('button', { name: 'Birleştir', exact: true }).click();
  await expect(page.locator('output')).toHaveText('5');

  await page.getByRole('button', { name: 'Ana menü', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keşif Masası' })).toBeVisible();

  expect(agIhlalleri(ag.istekler, new URL(baseURL!).origin)).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

/** Ekrandaki tüm düğmeler görünüm alanının içinde mi (yatay/dikey kırpılan yok)? Taşanların listesi. */
async function ekranDisi(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1);
      })
      .map((b) => b.getAttribute('aria-label') ?? b.textContent ?? ''),
  );
}

test('küçük tahta 1080×810 (KG-120): tek onluk + "İkinci onluk", nesneler kırpılmaz, alt düğmeler ekranda', async ({
  page,
}) => {
  test.setTimeout(90_000);
  // Elle seçilen tahta profili küçük ekranda (KG-118 ölçümü). Ses kilidi tam ekran ister → boyut önce.
  await page.setViewportSize({ width: 1080, height: 810 });
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  // KG-126: açılıştan yerleşim oturana dek HER karede ölç — ara karede de göz üst %35'te, rakam ekran üstünde olmamalı
  // (azaltılmış harekette 0,01 ms'lik her-özellik geçişi bir kare eski gap'i çiziyordu; CI'da ara sıra yakalanıyordu).
  await kareKaydiniBaslat(page);
  await page.getByRole('button', { name: 'Keşif Masası' }).click();
  const masa = page.getByRole('main', { name: 'Keşif Masası' });
  await expect(masa).toHaveAttribute('data-kesif-arac', 'onlukCerceve');
  expect(await kareKaydiniBitir(page), 'ara karelerde erişim/rakam ihlali').toEqual([]);

  // Onluk çerçeve: bir onluk (10 göz) + geçiş düğmesi; ilk satır üst %35'in altında, hepsi ≥102 px.
  const arac = page.locator('[data-arac="onlukCerceve"]');
  await expect(page.getByRole('button', { name: /^Göz \d+/ }).first()).toBeVisible();
  // Eski yerleşimde: ilk 10 göz üst %35'te, alt düğme satırı ekran dışında (KG-118 ölçümü).
  await geometriTemiz(page, 'Keşif Masası 1080×810 — onluk çerçeve');
  expect(await ekranDisi(page), 'onluk çerçeve: ekran dışı düğme').toEqual([]);
  await expect(arac).toHaveAttribute('data-tek-onluk', 'true');
  await expect(page.getByRole('button', { name: /^Göz \d+/ })).toHaveCount(10);
  // Büyük rakam üstte kesilmez.
  expect(await page.locator('output').evaluate((o) => o.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);

  await page.getByRole('button', { name: 'Göz 3, boş' }).click();
  await expect.poll(() => sayi(page)).toBe('1');
  await page.getByRole('button', { name: 'İkinci onluk', exact: true }).click();
  await expect(arac).toHaveAttribute('data-onluk-gorunen', '1');
  await expect(page.getByRole('button', { name: 'Göz 11, boş' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Göz 3, dolu' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Göz 12, boş' }).click();
  await expect.poll(() => sayi(page)).toBe('2');
  await geometriTemiz(page, 'Keşif Masası 1080×810 — ikinci onluk');
  await page.waitForTimeout(260); // geçiş düğmesi aynı düğme: ardışık dokunuş soğuması (250 ms)
  await page.getByRole('button', { name: 'Birinci onluk', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Göz 3, dolu' })).toBeVisible();
  // +1 boş ilk göze (Göz 1) sayaç koyar; görünüm o onlukta kalır.
  await page.getByRole('button', { name: 'Bir ekle' }).click();
  await expect.poll(() => sayi(page)).toBe('3');
  await expect(arac).toHaveAttribute('data-onluk-gorunen', '0');

  // Nesneler: 20 nesneye kadar; 5'li iki sıra (bir onluk), 11. nesnede ikinci onluk açılır; yatay kırpılma yok.
  await page.getByRole('button', { name: 'Nesneler' }).click();
  await page.waitForTimeout(260); // "Bir ekle" az önce kullanıldı (soğuma)
  for (let i = 1; i <= 11; i++) {
    await page.getByRole('button', { name: 'Bir ekle' }).click();
    await expect.poll(() => sayi(page)).toBe(String(i));
    await page.waitForTimeout(260);
  }
  const nesneler = page.locator('[data-tek-onluk="true"]');
  await expect(nesneler).toHaveAttribute('data-onluk-gorunen', '1');
  await expect(page.getByRole('button', { name: /^Nesne \d+$/ })).toHaveCount(1);
  await geometriTemiz(page, 'Keşif Masası 1080×810 — nesneler (ikinci onluk)');
  expect(await ekranDisi(page), 'nesneler: ekran dışı düğme').toEqual([]);
  await page.waitForTimeout(260);
  await page.getByRole('button', { name: 'Birinci onluk', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Nesne \d+$/ })).toHaveCount(10);
  await geometriTemiz(page, 'Keşif Masası 1080×810 — nesneler (birinci onluk)');
  expect(await ekranDisi(page), 'nesneler: ekran dışı düğme').toEqual([]);
  await page.getByRole('button', { name: 'Nesne 4', exact: true }).click();
  await expect.poll(() => sayi(page)).toBe('10');
});

/**
 * KG-126: her animasyon karesinde göz düğmelerinin merkezini ve büyük rakamın üst kenarını kaydeder. Ölçüm
 * yalnız ilk yerleşimde değil, React'in ölçüme bağlı ikinci çiziminde ve geçişlerde de kuralı sınar.
 */
async function kareKaydiniBaslat(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __kareIhlal: string[]; __kareDur: boolean };
    w.__kareIhlal = [];
    w.__kareDur = false;
    const adim = () => {
      const main = document.querySelector('main[aria-label="Keşif Masası"]');
      if (main) {
        const sinir = innerHeight * 0.35;
        for (const b of main.querySelectorAll('button[aria-label^="Göz "]')) {
          const r = b.getBoundingClientRect();
          if (r.height > 0 && r.top + r.height / 2 < sinir - 1)
            w.__kareIhlal.push(`${b.getAttribute('aria-label')}: merkez ${Math.round(r.top + r.height / 2)}`);
        }
        const o = main.querySelector('output');
        if (o && o.getBoundingClientRect().top < -1)
          w.__kareIhlal.push(`rakam üstte kesik: ${Math.round(o.getBoundingClientRect().top)}`);
      }
      if (!w.__kareDur) requestAnimationFrame(adim);
    };
    requestAnimationFrame(adim);
  });
}

async function kareKaydiniBitir(page: Page): Promise<string[]> {
  await page.waitForTimeout(500); // ResizeObserver ve ölçüme bağlı ikinci çizim dahil
  return page.evaluate(() => {
    const w = window as unknown as { __kareIhlal: string[]; __kareDur: boolean };
    w.__kareDur = true;
    return [...new Set(w.__kareIhlal)];
  });
}
