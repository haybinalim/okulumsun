/**
 * MİGRASYON İSKELETİ — plan §10.
 *
 * `src/persistence/migrations/` — sürüm başına ayrı dosya.
 * Eski tipler DONDURULUR (`types/progressV1.ts`).
 *
 * Şu an v1 var, migrasyon yok. V2 geldiğinde:
 *  1. `migrations/v1toV2.ts` oluştur
 *  2. `db.ts`'e `this.version(2).stores({...}).upgrade(v1toV2)` ekle
 *  3. Eski tip `types/progressV1.ts`'e dondur
 *
 * Bu dosya, migrasyon zincirinin yapısını belgeler.
 */

// Şu an migrasyon yok — v1 tek sürüm.
// Gelecekteki migrasyonlar burada listelenecek.

export const MIGRASYON_ZINCIRI: readonly number[] = [1];

/** Mevcut şema sürümünden büyük yedek reddedilir (backup.ts). */
export const MEVCUT_SURUM = 1;
