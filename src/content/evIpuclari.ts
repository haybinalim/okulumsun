/**
 * Ev ipuçları yükleyicisi (plan v2 Adım 43). `evIpuclari.json` (derleme zamanında şemayla doğrulanmış); temanın 3 cümlesini verir.
 * Yalnız tembel yüklenen ekranlardan (ipucu kartı, Evde 10 dakika bağlaması) içe aktarılır.
 */
import ipuclariHam from './evIpuclari.json';
import type { EvIpuclari, EvIpucu } from './schema/evIpucu';

// Şema doğrulaması derleme zamanında (KG-87, scripts/yayin/icerikDogrulama.ts); buraya ayrıştırılmış veri gelir.
const IPUCLARI = (ipuclariHam as unknown as EvIpuclari).ipuclari;

/** Temanın ipucu (şema 7 temanın hepsini garanti eder); bilinmeyen tema `null`. */
export function temaIpucu(tema: number): EvIpucu | null {
  return IPUCLARI.find((x) => x.tema === tema) ?? null;
}
