/**
 * Nesne kümesi yerleşim konumları — Visual (çizim) ve TappableScene (dokunma)
 * AYNI konumları kullansın diye burada, JSX'siz bir modülde.
 *
 * Tüm konumlar normalize (0..1). Layout, kazanımın kendisi (MAT.1.1.2:
 * "dağınık veya düzenli") — çocuğun dağınıkta zorlanması beklenen bir durumdur.
 */

/** Yerleşim biçimine göre normalize konum dizisi üretir (deterministik). */
export function nesneKonumlari(
  spec: {
    adet: number;
    layout: 'sira' | 'gruplu' | 'onlukCerceve' | 'dagınık';
    konumlar?: readonly { x: number; y: number }[];
  },
): readonly { x: number; y: number }[] {
  const n = spec.adet;
  if (spec.layout === 'dagınık' && spec.konumlar && spec.konumlar.length >= n) {
    return spec.konumlar.slice(0, n);
  }
  if (spec.layout === 'onlukCerceve') {
    return onlukKonumlari(spec.adet);
  }
  if (spec.layout === 'gruplu') {
    const yarisi = Math.ceil(n / 2);
    const sol = siraKonumlari(yarisi, 0.04, 0.42);
    const sag = siraKonumlari(n - yarisi, 0.54, 0.96);
    return [...sol, ...sag];
  }
  return siraKonumlari(n, 0.04, 0.96);
}

/** n nesneyi soldan sağa, satırlara sararak [x0..x1] aralığına dizer. */
function siraKonumlari(n: number, x0: number, x1: number): readonly { x: number; y: number }[] {
  if (n <= 0) return [];
  const sutun = Math.min(n, Math.max(1, Math.round(Math.sqrt(n))));
  const satir = Math.ceil(n / sutun);
  const adimX = sutun > 1 ? (x1 - x0) / (sutun - 1) : 0;
  const adimY = satir > 1 ? 0.85 / (satir - 1) : 0;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / sutun);
    const c = i % sutun;
    out.push({ x: x0 + c * adimX, y: 0.12 + r * adimY });
  }
  return out;
}

/** Onluk çerçeve konumları: 5 sütun × 2 satır. */
function onlukKonumlari(n: number): readonly { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const kalan = i % 10;
    const satir = Math.floor(kalan / 5);
    const sutun = kalan % 5;
    out.push({ x: 0.1 + sutun * 0.18, y: 0.12 + satir * 0.4 });
  }
  return out;
}
