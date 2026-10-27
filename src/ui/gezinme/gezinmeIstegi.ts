/**
 * Geri / Ana menü isteği (KG-103): ekrandaki düğme ve tarayıcı/Android geri tuşu aynı yoldan geçer.
 *
 * İlerleme kaybolacaksa (`cikisOnayiGerekir`) önce "Etkinlikten çıkmak istiyor musun?" sorulur; bekleyen
 * istek ekranıyla birlikte tutulur — ekran bu arada değişirse (ör. set bitti) eski soru düşer.
 */
import { create } from 'zustand';
import { gezinmeDurumu, useAppStore, type Ekran } from '../../store/appStore';
import { cikisOnayiGerekir, gezinmeHedefi, type GezinmeYonu } from './gezinme';

interface CikisOnayiDurumu {
  readonly bekleyen: { readonly ekran: Ekran; readonly yon: GezinmeYonu } | null;
}

export const useCikisOnayi = create<CikisOnayiDurumu>(() => ({ bekleyen: null }));

/** Bekleyen onay hâlâ bu ekrana mı ait (değilse gösterilmez). */
export function bekleyenOnay(ekran: Ekran): GezinmeYonu | null {
  const b = useCikisOnayi.getState().bekleyen;
  return b && b.ekran === ekran ? b.yon : null;
}

/**
 * Geri ya da Ana menü ister. Gezinmesiz ekranda `false` (hiçbir şey olmaz). Onay gerekiyorsa pencere
 * açılır, gerekmiyorsa hemen gidilir; ikisinde de `true`.
 */
export function gezinmeIste(yon: GezinmeYonu): boolean {
  const s = useAppStore.getState();
  const d = gezinmeDurumu(s);
  if (gezinmeHedefi(d, yon) === null) return false;
  if (cikisOnayiGerekir(d)) {
    useCikisOnayi.setState({ bekleyen: { ekran: s.ekran, yon } });
    return true;
  }
  useCikisOnayi.setState({ bekleyen: null });
  s.gezin(yon);
  return true;
}

/** Onay penceresinin yanıtı: Evet → bekleyen yöne git; Hayır → etkinlikte kal. */
export function cikisOnayiYanitla(evet: boolean): void {
  const yon = bekleyenOnay(useAppStore.getState().ekran);
  useCikisOnayi.setState({ bekleyen: null });
  if (evet && yon) useAppStore.getState().gezin(yon);
}
