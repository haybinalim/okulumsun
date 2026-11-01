/**
 * TÜRKÇE ŞABLON DALGASI 1 (görselsiz; Okuma Yazma planı Adım 69): T-02, T-03 (69a); T-04…T-07 sonraki aşamalarda. SAF kayıt.
 *
 * Her şablon (havuz, öğretilen küme, zorluk, tohum) → soru üretir; aynı girdi aynı soruyu ve `itemId`'yi verir.
 * Kural denetimi (D-11, D-12, D-23 ve küme) `denetim.ts` ve CI doğrulayıcısı (`dogrulayici.ts`) ile yapılır.
 */
import { uretT02 } from './t02SesinHarfi';
import { uretT03 } from './t03HarfiAyirt';
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
  'T-02': { kod: 'T-02', ad: 'Sesin harfini bul', meb: 'T.D.1.2.a', etkilesim: 'secim', uret: uretT02 },
  'T-03': { kod: 'T-03', ad: 'Harfi ayırt et', meb: 'KB2.7', etkilesim: 'secim', uret: uretT03 },
};

export function turSoruUret(sablon: TurSablonKodu, g: TurUretimGirdisi): TurSoru {
  return TUR_SABLONLARI[sablon].uret(g);
}

export * from './turSoru';
