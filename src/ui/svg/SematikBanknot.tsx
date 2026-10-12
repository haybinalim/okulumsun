/**
 * Şematik banknot (plan v2 Adım 21, KG-19, ADR-0014).
 *
 * TCMB tasarımını TAKLİT ETMEZ: portre, filigran, seri numarası, imza veya TCMB adı yok.
 * Değer rakamı + kupüre özgü renk + desen + boyut oranı; renk tek başına anlam taşımaz.
 * "OYUN PARASI" ibaresi gerçek parayla karıştırılmasını önler.
 * Bugün kâğıt (Adım 35) ve arşiv (Adım 48) için; Adım 29'da ekran da buna geçer.
 */
import type { BanknotDegeri } from '../../exercises/types';
import { SEMATIK_BANKNOT_STILI, type SematikBanknotStili } from '../../content/paraGorseli';

export interface SematikBanknotProps {
  readonly deger: BanknotDegeri;
  /** Piksel genişlik; yükseklik kupür oranından hesaplanır. */
  readonly genislik: number;
}

function Desen({ id, stil }: { id: string; stil: SematikBanknotStili }) {
  const c = stil.kontur;
  const ortak = { stroke: c, strokeOpacity: 0.35, fill: 'none', strokeWidth: 1.5 } as const;
  const icerik = {
    nokta: <circle cx="6" cy="6" r="2" fill={c} fillOpacity={0.3} />,
    cizgi: <line x1="0" y1="6" x2="12" y2="6" {...ortak} />,
    kare: <rect x="3" y="3" width="6" height="6" {...ortak} />,
    dalga: <path d="M0 6 Q3 2 6 6 T12 6" {...ortak} />,
    capraz: <path d="M0 0 L12 12 M12 0 L0 12" {...ortak} />,
    halka: <circle cx="6" cy="6" r="3.5" {...ortak} />,
  }[stil.desen];
  return (
    <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
      {icerik}
    </pattern>
  );
}

export function SematikBanknot({ deger, genislik }: SematikBanknotProps) {
  const stil = SEMATIK_BANKNOT_STILI[deger];
  const g = 200;
  const y = Math.round(g / stil.oran);
  const desenId = `sematik-desen-${deger}`;
  return (
    <svg
      role="img"
      aria-label={`${deger} lira, oyun parası`}
      viewBox={`0 0 ${g} ${y}`}
      width={genislik}
      height={Math.round(genislik / stil.oran)}
      data-sematik-banknot={deger}
    >
      <defs>
        <Desen id={desenId} stil={stil} />
      </defs>
      <rect x="2" y="2" width={g - 4} height={y - 4} rx="10" fill={stil.renk} stroke={stil.kontur} strokeWidth="3" />
      <rect x="10" y="10" width={g - 20} height={y - 20} rx="6" fill={`url(#${desenId})`} />
      <circle cx={g * 0.3} cy={y / 2} r={y * 0.3} fill="#FFFFFF" fillOpacity={0.85} stroke={stil.kontur} strokeWidth="2" />
      <text
        x={g * 0.3}
        y={y / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Andika, sans-serif"
        fontWeight="700"
        fontSize={deger >= 100 ? y * 0.26 : y * 0.32}
        fill={stil.kontur}
      >
        {deger}
      </text>
      <text x={g * 0.72} y={y * 0.42} textAnchor="middle" fontFamily="Andika, sans-serif" fontWeight="700" fontSize={y * 0.22} fill={stil.kontur}>
        {deger} TL
      </text>
      <text x={g * 0.72} y={y * 0.72} textAnchor="middle" fontFamily="Andika, sans-serif" fontSize={y * 0.1} fill={stil.kontur}>
        OYUN PARASI
      </text>
    </svg>
  );
}
