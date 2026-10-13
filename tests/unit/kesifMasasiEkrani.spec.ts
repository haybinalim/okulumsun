/** Plan v2 Adım 44 aşama 2: Keşif Masası ekranının saf yardımcıları. */
import { describe, expect, it } from 'vitest';
import {
  EKRAN_ARACLARI,
  genelArtiEksiVarMi,
  gosterilenMetin,
  gosterilenSayi,
  pencereBaslangici,
  teraziEgimi,
} from '../../src/ui/kesif/kesifEkrani';
import { KESIF_ARACLARI, kesifBaslangic, kesifIndirge, type KesifDurumu } from '../../src/kesif/kesifMasasi';

const dokun = (d: KesifDurumu, ...h: string[]) => h.reduce((s, x) => kesifIndirge(s, { tur: 'dokun', hedef: x }), d);

describe('Keşif Masası ekranı', () => {
  it('beş aracın hepsi ekranda, saf modüldeki sırayla', () => {
    expect(EKRAN_ARACLARI.map((a) => a.arac)).toEqual([...KESIF_ARACLARI]);
  });
  it('terazide genel +1/−1 yok (kefe düğmeleri var)', () => {
    expect(KESIF_ARACLARI.filter((a) => !genelArtiEksiVarMi(a))).toEqual(['terazi']);
  });
  it('gösterim metni: terazi eşitse "a = b", ayrılmışsa "a + b"', () => {
    expect(gosterilenMetin(dokun(kesifBaslangic('terazi'), 'sol+', 'sag+'))).toBe('1 = 1');
    expect(gosterilenMetin(dokun(kesifBaslangic('terazi'), 'sol+'))).toBe('1   0');
    expect(gosterilenMetin(dokun(kesifBaslangic('ayirBirlestir'), 'ayir:2'))).toBe('2 + 3');
    expect(gosterilenMetin(kesifBaslangic('ayirBirlestir'))).toBe('5');
  });
  it('terazi eğimi: ağır taraf aşağı, ±16° ile sınırlı', () => {
    expect(teraziEgimi(3, 3)).toBe(0);
    expect(teraziEgimi(0, 2)).toBe(8);
    expect(teraziEgimi(10, 0)).toBe(-16);
  });
  it('gösterilen sayı aracın sayısıdır', () => {
    expect(gosterilenSayi(dokun(kesifBaslangic('onlukCerceve'), 'goz:4', 'goz:15', 'arti'))).toBe(3);
    expect(gosterilenSayi(dokun(kesifBaslangic('nesneKumesi'), 'arti', 'arti'))).toBe(2);
    expect(gosterilenSayi(dokun(kesifBaslangic('sayiDogrusu'), 'nokta:17'))).toBe(17);
  });
  it('sayı doğrusu penceresi 11 nokta: 0–10, 10u geçince 10–20', () => {
    expect([0, 5, 10].map(pencereBaslangici)).toEqual([0, 0, 0]);
    expect([11, 20].map(pencereBaslangici)).toEqual([10, 10]);
  });
});
