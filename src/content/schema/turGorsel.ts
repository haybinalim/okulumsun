import './zodAyari';
import { z } from 'zod';
import { PROGRAM_SURUMU } from '../dersler/tur/alfabe';
import { TeyitSema } from './turHamle';

/**
 * Türkçe sözcük görselleri dizini (Okuma Yazma planı §2.4.8, Adım 68) — `ders-verisi/tur/gorseller/grup-<n>.json`.
 *
 * Harf grubu başına bir dizin: o grubun resimli sözcükleri ve her birinin statik SVG'si (`gorseller/<id>.svg`,
 * kendi çizimimiz, `scripts/tur/gorsel-uret.tsx` üretir). Sözcük listesi iki öğretmen teyidini beklediği için her
 * görsel `teyit: bekliyor` taşır; yayın kapısı (`npm run validate -- --yayin`) hata verir. Resimle karışıklıksız
 * gösterilemeyen sözcükler `resimsiz` altında gerekçesiyle durur (öğretmene sorulur). Bütün nesneler `strict`.
 * Yalnız doğrulamada (CI, testler) kullanılır; zod üretim paketine girmez.
 */

/** Görsel kimliği: ASCII küçük harf (ı → i), dosya adıyla aynı. */
export const GorselKimlik = z.string().regex(/^[a-z][a-z0-9-]*$/, 'görsel kimliği: ASCII küçük harf, rakam, tire');

/** Öğretmen/çocuk tanınırlığı için çizimin karışma olasılığı (çizen değerlendirmesi; teyitte ölçülür). */
export const TANINIRLIK_RISKLERI = ['dusuk', 'orta', 'yuksek'] as const;

export const GorselSema = z.strictObject({
  id: GorselKimlik,
  /** Göreli yol (`gorseller/<id>.svg`). */
  dosya: z.string().regex(/^gorseller\/[a-z][a-z0-9-]*\.svg$/),
  /** Resmin adı olan sözcük (küçük harf, Türkçe). */
  sozcuk: z.string().min(2),
  /** Sözcük listesi taslağındaki sıra numarası (öğretmen formuyla eşleşme). */
  taslakNo: z.number().int().min(1),
  /** Ne çizildi (öğretmen sayfası ve envanter için; çocuğa gösterilmez). */
  aciklama: z.string().min(3),
  risk: z.enum(TANINIRLIK_RISKLERI),
  /** Dosya boyu (bayt); diskteki dosyayla aynı olmalı. */
  bayt: z.number().int().positive(),
  teyit: TeyitSema,
});

export const ResimsizSema = z.strictObject({
  sozcuk: z.string().min(2),
  taslakNo: z.number().int().min(1),
  neden: z.string().min(10),
});

export const GorselDizinSema = z.strictObject({
  surum: z.literal(1),
  programSurumu: z.literal(PROGRAM_SURUMU),
  grup: z.number().int().min(1).max(5),
  kaynak: z.string().min(10),
  /** Grubun resimli sözcükleri (taslaktaki "görsel ✓" sütunu, `resimsiz` düşülmüş). Her birinin tek görseli olur. */
  resimliSozcukler: z.array(z.string().min(2)),
  gorseller: z.array(GorselSema),
  resimsiz: z.array(ResimsizSema).default([]),
});

export type TurGorsel = z.infer<typeof GorselSema>;
export type TurGorselDizini = z.infer<typeof GorselDizinSema>;

export function gorselDiziniAyristir(ham: unknown): TurGorselDizini {
  const r = GorselDizinSema.safeParse(ham);
  if (!r.success)
    throw new Error(`görsel dizini şeması: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  return r.data;
}
