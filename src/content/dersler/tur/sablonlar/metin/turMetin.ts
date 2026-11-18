/**
 * METİN PARÇASI GİRİŞİ (Okuma Yazma Adım 80). Ayrı tembel JS parçası (`turMetin-*.js`): T-13 "Metni oku, soruyu
 * cevapla" üreticisi ve metin havuzu ayrıştırıcısı. Yalnız `../metinKayit.ts`'teki `import()` ile yüklenir; Türkçe temel
 * parçaya girmez (`npm run boyut:ders`: her ek parça ≤ 40 KB).
 */
import { uretT13 } from './t13Anlama';
import type { TurMetinSablonKodu, TurSoru, TurUretimGirdisi } from '../turSoru';

export { metinHavuzunuAyristir, okunabilirMetinler } from './metinHavuzu';

export const TUR_METIN_URETICILERI: Readonly<Record<TurMetinSablonKodu, (g: TurUretimGirdisi) => TurSoru>> = {
  'T-13': uretT13,
};
