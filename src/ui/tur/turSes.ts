import { e2eKlipIstendi } from '../../dev/e2eKanca';

/**
 * Türkçe etkinlik sesi (Adım 69) — YALNIZ bayraklı derlemede.
 *
 * Şablonlar klip KİMLİĞİ ister (`tur.sozcuk.kale`, `tur.yonerge.t07`…). Türkçe ses dosyaları henüz yok (Adım 67;
 * manifest `ders-verisi/tur/ses/klipler.json` her klibi `durum: "eksik"` taşır), bu yüzden burada hiçbir şey
 * çalınmaz: istek e2e kancasına yazılır (testler istenen klipleri denetler: tek ünsüz yok, kart sessiz) ve arayüz
 * görünür "ses yok" gösterir. Harf kartları bu modülü HİÇ çağırmaz (D-11).
 */
export const TUR_SES_HAZIR = false;

/** Klipleri sırayla ister; ses çalınabildiyse `true` (bugün her zaman `false`: ses yok). */
export function turKlipleriniIste(klipler: readonly string[]): boolean {
  for (const k of klipler) e2eKlipIstendi(k);
  return TUR_SES_HAZIR && klipler.length > 0;
}
