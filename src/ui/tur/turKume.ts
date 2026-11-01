import { useSyncExternalStore } from 'react';
import { kumeCoz, kumeKodla, resmiKume } from '../../content/dersler/tur/ogretilenKume';
import { sinifAyariGuncelle, sinifAyariOku } from './sinifAyariDepo';

/**
 * Öğretilen harf kümesi — öğretmen düzeyi ayar (Okuma Yazma planı §2.4.5, Adım 69, 71). YALNIZ bayraklı derlemede.
 *
 * Öğrenci verisi değildir. Açılışta sırasıyla: adres (`?tur=<kod>`, base36 bit maskesi; ADR-0010 eve link sözleşmesi
 * gibi) → sınıf düzeyi ayar (K-7, tek yerel anahtar; ADR-0002 Ek 1; eve link cihazında okunmaz) → varsayılan 1. grubun
 * küçük harfleri (a n e t i l). Öğretmen değiştirince adres `history.replaceState` ile güncellenir (yeni geçmiş kaydı
 * yok) ve sınıf ayarı yazılır.
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
    const sinif = sinifAyariOku().kume;
    kume = (kod && kumeCoz(kod)) || (sinif && kumeCoz(sinif)) || varsayilanKume();
  }
  return kume;
}

export function turKumeYaz(yeni: ReadonlySet<string>): void {
  kume = new Set(yeni);
  const kod = kumeKodla(kume);
  if (typeof history !== 'undefined' && typeof location !== 'undefined') {
    const p = new URLSearchParams(location.search);
    p.set('tur', kod);
    history.replaceState(history.state, '', `${location.pathname}?${p.toString()}${location.hash}`);
  }
  sinifAyariGuncelle({ kume: kod });
  for (const d of dinleyiciler) d();
}

function abone(d: () => void): () => void {
  dinleyiciler.add(d);
  return () => dinleyiciler.delete(d);
}

export function useTurKume(): ReadonlySet<string> {
  return useSyncExternalStore(abone, turKumeOku, turKumeOku);
}
