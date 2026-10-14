import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/exercises/rng';
import { dagitilmisKonumlar } from '../../src/exercises/templates/say';
import { ekranDuzeni, sahneYerlesimi, type SahneSpec } from '../../src/ui/svg/sayYerlesimi';

/** Plan v2 KG-86: M-SAY sahnesi ölçülen kutuya, nesneler ≥ tapMin ve çakışmasız. */

/** Ölçülen alt %65 (e2e ile aynı): tahta 1844×585, tablet 1032×453; büyük hedefte çubuk ve tapMin büyür. */
const PROFILLER = [
  {
    ad: 'tahta',
    w: 1844,
    h: 585,
    kart: 240,
    kartSayisi: 3,
    bosluk: 51,
    darBosluk: 38,
    cubukW: 416,
    cubukH: 224,
    tapMin: 102,
  },
  {
    ad: 'tahta büyük hedef',
    w: 1844,
    h: 585,
    kart: 240,
    kartSayisi: 3,
    bosluk: 51,
    darBosluk: 38,
    cubukW: 439,
    cubukH: 224,
    tapMin: 118,
  },
  {
    ad: 'tablet',
    w: 1032,
    h: 453,
    kart: 150,
    kartSayisi: 4,
    bosluk: 32,
    darBosluk: 24,
    cubukW: 260,
    cubukH: 140,
    tapMin: 64,
  },
  {
    ad: 'tablet büyük hedef',
    w: 1032,
    h: 453,
    kart: 150,
    kartSayisi: 4,
    bosluk: 32,
    darBosluk: 24,
    cubukW: 274,
    cubukH: 140,
    tapMin: 74,
  },
] as const;

function specler(): SahneSpec[] {
  const out: SahneSpec[] = [];
  for (let n = 1; n <= 20; n++) {
    if (n <= 6) out.push({ adet: n, layout: 'sira' });
    if (n >= 4 && n <= 10) out.push({ adet: n, layout: 'gruplu' });
    if (n >= 10) out.push({ adet: n, layout: 'onlukCerceve' });
    if (n <= 16) {
      for (let t = 1; t <= 5; t++)
        out.push({ adet: n, layout: 'dagınık', konumlar: dagitilmisKonumlar(n, createRng(t * 97 + n)) });
    }
  }
  return out;
}

describe('sayYerlesimi', () => {
  for (const p of PROFILLER) {
    it(`${p.ad}: tüm adet/yerleşimlerde nesne ≥ tapMin, çakışmasız, sahnede, çubukla kesişmez`, () => {
      for (const spec of specler()) {
        const d = ekranDuzeni(p, spec);
        const y = d.yerlesim;
        const etiket = `${spec.adet} ${spec.layout} (${d.tur})`;
        expect(y.noktalar, etiket).toHaveLength(spec.adet);
        expect(y.boyut, etiket).toBeGreaterThanOrEqual(p.tapMin);
        const yari = y.boyut / 2;
        for (const [i, a] of y.noktalar.entries()) {
          expect(a.x - yari, `${etiket} #${i} sol`).toBeGreaterThanOrEqual(-0.5);
          expect(a.y - yari, `${etiket} #${i} üst`).toBeGreaterThanOrEqual(-0.5);
          expect(a.x + yari, `${etiket} #${i} sağ`).toBeLessThanOrEqual(d.sahne.w + 0.5);
          expect(a.y + yari, `${etiket} #${i} alt`).toBeLessThanOrEqual(d.sahne.h + 0.5);
          for (const b of y.noktalar.slice(i + 1)) {
            const ayrik = Math.abs(a.x - b.x) >= y.boyut - 0.5 || Math.abs(a.y - b.y) >= y.boyut - 0.5;
            expect(ayrik, `${etiket}: #${i} çakışıyor`).toBe(true);
          }
        }
        // Sahne alt çubuğun (altta ortada) solunda kalır ya da çubuğun üstünde biter.
        const cubukSol = (p.w - p.cubukW) / 2;
        const sahneAlti = d.sahne.y + d.sahne.h;
        expect(d.sahne.x + d.sahne.w <= cubukSol || sahneAlti <= p.h - p.cubukH, etiket).toBe(true);
        // Kartlar kendi kutularına sığar.
        const satir = p.kartSayisi * p.kart + (p.kartSayisi - 1) * p.darBosluk;
        if (d.tur === 'yan') {
          expect(d.kartlar.w).toBeGreaterThanOrEqual(satir);
          expect(d.kartlar.h).toBeGreaterThanOrEqual(p.kart);
        }
      }
    });
  }

  it('sayma sırası korunur: onluk çerçevede ilk 10 nesne birinci çerçevede', () => {
    const y = sahneYerlesimi({ adet: 13, layout: 'onlukCerceve' }, 676, 585, 102);
    const ilk = y.noktalar.slice(0, 10);
    const ikinci = y.noktalar.slice(10);
    const ayrimY = Math.max(...ilk.map((n) => n.y)) < Math.min(...ikinci.map((n) => n.y));
    const ayrimX = Math.max(...ilk.map((n) => n.x)) < Math.min(...ikinci.map((n) => n.x));
    expect(ayrimX || ayrimY).toBe(true);
  });

  it('dağınık deterministik: aynı tohum → aynı sahne', () => {
    const spec: SahneSpec = { adet: 12, layout: 'dagınık', konumlar: dagitilmisKonumlar(12, createRng(7)) };
    expect(sahneYerlesimi(spec, 676, 585, 102)).toEqual(sahneYerlesimi(spec, 676, 585, 102));
  });

  it('boş/ölçülmemiş sahne güvenli', () => {
    expect(sahneYerlesimi({ adet: 5, layout: 'sira' }, 0, 0, 64).noktalar).toEqual([]);
  });

  it('dar ekranda (telefon dikey) dikey düzen seçilir', () => {
    const d = ekranDuzeni(
      { w: 342, h: 480, kart: 113, kartSayisi: 3, bosluk: 24, darBosluk: 18, cubukW: 195, cubukH: 105, tapMin: 48 },
      { adet: 5, layout: 'sira' },
    );
    expect(d.tur).toBe('dikey');
  });
});
