/**
 * Nesne kümesi aracı (plan v2 Adım 44): en çok 20 nesne, 10'arlı iki sıra. "+1" nesne ekler;
 * bir nesneye dokunmak onu çıkarır. Boş yuvalar dokunulmaz (yalnız yer tutucu).
 *
 * Küçük ekran (KG-120): 10'arlı sıra sığmazsa (`tekOnluk`; 1080×810 tahtada 10×102 px yatay kırpılıyordu)
 * bir onluk 5'li iki sıra gösterilir; "İkinci onluk"/"Birinci onluk" düğmesi geçer. Görünüm son nesnenin
 * onluğunu izler (11. nesne eklenince ikinci onluk açılır).
 */
import { useEffect, useState } from 'react';
import { BigButton } from '../primitives/BigButton';
import { KESIF_NESNE_SINIRI } from '../../kesif/kesifMasasi';
import { onlukSirasi } from './kesifEkrani';
import { Belir, OnlukGecisi, Sayac, izgaraBoslugu, type Gonder } from './ortak';

export function NesneKumesiAraci({
  sayi,
  gonder,
  tekOnluk = false,
}: {
  sayi: number;
  gonder: Gonder;
  tekOnluk?: boolean;
}) {
  const [gorunen, setGorunen] = useState<0 | 1>(0);
  useEffect(() => setGorunen(onlukSirasi(Math.max(sayi - 1, 0))), [sayi]);

  const yuva = (i: number) =>
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
    );

  const izgara = (sutun: number, indeksler: readonly number[]) => (
    <div
      data-arac="nesneKumesi"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${sutun}, var(--size-tap-min))`,
        gridAutoRows: 'var(--size-tap-min)',
        gap: izgaraBoslugu,
        justifyContent: 'center',
      }}
    >
      {indeksler.map(yuva)}
    </div>
  );

  if (tekOnluk) {
    const diger: 0 | 1 = gorunen === 0 ? 1 : 0;
    const say = (f: 0 | 1) => Array.from({ length: 10 }, (_, k) => f * 10 + k < sayi);
    return (
      <div
        data-tek-onluk="true"
        data-onluk-gorunen={gorunen}
        style={{ display: 'flex', gap: 'var(--size-gap-tight)', alignItems: 'center', justifyContent: 'center' }}
      >
        {izgara(
          5,
          Array.from({ length: 10 }, (_, k) => gorunen * 10 + k),
        )}
        <OnlukGecisi gorunen={gorunen} digerDolu={say(diger)} onDegistir={() => setGorunen(diger)} />
      </div>
    );
  }
  return izgara(
    10,
    Array.from({ length: KESIF_NESNE_SINIRI }, (_, i) => i),
  );
}
