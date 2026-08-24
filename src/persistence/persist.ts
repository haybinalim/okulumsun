/**
 * KALICILIK GARANTİSİ — plan §10.
 *
 * 1. navigator.storage.persist() — ilk oturum tamamlandığında çağrılır.
 * 2. iOS Safari 7 gün kuralı — ana ekrana eklenmiş PWA muaftır.
 * 3. navigator.storage.estimate() — veli panelinde gösterilir.
 */

import { OGRENCI_VERISI_SAKLANIR_MI } from './veriSaklamaPolitikasi';

// ---------------------------------------------------------------- persist

/**
 * Kalıcı depolama izni iste — plan §10.
 *
 * İlk oturum tamamlandığında çağrılır (ilk açılışta değil — tarayıcılar
 * "etkileşim görmüş" siteye izni daha yüksek oranla verir).
 *
 * @returns true = izin verildi, false = reddedildi, null = API yok
 */
export async function persistIste(): Promise<boolean | null> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return null;
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return null;
  }
  try {
    const sonuc = await navigator.storage.persist();
    return sonuc;
  } catch {
    return false;
  }
}

/**
 * Kalıcı depolama zaten verilmiş mi?
 */
export async function persistDurumu(): Promise<boolean | null> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return null;
  if (typeof navigator === 'undefined' || !navigator.storage?.persisted) {
    return null;
  }
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- estimate

/** Depolama tahmini — veli panelinde gösterilir. */
export interface DepolamaTahmini {
  kullanim: number; // byte
  kota: number; // byte
  yuzde: number; // 0..1
}

/**
 * navigator.storage.estimate() — veli panelinde tanılama.
 *
 * @returns null = API yok
 */
export async function depolamaTahmini(): Promise<DepolamaTahmini | null> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return null;
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return {
      kullanim: usage,
      kota: quota,
      yuzde: quota > 0 ? usage / quota : 0,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- PWA install

/**
 * PWA kurulu mu? (display-mode: standalone)
 */
export function pwaKuruluMu(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}
