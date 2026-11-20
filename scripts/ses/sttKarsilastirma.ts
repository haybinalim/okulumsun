/**
 * Konuşmadan-yazıya (STT) çıktısı ile beklenen klip metnini karşılaştırma — SAF modül (dosya/süreç yok).
 *
 * Kural özeti (docs/ses/icerik-dogrulama.md):
 *  1. Normalleştirme: tr-TR küçük harf, rakam → yazı (`turkishNumber`), noktalama/boşluk atılır; ç ğ ı ö ş ü AYRI
 *     harf kalır (yanlış harf = yanlış söyleniş), yalnız â î û düz harfe indirilir.
 *  2. Benzerlik: 1 - Levenshtein / uzun olanın uzunluğu (boşluksuz harf dizisi üzerinde).
 *  3. Karar: çok kısa beklenen metin → `kulak` (STT güvenilmez; BAŞARISIZ değil); aksi halde benzerlik >= eşik → `gecti`,
 *     değilse `supheli`. Boş transkript hiçbir zaman `gecti` olmaz.
 */
import { turkishNumber } from './klipler.ts';

export type Durum = 'gecti' | 'supheli' | 'kulak';

/** Beklenen metinde (boşluksuz) bu kadar ya da daha az harf varsa klip "kulak gerekli" sayılır (tek harf / tek hece). */
export const KISA_HARF_ESIGI = 2;
/** Varsayılan benzerlik eşiği; `--esik` ile değişir. */
export const VARSAYILAN_ESIK = 0.85;

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

/** 0..1; iki dizi de boşsa 1 değil 0 döner (boş = karşılaştırılacak bir şey yok, "aynı" sayılmaz). */
export function benzerlik(beklenen: string, duyulan: string): number {
  const a = harfDizisi(beklenen);
  const b = harfDizisi(duyulan);
  const uzun = Math.max([...a].length, [...b].length);
  if (uzun === 0) return 0;
  return 1 - levenshtein(a, b) / uzun;
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

export function karar(beklenen: string, duyulan: string, esik = VARSAYILAN_ESIK, kisaHarf = KISA_HARF_ESIGI): Karar {
  const b = benzerlik(beklenen, duyulan);
  if (cokKisaMi(beklenen, kisaHarf)) {
    return { durum: 'kulak', benzerlik: b, neden: `beklenen metinde en çok ${kisaHarf} harf var; STT güvenilmez` };
  }
  if (harfDizisi(duyulan).length === 0) return { durum: 'supheli', benzerlik: 0, neden: 'boş transkript' };
  if (b >= esik) return { durum: 'gecti', benzerlik: b };
  return { durum: 'supheli', benzerlik: b, neden: `benzerlik ${b.toFixed(2)} < eşik ${esik}` };
}
