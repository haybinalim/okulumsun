/**
 * Onluk çerçeve aracı (plan v2 Adım 44): iki 2×5 çerçeve yan yana (20 göz). Göze dokununca sayaç
 * konur/kalkar. Her göz ≥ `--size-tap-min` (tahtada 102 px).
 *
 * Küçük ekran (KG-120; ör. 1080×810 elle seçilen tahta): iki çerçeve yan yana sığmazsa (`tek`) yalnız bir
 * onluk görünür; yanındaki "İkinci onluk"/"Birinci onluk" düğmesi diğerine geçer. Son değişen göz başka
 * onluktaysa (+1/−1) görünüm oraya kendiliğinden geçer. Durum (20 göz) aynıdır; yalnız gösterim değişir.
 */
import { useEffect, useRef, useState } from 'react';
import { BigButton } from '../primitives/BigButton';
import { KESIF_GOZ_SAYISI } from '../../kesif/kesifMasasi';
import { onlukSirasi } from './kesifEkrani';
import { Belir, OnlukGecisi, Sayac, izgaraBoslugu, type Gonder } from './ortak';

export function OnlukCerceveAraci({
  dolu,
  gonder,
  tek = false,
}: {
  dolu: readonly boolean[];
  gonder: Gonder;
  tek?: boolean;
}) {
  const [gorunen, setGorunen] = useState<0 | 1>(0);
  const onceki = useRef(dolu);
  useEffect(() => {
    const eski = onceki.current;
    onceki.current = dolu;
    const i = dolu.findIndex((d, k) => d !== eski[k]);
    if (i >= 0) setGorunen(onlukSirasi(i));
  }, [dolu]);

  const cerceve = (f: 0 | 1) => (
    <div
      key={f}
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
  if (tek) {
    const diger: 0 | 1 = gorunen === 0 ? 1 : 0;
    return (
      <div
        data-arac="onlukCerceve"
        data-goz-sayisi={KESIF_GOZ_SAYISI}
        data-tek-onluk="true"
        data-onluk-gorunen={gorunen}
        style={{ display: 'flex', gap: 'var(--size-gap-tight)', alignItems: 'center', justifyContent: 'center' }}
      >
        {cerceve(gorunen)}
        <OnlukGecisi
          gorunen={gorunen}
          digerDolu={dolu.slice(diger * 10, diger * 10 + 10)}
          onDegistir={() => setGorunen(diger)}
        />
      </div>
    );
  }
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
