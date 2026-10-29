/** Plan v2 Adım 44 aşama 2: Keşif Masası ekranının saf yardımcıları. */
import { describe, expect, it } from 'vitest';
import {
  EKRAN_ARACLARI,
  genelArtiEksiVarMi,
  gosterilenMetin,
  gosterilenSayi,
  nesneTekOnlukMu,
  onlukCerceveGenisligi,
  onlukSirasi,
  onlukTekMi,
  pencereBaslangici,
  sayiDogrusuDuzeni,
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

  // KG-120: ölçülen araç alanı genişliği (Playwright, 2026-10-29): 1080×810 tahta 825, 1920×1080 tahta 1665, 1080×810 tablet 920.
  const tahta = { tapMin: 102, olcek: 1.6, aralik: 51 };
  const tablet = { tapMin: 64, olcek: 1, aralik: 32 };
  it('onluk çerçeve genişliği: 1080×810 tahtada ölçülen 631 px ile tutarlı', () => {
    expect(Math.round(onlukCerceveGenisligi(tahta))).toBe(631);
    expect(onlukCerceveGenisligi(tablet)).toBe(398);
  });
  it('küçük tahtada (825 px) tek onluk; 1920 tahtada ve tablette iki onluk yan yana', () => {
    expect(onlukTekMi({ ...tahta, genislik: 825 })).toBe(true);
    expect(onlukTekMi({ ...tahta, genislik: 1665 })).toBe(false);
    expect(onlukTekMi({ ...tablet, genislik: 920 })).toBe(false);
    expect(onlukTekMi({ ...tablet, genislik: 828 })).toBe(false);
    expect(onlukTekMi({ ...tablet, genislik: 827 })).toBe(true);
  });
  it('nesneler: 10’arlı sıra 825 px tahtada sığmaz, 1665 px tahtada ve 920 px tablette sığar', () => {
    expect(nesneTekOnlukMu({ ...tahta, genislik: 825 })).toBe(true);
    expect(nesneTekOnlukMu({ ...tahta, genislik: 1665 })).toBe(false);
    expect(nesneTekOnlukMu({ ...tablet, genislik: 920 })).toBe(false);
  });
  it('onluk sırası: 0–9 birinci, 10–19 ikinci onluk', () => {
    expect([0, 9, 10, 19].map(onlukSirasi)).toEqual([0, 0, 1, 1]);
  });
  // KG-124: sayı doğrusu 11 nokta × tapMin tek sıraya sığmıyorsa zikzak (çiftler üstte, tekler altta).
  it('sayı doğrusu: 1920 tahtada ve tablette tek sıra (değişmedi), 1080×810 tahtada zikzak', () => {
    expect(sayiDogrusuDuzeni({ ...tahta, genislik: 1665 })).toEqual({ tur: 'sira' });
    expect(sayiDogrusuDuzeni({ ...tablet, genislik: 920 })).toEqual({ tur: 'sira' });
    const z = sayiDogrusuDuzeni({ ...tahta, genislik: 825 });
    expect(z.tur).toBe('zikzak');
    if (z.tur !== 'zikzak') return;
    expect(z.adim).toBeCloseTo(72.3, 5);
    // Çizgi ölçülen genişliği aşmaz; aynı sıradaki komşular arası ≥ ızgara boşluğu (19,2 px), düğmeler 102 px kalır.
    expect(10 * z.adim + tahta.tapMin).toBeLessThanOrEqual(825);
    expect(2 * z.adim - tahta.tapMin).toBeGreaterThanOrEqual(12 * tahta.olcek);
  });
  it('sayı doğrusu sınırı: tek sıra tam 11 × tapMin + 10 boşlukta başlar; çok dar alanda adım alt sınırda kalır', () => {
    const tam = 11 * 102 + 10 * 19.2;
    expect(sayiDogrusuDuzeni({ ...tahta, genislik: tam }).tur).toBe('sira');
    expect(sayiDogrusuDuzeni({ ...tahta, genislik: tam - 1 }).tur).toBe('zikzak');
    expect(sayiDogrusuDuzeni({ ...tahta, genislik: 500 })).toEqual({ tur: 'zikzak', adim: (102 + 19.2) / 2 });
  });
});
