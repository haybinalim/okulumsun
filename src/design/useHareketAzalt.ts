/**
 * Hareket azaltma (plan v2 Adım 55): işletim sistemi `prefers-reduced-motion` ayarı VEYA yetişkinin
 * açtığı kapsayıcılık ayarı. Bileşenler framer-motion'ın `useReducedMotion`'ı yerine bunu kullanır.
 */
import { useReducedMotion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

export function useHareketAzalt(): boolean {
  const sistem = useReducedMotion();
  const ayar = useAppStore((s) => s.kapsayicilik.hareketAzalt);
  return Boolean(sistem) || ayar;
}
