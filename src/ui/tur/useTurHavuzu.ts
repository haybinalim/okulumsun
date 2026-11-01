import { useEffect, useState } from 'react';
import { turVerisiniOku } from '../../content/dersler/tur/veriYukleyici';
import { havuzuAyristir, TUR_HAVUZ_DOSYASI } from '../../content/dersler/tur/sablonlar/havuz';
import type { TurHavuzSozcugu } from '../../content/dersler/tur/sablonlar/turSoru';

/**
 * Sözcük havuzunu (`ders-verisi/tur/icerik/sozcukler.json` → `./tur/icerik/sozcukler.json`) aynı kökenden bir kez okur
 * ve bellekte tutar (ADR-0016). YALNIZ bayraklı derlemede. Hiçbir şey yazılmaz.
 */
let bellek: Promise<TurHavuzSozcugu[]> | null = null;

export function turHavuzunuYukle(): Promise<TurHavuzSozcugu[]> {
  bellek ??= turVerisiniOku(TUR_HAVUZ_DOSYASI).then(havuzuAyristir);
  bellek.catch(() => {
    bellek = null;
  });
  return bellek;
}

export type HavuzDurumu =
  | { readonly durum: 'yukleniyor' }
  | { readonly durum: 'hazir'; readonly havuz: readonly TurHavuzSozcugu[] }
  | { readonly durum: 'hata'; readonly mesaj: string };

export function useTurHavuzu(): HavuzDurumu {
  const [s, setS] = useState<HavuzDurumu>({ durum: 'yukleniyor' });
  useEffect(() => {
    let iptal = false;
    turHavuzunuYukle().then(
      (havuz) => !iptal && setS({ durum: 'hazir', havuz }),
      (e: unknown) => !iptal && setS({ durum: 'hata', mesaj: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      iptal = true;
    };
  }, []);
  return s;
}
