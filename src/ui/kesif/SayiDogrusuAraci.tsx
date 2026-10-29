/**
 * Sayı doğrusu aracı (plan v2 Adım 44): 0–20, ekrana sığsın diye 11 noktalık pencere (0–10 veya 10–20;
 * konum 10'u geçince kayar). Noktaya dokununca işaret oraya zıplar; "+1/−1" birer adım.
 *
 * KG-124: 11 nokta tek sıraya sığmıyorsa (1080×810 elle seçilen tahta) zikzak düzen — çizgi ölçülen genişliğe
 * ölçeklenir, çiftler üstte, tekler altta; her nokta yine `--size-tap-min` kare (bkz. `sayiDogrusuDuzeni`).
 */
import { m } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { BigButton } from '../primitives/BigButton';
import { izgaraBoslugu, type Gonder } from './ortak';
import { pencereBaslangici, type SayiDogrusuDuzeni } from './kesifEkrani';

/** Zikzak düzende çizgi bandının yüksekliği (iki düğme sırası arası; çentikler burada). */
const BANT = 'calc(24px * var(--scale))';

export function SayiDogrusuAraci({
  konum,
  gonder,
  duzen = { tur: 'sira' },
}: {
  konum: number;
  gonder: Gonder;
  duzen?: SayiDogrusuDuzeni;
}) {
  const az = useHareketAzalt();
  const bas = pencereBaslangici(konum);
  const nokta = (k: number, ek?: React.CSSProperties) => {
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
          ...ek,
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
  };

  if (duzen.tur === 'zikzak') {
    const a = duzen.adim;
    return (
      <div
        data-arac="sayiDogrusu"
        data-pencere={`${bas}-${bas + 10}`}
        data-duzen="zikzak"
        style={{
          position: 'relative',
          width: `calc(${10 * a}px + var(--size-tap-min))`,
          height: `calc(2 * var(--size-tap-min) + ${BANT})`,
          flex: '0 0 auto',
        }}
      >
        {/* Çizgi ve çentikler (gösterim): ilk ve son noktanın merkezleri arasında. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 'calc(var(--size-tap-min) / 2)',
            width: 10 * a,
            top: 'calc(var(--size-tap-min) + ' + BANT + ' / 2)',
            height: 6,
            background: 'var(--color-ink)',
            borderRadius: 3,
            transform: 'translateY(-50%)',
          }}
        />
        {Array.from({ length: 11 }, (_, k) => (
          <div
            key={`c${k}`}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: `calc(var(--size-tap-min) / 2 + ${k * a}px - 2px)`,
              top: 'var(--size-tap-min)',
              width: 4,
              height: BANT,
              background: 'var(--color-ink)',
              borderRadius: 2,
            }}
          />
        ))}
        {Array.from({ length: 11 }, (_, k) =>
          nokta(k, {
            position: 'absolute',
            left: k * a,
            top: k % 2 === 0 ? 0 : `calc(var(--size-tap-min) + ${BANT})`,
          }),
        )}
      </div>
    );
  }

  return (
    <div data-arac="sayiDogrusu" data-pencere={`${bas}-${bas + 10}`} data-duzen="sira" style={{ position: 'relative' }}>
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
        {Array.from({ length: 11 }, (_, k) => nokta(k))}
      </div>
    </div>
  );
}
