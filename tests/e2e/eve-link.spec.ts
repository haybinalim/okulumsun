import { expect, test } from '@playwright/test';
import { geometriTemiz } from './yardimci/akis';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';
import { EVE_LINK_ORNEGI } from './yardimci/eveLinkOrnegi';

/**
 * Plan v2 Adım 42 aşama 2 (ADR-0010): öğretmenin eve link'iyle açılış → ses kilidi → 8 soru (set tabanlı)
 * → kutlama → Ev. Hash açılışta adresten silinir; ağ isteklerinde set kodu yok; depolama boş.
 */

async function aktif(page: import('@playwright/test').Page): Promise<number | null> {
  return page.evaluate(() => window.__okulumsunE2E?.alistirma?.sira ?? null);
}

test('eve link: 8 soru → kutlama; hash silinir, ağda yok, depolama boş', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const ag = agKaydet(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/?device=tablet${EVE_LINK_ORNEGI.hash}`);
  // Açılışta hash adresten hemen silinir (geçmişte kalmaz).
  await expect.poll(() => new URL(page.url()).hash).toBe('');
  expect(new URL(page.url()).search).toBe('?device=tablet');

  await expect(page.getByRole('button', { name: 'Başla' })).toBeVisible();
  await page.getByRole('button', { name: 'Başla' }).click();

  const sablonlar: string[] = [];
  let onceki: number | null = null;
  for (let i = 0; i < 8; i++) {
    await expect
      .poll(async () => (await aktif(page)) !== null && (await aktif(page)) !== onceki, { timeout: 15_000 })
      .toBe(true);
    onceki = await aktif(page);
    sablonlar.push((await page.evaluate(() => window.__okulumsunE2E!.alistirma!.itemId)).split('#')[0]!);
    if (i === 0) await geometriTemiz(page, 'ev çalışması 1. soru');
    expect(await page.evaluate(() => window.__okulumsunE2E!.dogruCevapla())).toBe(true);
  }
  // Set tabanlı: yalnız iki düğümün şablonları (M-KONUM ve sayma).
  expect(new Set(sablonlar).size).toBeLessThanOrEqual(2);
  expect(sablonlar).toContain('M-KONUM');

  await expect(page.getByRole('main', { name: 'Ev çalışması bitti' })).toBeVisible();
  // Azaltılmış harekette kutlama kendiliğinden bitmez; çocuk dokunur.
  await page.getByRole('button', { name: 'Devam etmek için dokun' }).click();
  await geometriTemiz(page, 'ev çalışması sonu');
  await page.getByRole('button', { name: 'Ev', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' })).toBeVisible();

  // Gizlilik: set kodu hiçbir isteğe girmedi; köken dışı/gövdeli istek yok; depolama boş.
  const kod = EVE_LINK_ORNEGI.setKodu;
  expect(ag.istekler.filter((r) => r.url.includes(kod) || r.url.includes('ev='))).toEqual([]);
  expect(agIhlalleri(ag.istekler, new URL(baseURL!).origin)).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('eve link: bozuk/fazla alanlı bağlantı → olağan açılış, hash yine silinir', async ({ page }) => {
  await page.goto(`/?device=tablet${EVE_LINK_ORNEGI.hash}&ad=ali`);
  await expect.poll(() => new URL(page.url()).hash).toBe('');
  await page.getByRole('button', { name: 'Başla' }).click();
  await expect(page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' })).toBeVisible();
});
