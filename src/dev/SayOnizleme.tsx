/**
 * M-SAY ÖNİZLEMESİ — YALNIZ GELİŞTİRME (KG-86).
 *
 * `vite dev` altında `?gelistirme=say&adet=20&yerlesim=onlukCerceve&sik=3&device=board` ile TapCountScreen'i
 * belirli bir adet/yerleşim/şık sayısıyla açar; e2e (tests/e2e/say-yerlesimi.spec.ts) tahta ve tablet
 * profillerinde nesne boyutu, üst %35 ve taşmayı bununla denetler. `#ayar=` (büyük hedef) de geçerlidir.
 * Üretim derlemesinde `import.meta.env.DEV` `false` olduğundan bu modül paketlenmez. Hiçbir şey saklanmaz.
 */
import { useMemo } from 'react';
import { useDeviceProfile } from '../design/useDeviceProfile';
import { ACCENTS } from '../design/tokens';
import { createRng } from '../exercises/rng';
import { uretSay, type SaySikSayisi, type SayYerlesim } from '../exercises/templates/say';
import type { TapCountExercise } from '../exercises/types';
import { TapCountScreen } from '../ui/screens/TapCountScreen';

const YERLESIMLER: readonly SayYerlesim[] = ['sira', 'gruplu', 'onlukCerceve', 'dagınık'];

export function SayOnizleme() {
  const { profile } = useDeviceProfile();
  const p = new URLSearchParams(location.search);
  const adet = Number(p.get('adet') ?? '5');
  const yerlesimHam = p.get('yerlesim') as SayYerlesim | null;
  const yerlesim = yerlesimHam && YERLESIMLER.includes(yerlesimHam) ? yerlesimHam : undefined;
  const sik = Number(p.get('sik') ?? (profile === 'board' ? '3' : '4')) as SaySikSayisi;
  const tohum = Number(p.get('tohum') ?? '1');
  const exercise = useMemo(
    () =>
      uretSay(
        { seed: tohum, difficulty: 3, adet, layout: yerlesim, optionCount: sik, mod: profile === 'board' ? 'tahta' : 'kisisel' },
        createRng(tohum),
      ) as TapCountExercise,
    [adet, yerlesim, sik, tohum, profile],
  );
  const a = ACCENTS[0];
  return (
    <div style={{ height: '100dvh' }} data-say-onizleme>
      <TapCountScreen exercise={exercise} accent={{ id: a.id, hex: a.hex, speechKey: a.speechKey }} onDone={() => undefined} />
    </div>
  );
}
