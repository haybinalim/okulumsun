import type { HataEtiketi } from './distractors';
import type { Exercise } from './types';

/**
 * Yanlış seçimin, çocuğa gösterilecek K2 desteğine dönüştürülmüş açıklaması.
 *
 * Bu karar katmanı SAFTIR: ekrana, sese veya kalıcılığa dokunmaz. Böylece
 * yanlış–destek bağı birim testinde doğrulanabilir ve tablet pilotundan sonra
 * davranış değişikliği tek noktadan geri alınabilir.
 */
export interface HataDestekKarari {
  /** Seçilen yanlış şıktan gelen tanı etiketi. */
  readonly hataEtiketi: HataEtiketi;
  /** Pilot sözleşmesi varsa hedef beceri; eski şablonlarda bilinçli olarak null. */
  readonly hedefBeceri: string | null;
  /** K2: yöntemi söyler, cevabı söylemez. */
  readonly destek: Exercise['hints'][1];
  /** K2'de soluklaşacak, en az bilgi taşıyan seçenekler. */
  readonly solukOptionIds: readonly string[];
}

/**
 * Tek seçimli veya seçenek barındıran bir alıştırmada yanlış seçime ait desteği
 * verir. Doğru seçim, tanısız seçim ya da sözleşmenin kapsamadığı bir hata için
 * `null` döner; böylece arayüz hiç tahmin yapmaz ve yanlış pedagojik yönlendirme
 * üretmez.
 */
export function hataDestekKarari(exercise: Exercise, optionId: string): HataDestekKarari | null {
  const option = exercise.options.find((aday) => aday.id === optionId);
  if (option == null || option.correct === true || option.diagnosticTag == null) return null;

  const hataEtiketi = option.diagnosticTag;
  const sozlesme = exercise.ogretimselSozlesme;
  if (sozlesme != null && !sozlesme.hataDestekEtiketleri.includes(hataEtiketi)) {
    return null;
  }

  const destek = exercise.hints[1];
  return {
    hataEtiketi,
    hedefBeceri: sozlesme?.hedefBeceri ?? null,
    destek,
    solukOptionIds: destek.eleOptionIds ?? [],
  };
}
