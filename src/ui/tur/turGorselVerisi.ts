/**
 * Görsel dizini yükleyicisi (Adım 68) — YALNIZ bayraklı derlemede. Grup dizini (`gorseller/grup-<n>.json`) aynı kökenden
 * bir kez okunur ve grup bazlı bellekte tutulur (ADR-0016). Hiçbir şey yazılmaz.
 */
import { turVerisiniOku } from '../../content/dersler/tur/veriYukleyici';

export interface GorselOgesi {
  readonly id: string;
  readonly dosya: string;
  readonly sozcuk: string;
}

const DOSYA = /^gorseller\/[a-z][a-z0-9-]*\.svg$/;

/** Dizini kabaca sınar (şema CI'da zod ile; çalışma anında zod yüklenmez) ve yalnız güvenli dosya yollarını alır. */
export function gorselDiziniOgeleri(d: unknown): GorselOgesi[] {
  const g = (d as { gorseller?: unknown } | null)?.gorseller;
  if (!Array.isArray(g)) throw new Error('görsel dizini biçimi beklenen gibi değil.');
  return g.filter(
    (x: unknown): x is GorselOgesi =>
      typeof x === 'object' &&
      x !== null &&
      typeof (x as GorselOgesi).id === 'string' &&
      typeof (x as GorselOgesi).sozcuk === 'string' &&
      typeof (x as GorselOgesi).dosya === 'string' &&
      DOSYA.test((x as GorselOgesi).dosya),
  );
}

const bellek = new Map<number, Promise<GorselOgesi[]>>();

export function grupGorselleriniYukle(grup: number): Promise<GorselOgesi[]> {
  let p = bellek.get(grup);
  if (!p) {
    p = turVerisiniOku(`gorseller/grup-${grup}.json`).then(gorselDiziniOgeleri);
    p.catch(() => bellek.delete(grup));
    bellek.set(grup, p);
  }
  return p;
}

