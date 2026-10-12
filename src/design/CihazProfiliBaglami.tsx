/**
 * Cihaz profili bağlamı (plan v2 Adım 27): App'teki `useDeviceProfile` değerini
 * yetişkin alanındaki "Ekran boyutu" ayarına iletir. Prop zinciri yerine bağlam:
 * App'in her ekran dalına prop eklememek için.
 */
import { createContext, useContext } from 'react';
import type { DeviceProfile } from './tokens';

export interface CihazProfiliDegeri {
  readonly profil: DeviceProfile;
  readonly elleSecilen: DeviceProfile | null;
  readonly sec: (p: DeviceProfile | null) => void;
}

export const CihazProfiliBaglami = createContext<CihazProfiliDegeri | null>(null);

/** Bağlam yoksa fırlatır: ayar ekranı sağlayıcısız çizilmemeli. */
export function useCihazProfili(): CihazProfiliDegeri {
  const deger = useContext(CihazProfiliBaglami);
  if (!deger) throw new Error('useCihazProfili: CihazProfiliBaglami sağlayıcısı yok');
  return deger;
}
