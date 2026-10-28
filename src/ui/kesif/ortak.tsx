/**
 * Keşif Masası araçlarının ortak parçaları (plan v2 Adım 44 aşama 2).
 * Animasyon yalnız `transform`/`opacity`, ≤1,5 sn; azaltılmış harekette süre 0.
 */
import { m } from 'framer-motion';
import { BigButton } from '../primitives/BigButton';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import type { KesifOlayi } from '../../kesif/kesifMasasi';

export type Gonder = (o: KesifOlayi) => void;

/** Sayaç/nesne belirişi: ölçek + saydamlık, 0,25 sn. */
export function Belir({ children, anahtar }: { children: React.ReactNode; anahtar: string | number }) {
  const az = useHareketAzalt();
  return (
    <m.span
      key={anahtar}
      initial={az ? false : { scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: az ? 0 : 0.25 }}
      style={{ display: 'inline-flex' }}
      aria-hidden="true"
    >
      {children}
    </m.span>
  );
}

/** Sayaç: dolu daire (onluk çerçeve ve nesne kümesi). */
export function Sayac({ boyut = '70%', renk = 'var(--color-accent)' }: { boyut?: string; renk?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={boyut} height={boyut} aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill={renk} />
      <circle cx="14" cy="14" r="5" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

export const izgaraBoslugu = 'calc(12px * var(--scale))';

/**
 * Tek onluk görünümünde (küçük ekran, KG-120) diğer onluğa geçiş düğmesi. Görünen onluk 0 ise "İkinci onluk",
 * 1 ise "Birinci onluk". İçinde diğer onluğun küçük önizlemesi (2×5, dolu gözler) — öğretmen gizli onlukta ne
 * olduğunu görür. Sessiz: yeni ses klibi yok (değişen sayı zaten seslendirilir).
 */
export function OnlukGecisi({
  gorunen,
  digerDolu,
  onDegistir,
}: {
  gorunen: 0 | 1;
  digerDolu: readonly boolean[];
  onDegistir: () => void;
}) {
  const ad = gorunen === 0 ? 'İkinci onluk' : 'Birinci onluk';
  return (
    <BigButton
      label={ad}
      size="tapMin"
      onPress={onDegistir}
      style={{
        width: 'calc(var(--size-tap-min) * 1.4)',
        minHeight: 'calc(var(--size-tap-min) * 1.4)',
        flexDirection: 'column',
        gap: 'calc(6px * var(--scale))',
        padding: 'calc(6px * var(--scale))',
        fontSize: 'calc(18px * var(--scale))',
        fontWeight: 700,
        lineHeight: 1.1,
      }}
    >
      <span aria-hidden="true">{gorunen === 0 ? 'İkinci onluk' : 'Birinci onluk'}</span>
      <svg viewBox="0 0 54 22" width="80%" aria-hidden="true" data-onluk-onizleme={gorunen === 0 ? 1 : 0}>
        <rect x="0.5" y="0.5" width="53" height="21" rx="2" fill="none" stroke="var(--color-ink)" />
        {Array.from({ length: 10 }, (_, k) => (
          <circle
            key={k}
            cx={6 + (k % 5) * 10.5}
            cy={k < 5 ? 6 : 16}
            r={3.6}
            fill={digerDolu[k] ? 'var(--color-accent)' : 'none'}
            stroke="var(--color-border)"
          />
        ))}
      </svg>
    </BigButton>
  );
}
