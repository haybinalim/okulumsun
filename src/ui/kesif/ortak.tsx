/**
 * Keşif Masası araçlarının ortak parçaları (plan v2 Adım 44 aşama 2).
 * Animasyon yalnız `transform`/`opacity`, ≤1,5 sn; azaltılmış harekette süre 0.
 */
import { motion } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import type { KesifOlayi } from '../../kesif/kesifMasasi';

export type Gonder = (o: KesifOlayi) => void;

/** Sayaç/nesne belirişi: ölçek + saydamlık, 0,25 sn. */
export function Belir({ children, anahtar }: { children: React.ReactNode; anahtar: string | number }) {
  const az = useHareketAzalt();
  return (
    <motion.span
      key={anahtar}
      initial={az ? false : { scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: az ? 0 : 0.25 }}
      style={{ display: 'inline-flex' }}
      aria-hidden="true"
    >
      {children}
    </motion.span>
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
