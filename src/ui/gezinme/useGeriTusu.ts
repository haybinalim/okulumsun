import { useEffect, useRef } from 'react';
import { gezinmeDurumu, useAppStore, type Ekran } from '../../store/appStore';
import { geriHedefi } from './gezinme';
import { cikisOnayiYanitla, gezinmeIste, useCikisOnayi } from './gezinmeIstegi';

/** Tarayıcı geçmişine konan koruma kaydının işareti. */
const KORUMA = 'okulumsunGeri';

/**
 * TARAYICI / ANDROID GERİ TUŞU (KG-103) — ekrandaki "Geri" ile aynı davranış.
 *
 * Uygulama ekranları tek adreste yaşar (yol değişmez). Geri'si olan bir ekrandayken geçmişe adresi
 * değiştirmeyen tek bir koruma kaydı (`pushState`, aynı URL; hash/sorgu korunur) konur; geri tuşu bu
 * kaydı tüketince `popstate` gelir ve uygulama içi Geri çalışır (onay gerekiyorsa pencere açılır;
 * pencere açıkken geri tuşu = "Hayır"). Hâlâ Geri'si olan bir ekrandaysak koruma yeniden konur.
 * Gezinmesiz ekranda (ana ekran, mod seçimi) koruma konmaz: geri tuşu tarayıcının kendi işini yapar
 * (sekmeden/PWA'dan çıkar) — kullanıcı uygulamaya hapsolmaz.
 *
 * Gömülü modda (Adım 56, KG-74) geçmişe HİÇ kayıt konmaz: iframe'in `pushState`i üst sayfanın (EBA /
 * okul portalı) ortak oturum geçmişine girer ve portalın kendi geri tuşunu ele geçirirdi. Orada yalnız
 * ekrandaki düğmeler çalışır.
 */
export function useGeriTusu(etkin: boolean): void {
  const ekran = useAppStore((s) => s.ekran);
  const geriVar = useAppStore((s) => geriHedefi(gezinmeDurumu(s)) !== null);
  const korumaVar = useRef(false);

  useEffect(() => {
    if (!etkin || !geriVar || korumaVar.current) return;
    korumaKoy();
    korumaVar.current = true;
  }, [etkin, geriVar, ekran]);

  useEffect(() => {
    if (!etkin) return;
    const dinle = (): void => {
      korumaVar.current = false;
      const simdiki: Ekran = useAppStore.getState().ekran;
      const bekleyen = useCikisOnayi.getState().bekleyen;
      if (bekleyen && bekleyen.ekran === simdiki) cikisOnayiYanitla(false);
      else gezinmeIste('geri');
      if (geriHedefi(gezinmeDurumu(useAppStore.getState())) !== null) {
        korumaKoy();
        korumaVar.current = true;
      }
    };
    window.addEventListener('popstate', dinle);
    return () => window.removeEventListener('popstate', dinle);
  }, [etkin]);
}

function korumaKoy(): void {
  try {
    window.history.pushState({ [KORUMA]: true }, '');
  } catch {
    // Geçmiş API'si kullanılamıyorsa (ör. kısıtlı iframe) yalnız ekrandaki düğmeler çalışır.
  }
}
