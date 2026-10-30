import type { TurHamleGlifi } from '../../content/schema/turHamle';
import { SatirDizgesi } from './SatirDizgesi';
import { cerceve, KALEM, KESIK_DIZISI, yolVerisi, yonOku, zamanlama, type Hiz } from './hamleCizim';
import './tur.css';

/**
 * Bir glifin yazılışı (Adım 64): satır dizgesi + hamleler. Font yok; çizgi kendi orta çizgimizden.
 *
 * Kipler:
 *  - `oynat`: hamleler sırayla çizilir (CSS `stroke-dashoffset`), her hamle başlarken numarası ve yön oku belirir.
 *    `anahtar` değişince baştan oynar.
 *  - `adim`: ilk `adim` hamle tam çizili, son çizilen vurgulu ve numaralı/oklu; kalan hamleler soluk iz olarak görünür.
 *    Azaltılmış harekette tek kip budur (statik kareler).
 *  - `kesikli`: bütün hamleler kesik çizgiyle (izleme önizlemesi), numara ve oklar görünür.
 *  - `tam`: düz çizim, numarasız (seçim düğmesi).
 * Renk tek başına anlam taşımaz: sıra numarayla ve okla da verilir; kırmızı yok.
 */
export interface YazilisGlifiOzellikleri {
  readonly glif: TurHamleGlifi;
  readonly kip: 'oynat' | 'adim' | 'kesikli' | 'tam';
  readonly adim?: number;
  readonly hiz?: Hiz;
  readonly anahtar?: number;
  readonly vurgu?: string;
  /** Satır dizgesi iki yana ne kadar taşar (birim). */
  readonly kenar?: number;
  readonly cizgiler?: boolean;
  readonly etiket?: string;
}

const MUREKKEP = '#2B2B2B';
const IZ = '#D9D4C7';
const OK = '#1D4ED8';

export function YazilisGlifi({
  glif,
  kip,
  adim = glif.hamleler.length,
  hiz = 'orta',
  anahtar = 0,
  vurgu = '#0F766E',
  kenar = 18,
  cizgiler = true,
  etiket,
}: YazilisGlifiOzellikleri) {
  const c = cerceve(glif, kenar);
  const z = zamanlama(glif.hamleler, hiz);
  const numarali = kip !== 'tam';
  return (
    <svg
      viewBox={c.viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={etiket}
      data-yazilis-kip={kip}
      data-yazilis-adim={kip === 'adim' ? adim : undefined}
      style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
    >
      {cizgiler && <SatirDizgesi genislik={c.genislik} />}
      <g key={`${kip}-${anahtar}`} transform={`translate(${c.dx} 0)`}>
        {glif.hamleler.map((h, i) => {
          const d = yolVerisi(h.noktalar);
          const ortak = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
          if (kip === 'tam') return <path key={i} d={d} stroke={MUREKKEP} strokeWidth={KALEM + 1} {...ortak} />;
          if (kip === 'kesikli')
            return <path key={i} d={d} stroke={MUREKKEP} strokeWidth={1.4} strokeDasharray={KESIK_DIZISI} {...ortak} />;
          if (kip === 'adim') {
            const cizili = i < adim;
            return (
              <g key={i}>
                <path d={d} stroke={IZ} strokeWidth={KALEM} {...ortak} />
                {cizili && (
                  <path
                    d={d}
                    data-hamle={h.sira}
                    stroke={i === adim - 1 ? vurgu : MUREKKEP}
                    strokeWidth={KALEM}
                    {...ortak}
                  />
                )}
              </g>
            );
          }
          return (
            <g key={i}>
              <path d={d} stroke={IZ} strokeWidth={KALEM} {...ortak} />
              <path
                d={d}
                data-hamle={h.sira}
                pathLength={1}
                stroke={MUREKKEP}
                strokeWidth={KALEM}
                strokeDasharray="1 1"
                className="tur-hamle-ciz"
                style={{ animationDuration: `${z[i].sure}s`, animationDelay: `${z[i].gecikme}s` }}
                {...ortak}
              />
            </g>
          );
        })}
        {numarali &&
          glif.hamleler.map((h, i) => {
            if (kip === 'adim' && i !== adim - 1) return null;
            const o = yonOku(h.noktalar);
            const belir = kip === 'oynat' ? { className: 'tur-belir', style: { animationDelay: `${z[i].gecikme}s` } } : {};
            return (
              <g key={`ok-${i}`} data-yon-oku={h.sira} {...belir}>
                <line
                  x1={o.govde[0][0]}
                  y1={o.govde[0][1]}
                  x2={o.govde[1][0]}
                  y2={o.govde[1][1]}
                  stroke={OK}
                  strokeWidth={1.3}
                  strokeLinecap="round"
                />
                <polygon points={o.uc.map((p) => p.join(',')).join(' ')} fill={OK} />
                <circle cx={o.numara[0]} cy={o.numara[1]} r={3.6} fill="#FFFFFF" stroke={OK} strokeWidth={1} />
                <text
                  x={o.numara[0]}
                  y={o.numara[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={4.6}
                  fontWeight={700}
                  fill={OK}
                  style={{ fontFamily: 'TemelYaziRakam, TemelYazi, sans-serif' }}
                >
                  {h.sira}
                </text>
              </g>
            );
          })}
      </g>
    </svg>
  );
}
