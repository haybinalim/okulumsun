/**
 * `src/content/planDuzeltmeleri.json` şeması (plan v2 Adım 37).
 *
 * Okulların yıllık planı MEB sırasından sapabilir; öğretmen görüşüyle bir haftanın kazanımları
 * elle düzeltilir. Her düzeltme gerekçe taşır. Kişisel veri YOK.
 */
import { z } from 'zod';
import type { KazanimKodu } from '../../exercises/types';

const KazanimKoduSchema = z.custom<KazanimKodu>((v) => typeof v === 'string' && /^MAT\.1\.[1-4]\.\d+$/.test(v), {
  message: 'MAT.1.<1-4>.<sıra> biçiminde kazanım kodu bekleniyor.',
});

export const PlanDuzeltmesiSchema = z.object({
  hafta: z.number().int().positive(),
  kazanimKodlari: z.array(KazanimKoduSchema),
  gerekce: z.string().min(3),
});

export const PlanDuzeltmeleriSchema = z.object({
  $aciklama: z.string(),
  okulYili: z.literal('2026-2027'),
  duzeltmeler: z.array(PlanDuzeltmesiSchema).superRefine((d, ctx) => {
    const goruldu = new Set<number>();
    for (const x of d) {
      if (goruldu.has(x.hafta)) ctx.addIssue({ code: 'custom', message: `Hafta ${x.hafta} iki kez düzeltilmiş.` });
      goruldu.add(x.hafta);
    }
  }),
});

export type PlanDuzeltmesi = z.infer<typeof PlanDuzeltmesiSchema>;
export type PlanDuzeltmeleri = z.infer<typeof PlanDuzeltmeleriSchema>;
