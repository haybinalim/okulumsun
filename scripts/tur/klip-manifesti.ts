/**
 * Türkçe ses klibi manifesti üreticisi (Okuma Yazma Adım 69; Adım 67'nin girdisi). `npm run tur:klip`
 *
 * Şablonların isteyebileceği BÜTÜN klipleri (yönerge, geri bildirim, havuz sözcükleri, sözcüklerden gelen
 * en az iki harfli heceler, cümle havuzunun cümleleri — Adım 74) `ders-verisi/tur/ses/klipler.json`'a yazar. Ses dosyası yoksa `durum: "eksik"`, `ders-verisi/tur/ses/<tür>/<ad>.m4a` varsa `durum: "var"` + `dosya`.
 * TTS bu adımda ÜRETİLMEZ. Tek ünsüz klibi yoktur (D-11); `npm run validate` manifestin şablonlarla eş olduğunu,
 * her metnin ünlü taşıdığını denetler; `--yayin` eksik klipte kırmızıdır (D-21).
 *
 * `klipManifestiUret()` SAF (durum için `dosyaVarMi` enjekte edilir; `npm run tur:klip` diskten türetir); `tests/unit/turSablon.spec.ts` commitlenmiş JSON'un bu çıktıyla aynı olduğunu denetler.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PROGRAM_SURUMU } from '../../src/content/dersler/tur/alfabe';
import { havuzuAyristir } from '../../src/content/dersler/tur/sablonlar/havuz';
import { turKlipManifesti } from '../../src/content/dersler/tur/sablonlar/denetim';
import { cumleHavuzunuAyristir } from '../../src/content/dersler/tur/sablonlar/cumle/cumleHavuzu';
import { turKlipDiskteVarMi, turKlipDosyasi } from '../ses/turKlipleri';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const KLIP_MANIFESTI_YOLU = 'ders-verisi/tur/ses/klipler.json';

export interface TurKlipManifesti {
  readonly surum: 1;
  readonly programSurumu: string;
  readonly not: string;
  readonly klipler: readonly { readonly anahtar: string; readonly metin: string; readonly durum: 'eksik' | 'var'; readonly dosya?: string }[];
}

/**
 * `dosyaVarMi` verilirse (ses dosyasının `ders-verisi/tur/ses/` altında varlığı) o klip `durum: "var"` +
 * `dosya` (köke göre yol) olur; verilmezse hepsi `eksik`. Durum elle yazılmaz, diskten türetilir.
 */
export function klipManifestiUret(havuzHam: unknown, cumleHam?: unknown, dosyaVarMi?: (dosya: string) => boolean): TurKlipManifesti {
  return {
    surum: 1,
    programSurumu: PROGRAM_SURUMU,
    not: 'Ses dosyaları `npm run audio -- --ders tur` ile üretilir (Puck, hız 0,9); durum diskten türetilir. Tek ünsüz klibi yok (D-11).',
    klipler: turKlipManifesti(havuzuAyristir(havuzHam), cumleHam === undefined ? [] : cumleHavuzunuAyristir(cumleHam)).map((k) => {
      const dosya = turKlipDosyasi(k.anahtar);
      return dosyaVarMi?.(dosya) ? { ...k, durum: 'var' as const, dosya } : { ...k, durum: 'eksik' as const };
    }),
  };
}

export function klipManifestiMetni(havuzHam: unknown, cumleHam?: unknown, dosyaVarMi?: (dosya: string) => boolean): string {
  return `${JSON.stringify(klipManifestiUret(havuzHam, cumleHam, dosyaVarMi), null, 1)}\n`;
}

/** Depo köküne göre beklenen manifest metni (ses durumu diskten). `validate` ve testler bunu karşılaştırır. */
export function klipManifestiBeklenen(kok: string): string {
  const oku = (g: string): unknown => JSON.parse(readFileSync(path.join(kok, g), 'utf8')) as unknown;
  return klipManifestiMetni(oku('ders-verisi/tur/icerik/sozcukler.json'), oku('ders-verisi/tur/icerik/cumleler.json'), turKlipDiskteVarMi(kok));
}

/** Manifesti diskten türetilen durumla yazar; `{ toplam, var }` döner. */
export function klipManifestiniYaz(kok: string): { toplam: number; var: number } {
  const metin = klipManifestiBeklenen(kok);
  const hedef = path.join(kok, KLIP_MANIFESTI_YOLU);
  mkdirSync(path.dirname(hedef), { recursive: true });
  writeFileSync(hedef, metin);
  const klipler = (JSON.parse(metin) as TurKlipManifesti).klipler;
  return { toplam: klipler.length, var: klipler.filter((k) => k.durum === 'var').length };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const n = klipManifestiniYaz(ROOT);
  console.log(`${KLIP_MANIFESTI_YOLU}: ${n.toplam} klip (sesli ${n.var}, eksik ${n.toplam - n.var}).`);
}
