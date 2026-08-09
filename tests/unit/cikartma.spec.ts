/**
 * ÇIKARTMA VE BAHÇE MANTIĞI TESTLERİ — plan §7.4, §14 Adım 7.
 *
 * Bitti tanımı: "çıkartma oturum SONUNA bağlı (doğru sayısına değil, testle)"
 *
 * Testler:
 *  · Her tamamlanan oturum 1 çıkartma
 *  · Çıkartma doğru sayısına DEĞİL, tamamlamaya bağlı
 *  · 30 çıkartma → yeni sahne
 *  · Sahne döngüsü (modüler)
 *  · Kalan çıkartma hesabı doğru
 */

import { describe, it, expect } from 'vitest';
import {
  yeniKoleksiyon,
  cikartmaKazan,
  kalanCikartma,
  mevcutSahneAdi,
  YENI_SAHNE_ESIGI,
  SAHNE_SAYISI,
  cikartmaDogruSayisinaBagliDegil,
} from '../../src/progress/cikartma';

describe('Çıkartma ve bahçe mantığı', () => {
  // ----------------------------------------------------- temel

  it('yeni koleksiyon boş başlar', () => {
    const k = yeniKoleksiyon();
    expect(k.toplam).toBe(0);
    expect(k.sahneIndeksi).toBe(0);
    expect(k.sonKazancMs).toBeNull();
  });

  // ----------------------------------------------------- her oturum 1 çıkartma

  it('her tamamlanan oturum 1 çıkartma ekler', () => {
    let k = yeniKoleksiyon();
    k = cikartmaKazan(k, 1000).koleksiyon;
    expect(k.toplam).toBe(1);
    k = cikartmaKazan(k, 2000).koleksiyon;
    expect(k.toplam).toBe(2);
    k = cikartmaKazan(k, 3000).koleksiyon;
    expect(k.toplam).toBe(3);
  });

  // ----------------------------------------------------- tamamlamaya bağlı

  it('çıkartma TAMAMLAMAYA bağlı, doğru sayısına DEĞİL', () => {
    // cikartmaKazan fonksiyonu doğru sayısı parametresi ALMAZ.
    // Bu, "ödül tamamlamaya bağlı" kuralının kod düzeyinde garantisidir.
    expect(cikartmaDogruSayisinaBagliDegil()).toBe(true);

    // Aynı zamanda: fonksiyon imzasında dogruSayisi yok.
    // 0 doğru, 8 doğru — farketmez: tamamlanan oturum = 1 çıkartma.
    let k = yeniKoleksiyon();
    const r = cikartmaKazan(k, 1000);
    expect(r.koleksiyon.toplam).toBe(1);
    // r içinde dogruSayisi alanı yok
    expect(r).not.toHaveProperty('dogruSayisi');
  });

  it('cikartmaKazan parametre olarak dogruSayisi almaz', () => {
    // TypeScript derleme zamanında garanti eder, ama runtime test de:
    const k = yeniKoleksiyon();
    const sonuc = cikartmaKazan(k, 1000);
    // sonuc.koleksiyon'da dogruSayisi alanı yok
    expect(sonuc.koleksiyon).not.toHaveProperty('dogruSayisi');
    expect(sonuc.koleksiyon).not.toHaveProperty('dogru');
  });

  // ----------------------------------------------------- 30 çıkartma → yeni sahne

  it('30 çıkartmada yeni sahne açılır', () => {
    let k = yeniKoleksiyon();
    let yeniSahne = false;

    for (let i = 0; i < YENI_SAHNE_ESIGI; i++) {
      const r = cikartmaKazan(k, i * 1000);
      k = r.koleksiyon;
      yeniSahne = r.yeniSahne;
    }

    expect(k.toplam).toBe(YENI_SAHNE_ESIGI);
    expect(k.sahneIndeksi).toBe(1); // 0 → 1
    expect(yeniSahne).toBe(true);
  });

  it('29 çıkartmada sahne değişmez', () => {
    let k = yeniKoleksiyon();

    for (let i = 0; i < YENI_SAHNE_ESIGI - 1; i++) {
      k = cikartmaKazan(k, i * 1000).koleksiyon;
    }

    expect(k.toplam).toBe(YENI_SAHNE_ESIGI - 1);
    expect(k.sahneIndeksi).toBe(0); // hâlâ ilk sahne
  });

  // ----------------------------------------------------- sahne döngüsü

  it('sahne döngüsü modüler — 90 çıkartmada sahne 0\'a döner', () => {
    let k = yeniKoleksiyon();

    for (let i = 0; i < SAHNE_SAYISI * YENI_SAHNE_ESIGI; i++) {
      k = cikartmaKazan(k, i * 1000).koleksiyon;
    }

    expect(k.toplam).toBe(SAHNE_SAYISI * YENI_SAHNE_ESIGI);
    expect(k.sahneIndeksi).toBe(0); // modüler: 3 sahne → 90'da 0'a döner
  });

  // ----------------------------------------------------- kalan çıkartma

  it('kalan çıkartma hesabı doğru', () => {
    let k = yeniKoleksiyon();
    expect(kalanCikartma(k)).toBe(YENI_SAHNE_ESIGI);

    k = cikartmaKazan(k, 1000).koleksiyon;
    expect(kalanCikartma(k)).toBe(YENI_SAHNE_ESIGI - 1);

    for (let i = 0; i < 9; i++) {
      k = cikartmaKazan(k, 2000 + i * 1000).koleksiyon;
    }
    expect(k.toplam).toBe(10);
    expect(kalanCikartma(k)).toBe(YENI_SAHNE_ESIGI - 10);
  });

  it('kalan çıkartma yeni sahnde sıfırlanır', () => {
    let k = yeniKoleksiyon();
    for (let i = 0; i < YENI_SAHNE_ESIGI; i++) {
      k = cikartmaKazan(k, i * 1000).koleksiyon;
    }
    // 30 çıkartma → sahne 1, kalan 30
    expect(k.sahneIndeksi).toBe(1);
    expect(kalanCikartma(k)).toBe(YENI_SAHNE_ESIGI);
  });

  // ----------------------------------------------------- sahne adı

  it('mevcut sahne adı doğru döner', () => {
    let k = yeniKoleksiyon();
    expect(mevcutSahneAdi(k)).toBe('bahçe');

    for (let i = 0; i < YENI_SAHNE_ESIGI; i++) {
      k = cikartmaKazan(k, i * 1000).koleksiyon;
    }
    expect(mevcutSahneAdi(k)).toBe('orman');

    for (let i = 0; i < YENI_SAHNE_ESIGI; i++) {
      k = cikartmaKazan(k, i * 1000).koleksiyon;
    }
    expect(mevcutSahneAdi(k)).toBe('deniz');
  });

  // ----------------------------------------------------- SAF (immutability)

  it('cikartmaKazan girdiyi değiştirmez (SAF)', () => {
    const k = yeniKoleksiyon();
    const onceki = { ...k };
    cikartmaKazan(k, 1000);
    expect(k).toEqual(onceki);
  });

  it('cikartmaKazan yeni kayıt döndürür', () => {
    const k = yeniKoleksiyon();
    const sonuc = cikartmaKazan(k, 1000);
    expect(sonuc.koleksiyon).not.toBe(k);
  });

  // ----------------------------------------------------- son kazanç zamanı

  it('son kazanç zaman damgası güncellenir', () => {
    let k = yeniKoleksiyon();
    expect(k.sonKazancMs).toBeNull();

    k = cikartmaKazan(k, 12345).koleksiyon;
    expect(k.sonKazancMs).toBe(12345);

    k = cikartmaKazan(k, 67890).koleksiyon;
    expect(k.sonKazancMs).toBe(67890);
  });
});
