/**
 * KUTLAMA BİLEŞENİ — plan §7.4.
 *
 * İki modu vardır:
 *
 * 1. DOĞRU CEVAP (soru başına): 400–600 ms, yeşil çerçeve + tik + %8 nabız +
 *    yükselen iki nota. Konfeti YOK — 8 soruda 8 kez konfeti bezdirir.
 *
 * 2. OTURUM SONU (yalnız bir kez): konfeti ≤40 parçacık, ≤1.5 sn.
 *    Kutlama ≤2 sn ve atlanabilir (dokununca biter).
 *
 * Aşırı oyunlaştırma önlemleri (§7.4):
 *  · Ödül tamamlamaya bağlı, doğru sayısına değil.
 *  · Sayısal skor/yüzde hiçbir yerde yok.
 *  · Streak sayacı yok.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { COLOR, MOTION, KONFETI, KUTLAMA } from '../../design/tokens';

// ----------------------------------------------------- doğru cevap kutlaması

export interface DogruKutlamaProps {
  /** Kutlamayı göster/gizle. */
  aktif: boolean;
  /** Kutlama bittiğinde çağrılır. */
  onBitti: () => void;
}

/**
 * Doğru cevap kutlaması — yeşil çerçeve + tik + %8 nabız.
 *
 * 400–600 ms (MOTION.correct = 500 ms). Konfeti yok.
 * prefers-reduced-motion'da çerçeve ve tik görünür ama animasyon yok.
 */
export function DogruKutlama({ aktif, onBitti }: DogruKutlamaProps) {
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!aktif) return;
    const sure = KUTLAMA.dogruMaksMs;
    timerRef.current = setTimeout(onBitti, sure);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [aktif, onBitti]);

  if (!aktif) return null;

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { scale: 0, opacity: 0 }}
      animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : MOTION.correct / 1000 }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <motion.div
        animate={
          reducedMotion
            ? {}
            : { scale: [1, 1.08, 1] }
        }
        transition={{
          duration: reducedMotion ? 0 : MOTION.correct / 1000,
          times: [0, 0.5, 1],
        }}
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `6px solid ${COLOR.correct}`,
          background: COLOR.correctSoft,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {/* Tik işareti */}
        <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
          <path
            d="M14 30 L26 42 L46 18"
            stroke={COLOR.correct}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ------------------------------------------------------ oturum sonu konfetisi

export interface OturumSonuKutlamaProps {
  /** Konfetiyi göster. */
  aktif: boolean;
  /** Çocuğun dokunmasıyla atla — kutlama ≤2 sn ve atlanabilir (§7.4). */
  onAtla: () => void;
}

/**
 * Oturum sonu konfetisi — yalnız bir kez, ≤40 parçacık, ≤1.5 sn.
 *
 * canvas-confeti lazy import edilir (plan §2). Atlanabilir: dokununca biter.
 * prefers-reduced-motion'da konfeti başlamaz — sadece metin görünür.
 */
export function OturumSonuKutlama({ aktif, onAtla }: OturumSonuKutlamaProps) {
  const reducedMotion = useReducedMotion();
  const confetiRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gorunur, setGorunur] = useState(false);

  // canvas-confeti lazy import
  useEffect(() => {
    if (!aktif || reducedMotion) {
      setGorunur(aktif);
      return;
    }
    let iptal = false;
    setGorunur(true);

    void import('canvas-confetti').then((mod) => {
      if (iptal) return;
      const confetti = mod.default;
      confetti({
        particleCount: KONFETI.parcacikSayisi,
        spread: 70,
        origin: { y: 0.6 },
        colors: [COLOR.correct, COLOR.mascot, '#7C3AED', '#EAB308', '#DB2777'],
        disableForReducedMotion: false, // biz kendi kontrolümüzü yapıyoruz
        zIndex: 200,
      });
      confetiRef.current = () => confetti.reset();
    });

    timerRef.current = setTimeout(() => {
      onAtla();
    }, KUTLAMA.oturumSonuMaksMs);

    return () => {
      iptal = true;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      confetiRef.current?.();
    };
  }, [aktif, reducedMotion, onAtla]);

  const handleAtla = useCallback(() => {
    confetiRef.current?.();
    onAtla();
  }, [onAtla]);

  if (!gorunur) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
        onClick={handleAtla}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255, 253, 248, 0.85)',
          zIndex: 200,
          cursor: 'pointer',
        }}
        role="button"
        aria-label="Devam etmek için dokun"
      >
        <div style={{ textAlign: 'center', padding: 'var(--size-edge)' }}>
          <div style={{ fontSize: 'var(--text-stimulus, 80px)', lineHeight: 1.2 }}>
            🎉
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
