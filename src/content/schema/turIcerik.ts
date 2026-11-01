import './zodAyari';
import { z } from 'zod';
import { ALFABE, PROGRAM_SURUMU, trKucuk } from '../dersler/tur/alfabe';

/**
 * Türkçe içerik şeması (Okuma Yazma planı §2.4.3, Adım 62; `docs/mufredat-kisitlari-turkce.md`).
 *
 * Bütün nesneler `strict`: tanımsız alan reddedilir — örneğin hece/sözcük parçasına renk veren bir alan
 * (D-06, K-OY-07) şemaya hiç giremez. Şema yapıyı denetler; MEB kurallarının öğeler arası olanları
 * `src/content/dersler/tur/dogrulayici.ts`'tedir. Bu modül YALNIZ doğrulamada (CI, testler) kullanılır; zod üretim paketine girmez.
 */

const harfKumesi = ALFABE.join('');
const KUCUK_HARF = new RegExp(`^[${harfKumesi}]$`, 'u');
/** Hece: yalnız küçük Türkçe harf (D-04, K-OY-05). */
const HECE = new RegExp(`^[${harfKumesi}]{1,5}$`, 'u');

const Kimlik = z.string().regex(/^[a-z0-9][a-z0-9.-]*$/, 'kimlik: küçük harf, rakam, nokta, tire');
const GirisHarfi = z.string().regex(KUCUK_HARF, 'girisHarfi: tek küçük Türkçe harf');
/** Ses klibi: anahtar + seslendirilen metin (D-11, D-21). */
export const KlipSema = z.strictObject({ anahtar: z.string().regex(/^tur\.[a-z0-9.-]+$/), metin: z.string().min(1) });

export const HarfSema = z.strictObject({
  id: Kimlik,
  kucuk: z.string().regex(KUCUK_HARF),
  buyuk: z.string().length(1),
  grup: z.number().int().min(1).max(5),
  sira: z.number().int().min(1).max(6),
  tur: z.enum(['unlu', 'unsuz']),
  karistirilan: z.array(z.string().regex(KUCUK_HARF)).default([]),
  /** Ünsüzde klip olamaz (K-OY-03) — doğrulayıcı reddeder; ünlüde isteğe bağlı. */
  klip: KlipSema.optional(),
});

export const HeceSema = z
  .strictObject({
    id: Kimlik,
    metin: z.string().regex(HECE, 'hece: yalnız küçük harf (D-04)'),
    girisHarfi: GirisHarfi,
    /** Hece kendi başına anlamlı bir sözcük mü (at, ne, al) — anlamsız hece oranı (D-05). */
    anlamli: z.boolean(),
    /** Hecenin geçtiği sözcük kimlikleri (bağlamsız hece yok, D-05). */
    sozcukler: z.array(Kimlik).min(1, 'hece en az bir sözcüğe bağlı olmalı (D-05)'),
    klip: KlipSema.optional(),
  })
  .refine((h) => trKucuk(h.metin) === h.metin, { message: 'hecede büyük harf yok (D-04)' });

export const AnlamTeyidiSema = z.strictObject({
  /** Anonim öğretmen kodları (O1, O2); kişisel veri yok. */
  ogretmen: z.array(z.string().regex(/^O\d{1,2}$/)).min(1),
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const SozcukSema = z.strictObject({
  id: Kimlik,
  metin: z.string().min(1),
  girisHarfi: GirisHarfi,
  gorselId: Kimlik.optional(),
  ozelAd: z.literal(true).optional(),
  anlamTeyidi: AnlamTeyidiSema.optional(),
  klip: KlipSema.optional(),
});

export const CumleSema = z.strictObject({
  id: Kimlik,
  metin: z.string().min(1),
  girisHarfi: GirisHarfi,
  /** Cümlede geçen özel adlar (büyük harf ve kesme işareti yalnız bunlarda, D-09/D-10). */
  ozelAdlar: z.array(z.string()).default([]),
  /** Virgül yalnız sıralı sözcükleri ayırırken (D-09). */
  siraliSozcukler: z.literal(true).optional(),
  /** Hedef görsel (cümlenin İÇİNDE değil — rebus yok, D-07). */
  gorselId: Kimlik.optional(),
  klip: KlipSema.optional(),
});

export const SABLON_KODLARI = [
  'T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08',
  'T-09', 'T-10', 'T-11', 'T-12', 'T-13', 'T-14', 'T-15', 'T-16',
  'M-1', 'M-2', 'M-3', 'M-4',
] as const; // prettier-ignore

export const SecenekSema = z.strictObject({
  tur: z.enum(['harf', 'hece', 'sozcuk', 'gorsel', 'noktalama']),
  metin: z.string().optional(),
  gorselId: Kimlik.optional(),
  /** Cevaptan önce dokununca ses çalar mı. Harf ve hece kartında `false` olmalı (D-11). */
  sesli: z.boolean(),
  /** Karıştırılan çift çeldiricisi (D-23). */
  diagnosticTag: z.string().optional(),
});

export const EtkinlikSema = z.strictObject({
  id: Kimlik,
  sablon: z.enum(SABLON_KODLARI),
  girisHarfi: GirisHarfi,
  uyaran: z.strictObject({ tur: z.enum(['yazi', 'ses', 'gorsel', 'yok']), metin: z.string().optional() }),
  yonerge: KlipSema,
  secenekler: z.array(SecenekSema).min(2),
  dogru: z.number().int().min(0),
});

/** Dosya düzeyinde öğretmen teyidi durumu (Adım 69 havuzu: `bekliyor`; `validate --yayin` bekleyende kırmızı). */
export const IcerikTeyidiSema = z.strictObject({
  durum: z.enum(['bekliyor', 'tamam']),
  kaynak: z.string().min(1).optional(),
});

export const TurIcerikDosyasiSema = z.strictObject({
  programSurumu: z.literal(PROGRAM_SURUMU),
  teyit: IcerikTeyidiSema.optional(),
  harfler: z.array(HarfSema).default([]),
  heceler: z.array(HeceSema).default([]),
  sozcukler: z.array(SozcukSema).default([]),
  cumleler: z.array(CumleSema).default([]),
  etkinlikler: z.array(EtkinlikSema).default([]),
});

export type TurHarf = z.infer<typeof HarfSema>;
export type TurHece = z.infer<typeof HeceSema>;
export type TurSozcuk = z.infer<typeof SozcukSema>;
export type TurCumle = z.infer<typeof CumleSema>;
export type TurEtkinlik = z.infer<typeof EtkinlikSema>;
export type TurIcerikDosyasi = z.infer<typeof TurIcerikDosyasiSema>;

export function turIcerikDosyasiniAyristir(ham: unknown): TurIcerikDosyasi {
  return TurIcerikDosyasiSema.parse(ham);
}
