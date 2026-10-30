import { SATIR } from './hamleCizim';

/**
 * Satır dizgesi (Okuma Yazma planı §2.4.9–10): üst çizgi ve taban düz, aradaki kılavuz kesikli. 0–100 birim; üst ve alt
 * bölge eşit (1 cm = 60 birim → 0,5 + 0,5 cm). Kesik kendi `stroke-dasharray`imiz (KesikCizgi fontu yok).
 * Kuyruk sınırı çizilmez: program üç çizgi ister, kuyruk tabanın altına dengeli taşar.
 */
export function SatirDizgesi({ genislik, x = 0, renk = '#8A8578' }: { genislik: number; x?: number; renk?: string }) {
  return (
    <g data-satir-dizgesi="" aria-hidden="true">
      <line x1={x} x2={x + genislik} y1={SATIR.ust} y2={SATIR.ust} stroke={renk} strokeWidth={0.8} />
      <line
        x1={x}
        x2={x + genislik}
        y1={SATIR.kilavuz}
        y2={SATIR.kilavuz}
        stroke={renk}
        strokeWidth={0.6}
        strokeDasharray="3 2.5"
      />
      <line x1={x} x2={x + genislik} y1={SATIR.taban} y2={SATIR.taban} stroke={renk} strokeWidth={0.8} />
    </g>
  );
}
