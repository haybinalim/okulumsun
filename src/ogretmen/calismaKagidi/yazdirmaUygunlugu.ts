/**
 * YAZDIRMA UYGUNLUĞU — 39 şablonun kâğıda uygunluk sınıfı (plan v2 Adım 35, KG-44).
 *
 * - `uygun`: ekrandaki etkinlik kâğıtta aynı anlamla çözülür (daire içine al, say-yaz, çizgiyle eşle, hotspot numarası).
 * - `uyarlanir`: kâğıda çevrilebilir ama çocuk yazı yazar (boşluğa harf/sayı, sıra numarası) ya da anlam biraz kayar;
 *   `yanitTercihi: 'daireIcineAl'` iken bu şablonlar kâğıda girmez.
 * - `uygunDegil`: kâğıtta anlamını yitirir (kısa gösterim; tek tek sayılacak tahmin) → kâğıda girmez.
 *
 * Sınıflar öğretmen görüşüyle kesinleşir (plan: "öğretmen görüşüyle kesinleşir"); geri alma tek satırdır.
 */
export type YazdirmaSinifi = 'uygun' | 'uyarlanir' | 'uygunDegil';

export const YAZDIRMA_SINIFI: Readonly<Record<string, YazdirmaSinifi>> = {
  // uygun (23)
  'M-KONUM': 'uygun',
  'M-ESLIK': 'uygun',
  'M-RAKAM-TANI': 'uygun',
  'M-SIRA-SAYI': 'uygun',
  'M-KARSILASTIR': 'uygun',
  'M-TOPLA-GORSEL': 'uygun',
  'M-TOPLA-SEMBOL': 'uygun',
  'M-CIKAR-GORSEL': 'uygun',
  'M-CIKAR-SEMBOL': 'uygun',
  'M-ISLEM-HIKAYE': 'uygun',
  'M-PARA-TANI': 'uygun',
  'M-GEO-ADLANDIR': 'uygun',
  'M-GEO-KENAR-KOSE': 'uygun',
  'M-OLC-UZUNLUK': 'uygun',
  'M-OLC-KUTLE': 'uygun',
  'M-OLC-BIRIM': 'uygun',
  'M-VERI-GRAFIK': 'uygun',
  'M-SAY': 'uygun',
  'M-VERI-CETELE': 'uygun',
  'M-GEO-YAPI': 'uygun',
  'M-GEO-AYIR': 'uygun',
  'M-GEO-SINIFLA': 'uygun',
  'M-GEO-ESLE': 'uygun',
  // uyarlanır (14)
  'M-RITMIK': 'uyarlanir',
  'M-ONLUK-COZUMLE': 'uyarlanir',
  'M-ORUNTU-SAYI': 'uyarlanir',
  'M-ORUNTU-SEKIL': 'uyarlanir',
  'M-ESIT-DENGE': 'uyarlanir',
  'M-EKSIK-TOPLANAN': 'uyarlanir',
  'M-TOPLA-ONA-TUMLE': 'uyarlanir',
  'M-VERI-GRUPLA': 'uyarlanir',
  'M-VERI-SIKLIK': 'uyarlanir',
  'M-TERS-ISLEM': 'uyarlanir',
  'M-PARA-SIRALA': 'uyarlanir',
  'M-YONERGE': 'uyarlanir',
  'M-OLC-TAHMIN': 'uyarlanir',
  'M-TAHMIN-ISLEM': 'uyarlanir',
  // uygun değil (2)
  'M-SIPSAK': 'uygunDegil',
  'M-TAHMIN-MIKTAR': 'uygunDegil',
};

/** Sınıfı bilinmeyen şablon güvenli tarafta kalır: kâğıda girmez. */
export function yazdirmaSinifi(templateId: string): YazdirmaSinifi {
  return YAZDIRMA_SINIFI[templateId] ?? 'uygunDegil';
}
