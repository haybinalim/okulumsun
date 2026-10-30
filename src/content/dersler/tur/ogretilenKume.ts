/**
 * Öğretim durumu: öğretilen (harf, biçim) kümesi (Okuma Yazma planı §2.4.5, Adım 62). SAF.
 *
 * Bir glif = harfin küçük ya da büyük biçimi ("a", "A", "i", "İ", "ı", "I"). Resmî sıra (K-OY-01, K-OY-11):
 * her harfte önce küçük, sonra büyük; harfler Şekil 1 sırasıyla. Doğrulayıcı (CI) her öğenin resmî sıradaki
 * giriş noktasını hesaplar; çalışma anında öğretmenin seçtiği küme kullanılır (öğretmen sırayı ve hızı yönetir,
 * K-OY-20). Küme adreste `?tur=<kod>` olarak taşınır (base36 bit maskesi); hiçbir yerde saklanmaz.
 */
import { harfGrubu, harfleri, OGRETIM_SIRASI, trBuyuk, trKucuk, type Harf } from './alfabe';

/** Resmî sırada 58 glif: a, A, n, N, e, E, t, T, i, İ, l, L, o, O, … */
export const RESMI_GLIF_SIRASI: readonly string[] = OGRETIM_SIRASI.flatMap((h) => [h, trBuyuk(h)]);

const GLIF_INDEKSI = new Map(RESMI_GLIF_SIRASI.map((g, i) => [g, i]));

export interface GirisNoktasi {
  /** Metnin tüm gliflerinin öğretilmiş olduğu ilk nokta (RESMI_GLIF_SIRASI indeksi). */
  readonly sira: number;
  /** O noktadaki harf (küçük). */
  readonly harf: Harf;
  readonly bicim: 'kucuk' | 'buyuk';
  readonly grup: number;
}

/** Metnin resmî sıradaki giriş noktası; harfsiz metinde `null`. Türkçe olmayan harf hatadır (harfleri() süzer). */
export function girisNoktasi(metin: string): GirisNoktasi | null {
  const glifler = harfleri(metin);
  if (glifler.length === 0) return null;
  const sira = Math.max(...glifler.map((g) => GLIF_INDEKSI.get(g)!));
  const glif = RESMI_GLIF_SIRASI[sira];
  const harf = trKucuk(glif) as Harf;
  return { sira, harf, bicim: glif === harf ? 'kucuk' : 'buyuk', grup: harfGrubu(harf) };
}

/** Harfin öğretim sırasındaki yeri (0–28). */
export function harfSirasi(harf: string): number {
  const i = OGRETIM_SIRASI.indexOf(trKucuk(harf) as Harf);
  if (i < 0) throw new Error(`Türkçe harf değil: ${harf}`);
  return i;
}

/** Resmî sırada `harf` öğretildiğinde öğretilmiş gliflerin kümesi (büyük biçimi dahil). */
export function resmiKume(harf: string, buyukDahil = true): Set<string> {
  const son = harfSirasi(harf);
  const kume = new Set<string>();
  for (let i = 0; i <= son; i++) {
    kume.add(OGRETIM_SIRASI[i]);
    if (i < son || buyukDahil) kume.add(trBuyuk(OGRETIM_SIRASI[i]));
  }
  return kume;
}

/** Metin yalnız kümedeki gliflerden mi oluşuyor (dekodlanabilirlik, K-OY-02). */
export function dekodlanabilirMi(metin: string, kume: ReadonlySet<string>): boolean {
  return harfleri(metin).every((g) => kume.has(g));
}

/** Kümede büyük biçimi olup küçüğü olmayan harf var mı (önce küçük, sonra büyük; K-OY-11). */
export function kumeGecerliMi(kume: ReadonlySet<string>): boolean {
  return [...kume].every((g) => GLIF_INDEKSI.has(g) && (trKucuk(g) === g || kume.has(trKucuk(g))));
}

const KOD_DESENI = /^[0-9a-z]{1,12}$/;
const UST_SINIR = 1n << BigInt(RESMI_GLIF_SIRASI.length);

/** Kümeyi `?tur=` kodu yapar (resmî glif sırasına göre bit maskesi, base36). */
export function kumeKodla(kume: ReadonlySet<string>): string {
  let maske = 0n;
  for (const g of kume) {
    const i = GLIF_INDEKSI.get(g);
    if (i === undefined) throw new Error(`Bilinmeyen glif: ${g}`);
    maske |= 1n << BigInt(i);
  }
  return maske.toString(36);
}

/** Katı çözücü: biçim, aralık veya küme kuralı bozuksa `null` (ADR-0010 eve link sözleşmesi gibi). */
export function kumeCoz(kod: string): Set<string> | null {
  if (!KOD_DESENI.test(kod)) return null;
  let maske = 0n;
  for (const c of kod) maske = maske * 36n + BigInt(parseInt(c, 36));
  if (maske === 0n || maske >= UST_SINIR) return null;
  const kume = new Set(RESMI_GLIF_SIRASI.filter((_, i) => (maske >> BigInt(i)) & 1n));
  return kumeGecerliMi(kume) ? kume : null;
}
