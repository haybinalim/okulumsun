/**
 * Seçili vurgu rengi, seçili palette (plan v2 Adım 55). Kimlik ve ses adı değişmez; renk körlüğü
 * dostu palet açıksa koyulaştırılmış eşi döner. Yalnız bellekteki ayarlardan okunur.
 */
import { useMemo } from 'react';
import { accentBul, useAppStore } from '../store/appStore';
import { paletliVurgu } from './kapsayicilik';
import type { Vurgu } from './tokens';

export function useVurgu(): Vurgu {
  const id = useAppStore((s) => s.accentId);
  const palet = useAppStore((s) => s.kapsayicilik.palet);
  return useMemo(() => {
    const a = accentBul(id);
    return { id: a.id, speechKey: a.speechKey, hex: paletliVurgu(a, palet) };
  }, [id, palet]);
}
