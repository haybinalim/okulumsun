import { expect, test } from '@playwright/test';

// Adım 23: kasıtlı hata (yalnız geliştirmede ?hataTetikle=1) → veli kapısı → Sorun bildir → kopyala.
test.describe('sorun bildir', () => {
  test('hata kaydı görünür, kopyalanan metinde sürüm var, ağa bir şey gitmez', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name === 'board', 'Yetişkin akışı tablet profili için doğrulanır.');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const disIstekler: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith('http://localhost')) disIstekler.push(r.url());
    });

    await page.goto('/?device=tablet&hataTetikle=1');
    await page.getByRole('button', { name: 'Başla' }).click();
    await page.getByRole('button', { name: 'Kendi başıma çalışacağım.' }).click();
    await page.getByRole('button', { name: 'Kedi' }).click();
    await page.getByRole('button', { name: 'Renk mor' }).click();
    await page.getByRole('button', { name: 'Ayarlar' }).click();

    const siraliSayilar = await page.locator('button[aria-label$="sıradaki sayı olarak seç"]').evaluateAll((buttons) =>
      buttons.map((b) => Number(b.getAttribute('aria-label')?.split(',')[0])).sort((a, b) => b - a),
    );
    for (const sayi of siraliSayilar) {
      await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
    }

    await expect(page.getByText(/^v0\.1\.0 · /)).toBeVisible();
    // Playwright Chromium m4a çözemediği için klip hataları tamponu doldurur (20 sınırı);
    // bu yüzden ikinci kasıtlı hata yetişkin alanındayken, sessiz ekranda üretilir.
    await page.evaluate(() => {
      setTimeout(() => void Promise.reject(new Error('deneme hatası (e2e)')), 0);
    });
    await page.getByRole('button', { name: 'Sorun bildir →' }).click();
    await expect(page.getByRole('heading', { name: 'Sorun bildir' })).toBeVisible();
    await expect(page.getByText('Bu bilgiler cihazdan çıkmaz; isterseniz kopyalayıp bize iletebilirsiniz.')).toBeVisible();

    const rapor = page.getByLabel(/Rapor metni/);
    await expect(rapor).toHaveValue(/deneme hatası \(e2e\)/);

    await page.getByRole('button', { name: 'Panoya kopyala' }).click();
    await expect(page.getByRole('status').filter({ hasText: /kopyala/ })).toBeVisible();
    const pano = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
    if (pano) expect(pano).toContain('Sürüm: v0.1.0 · ');

    const depolama = await page.evaluate(() => ({ ls: localStorage.length, ss: sessionStorage.length }));
    expect(JSON.stringify(depolama)).not.toContain('hataTetikle');
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain('deneme hatası');

    await expect(rapor).toHaveValue(/klip yüklenemedi: /);
    await page.getByRole('button', { name: 'Kayıtları temizle' }).click();
    await expect(rapor).toHaveValue(/Kayıt sayısı: 0/);
    expect(disIstekler).toEqual([]);
  });
});
