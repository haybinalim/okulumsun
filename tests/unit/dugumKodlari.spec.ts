import { describe, expect, it } from 'vitest';
import { skillsData } from '../../src/content/skillsData';
import { DUGUM_KODLARI, SILINEN_KODLAR, kodaGoreDugum } from '../../src/ogretmen/dugumKodlari';

describe('dugumKodlari', () => {
  it('her düğümün 2 karakterlik kodu var ve tablo skills.json ile birebir', () => {
    const kimlikler = skillsData.map((d) => d.id).sort();
    expect(Object.keys(DUGUM_KODLARI).sort()).toEqual(kimlikler);
    for (const kod of Object.values(DUGUM_KODLARI)) expect(kod).toMatch(/^[a-z0-9]{2}$/);
  });
  it('kodlar benzersiz ve silinen kod yeniden verilmemiş', () => {
    const kodlar = Object.values(DUGUM_KODLARI);
    expect(new Set(kodlar).size).toBe(kodlar.length);
    for (const silinen of SILINEN_KODLAR) expect(kodlar).not.toContain(silinen);
  });
  it('ilk harf temayı gösterir (a = tema 1)', () => {
    for (const d of skillsData) expect(DUGUM_KODLARI[d.id][0]).toBe('abcdefg'[d.tema - 1]);
  });
  it('kodaGoreDugum tersini verir; bilinmeyen kod null', () => {
    for (const [id, kod] of Object.entries(DUGUM_KODLARI)) expect(kodaGoreDugum(kod)).toBe(id);
    expect(kodaGoreDugum('zz')).toBeNull();
    expect(kodaGoreDugum('')).toBeNull();
  });
  it('örnek: konum ifadeleri a1', () => {
    expect(DUGUM_KODLARI['mat.uzam.konum-ifadeleri']).toBe('a1');
  });
});
