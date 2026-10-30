import './zodAyari';
import { z } from 'zod';

/**
 * Türkçe yazılış hamle verisi şeması (Okuma Yazma planı §2.4.9, Adım 63) — `ders-verisi/tur/hamleler.json`.
 *
 * Her glif (29 küçük, 29 büyük harf, 10 rakam) numaralı hamlelerden oluşur; her hamle kendi orta çizgimizin
 * örneklenmiş nokta dizisidir (0–100 satır dizgesi). `teyit` öğretmen teyidini taşır: `bekliyor` iken veri
 * geliştirmede kullanılır, yayın kapısı (`npm run validate -- --yayin`) hata verir. Bütün nesneler `strict`.
 * Tipler çalışma anı kodunda da kullanılır; zod yalnız doğrulamada (CI, testler).
 */

export const HAMLE_TIPLERI = ['dik', 'yatay', 'capraz', 'daire', 'yay', 'karma', 'nokta', 'cengel', 'kisaYay'] as const;
export const HAMLE_YONLERI = [
  'asagi',
  'yukari',
  'saga',
  'sola',
  'sag-asagi',
  'sol-asagi',
  'sag-yukari',
  'sol-yukari',
  'saat-tersi',
  'saat-yonu',
  'karma',
] as const;

export type HamleTipi = (typeof HAMLE_TIPLERI)[number];
export type HamleYonu = (typeof HAMLE_YONLERI)[number];
export type GlifBicimi = 'kucuk' | 'buyuk' | 'rakam';

const Nokta = z.tuple([z.number().min(0).max(60), z.number().min(0).max(100)]);

export const HamleSema = z.strictObject({
  sira: z.number().int().min(1),
  tip: z.enum(HAMLE_TIPLERI),
  yon: z.enum(HAMLE_YONLERI),
  /** Kalem kalkmadan aynı çizgiden geri çıkılır (n, m, r, h, u, y, U). */
  geriDonus: z.literal(true).optional(),
  /** Yön kuralının (dikey aşağı, yatay sağa, daire saatin tersine) bilinçli istisnası ve gerekçesi. */
  istisna: z.string().min(3).optional(),
  aciklama: z.string().min(3),
  noktalar: z.array(Nokta).min(2),
});

export const TeyitSema = z.discriminatedUnion('durum', [
  z.strictObject({ durum: z.literal('bekliyor') }),
  z.strictObject({
    durum: z.literal('teyitli'),
    /** Anonim öğretmen kodları (O1, O2); kişisel veri yok. */
    ogretmen: z.array(z.string().regex(/^O\d{1,2}$/)).min(2),
    tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
]);

export const HamleGlifiSema = z.strictObject({
  glif: z.string().length(1),
  bicim: z.enum(['kucuk', 'buyuk', 'rakam']),
  genislik: z.number().positive().max(60),
  hamleSayisi: z.number().int().min(1).max(6),
  hamleler: z.array(HamleSema).min(1),
  teyit: TeyitSema,
});

export const HamleDosyasiSema = z.strictObject({
  surum: z.literal(1),
  programSurumu: z.string().min(1),
  koordinat: z.strictObject({
    ust: z.literal(20),
    kilavuz: z.literal(50),
    taban: z.literal(80),
    kuyruk: z.literal(100),
    cmBirim: z.literal(60),
  }),
  kaynak: z.string().min(10),
  glifler: z.array(HamleGlifiSema).length(68),
});

export type TurHamle = z.infer<typeof HamleSema>;
export type TurHamleGlifi = z.infer<typeof HamleGlifiSema>;
export type TurHamleDosyasi = z.infer<typeof HamleDosyasiSema>;

export function hamleDosyasiniAyristir(ham: unknown): TurHamleDosyasi {
  const r = HamleDosyasiSema.safeParse(ham);
  if (!r.success)
    throw new Error(
      `hamleler.json şeması: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  return r.data;
}
