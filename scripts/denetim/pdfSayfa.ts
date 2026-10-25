/**
 * PDF sayfa sayacı (KG-102): kütüphanesiz. Chromium (Skia) PDF'inde sayfa nesneleri sıkıştırılmamış sözlüklerdir
 * (`/Type /Page`); nesne akışı (`/ObjStm`) kullanılmaz. Nesne akışlı bir PDF gelirse sayım güvenilmez → hata.
 * Arşiv/etki PDF üretim betikleri, birim test ve e2e "PDF sayfa sayısı = altbilgi toplamı" denetiminde kullanır.
 */
export function pdfSayfaSayisi(pdf: Uint8Array): number {
  const metin = Buffer.from(pdf).toString('latin1');
  if (!metin.startsWith('%PDF-')) throw new Error('PDF değil.');
  if (metin.includes('/ObjStm')) throw new Error('Nesne akışlı PDF: sayfa sayısı bu sayaçla güvenilir değil.');
  return (metin.match(/\/Type\s*\/Page(?![A-Za-z])/g) ?? []).length;
}

/** Basılı kopyanın beyan ettiği toplam (`data-sayfa-sayisi`) ve altbilgilerdeki "Sayfa n / N" dizisi. */
export interface BaskiBeyani {
  readonly toplam: number;
  readonly altbilgiler: readonly string[];
}

/**
 * PDF ile basılı kopyanın beyanını karşılaştırır; uyuşmazlık metni ya da `null`. Kural: PDF sayfa sayısı = N ve
 * altbilgiler sırayla "1/N" … "N/N".
 */
export function sayfaUyusmazligi(pdf: Uint8Array, beyan: BaskiBeyani): string | null {
  const n = pdfSayfaSayisi(pdf);
  const beklenen = Array.from({ length: beyan.toplam }, (_, i) => `${i + 1}/${beyan.toplam}`);
  if (n !== beyan.toplam) return `PDF ${n} sayfa, altbilgi toplamı ${beyan.toplam}`;
  if (beyan.altbilgiler.join(',') !== beklenen.join(',')) return `altbilgiler ${beyan.altbilgiler.join(',')}`;
  return null;
}

/**
 * Tarayıcıda basılı kopyanın beyanını okuyan ifade (`page.evaluate(BASKI_BEYANI_IFADESI)`). Metin olarak tutulur:
 * tsx/esbuild'in işlev gövdesine eklediği yardımcılar (`__name`) tarayıcıda tanımsızdır.
 */
export const BASKI_BEYANI_IFADESI = `(() => {
  const kok = document.querySelector('.kg-kok--baski');
  const sayfalar = kok ? [...kok.querySelectorAll(':scope > .kg-sayfa')] : [];
  return {
    toplam: Number(kok?.dataset.sayfaSayisi ?? 0),
    altbilgiler: sayfalar.map((s) => /Sayfa (\\d+) \\/ (\\d+)/.exec(s.querySelector('.kg-alt')?.textContent ?? '')?.slice(1).join('/') ?? '?'),
  };
})()`;
