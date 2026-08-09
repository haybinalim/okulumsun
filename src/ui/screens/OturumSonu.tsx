/**
 * OTURUM SONU EKRANI — plan §7.4, §11 [7].
 *
 * 8 soru tamamlandığında gösterilir. Ödül TAMAMLAMAYA bağlıdır,
 * doğru sayısına DEĞİL (plan §7.4) — yanlış yapan çocuk da çıkartma alır.
 *
 * Akış:
 *  [7] Oturum sonu — çıkartma kazanildi → uçarak bahçeye → [8] Bahçem
 *
 * Tahta modunda [7]/[8] atlanır — ödül kişiseldir, sınıf ekranında anlamsız (§11).
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { COLOR, MOTION } from '../../design/tokens';
import { BigButton } from '../primitives/BigButton';
import { OturumSonuKutlama } from '../feedback/Celebration';
import { Maskot } from '../feedback/Maskot';
import { useScreenSpeech, speak } from '../../audio/useSpeak';

export interface OturumSonuProps {
  /** Oturum tamamlandı mı? (doğru sayısı ÖNEMSİZ — tamamlamaya bağlı). */
  oturumTamamlandi: boolean;
  /** Bahçem'e git. */
  onBahcem: () => void;
}

/**
 * Oturum sonu ekranı.
 *
 * Çıkartma kazanildi mesajı + konfeti + maskot sevinmiş durumda.
 * Dokununca veya ≤2 sn sonra Bahçem'e geçer.
 */
export function OturumSonu({ oturumTamamlandi, onBahcem }: OturumSonuProps) {
  const reducedMotion = useReducedMotion();
  const [kutlamaAktif, setKutlamaAktif] = useState(true);
  const [gecisHazir, setGecisHazir] = useState(false);

  useScreenSpeech(
    { kind: 'key', key: 'ui.oturum-bitti' },
    [oturumTamamlandi],
  );

  // Konfeti bittiğinde geçiş hazırla
  const handleAtla = useCallback(() => {
    setKutlamaAktif(false);
    setGecisHazir(true);
  }, []);

  useEffect(() => {
    if (!gecisHazir) return;
    // Konfeti bitti — çıkartma kazanıldı sesini çal, sonra bahçeye geç
    void speak({ kind: 'key', key: 'ui.cikartma-kazandin' });
    const timer = setTimeout(() => {
      onBahcem();
    }, 1500);
    return () => clearTimeout(timer);
  }, [gecisHazir, onBahcem]);

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLOR.bg,
        gap: 'var(--size-gap)',
        padding: 'var(--size-edge)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Maskot — sevinmiş durumda */}
      <motion.div
        initial={reducedMotion ? {} : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
      >
        <Maskot durum="sevinmis" size={120} />
      </motion.div>

      {/* "Çıkartma kazandın!" mesajı */}
      <motion.div
        initial={reducedMotion ? {} : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000, delay: 0.2 }}
        style={{
          fontSize: 'var(--text-ui, 28px)',
          color: COLOR.ink,
          textAlign: 'center',
        }}
      >
        🎁
      </motion.div>

      {/* "Devam" butonu — bahçeye git */}
      <AnimatePresence>
        {gecisHazir && (
          <motion.div
            initial={reducedMotion ? {} : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
          >
            <BigButton
              label="Bahçem"
              size="primary"
              variant="accent"
              onPress={onBahcem}
            >
              Bahçem
            </BigButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Konfeti overlay — atlanabilir (dokununca biter) */}
      <OturumSonuKutlama aktif={kutlamaAktif} onAtla={handleAtla} />
    </main>
  );
}
