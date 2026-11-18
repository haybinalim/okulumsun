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
import { useCumleVerisi } from './useCumleVerisi';
import { useMetinVerisi } from './useMetinVerisi';

export type TurSetiDurumu =
  | { readonly durum: 'yukleniyor' }
  /** `mesaj` kendi başına okunur (hangi verinin açılamadığını söyler). */
  | { readonly durum: 'hata'; readonly mesaj: string }
  | { readonly durum: 'hazir'; readonly set: TurSeti };

export function useTurSeti(duzey: SetDuzeyi, tohum: number): TurSetiDurumu {
  const kume = useTurKume();
  const h = useTurHavuzu();
  const hv = useHamleVerisi();
  const hamleler = hv.durum === 'hazir' ? hv.veri.glifler : undefined;
  const hamleBitti = hv.durum !== 'yukleniyor';
  // Adım 74: sınıf ve zenginleştirme tariflerinde cümle adımları (cümle parçası + havuz). Açılamazsa set sessizce yedek adıma
  // düşmez (öğretmen ve ev cihazı farklı set kurmasın): açık hata döner (Adım 80).
  const cv = useCumleVerisi(duzey !== 'destek');
  const cumleler = cv.durum === 'hazir' ? cv.cumleler : undefined;
  const cumleBitti = cv.durum !== 'yukleniyor';
  const cumleHatasi = cv.durum === 'hata' ? cv.mesaj : null;
  // Adım 80: zenginleştirme tarifinde metin etkinliği (T-13). Metin verisi açılamazsa set SESSİZCE yedek adıma düşmez:
  // öğretmen ve ev cihazı farklı set kurmasın diye açık hata döner.
  const mv = useMetinVerisi(duzey === 'zengin');
  const metinler = mv.durum === 'hazir' ? mv.metinler : undefined;
  const metinBitti = mv.durum !== 'yukleniyor';
  const metinHatasi = mv.durum === 'hata' ? mv.mesaj : null;
  return useMemo((): TurSetiDurumu => {
    if (h.durum === 'hata') return { durum: 'hata', mesaj: `Sözcük havuzu açılamadı: ${h.mesaj}` };
    if (cumleHatasi !== null) return { durum: 'hata', mesaj: `Cümle verisi açılamadı: ${cumleHatasi}` };
    if (metinHatasi !== null) return { durum: 'hata', mesaj: `Metin verisi açılamadı: ${metinHatasi}` };
    if (h.durum !== 'hazir' || !hamleBitti || !cumleBitti || !metinBitti) return { durum: 'yukleniyor' };
    return { durum: 'hazir', set: turSetiKur({ havuz: h.havuz, kume, duzey, tohum, hamleler, cumleler, metinler }) };
  }, [h, hamleBitti, hamleler, cumleBitti, cumleler, cumleHatasi, metinBitti, metinler, metinHatasi, kume, duzey, tohum]);
}
