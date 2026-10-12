/**
 * Ses klibi çıkarımı — SAF modül (E29, Adım 15).
 *
 * `scripts/generate-audio.ts` ve `scripts/audit-audio.ts` aynı klip kümesini
 * buradan alır; ikinci bir düzleştirme yazmak YASAK (sayı klipleri dâhil).
 * Dosya sistemi okuması çağırana aittir: içerik parametreyle verilir.
 */

export interface Clip {
  readonly key: string;
  readonly text: string;
  readonly file: string;
  readonly core: boolean;
}

/** Service worker'ın önden önbelleğe alacağı ad alanları. */
export const CORE_NAMESPACES: readonly string[] = ['ui', 'geri', 'yardim', 'soru', 'op', 'sayi'];

const BIRLER = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const ONLAR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];

/** Türkçe sayı adları — ritmik sayma 0-100, banknot kazanımı için ayrıca 200. */
export function turkishNumber(n: number): string {
  if (!Number.isInteger(n) || n < 0 || (n > 100 && n !== 200)) {
    throw new RangeError(`turkishNumber yalnız 0..100 ve 200 için tanımlı: ${n}`);
  }
  if (n === 100) return 'yüz';
  if (n === 200) return 'iki yüz';
  if (n < 10) return BIRLER[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? ONLAR[t] : `${ONLAR[t]} ${BIRLER[o]}`;
}

/** `src/content/tr.json` içeriğinden konuşulacak tüm klipleri, manifest sırasıyla çıkarır. */
export function klipleriTopla(trJson: Readonly<Record<string, unknown>>): readonly Clip[] {
  const clips: Clip[] = [];

  for (const [ns, value] of Object.entries(trJson)) {
    // '$' ile başlayan anahtarlar insan için not; ses üretilmez.
    if (ns.startsWith('$') || typeof value !== 'object' || value === null) continue;
    const core = CORE_NAMESPACES.includes(ns);
    const group = value as Record<string, unknown>;

    // Sayılar elle yazılmaz, üretilir.
    if (group.$uret === 'sayilar') {
      for (let n = 0; n <= 100; n++) {
        clips.push({ key: `sayi.${n}`, text: turkishNumber(n), file: `sayi/${n}.m4a`, core });
      }
      // MAT.1.1.9 banknot tanımada 200 TL de sesli okunmalıdır.
      clips.push({ key: 'sayi.200', text: turkishNumber(200), file: 'sayi/200.m4a', core });
      continue;
    }

    for (const [k, text] of Object.entries(group)) {
      if (k.startsWith('$') || typeof text !== 'string') continue;
      clips.push({ key: `${ns}.${k}`, text, file: `${ns}/${k}.m4a`, core });
    }
  }
  return clips;
}
