/**
 * Terazi aracı (plan v2 Adım 44 aşama 3): iki kefe, her biri en çok 10 nesne. Ağır taraf aşağı iner
 * (yalnız `transform: rotate`, ≤0,4 sn; azaltılmış harekette 0). Her kefenin altında "−1 / +1".
 */
import { motion } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { BigButton } from '../primitives/BigButton';
import { KESIF_KEFE_SINIRI } from '../../kesif/kesifMasasi';
import { Sayac, izgaraBoslugu, type Gonder } from './ortak';
import { teraziEgimi } from './kesifEkrani';

function Kefe({ adet, taraf }: { adet: number; taraf: 'Sol' | 'Sağ' }) {
  return (
    <div
      role="img"
      aria-label={`${taraf} kefede ${adet}`}
      style={{
        width: 'calc(var(--size-tap-min) * 3.2)',
        minHeight: 'calc(var(--size-tap-min) * 1.4)',
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-end',
        justifyContent: 'center',
        gap: 4,
        padding: 6,
        borderBottom: '6px solid var(--color-ink)',
        borderRadius: '0 0 40% 40%',
      }}
    >
      {Array.from({ length: adet }, (_, i) => (
        <span key={i} style={{ width: 'calc(var(--size-tap-min) * 0.5)', height: 'calc(var(--size-tap-min) * 0.5)' }}>
          <Sayac boyut="100%" />
        </span>
      ))}
    </div>
  );
}

export function TeraziAraci({ sol, sag, gonder }: { sol: number; sag: number; gonder: Gonder }) {
  const az = useHareketAzalt();
  const derece = teraziEgimi(sol, sag);
  const dugmeler = (t: 'sol' | 'sag', ad: 'Sol' | 'Sağ', n: number) => (
    <div style={{ display: 'flex', gap: izgaraBoslugu, justifyContent: 'center' }}>
      <BigButton
        label={`${ad} kefeden bir çıkar`}
        size="tapMin"
        disabled={n === 0}
        onPress={() => gonder({ tur: 'dokun', hedef: `${t}-` })}
      >
        −1
      </BigButton>
      <BigButton
        label={`${ad} kefeye bir ekle`}
        size="tapMin"
        disabled={n === KESIF_KEFE_SINIRI}
        onPress={() => gonder({ tur: 'dokun', hedef: `${t}+` })}
      >
        +1
      </BigButton>
    </div>
  );
  return (
    <div
      data-arac="terazi"
      data-egim={derece}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: izgaraBoslugu }}
    >
      <motion.div
        animate={{ rotate: derece }}
        transition={{ duration: az ? 0 : 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'calc(var(--size-tap-min) * 0.8)',
          transformOrigin: '50% 100%',
        }}
      >
        <Kefe adet={sol} taraf="Sol" />
        <Kefe adet={sag} taraf="Sağ" />
      </motion.div>
      <div
        aria-hidden="true"
        style={{
          width: 12,
          height: 'calc(var(--size-tap-min) * 0.5)',
          background: 'var(--color-ink)',
          borderRadius: 4,
        }}
      />
      <div style={{ display: 'flex', gap: 'calc(var(--size-tap-min) * 1.2)' }}>
        {dugmeler('sol', 'Sol', sol)}
        {dugmeler('sag', 'Sağ', sag)}
      </div>
    </div>
  );
}
