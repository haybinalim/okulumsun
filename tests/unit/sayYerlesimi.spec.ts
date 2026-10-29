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

  describe('KG-130: 1080×810 elle seçilen tahta (alan 1004 × 409, kart 240)', () => {
    const p = { w: 1004, h: 409, kart: 240, kartSayisi: 3, bosluk: 51, darBosluk: 38, cubukW: 416, cubukH: 224, tapMin: 102 };
    const cubuk = { x: (p.w - p.cubukW) / 2, y: p.h - p.cubukH, w: p.cubukW, h: p.cubukH };
    const kesisir = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
      a.x + a.w > b.x + 0.5 && b.x + b.w > a.x + 0.5 && a.y + a.h > b.y + 0.5 && b.y + b.h > a.y + 0.5;
    /** Kartların gerçek kutuları (ekranın çizdiği gibi). */
    function kartKutulari(d: ReturnType<typeof ekranDuzeni>) {
      const k = d.kart;
      const g = p.darBosluk;
      const sira = (n: number, x0: number, y: number) => Array.from({ length: n }, (_, i) => ({ x: x0 + i * (k + g), y, w: k, h: k }));
      const y = d.kartlar.y + (d.kartlar.h - k) / 2;
      if (d.tur === 'cubuk') {
        const sol = Math.ceil(p.kartSayisi / 2);
        const sag = p.kartSayisi - sol;
        return [...sira(sol, cubuk.x - p.bosluk - (sol * k + (sol - 1) * g), y), ...sira(sag, cubuk.x + cubuk.w + p.bosluk, y)];
      }
      const satirW = p.kartSayisi * k + (p.kartSayisi - 1) * g;
      return sira(p.kartSayisi, d.kartlar.x + (d.kartlar.w - satirW) / 2, y);
    }

    it('1–8 nesne (zorluk 1–2 tamamı, 3’ün bir kısmı): nesneler ≥ tapMin hücrede, kart ≥ tapMin, hiçbir şey çubukla/birbiriyle çakışmaz', () => {
      for (const spec of specler().filter((s) => s.adet <= 8)) {
        const d = ekranDuzeni(p, spec);
        const etiket = `${spec.adet} ${spec.layout} (${d.tur}, kart ${d.kart})`;
        expect(d.yerlesim.noktalar, etiket).toHaveLength(spec.adet);
        expect(d.yerlesim.hucre, etiket).toBeGreaterThanOrEqual(p.tapMin - 0.5);
        expect(d.kart, etiket).toBeGreaterThanOrEqual(p.tapMin);
        expect(d.kart, etiket).toBeLessThan(p.kart);
        const sahne = d.sahne;
        expect(kesisir(sahne, cubuk), `${etiket}: sahne × çubuk`).toBe(false);
        const kartlar = kartKutulari(d);
        for (const k of kartlar) {
          expect(kesisir(k, cubuk), `${etiket}: kart × çubuk`).toBe(false);
          expect(kesisir(k, sahne), `${etiket}: kart × sahne`).toBe(false);
          expect(k.x >= -0.5 && k.y >= -0.5 && k.x + k.w <= p.w + 0.5 && k.y + k.h <= p.h + 0.5, `${etiket}: kart alanda`).toBe(true);
        }
      }
    });

    it('9–20 nesne: alan tapMin hücreye yetmez (kullanıcı kararı) — yine de sahne boş değil, kartlar çubukla çakışmaz', () => {
      for (const spec of specler().filter((s) => s.adet > 8)) {
        const d = ekranDuzeni(p, spec);
        expect(d.sahne.h).toBeGreaterThan(0);
        expect(d.yerlesim.noktalar).toHaveLength(spec.adet);
        for (const k of kartKutulari(d)) expect(kesisir(k, cubuk)).toBe(false);
      }
    });

    it('1920 tahta ve tablet profillerinde kart ve düzen değişmez', () => {
      for (const q of PROFILLER) for (const spec of specler()) expect(ekranDuzeni(q, spec).kart).toBe(q.kart);
    });
  });
});

