import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VERI_SAKLAMA_BILDIRIMI } from '../../src/persistence/veriSaklamaPolitikasi';

/**
 * Belge ↔ kod tutarlılığı (plan v2 Adım 16).
 * "Tek doğru kaynak" belgelerinin kodla aynı gerçeği söylemesini korur.
 */
const kok = resolve(__dirname, '../..');
const oku = (yol: string) => readFileSync(resolve(kok, yol), 'utf8');

function gizlilikParagrafi(): string {
  const metin = oku('LICENSES.md');
  const bas = metin.indexOf('## Gizlilik beyanı');
  expect(bas).toBeGreaterThanOrEqual(0);
  const sonraki = metin.indexOf('\n## ', bas + 1);
  return metin.slice(bas, sonraki === -1 ? undefined : sonraki);
}

function durumBlogu(): Record<string, number> {
  const blok = oku('docs/PROGRESS.md').match(/<!--((?:\s*durum:[a-z0-9_]+=\d+)+)\s*-->/);
  expect(blok, 'PROGRESS.md makine okunur durum bloğu').not.toBeNull();
  const degerler: Record<string, number> = {};
  for (const [, ad, deger] of blok![1].matchAll(/durum:([a-z0-9_]+)=(\d+)/g)) degerler[ad] = Number(deger);
  return degerler;
}

describe('belge tutarlılığı', () => {
  it("LICENSES gizlilik paragrafı VERI_SAKLAMA_BILDIRIMI'ni içerir", () => {
    expect(gizlilikParagrafi()).toContain(VERI_SAKLAMA_BILDIRIMI);
  });

  it("LICENSES 'IndexedDB' ile saklama iddiası içermez", () => {
    expect(gizlilikParagrafi()).not.toMatch(/IndexedDB/i);
  });

  it('PROGRESS makine okunur bloğu var ve birim_dosya tests/unit dosya sayısına eşit', () => {
    const durum = durumBlogu();
    const birimDosya = readdirSync(resolve(kok, 'tests/unit')).filter((d) => d.endsWith('.spec.ts')).length;
    const e2eDosya = readdirSync(resolve(kok, 'tests/e2e')).filter((d) => d.endsWith('.spec.ts')).length;
    expect(durum.birim_dosya).toBe(birimDosya);
    expect(durum.e2e_dosya).toBe(e2eDosya);
  });

  it('LICENSE dosyası var ve package.json license alanı ile uyumlu (ADR-0013)', () => {
    const paket = JSON.parse(oku('package.json')) as { license?: string; private?: boolean };
    expect(paket.license).toBe('UNLICENSED');
    expect(paket.private).toBe(true);
    expect(oku('LICENSE')).toMatch(/Tüm hakları saklıdır/);
    expect(oku('CONTENT-LICENSE')).toMatch(/src\/content\//);
  });

  it("LICENSES 'henüz bir lisans seçmedi' içermez", () => {
    expect(oku('LICENSES.md')).not.toMatch(/henüz bir lisans seçmedi/);
  });

  it("TEST-PROTOKOLU 'bağlanmadı' ifadesi içermez", () => {
    expect(oku('docs/TEST-PROTOKOLU.md')).not.toMatch(/bağlanmadı/);
  });
});
