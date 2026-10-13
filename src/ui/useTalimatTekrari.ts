/**
 * TALİMAT TEKRARI (plan v2 Adım 55) — yetişkin ayarı, varsayılan kapalı.
 *
 * Alıştırma ekranında 8 sn hiç dokunulmazsa son ekran talimatı BİR KEZ yeniden söylenir.
 * Her dokunuş sayacı sıfırlar ve yeni bir tekrar hakkı açar (hareketsizlik dönemi başına en çok
 * bir tekrar). K1 yardımının 15 sn kuralı aynen kalır; bu kanca yardım kademesini ilerletmez.
 * Konuşma sürüyorsa tekrar atlanır (üst üste binmez). Hiçbir şey saklanmaz.
 *
 * SAF DEĞİL: zamanlayıcı ve olay dinleyicisi; gecikme `talimatTekrariGecikmesi`'nden (SAF).
 */
import { useEffect, type RefObject } from 'react';
import { speech } from '../audio/speech';
import { talimatTekrariGecikmesi } from '../design/kapsayicilik';
import { useAppStore } from '../store/appStore';

export function useTalimatTekrari(kok: RefObject<HTMLElement | null>): void {
  const gecikme = useAppStore((s) => talimatTekrariGecikmesi(s.kapsayicilik));

  useEffect(() => {
    const el = kok.current;
    if (gecikme === null || !el) return;
    let zamanlayici: ReturnType<typeof setTimeout> | null = null;
    const kur = () => {
      if (zamanlayici !== null) clearTimeout(zamanlayici);
      zamanlayici = setTimeout(() => {
        zamanlayici = null;
        speech.talimatiTekrarla();
      }, gecikme);
    };
    kur();
    el.addEventListener('pointerdown', kur, { capture: true });
    el.addEventListener('keydown', kur, { capture: true });
    return () => {
      if (zamanlayici !== null) clearTimeout(zamanlayici);
      el.removeEventListener('pointerdown', kur, { capture: true });
      el.removeEventListener('keydown', kur, { capture: true });
    };
  }, [gecikme, kok]);
}
