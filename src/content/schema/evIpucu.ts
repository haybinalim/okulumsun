/**
 * `src/content/evIpuclari.json` şeması (plan v2 Adım 43).
 *
 * Her tema için veliye 3 cümle: gözlem, soru, ev nesnesiyle etkinlik. Dil yetişkine, sade;
 * "yanlış" sözcüğü kullanılmaz. Kişisel veri YOK.
 */
import { z } from 'zod';

const Cumle = z
  .string()
  .min(10)
  .refine((s) => !/yanl[ıi]ş/i.test(s), { message: "'yanlış' sözcüğü kullanılmaz." });

export const EvIpucuSchema = z.object({
  tema: z.number().int().min(1).max(7),
  gozlem: Cumle,
  soru: Cumle,
  etkinlik: Cumle,
});

export const EvIpuclariSchema = z.object({
  $aciklama: z.string(),
  ipuclari: z.array(EvIpucuSchema).superRefine((d, ctx) => {
    const goruldu = new Set<number>();
    for (const x of d) {
      if (goruldu.has(x.tema)) ctx.addIssue({ code: 'custom', message: `Tema ${x.tema} iki kez var.` });
      goruldu.add(x.tema);
    }
    for (let t = 1; t <= 7; t++) if (!goruldu.has(t)) ctx.addIssue({ code: 'custom', message: `Tema ${t} için ipucu yok.` });
  }),
});

export type EvIpucu = z.infer<typeof EvIpucuSchema>;
export type EvIpuclari = z.infer<typeof EvIpuclariSchema>;
