import { useEffect, useState } from 'react';
import { turVerisiniOku } from '../../content/dersler/tur/veriYukleyici';
import { metinParcasiniYukle } from '../../content/dersler/tur/sablonlar/metinKayit';
import type { TurHavuzMetni } from '../../content/dersler/tur/sablonlar/turSoru';

/**
 * Okuma metni verisi (Okuma Yazma Adım 80): metin parçası (`turMetin-*.js`, ayrı tembel JS) + metin havuzu
 * (`ders-verisi/tur/icerik/metinler.json` → `./tur/icerik/metinler.json`, aynı köken). İkisi birlikte, bir kez yüklenir
 * ve bellekte tutulur; yalnız `gerekli` iken (T-13, metinli set, katalog, "Metni oku"). Hiçbir şey saklanmaz. Yükleme
 * düşerse `hata` döner: ekranlar bunu açıkça gösterir (boş ekran başarı gibi görünmez).
 */
const METIN_DOSYASI = 'icerik/metinler.json';
let bellek: Promise<TurHavuzMetni[]> | null = null;

export function metinVerisiniYukle(): Promise<TurHavuzMetni[]> {
  bellek ??= Promise.all([metinParcasiniYukle(), turVerisiniOku(METIN_DOSYASI)]).then(([m, ham]) => m.metinHavuzunuAyristir(ham));
  bellek.catch(() => {
    bellek = null;
  });
  return bellek;
}

export type MetinVerisiDurumu =
  | { readonly durum: 'yok' }
  | { readonly durum: 'yukleniyor' }
  | { readonly durum: 'hazir'; readonly metinler: readonly TurHavuzMetni[] }
  | { readonly durum: 'hata'; readonly mesaj: string };

export function useMetinVerisi(gerekli: boolean): MetinVerisiDurumu {
  const [s, setS] = useState<MetinVerisiDurumu>({ durum: 'yukleniyor' });
  useEffect(() => {
    if (!gerekli) return;
    let iptal = false;
    metinVerisiniYukle().then(
      (metinler) => !iptal && setS({ durum: 'hazir', metinler }),
      (e: unknown) => !iptal && setS({ durum: 'hata', mesaj: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      iptal = true;
    };
  }, [gerekli]);
  return gerekli ? s : { durum: 'yok' };
}
