/**
 * YARDIM ZAMANLAYICISI — plan §7.2 "15/30/30 sn" kuralı.
 *
 * React hook'u. Hareketsizlik sayar ve yardım kademelerini tetikler:
 *   15 sn → K1 (yeniden yönlendirme)
 *   +30 sn → K2 (eleme + strateji)
 *   +30 sn → K3 (birlikte yapalım — cevabı göster)
 *
 * Sayaçlar şunlarda SIFIRLANIR (plan §7.2 "Zamanlayıcı kuralları"):
 *  · Her dokunuşta (seçenek, onayla, tekrar dinle)
 *  · Ekran değişiminde (yeni soru)
 *  · deneme2'ye geçişte
 *  · Yardım kademesi ilerlediğinde (bir sonraki kademenin sayacı başlar)
 *
 * Kademeler GERİ GİTMEZ (K2'den K1'e dönülmez).
 *
 * SAF DEĞİL: `useEffect`, `setTimeout`, `Date.now` kullanır — zamanlayıcı
 * doğası gereği yan etkilidir. Testler için `useHelpTimer` mock'lanabilir veya
 * `itemLifecycle.ts`'teki saf makine doğrudan test edilir.
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  K1_GECIKME_MS,
  K2_GECIKME_MS,
  K3_GECIKME_MS,
  type YardimKademesi,
} from '../progress/itemLifecycle';

export interface UseHelpTimerParams {
  /** Mevcut yardım kademesi (0-3). */
  kademe: YardimKademesi;
  /** Madde aktif mi? (kapandıysa zamanlayıcı durur). */
  aktif: boolean;
  /** K1 tetiklendiğinde. */
  onK1: () => void;
  /** K2 tetiklendiğinde. */
  onK2: () => void;
  /** K3 tetiklendiğinde. */
  onK3: () => void;
}

/**
 * Hareketsizlik zamanlayıcısı.
 *
 * `resetKey` değiştiğinde sayaç sıfırlanır (yeni soru, deneme2'ye geçiş).
 * `onInteraction` her dokunuşta çağrılır — sayaç manuel sıfırlar.
 */
export function useHelpTimer({
  kademe,
  aktif,
  onK1,
  onK2,
  onK3,
}: UseHelpTimerParams): { reset: () => void } {
  const sonEtkilesimRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // En son callback'leri ref'te tut — useEffect yeniden çalışmasın.
  const cbRef = useRef({ onK1, onK2, onK3 });
  cbRef.current = { onK1, onK2, onK3 };

  const reset = useCallback(() => {
    sonEtkilesimRef.current = Date.now();
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!aktif) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Hangi gecikme sıradaki?
    let gecikme: number;
    let hedefKademe: 1 | 2 | 3;

    if (kademe === 0) {
      gecikme = K1_GECIKME_MS;
      hedefKademe = 1;
    } else if (kademe === 1) {
      gecikme = K2_GECIKME_MS;
      hedefKademe = 2;
    } else if (kademe === 2) {
      gecikme = K3_GECIKME_MS;
      hedefKademe = 3;
    } else {
      // K3'te zamanlayıcı durur — daha fazla yardım yok.
      return;
    }

    timerRef.current = setTimeout(() => {
      if (hedefKademe === 1) cbRef.current.onK1();
      else if (hedefKademe === 2) cbRef.current.onK2();
      else cbRef.current.onK3();
    }, gecikme);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [kademe, aktif]);

  return { reset };
}
