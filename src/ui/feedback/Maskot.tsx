/**
 * MASKOT BİLEŞENİ — plan §7.5.
 *
 * Tek net işlevi: sesin sahibi olmak. Tüm sesli talimat ondan gelir;
 * "kim konuşuyor" sorusunu çözer, yardım istemeyi doğallaştırır.
 *
 * İNSAN DEĞİL (etnik/cinsiyet temsili ve tekinsiz vadi) · türü belirsiz,
 * yuvarlak, tüylü · silueti asla değişmez, yalnız yüz ifadesi ve kol pozu
 * değişir (6 durum) · sabit sıcak turuncu · 16px'te bile tanınabilir.
 *
 * prefers-reduced-motion açıkken poz değişir ama animasyon yoktur (anlık geçiş).
 */

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { type MaskotDurumu } from './maskotState';
import { COLOR, SIZE, MOTION } from '../../design/tokens';

// ---------------------------------------------------------------- SVG çizim

/** Maskotun sabit gövdesi — silüet hiç değişmez. */
function Govde({ renk }: { renk: string }) {
  const cx = 50;
  const cy = 52;
  // Yuvarlak, tüylü gövde — türü belirsiz.
  return (
    <g>
      {/* Tüy dokusu — kenarda küçük daireler */}
      {Array.from({ length: 12 }).map((_, i) => {
        const aci = (i / 12) * Math.PI * 2;
        const r = 38;
        const x = cx + Math.cos(aci) * r;
        const y = cy + Math.sin(aci) * r;
        return <circle key={i} cx={x} cy={y} r={5} fill={renk} opacity={0.7} />;
      })}
      {/* Ana gövde */}
      <ellipse cx={cx} cy={cy} rx={36} ry={34} fill={renk} />
      {/* Kulaklar — yuvarlak, tepede */}
      <circle cx={32} cy={26} r={9} fill={renk} />
      <circle cx={68} cy={26} r={9} fill={renk} />
      <circle cx={32} cy={26} r={5} fill={renk} opacity={0.6} />
      <circle cx={68} cy={26} r={5} fill={renk} opacity={0.6} />
    </g>
  );
}

/** Yüz ifadesi ve kollar — duruma göre değişir. */
function YuzVeKollar({ durum, renk }: { durum: MaskotDurumu; renk: string }) {
  const gozRenk = '#2B2B2B';
  const agizRenk = '#2B2B2B';
  const kolRenk = renk;

  switch (durum) {
    case 'sakin':
      return (
        <g>
          {/* Nötr gülümseme, kollar aşağıda */}
          <circle cx="38" cy="48" r="4" fill={gozRenk} />
          <circle cx="62" cy="48" r="4" fill={gozRenk} />
          <path d="M40 60 Q50 66 60 60" stroke={agizRenk} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Kollar aşağıda */}
          <ellipse cx="18" cy="60" rx="6" ry="12" fill={kolRenk} transform="rotate(15 18 60)" />
          <ellipse cx="82" cy="60" rx="6" ry="12" fill={kolRenk} transform="rotate(-15 82 60)" />
        </g>
      );

    case 'konusuyor':
      return (
        <g>
          {/* Ağız açık (konuşuyor), bir kol işaret eder */}
          <circle cx="38" cy="48" r="4" fill={gozRenk} />
          <circle cx="62" cy="48" r="4" fill={gozRenk} />
          <ellipse cx="50" cy="62" rx="6" ry="5" fill={agizRenk} />
          {/* Sağ kol işaret ediyor */}
          <ellipse cx="86" cy="40" rx="6" ry="14" fill={kolRenk} transform="rotate(-45 86 40)" />
          <circle cx="92" cy="28" r="4" fill={kolRenk} />
          {/* Sol kol aşağıda */}
          <ellipse cx="18" cy="60" rx="6" ry="12" fill={kolRenk} transform="rotate(15 18 60)" />
        </g>
      );

    case 'dinliyor':
      return (
        <g>
          {/* Hafif öne eğik, baş yönelmiş */}
          <circle cx="37" cy="49" r="4" fill={gozRenk} />
          <circle cx="61" cy="49" r="4" fill={gozRenk} />
          <path d="M40 61 Q50 65 60 61" stroke={agizRenk} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Kulaklar daha dik — dinleme pozisyonu */}
          {/* Kollar yukarıda, hafif açık */}
          <ellipse cx="16" cy="48" rx="6" ry="11" fill={kolRenk} transform="rotate(30 16 48)" />
          <ellipse cx="84" cy="48" rx="6" ry="11" fill={kolRenk} transform="rotate(-30 84 48)" />
        </g>
      );

    case 'sevinmis':
      return (
        <g>
          {/* Kollar yukarı, gözler kısılmış gülüş */}
          <path d="M34 48 Q38 44 42 48" stroke={gozRenk} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M58 48 Q62 44 66 48" stroke={gozRenk} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Geniş gülümseme */}
          <path d="M36 58 Q50 70 64 58" stroke={agizRenk} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Kollar yukarıda — sevinç */}
          <ellipse cx="16" cy="34" rx="6" ry="14" fill={kolRenk} transform="rotate(35 16 34)" />
          <ellipse cx="84" cy="34" rx="6" ry="14" fill={kolRenk} transform="rotate(-35 84 34)" />
        </g>
      );

    case 'cesaretlendiriyor':
      return (
        <g>
          {/* Nötr-sıcak, bir kol "devam" işareti. ASLA üzgün değil (§7.1) */}
          <circle cx="38" cy="48" r="4" fill={gozRenk} />
          <circle cx="62" cy="48" r="4" fill={gozRenk} />
          {/* Hafif gülümseme — cesaret verici */}
          <path d="M40 60 Q50 64 60 60" stroke={agizRenk} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Sağ kol "devam et" işareti — yukarı ve dışarı */}
          <ellipse cx="88" cy="44" rx="6" ry="13" fill={kolRenk} transform="rotate(-30 88 44)" />
          {/* Sol kol aşağıda */}
          <ellipse cx="18" cy="60" rx="6" ry="12" fill={kolRenk} transform="rotate(15 18 60)" />
        </g>
      );

    case 'uykulu':
      return (
        <g>
          {/* Gözler yarı kapalı, esneme */}
          <path d="M34 49 Q38 51 42 49" stroke={gozRenk} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M58 49 Q62 51 66 49" stroke={gozRenk} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Esneme — ağız açık ama farklı şekil */}
          <ellipse cx="50" cy="62" rx="5" ry="7" fill={agizRenk} />
          {/* Kollar sarkık — uyku hâli */}
          <ellipse cx="16" cy="64" rx="6" ry="11" fill={kolRenk} transform="rotate(10 16 64)" />
          <ellipse cx="84" cy="64" rx="6" ry="11" fill={kolRenk} transform="rotate(-10 84 64)" />
          {/* Z harfleri — uyku simgesi */}
          <text x="72" y="22" fontSize="8" fill={gozRenk} opacity={0.5}>z</text>
          <text x="78" y="16" fontSize="6" fill={gozRenk} opacity={0.4}>z</text>
        </g>
      );
  }
}

// ---------------------------------------------------------------- bileşen

export interface MaskotProps {
  /** Mevcut durum. */
  durum: MaskotDurumu;
  /** Piksel boyut (tablet profilinde temel; deviceProfile ölçekler). */
  size?: number;
  /** Maskota dokununca çağrılır (yardım isteği). */
  onDokun?: () => void;
}

/**
 * Maskot — 6 duruma geçen, sabit siluetli SVG bileşeni.
 *
 * Dokunulabilir bir öğedir (yardım = maskota dokunmak, §7.5).
 * prefers-reduced-motion'da poz değişir ama animasyon yoktur.
 */
export const Maskot = memo(function Maskot({ durum, size, onDokun }: MaskotProps) {
  const boyut = size ?? SIZE.mascot;
  const renk = COLOR.mascot;
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-label="Yardım"
      onClick={onDokun}
      animate={
        reducedMotion
          ? {}
          : durum === 'sevinmis'
            ? { scale: [1, 1.08, 1] }
            : durum === 'uykulu'
              ? { rotate: [0, -2, 2, 0] }
              : { scale: 1 }
      }
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: MOTION.correct / 1000, times: durum === 'sevinmis' ? [0, 0.5, 1] : undefined }
      }
      style={{
        width: boyut,
        height: boyut,
        border: 'none',
        background: 'transparent',
        cursor: onDokun ? 'pointer' : 'default',
        padding: 0,
        display: 'block',
      }}
    >
      <svg viewBox="0 0 100 100" width={boyut} height={boyut} aria-hidden="true">
        <Govde renk={renk} />
        <YuzVeKollar durum={durum} renk={renk} />
      </svg>
    </motion.button>
  );
});
