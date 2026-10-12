import { useCallback, useEffect, useState } from 'react';
import {
  applyProfile,
  readStoredOverride,
  resolveProfile,
  storeOverride,
  type DeviceProfile,
} from './deviceProfile';

/**
 * Elle seçimi kaydeder ve yeni nihai profili hesaplar (plan v2 Adım 27).
 * `null` anahtarı siler → otomatik tespite dönülür. Tek depolama yazımı
 * `okulumsun.deviceOverride` (izin listesinde); öğrenci verisi değildir.
 */
export function profilSec(p: DeviceProfile | null): { profil: DeviceProfile; elleSecilen: DeviceProfile | null } {
  storeOverride(p);
  return { profil: resolveProfile(), elleSecilen: readStoredOverride() };
}

/**
 * Aktif cihaz profilini döndürür ve CSS değişkenlerini `<html>` üzerine yayar.
 *
 * Pencere yeniden boyutlandırıldığında (geliştirme sırasında sık) profili
 * yeniden hesaplar — ama URL/ayar geçersiz kılması varsa ona sadık kalır.
 */
export function useDeviceProfile(): {
  profile: DeviceProfile;
  elleSecilen: DeviceProfile | null;
  setOverride: (p: DeviceProfile | null) => void;
} {
  const [profile, setProfile] = useState<DeviceProfile>(() => resolveProfile());
  const [elleSecilen, setElleSecilen] = useState<DeviceProfile | null>(() => readStoredOverride());

  useEffect(() => {
    applyProfile(profile, document.documentElement);
  }, [profile]);

  useEffect(() => {
    const onResize = () => setProfile(resolveProfile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const setOverride = useCallback((p: DeviceProfile | null) => {
    const sonuc = profilSec(p);
    // Ölçek aynı karede uygulanır; önizleme kutusu hemen yeni boyutu gösterir.
    applyProfile(sonuc.profil, document.documentElement);
    setProfile(sonuc.profil);
    setElleSecilen(sonuc.elleSecilen);
  }, []);

  return { profile, elleSecilen, setOverride };
}
