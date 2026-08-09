/**
 * MASKOT DURUM YÖNETİMİ HOOK'U — plan §7.5.
 *
 * Ayrı dosyada çünkü React Fast Refresh sadece component dosyalarında çalışır;
 * hook export'u aynı dosyada uyarı verir.
 *
 * Olayları besler, durumu döndürür ve otomatik geçişleri yönetir:
 *  · `sevinmis` → `sakin` (≤2 sn sonra, plan §7.5)
 *  · `konusuyor` → `sakin` (talimat bittiğinde)
 *  · `uykulu` → `sakin` (dokunma)
 *
 * 60 sn hareketsizlik → `uykulu` (plan §7.5, MASKOT_UYKULU_SURESI).
 */

import { useEffect, useRef, useState } from 'react';
import {
  type MaskotDurumu,
  maskotGuncelle,
  type MaskotOlayi,
  SEVINMIS_SURE_MS,
} from './maskotState';
import { MASKOT_UYKULU_SURESI } from '../../design/tokens';

export function useMaskot() {
  const [durum, setDurum] = useState<MaskotDurumu>('sakin');
  const sevinmisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hareketsizlikTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // sevinmis → sakin otomatik dönüş
  useEffect(() => {
    if (durum === 'sevinmis' && sevinmisTimer.current === null) {
      sevinmisTimer.current = setTimeout(() => {
        setDurum('sakin');
        sevinmisTimer.current = null;
      }, SEVINMIS_SURE_MS);
    }
    return () => {
      if (sevinmisTimer.current !== null) {
        clearTimeout(sevinmisTimer.current);
        sevinmisTimer.current = null;
      }
    };
  }, [durum]);

  // 60 sn hareketsizlik → uykulu (sakin durumundayken sayar)
  useEffect(() => {
    if (durum !== 'sakin') {
      if (hareketsizlikTimer.current !== null) {
        clearTimeout(hareketsizlikTimer.current);
        hareketsizlikTimer.current = null;
      }
      return;
    }

    hareketsizlikTimer.current = setTimeout(() => {
      setDurum('uykulu');
      hareketsizlikTimer.current = null;
    }, MASKOT_UYKULU_SURESI);

    return () => {
      if (hareketsizlikTimer.current !== null) {
        clearTimeout(hareketsizlikTimer.current);
        hareketsizlikTimer.current = null;
      }
    };
  }, [durum]);

  const olayGonder = (olay: MaskotOlayi) => {
    setDurum((onceki) => maskotGuncelle(onceki, olay));
  };

  return { durum, olayGonder };
}
