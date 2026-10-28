import { describe, expect, it } from 'vitest';
import tr from '../../src/content/tr.json' with { type: 'json' };
import { skillsData } from '../../src/content/skillsData';
import { createRng } from '../../src/exercises/rng';
import { dagitilmisKonumlar } from '../../src/exercises/templates/say';
import { arsivIstegi, arsivKayitlari } from '../../src/ogretmen/calismaKagidi/arsiv';
import { etkiFormlariUret } from '../../src/ogretmen/calismaKagidi/etkiFormu';
import type { KagitMaddesi } from '../../src/ogretmen/calismaKagidi/kagitMaddesi';
import { kagitPlaniUret, type KagitPlani } from '../../src/ogretmen/calismaKagidi/kagitPlani';
import {
  maddeIcOlcusu,
  sahneKutusu,
  sahneYanSecenekli,
  yonergeYuksekligi,
} from '../../src/ogretmen/calismaKagidi/kagitYerlesimi';
import { trDuzlestir } from '../../src/ogretmen/calismaKagidi/sesMetni';
import {
  ROZET_SERIDI_MM,
  SECENEK_KONTUR_MM,
  SECENEK_MM_BIRIM,
  YERLESIK_DOLGU_MM,
  kumeSecenekYerlesimi,
} from '../../src/ui/print/secenekYerlesimi';
import {
  besliKumeYerlesimi,
  ikiliKumeKutulari,
  kagitKumeYerlesimi,
  satirKumeKutulari,
  type Dikdortgen,
  type KagitOlcutu,
  type KumeTarifi,
} from '../../src/ui/svg/kumeYerlesimi';

/**
 * Plan v2 KG-106 (kullanıcı kararı: "sayfa sayısını artırmayacak şekilde büyümeleri ayarla"): karşılaştırma
 * seçenekleri, bileşik sahneler (karşılaştırma, toplama, veri grafiği), çetele ve işlem sahnesi kâğıtta boş
 * yeri kullanır; nesneler kutuda, çakışmasız, aralarında ≥ 1,5 mm; aynı maddede eşit boy. Sayfa planı ve
 * sayfa sayıları `anahtarSayfalari.spec.ts` (commitli PDF'ler) ile korunur.
 */

const MM = 0.1; // 1 çizim birimi = 0,1 mm
const O: KagitOlcutu = { enBuyuk: 14 / MM, enAz: 10 / MM, bosluk: 1.5 / MM };
const EPS = 1e-6;

function tarif(adet: number, layout: KumeTarifi['layout'], tohum = 11): KumeTarifi {
  return layout === 'dagınık'
    ? { adet, layout, konumlar: dagitilmisKonumlar(adet, createRng(tohum + adet)) }
    : { adet, layout };
}

/** Nesneler kutuda ve komşu iki nesne kutusu arasında en az `bosluk` var. */
function icerideVeAralikli(noktalar: readonly { x: number; y: number }[], boyut: number, w: number, h: number) {
  expect(boyut).toBeGreaterThan(0);
  for (const p of noktalar) {
    expect(p.x - boyut / 2).toBeGreaterThanOrEqual(-EPS);
    expect(p.y - boyut / 2).toBeGreaterThanOrEqual(-EPS);
    expect(p.x + boyut / 2).toBeLessThanOrEqual(w + EPS);
    expect(p.y + boyut / 2).toBeLessThanOrEqual(h + EPS);
  }
  for (let i = 0; i < noktalar.length; i++)
    for (let j = i + 1; j < noktalar.length; j++) {
      const a = noktalar[i];
      const b = noktalar[j];
      expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) - boyut).toBeGreaterThanOrEqual(O.bosluk - 1e-3);
    }
}

function ayrikVeIceride(kutular: readonly Dikdortgen[], w: number, h: number) {
  for (const k of kutular) {
    expect(k.x).toBeGreaterThanOrEqual(-EPS);
    expect(k.y).toBeGreaterThanOrEqual(-EPS);
    expect(k.x + k.w).toBeLessThanOrEqual(w + 1e-3);
    expect(k.y + k.h).toBeLessThanOrEqual(h + 1e-3);
  }
  for (let i = 0; i < kutular.length; i++)
    for (let j = i + 1; j < kutular.length; j++) {
      const a = kutular[i];
      const b = kutular[j];
      const ayrik =
        a.x + a.w <= b.x + EPS || b.x + b.w <= a.x + EPS || a.y + a.h <= b.y + EPS || b.y + b.h <= a.y + EPS;
      expect(ayrik).toBe(true);
    }
}

describe('kâğıt nesne aralığı (KG-106)', () => {
  it('bosluk verilince komşu nesne kutuları arasında en az o kadar boşluk kalır (tüm düzenler, 1–20 nesne)', () => {
    for (const layout of ['sira', 'gruplu', 'onlukCerceve', 'dagınık'] as const)
      for (const [w, h] of [
        [865, 400],
        [272, 640],
        [538, 277],
      ])
        for (let n = 1; n <= 20; n++) {
          const y = kagitKumeYerlesimi(tarif(n, layout), w, h, O.enBuyuk, undefined, O.enAz, O.bosluk);
          icerideVeAralikli(y.noktalar, y.boyut, w, h);
        }
  });

  it('bosluk verilmezse KG-105 yerleşimi aynı kalır', () => {
    const eski = kagitKumeYerlesimi(tarif(9, 'dagınık'), 865, 350, 140, undefined, 100);
    const yeni = kagitKumeYerlesimi(tarif(9, 'dagınık'), 865, 350, 140, undefined, 100, 0);
    expect(yeni).toEqual(eski);
  });
});

describe('çetele: beşli sıra (KG-106)', () => {
  it('3–12 nesne 5 sütunlu satırlarda, sayma sırası satır satır; 86,5 × 55 mm sahnede 14 mm', () => {
    for (let n = 3; n <= 12; n++) {
      const y = besliKumeYerlesimi(n, 865, 550, O);
      expect(y.noktalar).toHaveLength(n);
      icerideVeAralikli(y.noktalar, y.boyut, 865, 550);
      expect(y.boyut * MM).toBeCloseTo(14, 6);
      const satirlar = [...new Set(y.noktalar.map((p) => Math.round(p.y)))];
      expect(satirlar).toHaveLength(Math.ceil(n / 5));
      // Satır öncelikli: her satır soldan sağa, ilk satır dolu (en çok 5).
      y.noktalar.forEach((p, i) => {
        if (i % 5 > 0) expect(p.x).toBeGreaterThan(y.noktalar[i - 1].x);
        expect(Math.round(p.y)).toBe(satirlar[Math.floor(i / 5)]);
      });
    }
  });

  it('beşli sıra serbest ızgaradan küçük nesne veriyorsa serbest ızgara kalır', () => {
    // Dar ve uzun kutu: 5 sütun hücreyi küçültür.
    const y = besliKumeYerlesimi(10, 200, 900, O);
    const serbest = kagitKumeYerlesimi({ adet: 10, layout: 'sira' }, 200, 900, O.enBuyuk, undefined, O.enAz, O.bosluk);
    expect(y.boyut).toBeCloseTo(serbest.boyut, 9);
  });
});

describe('bileşik sahne kutuları (KG-106)', () => {
  it('iki küme: eşit kutular, sahnede, ayrık; nesneler kutuda ve aralıklı', () => {
    const duzenler = ['sira', 'gruplu', 'onlukCerceve', 'dagınık'] as const;
    for (const la of duzenler)
      for (const lb of duzenler)
        for (const [na, nb] of [
          [1, 1],
          [3, 6],
          [10, 14],
          [7, 2],
        ]) {
          const a = tarif(na, la);
          const b = tarif(nb, lb, 23);
          const r = ikiliKumeKutulari(a, b, 865, 400, 35, O);
          ayrikVeIceride(r.kutular, 865, 400);
          expect(r.kutular[0].w).toBeCloseTo(r.kutular[1].w, 9);
          expect(r.kutular[0].h).toBeCloseTo(r.kutular[1].h, 9);
          for (const [i, spec] of [a, b].entries()) {
            const k = r.kutular[i];
            const y = kagitKumeYerlesimi(spec, k.w, k.h, O.enBuyuk, r.boyut, O.enAz, O.bosluk);
            expect(y.boyut).toBeCloseTo(r.boyut, 9); // eşit boy
            icerideVeAralikli(y.noktalar, y.boyut, k.w, k.h);
          }
        }
  });

  it('veri grafiği (3 küme, 1–9 nesne, 86,5 × 40 mm): sıra korunur, kutular ayrık, ortak boy ≥ 7 mm (en kötü 9 + 9 + 9)', () => {
    let enKucuk = Infinity;
    for (let a = 1; a <= 9; a += 2)
      for (let b = 1; b <= 9; b += 2)
        for (let c = 1; c <= 9; c += 2) {
          const specs = [a, b, c].map((n) => ({ adet: n, layout: 'sira' as const }));
          const r = satirKumeKutulari(
            specs.map((spec) => ({ tur: 'kume' as const, spec })),
            865,
            400,
            50,
            O,
          );
          ayrikVeIceride(r.kutular, 865, 400);
          for (let i = 1; i < 3; i++) expect(r.kutular[i].x).toBeGreaterThan(r.kutular[i - 1].x);
          specs.forEach((spec, i) => {
            const k = r.kutular[i];
            const y = kagitKumeYerlesimi(spec, k.w, k.h, O.enBuyuk, r.boyut, O.enAz, O.bosluk);
            expect(y.boyut).toBeCloseTo(r.boyut, 6);
            icerideVeAralikli(y.noktalar, y.boyut, k.w, k.h);
          });
          enKucuk = Math.min(enKucuk, r.boyut * MM);
        }
    expect(enKucuk).toBeGreaterThanOrEqual(7 - 1e-6);
  });

  it('işlem sahnesi: sabit işaret yerleri korunur, 13 + 7 = 20 bile sığar', () => {
    const r = satirKumeKutulari(
      [
        { tur: 'kume', spec: { adet: 13, layout: 'sira' } },
        { tur: 'sabit', w: 49 },
        { tur: 'kume', spec: { adet: 7, layout: 'sira' } },
        { tur: 'sabit', w: 49 },
        { tur: 'kume', spec: { adet: 20, layout: 'sira' } },
      ],
      865,
      400,
      15,
      O,
    );
    ayrikVeIceride(r.kutular, 865, 400);
    expect(r.kutular[1].w).toBe(49);
    expect(r.kutular[3].w).toBe(49);
    expect(r.boyut * MM).toBeGreaterThan(6);
  });
});

// ------------------------------------------------------------------ arşiv maddeleri

const T = trDuzlestir(tr as never);
const planlar: KagitPlani[] = arsivKayitlari(skillsData as never).map((k) => kagitPlaniUret(arsivIstegi(k), T));
{
  const ef = etkiFormlariUret(T);
  planlar.push(ef.A, ef.B);
}
const maddeler: KagitMaddesi[] = planlar.flatMap((p) => p.sayfalar.flat());

describe('karşılaştırma seçenekleri: kâğıt yerleşimi (KG-106)', () => {
  const kume = maddeler.filter(
    (m) => m.templateId === 'M-KARSILASTIR' && !m.sahne && m.secenekler.some((s) => s.deger.tur === 'gorsel'),
  );

  it('arşivdeki tüm küme seçenekli karşılaştırma maddeleri genişletilmiş yerleşimi alır', () => {
    expect(kume.length).toBeGreaterThan(30);
    for (const m of kume) expect(kumeSecenekYerlesimi(m, '2x3')).not.toBeNull();
  });

  it('ızgara maddenin içinde kalır; iki küme kutusu eşit; metin kutusu 26 mm', () => {
    for (const m of kume) {
      const y = kumeSecenekYerlesimi(m, '2x3')!;
      const ic = maddeIcOlcusu('2x3', 1);
      const H = ic.h - yonergeYuksekligi(m.yonergeMetni, ic.w) - 1;
      const W = y.sutunlar.reduce((t, x) => t + x, 0) + 3 * (y.sutunlar.length - 1);
      const Hy = y.satirlar.reduce((t, x) => t + x, 0) + 3 * (y.satirlar.length - 1);
      expect(W).toBeLessThanOrEqual(ic.w + EPS);
      expect(Hy).toBeLessThanOrEqual(H + EPS);
      expect(y.kume.w).toBeGreaterThanOrEqual(26);
      expect(y.kume.h).toBeGreaterThanOrEqual(26);
      // İç alan: kontur + dolgu + rozet şeridi düşülmüş.
      const pay = 2 * (SECENEK_KONTUR_MM + YERLESIK_DOLGU_MM);
      expect(y.ic.w + y.ic.h).toBeCloseTo(y.kume.w + y.kume.h - 2 * pay - ROZET_SERIDI_MM, 6);
      expect(y.yerler).toHaveLength(m.secenekler.length);
    }
  });

  it('iki küme aynı boyda, kutuda, aralıklı; ≤ 10 nesnelik maddelerde ≥ 10 mm', () => {
    for (const m of kume) {
      const y = kumeSecenekYerlesimi(m, '2x3')!;
      const w = Math.round(y.ic.w / SECENEK_MM_BIRIM);
      const h = Math.round(y.ic.h / SECENEK_MM_BIRIM);
      const specs = m.secenekler.flatMap((s) =>
        s.deger.tur === 'gorsel' && s.deger.gorsel.type === 'nesneKumesi' ? [s.deger.gorsel as KumeTarifi] : [],
      );
      expect(specs).toHaveLength(2);
      const boylar = specs.map((spec) => {
        const k = kagitKumeYerlesimi(spec, w, h, O.enBuyuk, y.boyut, O.enAz, O.bosluk);
        icerideVeAralikli(k.noktalar, k.boyut, w, h);
        return k.boyut;
      });
      expect(boylar[0]).toBeCloseTo(boylar[1], 9);
      expect(boylar[0]).toBeCloseTo(y.boyut, 6);
      if (Math.max(...specs.map((s) => s.adet)) <= 10) expect(y.boyut * MM).toBeGreaterThanOrEqual(10 - 1e-6);
      else expect(y.boyut * MM).toBeGreaterThanOrEqual(7.5);
    }
  });

  it('sahneli, yazma kutulu, eşleştirmeli ya da 1x4 maddeler eski 26 mm satırında kalır', () => {
    for (const m of maddeler) {
      if (m.sahne || m.kutular.length > 0 || m.yanitBicimi === 'cizgiyleEsle')
        expect(kumeSecenekYerlesimi(m, '2x3')).toBeNull();
      expect(kumeSecenekYerlesimi(m, '1x4')).toBeNull();
    }
  });
});

describe('"Eşit mi?" bileşik sahnesi: seçenekler sağda (KG-106)', () => {
  it('iki kümeli sahne + metin seçenekli dar madde sahneyi tüm yükseklikle alır', () => {
    const esit = maddeler.filter((m) => sahneYanSecenekli(m, '2x3'));
    expect(esit.length).toBeGreaterThan(0);
    for (const m of esit) {
      expect(m.templateId).toBe('M-KARSILASTIR');
      const ic = maddeIcOlcusu('2x3', 1);
      const k = sahneKutusu(m, '2x3');
      expect(k.w).toBeCloseTo(ic.w - 29, 6);
      expect(k.h).toBeGreaterThan(55);
      expect(sahneYanSecenekli(m, '1x4')).toBe(false);
    }
  });
});
