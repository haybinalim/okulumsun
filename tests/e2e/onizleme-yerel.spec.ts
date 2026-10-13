import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { alistirmalariCoz } from './yardimci/akis';

/**
 * Plan v2 Adım 49 (KG-71): okul ağı / yerel dağıtım. Önizleme derlemesi (`dist-e2e`, onizleme projesinin sunucusu
 * üretir) bir alt dizinden (`/okul/okulumsun/`) servis edilince tam akış çalışır ve tüm istekler aynı köken + alt
 * dizindedir. `file://` ile açılışta tarayıcı modül betiklerini engeller: uygulama başlamaz, uyarı görünür (belgeli sınır).
 */
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist-e2e');
const ONEK = '/okul/okulumsun/';
const TURLER: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.m4a': 'audio/mp4',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

let sunucu: Server;
let kok = '';

test.beforeAll(async () => {
  sunucu = createServer(async (istek, yanit) => {
    const yol = decodeURIComponent(new URL(istek.url ?? '/', 'http://x').pathname);
    if (!yol.startsWith(ONEK)) {
      yanit.writeHead(404).end();
      return;
    }
    let dosya = path.join(DIST, yol.slice(ONEK.length));
    if (dosya.endsWith('/') || yol === ONEK) dosya = path.join(dosya, 'index.html');
    try {
      const icerik = await readFile(dosya);
      yanit.writeHead(200, { 'content-type': TURLER[path.extname(dosya)] ?? 'application/octet-stream' }).end(icerik);
    } catch {
      yanit.writeHead(404).end();
    }
  });
  await new Promise<void>((r) => sunucu.listen(0, '127.0.0.1', r));
  const adres = sunucu.address();
  kok = `http://127.0.0.1:${typeof adres === 'object' && adres ? adres.port : 0}`;
});

test.afterAll(async () => {
  await new Promise((r) => sunucu.close(r));
});

test('alt dizinden servis: ses kilidi → tahta → konu → 3 soru; istekler yalnız alt dizinde', async ({ page }) => {
  test.setTimeout(90_000);
  const istekler: string[] = [];
  page.on('request', (r) => istekler.push(r.url()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${kok}${ONEK}?device=board`);
  await page.getByRole('button', { name: 'Başla' }).click();
  await page.getByRole('button', { name: 'Tahtada birlikte çalışalım.' }).click();
  await page.getByRole('button', { name: 'Yön ve Yerler', exact: true }).click();
  await page.getByRole('button', { name: 'Nerede?', exact: true }).click();
  expect(await alistirmalariCoz(page, 3)).toHaveLength(3);

  const disarida = istekler.filter(
    (u) => !u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith(`${kok}${ONEK}`),
  );
  expect(disarida).toEqual([]);
  // Ses klipleri de alt dizinden geldi.
  expect(istekler.some((u) => u.startsWith(`${kok}${ONEK}audio/`))).toBe(true);
});

test('file:// açılışı: uygulama başlamaz, ne yapılacağını anlatan uyarı görünür', async ({ page }) => {
  await page.goto(pathToFileURL(path.join(DIST, 'index.html')).href);
  await expect(page.getByRole('heading', { name: 'Okulumsun dosyadan doğrudan açılamaz' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Başla' })).toHaveCount(0);
});
