/**
 * KARIŞTIRILAN HARF ÇİFTLERİ KATALOĞU (Okuma Yazma planı §1.3 Z22, §2.4.6, Adım 69; D-23). SAF.
 *
 * Türkçede asıl karışıklık noktalı/çengelli çiftlerde (c/ç, s/ş, g/ğ, o/ö, u/ü, ı/i) ve ayna/dönme çiftlerinde
 * (b/d, n/u, m/n). Şablonlar (T-02…T-07) çeldirici seçerken önce bu katalogdan, YALNIZ öğretilen kümedeki harflerden
 * alır (D-23) ve seçeneğe tanı etiketini (`diagnosticTag`) yazar. Etiket yalnız yanlış şıkta bulunur.
 *
 * `TUR_BENZER_BICIM` bu adımda eklendi (ajan önerisi, öğretmen teyidine açık): 1.–2. grupta noktalı ve ayna
 * çiftlerinin çoğu henüz öğretilmemişken dik temel yazıda biçimce yakın harfler (a/o, l/ı, i/l, n/r, n/m dışı).
 */

export const TUR_TANI_ETIKETI_LISTESI = [
  'TUR_NOKTALI_CIFT', // c/ç, s/ş, g/ğ, o/ö, u/ü, ı/i
  'TUR_AYNA_CIFT', // b/d, n/u, m/n, b/p, d/p
  'TUR_BENZER_SES', // p/b, t/d, k/g, f/v, s/z, c/ç (ötümlü/ötümsüz)
  'TUR_BENZER_BICIM', // a/o, a/e, l/ı, i/l, n/r, h/n
] as const;

export type TurTaniEtiketi = (typeof TUR_TANI_ETIKETI_LISTESI)[number];

export interface KaristirilanCift {
  readonly a: string;
  readonly b: string;
  readonly etiket: TurTaniEtiketi;
}

/** Sıra önemlidir: aynı harf için önce noktalı, sonra ayna, sonra biçim, en son ses çifti denenir. */
export const KARISTIRILAN_CIFTLER: readonly KaristirilanCift[] = [
  { a: 'c', b: 'ç', etiket: 'TUR_NOKTALI_CIFT' },
  { a: 's', b: 'ş', etiket: 'TUR_NOKTALI_CIFT' },
  { a: 'g', b: 'ğ', etiket: 'TUR_NOKTALI_CIFT' },
  { a: 'o', b: 'ö', etiket: 'TUR_NOKTALI_CIFT' },
  { a: 'u', b: 'ü', etiket: 'TUR_NOKTALI_CIFT' },
  { a: 'ı', b: 'i', etiket: 'TUR_NOKTALI_CIFT' },
  { a: 'b', b: 'd', etiket: 'TUR_AYNA_CIFT' },
  { a: 'n', b: 'u', etiket: 'TUR_AYNA_CIFT' },
  { a: 'm', b: 'n', etiket: 'TUR_AYNA_CIFT' },
  { a: 'b', b: 'p', etiket: 'TUR_AYNA_CIFT' },
  { a: 'd', b: 'p', etiket: 'TUR_AYNA_CIFT' },
  { a: 'a', b: 'o', etiket: 'TUR_BENZER_BICIM' },
  { a: 'a', b: 'e', etiket: 'TUR_BENZER_BICIM' },
  { a: 'l', b: 'ı', etiket: 'TUR_BENZER_BICIM' },
  { a: 'i', b: 'l', etiket: 'TUR_BENZER_BICIM' },
  { a: 'n', b: 'r', etiket: 'TUR_BENZER_BICIM' },
  { a: 'h', b: 'n', etiket: 'TUR_BENZER_BICIM' },
  { a: 'p', b: 'b', etiket: 'TUR_BENZER_SES' },
  { a: 't', b: 'd', etiket: 'TUR_BENZER_SES' },
  { a: 'k', b: 'g', etiket: 'TUR_BENZER_SES' },
  { a: 'f', b: 'v', etiket: 'TUR_BENZER_SES' },
  { a: 's', b: 'z', etiket: 'TUR_BENZER_SES' },
  { a: 'c', b: 'ç', etiket: 'TUR_BENZER_SES' },
];

export interface KaristirilanHarf {
  readonly harf: string;
  readonly etiket: TurTaniEtiketi;
}

/**
 * `harf` ile karıştırılan ve `kume`de bulunan harfler (katalog sırasıyla, tekrarsız). Küme dışındaki çift hiç
 * dönmez: öğretilmemiş harf çeldirici olamaz (D-23).
 */
export function karistirilanlar(harf: string, kume: ReadonlySet<string>): KaristirilanHarf[] {
  const sonuc: KaristirilanHarf[] = [];
  const gorulen = new Set<string>();
  for (const c of KARISTIRILAN_CIFTLER) {
    const diger = c.a === harf ? c.b : c.b === harf ? c.a : null;
    if (diger === null || gorulen.has(diger) || !kume.has(diger)) continue;
    gorulen.add(diger);
    sonuc.push({ harf: diger, etiket: c.etiket });
  }
  return sonuc;
}
