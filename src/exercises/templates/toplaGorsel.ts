/**
 * M-TOPLA-GORSEL — GÖRSEL MODELLİ TOPLAMA (ve istenirse ÇIKARMA)
 * ============================================================================
 *
 * HANGİ KAZANIMI NASIL KARŞILIYOR
 * -------------------------------
 * · MAT.1.2.1 "Günlük yaşamın içerdiği toplama ve çıkarma işlemlerini
 *   çözümleyebilme" — soru bir işlem CÜMLESİ olarak sesle verilir
 *   (`sayExpression`), sahnede ise o işlemin GÖRSEL MODELİ durur: iki nesne
 *   kümesi (birleştirme), onluk çerçeve, sayı doğrusu ya da rakam + nesne
 *   (üstüne sayma). Çocuk işlemi sembolden değil MODELDEN çözümler.
 * · MAT.1.2.2 "…tahminde bulunarak ve zihinden işlem yaparak muhakeme edebilme"
 *   — 3. kademeden itibaren birinci toplanan artık tek tek sayılamaz (rakam
 *   kartı ya da dolu onluk çerçeve olarak durur); çocuk saymak yerine ZİHİNDEN
 *   üstüne saymak zorunda kalır. Programın adıyla andığı üç strateji
 *   (büyük sayının üzerine sayma, 10'a tamamlama, toplamı aynı olan sayılar —
 *   SAYFA 36) zorluk kademelerine birebir gömülüdür.
 *
 * ÖLÇTÜĞÜ MİKRO DÜĞÜMLER (src/content/skills.json)
 * ------------------------------------------------
 * · mat.toplama.gorsel-birlestirme  (kademe 1)
 * · mat.toplama.hepsini-sayma       (kademe 2)
 * · mat.toplama.ustune-sayma        (kademe 3-4-5)
 * Çıkarma üretildiğinde item, `mat.cikarma.ayirma` / `mat.cikarma.geriye-sayarak`
 * düğümlerini yoklar. DİKKAT — skills.json'da bu iki düğüm `M-CIKAR-GORSEL`
 * şablonuna bağlı ve `planlandi` durumunda. Bu dosya skills.json'a DOKUNMUYOR;
 * uzlaştırma birleştirme adımında yapılmalı (ya bu iki düğümün
 * `exerciseTemplates` listesine `M-TOPLA-GORSEL` eklenir, ya da çıkarma
 * M-CIKAR-GORSEL'e bırakılır). Bu yüzden `islem` verilmezse VARSAYILAN '+'tır:
 * şablon rastgele çıkarma üretip planlayıcıya sahte kapsam bildirmez.
 *
 * MÜFREDAT SINIRI (docs/mufredat-kisitlari.md §2 — ihlal edilemez)
 * ---------------------------------------------------------------
 * · Sonuç 0–20 (20 dâhil). NEGATİF SONUÇ YOK. İşlenenler de 0–20 içinde.
 * · Toplama eldesiz, iki sayıyla sınırlı; çıkarmada ONLUK BOZMA YOK
 *   (kademe 5 çıkarmasında `b ≤ a`nın birler basamağı — 17−4 var, 13−7 YOK).
 * · Karşılaştırma sembolleri (< > =) hiç kullanılmaz; bu şablon zaten yalnız
 *   rakam kartı gösterir.
 * · Ritmik saymanın asimetrik sınırlarıyla işi yok — sayı doğrusu modeli
 *   1'er ilerler ve 20'yi aşmaz.
 *
 * ZORLUK KADEMELERİ = PROGRAMIN STRATEJİ İLERLEMESİ
 * -------------------------------------------------
 *  1 gorselBirlestirme  sonuç ≤5,  iki küme yan yana, hepsi sayılabilir
 *  2 hepsiniSayma       sonuç ≤10, aynı model, sayı büyür
 *  3 ustuneSayma        BÜYÜK SAYI ÖNCE (7+2, "2+7" DEĞİL) — bkz. aşağıdaki not
 *  4 onaTumleme         10 çapası: a+b=10 ya da 10+b
 *  5 onuGecen           10'u geçen, sonuç ≤20 (tek basamaklı çaprazlama ya da
 *                       iki basamaklı + tek basamaklı eldesiz)
 *
 * ÜSTÜNE SAYMA NEDEN 7+2, 2+7 DEĞİL: program "toplamada büyük sayıdan
 * başlanması (üzerine sayma) ve değişme özelliği vurgulanır" diyor (SAYFA 36).
 * Çocuk 2+7'yi görünce iki'den başlayıp yediyi tek tek ekler — bu, üstüne sayma
 * DEĞİL hepsini saymadır ve stratejiyi öğretmez. Bu yüzden 3. kademeden itibaren
 * jeneratör toplananları BÜYÜK-ÖNCE sıralar. 1. ve 2. kademede sıralama
 * KASITLI OLARAK karıştırılır: orada mesele stratejiyi değil, değişme özelliğini
 * (2+3 ile 3+2 aynı yere varır) görsel olarak deneyimlemektir.
 *
 * GÖRSEL SÖZLÜKTE OLMAYAN, GEREKEN EKLER (types.ts'e ben dokunmadım)
 * ------------------------------------------------------------------
 * · `model: 'parmak'` — VisualSpec'te parmak/el görseli YOK. İstendiğinde
 *   sessizce yanlış bir şey çizmek yerine en yakın YAPISAL akrabaya, onluk
 *   çerçeveye düşülür (ikisi de 5'li/10'lu yapıyı öğretir). Gerekli dal:
 *   `{ type:'parmak'; acikParmak:number; elSayisi:1|2 }`.
 * · İşlem sembolü (+ − =) çizilebilir bir VisualSpec dalı değil. `showSymbols`
 *   bu yüzden yalnız RAKAMLARI görünür kılar; işlem yönünü ses taşır
 *   (op.arti / op.eksi). Gerekli dal:
 *   `{ type:'islemCumlesi'; a:number; islem:'+'|'-'; b:number; sonucGizli:boolean }`.
 * · `sayiDogrusu`da zıplama gösterimi yok; ikinci işlenen ayrı bir nesne kümesi
 *   olarak sahneye konuyor. Gerekli alan: `ziplamalar?: readonly number[]`.
 *
 * GEREKEN YENİ SES ANAHTARLARI (tr.json'a DOKUNULMADI — paralel ajanlar var)
 * -------------------------------------------------------------------------
 * · 'yardim.geriye-sayalim'  — çıkarmanın K2 stratejisi. Şu an yerine
 *   'yardim.k2-birlikte-sayalim' kullanılıyor (doğru ama stratejiyi söylemiyor).
 * · 'yardim.ona-tamamla'     — 4. kademenin K2 stratejisi (10'a tamamlama).
 * · 'soru.kac-kaldi'         — sembolsüz çıkarma sahnesi için.
 * Hiçbiri manifestte YOK; kodda kullanılmadı.
 */

import { sayExpression, sayNumber, type SpeakSource } from '../../audio/speech';
import {
  celdiricileriSikaCevir,
  sayisalCeldiricilerKesin,
  type HataEtiketi,
  type SayiAraligi,
  type SayisalCeldirici,
} from '../distractors';
import type { Rng } from '../rng';
import {
  ISLEM_ARALIGI,
  NESNE_SPRITELARI,
  RENKLER,
  makeItemId,
  varsayilanIpuclari,
  type AssetSpec,
  type AudioToImageExercise,
  type Difficulty,
  type ExerciseGenerator,
  type GeneratorParams,
  type HintSet,
  type KazanimKodu,
  type OgretimselSozlesme,
  type NesneSprite,
  type Nokta,
  type Option,
  type Renk,
  type SkillId,
  type VisualSpec,
} from '../types';

// --------------------------------------------------------------- kimlik/beyan

export const TOPLA_GORSEL_TEMPLATE_ID = 'M-TOPLA-GORSEL';

const KAZANIMLAR: readonly KazanimKodu[] = ['MAT.1.2.1', 'MAT.1.2.2'];

/** Toplama kolunun yokladığı düğümler (skills.json'da bu şablona bağlı olanlar). */
const TOPLAMA_SKILLLERI = {
  gorselBirlestirme: 'mat.toplama.gorsel-birlestirme',
  hepsiniSayma: 'mat.toplama.hepsini-sayma',
  ustuneSayma: 'mat.toplama.ustune-sayma',
} as const satisfies Record<string, SkillId>;

/**
 * Çıkarma kolunun yokladığı düğümler. skills.json'da M-CIKAR-GORSEL'e bağlılar;
 * dosya başındaki uzlaştırma notuna bakın. Burada iddia edilmelerinin nedeni
 * DÜRÜSTLÜK: üretilen çıkarma maddesi gerçekten bu becerileri ölçüyor, toplama
 * düğümlerini değil.
 */
const CIKARMA_SKILLLERI = {
  ayirma: 'mat.cikarma.ayirma',
  geriyeSayarak: 'mat.cikarma.geriye-sayarak',
} as const satisfies Record<string, SkillId>;

// ------------------------------------------------------------------ parametre

/**
 * Görsel model. Jeneratör ÇİZMEZ, hangi modelin tarif edileceğini seçer.
 * 'parmak' için bkz. dosya başındaki "olmayan görsel" notu.
 */
export type ToplaGorselModeli = 'kume' | 'onlukCerceve' | 'sayiDogrusu' | 'parmak';

export const TOPLA_GORSEL_MODELLERI: readonly ToplaGorselModeli[] = [
  'kume',
  'onlukCerceve',
  'sayiDogrusu',
  'parmak',
];

/** Zorluk kademesinin karşılığı olan zihinsel strateji. */
export type Strateji =
  | 'gorselBirlestirme'
  | 'hepsiniSayma'
  | 'ustuneSayma'
  | 'onaTumleme'
  | 'onuGecen';

export const STRATEJI_KADEMESI: Readonly<Record<Difficulty, Strateji>> = {
  1: 'gorselBirlestirme',
  2: 'hepsiniSayma',
  3: 'ustuneSayma',
  4: 'onaTumleme',
  5: 'onuGecen',
};

export interface ToplaGorselParams extends GeneratorParams {
  /**
   * VARSAYILAN '+'. Çıkarma yalnız AÇIK istekle üretilir — gerekçe dosya
   * başındaki skills.json uzlaştırma notunda.
   */
  readonly islem?: '+' | '-';
  /** Birinci işlenen. Verilirse `b` de verilmeli; ikisi de doğrulanır. */
  readonly a?: number;
  /** İkinci işlenen. */
  readonly b?: number;
  readonly model?: ToplaGorselModeli;
  /** false = tamamen görsel (yıl başı); true = rakamlar da görünür. */
  readonly showSymbols?: boolean;
  /** 2, 3 ya da 4. Verilmezse zorluk ve moda göre seçilir. */
  readonly optionCount?: 2 | 3 | 4;
}

// ------------------------------------------------------------- sayı seçimi

export interface IslemCifti {
  readonly a: number;
  readonly b: number;
  readonly sonuc: number;
  readonly strateji: Strateji;
}

/**
 * Kademeye uygun (a, b) çiftini seçer ve sonucun 0–20 kaldığını GARANTİ eder.
 *
 * İşlenenler her zaman ≥1: görsel modelde "0 elma" boş bir alan demek ve çocuk
 * bunu "soru bitmemiş" diye okuyor. Sıfırın etkisiz eleman olduğu (SAYFA 36)
 * ayrı bir şablonun işi. TEK istisna 1. kademe çıkarmasında `b === a` durumu:
 * "hepsi gitti, hiç kalmadı" sonucun 0 olabildiğini gösteren gerçek bir kavram
 * ve boş kalan taraf burada anlamlı.
 */
export function sayilariSec(strateji: Strateji, islem: '+' | '-', rng: Rng): IslemCifti {
  let a: number;
  let b: number;

  switch (strateji) {
    case 'gorselBirlestirme': {
      if (islem === '+') {
        a = rng.int(1, 4);
        b = rng.int(1, 5 - a); // toplam ≤ 5
      } else {
        a = rng.int(2, 5);
        b = rng.int(1, a); // b === a olabilir → sonuç 0 (bkz. yukarıdaki not)
      }
      break;
    }

    case 'hepsiniSayma': {
      if (islem === '+') {
        // Önce SONUCU seçip parçalara ayırmak, sonucun 6–10 bandında kalmasını
        // garanti eder; (a,b)'yi bağımsız çekmek sonucu 2'ye de düşürürdü ve
        // kademe 1'den ayırt edilemezdi.
        const sonuc = rng.int(6, 10);
        a = rng.int(1, sonuc - 1);
        b = sonuc - a;
      } else {
        a = rng.int(6, 10);
        b = rng.int(1, 5);
      }
      break;
    }

    case 'ustuneSayma': {
      // Küçük ikinci işlenen (1..3) üstüne saymayı FİZİKSEL olarak mümkün kılar:
      // 3'ten fazlasını üstüne saymak çalışma belleğini aşar, çocuk hepsini
      // saymaya geri döner.
      if (islem === '+') {
        a = rng.int(5, 9);
        b = rng.int(1, Math.min(3, 10 - a)); // toplam ≤ 10
      } else {
        a = rng.int(6, 10);
        b = rng.int(1, 3); // geriye 1-3 adım
      }
      break;
    }

    case 'onaTumleme': {
      // İki biçim: (i) 10'a tamamlama, (ii) 10 çapasının üstü/altı.
      // TEK biçim kullanılsaydı toplamada cevap HER ZAMAN 10 olurdu; çocuk
      // işlemi çözmeden kalıbı ezberlerdi.
      const tam10 = rng.bool();
      if (islem === '+') {
        if (tam10) {
          a = rng.int(1, 9);
          b = 10 - a; // sonuç tam 10
        } else {
          a = 10;
          b = rng.int(1, 9); // sonuç 11..19, onluk çapası
        }
      } else {
        if (tam10) {
          a = 10;
          b = rng.int(1, 9); // 10'un tümleyenini bul, sonuç 1..9
        } else {
          const c = rng.int(1, 9);
          a = 10 + c;
          b = c; // onluğa geri dön, sonuç 10
        }
      }
      break;
    }

    case 'onuGecen': {
      const tekBasamakli = rng.bool();
      if (islem === '+') {
        if (tekBasamakli) {
          // Tek basamaklı + tek basamaklı, ONLUĞU GEÇEN (8+5 gibi).
          // Programın "10'a tamamlama" stratejisi tam olarak bunun içindir.
          a = rng.int(6, 9);
          b = rng.int(11 - a, 9); // a+b ≥ 11, ≤ 18
        } else {
          // İki basamaklı + tek basamaklı, ELDESİZ: birler toplamı ≤ 9.
          a = rng.int(11, 18);
          const birlerBos = 9 - (a % 10);
          b = rng.int(1, Math.min(birlerBos, ISLEM_ARALIGI.max - a));
        }
      } else {
        // İki basamaklıdan tek basamaklı, ONLUK BOZMADAN: b ≤ birler basamağı.
        a = rng.int(12, 19);
        b = rng.int(1, a % 10);
      }
      break;
    }
  }

  // ÜSTÜNE SAYMA YÖNLENDİRMESİ: 3. kademeden itibaren büyük sayı ÖNCE.
  // 1-2. kademede kasıtlı olarak karışık — orada değişme özelliği deneyimlenir.
  if (
    islem === '+' &&
    (strateji === 'ustuneSayma' || strateji === 'onaTumleme' || strateji === 'onuGecen') &&
    b > a
  ) {
    const gecici = a;
    a = b;
    b = gecici;
  }

  const sonuc = islem === '+' ? a + b : a - b;

  // Müfredat sınırı burada, üretim anında kapanır. Bir kademenin aralığı yanlış
  // yazılırsa test/geliştirme anında PATLAR; çocuğa 21 ya da −3 gitmez.
  if (sonuc < ISLEM_ARALIGI.min || sonuc > ISLEM_ARALIGI.max) {
    throw new Error(
      `M-TOPLA-GORSEL: müfredat dışı sonuç ${a} ${islem} ${b} = ${sonuc} ` +
        `(izin verilen ${ISLEM_ARALIGI.min}..${ISLEM_ARALIGI.max}, strateji=${strateji}).`,
    );
  }
  if (a < 0 || a > ISLEM_ARALIGI.max || b < 0 || b > ISLEM_ARALIGI.max) {
    throw new Error(`M-TOPLA-GORSEL: işlenen aralık dışı (a=${a}, b=${b}).`);
  }

  return { a, b, sonuc, strateji };
}

// ------------------------------------------------------------- görsel model

/** Bir sayıyı onluk çerçevelere böler: 13 → [10, 3], 10 → [10], 0 → [0]. */
function cerceveBol(n: number): number[] {
  if (n === 0) return [0];
  const gruplar: number[] = [];
  let kalan = n;
  while (kalan >= 10) {
    gruplar.push(10);
    kalan -= 10;
  }
  if (kalan > 0) gruplar.push(kalan);
  return gruplar;
}

/** Nesne kümesi düzeni: 5'e kadar sıra, üstü gruplu (5'li algı). */
function kumeDuzeni(adet: number): 'sira' | 'gruplu' {
  return adet <= 5 ? 'sira' : 'gruplu';
}

/**
 * Strateji için ANLAMLI modeller. Çağıran açıkça bir model isterse o kazanır
 * (öğretmen "bugün sayı doğrusu çalışalım" diyebilmeli); istemezse buradan
 * seçilir.
 */
function modelHavuzu(strateji: Strateji): readonly ToplaGorselModeli[] {
  switch (strateji) {
    case 'gorselBirlestirme':
      // Yıl başı: yalnız somut nesne. Onluk çerçeve/sayı doğrusu henüz soyut.
      return ['kume'];
    case 'hepsiniSayma':
      return ['kume', 'onlukCerceve'];
    case 'ustuneSayma':
      return ['kume', 'sayiDogrusu', 'onlukCerceve'];
    case 'onaTumleme':
      // 10'a tamamlamanın kanonik modeli onluk çerçevedir (boş gözler cevabı
      // gösterir); sayı doğrusu ikincil.
      return ['onlukCerceve', 'sayiDogrusu'];
    case 'onuGecen':
      return ['onlukCerceve', 'sayiDogrusu'];
  }
}

/** İşlenenin sahnedeki gösterimi: sembolsüzse nesne, sembolluyse rakam. */
function islenenGosterimi(
  deger: number,
  showSymbols: boolean,
  sprite: NesneSprite,
  renk: Renk,
): VisualSpec {
  return showSymbols
    ? { type: 'rakam', sayi: deger }
    : { type: 'nesneKumesi', sprite, adet: deger, layout: kumeDuzeni(deger), renk };
}

interface SahneGirdisi {
  readonly cift: IslemCifti;
  readonly islem: '+' | '-';
  readonly model: ToplaGorselModeli;
  readonly showSymbols: boolean;
  readonly sprite: NesneSprite;
  readonly renkA: Renk;
  readonly renkB: Renk;
}

const SOL: Nokta = { x: 0.3, y: 0.45 };
const SAG: Nokta = { x: 0.7, y: 0.45 };
const UST_ORTA: Nokta = { x: 0.5, y: 0.3 };
const ALT_ORTA: Nokta = { x: 0.5, y: 0.62 };
/** Kümelerin ALTINDAKİ rakam etiketleri (yalnız `showSymbols` açıkken). */
const SOL_ALT: Nokta = { x: 0.3, y: 0.68 };
const SAG_ALT: Nokta = { x: 0.7, y: 0.68 };

/**
 * Sahneyi TARİF eder (çizmez).
 *
 * Kademe 1-2'de birinci işlenen sayılabilir nesnelerdir — "hepsini sayma" bu
 * modelin üstünde doğal olarak çalışır. Kademe 3+'ta birinci işlenen RAKAM
 * KARTIDIR: tek tek sayılamaz, çocuk onu "avucunda tutup" ikinciyi üstüne
 * saymak zorunda kalır. Model değişimi stratejiyi öğreten şeyin ta kendisidir.
 */
function sahneKur(g: SahneGirdisi): VisualSpec {
  const { cift, islem, showSymbols, sprite, renkA, renkB } = g;
  const { a, b, sonuc, strateji } = cift;
  const somutBirinci = strateji === 'gorselBirlestirme' || strateji === 'hepsiniSayma';

  switch (g.model) {
    case 'kume': {
      if (islem === '+') {
        const birinci: VisualSpec = somutBirinci
          ? { type: 'nesneKumesi', sprite, adet: a, layout: kumeDuzeni(a), renk: renkA }
          : { type: 'rakam', sayi: a };
        const ikinci: VisualSpec = {
          type: 'nesneKumesi',
          sprite,
          adet: b,
          layout: kumeDuzeni(b),
          renk: renkB,
        };
        // showSymbols, somut kümelerde RAKAM ETİKETİ demektir: her kümenin altına
        // sayısı yazılır (miktar ↔ rakam eşlemesi). Sembolsüzken hiçbir rakam
        // görünmez — yıl başında istenen tam olarak budur.
        const etiketler: { gorsel: VisualSpec; konum: Nokta }[] =
          showSymbols && somutBirinci
            ? [
                { gorsel: { type: 'rakam', sayi: a }, konum: SOL_ALT },
                { gorsel: { type: 'rakam', sayi: b }, konum: SAG_ALT },
              ]
            : [];
        return {
          type: 'sahne',
          parcalar: [
            { gorsel: birinci, konum: SOL },
            { gorsel: ikinci, konum: SAG },
            ...etiketler,
          ],
        };
      }

      // ÇIKARMA — "ayırma" modeli. Kademe 1-2'de bütün (a) iki parçaya ayrılmış
      // gösterilir: solda KALAN, sağda GİDEN. Çocuk kalanı sayarak cevabı bulur;
      // bu kademede amaç zaten işlemin ne demek olduğunu görmek.
      // BURADA showSymbols rakam etiketi EKLEMEZ: soldaki küme zaten cevabın
      // kendisidir, altına rakamını yazmak cevabı doğrudan vermek olur.
      if (somutBirinci) {
        return {
          type: 'sahne',
          parcalar: [
            {
              gorsel: {
                type: 'nesneKumesi',
                sprite,
                adet: sonuc,
                layout: kumeDuzeni(sonuc),
                renk: renkA,
              },
              konum: SOL,
            },
            {
              gorsel: {
                type: 'nesneKumesi',
                sprite,
                adet: b,
                layout: kumeDuzeni(b),
                renk: renkB,
              },
              konum: SAG,
            },
          ],
        };
      }
      // Kademe 3+: eksilen rakam kartı, çıkan nesne kümesi → geriye sayma.
      return {
        type: 'sahne',
        parcalar: [
          { gorsel: { type: 'rakam', sayi: a }, konum: SOL },
          {
            gorsel: {
              type: 'nesneKumesi',
              sprite,
              adet: b,
              layout: kumeDuzeni(b),
              renk: renkB,
            },
            konum: SAG,
          },
        ],
      };
    }

    // 'parmak' ile 'onlukCerceve' AYNI gövdeyi paylaşır (boş case, düşme değil):
    // VisualSpec'te parmak/el görseli yok; en yakın yapısal akraba onluk
    // çerçevedir. Sessizce alakasız bir şey çizmektense 5'li/10'lu yapıyı
    // koruyoruz. Bkz. dosya başındaki "olmayan görsel" notu.
    case 'parmak':
    case 'onlukCerceve': {
      if (islem === '+') {
        // İki toplanan AYRI çerçevelerde: 8+5 → [8, 5]. Birinci çerçevedeki
        // 2 boş göz "10'a tamamlama" stratejisini görünür kılar.
        return { type: 'onlukCerceve', gruplar: [...cerceveBol(a), ...cerceveBol(b)] };
      }
      // Çıkarmada "çıkan"ı çerçevede göstermenin bir yolu yok (üstü çizili göz
      // diye bir görsel dal yok) — eksilen gösterilir, işlemi ses taşır.
      return { type: 'onlukCerceve', gruplar: cerceveBol(a) };
    }

    case 'sayiDogrusu': {
      // Doğru 0'dan başlar (çocuk için sabit çıpa), üst sınır işleme göre 10 ya
      // da 20. İşaretli tek nokta BAŞLANGIÇTIR — sonucun yeri işaretlenseydi
      // çocuk işlemi yapmadan doğru şıkkı okurdu.
      const ust = Math.max(a, sonuc) > 10 ? 20 : 10;
      const dogru: VisualSpec = {
        type: 'sayiDogrusu',
        bas: 0,
        son: ust,
        adim: 1,
        isaretli: [a],
        eksik: [],
      };
      // Kaç zıplama yapılacağı ayrı bir parça olarak duruyor (sayiDogrusu'nun
      // zıplama alanı yok — bkz. dosya başı notu).
      const ziplamaGostergesi = islenenGosterimi(b, showSymbols, sprite, renkB);
      return {
        type: 'sahne',
        parcalar: [
          { gorsel: dogru, konum: UST_ORTA },
          { gorsel: ziplamaGostergesi, konum: ALT_ORTA },
        ],
      };
    }
  }
}

// ----------------------------------------------------------- çeldirici planı

/**
 * Hata etiketleri ÖNCELİK SIRASIYLA. Sıra pedagojiktir: kademede en çok bilgi
 * veren yanılgı başa yazılır, çünkü `sayisalCeldiriciler` listeyi baştan tarar
 * ve her etiketten EN FAZLA BİR çeldirici üretir.
 *
 * · TEK_KUMEYI_ALMA (a ya da b) — birleştirmeyi hiç yapmamış çocuğu yakalar;
 *   erken kademelerin bir numaralı tanısı.
 * · HEPSINI_SAYMA (sonuç−1) — üstüne sayarken başlangıcı da sayan çocuk.
 *   3. kademeden itibaren birinci sıraya geçer, çünkü kademenin ölçtüğü şey tam
 *   olarak bu geçiştir.
 * · ONLUK_BOZMA (sonuç±10) — 10 çapası kurulmamış çocuk; yalnız 4-5. kademede
 *   VE yalnız sonuç ≥ 11 iken (aşağıdaki gerekçeye bakın).
 * · ISLEM_YONU — toplama/çıkarmayı ters uygulama; bağlam (a, b, islem) ister.
 * · FAZLA_SAYMA / EKSIK_SAYMA (±1) — her kademede geçerli, en zayıf tanı, sonda.
 *
 * ONLUK_BOZMA'NIN SONUÇ ≥ 11 KOŞULU: etiketin sayısal karşılığı "sonuç−10",
 * yani DÜŞÜRÜLEN onluk. Sonuç 10 ise bu 0 eder ve "9 + 1 = 0" şıkkı üretilir —
 * hiçbir çocuğun seçmeyeceği bir değer, yani ölü şık. Ölü şık yalnız yeri işgal
 * etmez, dört şıklı soruyu fiilen üç şıklı yapar ve tanı gücünü düşürür.
 * Kaybedilecek bir onluk yoksa yanılgı da yoktur.
 */
function celdiriciOnceligi(
  strateji: Strateji,
  islem: '+' | '-',
  sonuc: number,
): readonly HataEtiketi[] {
  const sirala = (liste: readonly HataEtiketi[]): readonly HataEtiketi[] =>
    sonuc >= 11 ? liste : liste.filter((e) => e !== 'ONLUK_BOZMA');
  if (islem === '+') {
    switch (strateji) {
      case 'gorselBirlestirme':
        return sirala(['TEK_KUMEYI_ALMA', 'FAZLA_SAYMA', 'EKSIK_SAYMA']);
      case 'hepsiniSayma':
        return sirala(['TEK_KUMEYI_ALMA', 'FAZLA_SAYMA', 'EKSIK_SAYMA', 'ISLEM_YONU']);
      case 'ustuneSayma':
        return sirala(['HEPSINI_SAYMA', 'TEK_KUMEYI_ALMA', 'ISLEM_YONU', 'FAZLA_SAYMA']);
      case 'onaTumleme':
        return sirala([
          'ONLUK_BOZMA',
          'HEPSINI_SAYMA',
          'TEK_KUMEYI_ALMA',
          'FAZLA_SAYMA',
          'EKSIK_SAYMA',
        ]);
      case 'onuGecen':
        return sirala([
          'ONLUK_BOZMA',
          'HEPSINI_SAYMA',
          'TEK_KUMEYI_ALMA',
          'ISLEM_YONU',
          'FAZLA_SAYMA',
        ]);
    }
  }
  switch (strateji) {
    case 'gorselBirlestirme':
      return sirala(['TEK_KUMEYI_ALMA', 'ISLEM_YONU', 'FAZLA_SAYMA', 'EKSIK_SAYMA']);
    case 'hepsiniSayma':
      return sirala(['ISLEM_YONU', 'TEK_KUMEYI_ALMA', 'FAZLA_SAYMA', 'EKSIK_SAYMA']);
    case 'ustuneSayma':
      return sirala(['ISLEM_YONU', 'FAZLA_SAYMA', 'EKSIK_SAYMA', 'TEK_KUMEYI_ALMA']);
    case 'onaTumleme':
      return sirala([
        'ONLUK_BOZMA',
        'ISLEM_YONU',
        'FAZLA_SAYMA',
        'TEK_KUMEYI_ALMA',
        'EKSIK_SAYMA',
      ]);
    case 'onuGecen':
      return sirala([
        'ONLUK_BOZMA',
        'ISLEM_YONU',
        'FAZLA_SAYMA',
        'EKSIK_SAYMA',
        'TEK_KUMEYI_ALMA',
      ]);
  }
}

/**
 * Çeldiricilerin çekileceği aralık. Sonuç küçükken 0..20'den çekmek "17" gibi
 * hiç kimsenin yapmayacağı bir hata üretir ve şıkkı bedava eler; bu yüzden
 * tavan kademeye göre daralır. Taban HER ZAMAN 0 — negatif çeldirici yok.
 */
function celdiriciAraligi(strateji: Strateji): SayiAraligi {
  const tavan =
    strateji === 'gorselBirlestirme' ? 10 : strateji === 'hepsiniSayma' ? 12 : 20;
  return { min: ISLEM_ARALIGI.min, max: tavan };
}

// -------------------------------------------------------------------- yardım

/** K2'nin strateji sesi — çocuğa YÖNTEMİ söyler, cevabı değil. */
function k2Sesi(strateji: Strateji, islem: '+' | '-'): SpeakSource {
  // Çıkarmanın kendi stratejisi ('yardim.geriye-sayalim') henüz kayıtlı değil;
  // birlikte sayma klibi doğru ama daha genel. Bkz. dosya başı ses notu.
  if (islem === '-') return { kind: 'key', key: 'yardim.k2-birlikte-sayalim' };
  switch (strateji) {
    case 'gorselBirlestirme':
    case 'hepsiniSayma':
      return { kind: 'key', key: 'yardim.k2-birlikte-sayalim' };
    case 'ustuneSayma':
    case 'onaTumleme':
    case 'onuGecen':
      // "Büyük sayıyı avucunda tut, üstüne say."
      return { kind: 'key', key: 'yardim.ustune-sayma' };
  }
}

/**
 * K2'de soluklaştırılacak şık. Doğrudan EN UZAK çeldirici seçilir: elenmesi en
 * kolay olan odur, dolayısıyla elenmesi çocuğa en az bilgi kaybettirir.
 *
 * İki şıklı soruda HİÇBİR ŞEY elenmez — tek çeldiriciyi soluklaştırmak cevabı
 * doğrudan vermek olurdu ve K3'ün ("birlikte yapalım") yerini gasp ederdi.
 */
function elenecekSikIdleri(
  celdiriciler: readonly SayisalCeldirici[],
  sonuc: number,
  sikSayisi: number,
): readonly string[] {
  if (sikSayisi < 3 || celdiriciler.length === 0) return [];
  const enUzak = celdiriciler.reduce((enIyi, c) =>
    Math.abs(c.deger - sonuc) > Math.abs(enIyi.deger - sonuc) ? c : enIyi,
  );
  return [`sik-y-${enUzak.deger}`];
}

// ---------------------------------------------------------------- yardımcılar

/** Şıkka kendi sesini ekler: çocuk dokunmadan önce rakamı dinleyebilir. */
function sesliSik(o: Option): Option {
  if (o.deger.tur !== 'sayi') return o;
  const ses = sayNumber(o.deger.sayi);
  return o.correct === true ? { ...o, ses } : { ...o, ses };
}

/**
 * Şık sayısı. Akıllı tahtada 3 ile sınırlı: hedefler `SIZE.choice` kadar büyük
 * olmalı ve 4 kart bunu 65'lik erişim bölgesine sığdırmıyor (ürün kısıtı #6).
 */
function varsayilanSikSayisi(difficulty: Difficulty, mod: 'tahta' | 'kisisel'): 2 | 3 | 4 {
  const temel: 2 | 3 | 4 = difficulty === 1 ? 2 : difficulty <= 3 ? 3 : 4;
  if (mod === 'tahta' && temel === 4) return 3;
  return temel;
}

/** Kademe başına kaba süre (saniye). SESSION_LENGTH=8 → oturum 2–4 dakika. */
const SURE_TAHMINI: Readonly<Record<Difficulty, number>> = {
  1: 16,
  2: 20,
  3: 24,
  4: 28,
  5: 32,
};

// ------------------------------------------------------------------- üretim

/**
 * Tek bir M-TOPLA-GORSEL maddesi üretir.
 *
 * DETERMİNİZM: tüm rastgelelik `rng.fork(...)` alt akışlarından gelir. `fork`
 * kök tohuma bağlıdır, akışın o ana kadar ne kadar tüketildiğine DEĞİL; yani
 * bu jeneratörün çıktısı yalnızca (params, rng.seed) ikilisine bağlıdır ve
 * ileride bir alt bölümde çekim sayısı değişse bile diğerleri kaymaz.
 */
export function uretToplaGorsel(params: ToplaGorselParams, rng: Rng): AudioToImageExercise {
  const { seed, difficulty } = params;
  const islem = params.islem ?? '+';
  const strateji = STRATEJI_KADEMESI[difficulty];
  const mod = params.mod ?? 'kisisel';

  const rSayi = rng.fork('sayilar');
  const rSahne = rng.fork('sahne');
  const rCeldirici = rng.fork('celdirici');

  // 1) SAYILAR — çağıran açıkça verdiyse onlar, yoksa kademeden çekilir.
  let cift: IslemCifti;
  if (params.a != null && params.b != null) {
    const a = params.a;
    const b = params.b;
    const sonuc = islem === '+' ? a + b : a - b;
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
      throw new Error(`M-TOPLA-GORSEL: a ve b tam sayı olmalı (a=${a}, b=${b}).`);
    }
    if (sonuc < ISLEM_ARALIGI.min || sonuc > ISLEM_ARALIGI.max) {
      throw new Error(
        `M-TOPLA-GORSEL: verilen ${a} ${islem} ${b} = ${sonuc} müfredat dışı ` +
          `(${ISLEM_ARALIGI.min}..${ISLEM_ARALIGI.max}).`,
      );
    }
    if (a < 0 || a > ISLEM_ARALIGI.max || b < 0 || b > ISLEM_ARALIGI.max) {
      throw new Error(`M-TOPLA-GORSEL: verilen işlenen aralık dışı (a=${a}, b=${b}).`);
    }
    cift = { a, b, sonuc, strateji };
  } else if (params.a != null || params.b != null) {
    throw new Error('M-TOPLA-GORSEL: a ve b birlikte verilmeli (biri eksik).');
  } else {
    cift = sayilariSec(strateji, islem, rSayi);
  }

  const { a, b, sonuc } = cift;

  // 2) SAHNE
  const model = params.model ?? rSahne.pick(modelHavuzu(strateji));
  // Sembolsüz = yıl başı, tamamen görsel. 3. kademeden itibaren rakam görünür,
  // çünkü üstüne sayma zaten "rakamı tut, nesneyi say" demektir.
  const showSymbols = params.showSymbols ?? difficulty >= 3;
  const sprite: NesneSprite = params.tercihEdilenSprite ?? rSahne.pick(NESNE_SPRITELARI);
  const [renkA, renkB] = rSahne.sample(RENKLER, 2) as [Renk, Renk];
  const sahne = sahneKur({ cift, islem, model, showSymbols, sprite, renkA, renkB });

  // 3) ŞIKLAR — tanılayıcı çeldiriciler distractors.ts'ten; kendi mantığımız yok.
  const sikSayisi = params.optionCount ?? varsayilanSikSayisi(difficulty, mod);
  const celdiriciler = sayisalCeldiricilerKesin(
    sonuc,
    celdiriciOnceligi(strateji, islem, sonuc),
    celdiriciAraligi(strateji),
    sikSayisi - 1,
    rCeldirici,
    { baglam: { a, b, islem }, yedekStrateji: 'yakinKomsu' },
  );
  const siklar: readonly Option[] = celdiricileriSikaCevir(
    sonuc,
    celdiriciler,
    rCeldirici,
  ).map(sesliSik);

  // 4) TALİMAT — birincil kanal SES. `showSymbols` yalnız GÖRSEL kanalı etkiler;
  // işlem yönünü (artı/eksi) her zaman ses taşır, çünkü + ve − çizilebilir bir
  // VisualSpec dalı değil (bkz. dosya başı notu).
  const talimat = sayExpression(a, islem, b);

  // 5) VARLIKLAR — sahne tek parça olarak veriliyor ki çizim kaynağı TEK olsun.
  // 3. kademeden itibaren ayrıca bir 'ipucu' varlığı var: K2'de vurgulanacak
  // "avucunda tuttuğun büyük sayı".
  const assets: AssetSpec[] = [
    { id: 'sahne', rol: 'sahne', gorsel: sahne, erisimBolgesi: 'serbest' },
  ];
  const ipucuVar = difficulty >= 3;
  if (ipucuVar) {
    assets.push({
      id: 'ipucu-buyuk-sayi',
      rol: 'ipucu',
      gorsel: { type: 'rakam', sayi: a },
      erisimBolgesi: 'serbest',
    });
  }

  // 6) YARDIM — üç kademe. K3 cevabı gösterir ve CEZA YOKTUR (ürün kısıtı #3);
  // K3 görseli sonucu onluk çerçevede yeniden çerçeveler: 13 → [10, 3].
  const hints: HintSet = varsayilanIpuclari({
    talimatSesi: talimat,
    k2Ses: k2Sesi(strateji, islem),
    eleOptionIds: elenecekSikIdleri(celdiriciler, sonuc, sikSayisi),
    vurgulaIds: ipucuVar ? ['ipucu-buyuk-sayi'] : ['sahne'],
    k3Gorsel: { type: 'onlukCerceve', gruplar: cerceveBol(sonuc) },
  });

  const itemSkillIds = maddeSkillleri(strateji, islem);
  const hedefBeceri = itemSkillIds[0];
  if (hedefBeceri == null) {
    throw new Error('M-TOPLA-GORSEL: öğretimsel sözleşme için hedef beceri üretilemedi.');
  }
  const ogretimselSozlesme: OgretimselSozlesme = {
    hedefBeceri,
    temsilKaniti: 'gorsel-islem',
    cocukEylemi:
      islem === '-'
        ? 'kümeleri-ayir'
        : strateji === 'gorselBirlestirme'
          ? 'kümeleri-birlestir'
          : 'nesneleri-say',
    hataDestekEtiketleri: [
      'TEK_KUMEYI_ALMA',
      'HEPSINI_SAYMA',
      'ONLUK_BOZMA',
      'ISLEM_YONU',
      'FAZLA_SAYMA',
      'EKSIK_SAYMA',
    ],
  };

  return {
    // Parametre imzasına ZORLUK da giriyor: aynı tohumda 2. ve 3. kademe pekâlâ
    // aynı (a, b, model) üçlüsünü çekebilir, ama çeldirici öncelikleri farklıdır
    // — yani EKRANDA AYNI, TANIDA FARKLI iki maddedir. İmzada zorluk olmasaydı
    // ikisi tek itemId'ye çakışır ve ilerleme kaydı onları aynı soru sanardı.
    itemId: makeItemId(
      TOPLA_GORSEL_TEMPLATE_ID,
      seed,
      `d${difficulty}|${islem}|${a}|${b}|${model}|${showSymbols ? 's' : 'g'}|${sikSayisi}`,
    ),
    templateId: TOPLA_GORSEL_TEMPLATE_ID,
    kind: 'AUDIO_TO_IMAGE',
    skillIds: itemSkillIds,
    kazanimKodlari: KAZANIMLAR,
    readingLoad: 0, // rakam okuma yazma değildir; metin YOK.
    difficulty,
    estimatedSec: SURE_TAHMINI[difficulty],
    prompt: {
      ses: talimat,
      tekrarSes: talimat, // "tekrar dinle" aynı ifadeyi yavaş çalar
      gorsel: sahne,
    },
    hints,
    ogretimselSozlesme,
    assets,
    seed,
    options: siklar,
    validation: { mod: 'tekSecim', dogruOptionId: `sik-d-${sonuc}` },
  };
}

/** Maddenin gerçekten yokladığı beceri düğümleri (kademe + işleme göre). */
function maddeSkillleri(strateji: Strateji, islem: '+' | '-'): readonly SkillId[] {
  if (islem === '-') {
    return strateji === 'gorselBirlestirme' || strateji === 'hepsiniSayma'
      ? [CIKARMA_SKILLLERI.ayirma]
      : [CIKARMA_SKILLLERI.geriyeSayarak];
  }
  switch (strateji) {
    case 'gorselBirlestirme':
      return [TOPLAMA_SKILLLERI.gorselBirlestirme];
    case 'hepsiniSayma':
      return [TOPLAMA_SKILLLERI.hepsiniSayma];
    case 'ustuneSayma':
    case 'onaTumleme':
    case 'onuGecen':
      // 4-5. kademe skills.json'da ayrı düğümlerde (ona-tumleme, onu-gecen-20)
      // ama onlar başka şablonlara bağlı ve `planlandi`. Sahte kapsam bildirmemek
      // için burada en yakın HAZIR düğüm iddia ediliyor: üstüne sayma.
      return [TOPLAMA_SKILLLERI.ustuneSayma];
  }
}

// -------------------------------------------------------------- jeneratör beyanı

export const toplaGorselJeneratoru: ExerciseGenerator<ToplaGorselParams> = {
  templateId: TOPLA_GORSEL_TEMPLATE_ID,
  kind: 'AUDIO_TO_IMAGE',
  karsilananKazanimlar: KAZANIMLAR,
  karsilananSkillIds: [
    TOPLAMA_SKILLLERI.gorselBirlestirme,
    TOPLAMA_SKILLLERI.hepsiniSayma,
    TOPLAMA_SKILLLERI.ustuneSayma,
    // Yalnız `islem:'-'` açıkça istendiğinde üretilir; skills.json uzlaştırması
    // için dosya başındaki nota bakın.
    CIKARMA_SKILLLERI.ayirma,
    CIKARMA_SKILLLERI.geriyeSayarak,
  ],
  readingLoad: 0,
  zorlukAraligi: [1, 5],
  uretebildigiHatalar: [
    'TEK_KUMEYI_ALMA',
    'HEPSINI_SAYMA',
    'ONLUK_BOZMA',
    'ISLEM_YONU',
    'FAZLA_SAYMA',
    'EKSIK_SAYMA',
  ],
  uret: uretToplaGorsel,
};
