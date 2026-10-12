import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AZAMI_KAYIT,
  AZAMI_MESAJ,
  ekranSaglayicisiAyarla,
  kayitEkle,
  kayitlariAl,
  kayitlariTemizle,
  raporMetni,
  temizle,
  yiginiSadelestir,
} from '../../src/hata/hataKaydi';

const ortam = { cihaz: 'tablet', kurulu: false, cevrimici: true, kullaniciAjani: 'TestAjan/1.0' };

afterEach(() => {
  kayitlariTemizle();
  vi.unstubAllGlobals();
});

describe('yerel hata günlüğü (Adım 23, ADR-0005)', () => {
  it('halka tampon 20\'de sınırlar, en yeniler kalır', () => {
    for (let i = 0; i < 25; i++) kayitEkle({ tur: 'promise', mesaj: `hata ${i}`, ekran: 'anaEkran' }, i);
    const k = kayitlariAl();
    expect(k).toHaveLength(AZAMI_KAYIT);
    expect(k[0].mesaj).toBe('hata 5');
    expect(k.at(-1)!.mesaj).toBe('hata 24');
  });

  it('mesaj 200 karakterde kesilir', () => {
    kayitEkle({ tur: 'render', mesaj: 'a'.repeat(500), ekran: 'alistirma' });
    expect(kayitlariAl()[0].mesaj).toHaveLength(AZAMI_MESAJ);
  });

  it('e-posta ve sorgu parametresi temizlenir', () => {
    expect(temizle('veli ali.veli@example.com yazdı')).toBe('veli [e-posta] yazdı');
    expect(temizle('yüklenemedi https://okulumsun-tc.vercel.app/x.js?ad=Ayse#k')).toBe(
      'yüklenemedi https://okulumsun-tc.vercel.app/x.js',
    );
    kayitEkle({ tur: 'promise', mesaj: 'GET /index.html?ogrenci=Ayse başarısız', ekran: 'anaEkran' });
    expect(kayitlariAl()[0].mesaj).not.toContain('Ayse');
  });

  it('yığından yalnız dosya:satır, en fazla 5 satır alınır', () => {
    const yigin = [
      'Error: x',
      ...Array.from({ length: 8 }, (_, i) => `    at f${i} (https://site.app/assets/index-abc.js?v=1:${10 + i}:5)`),
    ].join('\n');
    const s = yiginiSadelestir(yigin)!;
    expect(s.split('\n')).toHaveLength(5);
    expect(s.split('\n')[0]).toBe('index-abc.js:10');
    expect(s).not.toContain('https://');
  });

  it('ekran verilmezse sağlayıcıdan alınır', () => {
    ekranSaglayicisiAyarla(() => 'konuSecimi');
    kayitEkle({ tur: 'ses', mesaj: 'klip yüklenemedi: sayi_7' });
    expect(kayitlariAl()[0].ekran).toBe('konuSecimi');
  });

  it('raporMetni sürüm ve derleme kimliğini içerir', () => {
    kayitEkle({ tur: 'ses', mesaj: 'klip yüklenemedi: sayi_3', ekran: 'alistirma' }, 0);
    const metin = raporMetni('v0.1.0 · abc1234', ortam);
    expect(metin).toContain('Sürüm: v0.1.0 · abc1234');
    expect(metin).toContain('klip yüklenemedi: sayi_3');
    expect(metin).toContain('ekran: alistirma');
    expect(metin).toContain('Kayıt sayısı: 1');
  });

  it('kayıt şeması kişisel alan içermez', () => {
    kayitEkle({ tur: 'render', mesaj: 'm', ekran: 'e', yigin: 'at a (x.js:1:1)' }, 1);
    expect(Object.keys(kayitlariAl()[0]).sort()).toEqual(['ekran', 'mesaj', 'ts', 'tur', 'yigin']);
  });

  it('hiçbir depolama ya da ağ API\'si çağrılmaz', () => {
    const casus = {
      localStorage: { setItem: vi.fn(), getItem: vi.fn() },
      sessionStorage: { setItem: vi.fn(), getItem: vi.fn() },
      indexedDB: { open: vi.fn() },
      fetch: vi.fn(),
      navigator: { sendBeacon: vi.fn() },
    };
    for (const [ad, deger] of Object.entries(casus)) vi.stubGlobal(ad, deger);
    for (let i = 0; i < 30; i++) kayitEkle({ tur: 'promise', mesaj: `hata ${i}`, ekran: 'anaEkran' });
    raporMetni('v', ortam);
    kayitlariTemizle();
    expect(casus.localStorage.setItem).not.toHaveBeenCalled();
    expect(casus.sessionStorage.setItem).not.toHaveBeenCalled();
    expect(casus.indexedDB.open).not.toHaveBeenCalled();
    expect(casus.fetch).not.toHaveBeenCalled();
    expect(casus.navigator.sendBeacon).not.toHaveBeenCalled();
  });
});
