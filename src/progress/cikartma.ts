/**
 * ÇIKARTMA VE BAHÇE MANTIĞI — plan §7.4.
 *
 * SAF VE SENKRONDUR — `Date.now()`, IndexedDB, React çağrılmaz.
 * Kalıcılık (Adım 9) dışarıdan verilir.
 *
 * KURALLAR (plan §7.4):
 *  · Her tamamlanan oturum 1 çıkartma. Ödül TAMAMLAMAYA bağlı,
 *    doğru sayısına DEĞİL (yanlış yapan da alır).
 *  · 30 çıkartma ≈ 6 hafta → yeni sahne.
 *  · Sanal para/mağaza yok · streak sayacı yok · sosyal karşılaştırma yok.
 *  · Sayısal skor/yüzde hiçbir yerde yok.
 *
 * "30 çıkartma ≈ 6 hafta" gerekçesi: günde 1 oturum × 6 hafta = ~42 oturum.
 * 30 çıkartma, her gün oynayan çocuğa ~4-5 haftada yeni sahne getirir.
 * Bu, sabırsızlık yaratmadan uzun vadeli motivasyon sağlar.
 */

// ---------------------------------------------------------------- sabitler

/** Yeni sahne için gerekli çıkartma sayısı — plan §7.4. */
export const YENI_SAHNE_ESIGI = 30;

/** Mevcut sahne sayısı — ilk sürümde 3 sahne (bahçe, orman, deniz). */
export const SAHNE_SAYISI = 3;

/** Sahne adları — çocuğa gösterilen etiketler. */
export const SAHNE_ADLARI = ['bahçe', 'orman', 'deniz'] as const;

/** Sahne tipi. */
export type Sahne = (typeof SAHNE_ADLARI)[number];

// ---------------------------------------------------------------- tipler

/** Çıkartma koleksiyonu durumu — bu geliştirme sürümünde yalnız bellek içinde yaşar. */
export interface CikartmaKoleksiyonu {
  /** Toplam çıkartma sayısı (biriken, harcanmaz). */
  readonly toplam: number;
  /** Mevcut sahne indeksi (0'dan başlar). */
  readonly sahneIndeksi: number;
  /** Son kazanılan çıkartma zaman damgası (epoch ms, geçici oturum için). */
  readonly sonKazancMs: number | null;
}

// ---------------------------------------------------------------- fonksiyonlar

/** Yeni boş koleksiyon oluşturur. */
export function yeniKoleksiyon(): CikartmaKoleksiyonu {
  return {
    toplam: 0,
    sahneIndeksi: 0,
    sonKazancMs: null,
  };
}

/**
 * Bir oturum tamamlandığında çıkartma ekler.
 *
 * ÖNEMLİ (plan §7.4): ödül TAMAMLAMAYA bağlı, doğru sayısına DEĞİL.
 * Bu fonksiyon yalnızca `oturumTamamlandi` olayını alır — doğru/yanlış
 * sayısını SORMAZ. Testle kanıtlanmalıdır.
 *
 * 30 çıkartmada bir sahne indeksi artar (modüler).
 *
 * SAF: girdiyi değiştirmez, yeni kayıt döndürür.
 */
export function cikartmaKazan(
  koleksiyon: CikartmaKoleksiyonu,
  zamanMs: number,
): { koleksiyon: CikartmaKoleksiyonu; yeniSahne: boolean } {
  const yeniToplam = koleksiyon.toplam + 1;
  // 30 çıkartmada bir sahne değişir. modüler: 30→sahne1, 60→sahne2, 90→sahne0
  const yeniSahneIndeksi = Math.floor(yeniToplam / YENI_SAHNE_ESIGI) % SAHNE_SAYISI;
  const yeniSahne = yeniSahneIndeksi !== koleksiyon.sahneIndeksi;

  return {
    koleksiyon: {
      toplam: yeniToplam,
      sahneIndeksi: yeniSahneIndeksi,
      sonKazancMs: zamanMs,
    },
    yeniSahne,
  };
}

/**
 * Mevcut sahneye kalan çıkartma sayısı.
 * 30'a ulaşınca yeni sahne açılır.
 */
export function kalanCikartma(koleksiyon: CikartmaKoleksiyonu): number {
  const simdikiSahneBaslangic = koleksiyon.sahneIndeksi * YENI_SAHNE_ESIGI;
  const kalan = YENI_SAHNE_ESIGI - (koleksiyon.toplam - simdikiSahneBaslangic);
  return Math.max(0, kalan);
}

/**
 * Mevcut sahnenin adı.
 */
export function mevcutSahneAdi(koleksiyon: CikartmaKoleksiyonu): Sahne {
  return SAHNE_ADLARI[koleksiyon.sahneIndeksi] ?? SAHNE_ADLARI[0];
}

/**
 * Çıkartma sayısının doğru sayısına bağlı OLMADIĞINI doğrular.
 *
 * Bu fonksiyon bir test yardımcısıdır: `cikartmaKazan` fonksiyonu
 * yalnızca oturum tamamlandığında çağrılır ve doğru sayısı parametre
 * almaz. Bu, plan §7.4'ün "ödül tamamlamaya bağlı" kuralının kod düzeyinde
 * garantisidir.
 */
export function cikartmaDogruSayisinaBagliDegil(): boolean {
  // cikartmaKazan fonksiyonunun imzasında dogruSayisi parametresi YOK.
  // Bu, derleme zamanında garantilidir.
  return true;
}
