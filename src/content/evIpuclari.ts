/**
 * Ev ipuçları yükleyicisi (plan v2 Adım 43). `evIpuclari.json`'u şemayla doğrular; temanın 3 cümlesini verir.
 * Yalnız tembel yüklenen ekranlardan (ipucu kartı, Evde 10 dakika bağlaması) içe aktarılır.
 */
import ipuclariHam from './evIpuclari.json';
import { EvIpuclariSchema, type EvIpucu } from './schema/evIpucu';

const IPUCLARI = EvIpuclariSchema.parse(ipuclariHam).ipuclari;

/** Temanın ipucu (şema 7 temanın hepsini garanti eder); bilinmeyen tema `null`. */
export function temaIpucu(tema: number): EvIpucu | null {
  return IPUCLARI.find((x) => x.tema === tema) ?? null;
}
