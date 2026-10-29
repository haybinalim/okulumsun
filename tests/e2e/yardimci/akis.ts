import { expect, type Page } from '@playwright/test';
import { geometriIhlalleri } from './geometri';
// `window.__okulumsunE2E` tür bildirimi:
import type {} from '../../../src/dev/e2eKanca';

/**
 * Ortak akış adımları (plan v2 Adım 26). Alıştırmalar `window.__okulumsunE2E`
 * kancasıyla doğru cevaplanmış sayılır (yalnız geliştirme/test derlemesi,
 * src/dev/e2eKanca.ts); her ekranda geometri denetlenir.
 */

export async function geometriTemiz(page: Page, ekran: string): Promise<void> {
  const ihlal = await geometriIhlalleri(page);
  expect(ihlal, `${ekran}: erişim/boyut ihlali\n${ihlal}`).toBe('');
}

/**
 * Bir ses klibinin istendiğini (indirildiğini) bekler (KG-110). Playwright Chromium AAC çözemez; çalma
 * değil alım ölçülür (`e2eKanca.alinanKlipler`). Klip ekran talimatının parçasıysa ekranla birlikte istenir.
 */
export async function klipIstendi(
  page: Page,
  anahtar: string,
  /** KG-127: `istenenKlipler` = çalmak için istenen (bellek önbelleğinden de olsa). */
  liste: 'alinanKlipler' | 'istenenKlipler' = 'alinanKlipler',
): Promise<void> {
  try {
    await expect
      .poll(async () => (await page.evaluate((l) => window.__okulumsunE2E?.[l] ?? [], liste)).includes(anahtar), {
        message: `ses klibi bekleniyor: ${anahtar}`,
        timeout: 10_000,
      })
      .toBe(true);
  } catch (hata) {
    // Teşhis (Adım 54): CI'da yalnız günlük kalır; son alınan klipler ve ekran hataya eklenir.
    const durum = await page
      .evaluate(() => ({
        son: (window.__okulumsunE2E?.alinanKlipler ?? []).filter((k) => !/^(sayi|op|soru|geri|yardim|ui)\./.test(k)),
        ekran: [...document.querySelectorAll('[data-ekran]')].map((e) => e.getAttribute('data-ekran')),
      }))
      .catch(() => null);
    throw new Error(`${(hata as Error).message}\nteşhis: ${JSON.stringify(durum)}`);
  }
}

export async function sesKilidiniAc(page: Page, adres: string): Promise<void> {
  // Giriş animasyonları (ölçek 0→1) bitmiş yerleşimi ölçmek için; son geometri aynıdır.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(adres);
  await expect(page.getByRole('button', { name: 'Başla' })).toBeVisible();
  await geometriTemiz(page, 'ses kilidi');
  await page.getByRole('button', { name: 'Başla' }).click();
}

export async function kisiselModaGir(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Kendi başıma çalışacağım.' }).click();
  await expect(page.getByRole('button', { name: 'Kedi' })).toBeVisible();
  await geometriTemiz(page, 'avatar seçimi');
  await page.getByRole('button', { name: 'Kedi' }).click();
  await expect(page.getByRole('button', { name: 'Renk mor' })).toBeVisible();
  await geometriTemiz(page, 'renk seçimi');
  await page.getByRole('button', { name: 'Renk mor' }).click();
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible();
  await geometriTemiz(page, 'ana ekran');
}

/**
 * Ana ekrandan oturumu başlatır. Kişisel modda "Başla" (motor temayı seçer);
 * tahta modunda öğretmen temaya dokunur — ilk tema "Yön ve Yerler" her zaman açıktır.
 */
export async function temayiBaslat(page: Page): Promise<void> {
  const basla = page.getByRole('button', { name: 'Başla', exact: true });
  if (await basla.isVisible()) {
    await basla.click();
    await derinGirisiGec(page);
  } else await page.getByRole('button', { name: 'Yön ve Yerler', exact: true }).click();
}

/**
 * Kişisel modda oturumdaki ilk tema seçimi derin tema girişini açar (Adım 45, KG-112; ≈25–60 sn). Girişi
 * sınamayan testler yetişkinin "Girişi geç" düğmesiyle atlar. Giriş açılmazsa (kısa giriş, tahta) bir şey yapmaz.
 */
export async function derinGirisiGec(page: Page, bekleMs = 3_000): Promise<void> {
  const gec = page.getByRole('button', { name: 'Girişi geç', exact: true });
  try {
    await gec.waitFor({ state: 'visible', timeout: bekleMs });
  } catch {
    return;
  }
  await gec.click();
}

/** Yoklama döngülerinde: derin giriş ekranı görünüyorsa geçer (ara ödül ekranı gibi). */
async function derinGirisGorunuyorsaGec(page: Page): Promise<void> {
  const gec = page.getByRole('button', { name: 'Girişi geç', exact: true });
  if (await gec.isVisible()) await gec.click();
}

async function aktifAlistirma(page: Page): Promise<number | null> {
  return page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null);
}

/** `adet` alıştırmayı sırayla çözer; her birinde geometri denetlenir. Görülen tür listesini döner. */
export async function alistirmalariCoz(page: Page, adet: number): Promise<string[]> {
  const turler: string[] = [];
  let onceki: number | null = null;
  for (let i = 0; i < adet; i++) {
    await expect
      .poll(
        async () => {
          const a = await aktifAlistirma(page);
          if (a !== null && a !== onceki) return true;
          await derinGirisGorunuyorsaGec(page);
          // Oturum içi ara ödül ekranı (çıkartma) — dokununca sıradaki soruya geçer.
          const ara = page.getByRole('button', { name: 'Devam etmek için dokun' });
          if (await ara.isVisible()) {
            await geometriTemiz(page, 'ara ödül');
            await ara.click();
          }
          return false;
        },
        { message: `${i + 1}. alıştırma bekleniyor`, timeout: 15_000 },
      )
      .toBe(true);
    const simdiki = await aktifAlistirma(page);
    turler.push(await page.evaluate(() => window.__okulumsunE2E!.alistirma!.kind));
    await geometriTemiz(page, `${i + 1}. alıştırma (${turler.at(-1)})`);
    expect(await page.evaluate(() => window.__okulumsunE2E!.dogruCevapla())).toBe(true);
    onceki = simdiki;
    // Bir sonraki alıştırma (veya oturum sonu) gelene kadar bekle.
    await expect.poll(() => aktifAlistirma(page), { timeout: 15_000 }).not.toBe(simdiki);
  }
  return turler;
}

/**
 * Kişisel oturumu sonuna kadar çözer. Motor havuza göre en çok 8 soru seçer
 * (OTURUM_SORU_SAYISI); havuz darsa daha az olabilir. Oturum sonu ekranı ≤2 sn
 * sonra kendiliğinden Bahçem'e geçtiği için ikisinden biri beklenir.
 */
export async function oturumuBitir(page: Page): Promise<number> {
  const son = page.getByRole('button', { name: /^(Bahçem|Ev)$/ });
  let onceki: number | null = null;
  let adet = 0;
  for (;;) {
    let durum: 'soru' | 'son' = 'soru';
    await expect
      .poll(
        async () => {
          const a = await aktifAlistirma(page);
          if (a !== null && a !== onceki) return (durum = 'soru');
          if (await son.first().isVisible()) return (durum = 'son');
          await derinGirisGorunuyorsaGec(page);
          const ara = page.getByRole('button', { name: 'Devam etmek için dokun' });
          if (await ara.isVisible()) {
            await geometriTemiz(page, 'ara ödül');
            await ara.click();
          }
          return null;
        },
        { message: `${adet + 1}. alıştırma veya oturum sonu bekleniyor`, timeout: 15_000 },
      )
      .not.toBeNull();
    if (durum === 'son') return adet;
    expect(adet, 'oturum 8 sorudan uzun').toBeLessThan(8);
    onceki = await aktifAlistirma(page);
    const tur = await page.evaluate(() => window.__okulumsunE2E!.alistirma!.kind);
    await geometriTemiz(page, `${adet + 1}. alıştırma (${tur})`);
    expect(await page.evaluate(() => window.__okulumsunE2E!.dogruCevapla())).toBe(true);
    adet += 1;
  }
}

/** Ana ekrandaki Ayarlar dişlisinden veli kapısını geçip yetişkin alanını açar (Adım 27). */
export async function yetiskinAlaniniAc(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Ayarlar' }).click();
  const sirali = await page.locator('button[aria-label$="sıradaki sayı olarak seç"]').evaluateAll((b) =>
    b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a),
  );
  for (const sayi of sirali) await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await expect(page.getByRole('heading', { name: /Yetişkin alanı|Öğretmen alanı/ })).toBeVisible();
}
