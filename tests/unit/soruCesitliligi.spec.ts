import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/exercises/rng';
import { olcKutleUret } from '../../src/exercises/templates/olcKutle';
import { olcUzunlukUret } from '../../src/exercises/templates/olcUzunluk';
import { tersIslemUret } from '../../src/exercises/templates/tersIslem';
import { veriSiklikUret } from '../../src/exercises/templates/veriSiklik';
import type { VisualSpec } from '../../src/exercises/types';

function islemDogruMu(gorsel: VisualSpec): boolean {
  if (gorsel.type !== 'islemKarti') {
    throw new Error('Ters işlem eşleştirmesi işlem kartları üretmelidir.');
  }
  const hesaplanan = gorsel.islem === '+'
    ? gorsel.ilkSayi + gorsel.ikinciSayi
    : gorsel.ilkSayi - gorsel.ikinciSayi;
  return hesaplanan === gorsel.sonuc;
}

function ucIsciler(gorsel: VisualSpec): readonly number[] {
  if (gorsel.type !== 'islemKarti') throw new Error('İşlem kartı bekleniyordu.');
  return [gorsel.ilkSayi, gorsel.ikinciSayi, gorsel.sonuc].sort((a, b) => a - b);
}

describe('soru çeşidi sözleşmeleri', () => {
  it('uzunluk ve kütle soruları farklı günlük nesne bağlamlarıyla üretilir', () => {
    const uzunlukNesneleri = new Set<string>();
    const kutleNesneleri = new Set<string>();

    for (let seed = 1; seed <= 80; seed += 1) {
      const uzunluk = olcUzunlukUret({ seed, difficulty: 2 }, createRng(seed));
      const kutle = olcKutleUret({ seed, difficulty: 2 }, createRng(seed));
      if (uzunluk.prompt.gorsel.type !== 'olcumKarsilastirma') throw new Error('Uzunluk sahnesi bekleniyordu.');
      if (kutle.prompt.gorsel.type !== 'olcumKarsilastirma') throw new Error('Kütle sahnesi bekleniyordu.');
      uzunlukNesneleri.add(uzunluk.prompt.gorsel.sol.nesne);
      kutleNesneleri.add(kutle.prompt.gorsel.sol.nesne);
    }

    expect(uzunlukNesneleri.size).toBeGreaterThanOrEqual(4);
    expect(kutleNesneleri.size).toBeGreaterThanOrEqual(4);
  });

  it('ters işlem eşleştirmesinde her kart çifti doğru, aynı sayı üçlüsüne ait ve iki işlem ailesi dönüşümlüdür', () => {
    const aileler = new Set<string>();

    for (let seed = 1; seed <= 80; seed += 1) {
      const exercise = tersIslemUret({ seed, difficulty: 4 }, createRng(seed));
      const kartlar = new Map(exercise.options.map((option) => [option.id, option]));

      for (const [solId, sagId] of exercise.validation.ciftler) {
        const sol = kartlar.get(solId);
        const sag = kartlar.get(sagId);
        if (!sol || !sag || sol.deger.tur !== 'gorsel' || sag.deger.tur !== 'gorsel') {
          throw new Error('Ters işlem kartları görsel olarak bulunamadı.');
        }
        expect(islemDogruMu(sol.deger.gorsel)).toBe(true);
        expect(islemDogruMu(sag.deger.gorsel)).toBe(true);
        expect(ucIsciler(sol.deger.gorsel)).toEqual(ucIsciler(sag.deger.gorsel));
      }

      const ilkSol = exercise.options.find((option) => option.id === 'sol-0');
      if (!ilkSol || ilkSol.deger.tur !== 'gorsel' || ilkSol.deger.gorsel.type !== 'islemKarti') {
        throw new Error('İlk ters işlem kartı bulunamadı.');
      }
      aileler.add(ilkSol.deger.gorsel.islem);
    }

    expect(aileler).toEqual(new Set(['+', '-']));
  });

  it('sıklık tablosunda her kategori için ayırt edilebilir tek bir doğru sayı kartı üretir', () => {
    for (let seed = 1; seed <= 80; seed += 1) {
      const exercise = veriSiklikUret({ seed, difficulty: 3 }, createRng(seed));
      const dogruSayilar = exercise.options
        .filter((option) => option.correct === true)
        .map((option) => {
          if (option.deger.tur !== 'gorsel' || option.deger.gorsel.type !== 'rakam') {
            throw new Error('Sıklık tablosunda rakam kartı bekleniyordu.');
          }
          return option.deger.gorsel.sayi;
        });

      expect(new Set(dogruSayilar).size).toBe(dogruSayilar.length);
      expect(Object.keys(exercise.validation.dogruEslesme)).toHaveLength(dogruSayilar.length);
    }
  });
});
