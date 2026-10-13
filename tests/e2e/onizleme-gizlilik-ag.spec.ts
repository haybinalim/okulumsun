import { expect, test } from '@playwright/test';
import { alistirmalariCoz, kisiselModaGir, oturumuBitir, temayiBaslat, yetiskinAlaniniAc } from './yardimci/akis';
import { agIhlalleri, agKaydet, depolamaDurumu, depolamaIhlalleri, kanitKaydet } from './yardimci/gizlilik';

/**
 * Plan v2 Adım 26 — gizlilik kanıtı (dinamik katman; statik katman K9 `gizlilik:tara`).
 * Üretim derlemesinde iki modun tam akışı boyunca: her istek aynı kökene ve GET,
 * gövdesiz; WebSocket yok. Akış sonunda localStorage ⊆ izin listesi, sessionStorage
 * ve çerez boş, IndexedDB yalnız boş `okulumsun` veritabanı.
 */
test.describe('gizlilik: ağ ve depolama', () => {
  test.skip(!!process.env.E2E_HEDEF_URL, 'E2E kancası yalnız test derlemesinde var.');

  test('kişisel mod: tam oturum + Bahçem', async ({ page }) => {
    test.setTimeout(120_000);
    const ag = agKaydet(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./?device=tablet');
    const koken = new URL(page.url()).origin;

    await page.getByRole('button', { name: 'Başla' }).click();
    await kisiselModaGir(page);
    await temayiBaslat(page);
    expect(await oturumuBitir(page)).toBeGreaterThanOrEqual(5);
    await page.getByRole('button', { name: 'Ev' }).click({ timeout: 15_000 });
    // Adım 27: tek kalıcı ayar (ekran boyutu) da akışta; yalnız izinli anahtarı yazmalı.
    await yetiskinAlaniniAc(page);
    await page.getByRole('group', { name: 'Ekran boyutu' }).getByRole('button', { name: 'Akıllı tahta' }).click();

    const depo = await depolamaDurumu(page);
    kanitKaydet('kişisel mod: tam oturum + Bahçem', koken, ag, depo);
    expect(agIhlalleri(ag.istekler, koken)).toEqual([]);
    expect(ag.soketler).toEqual([]);
    expect(depolamaIhlalleri(depo)).toEqual([]);
  });

  test('tahta modu: tema + 5 soru', async ({ page }) => {
    test.setTimeout(120_000);
    const ag = agKaydet(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./?device=board');
    const koken = new URL(page.url()).origin;

    await page.getByRole('button', { name: 'Başla' }).click();
    await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
    await temayiBaslat(page);
    const konu = page.locator('button:not([disabled])');
    const etiketler = await konu.evaluateAll((b) => b.map((x) => x.getAttribute('aria-label') ?? x.textContent ?? ''));
    const ilk = etiketler.find((e) => e && !/Geri|Yardım|Yönergeyi|Ayarlar/i.test(e));
    await page.getByRole('button', { name: ilk!, exact: true }).first().click();
    await alistirmalariCoz(page, 5);

    const depo = await depolamaDurumu(page);
    kanitKaydet('tahta modu: tema + 5 soru', koken, ag, depo);
    expect(agIhlalleri(ag.istekler, koken)).toEqual([]);
    expect(ag.soketler).toEqual([]);
    expect(depolamaIhlalleri(depo)).toEqual([]);
  });

  test('tahta modu: Sınıf Turu (2 takım, küçük kavanoz) baştan sona', async ({ page }) => {
    test.setTimeout(120_000);
    const ag = agKaydet(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./?device=board');
    const koken = new URL(page.url()).origin;

    await page.getByRole('button', { name: 'Başla' }).click();
    await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
    await page.getByRole('button', { name: 'Sınıf Turu', exact: true }).click();
    await page.getByRole('button', { name: '2 takım' }).click();
    await page.getByRole('button', { name: 'Küçük kavanoz' }).click();
    await page.getByRole('button', { name: 'Sınıf Turunu başlat' }).click();
    for (let tur = 0; tur < 4; tur++) {
      await page.getByRole('button', { name: 'Hazırız' }).click();
      await expect.poll(() => page.evaluate(() => window.__okulumsunE2E?.dogruCevapla() ?? false)).toBe(true);
      await page.getByRole('button', { name: 'Devam' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Kavanozu birlikte doldurduk!' })).toBeVisible();
    await page.getByRole('button', { name: 'Ana ekran' }).click();

    const depo = await depolamaDurumu(page);
    kanitKaydet('tahta modu: Sınıf Turu', koken, ag, depo);
    expect(agIhlalleri(ag.istekler, koken)).toEqual([]);
    expect(ag.soketler).toEqual([]);
    expect(depolamaIhlalleri(depo)).toEqual([]);
  });

  test('tuzak: dış adrese istek ve izinsiz depolama yakalanır', async ({ page }) => {
    const ag = agKaydet(page);
    await page.goto('./?device=tablet');
    const koken = new URL(page.url()).origin;
    const cspEngeli = await page.evaluate(async () => {
      let engel = false;
      document.addEventListener('securitypolicyviolation', () => (engel = true));
      await fetch('https://example.com/', { mode: 'no-cors' }).catch(() => undefined);
      await new Promise((r) => setTimeout(r, 200));
      localStorage.setItem('okulumsun.ogrenciAdi', 'TUZAK');
      sessionStorage.setItem('tuzak', '1');
      return engel;
    });
    // İstek ya ağa çıkar ve denetçi yakalar, ya da CSP (connect-src 'self') daha önce keser.
    const yakalandi = agIhlalleri(ag.istekler, koken).some((s) => s.includes('example.com'));
    expect(yakalandi || cspEngeli, 'dış istek ne yakalandı ne engellendi').toBe(true);
    expect(agIhlalleri([{ url: 'https://example.com/', method: 'POST', govde: 'x' }], koken)).toHaveLength(3);
    const sorunlar = depolamaIhlalleri(await depolamaDurumu(page));
    expect(sorunlar).toContain('izinsiz localStorage anahtarı: okulumsun.ogrenciAdi');
    expect(sorunlar).toContain('sessionStorage: tuzak');
  });
});
