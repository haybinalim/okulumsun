/**
 * Onluk çerçeve aracı (plan v2 Adım 44): iki 2×5 çerçeve yan yana (20 göz). Göze dokununca sayaç
 * konur/kalkar. Her göz ≥ `--size-tap-min` (tahtada 102 px).
 */
import { BigButton } from '../primitives/BigButton';
import { KESIF_GOZ_SAYISI } from '../../kesif/kesifMasasi';
import { Belir, Sayac, izgaraBoslugu, type Gonder } from './ortak';

export function OnlukCerceveAraci({ dolu, gonder }: { dolu: readonly boolean[]; gonder: Gonder }) {
  const cerceve = (f: 0 | 1) => (
    <div
      role="group"
      aria-label={f === 0 ? 'Birinci onluk' : 'İkinci onluk'}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, var(--size-tap-min))',
        gap: izgaraBoslugu,
        padding: izgaraBoslugu,
        border: '3px solid var(--color-ink)',
        borderRadius: 12,
        background: 'var(--color-bg)',
      }}
    >
      {Array.from({ length: 10 }, (_, k) => {
        const i = f * 10 + k;
        return (
          <BigButton
            key={i}
            label={`Göz ${i + 1}${dolu[i] ? ', dolu' : ', boş'}`}
            size="tapMin"
            onPress={() => gonder({ tur: 'dokun', hedef: `goz:${i}` })}
            style={{ width: 'var(--size-tap-min)', height: 'var(--size-tap-min)', borderRadius: 8, padding: 0 }}
          >
            {dolu[i] && (
              <Belir anahtar={`g${i}`}>
                <Sayac boyut="calc(var(--size-tap-min) * 0.7)" />
              </Belir>
            )}
          </BigButton>
        );
      })}
    </div>
  );
  return (
    <div
      data-arac="onlukCerceve"
      data-goz-sayisi={KESIF_GOZ_SAYISI}
      style={{ display: 'flex', gap: 'var(--size-gap)', flexWrap: 'wrap', justifyContent: 'center' }}
    >
      {cerceve(0)}
      {cerceve(1)}
    </div>
  );
}
