/**
 * RENK SEÇİMİ EKRANI — plan §11 [3].
 *
 * Kişisel modda, avatar seçiminden sonra gelir.
 * 6 renk topu — çocuğun vurgu rengi (accent).
 *
 * Tahta modunda atlanır (§3.3).
 */

import { useAppStore } from '../../store/appStore';
import { ACCENTS } from '../../design/tokens';
import { BigButton } from '../primitives/BigButton';
import { useScreenSpeech, speak } from '../../audio/useSpeak';
import { motion, useReducedMotion } from 'framer-motion';
import { COLOR } from '../../design/tokens';

export function RenkSecimi() {
  const renkSec = useAppStore((s) => s.renkSec);
  const reducedMotion = useReducedMotion();

  useScreenSpeech({ kind: 'key', key: 'ui.renk-sec' }, []);

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
        paddingBottom: 'var(--size-edge-bottom)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 'var(--size-gap)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {ACCENTS.map((a, i) => (
          <motion.div
            key={a.id}
            initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: reducedMotion ? 0 : 0.2,
              delay: reducedMotion ? 0 : i * 0.06,
            }}
          >
            <BigButton
              label={`Renk ${a.id}`}
              size="choice"
              shape="circle"
              variant="solid"
              onPress={() => {
                void speak({ kind: 'key', key: a.speechKey });
                renkSec(a.id);
              }}
              style={{
                background: a.hex,
                border: 'none',
              }}
            >
              <span aria-hidden="true" style={{ display: 'none' }}>renk</span>
            </BigButton>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
