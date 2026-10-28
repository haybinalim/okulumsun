/**
 * Artımlı üretim planı (KG-109): yalnız özeti değişen veya dosyası eksik klipler üretilir.
 * Tam yeniden üretim yalnız açık `--zorla` bayrağıyla. Saf fonksiyon; testlenir.
 */

import type { Clip } from './klipler.ts';

export interface PlanSecenekleri {
  /** `--zorla`: özetleri yoksay, hepsini yeniden üret. */
  readonly zorla: boolean;
  /** `--en-cok N`: bu çalışmada en çok N klip. */
  readonly enCok?: number;
}

export interface UretimPlani {
  readonly uretilecek: readonly { readonly clip: Clip; readonly ozet: string }[];
  readonly atlanan: number;
  /** `--en-cok` yüzünden sonraki çalışmaya kalan. */
  readonly kalan: number;
}

export function uretimPlani(
  klipler: readonly Clip[],
  ozetler: Readonly<Record<string, string>>,
  ozetHesapla: (metin: string) => string,
  dosyaVarMi: (dosya: string) => boolean,
  secenekler: PlanSecenekleri,
): UretimPlani {
  const uretilecek: { clip: Clip; ozet: string }[] = [];
  let atlanan = 0;
  let kalan = 0;
  const enCok = secenekler.enCok !== undefined && Number.isFinite(secenekler.enCok) ? secenekler.enCok : Infinity;
  for (const clip of klipler) {
    const ozet = ozetHesapla(clip.text);
    if (!secenekler.zorla && ozetler[clip.key] === ozet && dosyaVarMi(clip.file)) {
      atlanan++;
      continue;
    }
    if (uretilecek.length >= enCok) {
      kalan++;
      continue;
    }
    uretilecek.push({ clip, ozet });
  }
  return { uretilecek, atlanan, kalan };
}
