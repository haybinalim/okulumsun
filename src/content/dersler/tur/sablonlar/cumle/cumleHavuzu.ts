/**
 * Cümle havuzu yükleyicisi (Adım 74) — `ders-verisi/tur/icerik/cumleler.json` (şema `turIcerik.ts`, CI'da zod ve D-26).
 * Çalışma anında zod yüklenmez: biçim kabaca sınanır; yalnız Türkçe harf, boşluk ve izinli noktalamadan oluşan, bitiş
 * işareti etiketiyle aynı öğeler alınır. Havuz öğretmen teyidi bekler (`teyit: bekliyor`, KG-155); `validate --yayin`
 * teyitsiz cümlede kırmızıdır.
 */
import { harfMi } from '../../alfabe';
import { dekodlanabilirMi } from '../../ogretilenKume';
import type { TurHavuzCumlesi } from '../turSoru';

export const TUR_CUMLE_DOSYASI = 'icerik/cumleler.json';

const TURLER = { '.': 'bildirme', '?': 'soru', '!': 'unlem' } as const;
const IZINLI = new Set([' ', ',', "'", '.', '?', '!']);

export function cumleHavuzunuAyristir(ham: unknown): TurHavuzCumlesi[] {
  const c = (ham as { cumleler?: unknown } | null)?.cumleler;
  if (!Array.isArray(c)) throw new Error('cümle havuzu biçimi beklenen gibi değil.');
  const sonuc: TurHavuzCumlesi[] = [];
  for (const x of c as Record<string, unknown>[]) {
    if (typeof x !== 'object' || x === null) continue;
    const { id, metin, girisHarfi, grup, tur, noktalama, ozelAdlar, gorselId } = x;
    if (typeof id !== 'string' || typeof metin !== 'string' || typeof girisHarfi !== 'string') continue;
    if (typeof grup !== 'number' || (noktalama !== '.' && noktalama !== '?' && noktalama !== '!')) continue;
    if (metin.at(-1) !== noktalama || tur !== TURLER[noktalama]) continue;
    if (![...metin].every((ch) => harfMi(ch) || IZINLI.has(ch))) continue;
    const adlar = Array.isArray(ozelAdlar) ? ozelAdlar.filter((a): a is string => typeof a === 'string') : [];
    sonuc.push({
      id,
      metin,
      girisHarfi,
      grup,
      tur: TURLER[noktalama],
      noktalama,
      ozelAdlar: adlar,
      ...(typeof gorselId === 'string' ? { gorselId } : {}),
    });
  }
  return sonuc;
}

/**
 * Bu kümeyle okunabilen cümleler: bütün glifler kümede (büyük harf dahil, K-OY-11) ve giriş harfi öğretilmiş
 * (ünlem cümlesi 5. grup açılmadan gelmez, D-09). Havuz sırası korunur.
 */
export function okunabilirCumleler(cumleler: readonly TurHavuzCumlesi[], kume: ReadonlySet<string>): TurHavuzCumlesi[] {
  return cumleler.filter((c) => c.grup >= 2 && kume.has(c.girisHarfi) && dekodlanabilirMi(c.metin, kume));
}
