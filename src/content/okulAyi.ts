/**
 * OKUL AYI → TEMA AÇMA EŞLEMESİ — plan §6.5.
 *
 * Veli kapısı arkasında tek soru: "Okulun kaçıncı ayı?" (Eylül…Haziran).
 * Programın tema sırası bilindiği için bu tek cevap başlangıç noktasını
 * isabetle ayarlar.
 *
 * Bu eşleme yalnız KİLİT açar, ustalık uydurmaz: açılan düğümler `ready`
 * durumunda başlar, `strength = 0`. Çocuk Mart'ta başlasa bile Tema 1'i
 * hiç çözmemiştir ve motor onu `new` kovasında sırayla sunar.
 *
 * SAF: `Date.now()`, IndexedDB çağrılmaz.
 */

/** Okul ayları — öğretim sırasıyla (plan §6.5). */
export const OKUL_AYLARI = [
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
] as const;

/** Okul ayı tipi. */
export type OkulAyi = (typeof OKUL_AYLARI)[number];

/**
 * Okul ayı indeksine göre açılan temaların listesi (plan §6.5 tablosu).
 *
 * @param okulAyiIndex 0–9 (0=Eylül, 9=Haziran)
 * @returns Açılan tema numaraları (1–7)
 *
 * Tablo:
 *  Eylül  → 1
 *  Ekim   → 1–2
 *  Kasım  → 1–2
 *  Aralık → 1–3
 *  Ocak   → 1–4
 *  Şubat  → 1–4
 *  Mart   → 1–5
 *  Nisan  → 1–6
 *  Mayıs  → 1–7
 *  Haziran→ 1–7
 */
export function acilanTemalar(okulAyiIndex: number): readonly number[] {
  // Sınır kontrolü
  const i = Math.max(0, Math.min(okulAyiIndex, OKUL_AYLARI.length - 1));

  // Ders saatleri (§1) aya oranlanarak türetildi.
  // Her ay bir sonraki temayı açar (veya aynı kalır).
  const esikler = [1, 2, 2, 3, 4, 4, 5, 6, 7, 7];
  const acikTemalar = esikler[i];

  // 1'den acikTemalar'a kadar tema numaraları
  return Array.from({ length: acikTemalar }, (_, idx) => idx + 1);
}

/**
 * Bir tema belirli bir okul ayında açık mı?
 */
export function temaAcikMi(okulAyiIndex: number, temaNo: number): boolean {
  return acilanTemalar(okulAyiIndex).includes(temaNo);
}
