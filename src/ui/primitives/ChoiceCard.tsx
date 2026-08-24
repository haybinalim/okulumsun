import type { CSSProperties, ReactNode } from 'react';
import { BigButton } from './BigButton';
import { Visual } from '../svg/Visual';
import type { Option, OptionDeger } from '../../exercises/types';

/**
 * Cevap kartı — bir şıkkın değerini çizer ve seç-onayla (§7.3) durumlarını taşır.
 *
 * Durumlar: boş → seçildi (büyür + çerçeve) → onaylandı (doğru/tekrar).
 * Asla KIRMIZI: yanlış cevap cezalandırıcı gösterilmez; yanlış "tekrar dene"
 * anlamında amber renkle soluklaşır (plan §7.1, §9).
 */
export type ChoiceState = 'bos' | 'secili' | 'dogru' | 'tekrar' | 'soluk';

export interface ChoiceCardProps {
  option: Option;
  size: number;
  state: ChoiceState;
  onSelect: () => void;
}

export function ChoiceCard({ option, size, state, onSelect }: ChoiceCardProps) {
  const selected = state === 'secili';
  const isCorrect = state === 'dogru';
  const isRetry = state === 'tekrar';
  const isDimmed = state === 'soluk';

  const style: CSSProperties = {
    width: size,
    height: size,
    background: 'var(--color-surface)',
    border: `${selected || isCorrect ? 5 : 3}px solid ${borderColor(state)}`,
    boxShadow: isCorrect
      ? `0 0 0 calc(4px * var(--scale)) var(--color-correct-soft)`
      : isRetry
        ? `0 0 0 calc(4px * var(--scale)) var(--color-retry-soft)`
        : undefined,
    opacity: isRetry ? 0.5 : isDimmed ? 0.35 : 1,
    transition: `transform var(--tap) var(--ease), opacity var(--tap)`,
    transform: selected ? 'scale(1.06)' : 'scale(1)',
    // CSS değişkenleri --tap/--ease burada inline olarak verilmezse varsayılan
    // değerlerle düşer; var() fallback'i bunu sağlar.
    ['--tap' as string]: '200ms',
    ['--ease' as string]: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  } as CSSProperties;

  return (
    <BigButton
      label={ariaLabel(option.deger)}
      size="choice"
      shape="rounded"
      variant="solid"
      onPress={onSelect}
      style={style}
    >
      <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
        {renderDeger(option.deger, size)}
      </div>
    </BigButton>
  );
}

function borderColor(state: ChoiceState): string {
  switch (state) {
    case 'secili':
      return 'var(--color-accent)';
    case 'dogru':
      return 'var(--color-correct)';
    case 'tekrar':
      return 'var(--color-retry)';
    default:
      return 'var(--color-border)';
  }
}

/** Şıkkın değerini görselleştirir — çocuk metin OKUYAMAZ, bu yüzden sayı/şekil/ikon. */
function renderDeger(deger: OptionDeger, size: number): ReactNode {
  const inner = size * 0.7;
  switch (deger.tur) {
    case 'sayi':
      return <Visual spec={{ type: 'rakam', sayi: deger.sayi }} width={inner} height={inner} />;
    case 'gorsel':
      return <Visual spec={deger.gorsel} width={inner} height={inner} />;
    case 'sekil':
      return <Visual spec={{ type: 'sekil', sekil: deger.sekil }} width={inner} height={inner} />;
    case 'sekilKategorisi':
      return <SekilKategori kategori={deger.kategori} size={inner} />;
    case 'banknot':
      return <Visual spec={{ type: 'banknot', deger: deger.deger }} width={inner} height={inner} />;
    case 'terim':
      return <Terim terim={deger.terim} size={inner} />;
    // 'metin' çocuk ekranında gelmemeli (alistirmaIhlalleri engeller); güvenlik ağı.
    case 'metin':
      return <span style={{ fontSize: inner * 0.3, color: 'var(--color-ink)' }}>{deger.metin}</span>;
  }
}

/** Karşılaştırma terimi — < > = sembolleri 1. sınıfta YOK, ikonla gösterilir. */
function Terim({ terim, size }: { terim: 'cok' | 'daha-cok' | 'az' | 'daha-az' | 'esit'; size: number }) {
  const dots = terimDots(terim);
  return (
    <svg viewBox="0 0 100 60" width={size} height={size * 0.6} aria-hidden="true">
      {dots.map((d, i) => (
        <circle key={i} cx={10 + i * 18} cy={30} r={d.r} fill="var(--color-ink)" />
      ))}
    </svg>
  );
}

/** Terim → nokta adedi/büyüklüğü (çok=dolu büyük, az=tek küçük, eşit=iki eşit). */
function terimDots(terim: 'cok' | 'daha-cok' | 'az' | 'daha-az' | 'esit'): { r: number }[] {
  switch (terim) {
    case 'cok':
      return [{ r: 7 }, { r: 7 }, { r: 7 }, { r: 7 }];
    case 'daha-cok':
      return [{ r: 7 }, { r: 7 }, { r: 7 }];
    case 'az':
      return [{ r: 6 }];
    case 'daha-az':
      return [{ r: 6 }, { r: 6 }];
    case 'esit':
      return [{ r: 6 }, { r: 6 }];
  }
}

/** Şekil kategorisi (yuvarlak/köşeli) — MAT.1.3.3'ün birincil ayrımı. */
function SekilKategori({ kategori, size }: { kategori: 'yuvarlak' | 'koseli'; size: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" fill="var(--color-accent)" stroke="#1f2937" strokeWidth="3">
      {kategori === 'yuvarlak' ? (
        <circle cx="50" cy="50" r="38" />
      ) : (
        <rect x="16" y="16" width="68" height="68" rx="6" />
      )}
    </svg>
  );
}

function ariaLabel(deger: OptionDeger): string {
  switch (deger.tur) {
    case 'sayi':
      return String(deger.sayi);
    case 'gorsel':
      return 'görsel seçenek';
    case 'sekil':
      return deger.sekil;
    case 'sekilKategorisi':
      return deger.kategori === 'yuvarlak' ? 'yuvarlak' : 'köşeli';
    case 'banknot':
      return `${deger.deger} lira banknotu, örnek görsel`;
    case 'terim':
      return deger.terim.replace('-', ' ');
    case 'metin':
      return deger.metin;
  }
}
