/**
 * Gölgeli gövde ve ortak çizim parçaları (plan v2 Adım 59, KG-104).
 * Stil kuralları: `docs/tasarim/nesne-cizim-rehberi.md`.
 */
import type { ReactNode } from 'react';
import type { NesneTonlari } from './renkTonlari';
import { golgeKaydirmasi, INCE, KONTUR } from './cizimYardimcilari';

/** Maske alanı: hem 100 birimlik sprite kutusunu hem piksel koordinatlı materyalleri kapsar. */
const MASKE = { x: -4000, y: -4000, g: 8000 } as const;

/**
 * Gölgeli gövde: temel dolgu → (ayrıntılar) → sağ alt gölge hilali → ışık → kontur.
 * Gölge hilali, gövdenin sol üste kaydırılmış kopyasının maskeyle çıkarılmasıyla elde edilir; böylece
 * her biçimde kendiliğinden gövdenin hatlarını izler. `ic` ve `isik` gövdeye kırpılır. `k` örnek
 * başına tek olmalı (`useId` + parça eki).
 */
export function Govde({
  d,
  t,
  k,
  ofset = 6,
  donus = 0,
  golgeOpak = 1,
  ic,
  isik,
  sw = KONTUR,
}: {
  d: string;
  t: NesneTonlari;
  k: string;
  ofset?: number;
  donus?: number;
  golgeOpak?: number;
  ic?: ReactNode;
  isik?: ReactNode;
  sw?: number;
}) {
  const [dx, dy] = golgeKaydirmasi(ofset, donus);
  return (
    <g>
      <defs>
        <mask id={`${k}m`} maskUnits="userSpaceOnUse" x={MASKE.x} y={MASKE.y} width={MASKE.g} height={MASKE.g}>
          <rect x={MASKE.x} y={MASKE.y} width={MASKE.g} height={MASKE.g} fill="#fff" />
          <path d={d} fill="#000" transform={`translate(${dx} ${dy})`} />
        </mask>
        {(ic || isik) && (
          <clipPath id={`${k}k`}>
            <path d={d} />
          </clipPath>
        )}
      </defs>
      <path d={d} fill={t.temel} />
      {ic && <g clipPath={`url(#${k}k)`}>{ic}</g>}
      <path d={d} fill={t.golge} mask={`url(#${k}m)`} opacity={golgeOpak} />
      {isik && <g clipPath={`url(#${k}k)`}>{isik}</g>}
      {sw > 0 && <path d={d} fill="none" stroke={t.kontur} strokeWidth={sw} strokeLinejoin="round" />}
    </g>
  );
}

/** Basit tek tonlu parça (gaga, far…): dolgu + kontur. */
export function Parca({ d, fill, kontur, sw = INCE }: { d: string; fill: string; kontur: string; sw?: number }) {
  return <path d={d} fill={fill} stroke={kontur} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />;
}

/** Yumuşak zemin gölgesi (100 birimlik kutuda). Uçan nesnelerde daha küçük ve silik. */
export function Zemin({ rx = 30, cy = 94, silik = false }: { rx?: number; cy?: number; silik?: boolean }) {
  return <ellipse cx="50" cy={cy} rx={rx} ry={rx * 0.14} fill="#2B2B2B" opacity={silik ? 0.08 : 0.14} />;
}
