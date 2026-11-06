/**
 * TÜRKÇE ETKİNLİK SORUSU SÖZLEŞMESİ (Okuma Yazma planı §2.4.6, Adım 69). SAF tipler + kimlik.
 *
 * Matematik `Exercise` tipinden bilerek ayrıdır (matematik ses anahtarları ve beceri kimlikleri; üretim paketi
 * değişmesin, ADR-0016). Kavramlar aynıdır: tohumdan deterministik `itemId`, dokun-seç (AUDIO_TO_IMAGE) ve
 * dokun-yerleştir (TAP_TO_PLACE), sürükleme yok, tanı etiketi yalnız yanlış şıkta.
 *
 * Ses kuralları tipe gömülüdür: kart (`TurKart`) hiçbir zaman ses taşımaz (D-11: harf ve hece kartı cevaptan önce
 * sessiz); soru sesi `soruKlipleri`, cevaptan sonra okunan `geriBildirim`. Okuma hedefli soruda (`uyaran.tur`
 * `yazi` ya da `yok`) `soruKlipleri` boştur ve ↻ yalnız yönergeyi çalar (D-12).
 */
import { hash32 } from '../../../../exercises/rng';
import type { TurTaniEtiketi } from './celdiriciler';
import type { TurKlipKimligi } from './klipler';
import type { TurHamleGlifi } from '../../../schema/turHamle';

export const TUR_SABLON_KODLARI = [
  'T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08', 'T-09', 'T-16', 'T-17', 'T-18',
  'T-19', 'T-20',
] as const; // prettier-ignore

/**
 * Cümle şablonları (Adım 74): üreticileri ayrı tembel parçada (`cumle/turCumle.ts`, KG-156); cümle havuzu ister
 * (`TurUretimGirdisi.cumleler`) ve 2. gruptan önce kurulmaz (D-08).
 */
export const TUR_CUMLE_SABLON_KODLARI = ['T-10', 'T-11'] as const;
export type TurCumleSablonKodu = (typeof TUR_CUMLE_SABLON_KODLARI)[number];
export type TurSablonKodu = (typeof TUR_SABLON_KODLARI)[number] | TurCumleSablonKodu;

/** Katalog sırasıyla bütün şablonlar (sözcük düzeyi + cümle). */
export const TUR_TUM_SABLON_KODLARI: readonly TurSablonKodu[] = [...TUR_SABLON_KODLARI, ...TUR_CUMLE_SABLON_KODLARI];

export type TurZorluk = 1 | 2 | 3 | 4 | 5;

/** Bir soruda en çok kart (tahta 1080×810'da en çok 8 harf kartı, plan §2.4.6; tablette 10 olabilirdi, tek sınır). */
export const TUR_EN_COK_KART = 8;
export const TUR_ZORLUKLARI: readonly TurZorluk[] = [1, 2, 3, 4, 5];

export type TurItemId = string & { readonly __marka: 'TurItemId' };

/**
 * itemId tohumdan ve öğretilen kümeden türer: aynı (şablon, zorluk, tohum, küme kodu) her cihazda aynı kimliği
 * verir. Küme kimliğe girer, çünkü aynı tohum farklı kümede farklı soru üretir.
 */
export function turItemId(sablon: TurSablonKodu, zorluk: TurZorluk, tohum: number, kumeKodu: string): TurItemId {
  return `tur.${sablon}#${hash32(`${sablon}|${zorluk}|${tohum}|${kumeKodu}`).toString(36)}` as TurItemId;
}

/**
 * Sessiz kart: harf, hece, (T-03'te) rakam simgesi ya da (T-01, T-08) resimli sözcüğün GÖRSELİ. Görsel kartta
 * `metin` resmin sözcüğüdür (denetim ve geri bildirim için); arayüz cevaptan önce onu ne yazar ne seslendirir.
 */
export interface TurKart {
  readonly id: string;
  /** Metin kartında gösterilen metin; `parca` kartında iç anahtar (glif + hamle sırası, ör. `a1`; gösterilmez). */
  readonly metin: string;
  /**
   * `sayi`: hece sayısı kartı (rakam + nokta; T-17); `konum`: sesin yeri kartı (başta/ortada/sonda; T-18);
   * `noktalama`: bitiş işareti kartı (. ? !; T-11); `cumle`: yazılı cümle kartı (T-12).
   */
  readonly tur: 'harf' | 'hece' | 'simge' | 'gorsel' | 'sozcuk' | 'parca' | 'sayi' | 'konum' | 'noktalama' | 'cumle';
  /** Yalnız görsel kartta: `ders-verisi/tur/gorseller/<gorselId>.svg` (D-25). */
  readonly gorselId?: string;
  /** Yalnız `parca` kartında (T-09): hamlenin glifi, glif genişliği ve orta çizgi noktaları (hamle verisi birimi). */
  readonly parca?: TurParca;
  /** Karıştırılan çift çeldiricisi (D-23); yalnız yanlış kartta. */
  readonly diagnosticTag?: TurTaniEtiketi;
}

export interface TurParca {
  readonly glif: string;
  readonly genislik: number;
  readonly noktalar: readonly (readonly [number, number])[];
}

/** Metni gösterilmeyen kart türleri (metin iç anahtardır; öğretilen küme denetimi metne bakmaz). */
export const METINSIZ_KARTLAR: ReadonlySet<TurKart['tur']> = new Set(['parca', 'konum', 'sayi']);

interface TurSoruTemeli {
  readonly itemId: TurItemId;
  readonly sablon: TurSablonKodu;
  readonly zorluk: TurZorluk;
  readonly tohum: number;
  /** Sorunun resmî sıradaki giriş harfi (bütün metinlerin öğretilmiş olduğu ilk harf). */
  readonly girisHarfi: string;
  readonly yonerge: TurKlipKimligi;
  /** Soru sesi (yönergeden sonra; ↻ ile yinelenir). Okuma hedefli soruda boş (D-12). */
  readonly soruKlipleri: readonly TurKlipKimligi[];
  /**
   * Üst alanda (dokunulmaz) ne gösterilir: `ses` = dinleme simgeleri; `yazi` = model metin (`metin`);
   * `bosluklu` = boşluklu sözcük (T-06; `once`/`sonra`); `yok` = yalnız yuvalar.
   */
  readonly uyaran:
    | { readonly tur: 'ses'; readonly adet: number }
    | { readonly tur: 'yazi'; readonly metin: string }
    | { readonly tur: 'bosluklu'; readonly once: string; readonly sonra: string }
    /**
     * Sözcük görseli (dokunulmaz): `metin` resmin altında yazılı sözcük (T-17 z1–2), `harf` yanında hedef harf (T-18).
     * Resmin adı ses dosyası ya da öğretmen tarafından söylenir (`soruKlipleri`, `dinlenen`).
     */
    | { readonly tur: 'resim'; readonly gorselId: string; readonly metin?: string; readonly harf?: string }
    /** T-09: model harf + parçaların yerleştiği çerçeve (glif genişliği, hamle verisi birimi). */
    | { readonly tur: 'parca'; readonly glif: string; readonly genislik: number }
    /** T-11: bitiş işaretsiz cümle + sonunda boş yuva (dokunulmaz); doğru cevaptan sonra cümle işaretiyle. */
    | { readonly tur: 'noktalama'; readonly metin: string }
    | { readonly tur: 'yok' };
  /** Doğru cevaptan SONRA okunacak klipler (bütün sözcük ya da hece; D-11). */
  readonly geriBildirim: readonly TurKlipKimligi[];
  /** Doğru cevapta bütünüyle vurgulanan metin (harfler ayrı ayrı vurgulanmaz). */
  readonly hedefMetin: string;
  /** Soruda geçen sözcükler (doğrulayıcı ve klip manifesti için). */
  readonly sozcukler: readonly string[];
  /**
   * Dinleme sorusunda duyulan sözcükler (soru klipleri), `sozcukler`dan ayrıysa. T-01'de yalnız model sözcükler
   * duyulur; seçenek resimlerinin adları değil. Ses dosyası yokken öğretmen bunları "Öğretmen: sözcükler"den okur.
   */
  readonly dinlenen?: readonly string[];
  readonly kartlar: readonly TurKart[];
}

/** Dokun-seç (AUDIO_TO_IMAGE): tek doğru kart. */
export interface TurSecimSorusu extends TurSoruTemeli {
  readonly kind: 'secim';
  readonly dogru: number;
}

/** Dokun-yerleştir (TAP_TO_PLACE): kartlar sırayla yuvalara; `dogruDizi[i]` i. yuvanın metni. */
export interface TurYerlestirSorusu extends TurSoruTemeli {
  readonly kind: 'yerlestir';
  readonly dogruDizi: readonly string[];
  /** Sıra önemsiz (T-09 z1–2: parçalar doğru, yazılış sırası henüz istenmez). */
  readonly sirasiz?: boolean;
}

/**
 * Dokun-eşleştir (T-19): kartlar iki sıradır, ilk yarı üst sıra, ikinci yarı alt sıra. Çocuk bir karta, sonra öbür
 * sıradaki eşine dokunur; `ciftler[i]` = [üst sıradaki kart, alt sıradaki kart]. Bütün çiftler bulununca doğru.
 */
export interface TurEslestirSorusu extends TurSoruTemeli {
  readonly kind: 'eslestir';
  readonly ciftler: readonly (readonly [number, number])[];
}

/** Çoklu seçim (T-20): hedefin hepsi işaretlenir, sonra Onayla; `dogrular` kart sırası, artan. */
export interface TurCokluSorusu extends TurSoruTemeli {
  readonly kind: 'coklu';
  readonly dogrular: readonly number[];
}

export type TurSoru = TurSecimSorusu | TurYerlestirSorusu | TurEslestirSorusu | TurCokluSorusu;

/** Sözcük havuzu öğesi (çalışma anında `ders-verisi/tur/icerik/sozcukler.json`'dan). */
export interface TurHavuzSozcugu {
  readonly id: string;
  readonly metin: string;
  readonly girisHarfi: string;
  readonly gorselId?: string;
}

/**
 * Cümle havuzu öğesi (Adım 74; çalışma anında `ders-verisi/tur/icerik/cumleler.json`'dan). Cümle en az 2. gruptadır
 * (D-08); büyük harf yalnız cümle başında ve `ozelAdlar`da (D-10); ünlem cümlesi 5. grupta (D-09).
 */
export interface TurHavuzCumlesi {
  readonly id: string;
  readonly metin: string;
  readonly girisHarfi: string;
  readonly grup: number;
  readonly tur: 'bildirme' | 'soru' | 'unlem';
  readonly noktalama: '.' | '?' | '!';
  readonly ozelAdlar: readonly string[];
  /** Hedef görsel (T-10); sözcüğü cümlede geçer. */
  readonly gorselId?: string;
}

export interface TurUretimGirdisi {
  readonly havuz: readonly TurHavuzSozcugu[];
  /** Öğretmenin seçtiği öğretilen glif kümesi (öğrenci verisi değil). */
  readonly kume: ReadonlySet<string>;
  readonly zorluk: TurZorluk;
  readonly tohum: number;
  /** Hamle verisi (`ders-verisi/tur/hamleler.json`); yalnız T-09 ister, yoksa T-09 kurulamaz. */
  readonly hamleler?: readonly TurHamleGlifi[];
  /** Cümle havuzu (`ders-verisi/tur/icerik/cumleler.json`); yalnız cümle şablonları (T-10, T-11, T-12) ister. */
  readonly cumleler?: readonly TurHavuzCumlesi[];
}

/** Bu kümeyle şablon kurulamıyorsa (yeterli harf/sözcük yok) fırlatılır; arayüz öğretmene açıklar. */
export class TurUretimHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = 'TurUretimHatasi';
  }
}
