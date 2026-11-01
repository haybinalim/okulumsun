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

export const TUR_SABLON_KODLARI = ['T-02', 'T-03'] as const;
export type TurSablonKodu = (typeof TUR_SABLON_KODLARI)[number];

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

/** Sessiz kart: harf, hece ya da (T-03'te) rakam simgesi. */
export interface TurKart {
  readonly id: string;
  readonly metin: string;
  readonly tur: 'harf' | 'hece' | 'simge';
  /** Karıştırılan çift çeldiricisi (D-23); yalnız yanlış kartta. */
  readonly diagnosticTag?: TurTaniEtiketi;
}

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
    | { readonly tur: 'yok' };
  /** Doğru cevaptan SONRA okunacak klipler (bütün sözcük ya da hece; D-11). */
  readonly geriBildirim: readonly TurKlipKimligi[];
  /** Doğru cevapta bütünüyle vurgulanan metin (harfler ayrı ayrı vurgulanmaz). */
  readonly hedefMetin: string;
  /** Soruda geçen sözcükler (doğrulayıcı ve klip manifesti için). */
  readonly sozcukler: readonly string[];
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
}

export type TurSoru = TurSecimSorusu | TurYerlestirSorusu;

/** Sözcük havuzu öğesi (çalışma anında `ders-verisi/tur/icerik/sozcukler.json`'dan). */
export interface TurHavuzSozcugu {
  readonly id: string;
  readonly metin: string;
  readonly girisHarfi: string;
  readonly gorselId?: string;
}

export interface TurUretimGirdisi {
  readonly havuz: readonly TurHavuzSozcugu[];
  /** Öğretmenin seçtiği öğretilen glif kümesi (öğrenci verisi değil). */
  readonly kume: ReadonlySet<string>;
  readonly zorluk: TurZorluk;
  readonly tohum: number;
}

/** Bu kümeyle şablon kurulamıyorsa (yeterli harf/sözcük yok) fırlatılır; arayüz öğretmene açıklar. */
export class TurUretimHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = 'TurUretimHatasi';
  }
}
