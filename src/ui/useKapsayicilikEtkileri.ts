/**
 * Kapsayıcılık ayarlarının yan etkileri (plan v2 Adım 55): ses temel hızı ve tahtadaki ayar kodu.
 * CSS değişkenleri ve kök öznitelikleri `useDeviceProfile` → `applyProfile` yazar.
 */
import { useEffect } from 'react';
import { speech } from '../audio/speech';
import { etkinCalmaHizi } from '../design/kapsayicilik';
import { ayarKodunuAdreseYaz } from '../platform/ayarKoduAdres';
import { tarayiciAdresi } from '../platform/eveLinkAcilis';
import { useAppStore } from '../store/appStore';

export function useKapsayicilikEtkileri(): void {
  const sesHizi = useAppStore((s) => s.sesHizi);
  const kapsayicilik = useAppStore((s) => s.kapsayicilik);

  useEffect(() => {
    speech.temelHizAyarla(etkinCalmaHizi(sesHizi, kapsayicilik.tempo));
  }, [sesHizi, kapsayicilik.tempo]);

  useEffect(() => {
    ayarKodunuAdreseYaz(tarayiciAdresi(), kapsayicilik);
  }, [kapsayicilik]);
}
