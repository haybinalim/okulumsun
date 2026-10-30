import { useSyncExternalStore } from 'react';

/**
 * Türkçe (Okuma Yazma) ekran durumu — YALNIZ `VITE_DERS_TUR=1` derlemesinde kullanılır (Adım 64, ADR-0016).
 *
 * Matematik akışının `appStore`'una dokunmaz: Türkçe ekranı açıkken `App.tsx` onu ortak kabukla (`kabuk()`) çizer;
 * kapanınca uygulama kaldığı ekrana döner. Durum yalnız bellekte, hiçbir yere yazılmaz (öğrenci verisi yok).
 * Modülün üst düzeyinde yan etki yoktur: bayraksız üretim derlemesinde `App.tsx`'teki kullanım ölü kod olarak
 * atılınca bu modül de pakete girmez (üretim JS bayt bayt aynı; CI imleç denetimi).
 */

export type TurEkrani =
  | { readonly ekran: 'giris' }
  | { readonly ekran: 'yazilisSecimi'; readonly sekme?: number }
  | { readonly ekran: 'yazilis'; readonly anahtar: string; readonly sekme: number }
  | { readonly ekran: 'kagitlar' };

/** `undefined`: henüz okunmadı — ilk okumada açılış adresinden (`?ders=tur`) alınır. */
let durum: TurEkrani | null | undefined;
let dinleyiciler: Set<() => void> | null = null;

function bildir(): void {
  for (const d of dinleyiciler ?? []) d();
}

export function turEkraniAc(e: TurEkrani): void {
  durum = e;
  bildir();
}

export function turEkraniKapat(): void {
  durum = null;
  bildir();
}

export function turEkraniOku(): TurEkrani | null {
  if (durum === undefined) durum = typeof location === 'undefined' ? null : turAcilisEkrani(location.search);
  return durum;
}

export function turEkraniAbone(d: () => void): () => void {
  (dinleyiciler ??= new Set()).add(d);
  return () => dinleyiciler?.delete(d);
}

export function useTurEkrani(): TurEkrani | null {
  return useSyncExternalStore(turEkraniAbone, turEkraniOku, turEkraniOku);
}

/** Açılış adresi: `?ders=tur` Türkçe girişini açar (yalnız bayraklı derlemede okunur). */
export function turAcilisEkrani(arama: string): TurEkrani | null {
  return new URLSearchParams(arama).get('ders') === 'tur' ? { ekran: 'giris' } : null;
}
