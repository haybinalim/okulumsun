/**
 * `src/content/maskotHikayeleri.json` şeması (plan v2 Adım 54, alt görev 2).
 *
 * 7 tema × 3 sahne. Her sahne: ses anahtarı (`hikaye.t<tema>-<no>`), maskotun söyleyeceği metin, maskot pozu
 * (PLAN §7.5'in 6 durumundan biri) ve sahnede gösterilecek görsel (`VisualSpec`).
 *
 * Ses: anahtarlar henüz `tr.json`'da YOK ve klip yok (KG-01; Adım 31 + maskot sesi kararı K-12). Metin, klip üretilince
 * tr.json'a taşınacak kaynaktır. Doğrulama derleme zamanında (`scripts/yayin/icerikDogrulama.ts`, KG-87); zod üretim
 * paketine girmez. Kişisel veri YOK.
 */
// CSP: jitless ayarı bu şemadan ÖNCE çalışmalı (paylaşılan parçada da; KG-64).
import './zodAyari';
import { z } from 'zod';
import type { MaskotDurumu } from '../../ui/feedback/maskotState';
import { SAHNE_ADLARI, TEMA_SAHNESI, type TemaNo } from '../temaDunyalari';
import { VisualSpecSchema } from './exercise';

/** PLAN §7.5'in 6 durumu (maskotState.ts `MaskotDurumu` ile birebir; aşağıdaki tip iddiaları denetler). */
export const MASKOT_POZLARI = ['sakin', 'konusuyor', 'dinliyor', 'sevinmis', 'cesaretlendiriyor', 'uykulu'] as const;

/**
 * Hikâyede kullanılmayan pozlar: `cesaretlendiriyor` yalnız yanlış cevap/yardım olayına, `uykulu` yalnız 60 sn
 * hareketsizliğe bağlıdır (PLAN §7.5: "geçişler yalnız tablodaki olaylarla"); hikâye bu olayları taklit etmez.
 */
export const HIKAYEDE_YASAK_POZLAR: readonly MaskotDurumu[] = ['cesaretlendiriyor', 'uykulu'];

/** PLAN §7.1 / karakter kitabı "yapmadıkları": ceza, yarış, üzüntü ve acele dili yok. */
export const YASAK_SOZCUKLER = /yanl[ıi]ş|yarış|kazan|kaybet|üzül|üzgün|ağla|acele|hızlı/i;

const Metin = z
  .string()
  .min(10)
  .max(140)
  .refine((s) => !YASAK_SOZCUKLER.test(s), { message: 'Ceza, yarış, üzüntü ve acele dili kullanılmaz (PLAN §7.1).' })
  .refine((s) => (s.match(/[.!?]/g) ?? []).length <= 2, {
    message: 'En çok iki cümle (maskot gereksiz konuşmaz, §7.5).',
  });

export const HikayeSahnesiSchema = z.object({
  no: z.number().int().min(1).max(3),
  sesAnahtari: z.string().regex(/^hikaye\.t[1-7]-[1-3]$/),
  metin: Metin,
  poz: z.enum(MASKOT_POZLARI),
  gorsel: VisualSpecSchema,
});

export const TemaHikayesiSchema = z
  .object({
    tema: z.number().int().min(1).max(7),
    sahne: z.enum(SAHNE_ADLARI),
    baslik: z.string().min(3).max(40),
    sahneler: z.array(HikayeSahnesiSchema).length(3),
  })
  .superRefine((h, ctx) => {
    if (TEMA_SAHNESI[h.tema as TemaNo] !== h.sahne)
      ctx.addIssue({ code: 'custom', message: `Tema ${h.tema} sahnesi ${TEMA_SAHNESI[h.tema as TemaNo]} olmalı.` });
    h.sahneler.forEach((s, i) => {
      if (s.no !== i + 1) ctx.addIssue({ code: 'custom', message: `Tema ${h.tema}: sahne sırası 1, 2, 3 olmalı.` });
      if (s.sesAnahtari !== `hikaye.t${h.tema}-${s.no}`)
        ctx.addIssue({
          code: 'custom',
          message: `Tema ${h.tema} sahne ${s.no}: ses anahtarı hikaye.t${h.tema}-${s.no} olmalı.`,
        });
      if (HIKAYEDE_YASAK_POZLAR.includes(s.poz))
        ctx.addIssue({
          code: 'custom',
          message: `Tema ${h.tema} sahne ${s.no}: '${s.poz}' pozu hikâyede kullanılmaz.`,
        });
    });
  });

export const MaskotHikayeleriSchema = z.object({
  $aciklama: z.string(),
  hikayeler: z.array(TemaHikayesiSchema).superRefine((d, ctx) => {
    const goruldu = new Set<number>();
    for (const x of d) {
      if (goruldu.has(x.tema)) ctx.addIssue({ code: 'custom', message: `Tema ${x.tema} iki kez var.` });
      goruldu.add(x.tema);
    }
    for (let t = 1; t <= 7; t++)
      if (!goruldu.has(t)) ctx.addIssue({ code: 'custom', message: `Tema ${t} için hikâye yok.` });
  }),
});

export type HikayeSahnesi = z.infer<typeof HikayeSahnesiSchema>;
export type TemaHikayesi = z.infer<typeof TemaHikayesiSchema>;
export type MaskotHikayeleri = z.infer<typeof MaskotHikayeleriSchema>;

// Derleme zamanı: şemadaki poz listesi maskotState'teki 6 durumla iki yönde de aynı.
type _PozlarAlt = (typeof MASKOT_POZLARI)[number] extends MaskotDurumu ? true : never;
type _PozlarUst = MaskotDurumu extends (typeof MASKOT_POZLARI)[number] ? true : never;
export const _pozlarUyumlu: [_PozlarAlt, _PozlarUst] = [true, true];
