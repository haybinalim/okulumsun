/**
 * TÜRKÇE DERS PAKETİ GİRİŞİ (Okuma Yazma planı Adım 61, ADR-0016).
 *
 * YALNIZ `VITE_DERS_TUR=1` derlemesinde, `main.tsx`'teki tek dinamik `import()` ile yüklenir. Üretim
 * derlemesinde bayrak tanımsızdır; dal ve bu modül ölü kod olarak atılır. CI, `TUR_IMLECI` dizgesinin
 * `dist/` içinde OLMADIĞINI denetler (e2e kancası denetimi gibi). Bugün kullanıcıya görünen bir şey
 * eklemez: yalnız paketin yüklendiğini kökte görünmez bir öznitelikle bildirir (bayraklı derleme e2e/ölçüm).
 */
export { turVerisiniOku, turVeriYolu, TUR_VERI_KOKU } from './veriYukleyici';

/** CI imleci: bu dizge üretim `dist/` içinde bulunursa derleme kırmızıdır. */
export const TUR_IMLECI = '__okulumsunTUR__';

export function turDersiniKaydet(kok: HTMLElement = document.documentElement): void {
  kok.dataset.dersTur = TUR_IMLECI;
}
