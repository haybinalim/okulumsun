/**
 * Plan v2 Adım 39 aşama 2 (KG-54): gizlilik kanıt raporu (SAF) — istek türleri, ihlal tespiti, Markdown.
 */
import { describe, expect, it } from 'vitest';
import { istekTuru, ozetle, raporUret, type KanitKaydi } from '../../scripts/gizlilik/kanitRaporu';

const koken = 'http://localhost:4173';
const temiz: KanitKaydi = {
  akis: 'tahta',
  koken,
  istekler: [
    { url: `${koken}/`, method: 'GET', govdeli: false },
    { url: `${koken}/assets/index-x.js`, method: 'GET', govdeli: false },
    { url: `${koken}/audio/geri/dogru-1.m4a`, method: 'GET', govdeli: false },
    { url: `${koken}/fonts/Andika-Regular-latin.woff2`, method: 'GET', govdeli: false },
    { url: 'data:image/png;base64,AAAA', method: 'GET', govdeli: false },
  ],
  soketler: [],
  localStorage: ['okulumsun.deviceOverride'],
  sessionStorage: [],
  cerezVar: false,
  indexedDB: { okulumsun: { profiller: 0 } },
};

describe('gizlilik kanıt raporu', () => {
  it('istek türleri', () => {
    expect(istekTuru(`${koken}/assets/a.css`)).toBe('uygulama kodu');
    expect(istekTuru(`${koken}/audio/x/y.m4a`)).toBe('ses');
    expect(istekTuru(`${koken}/fonts/a.woff2`)).toBe('font');
    expect(istekTuru(`${koken}/icon-192.png`)).toBe('görsel');
    expect(istekTuru(`${koken}/manifest.webmanifest`)).toBe('belge/manifest');
    expect(istekTuru(`${koken}/sw.js`)).toBe('uygulama kodu');
  });

  it('özet: data: istekleri sayılmaz, türler ve depolama', () => {
    const o = ozetle(temiz);
    expect(o.toplamIstek).toBe(4);
    expect(o.turler).toEqual({ 'belge/manifest': 1, 'uygulama kodu': 1, ses: 1, font: 1 });
    expect(o).toMatchObject({
      baskaKoken: 0,
      govdeli: 0,
      soket: 0,
      sessionStorage: 0,
      cerez: false,
      indexedDBKayit: 0,
    });
  });

  it('temiz kayıt → TEMİZ; dış köken, POST, çerez veya IndexedDB kaydı → İHLAL VAR', () => {
    const kimlik = { surum: '0.1.0', derleme: 'abc1234' };
    expect(raporUret([temiz], kimlik)).toContain('**Sonuç: TEMİZ**');
    const ihlaller: KanitKaydi[] = [
      { ...temiz, istekler: [...temiz.istekler, { url: 'https://example.com/x', method: 'GET', govdeli: false }] },
      { ...temiz, istekler: [{ url: `${koken}/api`, method: 'POST', govdeli: true }] },
      { ...temiz, cerezVar: true },
      { ...temiz, indexedDB: { okulumsun: { profiller: 2 } } },
      { ...temiz, soketler: ['ws://localhost:4173/'] },
    ];
    for (const k of ihlaller) expect(raporUret([k], kimlik)).toContain('**Sonuç: İHLAL VAR**');
  });

  it('rapor sürüm ve derleme kimliğini ve akış satırını taşır', () => {
    const r = raporUret([temiz], { surum: '0.1.0', derleme: 'abc1234' });
    expect(r).toContain('v0.1.0');
    expect(r).toContain('`abc1234`');
    expect(r).toContain(
      '| tahta | 4 | uygulama kodu 1, ses 1, font 1, belge/manifest 1 | GET | 0 | 0 | 0 | `okulumsun.deviceOverride` | 0 | yok | 0 |',
    );
  });
});
