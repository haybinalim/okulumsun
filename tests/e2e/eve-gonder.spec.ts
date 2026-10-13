import { expect, test } from '@playwright/test';
import { geometriTemiz, sesKilidiniAc } from './yardimci/akis';

/**
 * Plan v2 Adım 42 aşama 3: öğretmen bugünün setinden "Eve gönder" → yerel QR + bağlantı → Kopyala
 * (pano) → aynı bağlantı yeni sekmede ev çalışmasını açar ve hash adresten silinir.
 */
test('tahta: set → Eve gönder → QR + bağlantı + Kopyala → bağlantı ev çalışmasını açar', async ({ page, context }) => {
  test.setTimeout(90_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await sesKilidiniAc(page, '/?device=board');
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Öğretmen', exact: true }).click();
  const sirali = await page
    .locator('button[aria-label$="sıradaki sayı olarak seç"]')
    .evaluateAll((b) => b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a));
  for (const sayi of sirali) await page.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await page.getByRole('button', { name: 'Bugünün setini hazırla' }).click();

  const gonder = page.getByRole('button', { name: 'Eve gönder' });
  await expect(gonder).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('button', { name: 'Nerede?', exact: true }).click();
  await page.getByRole('button', { name: 'İleri mi geri mi?', exact: true }).click();
  await geometriTemiz(page, 'set hazırla (Eve gönder ile)');
  await gonder.click();

  await expect(page.getByRole('heading', { name: 'Eve gönder' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Eve link QR kodu' })).toBeVisible();
  const link = (await page.getByTestId('eve-link').innerText()).trim();
  expect(link).toMatch(/^http:\/\/localhost:\d+\/#ev=1\.1\.[a-z0-9]{4}\.[a-z0-9]{1,7}$/);
  expect(link).not.toContain('?');
  // QR üst bölgede ve büyük (tahtadan okunur).
  const kutu = (await page.getByTestId('eve-qr').boundingBox())!;
  expect(kutu.height).toBeGreaterThanOrEqual(300);
  await geometriTemiz(page, 'eve gönder');

  await page.getByRole('button', { name: 'Kopyala' }).click();
  await expect(page.getByText('✓ Bağlantı kopyalandı.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);

  await page.getByRole('button', { name: 'Geri' }).click();
  await expect(page.getByRole('heading', { name: 'Bugünün setini hazırla' })).toBeVisible();

  // Aynı bağlantı (veli telefonu yerine yeni sekme): ev çalışması, set düğümlerinden soru.
  const ev = await context.newPage();
  await ev.goto(link.replace('/#', '/?device=tablet#'));
  await expect.poll(() => new URL(ev.url()).hash).toBe('');
  await ev.getByRole('button', { name: 'Başla' }).click();
  await expect.poll(() => ev.evaluate(() => window.__okulumsunE2E?.alistirma?.itemId ?? null)).not.toBeNull();
  const itemId = await ev.evaluate(() => window.__okulumsunE2E!.alistirma!.itemId);
  expect(['M-KONUM', 'M-YONERGE']).toContain(itemId.split('#')[0]);
});
