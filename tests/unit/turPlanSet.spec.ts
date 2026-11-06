import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GRUP_HAFTALARI, grubuBol, haftaAraligi, haftaBul, haftalikSesPlani, sonOnerilenSes } from '../../src/content/dersler/tur/sesPlani';
import { HARF_GRUPLARI, OGRETIM_SIRASI } from '../../src/content/dersler/tur/alfabe';
import { TATIL_HAFTALARI, OGRETIM_HAFTALARI } from '../../src/content/okulTakvimi';
import { resmiKume } from '../../src/content/dersler/tur/ogretilenKume';
import { havuzuAyristir } from '../../src/content/dersler/tur/sablonlar/havuz';
import { TUR_SABLONLARI } from '../../src/content/dersler/tur/sablonlar';
import { SET_ADIM_SAYISI, SET_DUZEYLERI, SET_TARIFLERI, setKodu, setKoduCoz, turSetiKur } from '../../src/content/dersler/tur/turSet';
import { sonrakiTohum } from '../../src/content/dersler/tur/sonrakiTohum';
import { TUR_SABLON_KODLARI } from '../../src/content/dersler/tur/sablonlar/turSoru';
import type { TurHamleDosyasi } from '../../src/content/schema/turHamle';

/** Okuma Yazma Adım 71 aşama 2 — haftalık ses planı (Şekil 1 + okul takvimi) ve Türkçe set hazırla. */
const plan = haftalikSesPlani();

describe('haftalık ses planı (§2.4.11 madde 4)', () => {
  it('Şekil 1: hazırlık 1 hafta, gruplar 6 · 4 · 2 · 2 · 2 öğretim haftası; 29 harf resmî sırada birer kez', () => {
    expect(GRUP_HAFTALARI).toEqual([6, 4, 2, 2, 2]);
    expect(plan[0]).toMatchObject({ pazartesi: '2026-09-14', tur: 'hazirlik', yeniSesler: [] });
    expect(plan.flatMap((h) => h.yeniSesler)).toEqual([...OGRETIM_SIRASI]);
    for (let g = 1; g <= 5; g++) expect(plan.filter((h) => h.grup === g)).toHaveLength(GRUP_HAFTALARI[g - 1]);
  });
  it('tatil haftaları plan satırı ama öğretim haftası değil; tatilde yeni ses yok', () => {
    for (const p of Object.keys(TATIL_HAFTALARI)) expect(plan.find((h) => h.pazartesi === p)).toMatchObject({ tur: 'tatil', yeniSesler: [] });
    expect(plan.filter((h) => h.tur !== 'tatil')).toHaveLength(OGRETIM_HAFTALARI.length);
  });
  it('dönemin son haftası yeni ses yok (pekiştirme): yarıyıl öncesi ve ders yılı sonu; 2. dönemin ilk haftası hatırlatma', () => {
    const yariyilOncesi = plan[plan.findIndex((h) => h.not === 'Yarıyıl tatili') - 1];
    expect(yariyilOncesi).toMatchObject({ pazartesi: '2027-01-18', tur: 'pekistirme', yeniSesler: [] });
    expect(plan[plan.length - 1]).toMatchObject({ pazartesi: '2027-06-21', tur: 'pekistirme', yeniSesler: [] });
    expect(plan.find((h) => h.pazartesi === '2027-02-08')).toMatchObject({ tur: 'hatirlatma', yeniSesler: [] });
    expect(plan.filter((h) => h.tur === 'pekistirme' || h.tur === 'hatirlatma').every((h) => h.yeniSesler.length === 0)).toBe(true);
  });
  it('2026-27 takvimi: 1. grup 21 Eylül–30 Ekim haftada bir ses; 2. grup ara tatili atlar; harfler yarıyıldan önce biter', () => {
    expect(plan.filter((h) => h.grup === 1).map((h) => [h.pazartesi, h.yeniSesler.join('')])).toEqual([
      ['2026-09-21', 'a'], ['2026-09-28', 'n'], ['2026-10-05', 'e'], ['2026-10-12', 't'], ['2026-10-19', 'i'], ['2026-10-26', 'l'],
    ]); // prettier-ignore
    expect(plan.filter((h) => h.grup === 2).map((h) => h.pazartesi)).toEqual(['2026-11-02', '2026-11-09', '2026-11-23', '2026-11-30']);
    expect(plan.filter((h) => h.grup === 5).pop()!.pazartesi < '2027-01-18').toBe(true);
    expect(plan.find((h) => h.pazartesi === '2027-02-15')?.tur).toBe('bagimsiz');
  });
  it('grup bölme: harf i → hafta ⌊i·H/L⌋, sıra korunur', () => {
    expect(grubuBol(HARF_GRUPLARI[1], 4)).toEqual([['o', 'k'], ['u'], ['r', 'ı'], ['m']]);
    expect(grubuBol(HARF_GRUPLARI[3], 2)).toEqual([['ç', 'b', 'g'], ['c', 'ş']]);
  });
  it('bugünün haftası ve önerilen son ses; tarih aralığı yazımı', () => {
    expect(haftaBul(plan, '2026-11-01')?.pazartesi).toBe('2026-10-26');
    expect(haftaBul(plan, '2026-11-04')?.pazartesi).toBe('2026-11-02');
    expect(haftaBul(plan, '2026-08-01')).toBeNull();
    expect(sonOnerilenSes(plan, '2026-11-02')).toBe('k');
    expect(sonOnerilenSes(plan, '2026-11-16')).toBe('u');
    expect(sonOnerilenSes(plan, '2026-09-14')).toBeNull();
    expect(haftaAraligi('2026-11-02')).toBe('2–6 Kasım');
    expect(haftaAraligi('2026-12-28')).toBe('28 Aralık – 1 Ocak');
  });
});

const havuz = havuzuAyristir(JSON.parse(readFileSync('ders-verisi/tur/icerik/sozcukler.json', 'utf8')) as unknown);
const hamleler = (JSON.parse(readFileSync('ders-verisi/tur/hamleler.json', 'utf8')) as TurHamleDosyasi).glifler;

describe('set hazırla (§2.4.11 madde 5)', () => {
  it('her düzey 8 adımlık tarif (Adım 79); destek kolay, zenginleştirme zor; yeni etkinlik türleri karışımda', () => {
    expect(SET_ADIM_SAYISI).toBe(8);
    for (const d of SET_DUZEYLERI) expect(SET_TARIFLERI[d]).toHaveLength(SET_ADIM_SAYISI);
    expect(Math.max(...SET_TARIFLERI.destek.map((a) => a.zorluk))).toBeLessThanOrEqual(2);
    expect(Math.min(...SET_TARIFLERI.zengin.map((a) => a.zorluk))).toBeGreaterThanOrEqual(3);
    const tumu = new Set(SET_DUZEYLERI.flatMap((d) => SET_TARIFLERI[d].map((a) => a.sablon)));
    for (const yeni of ['T-09', 'T-16', 'T-17', 'T-18', 'T-19', 'T-20'] as const) expect(tumu.has(yeni)).toBe(true);
    // Her düzeyde en az 5 farklı şablon (çeşitlilik).
    for (const d of SET_DUZEYLERI) expect(new Set(SET_TARIFLERI[d].map((a) => a.sablon)).size).toBeGreaterThanOrEqual(5);
  });
  it('deterministik; kurulan her adım gerçekten bu kümeyle (hamle verisiyle) üretilir; atlanan + kurulan = tarif', () => {
    for (const harf of ['n', 'l', 'k', 'm'])
      for (const duzey of SET_DUZEYLERI)
        for (const tohum of [1, 2, 7]) {
          const kume = resmiKume(harf, false);
          const s = turSetiKur({ havuz, kume, duzey, tohum, hamleler });
          expect(turSetiKur({ havuz, kume, duzey, tohum, hamleler })).toEqual(s);
          expect(s.adimlar.length + s.atlanan.length).toBe(SET_ADIM_SAYISI);
          for (const a of s.adimlar)
            expect(() => TUR_SABLONLARI[a.sablon].uret({ havuz, kume, zorluk: a.zorluk, tohum: a.tohum, hamleler })).not.toThrow();
        }
  });
  it('aynı set içinde aynı şablonda aynı hedef iki kez gelmez (kurulabildikçe)', () => {
    for (const harf of ['l', 'k', 'm', 'y'])
      for (const duzey of SET_DUZEYLERI)
        for (const tohum of [1, 3, 9]) {
          const kume = resmiKume(harf, false);
          const s = turSetiKur({ havuz, kume, duzey, tohum, hamleler });
          const anahtarlar = s.adimlar.map((a) => `${a.sablon}|${TUR_SABLONLARI[a.sablon].uret({ havuz, kume, zorluk: a.zorluk, tohum: a.tohum, hamleler }).hedefMetin}`);
          expect(new Set(anahtarlar).size).toBe(anahtarlar.length);
        }
  });
  it('hamle verisi yoksa "Harfi parçalardan kur" atlanır ve bildirilir', () => {
    const kume = resmiKume('l', false);
    const s = turSetiKur({ havuz, kume, duzey: 'destek', tohum: 1 });
    expect(s.adimlar.some((a) => a.sablon === 'T-09')).toBe(false);
    expect(s.atlanan.some((a) => a.sablon === 'T-09')).toBe(true);
  });
  it('1. grup sonunda (l) destek ve sınıf setleri en az 6 adım kurar', () => {
    const kume = resmiKume('l', false);
    expect(turSetiKur({ havuz, kume, duzey: 'destek', tohum: 1, hamleler }).adimlar.length).toBeGreaterThanOrEqual(6);
    expect(turSetiKur({ havuz, kume, duzey: 'sinif', tohum: 1, hamleler }).adimlar.length).toBeGreaterThanOrEqual(6);
  });
  it('"Sonraki" aynı hedefi art arda getirmez (deterministik; kurulabilen her şablon)', () => {
    const kume = resmiKume('k', false);
    let degisti = 0;
    for (const sablon of TUR_SABLON_KODLARI)
      for (const zorluk of [1, 3, 5] as const)
        for (const tohum of [1, 4]) {
          const g = { havuz, kume, zorluk, tohum, hamleler };
          let hedef: string;
          try {
            hedef = TUR_SABLONLARI[sablon].uret(g).hedefMetin;
          } catch {
            continue;
          }
          const t = sonrakiTohum(sablon, g, hedef);
          expect(sonrakiTohum(sablon, g, hedef)).toBe(t);
          expect(t).toBeGreaterThan(tohum);
          let yeni: string | null = null;
          try {
            yeni = TUR_SABLONLARI[sablon].uret({ ...g, tohum: t }).hedefMetin;
          } catch {
            yeni = null;
          }
          if (yeni !== null && yeni !== hedef) degisti++;
          else expect(t).toBe(tohum + 1);
        }
    expect(degisti).toBeGreaterThan(20);
  });
  it('set kodu gidiş-dönüş, katı çözücü', () => {
    expect(setKoduCoz(setKodu('sinif', 3))).toEqual({ duzey: 'sinif', tohum: 3 });
    expect(setKoduCoz(setKodu('destek', 999))).toEqual({ duzey: 'destek', tohum: 999 });
    for (const kotu of [null, '', 's0', 's1000', 'x3', 'S3', 's03', 'zz', 's-1']) expect(setKoduCoz(kotu)).toBeNull();
  });
});
