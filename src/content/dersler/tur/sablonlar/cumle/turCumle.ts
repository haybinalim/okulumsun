/**
 * CÜMLE PARÇASI GİRİŞİ (Okuma Yazma Adım 74; KG-156). Ayrı tembel JS parçası (`turCumle-*.js`): cümle şablonlarının
 * üreticileri (T-10 Cümleyi oku resmini bul, T-11 Noktalama işaretini seç, T-12 Büyük harf yerinde mi) ve cümle havuzu
 * ayrıştırıcısı. Yalnız `../cumleKayit.ts`'teki `import()` ile yüklenir; Türkçe temel parçaya girmez
 * (`npm run boyut:ders`: temel ≤ 120 KB, her ek parça ≤ 40 KB).
 */
import { uretT10 } from './t10CumleOku';
import { uretT11 } from './t11Noktalama';
import { uretT12 } from './t12BuyukHarf';
import type { TurCumleSablonKodu, TurSoru, TurUretimGirdisi } from '../turSoru';

export { cumleHavuzunuAyristir, okunabilirCumleler } from './cumleHavuzu';

export const TUR_CUMLE_URETICILERI: Readonly<Record<TurCumleSablonKodu, (g: TurUretimGirdisi) => TurSoru>> = {
  'T-10': uretT10,
  'T-11': uretT11,
  'T-12': uretT12,
};
