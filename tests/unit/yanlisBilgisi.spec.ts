import { describe, expect, it } from 'vitest';
import { BILGISIZ_YANLIS, basitMaddeSonucu, yanlisBilgisiBirlestir } from '../../src/progress/basitMaddeSonucu';
import { yanlisSecimBilgisi } from '../../src/exercises/hataDestek';
import { tahtaSorusuUret } from '../../src/ogretmen/tahtaSorusu';
import { dersOlayiUret, dersOzetiHesapla } from '../../src/ogretmen/dersOzeti';
import { turSonucu } from '../../src/sinif/takim';
import { skillsData } from '../../src/content/skillsData';
import type { HataEtiketi } from '../../src/exercises/distractors';

/** Plan v2 Adım 40 aşama 3: tanı ve yardım kademesi alt ekrandan ders özetine taşınır. */
const KONUM = 'mat.uzam.konum-ifadeleri';

function tanililSoru() {
  const e = tahtaSorusuUret(KONUM, 3);
  const sik = e.options.find((o) => o.correct !== true && o.diagnosticTag != null);
  if (!sik) throw new Error('tanılı yanlış şık yok');
  return { e, sik };
}

describe('yanlisBilgisiBirlestir', () => {
  it('ilk bilgi olduğu gibi; kademe en yüksek, tanı ilk tanılı yanlışınki', () => {
    const a = { tani: null, yardimKademesi: 0 as const };
    const b = { tani: 'x' as HataEtiketi, yardimKademesi: 2 as const };
    const c = { tani: 'y' as HataEtiketi, yardimKademesi: 0 as const };
    expect(yanlisBilgisiBirlestir(null, a)).toEqual(a);
    expect(yanlisBilgisiBirlestir(yanlisBilgisiBirlestir(a, b), c)).toEqual({ tani: 'x', yardimKademesi: 2 });
  });
});

describe('basitMaddeSonucu yanlış bilgisiyle', () => {
  it('tanı ve kademe sonuca geçer; bilgi yoksa 0/null', () => {
    const s = basitMaddeSonucu(true, 0, 10, { tani: 'x' as HataEtiketi, yardimKademesi: 2 });
    expect(s).toMatchObject({ dogru: true, tani: 'x', kullanilanYardimKademesi: 2 });
    expect(basitMaddeSonucu(true, 0, 10, BILGISIZ_YANLIS)).toMatchObject({ tani: null, kullanilanYardimKademesi: 0 });
  });
});

describe('yanlisSecimBilgisi', () => {
  it('tanılı yanlış şık: tanı + K2 (gösterildiyse)', () => {
    const { e, sik } = tanililSoru();
    expect(yanlisSecimBilgisi(e, sik.id, true)).toEqual({ tani: sik.diagnosticTag, yardimKademesi: 2 });
    expect(yanlisSecimBilgisi(e, sik.id, false)).toEqual({ tani: sik.diagnosticTag, yardimKademesi: 0 });
  });
  it('doğru şık, bilinmeyen şık veya null: tahmin yok', () => {
    const { e } = tanililSoru();
    const dogru = e.options.find((o) => o.correct === true)!;
    expect(yanlisSecimBilgisi(e, dogru.id, true)).toEqual({ tani: null, yardimKademesi: 0 });
    expect(yanlisSecimBilgisi(e, 'yok', true)).toEqual({ tani: null, yardimKademesi: 0 });
    expect(yanlisSecimBilgisi(e, null, true)).toEqual({ tani: null, yardimKademesi: 0 });
  });
});

describe('dersOlayiUret ve turSonucu', () => {
  it('yanlış olduysa ilk deneme doğru sayılmaz; tanı/kademe taşınır', () => {
    const s = basitMaddeSonucu(true, 0, 1, { tani: 'x' as HataEtiketi, yardimKademesi: 2 });
    expect(dersOlayiUret(KONUM as never, s, true)).toEqual({
      skillId: KONUM,
      ilkDenemeDogru: false,
      yardimKademesi: 2,
      tani: 'x',
    });
    expect(dersOlayiUret(KONUM as never, basitMaddeSonucu(true, 0, 1), false).ilkDenemeDogru).toBe(true);
  });
  it('Sınıf Turu: ekranın K2 kademesi K1e düşmez, tanı korunur', () => {
    const s = basitMaddeSonucu(true, 0, 1, { tani: 'x' as HataEtiketi, yardimKademesi: 2 });
    expect(turSonucu(s, 1, false)).toMatchObject({ dogru: false, kullanilanYardimKademesi: 2, tani: 'x' });
    expect(turSonucu(basitMaddeSonucu(true, 0, 1), 1, false).kullanilanYardimKademesi).toBe(1);
  });
  it('uçtan uca: tanılı yanlışlar özette baskın tanı olarak görünür', () => {
    const { e, sik } = tanililSoru();
    const olaylar = [1, 2, 3].map(() => {
      const b = yanlisSecimBilgisi(e, sik.id, true);
      return dersOlayiUret(KONUM as never, basitMaddeSonucu(true, 0, 1, b), true);
    });
    const ozet = dersOzetiHesapla(olaylar, skillsData, 7);
    expect(ozet.zorlanilanlar).toHaveLength(1);
    expect(ozet.zorlanilanlar[0]!.baskinTani?.etiket).toBe(sik.diagnosticTag);
  });
});
