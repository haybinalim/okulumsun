/**
 * Sayı doğrusu aracı (plan v2 Adım 44): 0–20, ekrana sığsın diye 11 noktalık pencere (0–10 veya 10–20;
 * konum 10'u geçince kayar). Noktaya dokununca işaret oraya zıplar; "+1/−1" birer adım.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { BigButton } from '../primitives/BigButton';
import { izgaraBoslugu, type Gonder } from './ortak';

export function pencereBaslangici(konum: number): number {
  return konum <= 10 ? 0 : 10;
}

export function SayiDogrusuAraci({ konum, gonder }: { konum: number; gonder: Gonder }) {
  const az = useReducedMotion();
  const bas = pencereBaslangici(konum);
  return (
    <div data-arac="sayiDogrusu" data-pencere={`${bas}-${bas + 10}`} style={{ position: 'relative' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: 6,
          background: 'var(--color-ink)',
          borderRadius: 3,
          transform: 'translateY(-50%)',
        }}
      />
      <div style={{ position: 'relative', display: 'flex', gap: izgaraBoslugu }}>
        {Array.from({ length: 11 }, (_, k) => {
          const n = bas + k;
          const burada = n === konum;
          return (
            <BigButton
              key={n}
              label={`Sayı ${n}`}
              size="tapMin"
              ariaPressed={burada}
              variant={burada ? 'accent' : 'solid'}
              onPress={() => gonder({ tur: 'dokun', hedef: `nokta:${n}` })}
              style={{
                width: 'var(--size-tap-min)',
                height: 'var(--size-tap-min)',
                padding: 0,
                fontSize: 'var(--text-choice-label)',
                fontWeight: 700,
              }}
            >
              {burada ? (
                <motion.span
                  key={`k${konum}`}
                  initial={az ? false : { y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: az ? 0 : 0.3 }}
                >
                  {n}
                </motion.span>
              ) : (
                n
              )}
            </BigButton>
          );
        })}
      </div>
    </div>
  );
}
