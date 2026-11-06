/**
 * Cümle şablonları kaydı (Okuma Yazma Adım 74; KG-156). SAF kayıt + tek `import()`.
 *
 * Cümle şablonlarının üreticileri ayrı tembel parçadadır (`cumle/turCumle.ts`). `TUR_SABLONLARI` eşzamanlı kalır:
 * T-10/T-11/T-12'nin `uret`'i buradaki kayda bakar; parça yüklenmemişse `TurUretimHatasi` fırlatır (arayüz önce
 * `cumleParcasiniYukle()`'yi bekler). Testler parçayı doğrudan içe aktarıp `cumleUreticileriniKaydet` ile kaydeder.
 */
import { TurUretimHatasi, type TurCumleSablonKodu, type TurSoru, type TurUretimGirdisi } from './turSoru';

type Uretici = (g: TurUretimGirdisi) => TurSoru;
let kayit: Readonly<Partial<Record<TurCumleSablonKodu, Uretici>>> = {};

export function cumleUreticileriniKaydet(u: Readonly<Partial<Record<TurCumleSablonKodu, Uretici>>>): void {
  kayit = u;
}

export function cumleParcasiYuklendiMi(): boolean {
  return Object.keys(kayit).length > 0;
}

/** Şablon kaydındaki `uret`: parça yüklüyse üreticiyi çağırır. */
export function cumleUreticisi(kod: TurCumleSablonKodu): Uretici {
  return (g) => {
    const f = kayit[kod];
    if (!f) throw new TurUretimHatasi('Cümle etkinlikleri henüz yüklenmedi.');
    return f(g);
  };
}

export type CumleParcasi = typeof import('./cumle/turCumle');

let parca: Promise<CumleParcasi> | null = null;

/** Cümle parçasını bir kez yükler ve üreticileri kaydeder (hata olursa sonraki çağrı yeniden dener). */
export function cumleParcasiniYukle(): Promise<CumleParcasi> {
  parca ??= import('./cumle/turCumle').then((m) => {
    cumleUreticileriniKaydet(m.TUR_CUMLE_URETICILERI);
    return m;
  });
  parca.catch(() => {
    parca = null;
  });
  return parca;
}
