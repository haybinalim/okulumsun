import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ADR biçim denetimi (plan v2 Adım 17, docs/ADR/README.md).
 * Karar kayıtlarının şablona uyduğunu ve dizinle birebir olduğunu korur.
 */
const dizin = resolve(__dirname, '../../docs/ADR');
const ZORUNLU_BASLIKLAR = [
  '## Bağlam',
  '## Seçenekler',
  '## Karar',
  '## Sonuçlar',
  '## Gizlilik etkisi',
  '## Lisans ve üçüncü taraf etkisi',
  '## Geri dönüş maliyeti',
];
const DURUMLAR = ['Taslak', 'Önerildi', 'Kabul', 'Reddedildi'];
const durumGecerliMi = (d: string) => DURUMLAR.includes(d) || /^Yerine geçti: (ADR-)?\d{4}$/.test(d);

const dosyalar = readdirSync(dizin)
  .filter((d) => /^\d{4}-.+\.md$/.test(d))
  .sort();
const oku = (d: string) => readFileSync(resolve(dizin, d), 'utf8');
const durumu = (metin: string) => metin.match(/^- \*\*Durum:\*\* (.+)$/m)?.[1].trim();

describe('ADR biçimi', () => {
  it('her ADR dosyası zorunlu başlıkları içerir', () => {
    expect(dosyalar.length).toBeGreaterThan(1);
    for (const d of dosyalar) {
      const metin = oku(d);
      expect(metin, d).toMatch(/^- \*\*Durum:\*\* /m);
      expect(metin, d).toMatch(/^- \*\*Tarih:\*\* /m);
      for (const b of ZORUNLU_BASLIKLAR) expect(metin, `${d}: ${b}`).toContain(`\n${b}\n`);
    }
  });

  it("numaralar benzersiz ve 0000'dan ardışık", () => {
    const numaralar = dosyalar.map((d) => Number(d.slice(0, 4)));
    expect(numaralar).toEqual(numaralar.map((_, i) => i));
  });

  it('README dizin tablosu dosyalarla birebir', () => {
    const readme = readFileSync(resolve(dizin, 'README.md'), 'utf8');
    const satirlar = [...readme.matchAll(/^\| \[(\d{4})\]\(([^)]+)\) \| [^|]+ \| ([^|]+) \|/gm)];
    expect(satirlar.map((s) => s[2])).toEqual(dosyalar);
    for (const [, no, dosya, durum] of satirlar) {
      expect(dosya.startsWith(no)).toBe(true);
      if (no !== '0000') expect(durum.trim(), dosya).toBe(durumu(oku(dosya)));
    }
  });

  it('durum sözlükte', () => {
    for (const d of dosyalar.filter((x) => !x.startsWith('0000'))) {
      const durum = durumu(oku(d));
      expect(durum && durumGecerliMi(durum), `${d}: ${durum}`).toBe(true);
    }
  });
});
