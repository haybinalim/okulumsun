/**
 * SINIF KAVANOZU — ortak hedef görseli (plan v2 Adım 36, ADR-0008).
 *
 * Tamamlanan her tur kavanoza bir yaprak ekler. Kavanoz yüzde, sayı veya "kaç kaldı"
 * GÖSTERMEZ (PLAN §7.4): yalnız yaprakların görsel dolgusu. Dokunulmaz.
 */
import { memo } from 'react';

const YAPRAK_RENKLERI = ['#059669', '#16A34A', '#65A30D', '#0D9488'] as const;

/** Kavanoz içindeki yaprak konumu (determinist; viewBox 0 0 100 120). */
function yaprakKonumu(i: number, hedef: number): { x: number; y: number; aci: number } {
  const sutun = 4;
  const satirSayisi = Math.max(1, Math.ceil(hedef / sutun));
  const satir = Math.floor(i / sutun);
  const kol = i % sutun;
  const kayma = satir % 2 === 0 ? 0 : 7;
  const altY = 106;
  const ustY = 40;
  const adim = (altY - ustY) / satirSayisi;
  return { x: 24 + kol * 17 + kayma, y: altY - adim * (satir + 0.5), aci: ((i * 47) % 70) - 35 };
}

export const SinifKavanozu = memo(function SinifKavanozu({
  kavanoz,
  hedef,
  boyut,
}: {
  kavanoz: number;
  hedef: number;
  /** Piksel yüksekliği. */
  boyut: number;
}) {
  const dolu = kavanoz >= hedef;
  const yapraklar = Array.from({ length: Math.min(kavanoz, hedef) }, (_, i) => yaprakKonumu(i, hedef));
  return (
    <svg
      viewBox="0 0 100 120"
      width={(boyut * 100) / 120}
      height={boyut}
      role="img"
      aria-label={dolu ? 'Sınıf kavanozu doldu' : kavanoz === 0 ? 'Sınıf kavanozu boş' : 'Sınıf kavanozu doluyor'}
      data-kavanoz={dolu ? 'dolu' : 'doluyor'}
    >
      {/* Kapak */}
      <rect x="26" y="6" width="48" height="12" rx="4" fill="#A16207" />
      {/* Gövde */}
      <path
        d="M30 18 H70 V26 C84 30 88 40 88 54 V102 C88 112 82 116 72 116 H28 C18 116 12 112 12 102 V54 C12 40 16 30 30 26 Z"
        fill="#E0F2FE"
        stroke="#0F172A"
        strokeWidth="3"
        opacity="0.95"
      />
      {yapraklar.map((y, i) => (
        <ellipse
          key={i}
          cx={y.x}
          cy={y.y}
          rx="8"
          ry="4.5"
          transform={`rotate(${y.aci} ${y.x} ${y.y})`}
          fill={YAPRAK_RENKLERI[i % YAPRAK_RENKLERI.length]}
          stroke="#064E3B"
          strokeWidth="1"
        />
      ))}
      {/* Parıltı */}
      <path d="M22 50 V96" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
});
