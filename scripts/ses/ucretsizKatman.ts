/**
 * Google Cloud TTS ücretsiz katman koruması (KG-109, kullanıcı kuralı 28 Eki 2026:
 * "yaptığımız çalışmaların API'de ücretsiz katmanın sınırlarını aşmamasına dikkat et").
 *
 * Chirp 3 HD ücretsiz katmanı: ayda 1.000.000 karakter; aşımda 30 $ / 1M karakter
 * (https://cloud.google.com/text-to-speech/pricing, 28 Eki 2026'da okundu).
 *
 * - Aylık karakter DEFTERİ depo dışında tutulur (`TTS_KULLANIM_DOSYASI`, yoksa kalıcı çalışma
 *   alanındaki `../work/tts-kullanim.json`, o da yoksa `~/.okulumsun/tts-kullanim.json`).
 *   Biçim: `{ "2026-10": { "karakter": 5000, "istek": 0, "guncelleme": "<ISO>" } }`.
 * - Ay anahtarı Pacific saatine göre (Google Cloud faturalama ayı US/Pacific'tir).
 * - Güvenli sınır varsayılan 900.000 (%10 pay); `TTS_GUVENLI_SINIR` ile YALNIZ AŞAĞI çekilir.
 * - Her istekten ÖNCE: (bu ay kullanılan + istek) > sınır ise istek gönderilmez, hata fırlatılır.
 * - Her gönderilen deneme (429/5xx yeniden denemeleri dahil, temkinli) karakteriyle deftere
 *   atomik yazılır (geçici dosya + rename).
 * - Defter dosyası yoksa gerçek istek atılmaz (kullanım bilinmiyor = güvenli değil).
 *
 * Saf kısımlar (sayım, ay, sınır, karar) testlenir; dosya işlemleri `Defter` sınıfındadır.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Google'ın aylık ücretsiz kotası (Chirp 3 HD). */
export const UCRETSIZ_AYLIK_KARAKTER = 1_000_000;
/** Varsayılan güvenli sınır: kotanın %90'ı. */
export const VARSAYILAN_GUVENLI_SINIR = 900_000;
/** Google faturalama ayı US/Pacific saatine göredir. */
export const FATURA_SAAT_DILIMI = 'America/Los_Angeles';

type Ortam = Readonly<Record<string, string | undefined>>;

/**
 * Google'ın kuralı: girdi metnindeki tüm karakterler (boşluk dahil) faturalanır.
 * UTF-16 birim sayısı kullanılır: kod noktası sayısına eşit ya da büyüktür (temkinli).
 */
export function karakterSay(metin: string): number {
  return metin.length;
}

/** Faturalama ayı anahtarı `YYYY-AA` (Pacific saati). */
export function ayAnahtari(tarih: Date = new Date()): string {
  const parcalar = new Intl.DateTimeFormat('en-CA', {
    timeZone: FATURA_SAAT_DILIMI,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(tarih);
  const yil = parcalar.find((p) => p.type === 'year')?.value;
  const ay = parcalar.find((p) => p.type === 'month')?.value;
  if (!yil || !ay) throw new Error('Faturalama ayı hesaplanamadı.');
  return `${yil}-${ay}`;
}

/**
 * Güvenli sınır. `TTS_GUVENLI_SINIR` yalnız varsayılanın (900.000) altına çekilebilir;
 * daha yüksek değer (1.000.000 ve üstü dahil) veya geçersiz değer hata verir.
 */
export function guvenliSinir(ortam: Ortam = process.env): number {
  const ham = ortam.TTS_GUVENLI_SINIR?.trim();
  if (!ham) return VARSAYILAN_GUVENLI_SINIR;
  if (!/^\d+$/.test(ham.replace(/[._]/g, ''))) {
    throw new Error(`TTS_GUVENLI_SINIR pozitif bir tam sayı olmalı: ${ham}`);
  }
  const deger = Number.parseInt(ham.replace(/[._]/g, ''), 10);
  if (!(deger > 0)) throw new Error('TTS_GUVENLI_SINIR sıfırdan büyük olmalı.');
  if (deger > VARSAYILAN_GUVENLI_SINIR) {
    throw new Error(
      `TTS_GUVENLI_SINIR yalnız aşağı çekilebilir (en çok ${VARSAYILAN_GUVENLI_SINIR}; ` +
        `ücretsiz katman ${UCRETSIZ_AYLIK_KARAKTER}). Verilen: ${deger}`,
    );
  }
  return deger;
}

/** Defter yolu: `TTS_KULLANIM_DOSYASI` → `<depo>/../work/tts-kullanim.json` → `~/.okulumsun/…`. */
export function defterYolu(depoKoku: string, ortam: Ortam = process.env): string {
  const verilen = ortam.TTS_KULLANIM_DOSYASI?.trim();
  if (verilen) return path.resolve(verilen);
  const calisma = path.resolve(depoKoku, '..', 'work');
  if (existsSync(calisma)) return path.join(calisma, 'tts-kullanim.json');
  return path.join(os.homedir(), '.okulumsun', 'tts-kullanim.json');
}

export interface AyKaydi {
  karakter: number;
  istek: number;
  guncelleme: string;
  /** Elle eklenen açıklama gibi ek alanlar korunur. */
  [ek: string]: unknown;
}
export type DefterVerisi = Record<string, AyKaydi>;

/** Defter JSON'unu doğrular; bozuk kayıtta durur (sessizce sıfırlamaz). */
export function defterAyir(ham: unknown): DefterVerisi {
  if (typeof ham !== 'object' || ham === null || Array.isArray(ham)) {
    throw new Error('TTS kullanım defteri bir nesne olmalı.');
  }
  const sonuc: DefterVerisi = {};
  for (const [ay, kayit] of Object.entries(ham as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}$/.test(ay)) throw new Error(`Defterde geçersiz ay anahtarı: ${ay}`);
    const k = kayit as Partial<AyKaydi> | null;
    if (!k || !Number.isFinite(k.karakter) || !Number.isFinite(k.istek) || (k.karakter as number) < 0) {
      throw new Error(`Defterde geçersiz kayıt: ${ay}`);
    }
    sonuc[ay] = {
      ...k,
      karakter: k.karakter as number,
      istek: k.istek as number,
      guncelleme: String(k.guncelleme ?? ''),
    };
  }
  return sonuc;
}

export interface ButceDurumu {
  readonly ay: string;
  readonly kullanilan: number;
  readonly sinir: number;
  readonly kalan: number;
}

export function butceDurumu(veri: DefterVerisi, sinir: number, simdi: Date = new Date()): ButceDurumu {
  const ay = ayAnahtari(simdi);
  const kullanilan = veri[ay]?.karakter ?? 0;
  return { ay, kullanilan, sinir, kalan: Math.max(0, sinir - kullanilan) };
}

/** Saf karar: bu kadar karakter daha gönderilebilir mi? */
export function sigarMi(durum: ButceDurumu, karakter: number): boolean {
  return durum.kullanilan + karakter <= durum.sinir;
}

export class UcretsizKatmanAsimi extends Error {
  constructor(durum: ButceDurumu, karakter: number, ne: string) {
    super(
      `ÜCRETSİZ KATMAN KORUMASI: ${ne} gönderilmedi. ${durum.ay} (Pacific) kullanılan ` +
        `${durum.kullanilan} + istenen ${karakter} > güvenli sınır ${durum.sinir} ` +
        `(ücretsiz katman ${UCRETSIZ_AYLIK_KARAKTER}/ay; aşım 30 $/1M). Kalan: ${durum.kalan}. ` +
        'Bkz. docs/ses/SES_KAYNAKLARI.md "Ücretsiz katman koruması".',
    );
    this.name = 'UcretsizKatmanAsimi';
  }
}

/** Dosya tabanlı aylık defter. Her yazım atomiktir (geçici dosya + rename). */
export class Defter {
  constructor(
    readonly yol: string,
    readonly sinir: number,
    private readonly saat: () => Date = () => new Date(),
  ) {}

  var(): boolean {
    return existsSync(this.yol);
  }

  oku(): DefterVerisi {
    if (!this.var()) return {};
    return defterAyir(JSON.parse(readFileSync(this.yol, 'utf8')));
  }

  durum(): ButceDurumu {
    return butceDurumu(this.oku(), this.sinir, this.saat());
  }

  /** Gerçek istekten önce: defter yoksa veya bütçe yetmiyorsa fırlatır, istek gönderilmez. */
  istekOncesi(karakter: number, ne = 'İstek'): void {
    if (!this.var()) {
      throw new Error(
        `ÜCRETSİZ KATMAN KORUMASI: kullanım defteri yok (${this.yol}); ${ne} gönderilmedi. ` +
          'Bu ayki gerçek kullanımı yazarak oluşturun veya TTS_KULLANIM_DOSYASI ile yolunu verin.',
      );
    }
    const durum = this.durum();
    if (!sigarMi(durum, karakter)) throw new UcretsizKatmanAsimi(durum, karakter, ne);
  }

  /** Gönderilen her deneme (başarılı ya da 429/5xx) karakteriyle sayılır. */
  kaydet(karakter: number, istek = 1): AyKaydi {
    const veri = this.oku();
    const ay = ayAnahtari(this.saat());
    const onceki = veri[ay] ?? { karakter: 0, istek: 0, guncelleme: '' };
    const yeni: AyKaydi = {
      ...onceki,
      karakter: onceki.karakter + karakter,
      istek: onceki.istek + istek,
      guncelleme: this.saat().toISOString(),
    };
    veri[ay] = yeni;
    mkdirSync(path.dirname(this.yol), { recursive: true });
    const gecici = `${this.yol}.${process.pid}.tmp`;
    writeFileSync(gecici, `${JSON.stringify(veri, null, 2)}\n`);
    renameSync(gecici, this.yol);
    return yeni;
  }
}

/**
 * Çalışma başı kuru tahmin: üretilecek metinlerin toplam karakteri kalan bütçeyi aşıyorsa
 * hiç başlamadan fırlatır. Dönen değer toplam karakterdir.
 */
export function onTahmin(metinler: readonly string[], durum: ButceDurumu): number {
  const toplam = metinler.reduce((t, m) => t + karakterSay(m), 0);
  if (!sigarMi(durum, toplam)) throw new UcretsizKatmanAsimi(durum, toplam, `${metinler.length} klip`);
  return toplam;
}
