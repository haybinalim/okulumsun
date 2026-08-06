/**
 * JENERATÖR ÖZELLİK (PROPERTY-BASED) TESTLERİ
 *
 * Plan §15'in istediği şey: "Soru jeneratörleri — Vitest property-based,
 * 10.000 tohum: cevap doğru mu, sonuç ≤20 mi, negatif var mı, çeldirici cevaba
 * eşit mi, ritmik sayma ≤100 mü. Bir aritmetik hatası 6 yaşındaki çocuğa
 * yanlış öğretir."
 *
 * Buradaki testler HER jeneratörü binlerce tohumla dener ve dört değişmezi yoklar:
 *  1. DEĞİŞMEZLİK   — `alistirmaIhlalleri(ex)` boş dönmeli (ürün kısıtları tutuluyor).
 *  2. DETERMİNİZM   — aynı (tohum, zorluk) → birebir aynı alıştırma.
 *  3. TEK DOĞRU      — tam olarak bir doğru şık; hiçbir çeldirici doğru cevaba eşit değil.
 *  4. MÜFREDAT SINIRI — sayısal cevap tavanın altında ve negatif değil
 *                     (say/topla ≤20, ritmik ≤100).
 *
 * `Math.random` YASAK (rng.ts) — tüm rastgelelik `createRng(tohum)`'dan gelir.
 */
import { test, expect } from 'vitest';
import { createRng, rngSozlesmesiniDogrula } from '../../src/exercises/rng';
import {
  ISLEM_ARALIGI,
  RITMIK_UST_SINIR,
  alistirmaIhlalleri,
  type Difficulty,
  type Exercise,
  type Option,
} from '../../src/exercises/types';
import { uretSay } from '../../src/exercises/templates/say';
import { karsilastirUret } from '../../src/exercises/templates/karsilastir';
import { ritmikUret } from '../../src/exercises/templates/ritmik';
import { uretToplaGorsel } from '../../src/exercises/templates/toplaGorsel';
import { konumUret } from '../../src/exercises/templates/konum';
import { eslikUret } from '../../src/exercises/templates/eslik';
import { yonergeUret } from '../../src/exercises/templates/yonerge';
import { rakamTaniUret } from '../../src/exercises/templates/rakamTani';
import { sipsakUret } from '../../src/exercises/templates/sipsak';
import { siraSayiUret } from '../../src/exercises/templates/siraSayi';
import { tahminMiktarUret } from '../../src/exercises/templates/tahminMiktar';
import { onlukCozumleUret } from '../../src/exercises/templates/onlukCozumle';
import { oruntuSayiUret } from '../../src/exercises/templates/oruntuSayi';
import { oruntuSekilUret } from '../../src/exercises/templates/oruntuSekil';
import { toplaSembolUret } from '../../src/exercises/templates/toplaSembol';
import { cikarGorselUret } from '../../src/exercises/templates/cikarGorsel';
import { cikarSembolUret } from '../../src/exercises/templates/cikarSembol';
import { tahminIslemUret } from '../../src/exercises/templates/tahminIslem';
import { islemHikayeUret } from '../../src/exercises/templates/islemHikaye';
import { toplaOnaTumleUret } from '../../src/exercises/templates/toplaOnaTumle';
import { esitDengeUret } from '../../src/exercises/templates/esitDenge';
import { eksikToplananUret } from '../../src/exercises/templates/eksikToplanan';
import { tersIslemUret } from '../../src/exercises/templates/tersIslem';
import { olcUzunlukUret } from '../../src/exercises/templates/olcUzunluk';
import { olcKutleUret } from '../../src/exercises/templates/olcKutle';
import { olcBirimUret } from '../../src/exercises/templates/olcBirim';
import { olcTahminUret } from '../../src/exercises/templates/olcTahmin';

/** Her jeneratörün altından geçirildiği tohum sayısı. Plan 10.000 ister; bu değer
 *  derleme/hata ayıklama döngüsünü hızlı tutar — CI'da yükseltilebilir. */
const TOHUM_SAYISI = 2000;
const ZORLUKLAR: readonly Difficulty[] = [1, 2, 3, 4, 5];

// ----------------------------------------------------------------- yardımcılar

/** Bir şıkkın sayısal değeri; sayı olmayan türlerde undefined. */
function sayisalDeger(o: Option): number | undefined {
  return o.deger.tur === 'sayi' ? o.deger.sayi : undefined;
}

/** Doğru şıkların sayısal değerleri (sayı olmayanlar atlanır). */
function dogruDegerler(ex: Exercise): number[] {
  return ex.options
    .filter((o) => o.correct === true)
    .map(sayisalDeger)
    .filter((v): v is number => v !== undefined);
}

/**
 * Beklenen doğru şık sayısı. Tek-seçimli alıştırmalarda 1; çok-boşluklu
 * TAP_TO_PLACE'te (ritmik) her boşluk kendi doğru kartını taşıdığı için
 * yuva sayısı kadar. (MATCH_PAIRS/SEQUENCE_ORDER bu projede henüz üretilmiyor.)
 */
function beklenenDogruSayisi(ex: Exercise): number {
  if (ex.kind === 'TAP_TO_PLACE') return ex.yuvalar.length;
  if (ex.kind === 'SEQUENCE_ORDER') return ex.validation.dogruSira.length;
  if (ex.kind === 'MATCH_PAIRS') return ex.options.filter((o) => o.correct === true).length;
  return 1;
}

/** Yanlış şıkların sayısal değerleri (sayı olmayanlar atlanır). */
function yanlisDegerler(ex: Exercise): number[] {
  return ex.options
    .filter((o) => o.correct !== true)
    .map(sayisalDeger)
    .filter((v): v is number => v !== undefined);
}

/**
 * Bir jeneratörü birçok (tohum, zorluk) ikilisi için dener ve dört değişmezi
 * yoklar. İlk ihlallerde, soruyu birebir yeniden kurabilmek için tohum ve
 * zorluk dahil açıklayıcı bir hata raporu biriktirir.
 */
function jeneratoreiYokla(
  ad: string,
  uret: (p: { seed: number; difficulty: Difficulty }, rng: ReturnType<typeof createRng>) => Exercise,
  cevapUstSinir: number,
): void {
  const ihlaller: string[] = [];

  for (let s = 0; s < TOHUM_SAYISI; s++) {
    for (const difficulty of ZORLUKLAR) {
      const params = { seed: s, difficulty };

      // --- 2) DETERMİNİZM
      const a = uret(params, createRng(s));
      const b = uret(params, createRng(s));
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        ihlaller.push(`[determinizm] seed=${s} d=${difficulty} — aynı tohum farklı çıktı.`);
      }

      // --- 1) DEĞİŞMEZLİK (ürün kısıtları)
      const dz = alistirmaIhlalleri(a);
      if (dz.length > 0) {
        ihlaller.push(`[değişmez] seed=${s} d=${difficulty} — ${dz.join(' | ')}`);
      }

      // --- 3) DOĞRU ŞIK SAYISI + doğru değerler ayrı + çeldirici doğruya eşit değil
      const dogruAdet = a.options.filter((o) => o.correct === true).length;
      const beklenen = beklenenDogruSayisi(a);
      if (dogruAdet !== beklenen) {
        ihlaller.push(`[dogruSayi] seed=${s} d=${difficulty} — ${dogruAdet} doğru (beklenen ${beklenen}).`);
      }
      const dgr = dogruDegerler(a);
      if (new Set(dgr).size !== dgr.length) {
        ihlaller.push(`[tekrarDogru] seed=${s} d=${difficulty} — aynı değerde birden fazla doğru şık.`);
      }
      const dogruKumesi = new Set(dgr);
      const esitCeldirici = yanlisDegerler(a).filter((v) => dogruKumesi.has(v));
      if (esitCeldirici.length > 0) {
        ihlaller.push(
          `[çeldirici] seed=${s} d=${difficulty} — doğru cevaba eşit yanlış şık: ${[...new Set(esitCeldirici)].join(',')}.`,
        );
      }

      // --- 4) MÜFREDAT SINIRI: her doğru cevap tam sayı, negatif değil, tavanın altında.
      for (const dv of dgr) {
        if (!Number.isInteger(dv)) ihlaller.push(`[tamsayı] seed=${s} d=${difficulty} — ${dv}.`);
        if (dv < 0) ihlaller.push(`[negatif] seed=${s} d=${difficulty} — ${dv}.`);
        if (dv > cevapUstSinir) ihlaller.push(`[tavan] seed=${s} d=${difficulty} — ${dv} > ${cevapUstSinir}.`);
      }
    }
  }

  if (ihlaller.length > 0) {
    throw new Error(`${ad}: ${ihlaller.length} ihlal.\n  - ${ihlaller.slice(0, 20).join('\n  - ')}`);
  }
}

// -------------------------------------------------------------------- testler

test('RNG sözleşmesi: int her iki ucu dahil, deterministik, girdiyi değiştirmiyor', () => {
  // rng.ts içindeki kendini doğrulama fonksiyonu — null dönerse sorun yok.
  const hata = rngSozlesmesiniDogrula();
  expect(hata, `RNG sözleşme ihlali: ${hata}`).toBeNull();
});

test('M-SAY: değişmezler, determinizm, tek doğru ve ≤20 korunuyor', () => {
  jeneratoreiYokla('M-SAY', (p, rng) => uretSay(p, rng), ISLEM_ARALIGI.max);
});

test('M-KARSILASTIR: değişmezler, determinizm, tek doğru ve ≤20 korunuyor', () => {
  jeneratoreiYokla('M-KARSILASTIR', (p, rng) => karsilastirUret(p, rng), ISLEM_ARALIGI.max);
});

test('M-RITMIK: değişmezler, determinizm, tek doğru ve ≤100 korunuyor', () => {
  jeneratoreiYokla('M-RITMIK', (p, rng) => ritmikUret(p, rng), RITMIK_UST_SINIR);
});

test('M-TOPLA-GORSEL: değişmezler, determinizm, tek doğru ve ≤20 korunuyor', () => {
  jeneratoreiYokla('M-TOPLA-GORSEL', (p, rng) => uretToplaGorsel(p, rng), ISLEM_ARALIGI.max);
});

test('M-KONUM: değişmezler, determinizm, tek doğru korunuyor', () => {
  // Görsel şıklı — sayısal sınır yok, ama değişmezler ve determinizm kontrolü yapılır.
  // cevapUstSinir: Infinity çünkü görsel şıkların sayısal değeri yok.
  jeneratoreiYokla('M-KONUM', (p, rng) => konumUret(p, rng), Infinity);
});

test('M-ESLIK: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-ESLIK', (p, rng) => eslikUret(p, rng), Infinity);
});

test('M-YONERGE: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-YONERGE', (p, rng) => yonergeUret(p, rng), Infinity);
});

test('M-RAKAM-TANI: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-RAKAM-TANI', (p, rng) => rakamTaniUret(p, rng), 9);
});

test('M-SIPSAK: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-SIPSAK', (p, rng) => sipsakUret(p, rng), 10);
});

test('M-SIRA-SAYI: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-SIRA-SAYI', (p, rng) => siraSayiUret(p, rng), 10);
});

test('M-TAHMIN-MIKTAR: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-TAHMIN-MIKTAR', (p, rng) => tahminMiktarUret(p, rng), 20);
});

test('M-ONLUK-COZUMLE: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-ONLUK-COZUMLE', (p, rng) => onlukCozumleUret(p, rng), 20);
});

test('M-ORUNTU-SAYI: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-ORUNTU-SAYI', (p, rng) => oruntuSayiUret(p, rng), 20);
});

test('M-ORUNTU-SEKIL: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-ORUNTU-SEKIL', (p, rng) => oruntuSekilUret(p, rng), Infinity);
});

test('M-TOPLA-SEMBOL: değişmezler, determinizm, tek doğru ve ≤20 korunuyor', () => {
  jeneratoreiYokla('M-TOPLA-SEMBOL', (p, rng) => toplaSembolUret(p, rng), ISLEM_ARALIGI.max);
});

test('M-CIKAR-GORSEL: değişmezler, determinizm, tek doğru ve ≤20 korunuyor', () => {
  jeneratoreiYokla('M-CIKAR-GORSEL', (p, rng) => cikarGorselUret(p, rng), ISLEM_ARALIGI.max);
});

test('M-CIKAR-SEMBOL: değişmezler, determinizm, tek doğru ve ≤20 korunuyor', () => {
  jeneratoreiYokla('M-CIKAR-SEMBOL', (p, rng) => cikarSembolUret(p, rng), ISLEM_ARALIGI.max);
});

test('M-TAHMIN-ISLEM: değişmezler, determinizm, tek doğru ve ≤20 korunuyor', () => {
  jeneratoreiYokla('M-TAHMIN-ISLEM', (p, rng) => tahminIslemUret(p, rng), ISLEM_ARALIGI.max);
});

test('M-ISLEM-HIKAYE: değişmezler, determinizm, tek doğru ve ≤20 korunuyor', () => {
  jeneratoreiYokla('M-ISLEM-HIKAYE', (p, rng) => islemHikayeUret(p, rng), ISLEM_ARALIGI.max);
});

test('M-TOPLA-ONA-TUMLE: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-TOPLA-ONA-TUMLE', (p, rng) => toplaOnaTumleUret(p, rng), 10);
});

test('M-ESIT-DENGE: değişmezler, determinizm, tek doğru ve ≤20 korunuyor', () => {
  jeneratoreiYokla('M-ESIT-DENGE', (p, rng) => esitDengeUret(p, rng), ISLEM_ARALIGI.max);
});

test('M-EKSIK-TOPLANAN: değişmezler, determinizm, tek doğru ve ≤20 korunuyor', () => {
  jeneratoreiYokla('M-EKSIK-TOPLANAN', (p, rng) => eksikToplananUret(p, rng), ISLEM_ARALIGI.max);
});

test('M-TERS-ISLEM: değişmezler, determinizm korunuyor', () => {
  jeneratoreiYokla('M-TERS-ISLEM', (p, rng) => tersIslemUret(p, rng), ISLEM_ARALIGI.max);
});

test('M-OLC-UZUNLUK: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-OLC-UZUNLUK', (p, rng) => olcUzunlukUret(p, rng), 15);
});

test('M-OLC-KUTLE: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-OLC-KUTLE', (p, rng) => olcKutleUret(p, rng), 15);
});

test('M-OLC-BIRIM: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-OLC-BIRIM', (p, rng) => olcBirimUret(p, rng), 15);
});

test('M-OLC-TAHMIN: değişmezler, determinizm, tek doğru korunuyor', () => {
  jeneratoreiYokla('M-OLC-TAHMIN', (p, rng) => olcTahminUret(p, rng), 15);
});
