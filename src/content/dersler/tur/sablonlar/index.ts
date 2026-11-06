/**
 * TÜRKÇE ŞABLONLARI (Okuma Yazma planı Adım 69–70). SAF kayıt.
 *   Dalga 1, görselsiz (Adım 69): T-02, T-03 (69a), T-04, T-05 (69b), T-06, T-07 (69c).
 *   Dalga 2, görselli (Adım 70): T-01 Sesi duy resmi seç, T-08 Sözcüğü oku resmini bul (seçenekler sözcük görselleri).
 *   Çeşitlilik (Adım 79, kullanıcı isteği 2026-11-06): T-09 Harfi parçalardan kur, T-16 Hatalı sözcüğü bul,
 *   T-17 Hece say, T-18 Sesin yeri, T-19 Aynı sesle eşleştir, T-20 Harf avı.
 *   Cümle ve noktalama (Adım 74): T-10 Cümleyi oku resmini bul, T-11 Noktalama işaretini seç, T-12 Büyük harf yerinde mi — üreticileri ayrı tembel
 *   parçada (`cumle/turCumle.ts`, KG-156); kayıt eşzamanlı, parça yüklenmeden çağrılırsa `TurUretimHatasi`.
 *
 * Her şablon (havuz, öğretilen küme, zorluk, tohum) → soru üretir; aynı girdi aynı soruyu ve `itemId`'yi verir.
 * Kural denetimi (D-11, D-12, D-23 ve küme) `denetim.ts` ve CI doğrulayıcısı (`dogrulayici.ts`) ile yapılır.
 */
import { uretT01 } from './t01SesiDuy';
import { uretT02 } from './t02SesinHarfi';
import { uretT03 } from './t03HarfiAyirt';
import { uretT04 } from './t04HeceKur';
import { uretT05 } from './t05HeceBirlestir';
import { uretT06 } from './t06EksikHarf';
import { uretT07 } from './t07Dikte';
import { uretT08 } from './t08SozcuguOku';
import { uretT09 } from './t09HarfParcalari';
import { uretT16 } from './t16HataliSozcuk';
import { uretT17 } from './t17HeceSay';
import { uretT18 } from './t18SesinYeri';
import { uretT19 } from './t19AyniSesEslestir';
import { uretT20 } from './t20HarfAvi';
import { cumleUreticisi } from './cumleKayit';
import type { TurSablonKodu, TurSoru, TurUretimGirdisi } from './turSoru';

/** Etkinlik kataloğundaki beceri kümesi (öğretmen ekranı). */
export type TurBeceri = 'ses' | 'harf' | 'hece' | 'sozcuk' | 'cumle' | 'yazma';
export const TUR_BECERILERI: readonly { readonly kod: TurBeceri; readonly ad: string }[] = [
  { kod: 'ses', ad: 'Ses farkındalığı' },
  { kod: 'harf', ad: 'Harf' },
  { kod: 'hece', ad: 'Hece' },
  { kod: 'sozcuk', ad: 'Sözcük' },
  { kod: 'cumle', ad: 'Cümle' },
  { kod: 'yazma', ad: 'Yazma' },
];

export interface TurSablonTanimi {
  readonly kod: TurSablonKodu;
  /** Öğretmen ekranındaki ad. */
  readonly ad: string;
  readonly meb: string;
  readonly beceri: TurBeceri;
  readonly etkilesim: 'secim' | 'yerlestir' | 'eslestir' | 'coklu';
  readonly uret: (g: TurUretimGirdisi) => TurSoru;
}

export const TUR_SABLONLARI: Readonly<Record<TurSablonKodu, TurSablonTanimi>> = {
  'T-01': { kod: 'T-01', ad: 'Sesi duy, resmi seç', meb: 'T.D.1.1.a', beceri: 'ses', etkilesim: 'secim', uret: uretT01 },
  'T-02': { kod: 'T-02', ad: 'Sesin harfini bul', meb: 'T.D.1.2.a', beceri: 'harf', etkilesim: 'secim', uret: uretT02 },
  'T-03': { kod: 'T-03', ad: 'Harfi ayırt et', meb: 'KB2.7', beceri: 'harf', etkilesim: 'secim', uret: uretT03 },
  'T-04': { kod: 'T-04', ad: 'Hece kur', meb: 'T.O.1.1.a', beceri: 'hece', etkilesim: 'yerlestir', uret: uretT04 },
  'T-05': { kod: 'T-05', ad: 'Heceleri birleştir', meb: 'T.O.1.1.b', beceri: 'hece', etkilesim: 'yerlestir', uret: uretT05 },
  'T-06': { kod: 'T-06', ad: 'Eksik harfi tamamla', meb: 'T.Y.1.2.b', beceri: 'sozcuk', etkilesim: 'yerlestir', uret: uretT06 },
  'T-07': { kod: 'T-07', ad: 'Dikte', meb: 'T.Y.1.1.e', beceri: 'yazma', etkilesim: 'yerlestir', uret: uretT07 },
  'T-08': { kod: 'T-08', ad: 'Sözcüğü oku, resmini bul', meb: 'T.O.1.1.b', beceri: 'sozcuk', etkilesim: 'secim', uret: uretT08 },
  'T-09': { kod: 'T-09', ad: 'Harfi parçalardan kur', meb: 'T.Y.1.3.b', beceri: 'yazma', etkilesim: 'yerlestir', uret: uretT09 },
  'T-10': { kod: 'T-10', ad: 'Cümleyi oku, resmini bul', meb: 'T.O.1.1.c', beceri: 'cumle', etkilesim: 'secim', uret: cumleUreticisi('T-10') },
  'T-11': { kod: 'T-11', ad: 'Noktalama işaretini seç', meb: 'T.Y.1.3.k', beceri: 'cumle', etkilesim: 'secim', uret: cumleUreticisi('T-11') },
  'T-12': { kod: 'T-12', ad: 'Büyük harf yerinde mi', meb: 'T.Y.1.3.d', beceri: 'cumle', etkilesim: 'secim', uret: cumleUreticisi('T-12') },
  'T-16': { kod: 'T-16', ad: 'Hatalı sözcüğü bul', meb: 'T.Y.1.4.a', beceri: 'sozcuk', etkilesim: 'secim', uret: uretT16 },
  'T-17': { kod: 'T-17', ad: 'Hece say', meb: 'T.D.1.2.d', beceri: 'hece', etkilesim: 'secim', uret: uretT17 },
  'T-18': { kod: 'T-18', ad: 'Sesin yeri', meb: 'T.D.1.1.a', beceri: 'ses', etkilesim: 'secim', uret: uretT18 },
  'T-19': { kod: 'T-19', ad: 'Aynı sesle eşleştir', meb: 'T.D.1.1.a', beceri: 'ses', etkilesim: 'eslestir', uret: uretT19 },
  'T-20': { kod: 'T-20', ad: 'Harf avı', meb: 'KB2.7', beceri: 'harf', etkilesim: 'coklu', uret: uretT20 },
};

export function turSoruUret(sablon: TurSablonKodu, g: TurUretimGirdisi): TurSoru {
  return TUR_SABLONLARI[sablon].uret(g);
}

export * from './turSoru';
