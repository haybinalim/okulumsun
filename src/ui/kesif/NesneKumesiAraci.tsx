/**
 * Nesne kümesi aracı (plan v2 Adım 44): en çok 20 nesne, 10'arlı iki sıra. "+1" nesne ekler;
 * bir nesneye dokunmak onu çıkarır. Boş yuvalar dokunulmaz (yalnız yer tutucu).
 */
import { BigButton } from '../primitives/BigButton';
import { KESIF_NESNE_SINIRI } from '../../kesif/kesifMasasi';
import { Belir, Sayac, izgaraBoslugu, type Gonder } from './ortak';

export function NesneKumesiAraci({ sayi, gonder }: { sayi: number; gonder: Gonder }) {
  return (
    <div
      data-arac="nesneKumesi"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, var(--size-tap-min))',
        gridAutoRows: 'var(--size-tap-min)',
        gap: izgaraBoslugu,
        justifyContent: 'center',
      }}
    >
      {Array.from({ length: KESIF_NESNE_SINIRI }, (_, i) =>
        i < sayi ? (
          <BigButton
            key={i}
            label={`Nesne ${i + 1}`}
            size="tapMin"
            variant="ghost"
            onPress={() => gonder({ tur: 'dokun', hedef: `nesne:${i}` })}
            style={{ width: 'var(--size-tap-min)', height: 'var(--size-tap-min)', padding: 0 }}
          >
            <Belir anahtar={`n${i}`}>
              <Sayac boyut="calc(var(--size-tap-min) * 0.85)" />
            </Belir>
          </BigButton>
        ) : (
          <span
            key={i}
            aria-hidden="true"
            style={{ borderRadius: '50%', border: '2px dashed var(--color-border)', margin: '15%' }}
          />
        ),
      )}
    </div>
  );
}
