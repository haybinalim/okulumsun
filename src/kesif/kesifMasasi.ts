/**
 * KEŞİF MASASI — SAF (plan v2 Adım 44).
 *
 * Soru ve puan olmadan oynanan serbest manipülatif alanı: onluk çerçeve, nesne kümesi, sayı doğrusu,
 * terazi, ayır-birleştir. Bu modül yalnız durum geçişlerini (indirgeyici) ve seslendirme kaynağını tanımlar;
 * saat, rastgelelik, depolama ve ağ yok. Sınırlar müfredattan: nesne ≤20 (`ISLEM_ARALIGI`), kefe ≤10.
 * Geçersiz olay durumu DEĞİŞTİRMEZ (aynı nesne döner); hiçbir geçiş sınır dışına çıkmaz.
 */
import type { SpeakSource } from '../audio/speech';
import type { SpeechKey } from '../audio/audioManifest.generated';
import { ISLEM_ARALIGI } from '../exercises/types';

export const KESIF_NESNE_SINIRI = ISLEM_ARALIGI.max; // 20 — PLAN §17
export const KESIF_KEFE_SINIRI = 10;
/** Onluk çerçeve göz sayısı: iki onluk (tahtada sığmazsa ekran "ikinci onluk" ile gösterir). */
export const KESIF_GOZ_SAYISI = 20;

export type KesifAraci = 'onlukCerceve' | 'nesneKumesi' | 'sayiDogrusu' | 'terazi' | 'ayirBirlestir';
export const KESIF_ARACLARI: readonly KesifAraci[] = [
  'onlukCerceve',
  'nesneKumesi',
  'sayiDogrusu',
  'terazi',
  'ayirBirlestir',
];

export type KesifDurumu =
  | { readonly arac: 'onlukCerceve'; readonly dolu: readonly boolean[] }
  | { readonly arac: 'nesneKumesi'; readonly sayi: number }
  | { readonly arac: 'sayiDogrusu'; readonly konum: number }
  | { readonly arac: 'terazi'; readonly sol: number; readonly sag: number }
  | { readonly arac: 'ayirBirlestir'; readonly toplam: number; readonly ayirma: number | null };

/**
 * Dokunma hedefleri (dize; ekran düğmelerinin `data-hedef` değeri):
 * - ortak: `arti`, `eksi`
 * - onluk çerçeve: `goz:<0..19>` (dolu ↔ boş)
 * - nesne kümesi: `nesne:<i>` (o nesneyi çıkar)
 * - sayı doğrusu: `nokta:<0..20>` (oraya zıpla)
 * - terazi: `sol+`, `sol-`, `sag+`, `sag-`
 * - ayır-birleştir: `ayir:<k>` (k | toplam−k), `birlestir`
 */
export type KesifOlayi =
  | { readonly tur: 'aracSec'; readonly arac: KesifAraci }
  | { readonly tur: 'dokun'; readonly hedef: string }
  | { readonly tur: 'sifirla' };

export function kesifBaslangic(arac: KesifAraci): KesifDurumu {
  switch (arac) {
    case 'onlukCerceve':
      return { arac, dolu: Array.from({ length: KESIF_GOZ_SAYISI }, () => false) };
    case 'nesneKumesi':
      return { arac, sayi: 0 };
    case 'sayiDogrusu':
      return { arac, konum: 0 };
    case 'terazi':
      return { arac, sol: 0, sag: 0 };
    case 'ayirBirlestir':
      return { arac, toplam: 5, ayirma: null };
  }
}

/** Çerçevedeki dolu göz sayısı. */
export function doluSayisi(dolu: readonly boolean[]): number {
  return dolu.reduce((n, d) => n + (d ? 1 : 0), 0);
}

function indeks(hedef: string, onek: string, enFazla: number): number | null {
  if (!hedef.startsWith(onek)) return null;
  const s = hedef.slice(onek.length);
  if (!/^(0|[1-9]\d?)$/.test(s)) return null;
  const n = Number(s);
  return n <= enFazla ? n : null;
}

function dokun(d: KesifDurumu, h: string): KesifDurumu {
  switch (d.arac) {
    case 'onlukCerceve': {
      const goz = indeks(h, 'goz:', KESIF_GOZ_SAYISI - 1);
      let i: number;
      if (goz !== null) i = goz;
      else if (h === 'arti') i = d.dolu.indexOf(false);
      else if (h === 'eksi') i = d.dolu.lastIndexOf(true);
      else return d;
      if (i < 0) return d;
      const dolu = d.dolu.slice();
      dolu[i] = !dolu[i];
      return { arac: d.arac, dolu };
    }
    case 'nesneKumesi': {
      const ns = indeks(h, 'nesne:', KESIF_NESNE_SINIRI - 1);
      if (h === 'arti' && d.sayi < KESIF_NESNE_SINIRI) return { arac: d.arac, sayi: d.sayi + 1 };
      if ((h === 'eksi' || (ns !== null && ns < d.sayi)) && d.sayi > 0) return { arac: d.arac, sayi: d.sayi - 1 };
      return d;
    }
    case 'sayiDogrusu': {
      const n = indeks(h, 'nokta:', KESIF_NESNE_SINIRI);
      if (n !== null) return n === d.konum ? d : { arac: d.arac, konum: n };
      if (h === 'arti' && d.konum < KESIF_NESNE_SINIRI) return { arac: d.arac, konum: d.konum + 1 };
      if (h === 'eksi' && d.konum > 0) return { arac: d.arac, konum: d.konum - 1 };
      return d;
    }
    case 'terazi': {
      const m = /^(sol|sag)([+-])$/.exec(h);
      if (!m) return d;
      const taraf = m[1] as 'sol' | 'sag';
      const yeni = d[taraf] + (m[2] === '+' ? 1 : -1);
      if (yeni < 0 || yeni > KESIF_KEFE_SINIRI) return d;
      return { ...d, [taraf]: yeni };
    }
    case 'ayirBirlestir': {
      const k = indeks(h, 'ayir:', KESIF_NESNE_SINIRI);
      if (k !== null) return k > d.toplam || k === d.ayirma ? d : { ...d, ayirma: k };
      if (h === 'birlestir') return d.ayirma === null ? d : { ...d, ayirma: null };
      if (h === 'arti' && d.toplam < KESIF_NESNE_SINIRI) return { arac: d.arac, toplam: d.toplam + 1, ayirma: null };
      if (h === 'eksi' && d.toplam > 0) return { arac: d.arac, toplam: d.toplam - 1, ayirma: null };
      return d;
    }
  }
}

/** Saf indirgeyici. Sınırlar (≤20 nesne, kefe ≤10, sonuç ≤20) hiçbir olayla aşılmaz. */
export function kesifIndirge(d: KesifDurumu, o: KesifOlayi): KesifDurumu {
  if (o.tur === 'aracSec') return o.arac === d.arac ? d : kesifBaslangic(o.arac);
  if (o.tur === 'sifirla') return kesifBaslangic(d.arac);
  return dokun(d, o.hedef);
}

const sayi = (n: number): SpeechKey => `sayi.${n}` as SpeechKey;

/** Keşif Masası açılış sesi: "Keşif masasına hoş geldin, dokun ve keşfet." (KG-110). */
export const KESIF_HOSGELDIN: SpeakSource = { kind: 'key', key: 'kesif.hosgeldin' };

/** "İkiye ayırdık." ile ayırma dizisi arasındaki ara (ms; KG-110 `ilkAraMs`). */
export const KESIF_AYIR_ARASI_MS = 450;

/**
 * Durumu seslendiren kaynak — sayı/işlem klipleri; tam cümleler tek klip (parçadan birleştirilmez).
 * Ayır-birleştirde "İkiye ayırdık." + "5 artı 3 eşittir 8" dizisi; terazide "İki taraf eşit." / "Dengede değil."
 * (KG-110). Açılış sesi `KESIF_HOSGELDIN`.
 */
export function kesifSeslendirme(d: KesifDurumu): SpeakSource | null {
  switch (d.arac) {
    case 'onlukCerceve':
      return { kind: 'key', key: sayi(doluSayisi(d.dolu)) };
    case 'nesneKumesi':
      return { kind: 'key', key: sayi(d.sayi) };
    case 'sayiDogrusu':
      return { kind: 'key', key: sayi(d.konum) };
    case 'terazi':
      return { kind: 'key', key: d.sol === d.sag ? 'kesif.dengede' : 'esit.dengede-degil' };
    case 'ayirBirlestir':
      if (d.ayirma === null) return { kind: 'key', key: sayi(d.toplam) };
      return {
        kind: 'sequence',
        keys: ['kesif.ayir', sayi(d.ayirma), 'op.arti', sayi(d.toplam - d.ayirma), 'op.esit', sayi(d.toplam)],
        ilkAraMs: KESIF_AYIR_ARASI_MS,
      };
  }
}
