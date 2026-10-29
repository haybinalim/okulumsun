/**
 * Terazi aracı (plan v2 Adım 44 aşama 3): iki kefe, her biri en çok 10 nesne. Ağır taraf aşağı iner
 * (yalnız `transform: rotate`, ≤0,4 sn; azaltılmış harekette 0). Her kefenin altında "−1 / +1".
 */
import { m } from 'framer-motion';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import { BigButton } from '../primitives/BigButton';
import { KESIF_KEFE_SINIRI } from '../../kesif/kesifMasasi';
import { Sayac, izgaraBoslugu, type Gonder } from './ortak';
import { teraziEgimi } from './kesifEkrani';

/**
 * Sıkı düzen (KG-125, kısa ekran): kefe 2,4 × 1 tapMin, sayaç 0,4 tapMin (5'li iki sıra = 10 sığar), ayak 0,25 tapMin,
 * kefeler arası 0,5 tapMin — terazi sütunu ≈ 0,9 tapMin kısalır, en büyük eğimde yükselen kefe ucu da alçalır.
 */
function Kefe({ adet, taraf, siki }: { adet: number; taraf: 'Sol' | 'Sağ'; siki: boolean }) {
  const sayac = siki ? 'calc(var(--size-tap-min) * 0.4)' : 'calc(var(--size-tap-min) * 0.5)';
  return (
    <div
      role="img"
      aria-label={`${taraf} kefede ${adet}`}
      style={{
        width: siki ? 'calc(var(--size-tap-min) * 2.4)' : 'calc(var(--size-tap-min) * 3.2)',
        minHeight: siki ? 'var(--size-tap-min)' : 'calc(var(--size-tap-min) * 1.4)',
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
        <span key={i} style={{ width: sayac, height: sayac }}>
          <Sayac boyut="100%" />
        </span>
      ))}
    </div>
  );
}

export function TeraziAraci({
  sol,
  sag,
  gonder,
  siki = false,
}: {
  sol: number;
  sag: number;
  gonder: Gonder;
  siki?: boolean;
}) {
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
      data-siki={siki || undefined}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: izgaraBoslugu }}
    >
      <m.div
        animate={{ rotate: derece }}
        transition={{ duration: az ? 0 : 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: siki ? 'calc(var(--size-tap-min) * 0.5)' : 'calc(var(--size-tap-min) * 0.8)',
          transformOrigin: '50% 100%',
        }}
      >
        <Kefe adet={sol} taraf="Sol" siki={siki} />
        <Kefe adet={sag} taraf="Sağ" siki={siki} />
      </m.div>
      <div
        aria-hidden="true"
        style={{
          width: 12,
          height: siki ? 'calc(var(--size-tap-min) * 0.25)' : 'calc(var(--size-tap-min) * 0.5)',
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
