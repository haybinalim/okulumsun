import { useEffect, useState } from 'react';
import { turVerisiniOku } from '../../content/dersler/tur/veriYukleyici';
import type { TurHamleDosyasi } from '../../content/schema/turHamle';

/**
 * Hamle verisini (`ders-verisi/tur/hamleler.json` → bayraklı derlemede `./tur/hamleler.json`) aynı kökenden bir kez
 * okur ve bellekte tutar (ADR-0016). Şema CI'da zod ile denetlenir (`npm run validate`); çalışma anında zod
 * yüklenmez, yalnız biçim kabaca sınanır. Hiçbir şey yazılmaz.
 */
let bellek: Promise<TurHamleDosyasi> | null = null;

export function hamleVerisiBicimliMi(d: unknown): d is TurHamleDosyasi {
  if (typeof d !== 'object' || d === null) return false;
  const g = (d as { glifler?: unknown }).glifler;
  return (
    Array.isArray(g) &&
    g.length === 68 &&
    g.every(
      (x: unknown) =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as { glif?: unknown }).glif === 'string' &&
        Array.isArray((x as { hamleler?: unknown }).hamleler) &&
        (x as { hamleler: { noktalar?: unknown }[] }).hamleler.every(
          (h) => Array.isArray(h.noktalar) && h.noktalar.length >= 2,
        ),
    )
  );
}

export function hamleVerisiniYukle(): Promise<TurHamleDosyasi> {
  bellek ??= turVerisiniOku('hamleler.json').then((d) => {
    if (!hamleVerisiBicimliMi(d)) throw new Error('hamleler.json biçimi beklenen gibi değil.');
    return d;
  });
  bellek.catch(() => {
    bellek = null; // bir sonraki açılışta yeniden denenir
  });
  return bellek;
}

export type HamleVerisiDurumu =
  | { readonly durum: 'yukleniyor' }
  | { readonly durum: 'hazir'; readonly veri: TurHamleDosyasi }
  | { readonly durum: 'hata'; readonly mesaj: string };

export function useHamleVerisi(): HamleVerisiDurumu {
  const [s, setS] = useState<HamleVerisiDurumu>({ durum: 'yukleniyor' });
  useEffect(() => {
    let iptal = false;
    hamleVerisiniYukle().then(
      (veri) => !iptal && setS({ durum: 'hazir', veri }),
      (e: unknown) => !iptal && setS({ durum: 'hata', mesaj: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      iptal = true;
    };
  }, []);
  return s;
}
