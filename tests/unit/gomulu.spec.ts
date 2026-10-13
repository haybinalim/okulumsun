import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gomuluBaglam, gomuluKisitlari } from '../../src/gomulu';

/** Plan v2 Adım 56: gömülü mod (EBA / okul portalı iframe'i). */
describe('gomuluBaglam', () => {
  it('yalnız iframe içinde ve bilinen değerle açılır', () => {
    expect(gomuluBaglam('?gomulu=eba', true)).toBe('eba');
    expect(gomuluBaglam('?device=board&gomulu=okul-portali', true)).toBe('okul-portali');
    expect(gomuluBaglam('gomulu=eba', true)).toBe('eba');
  });

  it('bağımsız sekmede parametre tek başına yetmez', () => {
    expect(gomuluBaglam('?gomulu=eba', false)).toBe('yok');
  });

  it('parametresiz, bilinmeyen, boş veya büyük harfli değer → yok', () => {
    for (const a of ['', '?', '?gomulu=', '?gomulu=EBA', '?gomulu=evet', '?gomulu=eba.gov.tr', '?gomulu']) {
      expect(gomuluBaglam(a, true), a).toBe('yok');
    }
  });
});

describe('gomuluKisitlari', () => {
  it('gömülü değilken her şey açık', () => {
    expect(gomuluKisitlari('yok', false)).toEqual({ eveGonder: true, tamEkran: true, sorunBildir: true, kaynaklar: true });
  });

  it('gömülüyken Eve gönder kapalı; tam ekran iframe iznine bağlı; Sorun bildir ve Kaynaklar açık', () => {
    for (const b of ['eba', 'okul-portali'] as const) {
      expect(gomuluKisitlari(b, false)).toEqual({ eveGonder: false, tamEkran: false, sorunBildir: true, kaynaklar: true });
      expect(gomuluKisitlari(b, true).tamEkran).toBe(true);
    }
  });
});

describe('üst pencereyle iletişim yok (K9 ile birlikte)', () => {
  it('gömülü kaynak dosyaları postMessage / parent / opener içermez', () => {
    for (const yol of ['src/gomulu.ts', 'src/platform/gomuluAcilis.ts']) {
      const kod = readFileSync(yol, 'utf8')
        .split('\n')
        .filter((s) => !/^\s*(\*|\/\/|\/\*)/.test(s))
        .join('\n');
      expect(kod).not.toMatch(/postMessage\s*\(|window\.parent|window\.opener|top\.location/);
    }
  });
});
