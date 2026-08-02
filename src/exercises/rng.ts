/**
 * TOHUMLU DETERMİNİSTİK RASTGELELİK.
 *
 * `Math.random()` bu projede YASAK (docs/mufredat-kisitlari.md §4.2).
 * NEDEN — üç ayrı gerekçe, her biri tek başına yeterli:
 *
 *  1. YENİDEN ÜRETİLEBİLİRLİK. Bir çocuk soruyu yanlış yaptığında öğretmen
 *     ekranında "şu soruyu göster" diyebilmeliyiz. Tohum saklanır, soru birebir
 *     yeniden kurulur. Rastgele üretimde soru geri getirilemez.
 *  2. TEST EDİLEBİLİRLİK. "Bu jeneratör 10.000 çağrıda hiç 20'yi aşan sonuç
 *     üretmiyor" iddiası ancak deterministik üretimle kanıtlanabilir.
 *  3. ADALET. Akıllı tahtada aynı anda çalışan iki cihaz aynı tohumla aynı
 *     soruyu göstermeli; yoksa sınıfça yapılan etkinlik dağılır.
 *
 * Algoritma: mulberry32. 32 bit durum, tek çarpma+kaydırma turu, ~2^32 periyot.
 * Kriptografik değil — burada gizlilik değil TEKRARLANABİLİRLİK aranıyor.
 * Dağılımı bu iş için fazlasıyla yeterli, kodu birkaç satır ve platformdan
 * bağımsız olarak birebir aynı diziyi üretiyor (Math.imul her yerde aynı).
 */

export interface Rng {
  /** Üretildiği tohum — hata ayıklamada soruyu yeniden kurmak için saklanır. */
  readonly seed: number;

  /** [0, 1) aralığında kayan nokta. Alt seviye; genelde `int`/`pick` kullanın. */
  next(): number;

  /**
   * `min` ile `max` arasında tam sayı — **HER İKİ UÇ DA DAHİLDİR**.
   *
   * `int(1, 6)` bir zar atışıdır: 1, 2, 3, 4, 5 ve 6 gelebilir.
   * `int(0, 20)` 21 farklı değer üretir; 20 de gelebilir.
   *
   * Bu, `Math.floor(Math.random() * n)` alışkanlığının TERSİDİR ve kasıtlıdır:
   * müfredat sınırları "20'ye kadar (20 dâhil)" biçiminde yazılmıştır
   * (SAYFA 23). Üst sınır dışlanan bir API kullansaydık, her çağrı yerinde
   * `+1` yazmak gerekir ve er geç biri unuturdu — sonuç: 20 hiç çıkmayan bir
   * uygulama veya 21 üreten bir jeneratör.
   *
   * `min > max` ise hata fırlatır; tam sayı olmayan sınırlar hata fırlatır.
   * Sessizce yanlış değer döndürmez.
   */
  int(min: number, max: number): number;

  /** Diziden bir eleman. Dizi boşsa hata fırlatır. */
  pick<T>(arr: readonly T[]): T;

  /** Fisher-Yates. Girdiyi DEĞİŞTİRMEZ; yeni bir dizi döndürür. */
  shuffle<T>(arr: readonly T[]): T[];

  /** `n` farklı eleman (tekrarsız). `n > arr.length` ise hata fırlatır. */
  sample<T>(arr: readonly T[], n: number): T[];

  /** `olasilik` (varsayılan 0.5) olasılıkla true. */
  bool(olasilik?: number): boolean;

  /**
   * Aynı ana tohumdan türeyen BAĞIMSIZ bir alt akış.
   *
   * NEDEN: bir soruda hem sayıları hem çeldiricileri hem de sahne düzenini
   * üretiyoruz. Hepsi tek akıştan çekerse, çeldirici sayısını bir yerde
   * değiştirmek sahne düzenini de kaydırır ve o zamana kadar üretilmiş TÜM
   * soruların görüntüsü değişir. `fork('sahne')` ile her alt sistem kendi
   * akışını alır; biri değişince diğerleri sabit kalır.
   */
  fork(etiket: string): Rng;
}

/**
 * 32 bitlik dize karması (FNV-1a).
 * Determinizm gerektiren her yerde kullanılır: `fork` alt tohumu, `makeItemId`.
 * Her zaman işaretsiz 32 bit döndürür.
 */
export function hash32(metin: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < metin.length; i++) {
    h ^= metin.charCodeAt(i);
    // 16777619 ile çarpma; imul taşmayı 32 bitte doğru davranışla keser.
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 çekirdeği — kapanış içinde 32 bitlik durum. */
function mulberry32(tohum: number): () => number {
  let a = tohum >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Tohumlu üreteç oluşturur.
 * Aynı tohum → her cihazda, her çalıştırmada birebir aynı dizi.
 *
 * Tohum tam sayı olmalıdır. Kayan nokta verilirse aşağı yuvarlanır; NaN veya
 * sonsuz verilirse hata fırlatır — sessizce 0 tohumuna düşmek, tüm çocuklara
 * aynı soruyu göstermek demek olurdu.
 */
export function createRng(seed: number): Rng {
  if (!Number.isFinite(seed)) {
    throw new Error(`createRng: geçersiz tohum (${String(seed)}). Sonlu bir sayı gerekli.`);
  }
  const kokTohum = Math.floor(seed) >>> 0;
  const next = mulberry32(kokTohum);

  const rng: Rng = {
    seed: kokTohum,

    next,

    int(min: number, max: number): number {
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new Error(`Rng.int: sınırlar tam sayı olmalı (min=${min}, max=${max}).`);
      }
      if (min > max) {
        throw new Error(`Rng.int: min > max (min=${min}, max=${max}).`);
      }
      const genislik = max - min + 1; // +1 → ÜST SINIR DAHİL
      const deger = min + Math.floor(next() * genislik);
      // next() teorik olarak 1 döndüremez ama kayan nokta yuvarlamasına karşı
      // kelepçe: aralık dışı bir değerin müfredat sınırını aşması kabul edilemez.
      return deger > max ? max : deger;
    },

    pick<T>(arr: readonly T[]): T {
      if (arr.length === 0) {
        throw new Error('Rng.pick: boş diziden seçim yapılamaz.');
      }
      return arr[rng.int(0, arr.length - 1)];
    },

    shuffle<T>(arr: readonly T[]): T[] {
      // Kopya üzerinde çalışır — girdi dizisi asla değişmez.
      const kopya = arr.slice();
      for (let i = kopya.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        const gecici = kopya[i];
        kopya[i] = kopya[j];
        kopya[j] = gecici;
      }
      return kopya;
    },

    sample<T>(arr: readonly T[], n: number): T[] {
      if (!Number.isInteger(n) || n < 0) {
        throw new Error(`Rng.sample: n negatif olmayan tam sayı olmalı (n=${n}).`);
      }
      if (n > arr.length) {
        throw new Error(
          `Rng.sample: ${arr.length} elemandan ${n} farklı eleman istenemez.`,
        );
      }
      return rng.shuffle(arr).slice(0, n);
    },

    bool(olasilik = 0.5): boolean {
      return next() < olasilik;
    },

    fork(etiket: string): Rng {
      // Alt tohum hem kök tohuma hem etikete bağlı: aynı etiket her zaman aynı
      // alt akışı verir, farklı etiketler birbirinden bağımsız akışlar verir.
      return createRng(hash32(`${kokTohum}:${etiket}`));
    },
  };

  return rng;
}

// ------------------------------------------------------------- kendi kendini doğrulama

/**
 * `Rng.int` sözleşmesini KENDİ İÇİNDE doğrular.
 *
 * Sınanan şey tek bir şey ama en kritik şey: **her iki uç da dahil mi.**
 * Küçük bir aralıkta (0..3) çok sayıda çekim yapıp hem alt hem üst ucun
 * gerçekten çıktığını, hiçbir değerin aralık dışına taşmadığını ve tüm
 * değerlerin tam sayı olduğunu doğrular.
 *
 * Hata durumunda açıklayıcı bir metin döndürür; sorun yoksa `null`.
 * (Fırlatmak yerine döndürüyor ki hem test hem geliştirme modu aynı işlevi
 * kullanabilsin.)
 */
export function rngSozlesmesiniDogrula(tohum = 12345): string | null {
  const r = createRng(tohum);
  const gorulen = new Set<number>();

  for (let i = 0; i < 400; i++) {
    const v = r.int(0, 3);
    if (!Number.isInteger(v)) return `Rng.int tam sayı üretmedi: ${v}`;
    if (v < 0 || v > 3) return `Rng.int aralık dışına taştı: ${v} (beklenen 0..3)`;
    gorulen.add(v);
  }
  if (!gorulen.has(0)) return 'Rng.int alt ucu (0) hiç üretmedi — aralık kapalı değil.';
  if (!gorulen.has(3)) return 'Rng.int üst ucu (3) hiç üretmedi — ÜST SINIR DAHİL DEĞİL.';
  if (gorulen.size !== 4) return `Rng.int 4 farklı değer yerine ${gorulen.size} üretti.`;

  // Tek değerli aralık: int(7,7) her zaman 7 olmalı.
  for (let i = 0; i < 20; i++) {
    if (r.int(7, 7) !== 7) return 'Rng.int(7,7) 7 dışında bir değer üretti.';
  }

  // Determinizm: aynı tohum, aynı dizi.
  const a = createRng(999);
  const b = createRng(999);
  for (let i = 0; i < 50; i++) {
    if (a.int(0, 100) !== b.int(0, 100)) return 'Aynı tohum farklı dizi üretti.';
  }

  // shuffle girdiyi değiştirmemeli.
  const kaynak = [1, 2, 3, 4, 5];
  const kopyaOncesi = kaynak.join(',');
  createRng(1).shuffle(kaynak);
  if (kaynak.join(',') !== kopyaOncesi) return 'Rng.shuffle girdi dizisini değiştirdi.';

  return null;
}

// Geliştirme modunda modül yüklenirken bir kez çalışır. Bozuk bir RNG sessizce
// yanlış müfredat sınırı üretir; bunu ilk saniyede görmek istiyoruz.
if (import.meta.env?.DEV) {
  const hata = rngSozlesmesiniDogrula();
  if (hata) throw new Error(`RNG sözleşmesi ihlali: ${hata}`);
}
