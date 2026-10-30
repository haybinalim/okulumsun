/**
 * KG-132 (kullanıcı kararı 2026-10-30): ekran görsellerinde kesik sahne satırı ve küçük tek nesne / onluk çerçeve.
 *  · Sahne (ekran): nesne kümesi parçasının kutusu sahnenin içine kaydırılır (M-VERİ-SIKLIK y 0,7).
 *  · `tekBuyuk`: tek nesne kutunun kısa kenarının %70'i (eskiden %22); çok nesneli kümeler değişmez.
 *  · Kart: onluk çerçeve ve (tekBuyuk) tek nesne kartın gerçek boyunu CSS % ile doldurur.
 *  · Kâğıt yolu (baski) ve şekilli sahneler değişmez.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/exercises/rng';
import { REGISTRY } from '../../src/exercises/registry';
import type { Option, TapToPlaceExercise, VisualSpec } from '../../src/exercises/types';
import { ChoiceCard } from '../../src/ui/primitives/ChoiceCard';
import { EKRAN_NESNE_ORANI, EKRAN_TEK_NESNE_ORANI, ekranKumeYerlesimi } from '../../src/ui/svg/kumeYerlesimi';
import { Visual } from '../../src/ui/svg/Visual';

const W = 560;
const H = 200;

function uret(sablon: string, zorluk: number, tohum = 1): TapToPlaceExercise {
  return REGISTRY.get(sablon)!.uret({ seed: tohum, difficulty: zorluk } as never, createRng(tohum)) as TapToPlaceExercise;
}

/** Sahne çizimindeki her sprite kutusu (sahne birimi): parça `translate` + nesne `translate` + `data-nesne-boyutu`. */
function nesneKutulari(html: string): { x: number; y: number; b: number }[] {
  const out: { x: number; y: number; b: number }[] = [];
  const parca = /<g transform="translate\(([-\d.e]+) ([-\d.e]+)\)"><svg[^>]*data-nesne-boyutu="([\d.e]+)">(.*?)<\/svg><\/g>/g;
  for (const m of html.matchAll(parca)) {
    const [px, py, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
    for (const n of m[4].matchAll(/<g transform="translate\(([-\d.e]+) ([-\d.e]+)\)">/g))
      out.push({ x: px + Number(n[1]), y: py + Number(n[2]), b });
  }
  return out;
}

describe('KG-132 sahne (ekran): nesne kümesi sahnenin içinde', () => {
  for (const z of [2, 3, 4, 5])
    for (const tohum of [1, 2, 3])
      it(`M-VERI-SIKLIK z${z} t${tohum}: her nesne 0..${W} × 0..${H} içinde`, () => {
        const ex = uret('M-VERI-SIKLIK', z, tohum);
        const html = renderToStaticMarkup(createElement(Visual, { spec: ex.prompt.gorsel!, width: W, height: H }));
        const k = nesneKutulari(html);
        expect(k.length).toBeGreaterThan(2);
        for (const n of k) {
          expect(n.x).toBeGreaterThanOrEqual(-1e-6);
          expect(n.y).toBeGreaterThanOrEqual(-1e-6);
          expect(n.x + n.b).toBeLessThanOrEqual(W + 1e-6);
          expect(n.y + n.b).toBeLessThanOrEqual(H + 1e-6);
        }
      });

  it('şekilli sahne eski konumda (GEO sahneleri kâğıtta bu yoldan çizilir)', () => {
    const spec: VisualSpec = {
      type: 'sahne',
      parcalar: [
        { gorsel: { type: 'sekil', sekil: 'kare' } as VisualSpec, konum: { x: 0.5, y: 0.9 } },
        { gorsel: { type: 'nesneKumesi', sprite: 'elma', adet: 3, layout: 'sira' }, konum: { x: 0.5, y: 0.9 } },
      ],
    };
    const html = renderToStaticMarkup(createElement(Visual, { spec, width: W, height: H }));
    // Kutu yüksekliği 0,8·H = 160, merkez 0,9·H = 180 → üst kenar 100 (kaydırılmadı).
    expect(html.match(/<g transform="translate\(([-\d.e]+) ([-\d.e]+)\)">/g)!.filter((g) => g.includes(' 100)')).length).toBe(2);
  });
});

describe('KG-132 tek nesne (tekBuyuk)', () => {
  it('tek nesne kutunun %70i; tekBuyuk yoksa ya da çok nesnede eski %22', () => {
    expect(ekranKumeYerlesimi({ adet: 1, layout: 'sira' }, 100, 80, true).boyut).toBeCloseTo(80 * EKRAN_TEK_NESNE_ORANI);
    expect(ekranKumeYerlesimi({ adet: 1, layout: 'sira' }, 100, 80).boyut).toBeCloseTo(80 * EKRAN_NESNE_ORANI);
    expect(ekranKumeYerlesimi({ adet: 3, layout: 'sira' }, 100, 80, true).boyut).toBeCloseTo(80 * EKRAN_NESNE_ORANI);
  });

  it('tek nesne kutunun içinde ve ortasında', () => {
    const { noktalar, boyut } = ekranKumeYerlesimi({ adet: 1, layout: 'sira' }, 100, 100, true);
    expect(noktalar[0]).toEqual({ x: 50, y: 50 });
    expect(boyut / 2).toBeLessThanOrEqual(50);
  });

  it('M-VERI-GRUPLA kartı: tekBuyuk ile nesne kartı doldurur (CSS %), yoksa eski çizim', () => {
    const ex = uret('M-VERI-GRUPLA', 4);
    const o = ex.options[0] as Option;
    const dolu = renderToStaticMarkup(createElement(ChoiceCard, { option: o, size: 140, state: 'bos', onSelect: () => {}, tekBuyuk: true }));
    expect(dolu).toContain('data-kart-dolu');
    expect(dolu).toContain(`data-nesne-boyutu="${100 * EKRAN_TEK_NESNE_ORANI}"`);
    const eski = renderToStaticMarkup(createElement(ChoiceCard, { option: o, size: 140, state: 'bos', onSelect: () => {} }));
    expect(eski).not.toContain('data-kart-dolu');
  });
});

describe('KG-132 onluk çerçeve kartı', () => {
  it('kart onluk çerçeveyi CSS % ile doldurur; çerçeve iç alanın ≥ %85i', () => {
    const ex = uret('M-ONLUK-COZUMLE', 3);
    for (const o of ex.options) {
      const html = renderToStaticMarkup(createElement(ChoiceCard, { option: o, size: 140, state: 'bos', onSelect: () => {} }));
      expect(html).toContain('data-kart-dolu');
      const g = (o.deger as { gorsel: { gruplar: number[] } }).gorsel.gruplar.length;
      const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(html)!;
      expect(Number(vb[1])).toBe(200 * g);
      // Çerçeve yolu genişliği (5 göz + pay) / çerçeve başına genişlik (200).
      const rect = /<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/.exec(html)!;
      expect(Number(rect[2]) / 200).toBeGreaterThanOrEqual(0.85);
    }
  });
});
