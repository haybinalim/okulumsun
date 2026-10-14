import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UCUNCU_TARAF_VARLIKLAR } from '../../src/content/ucuncuTarafVarliklar';
import { bolumOku, denetle, fontAilesi, uretilmisBolum } from '../../scripts/lisans-denetimi';

/** Lisans envanteri K10 (plan v2 Adım 21). */
const kok = resolve(__dirname, '../..');
const paket = JSON.parse(readFileSync(resolve(kok, 'package.json'), 'utf8')) as { dependencies: Record<string, string> };

describe('lisans envanteri (K10)', () => {
  it('her runtime bağımlılığı envanterde', () => {
    const adlar = new Set(UCUNCU_TARAF_VARLIKLAR.map((v) => v.ad));
    for (const dep of Object.keys(paket.dependencies)) expect(adlar, dep).toContain(dep);
  });

  it('envanterdeki lisans adı node_modules/<paket>/package.json license alanıyla aynı', () => {
    const npm = UCUNCU_TARAF_VARLIKLAR.filter((v) => (v.tur === 'bagimlilik' || v.tur === 'arac') && v.ad !== 'Piper');
    for (const v of npm) {
      const pj = JSON.parse(readFileSync(resolve(kok, 'node_modules', v.ad, 'package.json'), 'utf8')) as { license: string };
      expect(pj.license, v.ad).toBe(v.lisans);
    }
  });

  it('public/fonts altındaki her font ailesi envanterde', () => {
    const aileler = new Set(readdirSync(resolve(kok, 'public/fonts')).filter((d) => d.endsWith('.woff2')).map(fontAilesi));
    expect(aileler.size).toBeGreaterThan(0);
    for (const a of aileler) expect(UCUNCU_TARAF_VARLIKLAR.some((v) => v.tur === 'font' && v.ad === a), a).toBe(true);
  });

  it('LICENSES tablosu envanterden üretilen metinle aynı', () => {
    expect(bolumOku(readFileSync(resolve(kok, 'LICENSES.md'), 'utf8'))).toBe(uretilmisBolum());
  });

  it('depo temiz; envanterde olmayan bağımlılık yakalanır (tuzak)', () => {
    expect(denetle(kok)).toEqual([]);
    const eksik = UCUNCU_TARAF_VARLIKLAR.filter((v) => v.ad !== 'zustand');
    const sorunlar = denetle(kok, eksik);
    expect(sorunlar).toContain('envanterde yok: bağımlılık "zustand" (src/content/ucuncuTarafVarliklar.ts)');
    expect(sorunlar.some((s) => s.startsWith('LICENSES.md: tablo bölümü'))).toBe(true);
  });
});
