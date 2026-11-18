import { describe, expect, it } from 'vitest';
import { OGRETIM_SIRASI, HARF_GRUPLARI } from '../../src/content/dersler/tur/alfabe';
import {
  MEB_KITAP_ESLEMESI,
  MEB_KITAPLARI,
  mebKitapDogrula,
  mebKitapHaftaMetni,
  mebKitapMetni,
  type MebKitapSatiri,
} from '../../src/content/dersler/tur/mebKitap';
import { haftalikSesPlani } from '../../src/content/dersler/tur/sesPlani';

/** Okuma Yazma Adım 82 — MEB TYMM ilk okuma yazma kitabı eşlemesi (teyit: bekliyor). */
describe('MEB kitabı eşlemesi', () => {
  it('depodaki eşleme geçerli; 29 harf, sıra sesPlani ile aynı', () => {
    expect(mebKitapDogrula()).toEqual([]);
    expect(MEB_KITAP_ESLEMESI.map((s) => s.harf)).toEqual([...OGRETIM_SIRASI]);
    expect(haftalikSesPlani().flatMap((h) => h.yeniSesler)).toEqual(MEB_KITAP_ESLEMESI.map((s) => s.harf));
  });

  it('Kitap 1 = 1.–2. grup, Kitap 2 = 3.–5. grup; tema grupla karıştırılmaz', () => {
    const g12 = HARF_GRUPLARI.slice(0, 2).flat();
    for (const s of MEB_KITAP_ESLEMESI) expect(s.kitap).toBe(g12.includes(s.harf) ? 1 : 2);
    const tema = (h: string) => MEB_KITAP_ESLEMESI.find((s) => s.harf === h)!.tema;
    // Tema sınırı grup sınırı değil: 1. grubun i-l harfleri Tema 2'de, 4.–5. grup tek temada.
    expect(['a', 'n', 'e', 't'].map(tema)).toEqual([1, 1, 1, 1]);
    expect(['i', 'l'].map(tema)).toEqual([2, 2]);
    expect(new Set(HARF_GRUPLARI[0].map(tema)).size).toBe(2);
    expect(new Set([...HARF_GRUPLARI[3], ...HARF_GRUPLARI[4]].map(tema))).toEqual(new Set([4]));
  });

  it('metin biçimi ve adresler', () => {
    expect(mebKitapMetni('a')).toBe('MEB kitabı: Kitap 1, s. 52 · Tema 1 Güzel Davranışlarımız');
    expect(mebKitapMetni('J')).toBe('MEB kitabı: Kitap 2, s. 216 · Tema 4 Yol Arkadaşımız Kitaplar');
    expect(mebKitapMetni('İ')).toContain('s. 120');
    expect(mebKitapMetni('x')).toBeNull();
    expect(mebKitapHaftaMetni([])).toBeNull();
    expect(mebKitapHaftaMetni(['i', 'l'])).toBe("MEB kitabı: Kitap 1, i s. 120, l s. 134 · Tema 2 Mustafa Kemal'den Atatürk'e");
    expect(MEB_KITAPLARI[1].adres).toBe('https://tymm.meb.gov.tr/kitap/31');
    expect(MEB_KITAPLARI[2].adres).toBe('https://tymm.meb.gov.tr/kitap/32');
  });

  it('doğrulayıcı bozuk eşlemeyi yakalar', () => {
    const e = [...MEB_KITAP_ESLEMESI];
    expect(mebKitapDogrula(e.slice(1)).join()).toMatch(/29/);
    expect(mebKitapDogrula([e[1], e[0], ...e.slice(2)]).join()).toMatch(/sırası/);
    expect(mebKitapDogrula([e[0], { ...e[0] } as MebKitapSatiri, ...e.slice(2)]).join()).toMatch(/2 kez/);
    expect(mebKitapDogrula(e.map((s) => (s.harf === 'k' ? { ...s, sayfa: 100 } : s))).join()).toMatch(/artan değil/);
  });
});
