import { expect, test, type Page } from '@playwright/test';
import { alistirmalariCoz, geometriTemiz, sesKilidiniAc, temayiBaslat } from './yardimci/akis';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';

/**
 * Plan v2 Adım 55: kapsayıcılık ayarları tahtada. 64 kombinasyonun 4 temsilcisi `#ayar=` ile açılır;
 * her ekranda tahta geometrisi (üst %35 ölü bölge + `--size-tap-min`, büyük hedefte 118 px) ve
 * taşma (her dokunulabilir öğe pencerenin içinde) denetlenir. Sol el alt çubuğu aynalar.
 */

const TEMSILCILER = [
  { kod: 'b', ad: 'yalnız büyük hedef' },
  { kod: 'sb', ad: 'sol el + büyük hedef' },
  { kod: 'ph', ad: 'renk körlüğü paleti + hareket azalt' },
  { kod: 'trpsbh', ad: 'hepsi açık' },
] as const;

/** Görünür her dokunulabilir öğe pencerenin içinde mi (alt %65'te taşma yok)? */
async function tasmaIhlalleri(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('button, a, input, select, [role="button"]')) {
      if (el.closest('[data-harness]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === 'hidden') continue;
      if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) {
        out.push(
          `${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 24)} (${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)})`,
        );
      }
    }
    return out;
  });
}

async function konuSec(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Geri', exact: true })).toBeVisible();
  const konu = page.locator('button:not([disabled])').filter({ hasNotText: /^(Geri|Yardım)$/ });
  const etiketler = await konu.evaluateAll((b) => b.map((x) => x.getAttribute('aria-label') ?? x.textContent ?? ''));
  const ilk = etiketler.find((e) => e && !/Geri|Ana menü|Yardım|Yönergeyi|tekrar dinle|Tema turu/i.test(e));
  expect(ilk, `açık konu yok: ${etiketler.join(' | ')}`).toBeTruthy();
  await page.getByRole('button', { name: ilk!, exact: true }).first().click();
}

for (const { kod, ad } of TEMSILCILER) {
  test(`kapsayıcılık (${ad}): #ayar=1.${kod} → tahta akışı, geometri ve taşma temiz`, async ({ page, baseURL }) => {
    test.setTimeout(90_000);
    const ag = agKaydet(page);
    await sesKilidiniAc(page, `/?device=board#ayar=1.${kod}`);

    const kok = await page.evaluate(() => ({
      dataset: { ...document.documentElement.dataset },
      tapMin: getComputedStyle(document.documentElement).getPropertyValue('--size-tap-min').trim(),
      dogru: getComputedStyle(document.documentElement).getPropertyValue('--color-correct').trim(),
      hash: location.hash,
    }));
    expect(kok.hash).toBe(`#ayar=1.${kod}`);
    expect(kok.tapMin).toBe(kod.includes('b') ? '118px' : '102px');
    expect(kok.dataset.solEl).toBe(kod.includes('s') ? '1' : undefined);
    expect(kok.dataset.hareketAzalt).toBe(kod.includes('h') ? '1' : undefined);
    expect(kok.dogru.toUpperCase()).toBe(kod.includes('p') ? '#0B5FA5' : '#16A34A');

    await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
    await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
    await geometriTemiz(page, 'ana ekran (tahta)');
    expect(await tasmaIhlalleri(page), 'ana ekran taşma').toEqual([]);
    await temayiBaslat(page);
    await konuSec(page);

    // İlk alıştırmada alt çubuk yönü ve taşma; sonra 3 soru (her birinde geometri).
    const onayla = page.getByRole('button', { name: 'Onayla' });
    const dinle = page.getByRole('button', { name: /tekrar dinle/i });
    await expect(onayla).toBeVisible();
    await expect(dinle).toBeVisible();
    const [o, d] = [await onayla.boundingBox(), await dinle.boundingBox()];
    if (kod.includes('s')) expect(o!.x, 'sol el: Onayla solda').toBeLessThan(d!.x);
    else expect(o!.x, 'varsayılan: Onayla sağda').toBeGreaterThan(d!.x);
    expect(await tasmaIhlalleri(page), 'alıştırma taşma').toEqual([]);

    const turler = await alistirmalariCoz(page, 3);
    expect(turler).toHaveLength(3);
    expect(await tasmaIhlalleri(page), 'son ekran taşma').toEqual([]);

    // Hash yer imi için adreste kalır; depolama boş; hash ağa gitmez.
    expect(await page.evaluate(() => location.hash)).toBe(`#ayar=1.${kod}`);
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
    expect(agIhlalleri(ag.istekler, new URL(baseURL!).origin)).toEqual([]);
    expect(ag.istekler.some((i) => i.url.includes('ayar='))).toBe(false);
  });
}

test('kapsayıcılık: bozuk #ayar= adresten silinir, uygulama varsayılanla açılır', async ({ page }) => {
  await sesKilidiniAc(page, '/?device=board#ayar=1.zz');
  const kok = await page.evaluate(() => ({
    hash: location.hash,
    tapMin: getComputedStyle(document.documentElement).getPropertyValue('--size-tap-min').trim(),
  }));
  expect(kok.hash).toBe('');
  expect(kok.tapMin).toBe('102px');
});

test('kapsayıcılık: öğretmen alanında Sol el + Büyük hedef açılır → adres çubuğunda ayar kodu', async ({ page }) => {
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Ayarlar' }).click();
  const sayilar = await page
    .locator('button[aria-label$="sıradaki sayı olarak seç"]')
    .evaluateAll((b) => b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a));
  for (const sayi of sayilar) await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await expect(page.getByRole('heading', { name: 'Kapsayıcılık' })).toBeVisible();

  await page.getByRole('button', { name: 'Sol el: kapalı' }).click();
  await page.getByRole('button', { name: 'Büyük hedef: kapalı' }).click();
  await expect(page.getByRole('button', { name: 'Sol el: açık' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#ayar=1.sb');
  await expect(page.getByTestId('ayar-kodu')).toContainText('#ayar=1.sb');
  const kok = await page.evaluate(() => ({
    solEl: document.documentElement.dataset.solEl,
    tapMin: getComputedStyle(document.documentElement).getPropertyValue('--size-tap-min').trim(),
  }));
  expect(kok).toEqual({ solEl: '1', tapMin: '118px' });

  // Kapatınca hash temizlenir; depolamaya yazılmaz. BigButton aynı düğmede 250 ms içindeki ikinci
  // dokunuşu çift dokunuş sayıp yutar (MOTION.tapCooldown); öğretmen hızında beklenir.
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Sol el: açık' }).click();
  await page.getByRole('button', { name: 'Büyük hedef: açık' }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});
