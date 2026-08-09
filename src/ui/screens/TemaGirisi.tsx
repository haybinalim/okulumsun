/**
 * TEMA GİRİŞİ EKRANI — plan §11 [5].
 *
 * Tema seçildikten sonra 2 sn otomatik geçiş. Maskot tema adını söyler.
 * Çocuk bir sonraki ekrana hazırlanır — "Bugün sayı sayacağız" vb.
 *
 * Bu ekran dokunulabilir DEĞİL — otomatik geçiş.
 */

import { useEffect } from 'react';
import { useAppStore, TEMALAR } from '../../store/appStore';
import { Maskot } from '../feedback/Maskot';
import { useScreenSpeech } from '../../audio/useSpeak';
import { motion, useReducedMotion } from 'framer-motion';
import { COLOR, MOTION } from '../../design/tokens';

export function TemaGirisi() {
  const { secilenTemaNo, ekranGit, mod } = useAppStore();
  const reducedMotion = useReducedMotion();

  const tema = TEMALAR.find((t) => t.no === secilenTemaNo);

  useScreenSpeech(
    tema ? { kind: 'key', key: tema.speechKey as never } : null,
    [secilenTemaNo],
  );

  // 2 sn sonra otomatik geçiş
  useEffect(() => {
    const timer = setTimeout(() => {
      // Kişisel mod → alıştırma, Tahta modu → konu seçimi
      ekranGit(mod === 'tahta' ? 'konuSecimi' : 'alistirma');
    }, 2000);
    return () => clearTimeout(timer);
  }, [ekranGit, mod]);

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: tema?.renk ?? COLOR.bg,
        gap: 'var(--size-gap)',
        padding: 'var(--size-edge)',
      }}
    >
      <motion.div
        initial={reducedMotion ? {} : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000 }}
      >
        <Maskot durum="konusuyor" size={120} />
      </motion.div>

      {tema && (
        <motion.div
          initial={reducedMotion ? {} : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : MOTION.screen / 1000, delay: 0.3 }}
          style={{
            fontSize: 'var(--text-ui)',
            color: '#fff',
            textAlign: 'center',
            padding: '8px 24px',
            borderRadius: 16,
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          {tema.ad}
        </motion.div>
      )}
    </main>
  );
}
