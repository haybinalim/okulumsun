/**
 * E2E KANCASI (plan v2 Adım 26, KG-38).
 *
 * Uçtan uca testlerin tam bir oturumu (8 soru → oturum sonu → Bahçem) her
 * etkileşim türünün çözümünü taklit etmeden yürütebilmesi için, o anki
 * alıştırmayı "doğru cevaplandı" diye bitiren dar bir kapı açar. Ayrıca
 * ağdan veya service worker önbelleğinden başarıyla alınan ses kliplerini sayar
 * (çevrimdışı kanıtı; Playwright Chromium AAC çözemediği için çalma değil alım
 * ölçülür).
 *
 * YALNIZ geliştirme sunucusunda veya `VITE_E2E_KANCASI=1` ile yapılan test
 * derlemesinde etkindir. Üretim derlemesinde `E2E_KANCASI_ACIK` derleme anında
 * `false` olur ve kod ağaçtan atılır; CI `dist/` içinde `__okulumsunE2E`
 * dizgesinin bulunmadığını denetler. Hiçbir öğrenci verisi taşımaz.
 */
import { useEffect, useRef } from 'react';
import type { Exercise } from '../exercises/types';

// `import.meta.env` Vite dışında (tsx ile koşan scripts/) tanımsızdır.
export const E2E_KANCASI_ACIK: boolean =
  typeof import.meta.env !== 'undefined' && (import.meta.env.DEV || import.meta.env.VITE_E2E_KANCASI === '1');

export interface E2eKancasi {
  /** Ekrandaki alıştırma (yalnız kimlik ve tür). */
  alistirma: { readonly sira: number; readonly itemId: string; readonly kind: Exercise['kind'] } | null;
  /** Bağlanan alıştırma ekranı sayısı (aynı madde tekrar sorulsa da artar). */
  sayac: number;
  /** Ekrandaki alıştırmayı doğru cevaplanmış gibi bitirir. */
  dogruCevapla: () => boolean;
  /** Ekrandaki alıştırmaya bir yanlış deneme bildirir (Adım 36 Sınıf Turu); madde açık kalır. */
  yanlisCevapla: () => boolean;
  /** Başarıyla alınan ses klipleri (anahtar), sırayla. */
  readonly alinanKlipler: string[];
}

declare global {
  interface Window {
    __okulumsunE2E?: E2eKancasi;
  }
}

function kanca(): E2eKancasi {
  window.__okulumsunE2E ??= { alistirma: null, sayac: 0, dogruCevapla: () => false, yanlisCevapla: () => false, alinanKlipler: [] };
  return window.__okulumsunE2E;
}

/** Alıştırma ekranı bağlanınca çağrılır; kanca kapalıyken hiçbir şey yapmaz. */
export function useE2eAlistirma(
  exercise: Exercise,
  onDone: (dogruMu: boolean) => void,
  onYanlis?: () => void,
): void {
  // onDone her render'da yeni olabilir (tahta modu); alıştırma değişmedikçe kanca yeniden kurulmaz.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onYanlisRef = useRef(onYanlis);
  onYanlisRef.current = onYanlis;
  useEffect(() => {
    if (!E2E_KANCASI_ACIK) return;
    const k = kanca();
    let bitti = false;
    k.sayac += 1;
    const sira = k.sayac;
    k.alistirma = { sira, itemId: exercise.itemId, kind: exercise.kind };
    k.dogruCevapla = () => {
      if (bitti) return false;
      bitti = true;
      onDoneRef.current(true);
      return true;
    };
    k.yanlisCevapla = () => {
      if (bitti || !onYanlisRef.current) return false;
      onYanlisRef.current();
      return true;
    };
    return () => {
      bitti = true;
      if (k.alistirma?.sira === sira) {
        k.alistirma = null;
        k.dogruCevapla = () => false;
        k.yanlisCevapla = () => false;
      }
    };
  }, [exercise]);
}

/** speech.ts bir klibi başarıyla aldığında çağırır. */
export function e2eKlipAlindi(anahtar: string): void {
  if (!E2E_KANCASI_ACIK) return;
  kanca().alinanKlipler.push(anahtar);
}
