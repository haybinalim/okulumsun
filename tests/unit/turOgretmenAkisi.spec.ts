import { describe, expect, it } from 'vitest';
import { sinifAyariCoz, sinifAyariYaz } from '../../src/content/dersler/tur/sinifAyari';
import { kumeKodla, resmiKume } from '../../src/content/dersler/tur/ogretilenKume';
import {
  AKIS_BASAMAKLARI,
  akisSirasiCoz,
  akisSirasiKodla,
  basamakTasi,
  PROGRAM_SIRASI,
} from '../../src/content/dersler/tur/gununAkisi';
import {
  BAYRAKLI_IZINLI_ANAHTARLAR,
  DERS_TUR_SINIF_ANAHTARI,
  IZINLI_ANAHTARLAR,
} from '../../src/persistence/depolamaIzinListesi';
import { tara, TUR_SINIF_AYARI_DOSYASI } from '../../scripts/gizlilik/kurallar';

/** Okuma Yazma Adım 71 — günün akışı sırası ve K-7 sınıf ayarı (tek anahtar, öğrenci verisi değil; ADR-0002 Ek 1). */
describe('günün akışı (§2.4.11 madde 3)', () => {
  it('programdaki sıra 8 basamak; M-2 Dalga C, örnekleme yalnız öğretmen', () => {
    expect(PROGRAM_SIRASI).toBe('12345678');
    expect(AKIS_BASAMAKLARI[0].hedef.tur).toBe('dalgaC');
    expect(AKIS_BASAMAKLARI[2].hedef.tur).toBe('ogretmen');
    expect(AKIS_BASAMAKLARI.map((b) => b.hedef.tur)).toEqual([
      'dalgaC', 'etkinlik', 'ogretmen', 'yazilis', 'kagit', 'etkinlik', 'etkinlik', 'kagit',
    ]); // prettier-ignore
  });
  it('sıra çözücü katı: her basamak tam bir kez', () => {
    expect(akisSirasiCoz('21345678')?.map((b) => b.kod).join('')).toBe('21345678');
    for (const kotu of ['1234567', '123456789', '11345678', '1234567a', '', 12345678, null]) expect(akisSirasiCoz(kotu)).toBeNull();
  });
  it('taşıma sınırda değişmez, ortada yer değiştirir', () => {
    const s = akisSirasiCoz(PROGRAM_SIRASI)!;
    expect(akisSirasiKodla(basamakTasi(s, 0, -1))).toBe('12345678');
    expect(akisSirasiKodla(basamakTasi(s, 7, 1))).toBe('12345678');
    expect(akisSirasiKodla(basamakTasi(s, 0, 1))).toBe('21345678');
    expect(akisSirasiKodla(basamakTasi(s, 4, -1))).toBe('12354678');
  });
});

describe('K-7 sınıf ayarı', () => {
  const kod = kumeKodla(resmiKume('o', false));
  it('gidiş-dönüş: küme kodu + akış sırası', () => {
    const ham = sinifAyariYaz({ kume: kod, akis: '21345678' });
    expect(JSON.parse(ham)).toEqual({ v: 1, kume: kod, akis: '21345678' });
    expect(sinifAyariCoz(ham)).toEqual({ kume: kod, akis: '21345678' });
    expect(sinifAyariCoz(sinifAyariYaz({}))).toEqual({});
  });
  it('bozuk, fazladan alanlı (ör. öğrenci adı) veya eski sürümlü değer yok sayılır', () => {
    for (const kotu of [
      null,
      '',
      'abc',
      '[]',
      '{"v":2}',
      `{"v":1,"kume":"${kod}","ad":"Ali"}`,
      '{"v":1,"kume":"0"}',
      '{"v":1,"akis":"1111"}',
      `{"v":1,"kume":"${'z'.repeat(90)}"}`,
    ])
      expect(sinifAyariCoz(kotu), String(kotu)).toBeNull();
  });
  it('geçersiz küme yazılmaz', () => {
    expect(JSON.parse(sinifAyariYaz({ kume: '0', akis: 'x' }))).toEqual({ v: 1 });
  });
  it('anahtar yalnız bayraklı listede; üretim listesi (gizlilik sayfası) değişmez', () => {
    expect(BAYRAKLI_IZINLI_ANAHTARLAR.map((a) => a.anahtar)).toEqual([DERS_TUR_SINIF_ANAHTARI]);
    expect(IZINLI_ANAHTARLAR.some((a) => a.anahtar === DERS_TUR_SINIF_ANAHTARI)).toBe(false);
    expect(BAYRAKLI_IZINLI_ANAHTARLAR[0].adr).toBe('0002');
  });
  it('gizlilik taraması: anahtar yalnız kendi depolama modülünde yazılabilir', () => {
    const satir = 'localStorage.setItem(DERS_TUR_SINIF_ANAHTARI, deger);';
    expect(tara(TUR_SINIF_AYARI_DOSYASI, satir)).toEqual([]);
    expect(tara('src/ui/tur/TurOgretmen.tsx', satir)).toHaveLength(1);
    expect(tara(TUR_SINIF_AYARI_DOSYASI, 'localStorage.setItem("okulumsun.tur.ogrenci", x);')).toHaveLength(1);
  });
});
