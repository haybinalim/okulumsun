/**
 * Metin şablonu kaydı (Okuma Yazma Adım 80). SAF kayıt + tek `import()`; `cumleKayit.ts` ile aynı desen.
 *
 * T-13'ün üreticisi ayrı tembel parçadadır (`metin/turMetin.ts`). `TUR_SABLONLARI` eşzamanlı kalır: T-13'ün `uret`'i
 * buradaki kayda bakar; parça yüklenmemişse `TurUretimHatasi` fırlatır (arayüz önce `metinParcasiniYukle()`'yi bekler).
 * Testler parçayı doğrudan içe aktarıp `metinUreticileriniKaydet` ile kaydeder.
 */
import { TurUretimHatasi, type TurMetinSablonKodu, type TurSoru, type TurUretimGirdisi } from './turSoru';

type Uretici = (g: TurUretimGirdisi) => TurSoru;
let kayit: Readonly<Partial<Record<TurMetinSablonKodu, Uretici>>> = {};

export function metinUreticileriniKaydet(u: Readonly<Partial<Record<TurMetinSablonKodu, Uretici>>>): void {
  kayit = u;
}

export function metinParcasiYuklendiMi(): boolean {
  return Object.keys(kayit).length > 0;
}

/** Şablon kaydındaki `uret`: parça yüklüyse üreticiyi çağırır. */
export function metinUreticisi(kod: TurMetinSablonKodu): Uretici {
  return (g) => {
    const f = kayit[kod];
    if (!f) throw new TurUretimHatasi('Metin etkinlikleri henüz yüklenmedi.');
    return f(g);
  };
}

export type MetinParcasi = typeof import('./metin/turMetin');

let parca: Promise<MetinParcasi> | null = null;

/** Metin parçasını bir kez yükler ve üreticileri kaydeder (hata olursa sonraki çağrı yeniden dener). */
export function metinParcasiniYukle(): Promise<MetinParcasi> {
  parca ??= import('./metin/turMetin').then((m) => {
    metinUreticileriniKaydet(m.TUR_METIN_URETICILERI);
    return m;
  });
  parca.catch(() => {
    parca = null;
  });
  return parca;
}
