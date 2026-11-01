/**
 * Sözcük havuzu yükleyicisi (Adım 69) — `ders-verisi/tur/icerik/sozcukler.json` (şema `turIcerik.ts`, CI'da zod).
 * Çalışma anında zod yüklenmez: biçim kabaca sınanır ve yalnız tek sözcüklü, küçük harfli Türkçe öğeler alınır.
 * Havuz öğretmen teyidi bekler (`teyit: bekliyor`, D-14); `validate --yayin` teyitsiz sözcükte kırmızıdır.
 */
import { harfMi, trKucuk } from '../alfabe';
import type { TurHavuzSozcugu } from './turSoru';

export const TUR_HAVUZ_DOSYASI = 'icerik/sozcukler.json';

export function havuzuAyristir(ham: unknown): TurHavuzSozcugu[] {
  const s = (ham as { sozcukler?: unknown } | null)?.sozcukler;
  if (!Array.isArray(s)) throw new Error('sözcük havuzu biçimi beklenen gibi değil.');
  return s.filter(
    (x: unknown): x is TurHavuzSozcugu =>
      typeof x === 'object' &&
      x !== null &&
      typeof (x as TurHavuzSozcugu).id === 'string' &&
      typeof (x as TurHavuzSozcugu).metin === 'string' &&
      typeof (x as TurHavuzSozcugu).girisHarfi === 'string' &&
      (x as TurHavuzSozcugu).metin.length > 0 &&
      [...(x as TurHavuzSozcugu).metin].every(harfMi) &&
      trKucuk((x as TurHavuzSozcugu).metin) === (x as TurHavuzSozcugu).metin,
  );
}
