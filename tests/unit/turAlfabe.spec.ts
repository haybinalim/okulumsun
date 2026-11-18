/**
 * Türkçe alfabe, tr-TR büyük/küçük ve öğretilen küme modeli (Okuma Yazma planı Adım 62).
 */
import { describe, expect, it } from 'vitest';
import {
  MEB_KITAP_ESLEMESI,
  MEB_KITAPLARI,
  MEB_TEMALARI,
  mebKitapDogrula,
  mebKitapHaftaMetni,
  mebKitapMetni,
  type MebKitapSatiri,
} from '../../src/content/dersler/tur/mebKitap';
import { haftalikSesPlani } from '../../src/content/dersler/tur/sesPlani';
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

  it('29 satır kaynak tabloyla birebir: harf, kitap, sayfa, tema no, tema adı', () => {
    const G = 'Güzel Davranışlarımız';
    const M = "Mustafa Kemal'den Atatürk'e";
    const Ç = 'Çevremizdeki Yaşam';
    const Y = 'Yol Arkadaşımız Kitaplar';
    expect(MEB_KITAP_ESLEMESI.map((s) => [s.harf, s.kitap, s.sayfa, s.tema, MEB_TEMALARI[s.tema]])).toEqual([
      ['a', 1, 52, 1, G], ['n', 1, 64, 1, G], ['e', 1, 80, 1, G], ['t', 1, 98, 1, G],
      ['i', 1, 120, 2, M], ['l', 1, 134, 2, M], ['o', 1, 152, 2, M], ['k', 1, 164, 2, M],
      ['u', 1, 180, 2, M], ['r', 1, 198, 2, M], ['ı', 1, 210, 2, M], ['m', 1, 224, 2, M],
      ['ü', 2, 14, 3, Ç], ['s', 2, 26, 3, Ç], ['ö', 2, 42, 3, Ç], ['y', 2, 54, 3, Ç], ['d', 2, 68, 3, Ç], ['z', 2, 80, 3, Ç],
      ['ç', 2, 98, 4, Y], ['b', 2, 110, 4, Y], ['g', 2, 122, 4, Y], ['c', 2, 136, 4, Y], ['ş', 2, 146, 4, Y],
      ['p', 2, 158, 4, Y], ['h', 2, 170, 4, Y], ['v', 2, 182, 4, Y], ['ğ', 2, 194, 4, Y], ['f', 2, 206, 4, Y], ['j', 2, 216, 4, Y],
    ]); // prettier-ignore
  });
});
