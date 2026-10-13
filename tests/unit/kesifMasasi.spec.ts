/** Plan v2 Adım 44 aşama 1: Keşif Masası saf indirgeyici ve seslendirme. */
import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/exercises/rng';
import {
  KESIF_ARACLARI,
  KESIF_GOZ_SAYISI,
  KESIF_KEFE_SINIRI,
  KESIF_NESNE_SINIRI,
  doluSayisi,
  kesifBaslangic,
  kesifIndirge,
  kesifSeslendirme,
  type KesifDurumu,
  type KesifOlayi,
} from '../../src/kesif/kesifMasasi';
import { AUDIO_MANIFEST } from '../../src/audio/audioManifest.generated';

const dokun = (hedef: string): KesifOlayi => ({ tur: 'dokun', hedef });
const uygula = (d: KesifDurumu, ...h: string[]): KesifDurumu => h.reduce((s, x) => kesifIndirge(s, dokun(x)), d);
const tekrar = (h: string, n: number): string[] => Array.from({ length: n }, () => h);

const HEDEFLER = [
  'arti',
  'eksi',
  'birlestir',
  'sol+',
  'sol-',
  'sag+',
  'sag-',
  ...Array.from({ length: 22 }, (_, i) => `goz:${i}`),
  ...Array.from({ length: 22 }, (_, i) => `nesne:${i}`),
  ...Array.from({ length: 22 }, (_, i) => `nokta:${i}`),
  ...Array.from({ length: 22 }, (_, i) => `ayir:${i}`),
  'goz:-1',
  'nokta:05',
  'bilinmeyen',
  '',
];
/** Tohumlu rastgele olay (fast-check yok; mulberry32 ile deterministik). */
function rastgeleOlay(rng: ReturnType<typeof createRng>): KesifOlayi {
  const r = rng.int(0, 9);
  if (r === 0) return { tur: 'aracSec', arac: KESIF_ARACLARI[rng.int(0, KESIF_ARACLARI.length - 1)] };
  if (r === 1) return { tur: 'sifirla' };
  return dokun(HEDEFLER[rng.int(0, HEDEFLER.length - 1)]);
}

function sinirlarIcinde(d: KesifDurumu): boolean {
  switch (d.arac) {
    case 'onlukCerceve':
      return d.dolu.length === KESIF_GOZ_SAYISI;
    case 'nesneKumesi':
      return Number.isInteger(d.sayi) && d.sayi >= 0 && d.sayi <= KESIF_NESNE_SINIRI;
    case 'sayiDogrusu':
      return Number.isInteger(d.konum) && d.konum >= 0 && d.konum <= KESIF_NESNE_SINIRI;
    case 'terazi':
      return [d.sol, d.sag].every((n) => Number.isInteger(n) && n >= 0 && n <= KESIF_KEFE_SINIRI);
    case 'ayirBirlestir':
      return (
        d.toplam >= 0 &&
        d.toplam <= KESIF_NESNE_SINIRI &&
        (d.ayirma === null || (d.ayirma >= 0 && d.ayirma <= d.toplam))
      );
  }
}

function anahtarlar(d: KesifDurumu): string[] {
  const s = kesifSeslendirme(d);
  if (!s) return [];
  return s.kind === 'key' ? [s.key] : s.keys;
}

describe('kesifIndirge — sınırlar', () => {
  it('rastgele olay dizilerinde sınırlar aşılmaz; her seslendirme anahtarı manifestte', () => {
    for (let tohum = 1; tohum <= 300; tohum++) {
      const rng = createRng(tohum);
      let d = kesifBaslangic(KESIF_ARACLARI[tohum % KESIF_ARACLARI.length]);
      for (let i = 0; i < 80; i++) {
        d = kesifIndirge(d, rastgeleOlay(rng));
        expect(sinirlarIcinde(d)).toBe(true);
        for (const k of anahtarlar(d)) expect(k in AUDIO_MANIFEST).toBe(true);
      }
    }
  });
  it('nesne kümesi ve sayı doğrusu 20de, terazi kefesi 10da durur', () => {
    expect(uygula(kesifBaslangic('nesneKumesi'), ...tekrar('arti', 25))).toEqual({ arac: 'nesneKumesi', sayi: 20 });
    expect(uygula(kesifBaslangic('sayiDogrusu'), ...tekrar('arti', 25))).toEqual({ arac: 'sayiDogrusu', konum: 20 });
    expect(uygula(kesifBaslangic('terazi'), ...tekrar('sol+', 15), 'sag+')).toEqual({
      arac: 'terazi',
      sol: 10,
      sag: 1,
    });
    expect(uygula(kesifBaslangic('ayirBirlestir'), ...tekrar('arti', 30))).toMatchObject({ toplam: 20 });
  });
  it('alt sınırda eksi durumu değiştirmez (aynı nesne)', () => {
    for (const arac of KESIF_ARACLARI) {
      const d = arac === 'ayirBirlestir' ? uygula(kesifBaslangic(arac), ...tekrar('eksi', 5)) : kesifBaslangic(arac);
      expect(kesifIndirge(d, dokun('eksi'))).toBe(d);
    }
  });
  it('geçersiz hedef ve aynı araç seçimi durumu değiştirmez', () => {
    for (const arac of KESIF_ARACLARI) {
      const d = kesifBaslangic(arac);
      for (const h of ['bilinmeyen', '', 'goz:20', 'goz:-1', 'nokta:21', 'nokta:05', 'ayir:x'])
        expect(kesifIndirge(d, dokun(h))).toBe(d);
      expect(kesifIndirge(d, { tur: 'aracSec', arac })).toBe(d);
    }
  });
});

describe('araçlar', () => {
  it('onluk çerçeve: göz dokununca dolar/boşalır; arti ilk boşu, eksi son doluyu değiştirir', () => {
    let d = uygula(kesifBaslangic('onlukCerceve'), 'goz:3', 'goz:7');
    if (d.arac !== 'onlukCerceve') throw new Error();
    expect(doluSayisi(d.dolu)).toBe(2);
    d = uygula(d, 'arti', 'eksi', 'goz:3');
    if (d.arac !== 'onlukCerceve') throw new Error();
    expect(d.dolu.map((x, i) => (x ? i : -1)).filter((i) => i >= 0)).toEqual([0]);
    const tam = uygula(kesifBaslangic('onlukCerceve'), ...tekrar('arti', 25));
    if (tam.arac !== 'onlukCerceve') throw new Error();
    expect(doluSayisi(tam.dolu)).toBe(20);
  });
  it('nesne kümesi: var olan nesneye dokunmak bir nesne çıkarır, olmayan nesne değiştirmez', () => {
    const d = uygula(kesifBaslangic('nesneKumesi'), 'arti', 'arti', 'arti');
    expect(kesifIndirge(d, dokun('nesne:1'))).toEqual({ arac: 'nesneKumesi', sayi: 2 });
    expect(kesifIndirge(d, dokun('nesne:5'))).toBe(d);
  });
  it('sayı doğrusu: noktaya zıplar', () => {
    expect(uygula(kesifBaslangic('sayiDogrusu'), 'nokta:13', 'eksi')).toEqual({ arac: 'sayiDogrusu', konum: 12 });
  });
  it('ayır-birleştir: toplamdan büyük ayırma reddedilir; toplam değişince ayırma kalkar', () => {
    const d = uygula(kesifBaslangic('ayirBirlestir'), 'ayir:2');
    expect(d).toEqual({ arac: 'ayirBirlestir', toplam: 5, ayirma: 2 });
    expect(kesifIndirge(d, dokun('ayir:6'))).toBe(d);
    expect(uygula(d, 'arti')).toEqual({ arac: 'ayirBirlestir', toplam: 6, ayirma: null });
    expect(uygula(d, 'birlestir')).toEqual({ arac: 'ayirBirlestir', toplam: 5, ayirma: null });
  });
  it('sıfırla aracın başlangıcına, aracSec yeni aracın başlangıcına döner', () => {
    const d = uygula(kesifBaslangic('terazi'), 'sol+', 'sag+');
    expect(kesifIndirge(d, { tur: 'sifirla' })).toEqual(kesifBaslangic('terazi'));
    expect(kesifIndirge(d, { tur: 'aracSec', arac: 'sayiDogrusu' })).toEqual(kesifBaslangic('sayiDogrusu'));
  });
});

describe('kesifSeslendirme', () => {
  it('sayı araçları sayı klibini, terazi dengeyi, ayır-birleştir "a artı b eşit t" dizisini söyler', () => {
    expect(kesifSeslendirme(uygula(kesifBaslangic('nesneKumesi'), ...tekrar('arti', 7)))).toEqual({
      kind: 'key',
      key: 'sayi.7',
    });
    expect(kesifSeslendirme(uygula(kesifBaslangic('onlukCerceve'), 'goz:0', 'goz:19'))).toEqual({
      kind: 'key',
      key: 'sayi.2',
    });
    expect(kesifSeslendirme(uygula(kesifBaslangic('terazi'), 'sol+', 'sag+'))).toEqual({
      kind: 'key',
      key: 'esit.dengede',
    });
    expect(kesifSeslendirme(uygula(kesifBaslangic('terazi'), 'sol+'))).toEqual({
      kind: 'key',
      key: 'esit.dengede-degil',
    });
    expect(kesifSeslendirme(uygula(kesifBaslangic('ayirBirlestir'), ...tekrar('arti', 3), 'ayir:5'))).toEqual({
      kind: 'sequence',
      keys: ['sayi.5', 'op.arti', 'sayi.3', 'op.esit', 'sayi.8'],
    });
  });
});
