/**
 * SÖZLEŞME KATMANI — alıştırma veri modelinin TEK GERÇEK KAYNAĞI.
 *
 * Bu dosyadaki TypeScript tipleri normatiftir. `src/content/schema/*.ts`
 * içindeki Zod şemaları bu tiplerin *sınır doğrulayıcılarıdır* (yazılmış JSON,
 * IndexedDB'den okunan kayıt, test fixture'ı) — tersi değil. Uyum derleme
 * zamanında `src/content/schema/exercise.ts` içindeki tip iddiasıyla
 * zorlanır; bir alanı burada değiştirirseniz orası derlenmez ve sizi uyarır.
 *
 * NEDEN böyle: jeneratörler çalışma anında Exercise ÜRETİR. Üretim yolunda
 * Zod çalıştırmak (a) her soruda gereksiz maliyet, (b) daha zayıf güvence —
 * derleyici zaten yakalayabiliyorken hatayı çalışma anına ertelemek olurdu.
 * Zod ise dışarıdan gelen veriyi (elle yazılmış içerik, eski sürüm kayıt)
 * içeri almadan önce süzmek için gerekli. İki katman, iki iş.
 *
 * ÜRÜN KISITLARI (docs/mufredat-kisitlari.md §4) bu tiplere gömülüdür:
 *  - Çocuk okuma bilmiyor  → talimat `SpeakSource`, metin OPSİYONEL ve
 *    `readingLoad` ile ücretlendirilir.
 *  - Tek dokunma            → sürükle-bırak yok; TAP_TO_PLACE = dokun-seç +
 *    dokun-yerleştir.
 *  - Ceza yok               → K3 yardımından sonra doğru cevap TAM DOĞRU'dur.
 *  - Tanılayıcı çeldirici    → `diagnosticTag` YALNIZ yanlış şıkta (tip düzeyinde).
 *  - Deterministik üretim    → `itemId` tohumdan türetilir, rastgele değildir.
 */

import type { SpeakSource } from '../audio/speech';
import type { SpeechKey } from '../audio/audioManifest.generated';
import type { HataEtiketi } from './distractors';
import { hash32, type Rng } from './rng';

// ---------------------------------------------------------------- kimlikler

/**
 * Beceri düğümü kimliği: `mat.<alan>.<beceri>`.
 * MEB kazanım kodundan KASITLI olarak bağımsızdır — bir kazanım birden çok
 * beceriye bölünür (MAT.1.1.1 tek başına "rakam tanıma" + "nesne sayma" +
 * "sayı-miktar eşleme" içerir) ve müfredat sürümü değişse de öğrenme haritası
 * ayakta kalmalıdır.
 */
export type SkillId = `mat.${string}.${string}`;

/** Resmî MEB kazanım kodu: MAT.1.<öğrenme alanı>.<sıra>. */
export type KazanimKodu = `MAT.1.${1 | 2 | 3 | 4}.${number}`;

/**
 * Şablon kimliği (ör. 'sayma.nesne-say', 'toplama.ustune-sayma').
 * Düz `string`: paralel geliştirilen şablonlar arasında gereksiz sürtünme
 * yaratmamak için şablon adları sözleşmeyle değil, adlandırma kuralıyla korunur.
 */
export type TemplateId = string;

/**
 * Tek bir üretilmiş soru örneği kimliği.
 * MARKALI tip: tek üreticisi `makeItemId`. Böylece bir yere yanlışlıkla
 * `templateId` veya elle yazılmış bir dize geçirilemez.
 */
export type ItemId = string & { readonly __marka: 'ItemId' };

/**
 * itemId'yi TOHUMDAN türetir — aynı (şablon, tohum, parametre) üçlüsü her
 * cihazda, her çalıştırmada birebir aynı kimliği verir.
 * Gerekçe: ilerleme kaydı, tekrar planlaması ve hata analizi soruyu kimliğiyle
 * izler; kimlik rastgele olsaydı aynı soru iki farklı öğe sanılırdı.
 */
export function makeItemId(
  templateId: TemplateId,
  seed: number,
  parametreImzasi = '',
): ItemId {
  const h = hash32(`${templateId}|${seed}|${parametreImzasi}`);
  return `${templateId}#${h.toString(36)}` as ItemId;
}

// ------------------------------------------------------------ ölçek tipleri

/**
 * Okuma yükü. 0 = hiç okuma gerekmez (rakam ve semboller serbest).
 * Matematik alıştırmalarında HEDEF 0'dır; 1+ yalnızca öğretmen/veli
 * ekranlarında kabul edilir.
 */
export type ReadingLoad = 0 | 1 | 2 | 3;

/** Şablon içi göreli zorluk. Beceriler arası zorluk `SkillNode.difficulty`. */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

// ------------------------------------------------------- görsel sözlük tipleri

/** Ses kliği bulunan nesne sprite'ları (`nesne.*` ad alanıyla birebir). */
export const NESNE_SPRITELARI = [
  'elma',
  'top',
  'balon',
  'araba',
  'kalem',
  'kus',
  'cicek',
  'yildiz',
  'balik',
  'kelebek',
] as const;
export type NesneSprite = (typeof NESNE_SPRITELARI)[number];

/** Konum sorularında sesle sorulan ilişki; görsel sahnede de birebir temsil edilir. */
export const KONUM_ILISKILERI = [
  'altinda',
  'ustunde',
  'icinde',
  'onunde',
  'arkasinda',
  'arasinda',
  'yaninda',
  'disinda',
] as const;
export type KonumIliskisi = (typeof KONUM_ILISKILERI)[number];

/** Konum ilişkisini anlaşılır kılan kapsayıcı/referans çizimleri. */
export const KONUM_REFERANSLARI = ['kutu', 'sepet'] as const;
export type KonumReferansi = (typeof KONUM_REFERANSLARI)[number];

/** Yönerge kartlarında hem sesle hem okla gösterilen temel yönler. */
export const YON_KART_YONLER = ['ileri', 'geri', 'saga', 'sola'] as const;
export type YonKartiYonu = (typeof YON_KART_YONLER)[number];

/** Sprite'ın adını söyleyen ses anahtarı. */
export function nesneSesAnahtari(sprite: NesneSprite): SpeechKey {
  return `nesne.${sprite}`;
}

/** Ses kliği bulunan renkler (`renk.*` ad alanıyla birebir). */
export const RENKLER = ['mor', 'turuncu', 'yesil', 'mavi', 'pembe', 'sari'] as const;
export type Renk = (typeof RENKLER)[number];

export function renkSesAnahtari(renk: Renk): SpeechKey {
  return `renk.${renk}`;
}

/**
 * 1. sınıf şekil dağarcığı. Program "daire" değil ÇEMBER diyor
 * (docs/mufredat-kisitlari.md §2 Geometri) — adlandırmayı bozmayın.
 */
export const SEKILLER = ['ucgen', 'kare', 'dikdortgen', 'cember'] as const;
export type SekilAdi = (typeof SEKILLER)[number];

/** MAT.1.3.3'ün birincil ayrımı: önce yuvarlak/köşeli, sonra şekil adı. */
export type SekilKategorisi = 'yuvarlak' | 'koseli';

/** MAT.1.1.9 — yalnızca gerçek, dolaşımdaki banknot kupürleri. */
export const BANKNOTLAR = [5, 10, 20, 50, 100, 200] as const;
export type BanknotDegeri = (typeof BANKNOTLAR)[number];

/** Normalize koordinat (0..1) — piksel yazmak yasak, bkz. src/design/tokens.ts. */
export interface Nokta {
  readonly x: number;
  readonly y: number;
}

/** Dokunulabilir bölge. Koordinatlar sahneye göre normalize (0..1). */
export type Bolge =
  | { readonly sekil: 'daire'; readonly cx: number; readonly cy: number; readonly r: number }
  | {
      readonly sekil: 'dikdortgen';
      readonly x: number;
      readonly y: number;
      readonly w: number;
      readonly h: number;
    };

// --------------------------------------------------------- görsel spesifikasyon

/**
 * GÖRSEL SPESİFİKASYONU — jeneratör görseli ÇİZMEZ, TARİF EDER.
 *
 * NEDEN: çizim kararları (SVG, ölçek, boşluk, animasyon) Adım 3'teki görsel
 * bileşenlere ait. Jeneratör "12 elma, onluk çerçevede" der; nasıl görüneceğine
 * karışmaz. Böylece görsel dil tek yerden değiştirilebilir ve jeneratörler
 * saf/deterministik/test edilebilir kalır.
 *
 * Birleşim genişletilebilir: yeni bir görsel türü eklemek, `type` ayrımına yeni
 * bir dal eklemek ve render tarafındaki `switch`'i tamamlamaktır (exhaustive
 * switch sayesinde unutulan dal derleme hatası verir).
 */
export type VisualSpec =
  /** Sayılacak/karşılaştırılacak nesne kümesi. */
  | {
      readonly type: 'nesneKumesi';
      readonly sprite: NesneSprite;
      readonly adet: number;
      readonly layout: 'sira' | 'gruplu' | 'onlukCerceve' | 'dagınık';
      /** `layout:'dagınık'` için ÖNCEDEN hesaplanmış konumlar (determinizm). */
      readonly konumlar?: readonly Nokta[];
      readonly renk?: Renk;
    }
  /**
   * Onluk çerçeve. `gruplar` her çerçevedeki dolu göz sayısı: [10, 3] = 13.
   * Ayrı bir tür, çünkü burada mesele nesne değil YAPI (5'li/10'lu görme).
   */
  | { readonly type: 'onlukCerceve'; readonly gruplar: readonly number[] }
  /** Sayı doğrusu. `eksik` boş bırakılıp çocuğa doldurtulacak değerler. */
  | {
      readonly type: 'sayiDogrusu';
      readonly bas: number;
      readonly son: number;
      readonly adim: number;
      readonly isaretli: readonly number[];
      readonly eksik: readonly number[];
    }
  /** Tek geometrik şekil (MAT.1.3.4 / MAT.1.3.5). */
  | {
      readonly type: 'sekil';
      readonly sekil: SekilAdi;
      readonly renk?: Renk;
      /** Prototip etkisini kırmak için döndürme (SEKIL_PROTOTIP hatası). */
      readonly donusDerece?: number;
      readonly olcek?: number;
    }
  /** Rakam/sayı kartı — okuma yükü 0, çünkü rakam okuma yazma değildir. */
  | { readonly type: 'rakam'; readonly sayi: number }
  /** Banknot (MAT.1.1.9 — yalnızca tanıma). */
  | { readonly type: 'banknot'; readonly deger: BanknotDegeri }
  /**
   * Toplama/çıkarma hikâyesinin görünür miktar modeli.
   * İlk küme, eklenen/ayrılan küme ve sonuç aynı nesneyle birlikte gösterilir;
   * böylece işlem ifadesi görselden izlenebilir.
   */
  | {
      readonly type: 'islemSahnesi';
      readonly nesne: NesneSprite;
      readonly ilkAdet: number;
      readonly degisimAdedi: number;
      readonly islem: '+' | '-';
      readonly renk?: Renk;
    }
  /**
   * Eşleştirme ve işlem sorularında aritmetik ilişkiyi eksiksiz gösteren kart.
   * Sayıların arasındaki işlem ve eşitlik sembolleri yoksa çocuk doğru ters işlemi
   * yalnız sayı sırasından çıkarmaya zorlanır; bu tür o belirsizliği kapatır.
   */
  | {
      readonly type: 'islemKarti';
      readonly ilkSayi: number;
      readonly ikinciSayi: number;
      readonly sonuc: number;
      readonly islem: '+' | '-';
    }
  /**
   * Bir nesnenin uzunluğu için ölçme/tahmin sahnesi.
   * `gorunum:'birimlerleOlcum'` her birimi nesnenin altında hizalı gösterir;
   * `gorunum:'tahmin'` yalnız bir referans birim göstererek makul tahmini ölçer.
   */
  | {
      readonly type: 'olcumSahnesi';
      readonly nesne: NesneSprite;
      readonly birim: NesneSprite;
      readonly birimAdedi: number;
      readonly boyut: 'uzunluk';
      readonly gorunum: 'birimlerleOlcum' | 'tahmin';
      readonly renk?: Renk;
    }
  /**
   * İki nesnenin ölçülebilir özelliğini aynı görsel kanıtla karşılaştırır.
   * Uzunlukta ortak başlangıç çizgisi, kütlede ise aşağı inen kefeli terazi vardır.
   * Seçeneklerdeki renk/nesne, sahnedeki adayla birebir eşleşir.
   */
  | {
      readonly type: 'olcumKarsilastirma';
      readonly boyut: 'uzunluk' | 'kutle';
      readonly sol: { readonly nesne: NesneSprite; readonly renk: Renk; readonly deger: number };
      readonly sag: { readonly nesne: NesneSprite; readonly renk: Renk; readonly deger: number };
    }
  /** Sıralanacak/örüntü kuran kart dizisi (MAT.1.2.4, örüntü). */
  | {
      readonly type: 'oruntu';
      readonly ogeler: readonly VisualSpec[];
      readonly eksikIndeksler: readonly number[];
    }
  /** Yönerge adım kartı; ok yönü ve adım sayısı görselde birlikte sunulur. */
  | {
      readonly type: 'yonKarti';
      readonly yon: YonKartiYonu;
      readonly adim: number;
    }
  /**
   * Konum bildirimi sorusu için anlamı doğrudan görünür sahne.
   * Hedef nesne, referans kutu/sepet ile belirtilen ilişki içinde çizilir.
   */
  | {
      readonly type: 'konumSahnesi';
      readonly iliski: KonumIliskisi;
      readonly hedef: NesneSprite;
      readonly referans: KonumReferansi;
    }
  /** Birden çok görselin tek sahnede bileşimi. */
  | {
      readonly type: 'sahne';
      readonly parcalar: readonly { readonly gorsel: VisualSpec; readonly konum: Nokta }[];
    };

/**
 * Ekranda yer tutan bir görsel varlık.
 * `erisimBolgesi:'alt65'` ürün kısıtı #6: akıllı tahtada dokunulabilir her şey
 * ekranın alt %65'inde olmalı (1. sınıf çocuğu üst kısma uzanamıyor).
 */
export interface AssetSpec {
  readonly id: string;
  readonly rol: 'sahne' | 'secenek' | 'ipucu' | 'gerecKutusu';
  readonly gorsel: VisualSpec;
  readonly erisimBolgesi?: 'alt65' | 'serbest';
}

// ------------------------------------------------------------------- talimat

/**
 * Soru talimatı. BİRİNCİL KANAL SESTİR.
 * `metin` yalnızca `readingLoad > 0` olan (yani çocuğa değil yetişkine dönük)
 * alıştırmalarda doldurulur.
 */
export interface Prompt {
  readonly ses: SpeakSource;
  /** "Tekrar dinle" için — çoğu zaman `ses`'in aynısı, bazen daha yavaş/uzun. */
  readonly tekrarSes?: SpeakSource;
  /** Sorunun sahnesi (sayılacak nesneler, sayı doğrusu, şekil...). */
  readonly gorsel?: VisualSpec;
  /** Yalnız readingLoad>0 iken. Çocuk ekranında boş bırakın. */
  readonly metin?: string;
}

// -------------------------------------------------------------------- şıklar

/** Bir şıkkın taşıdığı değer. Görsel şıklar `gorsel` dalını kullanır. */
export type OptionDeger =
  | { readonly tur: 'sayi'; readonly sayi: number }
  | { readonly tur: 'gorsel'; readonly gorsel: VisualSpec }
  | { readonly tur: 'sekil'; readonly sekil: SekilAdi }
  | { readonly tur: 'sekilKategorisi'; readonly kategori: SekilKategorisi }
  | { readonly tur: 'banknot'; readonly deger: BanknotDegeri }
  /** Karşılaştırma TERİMLERİ. `<` `>` `=` sembolleri 1. sınıfta YOK. */
  | { readonly tur: 'terim'; readonly terim: 'cok' | 'daha-cok' | 'az' | 'daha-az' | 'esit' }
  /** Metinli şık: readingLoad'u > 0 yapar. Çocuk ekranında kullanmayın. */
  | { readonly tur: 'metin'; readonly metin: string };

interface OptionOrtak {
  readonly id: string;
  readonly deger: OptionDeger;
  /** Şıkkın kendi sesi (varsa) — çocuk şıkka dokunmadan önce dinleyebilir. */
  readonly ses?: SpeakSource;
}

/**
 * Şık.
 *
 * KURAL (tip düzeyinde zorlanır): `diagnosticTag` YALNIZ yanlış şıklarda bulunur.
 * `correct: true` olan dalda alan `never`'dır; doğru cevaba tanı etiketi
 * iliştirmeye çalışmak DERLEME hatası verir.
 *
 * NEDEN: tanı etiketi "bu çocuk şu yanlış zihinsel modeli kullandı" demektir.
 * Doğru cevapta böyle bir çıkarım yoktur; etiketlenirse rapor ekranı çocuğa
 * olmayan bir kavram yanılgısı atfeder.
 */
export type Option =
  | (OptionOrtak & { readonly correct: true; readonly diagnosticTag?: never })
  | (OptionOrtak & { readonly correct?: false; readonly diagnosticTag?: HataEtiketi });

/** HOTSPOT_FIND şıkkı: normal şık + sahnedeki dokunulabilir bölge. */
export type HotspotOption = Option & { readonly bolge: Bolge };

/** TAP_TO_PLACE hedefi — parçanın yerleştirileceği boş yuva. */
export interface Yuva {
  readonly id: string;
  readonly konum: Nokta;
  /** Yuvanın kabul ettiği görsel türü (yanlış yerleştirme geri bildirimi için). */
  readonly bekleyen?: OptionDeger['tur'];
}

/** MATCH_PAIRS kartı — hangi sütunda duracağı burada belli olur. */
export type EslesmeKarti = Option & { readonly taraf: 'sol' | 'sag' };

// ---------------------------------------------------------------- doğrulama

/**
 * Cevabın nasıl doğrulanacağı. Her etkileşim primitifinin doğrulaması farklı;
 * ayrımlı birleşim sayesinde yanlış eşleşme derlenmez.
 */
export type TekSecimValidation = {
  readonly mod: 'tekSecim';
  readonly dogruOptionId: string;
};

export type SayimValidation = {
  readonly mod: 'sayim';
  readonly beklenenAdet: number;
  /** Dokunulacak nesnelerin id'leri — her biri BİR kez sayılmalı. */
  readonly hedefIds: readonly string[];
  /** Aynı nesneye ikinci dokunuş sayılmasın (BIREBIR_ESLESME hatasını görünür kılar). */
  readonly herNesneBirKez: boolean;
  /** Sayım bittikten sonra cevap sayaçtan mı okunur, şıktan mı seçilir. */
  readonly cevapSecimi: 'sayac' | 'secenek';
  /** `cevapSecimi:'secenek'` ise doğru şıkkın id'si. */
  readonly dogruOptionId?: string;
};

export type YerlesimValidation = {
  readonly mod: 'yerlesim';
  /** yuvaId → optionId. Tüm yuvalar dolmadan cevap değerlendirilmez. */
  readonly dogruEslesme: Readonly<Record<string, string>>;
  /** Yuvaların hangi sırayla doldurulduğu önemli mi. */
  readonly siraOnemli: boolean;
};

export type EslestirmeValidation = {
  readonly mod: 'eslestirme';
  /** [solOptionId, sagOptionId] çiftleri. */
  readonly ciftler: readonly (readonly [string, string])[];
};

export type SiralamaValidation = {
  readonly mod: 'siralama';
  readonly dogruSira: readonly string[];
};

export type HotspotValidation = {
  readonly mod: 'hotspot';
  readonly dogruHotspotIds: readonly string[];
  /** Birden çok doğru varsa hepsi mi gerekli, biri yeter mi. */
  readonly hepsiGerekli: boolean;
};

export type SayiDogrusuValidation = {
  readonly mod: 'sayiDogrusu';
  readonly dogruDeger: number;
  /**
   * Kabul toleransı (değer birimiyle). 0 = tam isabet.
   * Parmakla dokunuşta 0 tolerans haksızlık olur; işaretli doğrularda
   * genelde 0, sürekli doğrularda 0.5 kullanın.
   */
  readonly tolerans: number;
};

export type Validation =
  | TekSecimValidation
  | SayimValidation
  | YerlesimValidation
  | EslestirmeValidation
  | SiralamaValidation
  | HotspotValidation
  | SayiDogrusuValidation;

// ------------------------------------------------------------------ yardım

/**
 * Yardımın puana etkisi. SIFIR — pazarlık konusu değil (ürün kısıtı #3).
 * K3'ten ("birlikte yapalım") sonra verilen doğru cevap TAM DOĞRU sayılır;
 * ilerleme çubuğunda, rozet sayımında ve ustalık hesabında hiçbir fark yoktur.
 * NEDEN: yardım isteyen çocuk cezalandırılırsa bir daha istemez ve sessizce
 * yanlış öğrenir.
 */
export const YARDIM_PUAN_CEZASI = 0 as const;

/**
 * Tek bir yardım kademesi — VERİ, JSX değil.
 * NEDEN veri: yardımlar jeneratörde üretilir, testte doğrulanır, ilerleme
 * kaydında saklanır ve öğretmen raporunda listelenir. JSX olsaydı hiçbiri
 * mümkün olmazdı.
 */
export interface Hint {
  readonly kademe: 1 | 2 | 3;
  readonly ses: SpeakSource;
  /** K2: elenecek (soluklaştırılacak) şık id'leri. Silinmez — soluklaşır. */
  readonly eleOptionIds?: readonly string[];
  /** Dikkati çekilecek şık/asset id'leri. */
  readonly vurgulaIds?: readonly string[];
  /** Yeniden çerçeveleme görseli (ör. aynı 8'i onluk çerçevede göstermek). */
  readonly gorsel?: VisualSpec;
  /** Görsel ipucu hareketi. Sürükleme değil, işaret/nabız. */
  readonly hareket?: 'isaretParmagi' | 'nabiz' | 'sirayaSay' | 'yok';
  /** K3'te true: doğru cevap gösterilir ve çocuk onu birlikte uygular. */
  readonly cevabiGoster?: boolean;
}

/**
 * Üç kademe, sırayla:
 *  K1 YENİDEN YÖNLENDİRME — talimatı yavaş tekrarla, sahneyi işaret et.
 *  K2 ELEME + STRATEJİ     — belirgin yanlışları soluklaştır, yöntemi söyle
 *                             ("üstüne sayalım", "birlikte sayalım").
 *  K3 BİRLİKTE YAPALIM     — cevabı göster, çocuk uygulasın. CEZA YOK.
 */
export type HintSet = readonly [Hint, Hint, Hint];

/**
 * Standart üç kademeli yardım seti üretir.
 * Şablonlar kendi K2 stratejisini (`k2Ses`) seçer; kalanı ortaktır, böylece
 * yardım dili uygulama genelinde tutarlı kalır.
 */
export function varsayilanIpuclari(secenekler: {
  readonly talimatSesi: SpeakSource;
  readonly k2Ses?: SpeakSource;
  readonly eleOptionIds?: readonly string[];
  readonly vurgulaIds?: readonly string[];
  readonly k3Gorsel?: VisualSpec;
}): HintSet {
  return [
    {
      kademe: 1,
      ses: secenekler.talimatSesi,
      hareket: 'isaretParmagi',
    },
    {
      kademe: 2,
      ses: secenekler.k2Ses ?? { kind: 'key', key: 'yardim.k2-eleme' },
      eleOptionIds: secenekler.eleOptionIds,
      vurgulaIds: secenekler.vurgulaIds,
      hareket: 'nabiz',
    },
    {
      kademe: 3,
      ses: { kind: 'key', key: 'yardim.k3-birlikte' },
      gorsel: secenekler.k3Gorsel,
      hareket: 'sirayaSay',
      cevabiGoster: true,
    },
  ];
}

// ------------------------------------------------------ etkileşim primitifleri

/**
 * Etkileşim primitifleri. HEPSİ TEK DOKUNMA (ürün kısıtı #5).
 * Akıllı tahtaların tek noktalı IR dokunmatiği sürüklemeyi kaçırıyor; bu yüzden
 * sürükle-bırak yok, yerine "dokun-seç → dokun-yerleştir" var.
 */
export const INTERACTION_KINDS = [
  /** Sesli talimat → görsel şıklardan birine dokun. Okuma yükü 0'ın omurgası. */
  'AUDIO_TO_IMAGE',
  /** Nesnelere tek tek dokunarak say. Birebir eşleşmeyi görünür kılar. */
  'TAP_COUNT',
  /** Parçaya dokun (seçilir) → yuvaya dokun (yerleşir). Sürüklemenin yerine geçer. */
  'TAP_TO_PLACE',
  /** Soldan bir karta, sağdan eşine dokun. */
  'MATCH_PAIRS',
  /** Kartlara doğru sırayla dokun; dokunma sırası = sıralama. */
  'SEQUENCE_ORDER',
  /** Sahne içinde hedef bölgeyi bul ve dokun (ör. köşeli olanı). */
  'HOTSPOT_FIND',
  /** Sayı doğrusunda bir noktaya dokun. */
  'NUMBER_LINE',
] as const;
export type InteractionKind = (typeof INTERACTION_KINDS)[number];

// ------------------------------------------------------------------ alıştırma

/** Her alıştırmanın taşıdığı ortak alanlar. */
interface ExerciseBase {
  /** Tohumdan türetilmiş, deterministik. Bkz. `makeItemId`. */
  readonly itemId: ItemId;
  readonly templateId: TemplateId;
  /** Bu soru hangi beceri düğümlerini yoklar (birden çok olabilir). */
  readonly skillIds: readonly SkillId[];
  /** Hangi resmî kazanımlara hizmet ediyor — rapor ve müfredat kapsamı için. */
  readonly kazanimKodlari: readonly KazanimKodu[];
  /** Çocuk ekranında HEDEF 0. */
  readonly readingLoad: ReadingLoad;
  readonly difficulty: Difficulty;
  /** Oturum planlaması için kaba süre tahmini (saniye). SESSION_LENGTH=8 soru. */
  readonly estimatedSec: number;
  readonly prompt: Prompt;
  readonly hints: HintSet;
  /** Görsel TARİFLERİ — çizim değil. */
  readonly assets: readonly AssetSpec[];
  /** Üretimde kullanılan tohum; hata ayıklamada soruyu birebir yeniden kurar. */
  readonly seed: number;
}

export interface AudioToImageExercise extends ExerciseBase {
  readonly kind: 'AUDIO_TO_IMAGE';
  readonly options: readonly Option[];
  readonly validation: TekSecimValidation;
}

export interface TapCountExercise extends ExerciseBase {
  readonly kind: 'TAP_COUNT';
  /** `cevapSecimi:'sayac'` ise boş dizi. */
  readonly options: readonly Option[];
  readonly validation: SayimValidation;
}

export interface TapToPlaceExercise extends ExerciseBase {
  readonly kind: 'TAP_TO_PLACE';
  /** Yerleştirilecek parçalar. */
  readonly options: readonly Option[];
  readonly yuvalar: readonly Yuva[];
  readonly validation: YerlesimValidation;
}

export interface MatchPairsExercise extends ExerciseBase {
  readonly kind: 'MATCH_PAIRS';
  readonly options: readonly EslesmeKarti[];
  readonly validation: EslestirmeValidation;
}

export interface SequenceOrderExercise extends ExerciseBase {
  readonly kind: 'SEQUENCE_ORDER';
  readonly options: readonly Option[];
  readonly validation: SiralamaValidation;
}

export interface HotspotFindExercise extends ExerciseBase {
  readonly kind: 'HOTSPOT_FIND';
  readonly options: readonly HotspotOption[];
  readonly validation: HotspotValidation;
}

export interface NumberLineExercise extends ExerciseBase {
  readonly kind: 'NUMBER_LINE';
  /** Dokunulabilir işaretler; sürekli doğruda boş bırakılabilir. */
  readonly options: readonly Option[];
  readonly validation: SayiDogrusuValidation;
}

/** Uygulamadaki TÜM soru biçimleri. `kind` üzerinden ayrımlı birleşim. */
export type Exercise =
  | AudioToImageExercise
  | TapCountExercise
  | TapToPlaceExercise
  | MatchPairsExercise
  | SequenceOrderExercise
  | HotspotFindExercise
  | NumberLineExercise;

// ------------------------------------------------------------- jeneratör API

/** Jeneratöre verilen çağrı parametreleri. Şablonlar bunu genişletir. */
export interface GeneratorParams {
  readonly seed: number;
  readonly difficulty: Difficulty;
  /** Sahne teması — nesne seçimi kişiselleştirmede kullanılır. */
  readonly tercihEdilenSprite?: NesneSprite;
  /** Akıllı tahta mı kişisel cihaz mı — hedef boyutu ve şık sayısı değişir. */
  readonly mod?: 'tahta' | 'kisisel';
}

/** Saf üretim fonksiyonu. `Math.random` YASAK; tüm rastgelelik `rng`'den gelir. */
export type GenerateFn<P extends GeneratorParams = GeneratorParams> = (
  params: P,
  rng: Rng,
) => Exercise;

/**
 * Bir soru şablonu ve müfredat beyanı.
 *
 * Jeneratör KARŞILADIĞI KAZANIMLARI bildirmek zorundadır: planlayıcı, "bu
 * kazanım için elimde soru var mı" sorusunu bu alanlardan yanıtlar ve kapsam
 * denetimi (19 kazanımın kaçı gerçekten üretilebiliyor) otomatikleşir.
 */
export interface ExerciseGenerator<P extends GeneratorParams = GeneratorParams> {
  readonly templateId: TemplateId;
  readonly kind: InteractionKind;
  /** Karşıladığı resmî kazanımlar. Boş olamaz. */
  readonly karsilananKazanimlar: readonly KazanimKodu[];
  /** Karşıladığı beceri düğümleri. Boş olamaz. */
  readonly karsilananSkillIds: readonly SkillId[];
  readonly readingLoad: ReadingLoad;
  readonly zorlukAraligi: readonly [Difficulty, Difficulty];
  /** Bu şablonun ayırt edebildiği kavram yanılgıları. */
  readonly uretebildigiHatalar: readonly HataEtiketi[];
  readonly uret: GenerateFn<P>;
}

// ------------------------------------------------ ritmik sayma (MAT.1.1.5) kısıtı

/**
 * RİTMİK SAYMA — programın sınırları ASİMETRİKTİR ve kolayca gözden kaçar.
 *
 * Resmî metin (SAYFA 23): "100'e kadar (100 dâhil) ileriye doğru birer, beşer
 * ve onar; 20'ye kadar ileriye doğru ikişer ve 20'den geriye doğru birer ve
 * ikişer ritmik sayma etkinlikleri yapılır."
 *
 * "adım ∈ {1,2,5,10} × yön ∈ {ileri,geri}" biçiminde GENEL bir jeneratör
 * müfredat dışı soru üretir (ör. 100'e kadar ikişer, geriye onar). Bu yüzden
 * geçerli üçlüler burada TEK TEK sayılır ve tip düzeyinde kapatılır.
 */
export type RitmikSaymaBicimi =
  | { readonly yon: 'ileri'; readonly adim: 1 | 5 | 10; readonly ustSinir: 100 }
  | { readonly yon: 'ileri'; readonly adim: 2; readonly ustSinir: 20 }
  | { readonly yon: 'geri'; readonly adim: 1 | 2; readonly baslangic: 20 };

/** Programın izin verdiği ritmik sayma biçimlerinin TAM listesi. */
export const RITMIK_SAYMA_BICIMLERI: readonly RitmikSaymaBicimi[] = [
  { yon: 'ileri', adim: 1, ustSinir: 100 },
  { yon: 'ileri', adim: 5, ustSinir: 100 },
  { yon: 'ileri', adim: 10, ustSinir: 100 },
  { yon: 'ileri', adim: 2, ustSinir: 20 },
  { yon: 'geri', adim: 1, baslangic: 20 },
  { yon: 'geri', adim: 2, baslangic: 20 },
];

/** Nesne sayma ve işlem tavanı. Ritmik sayma HARİÇ her şey 20'yi aşamaz. */
export const ISLEM_ARALIGI = { min: 0, max: 20 } as const;
/** Ritmik saymanın tavanı (yalnız ileri 1/5/10 için). */
export const RITMIK_UST_SINIR = 100 as const;

/**
 * Bir (yön, adım, sınır) üçlüsünün müfredata uygunluğunu çalışma anında
 * doğrular. Tip düzeyi kaçaklarına (JSON'dan gelen veri) karşı ikinci hat.
 */
export function ritmikSaymaGecerliMi(
  yon: 'ileri' | 'geri',
  adim: number,
  sinir: number,
): boolean {
  if (yon === 'ileri') {
    if (adim === 1 || adim === 5 || adim === 10) return sinir >= 0 && sinir <= 100;
    if (adim === 2) return sinir >= 0 && sinir <= 20;
    return false;
  }
  // Geriye sayma YALNIZCA birer ve ikişer, YALNIZCA 20'den başlayarak.
  return (adim === 1 || adim === 2) && sinir <= 20;
}

// ------------------------------------------------------------- yardımcı denetim

/**
 * Bir alıştırmanın ürün kısıtlarını ihlal edip etmediğini söyler.
 * Testlerde ve geliştirme modunda her üretilen soru bundan geçirilir; üretimde
 * çağrılmaz (deterministik jeneratörler zaten geçerli üretmeli).
 *
 * Dönen dizi BOŞ ise sorun yok. Dolu ise her eleman Türkçe bir ihlal açıklaması.
 */
export function alistirmaIhlalleri(ex: Exercise): string[] {
  const ihlaller: string[] = [];

  if (ex.readingLoad > 0 && ex.prompt.metin == null) {
    ihlaller.push('readingLoad > 0 ama prompt.metin yok — okuma yükü gerekçesiz.');
  }
  if (ex.readingLoad === 0 && ex.prompt.metin != null) {
    ihlaller.push('readingLoad 0 ama prompt.metin dolu — çocuk okuyamaz.');
  }
  if (ex.kazanimKodlari.length === 0) {
    ihlaller.push('kazanimKodlari boş — soru müfredata bağlanmamış.');
  }
  if (ex.skillIds.length === 0) {
    ihlaller.push('skillIds boş — soru öğrenme haritasına bağlanmamış.');
  }
  if (ex.hints.length !== 3) {
    ihlaller.push('Yardım kademesi sayısı 3 değil.');
  }
  if (ex.hints[2]?.cevabiGoster !== true) {
    ihlaller.push('K3 yardımı cevabı göstermiyor — "birlikte yapalım" kademesi eksik.');
  }

  const idler = new Set<string>();
  for (const o of ex.options) {
    if (idler.has(o.id)) ihlaller.push(`Yinelenen şık id: ${o.id}`);
    idler.add(o.id);
    if (o.correct !== true && o.diagnosticTag == null) {
      ihlaller.push(`Yanlış şıkta tanı etiketi yok: ${o.id} (ürün kısıtı #4).`);
    }
    if (o.deger.tur === 'metin' && ex.readingLoad === 0) {
      ihlaller.push(`Metinli şık readingLoad 0 alıştırmada: ${o.id}`);
    }
    if (o.deger.tur === 'sayi' && !Number.isInteger(o.deger.sayi)) {
      ihlaller.push(`Tam sayı olmayan şık değeri: ${o.id}`);
    }
  }

  return ihlaller;
}
