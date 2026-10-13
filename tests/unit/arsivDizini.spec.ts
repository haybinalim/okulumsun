/**
 * Plan v2 Adım 48 aşama 2 (KG-70): commitlenmiş arşiv çıktısı tazelik kapısı. Dizin sayfaları ve sitemap üreticiyle
 * birebir aynı olmalı; her arşiv kaydının PDF'i `public/` altında bulunmalı (yoksa `npm run build && npm run arsiv`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  arsivDiziniUret,
  arsivGirdileri,
  pdfTarihleriniSabitle,
  sitemapUret,
} from '../../scripts/calisma-kagidi-arsivi';
import { KANONIK_YAYIN_ADRESI } from '../../src/platform/kanonikKok';

const kok = resolve(__dirname, '../..');
const { kayitlar, dugumler, kazanimlar } = arsivGirdileri(kok);
const dizin = arsivDiziniUret(kayitlar, dugumler, kazanimlar);

describe('arşiv tazeliği', () => {
  it('dizin sayfaları üreticiyle aynı', () => {
    for (const [yol, html] of dizin) expect(readFileSync(resolve(kok, 'public', yol), 'utf8'), yol).toBe(html);
  });
  it('sitemap üreticiyle aynı; robots.txt sitemap adresini verir', () => {
    expect(readFileSync(resolve(kok, 'public/sitemap.xml'), 'utf8')).toBe(sitemapUret(KANONIK_YAYIN_ADRESI, kayitlar));
    expect(readFileSync(resolve(kok, 'public/robots.txt'), 'utf8')).toContain(
      `Sitemap: ${KANONIK_YAYIN_ADRESI}/sitemap.xml`,
    );
  });
  it('her kaydın PDF dosyası var, PDF ve tarih alanları sabit', () => {
    const eksik = kayitlar.filter((x) => !existsSync(resolve(kok, 'public', x.yol))).map((x) => x.yol);
    expect(eksik).toEqual([]);
    const ilk = readFileSync(resolve(kok, 'public', kayitlar[0].yol));
    expect(ilk.subarray(0, 5).toString()).toBe('%PDF-');
    expect(ilk.toString('latin1')).toContain('/CreationDate (D:20260101000000Z)');
  });
});

describe('dizin içeriği', () => {
  it('dış kaynak yok; her PDF bir kazanım sayfasından bağlı; başlık ve açıklama var', () => {
    for (const [, html] of dizin) {
      expect(html).not.toMatch(/(src|href)="https?:/);
      expect(html).toMatch(/<title>[^<]+<\/title>/);
      expect(html).toMatch(/<meta name="description" content="[^"]+">/);
    }
    for (const x of kayitlar) {
      const sayfa = dizin.get(x.yol.replace(/[^/]+$/, 'index.html'))!;
      expect(sayfa).toContain(`href="${x.yol.split('/').pop()}"`);
      expect(sayfa).toContain(x.kagitKodu);
    }
  });
  it('pdfTarihleriniSabitle yalnız tarih alanlarını değiştirir', () => {
    const girdi = Buffer.from('%PDF-1.4 /CreationDate (D:20261013101010+00\'00\') /ModDate (D:20261013101010Z) /Title (x)', 'latin1');
    const cikti = pdfTarihleriniSabitle(girdi).toString('latin1');
    expect(cikti).toBe('%PDF-1.4 /CreationDate (D:20260101000000Z) /ModDate (D:20260101000000Z) /Title (x)');
  });
});
