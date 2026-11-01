/**
 * TÜRKÇE ŞABLONLARI (Okuma Yazma planı Adım 69–70). SAF kayıt.
 *   Dalga 1, görselsiz (Adım 69): T-02, T-03 (69a), T-04, T-05 (69b), T-06, T-07 (69c).
 *   Dalga 2, görselli (Adım 70): T-01 Sesi duy resmi seç, T-08 Sözcüğü oku resmini bul (seçenekler sözcük görselleri).
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
import type { TurSablonKodu, TurSoru, TurUretimGirdisi } from './turSoru';

export interface TurSablonTanimi {
  readonly kod: TurSablonKodu;
  /** Öğretmen ekranındaki ad. */
  readonly ad: string;
  readonly meb: string;
  readonly etkilesim: 'secim' | 'yerlestir';
  readonly uret: (g: TurUretimGirdisi) => TurSoru;
}

export const TUR_SABLONLARI: Readonly<Record<TurSablonKodu, TurSablonTanimi>> = {
  'T-01': { kod: 'T-01', ad: 'Sesi duy, resmi seç', meb: 'T.D.1.1.a', etkilesim: 'secim', uret: uretT01 },
  'T-02': { kod: 'T-02', ad: 'Sesin harfini bul', meb: 'T.D.1.2.a', etkilesim: 'secim', uret: uretT02 },
  'T-03': { kod: 'T-03', ad: 'Harfi ayırt et', meb: 'KB2.7', etkilesim: 'secim', uret: uretT03 },
  'T-04': { kod: 'T-04', ad: 'Hece kur', meb: 'T.O.1.1.a', etkilesim: 'yerlestir', uret: uretT04 },
  'T-05': { kod: 'T-05', ad: 'Heceleri birleştir', meb: 'T.O.1.1.b', etkilesim: 'yerlestir', uret: uretT05 },
  'T-06': { kod: 'T-06', ad: 'Eksik harfi tamamla', meb: 'T.Y.1.2.b', etkilesim: 'yerlestir', uret: uretT06 },
  'T-07': { kod: 'T-07', ad: 'Dikte', meb: 'T.Y.1.1.e', etkilesim: 'yerlestir', uret: uretT07 },
  'T-08': { kod: 'T-08', ad: 'Sözcüğü oku, resmini bul', meb: 'T.O.1.1.b', etkilesim: 'secim', uret: uretT08 },
};

export function turSoruUret(sablon: TurSablonKodu, g: TurUretimGirdisi): TurSoru {
  return TUR_SABLONLARI[sablon].uret(g);
}

export * from './turSoru';
