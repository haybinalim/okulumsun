/**
 * Ayır-birleştir aracı (plan v2 Adım 44 aşama 3): toplam kadar sayaç (≤20, 10'arlı sıralar). Bir sayaca
 * dokunmak bütünü oradan ikiye ayırır: o sayaca kadar olanlar bir renk, sonrakiler başka renk ve hafif
 * aralıklı (parça-bütün). "Birleştir" tek renge döndürür; "+1/−1" bütünü değiştirir (ayırma kalkar).
 */
import { motion, useReducedMotion } from 'framer-motion';
import { BigButton } from '../primitives/BigButton';
import { KESIF_NESNE_SINIRI } from '../../kesif/kesifMasasi';
import { Sayac, izgaraBoslugu, type Gonder } from './ortak';

export function AyirBirlestirAraci({
  toplam,
  ayirma,
  gonder,
}: {
  toplam: number;
  ayirma: number | null;
  gonder: Gonder;
}) {
  const az = useReducedMotion();
  return (
    <div
      data-arac="ayirBirlestir"
      data-ayirma={ayirma ?? ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--size-gap)',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(10, Math.max(1, toplam))}, var(--size-tap-min))`,
          gridAutoRows: 'var(--size-tap-min)',
          gap: izgaraBoslugu,
          minWidth: 'var(--size-tap-min)',
        }}
      >
        {Array.from({ length: Math.min(toplam, KESIF_NESNE_SINIRI) }, (_, i) => {
          const ikinci = ayirma !== null && i >= ayirma;
          return (
            <BigButton
              key={i}
              label={`Sayaç ${i + 1}, buradan ayır`}
              size="tapMin"
              variant="ghost"
              onPress={() => gonder({ tur: 'dokun', hedef: `ayir:${i + 1}` })}
              style={{ width: 'var(--size-tap-min)', height: 'var(--size-tap-min)', padding: 0 }}
            >
              <motion.span
                aria-hidden="true"
                animate={{ x: ikinci ? 8 : 0, scale: ikinci ? 0.92 : 1 }}
                transition={{ duration: az ? 0 : 0.3 }}
                style={{ display: 'inline-flex', width: '85%', height: '85%' }}
              >
                <Sayac boyut="100%" renk={ikinci ? 'var(--color-retry)' : undefined} />
              </motion.span>
            </BigButton>
          );
        })}
      </div>
      <BigButton
        label="Birleştir"
        size="tapMin"
        disabled={ayirma === null}
        onPress={() => gonder({ tur: 'dokun', hedef: 'birlestir' })}
        style={{ padding: '0 calc(12px * var(--scale))', fontWeight: 700 }}
      >
        →●←
      </BigButton>
    </div>
  );
}
