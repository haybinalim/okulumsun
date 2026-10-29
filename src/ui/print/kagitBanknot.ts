/**
 * Kâğıttaki banknot ölçüsü (KG-122, KG-123). CSS pikseli (96 px = 25,4 mm). Seçenek kutusu 40 mm
 * (`kagitYerlesimi` GENIS_KUTU_MM.banknot); değiştirmek PDF sayfa sayısını etkileyebilir.
 *
 * KG-123: kupürler gerçek birbirine göre boyutlarında — en büyük kupür (200 TL) `KAGIT_BANKNOT_GENISLIK_PX`
 * (≈ 39,7 mm), diğerleri gerçek uzunluk oranıyla (5 TL ≈ 32,2 mm). Kutu ve sayfa yerleşimi değişmez.
 */
import type { BanknotDegeri } from '../../exercises/types';
import { banknotGoreliOlcek } from '../../content/paraGorseli';

/** En büyük kupürün (200 TL) kâğıttaki genişliği. */
export const KAGIT_BANKNOT_GENISLIK_PX = 150;
export const CSS_PX_MM = 25.4 / 96;

/** Kupürün kâğıttaki CSS piksel genişliği (gerçek uzunlukla orantılı). */
export function kagitBanknotGenislikPx(deger: BanknotDegeri): number {
  return KAGIT_BANKNOT_GENISLIK_PX * banknotGoreliOlcek(deger);
}
