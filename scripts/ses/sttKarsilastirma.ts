/**
 * Konuşmadan-yazıya (STT) çıktısı ile beklenen klip metnini karşılaştırma — SAF modül (dosya/süreç yok).
 *
 * Kural özeti (docs/ses/icerik-dogrulama.md):
 *  1. Normalleştirme: tr-TR küçük harf, rakam → yazı (`turkishNumber`), noktalama/boşluk atılır; ç ğ ı ö ş ü AYRI
 *     harf kalır (yanlış harf = yanlış söyleniş), yalnız â î û düz harfe indirilir.
 *  2. Benzerlik: 1 - Levenshtein / uzun olanın uzunluğu (boşluksuz harf dizisi üzerinde).
 *  3. Karar: çok kısa beklenen metin → tam eşleşirse `gecti`, eşleşmezse `kulak` (STT güvenilmez; BAŞARISIZ değil); aksi halde benzerlik >= eşik → `gecti`,
 *     değilse `supheli`. Boş transkript hiçbir zaman `gecti` olmaz.
 */
import { turkishNumber } from './klipler.ts';

export type Durum = 'gecti' | 'supheli' | 'kulak';

/** Beklenen metinde (boşluksuz) bu kadar ya da daha az harf varsa klip "kulak gerekli" sayılır (tek harf / tek hece). */
export const KISA_HARF_ESIGI = 4;
/** Varsayılan benzerlik eşiği; `--esik` ile değişir. */
export const VARSAYILAN_ESIK = 0.95;

const BASAMAK = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const ONLAR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];

/** Rakam dizisini Türkçe yazıya çevirir; 0-100 ve 200 `turkishNumber`dan, diğerleri (en çok 999999) buradan. */
export function sayiyiYaziyaCevir(n: number): string {
  try {
    return turkishNumber(n);
  } catch {
    // aralık dışı: aşağıda üretilir
  }
  if (!Number.isInteger(n) || n < 0 || n > 999_999) return String(n);
  const yuzlu = (k: number): string => {
    const y = Math.floor(k / 100);
    const kalan = k % 100;
    const yuz = y === 0 ? '' : y === 1 ? 'yüz' : `${BASAMAK[y]} yüz`;
    const on = ONLAR[Math.floor(kalan / 10)];
    return [yuz, on, BASAMAK[kalan % 10]].filter(Boolean).join(' ');
  };
  const bin = Math.floor(n / 1000);
  const binYazi = bin === 0 ? '' : bin === 1 ? 'bin' : `${yuzlu(bin)} bin`;
  return [binYazi, yuzlu(n % 1000)].filter(Boolean).join(' ');
}

/**
 * Karşılaştırma biçimi: küçük harf (tr-TR), rakamlar yazıya, noktalama atılır, boşluklar tek boşluk.
 * Kesme işareti sessizce silinir ("Ali'nin" → "alinin"); öteki noktalama boşluğa döner.
 */
export function normallestir(metin: string): string {
  const kucuk = metin.normalize('NFC').toLocaleLowerCase('tr-TR');
  const sayisiz = kucuk.replace(/\d+/g, (d) => ` ${sayiyiYaziyaCevir(Number(d))} `);
  return sayisiz
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/['’‘ʼ`´]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Karşılaştırılan harf dizisi: normalleştirilmiş metnin boşluksuz hâli ("birlikte" = "bir likte"). */
export function harfDizisi(metin: string): string {
  return normallestir(metin).replace(/\s/g, '');
}

export function levenshtein(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  if (x.length === 0) return y.length;
  if (y.length === 0) return x.length;
  let onceki = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const simdiki = [i];
    for (let j = 1; j <= y.length; j++) {
      simdiki[j] = Math.min(onceki[j] + 1, simdiki[j - 1] + 1, onceki[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    onceki = simdiki;
  }
  return onceki[y.length];
}

const SIRA_SOZCUKLERI: Readonly<Record<string, string>> = {
  bir: 'birinci', iki: 'ikinci', üç: 'üçüncü', dört: 'dördüncü', beş: 'beşinci', altı: 'altıncı', yedi: 'yedinci',
  sekiz: 'sekizinci', dokuz: 'dokuzuncu', on: 'onuncu', yirmi: 'yirminci', otuz: 'otuzuncu', kırk: 'kırkıncı',
  elli: 'ellinci', altmış: 'altmışıncı', yetmiş: 'yetmişinci', seksen: 'sekseninci', doksan: 'doksanıncı',
  yüz: 'yüzüncü', bin: 'bininci',
};

/** 4 → "dördüncü", 13 → "on üçüncü". Tanımsızsa rakam olduğu gibi kalır. */
export function sayiyiSiraYaziyaCevir(n: number): string {
  const sozcukler = sayiyiYaziyaCevir(n).split(' ');
  const son = SIRA_SOZCUKLERI[sozcukler[sozcukler.length - 1]];
  return son === undefined ? String(n) : [...sozcukler.slice(0, -1), son].join(' ');
}

const SIRA_DEGERLERI = new Set(Object.values(SIRA_SOZCUKLERI));

/** Beklenen metin sıra sözcüğüyle mi bitiyor ("dördüncü", "on üçüncü")? */
export function siraMi(beklenen: string): boolean {
  const s = normallestir(beklenen).split(' ');
  return SIRA_DEGERLERI.has(s[s.length - 1]);
}

/**
 * Whisper rakamı iki biçimde yazabilir; duyulan metnin ADAYLARI üretilir ve en iyi eşleşen alınır: (a) olduğu gibi,
 * (b) "1 6" → "16" (bitişik rakamlar). "4." yazımı BEKLENENE göre tek anlam alır: beklenen sıra sözcüğüyse
 * "dördüncü", değilse "dört" (kardinal). Böylece "dört" beklenirken "dördüncü" söyleyen klip "4." ile geçmez.
 */
export function duyulanAdaylari(duyulan: string, beklenen = ''): string[] {
  const sira = siraMi(beklenen);
  const adaylar = new Set<string>();
  const bitisik = duyulan.replace(/(\d)\s+(?=\d)/g, '$1');
  for (const t of [duyulan, bitisik]) {
    adaylar.add(sira ? t.replace(/(\d+)\.(?!\d)/g, (_, d: string) => ` ${sayiyiSiraYaziyaCevir(Number(d))} `) : t);
  }
  return [...adaylar];
}

function harfBenzerligi(a: string, b: string): number {
  const uzun = Math.max([...a].length, [...b].length);
  if (uzun === 0) return 0;
  return 1 - levenshtein(a, b) / uzun;
}

/** 0..1; iki dizi de boşsa 1 değil 0 döner (boş = karşılaştırılacak bir şey yok, "aynı" sayılmaz). */
export function benzerlik(beklenen: string, duyulan: string): number {
  const a = harfDizisi(beklenen);
  return Math.max(...duyulanAdaylari(duyulan, beklenen).map((d) => harfBenzerligi(a, harfDizisi(d))));
}

/** Beklenen metin STT ile güvenilir sınanamayacak kadar kısa mı (harf sayısı <= `KISA_HARF_ESIGI`)? */
export function cokKisaMi(beklenen: string, kisaHarf = KISA_HARF_ESIGI): boolean {
  return [...harfDizisi(beklenen)].length <= kisaHarf;
}

export interface Karar {
  readonly durum: Durum;
  readonly benzerlik: number;
  /** Kısa neden (kulak ya da şüpheli için). */
  readonly neden?: string;
}

/**
 * `kisaTamEslesmeGecer` (varsayılan açık): kısa klipte STT'nin YANLIŞ duyması zayıf kanıttır (kulak gerekir) ama
 * beklenenle HARFİ HARFİNE aynı duyması güçlü kanıttır → `gecti`. Kapalıyken kısa klibin hepsi `kulak` olur.
 */
export function karar(
  beklenen: string,
  duyulan: string,
  esik = VARSAYILAN_ESIK,
  kisaHarf = KISA_HARF_ESIGI,
  kisaTamEslesmeGecer = true,
): Karar {
  const b = benzerlik(beklenen, duyulan);
  if (cokKisaMi(beklenen, kisaHarf)) {
    if (kisaTamEslesmeGecer && b === 1) return { durum: 'gecti', benzerlik: b, neden: 'kısa klip, tam eşleşme' };
    return { durum: 'kulak', benzerlik: b, neden: `beklenen metinde en çok ${kisaHarf} harf var; STT güvenilmez` };
  }
  if (harfDizisi(duyulan).length === 0) return { durum: 'supheli', benzerlik: 0, neden: 'boş transkript' };
  if (b >= esik) return { durum: 'gecti', benzerlik: b };
  return { durum: 'supheli', benzerlik: b, neden: `benzerlik ${b.toFixed(2)} < eşik ${esik}` };
}
