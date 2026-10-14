/**
 * SES → KÂĞIT METNİ (plan v2 Adım 35). Çocuğa sesle verilen yönerge kâğıtta öğretmenin okuyacağı
 * kısa bir metin olur. `tr.json` DİNAMİK içe aktarılır (ana paket büyümez); bu modül yalnız saf dönüşümdür.
 */
import type { SpeakSource } from '../../audio/speech';

const ONLAR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
const BIRLER = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];

/** 0–100 için Türkçe yazı ("on dokuz"). */
export function sayiYazisi(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 100) return String(n);
  if (n === 0) return 'sıfır';
  if (n === 100) return 'yüz';
  return [ONLAR[Math.floor(n / 10)], BIRLER[n % 10]].filter(Boolean).join(' ');
}

/** `tr.json` iç içe nesnesini "ad.anahtar" → metin düz sözlüğüne çevirir ($ ile başlayan alanlar atlanır). */
export function trDuzlestir(agac: Readonly<Record<string, unknown>>): Record<string, string> {
  const cikti: Record<string, string> = {};
  for (const [ad, grup] of Object.entries(agac)) {
    if (ad.startsWith('$') || grup === null || typeof grup !== 'object') continue;
    for (const [anahtar, deger] of Object.entries(grup as Record<string, unknown>)) {
      if (anahtar.startsWith('$') || typeof deger !== 'string') continue;
      cikti[`${ad}.${anahtar}`] = deger;
    }
  }
  return cikti;
}

const SEMBOL: Readonly<Record<string, string>> = { 'op.arti': '+', 'op.eksi': '−', 'op.esit': '=' };

/** Sayıya bağlı birim anahtarları (yalnız para birimi; "Kaç lira?" gibi soru kalıpları değil). */
const BIRIM = /^para\.lira$/;

const buyukHarf = (s: string): string => (s.length === 0 ? s : s.charAt(0).toLocaleUpperCase('tr') + s.slice(1));
const kucukHarf = (s: string): string => (s.length === 0 ? s : s.charAt(0).toLocaleLowerCase('tr') + s.slice(1));

/**
 * Yönerge metni. Örnek: `[sayi.7, op.arti, sayi.5, soru.kac-eder]` → "7 + 5 kaç eder?".
 * Yalın sayı (işlemsiz, soru kalıbı yok) yazıyla verilir ("sekiz"): çocuk sesle duyup rakamı seçer,
 * rakam kâğıtta yazılı olsaydı cevap sızardı.
 */
export function sesMetni(s: SpeakSource, tr: Readonly<Record<string, string>>): string {
  if (s.kind === 'key') {
    const k: string = s.key;
    // Tek sözcüklük klipler (konum, şekil adı) kâğıtta soruya çevrilir; yalın sayı yazıyla verilir.
    if (k.startsWith('sayi.')) return sayiYazisi(Number(k.slice(5)));
    if (k.startsWith('konum.') || k.startsWith('sekil.')) return `Hangisi “${tr[k] ?? k}”?`;
    return tr[k] ?? k;
  }
  const anahtarlar: readonly string[] = s.keys;
  const islemli = anahtarlar.some((k) => k.startsWith('op.'));
  const yalinSayi = !anahtarlar.some((k) => k.startsWith('op.') || k.startsWith('soru.') || k.startsWith('tahmin.'));
  let cikti = '';
  let oncekiTur: 'bos' | 'sayi' | 'sembol' | 'yon' | 'metin' = 'bos';
  for (const k of anahtarlar) {
    let parca: string;
    let tur: 'sayi' | 'sembol' | 'yon' | 'metin';
    if (k.startsWith('sayi.')) {
      const n = Number(k.slice(5));
      parca = yalinSayi ? sayiYazisi(n) : String(n);
      tur = 'sayi';
    } else if (SEMBOL[k]) {
      parca = SEMBOL[k];
      tur = 'sembol';
    } else {
      parca = tr[k] ?? k;
      tur = k.startsWith('yon.') ? 'yon' : 'metin';
      // Sayı/sembolün ardından gelen cümle parçası cümlenin devamıdır: "7 + 5 kaç eder?"
      if (oncekiTur === 'sembol' || (oncekiTur === 'sayi' && islemli)) parca = kucukHarf(parca);
    }
    if (oncekiTur === 'bos') cikti = parca;
    else if (oncekiTur === 'sayi' && tur === 'sayi') cikti += `, ${parca}`;
    else if (oncekiTur === 'yon' && k.startsWith('adim.')) cikti += `, ${parca}`;
    // Para birimi sayının parçasıdır, yeni cümle değil: [sayi.5, para.lira] → "beş lira" ("beş. Lira" değil).
    else if (oncekiTur === 'sayi' && BIRIM.test(k)) cikti += ` ${kucukHarf(tr[k] ?? k)}`;
    else if (oncekiTur === 'sayi' && tur === 'metin' && !islemli) cikti += `. ${buyukHarf(tr[k] ?? k)}`;
    else cikti += ` ${parca}`;
    oncekiTur = tur;
  }
  return cikti;
}
