/**
 * Türkçe klibin matematikle AYNI `speech` servisinde çalınması (bayraklı sunucu, `VITE_DERS_TUR=1`).
 * Gerçek ses dosyası yok: `klipler.json` yanıtı rota ile `var`a çevrilir ve `.m4a` isteklerine bellekte üretilmiş,
 * tarayıcının çözebildiği küçük bir sessiz WAV verilir (çözücü uzantıya değil içeriğe bakar). Diske/depoya ses konmaz.
 *  - `var` klip: bayt alınır (`alinanKlipler`), çözülür ve "Ses yok" GÖRÜNMEZ;
 *  - `eksik` klip (manifest olduğu gibi): ses dosyası istenmez, "Ses yok" görünür;
 *  - `var` ama dosya 404 ya da çözülemeyen bayt: "Ses yok" kalır (sessizce "çaldı" sayılmaz).
 */
import { expect, test, type Page } from '@playwright/test';
import { sesKilidiniAc } from './yardimci/akis';
import { TUR_URL } from '../../playwright.config';

test.use({ baseURL: TUR_URL });

/** 8 kHz, 16 bit, tek kanal, 0,05 sn sessiz WAV. */
function sessizWav(): Buffer {
  const ornek = 400;
  const veri = Buffer.alloc(ornek * 2);
  const b = Buffer.alloc(44);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + veri.length, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(veri.length, 40);
  return Buffer.concat([b, veri]);
}

async function kur(page: Page, mod: 'var' | 'eksik' | 'var-404' | 'var-bozuk') {
  const m4a: string[] = [];
  await page.route('**/tur/ses/klipler.json', async (rota) => {
    const yanit = await rota.fetch();
    const j = (await yanit.json()) as { klipler: { anahtar: string; durum: string; dosya?: string }[] };
    if (mod !== 'eksik') {
      for (const k of j.klipler) {
        const [, tur, ad] = k.anahtar.split('.');
        k.durum = 'var';
        k.dosya = `${tur}/${ad}.m4a`;
      }
    }
    await rota.fulfill({ json: j });
  });
  await page.route('**/tur/ses/**/*.m4a', async (rota) => {
    m4a.push(new URL(rota.request().url()).pathname);
    if (mod === 'var-404') return rota.fulfill({ status: 404, body: '' });
    await rota.fulfill({ status: 200, contentType: 'audio/mp4', body: mod === 'var-bozuk' ? Buffer.from('ses degil') : sessizWav() });
  });
  await sesKilidiniAc(page, '/?ders=tur&etkinlik=T-02&zorluk=1&tohum=1&device=tablet');
  await expect(page.locator('main[data-tur-etkinlik="T-02"]')).toBeVisible();
  return m4a;
}

test('var klip: ses dosyası alınır, çözülür; "Ses yok" görünmez', async ({ page }) => {
  const m4a = await kur(page, 'var');
  await expect.poll(() => m4a.length).toBeGreaterThan(0);
  expect(m4a[0]).toMatch(/^\/tur\/ses\/yonerge\/[a-z0-9-]+\.m4a$/);
  // Karar eşzamansız (yükleme + çözme sonrası): sonucun oturması için bekle, sonra göstergenin YOK olduğunu denetle.
  await page.waitForTimeout(600);
  await expect(page.locator('[data-ses-yok]')).toHaveCount(0);
  const alinan = await page.evaluate(() => [...(window.__okulumsunE2E?.alinanKlipler ?? [])]);
  expect(alinan.some((k) => k.startsWith('tur.yonerge.'))).toBe(true);
});

test('eksik klip: ses dosyası istenmez, "Ses yok" görünür', async ({ page }) => {
  const m4a = await kur(page, 'eksik');
  await expect(page.locator('[data-ses-yok]')).toBeVisible();
  expect(m4a).toEqual([]);
});

test('var denen klibin dosyası 404: "Ses yok" kalır', async ({ page }) => {
  const m4a = await kur(page, 'var-404');
  await expect.poll(() => m4a.length).toBeGreaterThan(0);
  await expect(page.locator('[data-ses-yok]')).toBeVisible();
});

test('baytlar alındı ama çözülemiyor (bozuk dosya): "Ses yok" kalır (var testinin sessizliği anlamlı)', async ({ page }) => {
  const m4a = await kur(page, 'var-bozuk');
  await expect.poll(() => m4a.length).toBeGreaterThan(0);
  await expect(page.locator('[data-ses-yok]')).toBeVisible();
});
