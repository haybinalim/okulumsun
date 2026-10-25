import { expect, test, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASKI_BEYANI_IFADESI, sayfaUyusmazligi, type BaskiBeyani } from '../../scripts/denetim/pdfSayfa';

const ONIZLEME_URL = process.env.E2E_HEDEF_URL ?? 'http://localhost:4173/';

/**
 * KG-102 genel koruma: basılan PDF'in sayfa sayısı = altbilgideki "Sayfa n / N" toplamı; her sayfa bir kez, sırayla
 * numaralı; cevap anahtarı gövdesi A4 kutusundan taşmıyor (taşan metin kesilirdi). Kapsam: 165 arşiv kâğıdı, etki
 * formu A/B ve çalışma kâğıdı ekranının seçenekleri (madde sayısı × düzen × yanıt biçimi; en kalabalık anahtarlı
 * düğümler ve çok düğümlü setler). Ekrandaki "Cevap anahtarı" / "Siyah-beyaz" anahtarları `calisma-kagidi.spec.ts`.
 */
async function denetle(page: Page, kod: string): Promise<number> {
  await page.emulateMedia({ media: 'screen' });
  await page.goto(new URL(`?arsiv=${encodeURIComponent(kod)}`, ONIZLEME_URL).href);
  await expect(page.locator('[data-arsiv-hazir]'), kod).toBeAttached({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  const beyan = await page.evaluate<BaskiBeyani>(BASKI_BEYANI_IFADESI);
  // Anahtar gövdesinin içeriği A4 kutusunun içinde biter (kutu sabit; taşan metin kesilirdi).
  const tasan = await page.locator('.kg-kok--baski .kg-anahtar-govde').evaluateAll((govdeler) =>
    govdeler
      .map((g) => {
        const alt = Math.max(0, ...[...g.children].map((c) => c.getBoundingClientRect().bottom));
        return alt - g.getBoundingClientRect().bottom;
      })
      .filter((fark) => fark > 0.5),
  );
  expect(tasan, `${kod}: anahtar gövdesi taşıyor`).toEqual([]);
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  expect(sayfaUyusmazligi(pdf, beyan), kod).toBeNull();
  return beyan.toplam;
}

/**
 * Arşiv kodları commitlenmiş dizin sayfalarından (`arsivDizini.spec.ts` üreticiyle aynılığını denetler); Playwright
 * JSON içe aktarımı olmadan `src/` içeriğini yükleyemediği için buradan okunur.
 */
const KAGITLAR = fileURLToPath(new URL('../../public/kagitlar', import.meta.url));
const ARSIV = readdirSync(KAGITLAR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name))
  .flatMap((d) => [...readFileSync(resolve(KAGITLAR, d.name, 'index.html'), 'utf8').matchAll(/ · (OK-[a-z0-9.]+-\d+-2x3-[dy])<\/li>/g)].map((m) => m[1]));

/**
 * Ekran seçenekleri (kâğıt kodu = `OK-<sürüm>.<düğüm kodları>.<tohum, 36 taban>-<madde>-<düzen>-<d|y>`): anahtarı en
 * kalabalık düğümler (f5 yapıdaki şekiller, f4 döndürülmüş şekil, d5 onu geçen toplama, c4 ölçüm tahmini) ve çok
 * düğümlü setler × 4/8/12 madde × 2×3/1×4 × daire/yazmalı.
 */
function ekranKodlari(): string[] {
  const setler = ['f5', 'f4', 'd5', 'c4', 'a1b8d5', 'f4f5c4', 'd5e1f5'];
  const kodlar: string[] = [];
  for (const [i, dugumler] of setler.entries())
    for (const madde of [4, 8, 12])
      for (const duzen of ['2x3', '1x4'])
        for (const yanit of ['d', 'y']) kodlar.push(`OK-1.${dugumler}.${(4242 + i).toString(36)}-${madde}-${duzen}-${yanit}`);
  return kodlar;
}

test.describe.configure({ mode: 'parallel' });

const PARCA = 6;
for (let p = 0; p < PARCA; p++) {
  test(`arşiv kâğıtları ${p + 1}/${PARCA}: PDF sayfa sayısı = altbilgi toplamı`, async ({ page }) => {
    test.setTimeout(300_000);
    const kodlar = ARSIV.filter((_, i) => i % PARCA === p);
    for (const kod of kodlar) await denetle(page, kod);
  });
}

test('arşiv kapsamı: 165 kâğıt; MAT.1.3.4 (f5) anahtarı tek sayfa', async ({ page }) => {
  expect(ARSIV).toHaveLength(165);
  for (const kod of ARSIV.filter((k) => k.startsWith('OK-1.f5.'))) expect(await denetle(page, kod), kod).toBe(2);
});

test('etki formu A/B: PDF sayfa sayısı = altbilgi toplamı', async ({ page }) => {
  for (const form of ['A', 'B']) await denetle(page, `ETKI-1-${form}`);
});

test('çalışma kâğıdı ekranı seçenekleri: PDF sayfa sayısı = altbilgi toplamı', async ({ page }) => {
  test.setTimeout(300_000);
  for (const kod of ekranKodlari()) await denetle(page, kod);
});
