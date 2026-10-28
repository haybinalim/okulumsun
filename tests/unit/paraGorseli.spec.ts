import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { BANKNOTLAR } from '../../src/exercises/types';
import { SEMATIK_BANKNOT_STILI, TCMB_YAZILI_IZIN } from '../../src/content/paraGorseli';
import { SematikBanknot } from '../../src/ui/svg/SematikBanknot';

/** Plan v2 Adım 21 — para görselleri ve şematik banknot (KG-19, KG-121). */
describe('para görselleri', () => {
  it('TCMB yazılı izni yok (KG-19: başvurulmaz)', () => {
    expect(TCMB_YAZILI_IZIN).toBe(false);
  });

  it('KG-121: ekran-TCMB bayrağı ve "tcmb" stratejisi kalktı', async () => {
    const modul: Record<string, unknown> = await import('../../src/content/paraGorseli');
    expect(modul.EKRAN_TCMB_GECISI).toBeUndefined();
    expect(modul.paraGorselStratejisi).toBeUndefined();
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
