/**
 * NESNE SPRİTE'LARI — programatik SVG (plan §8).
 *
 * NEDEN elle çizilmiş basit SVG: plan §8 "AI görsel üretimi reddedildi" der.
 * Çocuk sayma öğrenirken nesnenin NE olduğundan çok KAÇ tane olduğunu sayar;
 * ayrıştırıcı ama tanınabilir bir ikon yeterlidir ve her cihazda aynı görünür
 * (çevrimdışı, font bağımsız, ölçeklenebilir). Her sprite tek bir `fill` rengini
 * kabul eder — bu, jeneratörün `renk` alanına veya varsayılan doğal renge uyar.
 *
 * 100×100 viewBox; `size` piksel boyutudur. Yüzde boyut SVG'de döngüsel çözülür,
 * bu yüzden hesaplanmış px ile verilir (BigButton'daki örüntü).
 */
import type { NesneSprite } from '../../exercises/types';

/** Sprite başına doğal renk — çocuk accenti değil, nesnenin kendi rengi. */
const DOGAL_RENK: Record<NesneSprite, string> = {
  elma: '#D4334A',
  top: '#2563EB',
  balon: '#DB2777',
  araba: '#059669',
  kalem: '#CA8A04',
  kus: '#0EA5E9',
  cicek: '#EC4899',
  yildiz: '#EAB308',
  balik: '#EA580C',
  kelebek: '#7C3AED',
};

export function Sprite({
  name,
  fill,
  size,
}: {
  name: NesneSprite;
  fill?: string;
  size: number;
}) {
  const color = fill ?? DOGAL_RENK[name];
  const dark = '#1f2937'; // sap, gövde çizgisi, göz gibi ayrıntılar
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      width={size}
      height={size}
      style={{ display: 'block' }}
    >
      {shape(name, color, dark)}
    </svg>
  );
}

/** Her sprite'ın çizimi. Basit ama birbirinden ayırt edilebilir. */
function shape(name: NesneSprite, color: string, dark: string) {
  switch (name) {
    case 'elma':
      return (
        <g>
          <circle cx="50" cy="56" r="38" fill={color} />
          <rect x="47" y="8" width="6" height="14" rx="3" fill={dark} />
          <path d="M53 16 Q70 6 76 20 Q60 26 53 18 Z" fill="#059669" />
        </g>
      );
    case 'top':
      return (
        <g>
          <circle cx="50" cy="50" r="40" fill={color} />
          <path d="M14 50 H86 M50 12 V88" stroke={dark} strokeWidth="4" fill="none" opacity="0.35" />
        </g>
      );
    case 'balon':
      return (
        <g>
          <ellipse cx="50" cy="42" rx="34" ry="42" fill={color} />
          <path d="M50 84 L46 90 L54 90 Z" fill={color} />
          <path d="M50 90 Q48 96 50 100" stroke={dark} strokeWidth="3" fill="none" />
        </g>
      );
    case 'araba':
      return (
        <g>
          <rect x="12" y="40" width="76" height="28" rx="10" fill={color} />
          <path d="M26 40 L36 22 H64 L74 40 Z" fill={color} />
          <rect x="38" y="26" width="24" height="12" rx="3" fill="#bfdbfe" />
          <circle cx="30" cy="70" r="10" fill={dark} />
          <circle cx="70" cy="70" r="10" fill={dark} />
          <circle cx="30" cy="70" r="4" fill="#9ca3af" />
          <circle cx="70" cy="70" r="4" fill="#9ca3af" />
        </g>
      );
    case 'kalem':
      return (
        <g>
          <rect x="42" y="10" width="16" height="64" fill={color} transform="rotate(45 50 50)" />
          <rect x="42" y="10" width="16" height="14" fill="#fde68a" transform="rotate(45 50 50)" />
          <path d="M50 82 L42 70 L58 70 Z" fill={dark} transform="rotate(45 50 50)" />
          <rect x="42" y="14" width="16" height="6" fill="#f3f4f6" transform="rotate(45 50 50)" />
        </g>
      );
    case 'kus':
      return (
        <g>
          <ellipse cx="50" cy="60" rx="30" ry="26" fill={color} />
          <circle cx="68" cy="38" r="16" fill={color} />
          <path d="M84 38 L96 42 L84 46 Z" fill={dark} />
          <circle cx="72" cy="34" r="3" fill="#fff" />
          <path d="M30 58 Q20 50 14 58 M30 68 Q20 60 14 68" stroke={dark} strokeWidth="4" fill="none" />
        </g>
      );
    case 'cicek':
      return (
        <g>
          <circle cx="50" cy="50" r="12" fill={dark} />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx="50"
              cy="26"
              rx="14"
              ry="22"
              fill={color}
              transform={`rotate(${a} 50 50)`}
            />
          ))}
          <path d="M50 62 V96" stroke="#059669" strokeWidth="5" />
        </g>
      );
    case 'yildiz':
      return (
        <path
          d="M50 8 L61 38 L94 38 L67 58 L78 90 L50 70 L22 90 L33 58 L6 38 L39 38 Z"
          fill={color}
        />
      );
    case 'balik':
      return (
        <g>
          <path d="M14 50 Q30 16 64 38 Q88 50 64 62 Q30 84 14 50 Z" fill={color} />
          <path d="M64 38 L88 22 V50 L88 78 Z" fill={color} />
          <circle cx="70" cy="44" r="4" fill="#fff" />
          <circle cx="71" cy="44" r="2" fill={dark} />
        </g>
      );
    case 'kelebek':
      return (
        <g>
          <ellipse cx="28" cy="40" rx="22" ry="26" fill={color} />
          <ellipse cx="72" cy="40" rx="22" ry="26" fill={color} />
          <ellipse cx="30" cy="66" rx="14" ry="16" fill={color} opacity="0.7" />
          <ellipse cx="70" cy="66" rx="14" ry="16" fill={color} opacity="0.7" />
          <rect x="47" y="20" width="6" height="64" rx="3" fill={dark} />
        </g>
      );
  }
}
