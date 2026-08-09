/**
 * BAHÇEM EKRANI — plan §7.4, §11 [8].
 *
 * Çocuğun çıkartma koleksiyonunu gösterir.
 * Oturum sonundan [Ev] ile buraya gelir, sonra ana ekrana döner.
 *
 * GÖSTERİM KURALLARI (§7.4):
 *  · Sayısal skor/yüzde YOK — çıkartma sayısı da SAYI olarak gösterilmez.
 *    Bunun yerine görsel çıkartma dizisi: her çıkartma bir ikon.
 *  · "Kalan: X" yazısı YOK — kalan çıkartma görsel olarak gösterilir
 *    (dolu/boş yuva dizisi).
 *  · Yeni sahne açıldığsa küçük kutlama.
 */

import { motion, useReducedMotion } from 'framer-motion';
import {
  type CikartmaKoleksiyonu,
  YENI_SAHNE_ESIGI,
  kalanCikartma,
  mevcutSahneAdi,
} from '../../progress/cikartma';
import { COLOR, SIZE, MOTION } from '../../design/tokens';
import { BigButton } from '../primitives/BigButton';

export interface BahcemProps {
  koleksiyon: CikartmaKoleksiyonu;
  /** Ev butonuna basılınca — ana ekrana dön. */
  onEv: () => void;
}

/** Bahçe sahnesi arka planı — sahne tipine göre renk. */
function sahneArkaPlan(sahne: string): string {
  switch (sahne) {
    case 'bahçe':
      return '#DCFCE7';
    case 'orman':
      return '#D1FAE5';
    case 'deniz':
      return '#DBEAFE';
    default:
      return '#DCFCE7';
  }
}

/** Çıkartma ikonu — basit SVG, sahne tipine göre değişir. */
function CikartmaIkon({ sahne, dolu }: { sahne: string; dolu: boolean }) {
  const renk = dolu ? COLOR.mascot : '#E2DED4';
  if (sahne === 'bahçe') {
    return (
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <circle cx="20" cy="20" r="16" fill={renk} opacity={dolu ? 1 : 0.3} />
        {dolu && <path d="M12 20 L18 26 L28 14" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />}
      </svg>
    );
  }
  if (sahne === 'orman') {
    return (
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <path d="M20 6 L30 24 L24 24 L32 34 L8 34 L16 24 L10 24 Z" fill={renk} opacity={dolu ? 1 : 0.3} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <path d="M6 24 Q12 18 20 24 Q28 18 34 24 L34 30 Q28 30 20 30 Q12 30 6 30 Z" fill={renk} opacity={dolu ? 1 : 0.3} />
    </svg>
  );
}

/**
 * Bahçem ekranı — çıkartma koleksiyonu.
 *
 * Çocuğa gösterim: dolu/boş yuva dizisi, sayı YOK.
 */
export function Bahcem({ koleksiyon, onEv }: BahcemProps) {
  const reducedMotion = useReducedMotion();
  const sahne = mevcutSahneAdi(koleksiyon);
  const arkaPlan = sahneArkaPlan(sahne);
  const kalan = kalanCikartma(koleksiyon);

  // Mevcut sahnede dolu çıkartmalar + boş yuvalar
  const doluCikartmalar = YENI_SAHNE_ESIGI - kalan;
  const bosYuvalar = kalan;
  const yuvalar = [
    ...Array.from({ length: doluCikartmalar }).map(() => true),
    ...Array.from({ length: bosYuvalar }).map(() => false),
  ];

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: arkaPlan,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap)',
        overflow: 'hidden',
      }}
    >
      {/* Üst: sahne adı (büyük, görsel) */}
      <section
        style={{
          flex: '0 0 25%',
          display: 'grid',
          placeItems: 'center',
          minHeight: 0,
        }}
      >
        <motion.div
          initial={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
          style={{
            fontSize: 'var(--text-ui, 28px)',
            color: COLOR.ink,
          }}
        >
          {sahne}
        </motion.div>
      </section>

      {/* Orta: çıkartma koleksiyonu — 5 sütun × 6 satır ızgara */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignContent: 'center',
          gap: 8,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {yuvalar.map((dolu, i) => (
          <motion.div
            key={i}
            initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: reducedMotion ? 0 : 0.2,
              delay: reducedMotion ? 0 : Math.min(i * 0.02, 0.6),
            }}
          >
            <CikartmaIkon sahne={sahne} dolu={dolu} />
          </motion.div>
        ))}
      </section>

      {/* Alt: Ev butonu — erişim bölgesinde */}
      <section
        style={{
          flex: '0 0 auto',
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: SIZE.edgeBottom,
        }}
      >
        <BigButton label="Ev" size="control" variant="accent" onPress={onEv}>
          🏠
        </BigButton>
      </section>
    </main>
  );
}
