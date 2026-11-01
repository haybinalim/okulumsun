import { useSyncExternalStore } from 'react';
import { kumeCoz, kumeKodla, resmiKume } from '../../content/dersler/tur/ogretilenKume';

/**
 * Öğretilen harf kümesi — öğretmen düzeyi ayar (Okuma Yazma planı §2.4.5, Adım 69). YALNIZ bayraklı derlemede.
 *
 * Öğrenci verisi değildir ve hiçbir yere SAKLANMAZ: yalnız bellekte ve adreste (`?tur=<kod>`, base36 bit maskesi;
 * ADR-0010 eve link sözleşmesi gibi). Açılışta adresten okunur; geçersiz/eksikse varsayılan 1. grubun küçük harfleri
 * (a n e t i l). Öğretmen değiştirince adres `history.replaceState` ile güncellenir (yeni geçmiş kaydı yok).
 */
export const VARSAYILAN_KUME_HARFI = 'l';

let kume: ReadonlySet<string> | undefined;
const dinleyiciler = new Set<() => void>();

export function varsayilanKume(): Set<string> {
  return resmiKume(VARSAYILAN_KUME_HARFI, false);
}

export function turKumeOku(): ReadonlySet<string> {
  if (kume === undefined) {
    const kod = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('tur');
    kume = (kod && kumeCoz(kod)) || varsayilanKume();
  }
  return kume;
}

export function turKumeYaz(yeni: ReadonlySet<string>): void {
  kume = new Set(yeni);
  if (typeof history !== 'undefined' && typeof location !== 'undefined') {
    const p = new URLSearchParams(location.search);
    p.set('tur', kumeKodla(kume));
    history.replaceState(history.state, '', `${location.pathname}?${p.toString()}${location.hash}`);
  }
  for (const d of dinleyiciler) d();
}

function abone(d: () => void): () => void {
  dinleyiciler.add(d);
  return () => dinleyiciler.delete(d);
}

export function useTurKume(): ReadonlySet<string> {
  return useSyncExternalStore(abone, turKumeOku, turKumeOku);
}
