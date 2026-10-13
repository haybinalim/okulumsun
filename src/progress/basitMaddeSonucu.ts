import type { MaddeSonuc } from './itemLifecycle';

/**
 * Alt ekranlar yalnız "doğru mu" bildirdiğinde ExerciseScreen'in ürettiği sonuç
 * (plan v2 Adım 36 aşama 2a). Yardım kademesi ve tanı alt ekranlar bildirene kadar 0/null'dır.
 */
export function basitMaddeSonucu(dogru: boolean, baslangicMs: number, simdiMs: number): MaddeSonuc {
  return {
    dogru,
    kullanilanYardimKademesi: 0,
    latencyMs: Math.max(0, simdiMs - baslangicMs),
    tani: null,
    zamanMs: simdiMs,
  };
}
