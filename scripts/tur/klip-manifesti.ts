/**
 * Türkçe ses klibi manifesti üreticisi (Okuma Yazma Adım 69; Adım 67'nin girdisi). `npm run tur:klip`
 *
 * Şablonların (T-02…T-07) isteyebileceği BÜTÜN klipleri (yönerge, geri bildirim, havuz sözcükleri, sözcüklerden gelen
 * en az iki harfli heceler) `ders-verisi/tur/ses/klipler.json`'a yazar. Ses dosyası yok: her klip `durum: "eksik"`.
 * TTS bu adımda ÜRETİLMEZ. Tek ünsüz klibi yoktur (D-11); `npm run validate` manifestin şablonlarla eş olduğunu,
 * her metnin ünlü taşıdığını denetler; `--yayin` eksik klipte kırmızıdır (D-21).
 *
 * `klipManifestiUret()` SAF; `tests/unit/turSablon.spec.ts` commitlenmiş JSON'un bu çıktıyla aynı olduğunu denetler.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PROGRAM_SURUMU } from '../../src/content/dersler/tur/alfabe';
import { havuzuAyristir } from '../../src/content/dersler/tur/sablonlar/havuz';
import { turKlipManifesti } from '../../src/content/dersler/tur/sablonlar/denetim';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const KLIP_MANIFESTI_YOLU = 'ders-verisi/tur/ses/klipler.json';

export interface TurKlipManifesti {
  readonly surum: 1;
  readonly programSurumu: string;
  readonly not: string;
  readonly klipler: readonly { readonly anahtar: string; readonly metin: string; readonly durum: 'eksik' | 'var'; readonly dosya?: string }[];
}

export function klipManifestiUret(havuzHam: unknown): TurKlipManifesti {
  return {
    surum: 1,
    programSurumu: PROGRAM_SURUMU,
    not: 'Ses dosyaları Adım 67’de üretilecek (Puck, hız 0,9; TTS bu adımda yok). Tek ünsüz klibi yok (D-11).',
    klipler: turKlipManifesti(havuzuAyristir(havuzHam)).map((k) => ({ ...k, durum: 'eksik' as const })),
  };
}

export function klipManifestiMetni(havuzHam: unknown): string {
  return `${JSON.stringify(klipManifestiUret(havuzHam), null, 1)}\n`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const havuz = JSON.parse(readFileSync(path.join(ROOT, 'ders-verisi/tur/icerik/sozcukler.json'), 'utf8')) as unknown;
  const hedef = path.join(ROOT, KLIP_MANIFESTI_YOLU);
  mkdirSync(path.dirname(hedef), { recursive: true });
  writeFileSync(hedef, klipManifestiMetni(havuz));
  console.log(`${KLIP_MANIFESTI_YOLU}: ${klipManifestiUret(havuz).klipler.length} klip (hepsi eksik).`);
}
