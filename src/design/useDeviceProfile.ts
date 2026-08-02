import { useEffect, useState } from 'react';
import {
  applyProfile,
  resolveProfile,
  storeOverride,
  type DeviceProfile,
} from './deviceProfile';

/**
 * Aktif cihaz profilini döndürür ve CSS değişkenlerini `<html>` üzerine yayar.
 *
 * Pencere yeniden boyutlandırıldığında (geliştirme sırasında sık) profili
 * yeniden hesaplar — ama URL/ayar geçersiz kılması varsa ona sadık kalır.
 */
export function useDeviceProfile(): {
  profile: DeviceProfile;
  setOverride: (p: DeviceProfile | null) => void;
} {
  const [profile, setProfile] = useState<DeviceProfile>(() => resolveProfile());

  useEffect(() => {
    applyProfile(profile, document.documentElement);
  }, [profile]);

  useEffect(() => {
    const onResize = () => setProfile(resolveProfile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const setOverride = (p: DeviceProfile | null) => {
    storeOverride(p);
    setProfile(resolveProfile());
  };

  return { profile, setOverride };
}
