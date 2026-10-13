import type { HataEtiketi } from '../exercises/distractors';
import type { MaddeSonuc, YardimKademesi } from './itemLifecycle';

/**
 * Bir yanlış denemede alt ekranın bildirdiği bilgi (plan v2 Adım 40 aşama 3): seçilen yanlış
 * şıkkın tanısı (varsa) ve o denemede çocuğa gösterilen en yüksek yardım kademesi. Yalnız bellekte.
 */
export interface YanlisBilgisi {
  readonly tani: HataEtiketi | null;
  readonly yardimKademesi: YardimKademesi;
}

/** Tanısı ve yardımı olmayan yanlış (ör. sıralama/eşleştirme ekranları). */
export const BILGISIZ_YANLIS: YanlisBilgisi = { tani: null, yardimKademesi: 0 };

/**
 * Madde boyunca biriken yanlış bilgisi: kademe en yüksek olanı, tanı İLK tanılı yanlışınki
 * (ilk hata en çok bilgi taşır; sonrakiler K2 desteğinden etkilenir).
 */
export function yanlisBilgisiBirlestir(onceki: YanlisBilgisi | null, yeni: YanlisBilgisi): YanlisBilgisi {
  if (onceki === null) return yeni;
  return {
    tani: onceki.tani ?? yeni.tani,
    yardimKademesi: Math.max(onceki.yardimKademesi, yeni.yardimKademesi) as YardimKademesi,
  };
}

/**
 * Alt ekranlar yalnız "doğru mu" bildirdiğinde ExerciseScreen'in ürettiği sonuç
 * (plan v2 Adım 36 aşama 2a). Adım 40 aşama 3'ten beri yanlış denemelerin biriken tanısı ve
 * yardım kademesi de taşınır; yanlış olmadıysa 0/null.
 */
export function basitMaddeSonucu(
  dogru: boolean,
  baslangicMs: number,
  simdiMs: number,
  yanlis: YanlisBilgisi | null = null,
): MaddeSonuc {
  return {
    dogru,
    kullanilanYardimKademesi: yanlis?.yardimKademesi ?? 0,
    latencyMs: Math.max(0, simdiMs - baslangicMs),
    tani: yanlis?.tani ?? null,
    zamanMs: simdiMs,
  };
}
