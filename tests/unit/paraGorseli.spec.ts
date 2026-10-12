import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { BANKNOTLAR } from '../../src/exercises/types';
import { SEMATIK_BANKNOT_STILI, TCMB_YAZILI_IZIN, paraGorselStratejisi } from '../../src/content/paraGorseli';
import { SematikBanknot } from '../../src/ui/svg/SematikBanknot';

/** Plan v2 Adım 21 — para görseli stratejisi ve şematik banknot (KG-19). */
describe('para görseli stratejisi', () => {
  it('TCMB yazılı izni yok (KG-19: başvurulmaz)', () => {
    expect(TCMB_YAZILI_IZIN).toBe(false);
  });

  it('izin yokken kağıt ve arşiv sematik kullanır', () => {
    expect(paraGorselStratejisi({ ortam: 'kagit', tcmbYaziliIzin: false })).toBe('sematik');
    expect(paraGorselStratejisi({ ortam: 'arsiv', tcmbYaziliIzin: false })).toBe('sematik');
  });

  it('ekran Adım 29 geçişine kadar tcmb, geçişten sonra sematik kullanır', () => {
    expect(paraGorselStratejisi({ ortam: 'ekran', tcmbYaziliIzin: false })).toBe('tcmb');
    expect(paraGorselStratejisi({ ortam: 'ekran', tcmbYaziliIzin: false }, false)).toBe('sematik');
  });
});

describe('SematikBanknot', () => {
  it('her kupürün rengi, deseni ve oranı farklı (renk tek başına anlam taşımaz)', () => {
    const stiller = BANKNOTLAR.map((d) => SEMATIK_BANKNOT_STILI[d]);
    expect(new Set(stiller.map((s) => s.renk)).size).toBe(BANKNOTLAR.length);
    expect(new Set(stiller.map((s) => s.desen)).size).toBe(BANKNOTLAR.length);
    const oranlar = stiller.map((s) => s.oran);
    expect([...oranlar].sort((a, b) => a - b)).toEqual(oranlar);
  });

  it.each(BANKNOTLAR)('%i TL: rakam, "OYUN PARASI" ve erişilebilir ad var; TCMB adı yok', (deger) => {
    const svg = renderToStaticMarkup(createElement(SematikBanknot, { deger, genislik: 300 }));
    expect(svg).toContain(`aria-label="${deger} lira, oyun parası"`);
    expect(svg).toContain(`>${deger} TL<`);
    expect(svg).toContain('OYUN PARASI');
    expect(svg).not.toMatch(/Merkez Bankası|TCMB|ÖRNEKTİR/i);
  });
});
