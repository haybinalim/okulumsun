/** Seçenek kartındaki banknot ölçüsü (KG-122, KG-123). */
import type { BanknotDegeri } from "../../exercises/types";
import { banknotGoreliOlcek } from "../../content/paraGorseli";

/** En büyük kupürün (200 TL) kartın iç genişliğindeki payı, yüzde (KG-122). */
export const KART_BANKNOT_EN_BUYUK_YUZDE = 88;

/** Kupürün kart iç genişliğindeki payı, yüzde: gerçek uzunlukla orantılı (KG-123; 5 TL = 71,5). */
export function kartBanknotYuzdesi(deger: BanknotDegeri): number {
  return KART_BANKNOT_EN_BUYUK_YUZDE * banknotGoreliOlcek(deger);
}
