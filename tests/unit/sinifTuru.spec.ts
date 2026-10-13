import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../../src/exercises/registry';
import { setlenebilirDugumler, type GunlukSet } from '../../src/ogretmen/gunlukSet';
import type { MaddeSonuc } from '../../src/progress/itemLifecycle';
import {
  sinifTuruBaslat,
  sinifTuruIlerlet,
  sinifTuruSorusu,
  type SinifTuruDurumu,
} from '../../src/sinif/sinifTuru';

const kayitli = (t: string): boolean => REGISTRY.has(t);
const dugum = [...setlenebilirDugumler(kayitli)][0];
const kaynak: GunlukSet = { surum: 1, dugumler: [dugum], tohum: 42 };
const sonuc = (dogru: boolean): MaddeSonuc => ({
  dogru,
  kullanilanYardimKademesi: 0,
  latencyMs: 1000,
  tani: null,
  zamanMs: 0,
});

function turOyna(d: SinifTuruDurumu, dogru = true): SinifTuruDurumu {
  let s = sinifTuruIlerlet(d, { tur: 'duyuruBitti' });
  s = sinifTuruIlerlet(s, { tur: 'maddeKapandi', sonuc: sonuc(dogru), skillId: dugum });
  return sinifTuruIlerlet(s, { tur: 'kutlamaBitti' });
}

describe('Sınıf Turu durum makinesi', () => {
  it('sıra döngüseldir', () => {
    let d = sinifTuruBaslat(['mor', 'turuncu', 'yesil'], kaynak);
    const sirasi: number[] = [];
    for (let i = 0; i < 6; i++) {
      sirasi.push(d.siradaki);
      d = turOyna(d);
    }
    expect(sirasi).toEqual([0, 1, 2, 0, 1, 2]);
  });

  it('yanlış cevap sırayı geçirmez, yıldız ve yaprak bağımsızdır', () => {
    const a = turOyna(sinifTuruBaslat(['mor', 'mavi'], kaynak), false);
    const b = turOyna(sinifTuruBaslat(['mor', 'mavi'], kaynak), true);
    expect(a.takimlar).toEqual(b.takimlar);
    expect(a.kavanoz).toBe(1);
    expect(a.takimlar[0].yildiz).toBe(1);
    expect(a.siradaki).toBe(1);
  });

  it('hedefte biter', () => {
    let d = sinifTuruBaslat(['mor', 'mavi', 'sari'], kaynak);
    expect(d.kavanozHedefi).toBe(9);
    for (let i = 0; i < 8; i++) d = turOyna(d);
    expect(d.asama).toBe('siraDuyurusu');
    d = turOyna(d);
    expect(d.asama).toBe('bitti');
    expect(d.takimlar.every((t) => t.yildiz === 3)).toBe(true);
    expect(d.sonuclar).toHaveLength(9);
  });

  it('öğretmen her an bitirebilir; bitti sonrası olay reddedilir', () => {
    const d = sinifTuruIlerlet(sinifTuruBaslat(['mor', 'mavi'], kaynak), { tur: 'ogretmenBitirdi' });
    expect(d.asama).toBe('bitti');
    expect(() => sinifTuruIlerlet(d, { tur: 'duyuruBitti' })).toThrow();
  });

  it('aşama dışı olay reddedilir', () => {
    expect(() => sinifTuruIlerlet(sinifTuruBaslat(['mor', 'mavi'], kaynak), { tur: 'kutlamaBitti' })).toThrow();
  });

  it('1 veya 5 takım ve yinelenen renk reddedilir', () => {
    expect(() => sinifTuruBaslat(['mor'], kaynak)).toThrow();
    expect(() => sinifTuruBaslat(['mor', 'turuncu', 'yesil', 'mavi', 'pembe'], kaynak)).toThrow();
    expect(() => sinifTuruBaslat(['mor', 'mor'], kaynak)).toThrow();
  });

  it('determinizm: aynı kaynak aynı soru; tur ilerleyince soru sırası ilerler', () => {
    const d = sinifTuruBaslat(['mor', 'mavi'], kaynak);
    expect(sinifTuruSorusu(d, kayitli)).toEqual(sinifTuruSorusu(d, kayitli));
    expect(sinifTuruSorusu(turOyna(d), kayitli).sira).toBe(1);
  });

  it('durumda puan/skor alanı yoktur', () => {
    const d = turOyna(sinifTuruBaslat(['mor', 'mavi'], kaynak));
    const anahtarlar = JSON.stringify([Object.keys(d), Object.keys(d.takimlar[0])]);
    expect(anahtarlar).not.toMatch(/puan|skor/i);
  });
});
