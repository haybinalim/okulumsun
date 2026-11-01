/**
 * DEPOLAMA İZİN LİSTESİ (plan v2 Adım 24 K9 statik, Adım 26 dinamik kanıt).
 * `localStorage.setItem` yalnız buradaki anahtarlarla çağrılabilir; `npm run gizlilik:tara`
 * başka her kullanımı CI'da kırar, `onizleme-gizlilik-ag.spec.ts` gerçek akış sonunda
 * tarayıcıdaki anahtarları bu listeyle karşılaştırır. Öğrenci verisi buraya GİRMEZ: tek
 * anahtar cihaz profili tercihidir (tahta/tablet/telefon), kişiye ait değildir.
 */
export const CIHAZ_PROFILI_ANAHTARI = 'okulumsun.deviceOverride';

export interface IzinliAnahtar {
  readonly alan: 'localStorage';
  readonly anahtar: string;
  readonly gerekce: string;
  readonly adr: string;
}

export const IZINLI_ANAHTARLAR: readonly IzinliAnahtar[] = [
  { alan: 'localStorage', anahtar: CIHAZ_PROFILI_ANAHTARI, gerekce: 'cihaz profili ayarı (PLAN §3.1)', adr: '0002' },
];

/**
 * Okuma Yazma (YALNIZ `VITE_DERS_TUR=1` derlemesi) sınıf düzeyi ayarı — K-7, ADR-0002 Ek 1. Öğrenci verisi değildir:
 * öğretmenin seçtiği öğretilen harf kümesi kodu ve günün akışı sırası. Üretim derlemesinde bu kodu yazan modül yoktur;
 * bu yüzden üretim listesine (`IZINLI_ANAHTARLAR`, gizlilik sayfası) girmez, ayrı listededir.
 */
export const DERS_TUR_SINIF_ANAHTARI = 'okulumsun.tur.sinif';

export const BAYRAKLI_IZINLI_ANAHTARLAR: readonly (IzinliAnahtar & { readonly bayrak: 'VITE_DERS_TUR' })[] = [
  {
    alan: 'localStorage',
    anahtar: DERS_TUR_SINIF_ANAHTARI,
    gerekce: 'Okuma Yazma sınıf düzeyi ayarı: öğretilen harfler ve günün akışı sırası (K-7; öğrenci verisi değil)',
    adr: '0002',
    bayrak: 'VITE_DERS_TUR',
  },
];

export const IZINLI_LOCALSTORAGE_ANAHTARLARI: readonly string[] = IZINLI_ANAHTARLAR.filter(
  (a) => a.alan === 'localStorage',
).map((a) => a.anahtar);

export function izinliMi(alan: string, anahtar: string): boolean {
  return IZINLI_ANAHTARLAR.some((a) => a.alan === alan && a.anahtar === anahtar);
}
