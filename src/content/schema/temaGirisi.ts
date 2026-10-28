/**
 * `src/content/temaGirisleri.json` şeması (plan v2 Adım 45, KG-111): derin tema girişi, 7 tema × 4 adım.
 *
 * Her adım: ses anahtarı (`giris.t<tema>-<adım>`, manifestte olmalı), sahnede gösterilecek görsel (`VisualSpec`),
 * eylem (`izle` | `dokun`), dokunma hedefinin kimliği (`dokun` adımında zorunlu) ve en uzun bekleme.
 * - `izle`: anlatım biter, `enUzunBeklemeMs` sonra kendiliğinden ilerler.
 * - `dokun`: hedef kart alt %65'te; dokunulmazsa `enUzunBeklemeMs` sonra anlatım bir kez tekrarlanır, sonra
 *   kendiliğinden ilerler (çocuk takılıp kalmaz, yanlış/ceza yok).
 * İlk ve son adım `izle` (giriş ve "Haydi başlayalım!"); en az bir `dokun`.
 *
 * Doğrulama derleme zamanında (`scripts/yayin/icerikDogrulama.ts`, KG-87); zod üretim paketine girmez. Kişisel veri YOK.
 */
// CSP: jitless ayarı bu şemadan ÖNCE çalışmalı (KG-64).
import './zodAyari';
import { z } from 'zod';
import { SpeechKeySchema, VisualSpecSchema } from './exercise';
import type { SpeechKey } from '../../audio/audioManifest.generated';
import type { VisualSpec } from '../../exercises/types';

export const TEMA_GIRISI_ADIM_SAYISI = 4;
/** Bekleme sınırları (ms): kısa geçiş çocuğu yakalamaz, uzun bekleme dikkati dağıtır. */
export const GIRIS_BEKLEME_ARALIGI = { enAz: 1000, enCok: 15_000 } as const;

export const TemaGirisAdimiSchema = z
  .object({
    ses: SpeechKeySchema,
    gorsel: VisualSpecSchema,
    eylem: z.enum(['izle', 'dokun']),
    hedefAssetId: z
      .string()
      .regex(/^[a-z0-9-]{2,24}$/)
      .optional(),
    enUzunBeklemeMs: z.number().int().min(GIRIS_BEKLEME_ARALIGI.enAz).max(GIRIS_BEKLEME_ARALIGI.enCok),
  })
  .superRefine((a, ctx) => {
    if (a.eylem === 'dokun' && !a.hedefAssetId)
      ctx.addIssue({ code: 'custom', message: `${a.ses}: 'dokun' adımında hedefAssetId zorunlu.` });
    if (a.eylem === 'izle' && a.hedefAssetId)
      ctx.addIssue({ code: 'custom', message: `${a.ses}: 'izle' adımında dokunma hedefi olmaz.` });
  });

export const TemaGirisiIcerigiSchema = z
  .object({
    tema: z.number().int().min(1).max(7),
    adimlar: z.array(TemaGirisAdimiSchema).length(TEMA_GIRISI_ADIM_SAYISI),
  })
  .superRefine((g, ctx) => {
    g.adimlar.forEach((a, i) => {
      if (a.ses !== `giris.t${g.tema}-${i + 1}`)
        ctx.addIssue({ code: 'custom', message: `Tema ${g.tema} adım ${i + 1}: ses anahtarı giris.t${g.tema}-${i + 1} olmalı.` });
    });
    const ilk = g.adimlar[0];
    const son = g.adimlar[g.adimlar.length - 1];
    if (ilk?.eylem !== 'izle' || son?.eylem !== 'izle')
      ctx.addIssue({ code: 'custom', message: `Tema ${g.tema}: ilk ve son adım 'izle' olmalı.` });
    if (!g.adimlar.some((a) => a.eylem === 'dokun'))
      ctx.addIssue({ code: 'custom', message: `Tema ${g.tema}: en az bir 'dokun' adımı olmalı.` });
    const hedefler = g.adimlar.flatMap((a) => (a.hedefAssetId ? [a.hedefAssetId] : []));
    if (new Set(hedefler).size !== hedefler.length)
      ctx.addIssue({ code: 'custom', message: `Tema ${g.tema}: hedefAssetId tekil olmalı.` });
  });

export const TemaGirisleriSchema = z.object({
  $aciklama: z.string(),
  girisler: z.array(TemaGirisiIcerigiSchema).superRefine((d, ctx) => {
    const goruldu = new Set<number>();
    for (const g of d) {
      if (goruldu.has(g.tema)) ctx.addIssue({ code: 'custom', message: `Tema ${g.tema} iki kez var.` });
      goruldu.add(g.tema);
    }
    for (let t = 1; t <= 7; t++) if (!goruldu.has(t)) ctx.addIssue({ code: 'custom', message: `Tema ${t} için giriş yok.` });
  }),
});

/** Plan v2 Adım 45 alt görev 1 arayüzleri (uygulama tarafı zod'suz bu tipleri kullanır). */
export interface TemaGirisAdimi {
  readonly ses: SpeechKey;
  readonly gorsel: VisualSpec;
  readonly eylem: 'izle' | 'dokun';
  readonly hedefAssetId?: string;
  readonly enUzunBeklemeMs: number;
}
export interface TemaGirisiIcerigi {
  readonly tema: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  readonly adimlar: readonly TemaGirisAdimi[];
}
export interface TemaGirisleri {
  readonly $aciklama: string;
  readonly girisler: readonly TemaGirisiIcerigi[];
}

// Derleme zamanı: şemanın çıktısı arayüze atanabilir.
type _Cikti = z.infer<typeof TemaGirisleriSchema>;
export const _semaUyumlu: (x: _Cikti) => TemaGirisleri = (x) => x as TemaGirisleri;
