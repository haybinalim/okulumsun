/**
 * Eve link kökü (plan v2 Adım 42 aşama 3, ADR-0010). Uygulama http(s) üzerinden açıldıysa
 * o adresin kökü (önizleme, alt dizin, özel alan adı doğru çalışır); `file://` veya başka bir
 * şemadan açıldıysa kanonik yayın adresi (docs/yayin.md, KG-18).
 */
export const KANONIK_YAYIN_ADRESI = 'https://okulumsun-tc.vercel.app';

export function eveLinkKoku(konum: { readonly protocol: string; readonly origin: string }, tabanYol: string): string {
  if (konum.protocol !== 'http:' && konum.protocol !== 'https:') return KANONIK_YAYIN_ADRESI;
  return `${konum.origin}${tabanYol.startsWith('/') ? tabanYol : `/${tabanYol}`}`;
}
