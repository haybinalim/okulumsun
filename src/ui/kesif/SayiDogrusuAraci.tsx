/**
 * Sayı doğrusu aracı (plan v2 Adım 44): 0–20, ekrana sığsın diye 11 noktalık pencere (0–10 veya 10–20;
 * konum 10'u geçince kayar). Noktaya dokununca işaret oraya zıplar; "+1/−1" birer adım.
 */
import { m } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { BigButton } from '../primitives/BigButton';
import { izgaraBoslugu, type Gonder } from './ortak';
import { pencereBaslangici } from './kesifEkrani';

export function SayiDogrusuAraci({ konum, gonder }: { konum: number; gonder: Gonder }) {
  const az = useHareketAzalt();
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
                <m.span
                  key={`k${konum}`}
                  initial={az ? false : { y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: az ? 0 : 0.3 }}
                >
                  {n}
                </m.span>
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
