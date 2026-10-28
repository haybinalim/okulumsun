import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/exercises/rng';
import { dagitilmisKonumlar } from '../../src/exercises/templates/say';
import {
  ekranKumeYerlesimi,
  kagitKumeYerlesimi,
  ortakKumeBoyutu,
  type KumeTarifi,
} from '../../src/ui/svg/kumeYerlesimi';
import { maddeIcOlcusu, yonergeYuksekligi } from '../../src/ogretmen/calismaKagidi/kagitYerlesimi';

/** Plan v2 KG-105: kâğıtta nesneler kutunun içinde, çakışmasız ve yer varsa ≥ 10 mm; ekranda kırpılma yok. */

const DUZENLER = ['sira', 'gruplu', 'onlukCerceve', 'dagınık'] as const;
/** Kâğıt kutuları (0,1 mm birim): dar hücre sahnesi, yatay sütun, seçenek kutusu (21,6 mm = 140 birim). */
const KAGIT_KUTULARI = [
  { ad: 'dar hücre', w: 865, h: 350, birim: 0.1 },
  { ad: 'dar hücre kısa', w: 865, h: 280, birim: 0.1 },
  { ad: 'yatay sütun', w: 750, h: 600, birim: 0.1 },
  { ad: 'seçenek', w: 140, h: 140, birim: 21.6 / 140 },
];

function tarif(adet: number, layout: (typeof DUZENLER)[number], tohum = 7): KumeTarifi {
  return layout === 'dagınık'
    ? { adet, layout, konumlar: dagitilmisKonumlar(adet, createRng(tohum + adet)) }
    : { adet, layout };
}

function icerideVeAyrik(noktalar: readonly { x: number; y: number }[], boyut: number, w: number, h: number) {
  const eps = 1e-6;
  for (const p of noktalar) {
    expect(p.x - boyut / 2).toBeGreaterThanOrEqual(-eps);
    expect(p.y - boyut / 2).toBeGreaterThanOrEqual(-eps);
    expect(p.x + boyut / 2).toBeLessThanOrEqual(w + eps);
    expect(p.y + boyut / 2).toBeLessThanOrEqual(h + eps);
  }
  for (let i = 0; i < noktalar.length; i++)
    for (let j = i + 1; j < noktalar.length; j++) {
      const a = noktalar[i];
      const b = noktalar[j];
      // Kare kutular örtüşmez: en az bir eksende merkezler arası ≥ boyut.
      expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))).toBeGreaterThanOrEqual(boyut - eps);
    }
}

describe('kâğıt kümesi (KG-105)', () => {
  for (const k of KAGIT_KUTULARI)
    for (const layout of DUZENLER)
      it(`${k.ad} / ${layout}: 1–20 nesne kutuda, çakışmasız, ≤ 14 mm`, () => {
        for (let n = 1; n <= 20; n++) {
          const y = kagitKumeYerlesimi(tarif(n, layout), k.w, k.h, 14 / k.birim, undefined, 10 / k.birim);
          expect(y.noktalar).toHaveLength(n);
          expect(y.boyut * k.birim).toBeLessThanOrEqual(14 + 1e-9);
          icerideVeAyrik(y.noktalar, y.boyut, k.w, k.h);
        }
      });

  it('dar hücre sahnesinde (86,5 × 35 mm) nesne ≥ 10 mm: sıra/gruplu/dağınık 12, onluk çerçeve 10 nesneye kadar', () => {
    for (const layout of DUZENLER)
      for (let n = 1; n <= (layout === 'onlukCerceve' ? 10 : 12); n++) {
        const y = kagitKumeYerlesimi(tarif(n, layout), 865, 350, 140, undefined, 100);
        expect(y.boyut / 10, `${layout} ${n}`).toBeGreaterThanOrEqual(10);
      }
  });

  it('ortak boy: kardeş kümeler en küçüğün boyunda (miktarla ilişkili boy ipucu yok)', () => {
    const kumeler = [
      { spec: tarif(1, 'sira'), w: 140, h: 140 },
      { spec: tarif(9, 'sira'), w: 140, h: 140 },
    ];
    const ortak = ortakKumeBoyutu(kumeler, 90)!;
    const tek = kagitKumeYerlesimi(kumeler[0].spec, 140, 140, 90, ortak);
    const dokuz = kagitKumeYerlesimi(kumeler[1].spec, 140, 140, 90, ortak);
    expect(tek.boyut).toBe(dokuz.boyut);
    expect(ortakKumeBoyutu(kumeler.slice(0, 1), 90)).toBeUndefined();
  });

  it('sayma sırası korunur: sıra düzeninde satır öncelikli', () => {
    const y = kagitKumeYerlesimi({ adet: 7, layout: 'sira' }, 865, 350, 140);
    for (let i = 1; i < y.noktalar.length; i++) {
      const a = y.noktalar[i - 1];
      const b = y.noktalar[i];
      expect(b.y > a.y + 1e-6 || (Math.abs(b.y - a.y) < 1e-6 && b.x > a.x)).toBe(true);
    }
  });
});

describe('ekran kümesi: kenarda kırpılma yok (KG-105)', () => {
  for (const layout of DUZENLER)
    it(`${layout}: 1–20 nesne 500 × 350 kutunun içinde`, () => {
      for (let n = 1; n <= 20; n++) {
        const y = ekranKumeYerlesimi(tarif(n, layout), 500, 350);
        for (const p of y.noktalar) {
          expect(p.x - y.boyut / 2).toBeGreaterThanOrEqual(-1e-6);
          expect(p.y - y.boyut / 2).toBeGreaterThanOrEqual(-1e-6);
          expect(p.x + y.boyut / 2).toBeLessThanOrEqual(500 + 1e-6);
          expect(p.y + y.boyut / 2).toBeLessThanOrEqual(350 + 1e-6);
        }
      }
    });

  it('tek nesne kutunun ortasında (eskiden sol üst köşede yarısı kırpılıyordu)', () => {
    const y = ekranKumeYerlesimi({ adet: 1, layout: 'sira' }, 140, 140);
    expect(y.noktalar[0]).toEqual({ x: 70, y: 70 });
  });
});

describe('sahne kutusu ölçüleri (kagit.css ile aynı)', () => {
  it('2x3 dar madde iç ölçüsü 86,5 × 76,7 mm; 1x4 181 × 55,8 mm', () => {
    const d = maddeIcOlcusu('2x3', 1);
    expect(d.w).toBeCloseTo(86.5, 1);
    expect(d.h).toBeCloseTo(76.67, 1);
    const g = maddeIcOlcusu('1x4', 1);
    expect(g.w).toBeCloseTo(181, 1);
    expect(g.h).toBeCloseTo(55.75, 1);
  });

  it('yönerge: kısa metin tek satır (9 mm), uzun metin kelimeden kayar', () => {
    expect(yonergeYuksekligi('Kaç tane?', 86.5)).toBe(9);
    expect(yonergeYuksekligi('Nesneleri parmağınla göstererek say. Kaç tane var?', 86.5)).toBeCloseTo(
      2 * 5.28 + 3.64,
      5,
    );
  });
});
