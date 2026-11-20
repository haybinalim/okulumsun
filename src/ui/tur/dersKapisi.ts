/**
 * DERS SEÇİM KAPISI — yalnız bellekte (Adım 83). Öğrenci verisi yazılmaz.
 *
 * `bekle`: henüz ders seçilmedi; uygulama ana ekrana gelince tam ekran "Ders seç" çıkar.
 * `sec`: Okuma Yazma'dan Ana menü veya girişte Geri ile kapı yeniden açıldı.
 * `mat`: Matematik seçildi; ana ekran çizilir.
 *
 * Bayraksız derlemede `App.tsx` bu modülü ölü kod olarak atar (üretim JS aynı kalır).
 */
import { useSyncExternalStore } from 'react';

export type DersKapisi = 'bekle' | 'sec' | 'mat';

let kapi: DersKapisi = 'bekle';
let dinleyiciler: Set<() => void> | null = null;

function bildir(): void {
  for (const d of dinleyiciler ?? []) d();
}

function yaz(sonraki: DersKapisi): void {
  if (kapi === sonraki) return;
  kapi = sonraki;
  bildir();
}

export function dersKapisiOku(): DersKapisi {
  return kapi;
}

/** Matematik: kapı kapanır, uygulama kaldığı matematik ekranına döner. */
export function matematikSec(): void {
  yaz('mat');
}

/** Tam ekran "Ders seç" yeniden açılsın (Ana menü, girişte Geri, ana ekrandaki "Ders seç"). */
export function dersSecimineDon(): void {
  yaz('sec');
}

/** Birim testleri arasında bellek durumu sıfırlanır. Uygulama bunu çağırmaz. */
export function dersKapisiSifirla(): void {
  yaz('bekle');
}

export function dersKapisiAbone(d: () => void): () => void {
  (dinleyiciler ??= new Set()).add(d);
  return () => dinleyiciler?.delete(d);
}

export function useDersKapisi(): DersKapisi {
  return useSyncExternalStore(dersKapisiAbone, dersKapisiOku, dersKapisiOku);
}

/**
 * Tam ekran kapı görünsün mü. Türkçe ekranı, ses kilidi ve eve link çalışması önde gelir.
 * `bekle` yalnız ana ekranda (mod ve renk seçiminden sonra) kapıyı açar.
 */
export function dersSecimiGorunsun(
  kapiDurumu: DersKapisi | null,
  ekran: string,
  turAcik: boolean,
  evCalismasi: boolean,
): boolean {
  if (kapiDurumu === null || turAcik || ekran === 'audioUnlock' || evCalismasi || kapiDurumu === 'mat') return false;
  if (kapiDurumu === 'sec') return true;
  return ekran === 'anaEkran';
}
