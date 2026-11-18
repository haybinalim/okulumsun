/**
 * Okuma metni havuzu yükleyicisi (Adım 80) — `ders-verisi/tur/icerik/metinler.json` (şema `turIcerik.ts`, CI'da zod ve
 * D-27). Çalışma anında zod yüklenmez: biçim kabaca sınanır; yalnız Türkçe harf, boşluk ve izinli noktalamadan oluşan,
 * bitiş işareti taşıyan cümlelerden kurulu, soruları tutarlı öğeler alınır. Havuz öğretmen teyidi bekler
 * (`teyit: bekliyor`); `validate --yayin` teyitsiz metinde kırmızıdır.
 */
import { harfMi } from '../../alfabe';
import { dekodlanabilirMi } from '../../ogretilenKume';
import type { TurHavuzMetinSorusu, TurHavuzMetni } from '../turSoru';

export const TUR_METIN_DOSYASI = 'icerik/metinler.json';

const IZINLI = new Set([' ', ',', "'", '.', '?', '!']);
const BITIS = new Set(['.', '?', '!']);

function dizgeDizisi(x: unknown): string[] | null {
  return Array.isArray(x) && x.every((y) => typeof y === 'string') ? (x as string[]) : null;
}

function cumleGecerliMi(c: string): boolean {
  return c.length > 1 && BITIS.has(c.at(-1)!) && [...c].every((ch) => harfMi(ch) || IZINLI.has(ch));
}

function soruAyristir(x: unknown, cumleSayisi: number): TurHavuzMetinSorusu | null {
  if (typeof x !== 'object' || x === null) return null;
  const { id, soru, cevapTuru, cevap, cumleNo, celdiriciler } = x as Record<string, unknown>;
  if (typeof id !== 'string' || typeof soru !== 'string' || typeof cevap !== 'string') return null;
  if (cevapTuru !== 'gorsel' && cevapTuru !== 'sozcuk') return null;
  if (typeof cumleNo !== 'number' || !Number.isInteger(cumleNo) || cumleNo < 1 || cumleNo > cumleSayisi) return null;
  if (!soru.endsWith('?') || !cumleGecerliMi(soru)) return null;
  const cel = celdiriciler === undefined ? [] : dizgeDizisi(celdiriciler);
  if (cel === null) return null;
  if (cevapTuru === 'sozcuk' && (cel.length < 3 || ![cevap, ...cel].every((c) => [...c].every(harfMi)))) return null;
  return { id, soru, cevapTuru, cevap, cumleNo, celdiriciler: cel };
}

export function metinHavuzunuAyristir(ham: unknown): TurHavuzMetni[] {
  const m = (ham as { metinler?: unknown } | null)?.metinler;
  if (!Array.isArray(m)) throw new Error('metin havuzu biçimi beklenen gibi değil.');
  const sonuc: TurHavuzMetni[] = [];
  for (const x of m as Record<string, unknown>[]) {
    if (typeof x !== 'object' || x === null) continue;
    const { id, cumleler, girisHarfi, grup, ozelAdlar, sorular } = x;
    if (typeof id !== 'string' || typeof girisHarfi !== 'string' || typeof grup !== 'number') continue;
    const c = dizgeDizisi(cumleler);
    if (!c || c.length < 2 || c.length > 5 || !c.every(cumleGecerliMi) || !Array.isArray(sorular)) continue;
    const q = (sorular as unknown[]).map((s) => soruAyristir(s, c.length));
    if (q.length === 0 || q.some((s) => s === null)) continue;
    sonuc.push({
      id,
      cumleler: c,
      girisHarfi,
      grup,
      ozelAdlar: dizgeDizisi(ozelAdlar) ?? [],
      sorular: q as TurHavuzMetinSorusu[],
    });
  }
  return sonuc;
}

/**
 * Bu kümeyle okunabilen metinler: giriş harfi öğretilmiş ve bütün cümleler, sorular ve yanlış seçenekler kümedeki
 * gliflerden oluşuyor (büyük harf dahil, K-OY-11). Havuz sırası korunur.
 */
export function okunabilirMetinler(metinler: readonly TurHavuzMetni[], kume: ReadonlySet<string>): TurHavuzMetni[] {
  return metinler.filter(
    (m) =>
      m.grup >= 2 &&
      kume.has(m.girisHarfi) &&
      [...m.cumleler, ...m.sorular.flatMap((q) => [q.soru, ...q.celdiriciler])].every((s) => dekodlanabilirMi(s, kume)),
  );
}
