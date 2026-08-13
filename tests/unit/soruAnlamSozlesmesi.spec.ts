import { describe, expect, it } from 'vitest';
import { olcBirimUret } from '../../src/exercises/templates/olcBirim';
import { olcTahminUret } from '../../src/exercises/templates/olcTahmin';
import { olcUzunlukUret } from '../../src/exercises/templates/olcUzunluk';
import { olcKutleUret } from '../../src/exercises/templates/olcKutle';
import { veriGrafikUret } from '../../src/exercises/templates/veriGrafik';
import { createRng } from '../../src/exercises/rng';
import type { Option, VisualSpec } from '../../src/exercises/types';

function dogruGorsel(exercise: { readonly options: readonly Option[] }): VisualSpec {
  const option = exercise.options.find((item) => 'correct' in item && item.correct);
  if (!option || option.deger.tur !== 'gorsel') throw new Error('Görsel doğru seçenek bulunamadı.');
  return option.deger.gorsel;
}

function sesAnahtari(exercise: { readonly prompt: { readonly ses: unknown } }): string {
  const ses = exercise.prompt.ses;
  if (typeof ses === 'object' && ses !== null && 'kind' in ses && ses.kind === 'key') return ses.key;
  throw new Error('Bu sözleşme testi anahtarlı sesli soru bekler.');
}

describe('soru anlam sözleşmeleri', () => {
  it('birimle ölçme ve tahmin, doğru sayıyı sahnedeki gerçek birim uzunluğuna bağlar', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      for (const uret of [olcBirimUret, olcTahminUret] as const) {
        const ex = uret({ seed, difficulty: 3 }, createRng(seed));
        expect(ex.prompt.gorsel.type).toBe('olcumSahnesi');
        if (ex.prompt.gorsel.type !== 'olcumSahnesi') continue;
        const dogru = dogruGorsel(ex);
        expect(dogru.type).toBe('rakam');
        if (dogru.type !== 'rakam') continue;
        expect(dogru.sayi).toBe(ex.prompt.gorsel.birimAdedi);
      }
    }
  });

  it('uzunluk ve kütle sorularında doğru renk, sahnedeki uzun/ağır nesneye aittir', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      for (const uret of [olcUzunlukUret, olcKutleUret] as const) {
        const ex = uret({ seed, difficulty: 3 }, createRng(seed));
        expect(ex.prompt.gorsel.type).toBe('olcumKarsilastirma');
        if (ex.prompt.gorsel.type !== 'olcumKarsilastirma') continue;
        const dogru = dogruGorsel(ex);
        expect(dogru.type).toBe('nesneKumesi');
        if (dogru.type !== 'nesneKumesi') continue;
        const soru = sesAnahtari(ex);
        const sol = ex.prompt.gorsel.sol;
        const sag = ex.prompt.gorsel.sag;
        const beklenenRenk = soru.endsWith('uzun') || soru.endsWith('agir')
          ? (sol.deger > sag.deger ? sol.renk : sag.renk)
          : (sol.deger < sag.deger ? sol.renk : sag.renk);
        expect(dogru.renk).toBe(beklenenRenk);
      }
    }
  });

  it('nesne grafiğinde “toplam kaç?” sorusunun doğru seçeneği tüm kategorilerin toplamıdır', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const ex = veriGrafikUret({ seed, difficulty: 4 }, createRng(seed));
      if (sesAnahtari(ex) !== 'soru-veri.toplam-kac') continue;
      expect(ex.prompt.gorsel.type).toBe('sahne');
      if (ex.prompt.gorsel.type !== 'sahne') continue;
      const toplam = ex.prompt.gorsel.parcalar.reduce((acc, parca) => {
        if (parca.gorsel.type !== 'nesneKumesi') throw new Error('Grafik kategorisi nesne kümesi olmalı.');
        return acc + parca.gorsel.adet;
      }, 0);
      const dogru = dogruGorsel(ex);
      expect(dogru).toEqual({ type: 'rakam', sayi: toplam });
    }
  });
});
