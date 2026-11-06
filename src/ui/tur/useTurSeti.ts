/**
 * Set hazırla ve ev açılışı için ortak set kancası (Okuma Yazma Adım 79). Sözcük havuzu + hamle verisi (T-09 "Harfi
 * parçalardan kur" için) yüklenince seti kurar. Öğretmen ekranı ile ev cihazı aynı veriyle aynı seti kurar (eve link
 * determinizmi); hamle verisi açılamazsa T-09 adımı atlanır ve bildirilir. Hiçbir şey saklanmaz.
 */
import { useMemo } from 'react';
import { turSetiKur, type SetDuzeyi, type TurSeti } from '../../content/dersler/tur/turSet';
import { useTurKume } from './turKume';
import { useTurHavuzu } from './useTurHavuzu';
import { useHamleVerisi } from './useHamleVerisi';

export type TurSetiDurumu =
  | { readonly durum: 'yukleniyor' }
  | { readonly durum: 'hata'; readonly mesaj: string }
  | { readonly durum: 'hazir'; readonly set: TurSeti };

export function useTurSeti(duzey: SetDuzeyi, tohum: number): TurSetiDurumu {
  const kume = useTurKume();
  const h = useTurHavuzu();
  const hv = useHamleVerisi();
  const hamleler = hv.durum === 'hazir' ? hv.veri.glifler : undefined;
  const hamleBitti = hv.durum !== 'yukleniyor';
  return useMemo((): TurSetiDurumu => {
    if (h.durum === 'hata') return { durum: 'hata', mesaj: h.mesaj };
    if (h.durum !== 'hazir' || !hamleBitti) return { durum: 'yukleniyor' };
    return { durum: 'hazir', set: turSetiKur({ havuz: h.havuz, kume, duzey, tohum, hamleler }) };
  }, [h, hamleBitti, hamleler, kume, duzey, tohum]);
}
