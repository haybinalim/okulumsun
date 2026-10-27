/**
 * Gölgeli gövde ve ortak çizim parçaları (plan v2 Adım 59, KG-104).
 * Stil kuralları: `docs/tasarim/nesne-cizim-rehberi.md`.
 */
import type { ReactNode } from 'react';
import type { NesneTonlari } from './renkTonlari';
import { golgeKaydirmasi, INCE, KONTUR } from './cizimYardimcilari';

/** Gölge hilali için "her yer" dikdörtgeni: hem 100 birimlik sprite kutusunu hem piksel koordinatlı materyalleri kapsar. */
const HER_YER = 'M-4000 -4000H4000V4000H-4000Z';

/**
 * Gölgeli gövde: temel dolgu → (ayrıntılar) → sağ alt gölge hilali → ışık → kontur.
 * Gölge hilali = gövde ∩ (her yer − gövdenin sol üste kaydırılmış kopyası): `evenodd` dolgulu tek yol, gövdeye kırpılır.
 * Böylece her biçimde kendiliğinden gövdenin hatlarını izler. Maske kullanılmaz (baskıda/PDF'te vektör kalır, raster
 * maske yükü yok). `ic` ve `isik` de gövdeye kırpılır. `k` örnek başına tek olmalı (`useId` + parça eki).
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
  const kirp = `url(#${k}k)`;
  return (
    <g>
      <defs>
        <clipPath id={`${k}k`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={t.temel} />
      <g clipPath={kirp}>
        {ic}
        <path
          d={HER_YER + d}
          fillRule="evenodd"
          transform={`translate(${dx} ${dy})`}
          fill={t.golge}
          opacity={golgeOpak === 1 ? undefined : golgeOpak}
        />
        {isik}
      </g>
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
