/**
 * Nesne ve materyal çizimlerinin ortak geometri yardımcıları (plan v2 Adım 59, KG-104).
 * Saf; JSX yok. Stil kuralları: `docs/tasarim/nesne-cizim-rehberi.md`.
 */

/** Sprite kontur kalınlığı (100 birimlik kutuda; 64 px'te ≈2,2 px, tahtada 102 px'te ≈3,6 px). */
export const KONTUR = 3.5;
/** Ayrıntı çizgisi (gaga, cam, yaprak…): konturun ~%70'i. */
export const INCE = 2.4;
/** Materyallerde (piksel koordinatlı) kontur: kısa kenarın oranı, alt sınır 2 px. */
export function materyalKonturu(kisaKenar: number): number {
  return Math.max(2, Math.round(kisaKenar * 0.022 * 10) / 10);
}

/** Çember yolu (maske/kontur için tek `d` dizesi). */
export function daire(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
}

/** Köşeleri yuvarlatılmış dikdörtgen yolu. */
export function yuvarlakDikdortgen(x: number, y: number, g: number, y2: number, r: number): string {
  const rr = Math.max(0, Math.min(r, g / 2, y2 / 2));
  return (
    `M${x + rr} ${y}L${x + g - rr} ${y}Q${x + g} ${y} ${x + g} ${y + rr}L${x + g} ${y + y2 - rr}` +
    `Q${x + g} ${y + y2} ${x + g - rr} ${y + y2}L${x + rr} ${y + y2}Q${x} ${y + y2} ${x} ${y + y2 - rr}` +
    `L${x} ${y + rr}Q${x} ${y} ${x + rr} ${y}Z`
  );
}

/** Mutlak komutlu (M L C Q Z) yolu x = eksen doğrusuna göre aynalar — simetrik kanatlar için. */
export function aynala(d: string, eksen = 50): string {
  let sira = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (s) =>
    sira++ % 2 === 0 ? String(Math.round((2 * eksen - Number(s)) * 100) / 100) : s,
  );
}

/**
 * Gölge hilalinin kaydırması: ışık sol üstte; şekil `donus` derece döndürülmüşse kaydırma ters
 * döndürülür ki ekranda gölge yine sağ altta kalsın.
 */
export function golgeKaydirmasi(ofset: number, donus = 0): [number, number] {
  const a = (-donus * Math.PI) / 180;
  const x = -ofset * 0.8;
  const y = -ofset;
  return [Math.round((x * Math.cos(a) - y * Math.sin(a)) * 100) / 100, Math.round((x * Math.sin(a) + y * Math.cos(a)) * 100) / 100];
}

/** React `useId` çıktısını SVG/CSS `url(#…)` için güvenli kimliğe çevirir. */
export function guvenliKimlik(ham: string): string {
  return 'c' + ham.replace(/[^a-zA-Z0-9_-]/g, '');
}
