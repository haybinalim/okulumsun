import { useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { gezinmeDurumu, useAppStore } from '../../store/appStore';
import type { DeviceProfile } from '../../design/tokens';
import { anaMenuHedefi, geriHedefi } from './gezinme';
import { GezinmeCubugu } from './GezinmeCubugu';
import { CikisOnayi } from './CikisOnayi';
import { cikisOnayiYanitla, gezinmeIste, useCikisOnayi } from './gezinmeIstegi';

/**
 * EKRAN ÇERÇEVESİ (KG-103) — `App.tsx`teki her ekran bunun içinde çizilir; Geri/Ana menü tek yerden.
 *
 * Yatay ekranda gezinme solda dikey ray olarak YER KAPLAR (ekranın üstüne binmez; KG-101'deki gibi
 * çakışma olmasın): tahtada düğmeler rayın altında (üst %35 erişilemez), tablet/telefonda üstünde.
 * Portre ekranda üstte yatay şerit (tahtada altta). Gezinmesiz ekranlarda (ses kilidi, mod seçimi, ana
 * ekran) ray hiç çizilmez ve ekran eskisi gibi tam boydur.
 */
export function EkranCercevesi({ profil, children }: { profil: DeviceProfile; children: ReactNode }) {
  const ekran = useAppStore((s) => s.ekran);
  const geri = useAppStore((s) => geriHedefi(gezinmeDurumu(s)));
  const anaMenu = useAppStore((s) => anaMenuHedefi(gezinmeDurumu(s)));
  const onay = useCikisOnayi((s) => (s.bekleyen && s.bekleyen.ekran === ekran ? s.bekleyen.yon : null));
  const portre = usePortre();
  const tahta = profil === 'board';
  const onGeri = useCallback(() => void gezinmeIste('geri'), []);
  const onAnaMenu = useCallback(() => void gezinmeIste('anaMenu'), []);

  const cubuk =
    geri !== null || anaMenu !== null ? (
      <GezinmeCubugu
        onGeri={geri !== null ? onGeri : undefined}
        onAnaMenu={anaMenu !== null ? onAnaMenu : undefined}
        yon={portre ? 'yatay' : 'dikey'}
        hizala={tahta ? 'son' : 'bas'}
      />
    ) : null;

  return (
    <div
      data-ekran-cercevesi={ekran}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: portre ? (tahta ? 'column-reverse' : 'column') : 'row',
      }}
    >
      {cubuk}
      <div style={{ flex: '1 1 auto', minWidth: 0, minHeight: 0, position: 'relative' }}>{children}</div>
      {onay && <CikisOnayi onYanit={cikisOnayiYanitla} />}
    </div>
  );
}

function portreAbone(degisti: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia('(orientation: portrait)');
  mq.addEventListener('change', degisti);
  return () => mq.removeEventListener('change', degisti);
}

function portreMi(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(orientation: portrait)').matches;
}

function usePortre(): boolean {
  return useSyncExternalStore(portreAbone, portreMi, () => false);
}
