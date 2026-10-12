import type { DeviceProfile } from './tokens';

/** "Ekran boyutu" seçenekleri (plan v2 Adım 27); `null` = otomatik tespit. */
export const EKRAN_BOYUTU_SECENEKLERI: readonly { readonly deger: DeviceProfile | null; readonly etiket: string }[] = [
  { deger: null, etiket: 'Otomatik (önerilen)' },
  { deger: 'board', etiket: 'Akıllı tahta' },
  { deger: 'tablet', etiket: 'Tablet' },
  { deger: 'phone', etiket: 'Telefon' },
];
