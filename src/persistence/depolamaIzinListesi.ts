/**
 * `localStorage` İZİN LİSTESİ (plan v2 Adım 24, K9).
 * `localStorage.setItem` yalnız buradaki anahtarlarla çağrılabilir; `npm run gizlilik:tara`
 * başka her kullanımı CI'da kırar. Öğrenci verisi buraya GİRMEZ: tek anahtar cihaz
 * profili tercihidir (tahta/tablet/telefon), kişiye ait değildir. Adım 26 genişletebilir.
 */
export const CIHAZ_PROFILI_ANAHTARI = 'okulumsun.deviceOverride';

export const IZINLI_LOCALSTORAGE_ANAHTARLARI: readonly string[] = [CIHAZ_PROFILI_ANAHTARI];
