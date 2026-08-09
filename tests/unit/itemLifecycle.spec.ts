/**
 * MADDE YAŞAM DÖNGÜSÜ TESTLERİ — plan §14 Adım 6 "Bitti tanımı":
 *
 *  · K1/K2/K3 senaryo testli
 *  · GOREV_ANLASILMADI ustalığı ETKİLEMEZ (testle kanıtla)
 *  · 15/30/30 sn zamanlayıcılar ekran değişiminde sıfırlanır
 *
 * Bu testler `itemLifecycle.ts`'teki saf makineyi test eder.
 * Zamanlayıcı hook'u (`useHelpTimer`) React'e bağlıdır ve ayrıca
 * entegrasyon testlerinde doğrulanır.
 */

import { describe, it, expect } from 'vitest';
import {
  baslat,
  guncelle,
  cevapOlayiYap,
  TaniTakipcisi,
  K1_GECIKME_MS,
  K2_GECIKME_MS,
  K3_GECIKME_MS,
  GOREV_AUDIOREPLAY_ESIGI,
  GOREV_KISA_YANIT_SN,
  type MaddeYasamDongusu,
} from '../../src/progress/itemLifecycle';
import { qHesapla, masteryGuncelle, yeniKayit } from '../../src/progress/mastery';
import type { SkillId, Difficulty, ItemId } from '../../src/exercises/types';

// --- test sabitleri
const SKILL_ID = 'mat.test.dugum' as SkillId;
const ZORLUK: Difficulty = 3;
const BASLANGIC = 1_000_000;
const EST_SEC = 10;

function testMadde(baslangicMs = BASLANGIC): MaddeYasamDongusu {
  return baslat({
    maddeId: 'test#abc' as ItemId,
    skillIds: [SKILL_ID],
    estimatedSec: EST_SEC,
    nodeDifficulty: ZORLUK,
    baslangicMs,
  });
}

describe('Madde yaşam döngüsü — K1/K2/K3 senaryoları', () => {
  it('K1: maskota dokunma → kademe 1, sonraki doğru → q=0.45', () => {
    let m = testMadde();

    // Maskota dokun → K1
    m = guncelle(m, { tur: 'yardim', kademe: 1, zamanMs: BASLANGIC + 5_000 }).kayit;
    expect(m.yardimKademesi).toBe(1);

    // Doğru cevap (K1 açık, ipuçlu)
    const sonuc = guncelle(m, {
      tur: 'onayla',
      dogru: true,
      tani: null,
      latencyMs: 8_000,
      zamanMs: BASLANGIC + 13_000,
    });
    expect(sonuc.kapandi).toBe(true);
    expect(sonuc.sonuc).not.toBeNull();
    expect(sonuc.sonuc!.dogru).toBe(true);
    expect(sonuc.sonuc!.kullanilanYardimKademesi).toBe(1);

    // q doğrula
    const olay = cevapOlayiYap(sonuc.sonuc!, [SKILL_ID], EST_SEC, ZORLUK);
    const q = qHesapla(olay);
    expect(q).toBe(0.45); // K1/K2'den doğru → 0.45
  });

  it('K2: eleme + strateji → sonraki doğru → q=0.45', () => {
    let m = testMadde();

    m = guncelle(m, { tur: 'yardim', kademe: 1, zamanMs: BASLANGIC + 15_000 }).kayit;
    m = guncelle(m, { tur: 'yardim', kademe: 2, zamanMs: BASLANGIC + 45_000 }).kayit;
    expect(m.yardimKademesi).toBe(2);

    const sonuc = guncelle(m, {
      tur: 'onayla',
      dogru: true,
      tani: null,
      latencyMs: 12_000,
      zamanMs: BASLANGIC + 57_000,
    });
    expect(sonuc.sonuc!.kullanilanYardimKademesi).toBe(2);

    const olay = cevapOlayiYap(sonuc.sonuc!, [SKILL_ID], EST_SEC, ZORLUK);
    expect(qHesapla(olay)).toBe(0.45);
  });

  it('K3: birlikte yapalım → çocuk dokununca tam doğru muamelesi görür (q=0.20)', () => {
    let m = testMadde();

    m = guncelle(m, { tur: 'yardim', kademe: 1, zamanMs: BASLANGIC + 15_000 }).kayit;
    m = guncelle(m, { tur: 'yardim', kademe: 2, zamanMs: BASLANGIC + 45_000 }).kayit;
    m = guncelle(m, { tur: 'yardim', kademe: 3, zamanMs: BASLANGIC + 75_000 }).kayit;
    expect(m.yardimKademesi).toBe(3);

    // K3 sonrası doğru dokunuş
    const sonuc = guncelle(m, {
      tur: 'onayla',
      dogru: true,
      tani: null,
      latencyMs: 15_000,
      zamanMs: BASLANGIC + 90_000,
    });
    expect(sonuc.kapandi).toBe(true);
    expect(sonuc.sonuc!.dogru).toBe(true);
    expect(sonuc.sonuc!.kullanilanYardimKademesi).toBe(3);

    const olay = cevapOlayiYap(sonuc.sonuc!, [SKILL_ID], EST_SEC, ZORLUK);
    expect(qHesapla(olay)).toBe(0.20); // K3'ten doğru → 0.20
  });

  it('kademe geri gitmez: K2 açıldıktan sonra K1 verilmez', () => {
    let m = testMadde();
    m = guncelle(m, { tur: 'yardim', kademe: 2, zamanMs: BASLANGIC + 45_000 }).kayit;
    expect(m.yardimKademesi).toBe(2);

    // K1 tekrar verilirse kademe değişmez
    m = guncelle(m, { tur: 'yardim', kademe: 1, zamanMs: BASLANGIC + 50_000 }).kayit;
    expect(m.yardimKademesi).toBe(2);
  });
});

describe('Madde yaşam döngüsü — deneme1/deneme2 geçişleri', () => {
  it('deneme1 yanlış → deneme2, K1 otomatik açılır', () => {
    let m = testMadde();
    expect(m.durum).toBe('deneme1');

    // Yanlış cevap
    const r = guncelle(m, {
      tur: 'onayla',
      dogru: false,
      tani: 'KARDINALITE',
      latencyMs: 5_000,
      zamanMs: BASLANGIC + 5_000,
    });
    expect(r.kayit.durum).toBe('deneme2');
    expect(r.kayit.yardimKademesi).toBe(1); // K1 otomatik
    expect(r.kapandi).toBe(false);
  });

  it('deneme1 yanlış + K1 zaten açık → deneme2, kademe aynı kalır', () => {
    let m = testMadde();
    m = guncelle(m, { tur: 'yardim', kademe: 1, zamanMs: BASLANGIC + 15_000 }).kayit;

    const r = guncelle(m, {
      tur: 'onayla',
      dogru: false,
      tani: 'KARDINALITE',
      latencyMs: 8_000,
      zamanMs: BASLANGIC + 23_000,
    });
    expect(r.kayit.durum).toBe('deneme2');
    expect(r.kayit.yardimKademesi).toBe(1); // zaten K1 açık
  });

  it('deneme2 yanlış → kapandı, q=0.00, doğru gösterilir', () => {
    let m = testMadde();
    // deneme2'ye geç
    m = guncelle(m, {
      tur: 'onayla',
      dogru: false,
      tani: 'KARDINALITE',
      latencyMs: 5_000,
      zamanMs: BASLANGIC + 5_000,
    }).kayit;

    // deneme2'de yanlış
    const r = guncelle(m, {
      tur: 'onayla',
      dogru: false,
      tani: 'KARDINALITE',
      latencyMs: 4_000,
      zamanMs: BASLANGIC + 12_000,
    });
    expect(r.kapandi).toBe(true);
    expect(r.sonuc!.dogru).toBe(false);

    const olay = cevapOlayiYap(r.sonuc!, [SKILL_ID], EST_SEC, ZORLUK);
    expect(qHesapla(olay)).toBe(0.0);
  });

  it('deneme2 doğru → kapandı, q=0.45 (K1 açık)', () => {
    let m = testMadde();
    m = guncelle(m, {
      tur: 'onayla',
      dogru: false,
      tani: 'KARDINALITE',
      latencyMs: 5_000,
      zamanMs: BASLANGIC + 5_000,
    }).kayit; // → deneme2, K1 otomatik

    const r = guncelle(m, {
      tur: 'onayla',
      dogru: true,
      tani: null,
      latencyMs: 8_000,
      zamanMs: BASLANGIC + 13_000,
    });
    expect(r.kapandi).toBe(true);
    expect(r.sonuc!.kullanilanYardimKademesi).toBe(1);

    const olay = cevapOlayiYap(r.sonuc!, [SKILL_ID], EST_SEC, ZORLUK);
    expect(qHesapla(olay)).toBe(0.45);
  });

  it('ipuçsuz, hızlı doğru → q=1.00', () => {
    const m = testMadde();
    const r = guncelle(m, {
      tur: 'onayla',
      dogru: true,
      tani: null,
      latencyMs: 5_000, // < estimatedSec(10) * 1000 = 10_000 → hızlı
      zamanMs: BASLANGIC + 5_000,
    });
    const olay = cevapOlayiYap(r.sonuc!, [SKILL_ID], EST_SEC, ZORLUK);
    expect(qHesapla(olay)).toBe(1.0);
  });

  it('ipuçsuz, yavaş doğru → q=0.85', () => {
    const m = testMadde();
    const r = guncelle(m, {
      tur: 'onayla',
      dogru: true,
      tani: null,
      latencyMs: 15_000, // > 10_000 → yavaş
      zamanMs: BASLANGIC + 15_000,
    });
    const olay = cevapOlayiYap(r.sonuc!, [SKILL_ID], EST_SEC, ZORLUK);
    expect(qHesapla(olay)).toBe(0.85);
  });
});

describe('GOREV_ANLASILMADI — ustalığı ETKİLEMEZ', () => {
  it('jeneratör etiketi GOREV_ANLASILMADI → q=null, mastery değişmez', () => {
    let m = testMadde();

    const r = guncelle(m, {
      tur: 'onayla',
      dogru: false,
      tani: 'GOREV_ANLASILMADI',
      latencyMs: 5_000,
      zamanMs: BASLANGIC + 5_000,
    });

    expect(r.kapandi).toBe(true);
    expect(r.sonuc!.tani).toBe('GOREV_ANLASILMADI');

    // qHesapla null döndürmeli
    const olay = cevapOlayiYap(r.sonuc!, [SKILL_ID], EST_SEC, ZORLUK);
    expect(qHesapla(olay)).toBeNull();

    // masteryGuncelle kayıtı değiştirmemeli
    const kayit = yeniKayit(SKILL_ID);
    const guncellenmis = masteryGuncelle(kayit, olay);
    expect(guncellenmis.attempts).toBe(0);
    expect(guncellenmis.strength).toBe(0);
    expect(guncellenmis.streak).toBe(0);
  });

  it('audioReplay ≥ 3 + yanlış → GOREV_ANLASILMADI tespit edilir', () => {
    let m = testMadde();

    // 3 kez tekrar dinle
    m = guncelle(m, { tur: 'tekrarDinle', zamanMs: BASLANGIC + 1_000 }).kayit;
    m = guncelle(m, { tur: 'tekrarDinle', zamanMs: BASLANGIC + 2_000 }).kayit;
    m = guncelle(m, { tur: 'tekrarDinle', zamanMs: BASLANGIC + 3_000 }).kayit;
    expect(m.tekrarSayisi).toBe(GOREV_AUDIOREPLAY_ESIGI);

    // Yanlış cevap (normal bir tani ile)
    const r = guncelle(m, {
      tur: 'onayla',
      dogru: false,
      tani: 'BIREBIR_ESLESME',
      latencyMs: 5_000,
      zamanMs: BASLANGIC + 8_000,
    });

    // gorevAnlasilmadiMi true olmalı
    expect(r.sonuc!.tani).toBe('GOREV_ANLASILMADI');

    // q null olmalı
    const olay = cevapOlayiYap(r.sonuc!, [SKILL_ID], EST_SEC, ZORLUK);
    expect(qHesapla(olay)).toBeNull();
  });

  it('çok kısa yanıt (< 2 sn) → GOREV_ANLASILMADI', () => {
    const m = testMadde();

    // Talimat bitmeden dokunuldu (1.5 sn)
    const r = guncelle(m, {
      tur: 'onayla',
      dogru: false,
      tani: 'KARDINALITE',
      latencyMs: GOREV_KISA_YANIT_SN * 1000 - 500, // 1.5 sn
      zamanMs: BASLANGIC + 1_500,
    });

    expect(r.sonuc!.tani).toBe('GOREV_ANLASILMADI');
  });

  it('gorevAnlasilmadi olayı → kapandı, skorlama yok', () => {
    let m = testMadde();
    const r = guncelle(m, {
      tur: 'gorevAnlasilmadi',
      tani: 'GOREV_ANLASILMADI',
      zamanMs: BASLANGIC + 5_000,
    });

    expect(r.kapandi).toBe(true);
    expect(r.sonuc!.tani).toBe('GOREV_ANLASILMADI');

    const olay = cevapOlayiYap(r.sonuc!, [SKILL_ID], EST_SEC, ZORLUK);
    expect(qHesapla(olay)).toBeNull();
  });
});

describe('Zamanlayıcı sabitleri — plan §7.2', () => {
  it('K1 gecikmesi 15 saniye', () => {
    expect(K1_GECIKME_MS).toBe(15_000);
  });
  it('K2 gecikmesi 30 saniye (K1\'den sonra)', () => {
    expect(K2_GECIKME_MS).toBe(30_000);
  });
  it('K3 gecikmesi 30 saniye (K2\'den sonra)', () => {
    expect(K3_GECIKME_MS).toBe(30_000);
  });
});

describe('TaniTakipcisi — remediation tetikleme (§6.6)', () => {
  it('son 6\'da aynı etiket ≥2 → aktifTani döndürür', () => {
    const t = new TaniTakipcisi();
    t.ekle('KARDINALITE');
    t.ekle(null); // doğru
    t.ekle('KARDINALITE');
    expect(t.aktifTani()).toBe('KARDINALITE');
  });

  it('tek başına etiket ≥2 değilse → null', () => {
    const t = new TaniTakipcisi();
    t.ekle('KARDINALITE');
    t.ekle('BIREBIR_ESLESME');
    expect(t.aktifTani()).toBeNull();
  });

  it('GOREV_ANLASILMADI sayılmaz — ölçüm geçersizliği, kavram yanılgısı değil', () => {
    const t = new TaniTakipcisi();
    t.ekle('GOREV_ANLASILMADI');
    t.ekle('GOREV_ANLASILMADI');
    t.ekle('GOREV_ANLASILMADI');
    expect(t.aktifTani()).toBeNull();
  });

  it('son 6 dışındaki etiketler düşer (halka tampon)', () => {
    const t = new TaniTakipcisi();
    t.ekle('KARDINALITE');
    t.ekle('KARDINALITE');
    t.ekle(null);
    t.ekle(null);
    t.ekle(null);
    t.ekle(null);
    // artık 6'lık pencerede 2 KARDINALITE var ama 6. ve 7'de yok
    t.ekle(null);
    // pencere: [null, null, null, null, null, null] — KARDINALITE düştü
    expect(t.aktifTani()).toBeNull();
  });

  it('doğru cevap (null) takibi bozmaz', () => {
    const t = new TaniTakipcisi();
    t.ekle('BIREBIR_ESLESME');
    t.ekle(null);
    t.ekle(null);
    t.ekle(null);
    t.ekle(null);
    t.ekle(null);
    expect(t.aktifTani()).toBeNull();
  });
});

describe('Kapalı maddeye olay gelirse değişmez', () => {
  it('kapandıktan sonra dokunma → kayıt değişmez', () => {
    let m = testMadde();
    m = guncelle(m, {
      tur: 'onayla',
      dogru: true,
      tani: null,
      latencyMs: 5_000,
      zamanMs: BASLANGIC + 5_000,
    }).kayit;
    expect(m.durum).toBe('kapandi');

    const r = guncelle(m, { tur: 'dokunma', zamanMs: BASLANGIC + 10_000 });
    expect(r.kayit).toBe(m); // aynı referans
    expect(r.kapandi).toBe(true);
  });
});
