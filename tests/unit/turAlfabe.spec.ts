/**
 * Türkçe alfabe, tr-TR büyük/küçük ve öğretilen küme modeli (Okuma Yazma planı Adım 62).
 */
import { describe, expect, it } from 'vitest';
import {
  ALFABE,
  buyukMu,
  harfGrubu,
  HARF_GRUPLARI,
  OGRETIM_SIRASI,
  trBuyuk,
  trKucuk,
  unluMu,
  yalnizUnsuzMu,
} from '../../src/content/dersler/tur/alfabe';
import {
  dekodlanabilirMi,
  girisNoktasi,
  kumeCoz,
  kumeGecerliMi,
  kumeKodla,
  resmiKume,
  RESMI_GLIF_SIRASI,
} from '../../src/content/dersler/tur/ogretilenKume';

describe('tr-TR büyük/küçük', () => {
  it('i ↔ İ, ı ↔ I (varsayılan toUpperCase yanlış)', () => {
    expect(trBuyuk('i')).toBe('İ');
    expect(trKucuk('I')).toBe('ı');
    expect(trBuyuk('ı')).toBe('I');
    expect(trKucuk('İ')).toBe('i');
    expect(trBuyuk('iğdır')).toBe('İĞDIR');
    expect(trKucuk('IĞDIR')).toBe('ığdır');
    expect('i'.toUpperCase()).toBe('I'); // tuzak: yerel ayarsız dönüşüm Türkçede yanlıştır
  });

  it('büyük harf, ünlü/ünsüz ayrımı', () => {
    expect(['A', 'İ', 'I', 'Ş', 'Ğ'].every(buyukMu)).toBe(true);
    expect(['a', 'i', 'ı', '.', '1', 'Q', 'x'].some(buyukMu)).toBe(false);
    expect(ALFABE.filter(unluMu).join('')).toBe('aeıioöuü');
    expect(yalnizUnsuzMu('n')).toBe(true);
    expect(yalnizUnsuzMu('nt')).toBe(true);
    expect(yalnizUnsuzMu('N.')).toBe(true);
    expect(yalnizUnsuzMu('na')).toBe(false);
    expect(yalnizUnsuzMu('a')).toBe(false);
    expect(yalnizUnsuzMu('…')).toBe(false);
  });
});

describe('harf envanteri (Şekil 1)', () => {
  it('29 harf, 5 grup, resmî sıra', () => {
    expect(ALFABE).toHaveLength(29);
    expect(HARF_GRUPLARI.map((g) => g.join(''))).toEqual(['anetil', 'okurım', 'üsöydz', 'çbgcş', 'phvğfj']);
    expect([...OGRETIM_SIRASI].sort((a, b) => a.localeCompare(b, 'tr'))).toEqual([...ALFABE]);
    expect(harfGrubu('n')).toBe(1);
    expect(harfGrubu('I')).toBe(2);
    expect(harfGrubu('j')).toBe(5);
    expect(() => harfGrubu('q')).toThrow();
  });

  it('glif sırası: her harfte önce küçük, sonra büyük', () => {
    expect(RESMI_GLIF_SIRASI).toHaveLength(58);
    expect(RESMI_GLIF_SIRASI.slice(0, 12).join('')).toBe('aAnNeEtTiİlL');
    expect(RESMI_GLIF_SIRASI.slice(20, 24).join('')).toBe('ıImM');
  });
});

describe('giriş noktası (program örnekleri)', () => {
  const ORNEKLER: Record<string, string> = {
    a: 'a', an: 'n', en: 'e', at: 't', et: 't', alt: 'l', ana: 'n', ata: 't', nal: 'l',
    anne: 'e', nene: 'e', alet: 'l', atlet: 'l',
  }; // prettier-ignore
  it('a, an, en, at, et, alt, ana, ata, nal, anne, nene, alet, atlet doğru harfte girer', () => {
    for (const [s, h] of Object.entries(ORNEKLER)) expect(girisNoktasi(s)?.harf, s).toBe(h);
  });

  it('büyük harf biçimi ayrıca öğretilir: "Ata" t, "Nil" l, "Okan o ne?" k, "Ona" O; İ ile ı ayrı', () => {
    expect(girisNoktasi('Ata')).toMatchObject({ harf: 't', bicim: 'kucuk', grup: 1 });
    expect(girisNoktasi('Nil')?.harf).toBe('l');
    expect(girisNoktasi('Okan o ne?')).toMatchObject({ harf: 'k', bicim: 'kucuk', grup: 2 });
    expect(girisNoktasi('Ona')).toMatchObject({ harf: 'o', bicim: 'buyuk', grup: 2 });
    expect(girisNoktasi('İnek')?.harf).toBe('k');
    expect(girisNoktasi('Irmak')?.harf).toBe('m');
    expect(girisNoktasi('...')).toBeNull();
  });
});

describe('öğretilen küme ve ?tur= kodu', () => {
  it('resmî küme ve dekodlanabilirlik', () => {
    const t = resmiKume('t');
    expect([...t].join('')).toBe('aAnNeEtT');
    expect([...resmiKume('t', false)].join('')).toBe('aAnNeEt');
    expect(dekodlanabilirMi('Ata', t)).toBe(true);
    expect(dekodlanabilirMi('anne tane', t)).toBe(true);
    expect(dekodlanabilirMi('Nil', t)).toBe(false);
    expect(dekodlanabilirMi('Ata', resmiKume('t', false))).toBe(true);
    expect(dekodlanabilirMi('Tane', resmiKume('t', false))).toBe(false);
  });

  it('kodla/çöz gidiş-dönüş; katı çözücü', () => {
    for (const h of OGRETIM_SIRASI) {
      const k = resmiKume(h);
      const kod = kumeKodla(k);
      expect(kod.length).toBeLessThanOrEqual(12);
      expect(kumeCoz(kod)).toEqual(k);
    }
    const ozel = new Set(['a', 'n', 'm', 'k', 'K']);
    expect(kumeCoz(kumeKodla(ozel))).toEqual(ozel);
    for (const kotu of ['', '0', 'A1', 'zzzzzzzzzzzzz', '!', 'zzzzzzzzzzzz']) expect(kumeCoz(kotu), kotu).toBeNull();
    expect(kumeCoz(kumeKodla(new Set(['A'])))).toBeNull(); // büyük var, küçük yok
    expect(kumeGecerliMi(new Set(['a', 'A']))).toBe(true);
    expect(kumeGecerliMi(new Set(['x']))).toBe(false);
    expect(() => kumeKodla(new Set(['q']))).toThrow();
  });
});
