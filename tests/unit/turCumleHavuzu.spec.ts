/**
 * Cümle havuzu (Adım 74a): `ders-verisi/tur/icerik/cumleler.json` şema + K-OY doğrulayıcısı (D-02, D-07…D-10, D-26),
 * grup başına sayılar, çalışma anı ayrıştırıcısı, öğretilen küme süzgeci ve teyit kapısı (KG-155).
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { turIcerikDosyasiniAyristir } from '../../src/content/schema/turIcerik';
import { turIceriginiDogrula, UNLEM_SOZCUKLERI } from '../../src/content/dersler/tur/dogrulayici';
import { cumleHavuzunuAyristir, okunabilirCumleler } from '../../src/content/dersler/tur/sablonlar/cumle/cumleHavuzu';
import { resmiKume } from '../../src/content/dersler/tur/ogretilenKume';
import { HARF_GRUPLARI, trKucuk } from '../../src/content/dersler/tur/alfabe';
import { cumleKlibi } from '../../src/content/dersler/tur/sablonlar/klipler';

const ham = JSON.parse(readFileSync('ders-verisi/tur/icerik/cumleler.json', 'utf8')) as {
  teyit: { durum: string };
  cumleler: Record<string, unknown>[];
};
const dosya = turIcerikDosyasiniAyristir(ham);
const havuz = cumleHavuzunuAyristir(ham);

describe('Cümle havuzu (Adım 74a)', () => {
  it('şema ve doğrulayıcı: 0 hata; teyit bekliyor (geliştirmede uyarı, yayında hata)', () => {
    const r = turIceriginiDogrula(dosya);
    expect(r.hatalar).toEqual([]);
    expect(ham.teyit.durum).toBe('bekliyor');
    expect(dosya.cumleler.every((c) => c.teyit === 'bekliyor')).toBe(true);
    const yayin = turIceriginiDogrula(dosya, { yayin: true });
    expect(yayin.hatalar.some((h) => h.kural === 'D-14' && h.oge === 'cumleler')).toBe(true);
  });

  it('grup başına sayılar: 1. grupta cümle yok (D-08), 2.–5. grupta 15–25', () => {
    const sayi = [1, 2, 3, 4, 5].map((g) => dosya.cumleler.filter((c) => c.grup === g).length);
    expect(sayi[0]).toBe(0);
    for (const n of sayi.slice(1)) expect(n).toBeGreaterThanOrEqual(15), expect(n).toBeLessThanOrEqual(25);
  });

  it('noktalama izin tablosu: ? 2. gruptan, ! yalnız 5. grupta ve ünlem sözcüğüyle (D-09)', () => {
    for (const c of dosya.cumleler) {
      if (c.noktalama === '!') {
        expect(c.grup, c.metin).toBe(5);
        expect(UNLEM_SOZCUKLERI.has(trKucuk(c.metin.split(',')[0]))).toBe(true);
      }
      if (c.noktalama === '?') expect(c.grup).toBeGreaterThanOrEqual(2);
      const n = c.metin.split(' ').length;
      expect(n, c.metin).toBeGreaterThanOrEqual(2);
      expect(n, c.metin).toBeLessThanOrEqual(5);
    }
    expect(dosya.cumleler.filter((c) => c.tur === 'unlem').length).toBeGreaterThanOrEqual(5);
  });

  it('her grupta en az bir yeni harf; harfler etiketi kendi grubuna kadar öğretilmiş harflerden', () => {
    for (const c of dosya.cumleler) {
      const grupHarfleri = HARF_GRUPLARI[c.grup! - 1] as readonly string[];
      if (c.tur !== 'unlem') expect([...c.harfler!].some((h) => grupHarfleri.includes(h)), c.metin).toBe(true);
      const ogretilen = HARF_GRUPLARI.slice(0, c.grup).flat() as readonly string[];
      expect([...c.harfler!].every((h) => ogretilen.includes(h)), c.metin).toBe(true);
    }
  });

  it('görsel kimlikleri var olan SVG’ler; özel adlar büyük harfle ve cümlede', () => {
    for (const c of dosya.cumleler) {
      if (c.gorselId) expect(existsSync(`ders-verisi/tur/gorseller/${c.gorselId}.svg`), c.gorselId).toBe(true);
      for (const o of c.ozelAdlar) expect(c.metin.includes(o) && o[0] !== trKucuk(o[0])).toBe(true);
    }
    expect(dosya.cumleler.filter((c) => c.gorselId).length).toBeGreaterThanOrEqual(40);
  });

  it('çalışma anı ayrıştırıcısı bütün öğeleri alır; bozuk öğe atlanır', () => {
    expect(havuz).toHaveLength(dosya.cumleler.length);
    const bozuk = cumleHavuzunuAyristir({
      cumleler: [
        { id: 'x', metin: 'Ata 🍑 al.', girisHarfi: 't', grup: 2, tur: 'bildirme', noktalama: '.' },
        { id: 'y', metin: 'Ata al.', girisHarfi: 't', grup: 2, tur: 'soru', noktalama: '.' },
      ],
    });
    expect(bozuk).toEqual([]);
    expect(() => cumleHavuzunuAyristir({})).toThrow();
  });

  it('öğretilen küme süzgeci: cümle yalnız bütün glifleri ve giriş harfi öğretilince gelir', () => {
    expect(okunabilirCumleler(havuz, resmiKume('l', true))).toEqual([]);
    const g2 = okunabilirCumleler(havuz, resmiKume('m', true));
    expect(g2.length).toBeGreaterThanOrEqual(15);
    expect(g2.every((c) => c.grup === 2)).toBe(true);
    // Büyük harfi öğretilmemiş son harfle başlayan cümle gelmez (önce küçük, sonra büyük; K-OY-11).
    const kucukM = okunabilirCumleler(havuz, resmiKume('m', false));
    expect(kucukM.some((c) => c.metin.startsWith('M'))).toBe(false);
    // Ünlem cümleleri 5. grup açılmadan gelmez ("Aman, …" harfleri 3. grupta olsa da).
    expect(okunabilirCumleler(havuz, resmiKume('ş', true)).some((c) => c.tur === 'unlem')).toBe(false);
    const hepsi = okunabilirCumleler(havuz, resmiKume('j', true));
    expect(hepsi).toHaveLength(havuz.length);
  });

  it('D-26 etiket tuzakları: yanlış grup, harfler, noktalama, tür, giriş harfi', () => {
    const boz = (f: (c: Record<string, unknown>) => void) => {
      const k = structuredClone(ham);
      f(k.cumleler[0]);
      return turIceriginiDogrula(turIcerikDosyasiniAyristir(k)).hatalar.map((h) => h.kural);
    };
    expect(boz((c) => (c.grup = 3))).toContain('D-26');
    expect(boz((c) => (c.harfler = 'an'))).toContain('D-26');
    expect(boz((c) => (c.noktalama = '?'))).toContain('D-26');
    expect(boz((c) => (c.tur = 'soru'))).toContain('D-26');
    expect(boz((c) => (c.girisHarfi = 'z'))).toContain('D-26');
    expect(boz((c) => (c.metin = 'Annem elma alır bugün sabah erken.'))).toContain('D-26');
  });

  it('her cümlenin klip kimliği tekil', () => {
    const k = havuz.map((c) => cumleKlibi(c.id));
    expect(new Set(k).size).toBe(k.length);
  });
});
