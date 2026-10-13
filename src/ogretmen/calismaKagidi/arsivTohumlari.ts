/**
 * Çalışma kâğıdı arşivinin sabit tohumları (plan v2 Adım 48, KG-69). Arşiv adresleri bu tohumlara bağlıdır
 * (`kagitlar/<kazanım>/<düğüm kodu>-<tohum>.pdf`): değiştirmek yayındaki bağlantıları kırar. Yalnız eklenir.
 */
export const ARSIV_TOHUMLARI = [101, 202, 303] as const;
export type ArsivTohumu = (typeof ARSIV_TOHUMLARI)[number];
