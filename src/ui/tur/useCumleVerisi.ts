import { useEffect, useState } from 'react';
import { turVerisiniOku } from '../../content/dersler/tur/veriYukleyici';
import { cumleParcasiniYukle } from '../../content/dersler/tur/sablonlar/cumleKayit';
import type { TurHavuzCumlesi } from '../../content/dersler/tur/sablonlar/turSoru';

/**
 * Cümle verisi (Okuma Yazma Adım 74; KG-156): cümle parçası (`turCumle-*.js`, ayrı tembel JS) + cümle havuzu
 * (`ders-verisi/tur/icerik/cumleler.json` → `./tur/icerik/cumleler.json`, aynı köken). İkisi birlikte, bir kez
 * yüklenir ve bellekte tutulur; yalnız `gerekli` iken (cümle şablonu, cümleli set, katalog, koro okuma). Hiçbir şey yazılmaz.
 */
const CUMLE_DOSYASI = 'icerik/cumleler.json';
let bellek: Promise<TurHavuzCumlesi[]> | null = null;

export function cumleVerisiniYukle(): Promise<TurHavuzCumlesi[]> {
  bellek ??= Promise.all([cumleParcasiniYukle(), turVerisiniOku(CUMLE_DOSYASI)]).then(([m, ham]) => m.cumleHavuzunuAyristir(ham));
  bellek.catch(() => {
    bellek = null;
  });
  return bellek;
}

export type CumleVerisiDurumu =
  | { readonly durum: 'yok' }
  | { readonly durum: 'yukleniyor' }
  | { readonly durum: 'hazir'; readonly cumleler: readonly TurHavuzCumlesi[] }
  | { readonly durum: 'hata'; readonly mesaj: string };

export function useCumleVerisi(gerekli: boolean): CumleVerisiDurumu {
  const [s, setS] = useState<CumleVerisiDurumu>({ durum: 'yukleniyor' });
  useEffect(() => {
    if (!gerekli) return;
    let iptal = false;
    cumleVerisiniYukle().then(
      (cumleler) => !iptal && setS({ durum: 'hazir', cumleler }),
      (e: unknown) => !iptal && setS({ durum: 'hata', mesaj: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      iptal = true;
    };
  }, [gerekli]);
  return gerekli ? s : { durum: 'yok' };
}
