import { expect, test, type Frame, type Page } from '@playwright/test';
import { alistirmalariCoz } from './yardimci/akis';
import { agIhlalleri, agKaydet } from './yardimci/gizlilik';

/**
 * Plan v2 Adım 56: gömülü mod. Üretim başlıklarıyla (`frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`)
 * aynı kökenden bir "portal" sayfası uygulamayı `?gomulu=eba` ile iframe'de açar. Akış çalışır, Eve gönder
 * görünmez, istekler aynı kökendedir ve üst pencereye hiçbir `postMessage` gitmez. EBA'nın gerçek alan adı
 * teyit edilmediğinden başka kökenli gömme bu testin kapsamı dışında (yayın başlığı `'self'` kalır).
 */

const PORTAL = 'portal-deneme.html';

/** Her çerçevede `postMessage` çağrılarını ve üst pencerede `message` olaylarını sayar. */
async function postMessageCasusu(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __pm: number; __mesaj: number };
    w.__pm = 0;
    w.__mesaj = 0;
    const ozgun = window.postMessage.bind(window);
    window.postMessage = ((...a: Parameters<typeof window.postMessage>) => {
      w.__pm++;
      return ozgun(...(a as [unknown, string]));
    }) as typeof window.postMessage;
    window.addEventListener('message', () => {
      w.__mesaj++;
    });
  });
}

async function portaliAc(page: Page, baseURL: string, sorgu: string): Promise<Frame> {
  await page.route(`**/${PORTAL}`, (r) =>
    r.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html lang="tr"><body style="margin:0"><h1 style="font:16px sans-serif;margin:4px">Portal</h1>
<iframe id="uygulama" title="okulumsun" src="./${sorgu}" allow="fullscreen; screen-wake-lock"
 style="border:0;width:100vw;height:calc(100vh - 30px)"></iframe></body></html>`,
    }),
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(new URL(PORTAL, baseURL).toString());
  const cerceve = page.frameLocator('#uygulama');
  await expect(cerceve.getByRole('button', { name: 'Başla' })).toBeVisible();
  const frame = page.frames().find((f) => f.url().includes('gomulu='));
  expect(frame, 'uygulama çerçevesi').toBeTruthy();
  return frame!;
}

test('gömülü (EBA): iframe içinde tahta akışı, Eve gönder yok, aynı köken, postMessage yok', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(90_000);
  await postMessageCasusu(page);
  const ag = agKaydet(page);
  const frame = await portaliAc(page, baseURL!, '?gomulu=eba&device=board');

  expect(await frame.evaluate(() => document.documentElement.dataset.gomulu)).toBe('eba');
  await frame.getByRole('button', { name: 'Başla' }).click();
  await frame.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await expect(frame.getByRole('button', { name: 'Ayarlar' })).toBeVisible();

  // Öğretmen alanı → Bugünün seti: "Eve gönder" gizli; Sorun bildir ve lisanslar açık.
  await frame.getByRole('button', { name: 'Ayarlar' }).click();
  const sayilar = await frame
    .locator('button[aria-label$="sıradaki sayı olarak seç"]')
    .evaluateAll((b) => b.map((x) => Number(x.getAttribute('aria-label')?.split(',')[0])).sort((a, c) => c - a));
  for (const sayi of sayilar) await frame.getByRole('button', { name: `${sayi}, sıradaki sayı olarak seç` }).click();
  await expect(frame.getByRole('heading', { name: 'Sorun bildir' })).toBeVisible();
  await expect(frame.getByRole('button', { name: 'Lisanslar ve gizlilik →' })).toBeVisible();
  await frame.getByRole('button', { name: 'Bugünün setini hazırla' }).click();
  await expect(frame.getByRole('button', { name: /Çalışma kâğıdı yazdır/ })).toBeVisible();
  await expect(frame.getByRole('button', { name: 'Eve gönder' })).toHaveCount(0);
  // KG-103: gömülü modda da ortak Geri / Ana menü (geçmişe kayıt konmaz; üst portalın geri tuşu bozulmaz).
  const gecmis = await frame.evaluate(() => history.length);
  await frame.getByRole('button', { name: 'Geri', exact: true }).click();
  await expect(frame.getByRole('button', { name: 'Bugünün setini hazırla' })).toBeVisible();
  expect(await frame.evaluate(() => history.length)).toBe(gecmis);

  // Çocuk akışı: tema → konu → 3 soru (e2e kancası çerçevenin içinde).
  await frame.getByRole('button', { name: 'Ana menü', exact: true }).click();
  await frame.getByRole('button', { name: 'Yön ve Yerler', exact: true }).click();
  await expect(frame.getByRole('button', { name: 'Geri', exact: true })).toBeVisible();
  const etiketler = await frame
    .locator('button:not([disabled])')
    .evaluateAll((b) => b.map((x) => x.getAttribute('aria-label') ?? x.textContent ?? ''));
  const ilk = etiketler.find((e) => e && !/Geri|Ana menü|Yardım|Yönergeyi|tekrar dinle|Tema turu|Temaya giriş/i.test(e));
  await frame.getByRole('button', { name: ilk!, exact: true }).first().click();
  const turler = await alistirmalariCoz(frame as unknown as Page, 3);
  expect(turler).toHaveLength(3);

  // Üst pencereye ileti yok; çerçeve de kendine ileti göndermedi.
  expect(await page.evaluate(() => (window as unknown as { __pm: number; __mesaj: number }).__pm)).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __pm: number; __mesaj: number }).__mesaj)).toBe(0);
  expect(await frame.evaluate(() => (window as unknown as { __pm: number }).__pm)).toBe(0);
  expect(agIhlalleri(ag.istekler, new URL(baseURL!).origin)).toEqual([]);
  expect(await frame.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('gömülü parametresi bağımsız sekmede etkisiz (data-gomulu yok)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./?gomulu=eba&device=board');
  await page.getByRole('button', { name: 'Başla' }).click();
  expect(await page.evaluate(() => document.documentElement.dataset.gomulu)).toBeUndefined();
});
