import { useSyncExternalStore } from 'react';
import type { TurKagitIstegi } from './kagit/turKagidi';
import type { TurSablonKodu, TurZorluk } from '../../content/dersler/tur/sablonlar/turSoru';

/**
 * Türkçe (Okuma Yazma) ekran durumu — YALNIZ `VITE_DERS_TUR=1` derlemesinde kullanılır (Adım 64, ADR-0016).
 *
 * Matematik akışının `appStore`'una dokunmaz: Türkçe ekranı açıkken `App.tsx` onu ortak kabukla (`kabuk()`) çizer;
 * kapanınca uygulama kaldığı ekrana döner. Durum yalnız bellekte, hiçbir yere yazılmaz (öğrenci verisi yok).
 * Modülün üst düzeyinde yan etki yoktur: bayraksız üretim derlemesinde `App.tsx`'teki kullanım ölü kod olarak
 * atılınca bu modül de pakete girmez (üretim JS bayt bayt aynı; CI imleç denetimi).
 */

export type TurEkrani =
  | { readonly ekran: 'giris' }
  | { readonly ekran: 'yazilisSecimi'; readonly sekme?: number }
  | { readonly ekran: 'yazilis'; readonly anahtar: string; readonly sekme: number }
  | { readonly ekran: 'kagitlar' }
  /** Resimli sözcük görselleri kataloğu (Adım 68): harf grubu ve gri (baskı) görünümü. */
  | { readonly ekran: 'gorseller'; readonly grup: number; readonly gri: boolean }
  /** Kâğıt için glif seçimi: `harf` tek glif → önizleme; `destek` çoklu seçim (glif anahtarları, seçim sırası). */
  | {
      readonly ekran: 'kagitSecimi';
      readonly tur: 'harf' | 'destek';
      readonly sekme?: number;
      readonly secim?: readonly string[];
    }
  /** Etkinlik seçimi (Adım 69): öğretilen küme seçici, şablon ve zorluk (öğretmen). */
  | { readonly ekran: 'etkinlikler' }
  /** Bir etkinlik sorusu (çocuk yüzeyi). Küme `turKume` modülünden (adreste `?tur=`). */
  | { readonly ekran: 'etkinlik'; readonly sablon: TurSablonKodu; readonly zorluk: TurZorluk; readonly tohum: number }
  /** Kâğıt önizlemesi + Yazdır; `geri` önizlemeyi açan ekran. */
  | { readonly ekran: 'kagit'; readonly istek: TurKagitIstegi; readonly geri: TurEkrani };

/** `undefined`: henüz okunmadı — ilk okumada açılış adresinden (`?ders=tur`) alınır. */
let durum: TurEkrani | null | undefined;
let dinleyiciler: Set<() => void> | null = null;

function bildir(): void {
  for (const d of dinleyiciler ?? []) d();
}

export function turEkraniAc(e: TurEkrani): void {
  durum = e;
  bildir();
}

export function turEkraniKapat(): void {
  durum = null;
  bildir();
}

export function turEkraniOku(): TurEkrani | null {
  if (durum === undefined) durum = typeof location === 'undefined' ? null : turAcilisEkrani(location.search);
  return durum;
}

export function turEkraniAbone(d: () => void): () => void {
  (dinleyiciler ??= new Set()).add(d);
  return () => dinleyiciler?.delete(d);
}

export function useTurEkrani(): TurEkrani | null {
  return useSyncExternalStore(turEkraniAbone, turEkraniOku, turEkraniOku);
}

/**
 * Açılış adresi: `?ders=tur` Türkçe girişini açar (yalnız bayraklı derlemede okunur). Etkinlik doğrudan da açılır:
 * `?ders=tur&etkinlik=T-04&zorluk=3&tohum=1` (öğretmen bağlantısı ve e2e; küme `&tur=<kod>`).
 */
export function turAcilisEkrani(arama: string): TurEkrani | null {
  const p = new URLSearchParams(arama);
  if (p.get('ders') !== 'tur') return null;
  const sablon = p.get('etkinlik');
  if (sablon === 'liste') return { ekran: 'etkinlikler' };
  // Yalnız tip içe aktarılır: bu modül `App.tsx`'ten okunur, üretim paketine çalışma anı kodu sızmasın.
  if (sablon && /^T-0[1-8]$/.test(sablon)) {
    const z = Number(p.get('zorluk') ?? '1');
    const t = Number(p.get('tohum') ?? '1');
    return {
      ekran: 'etkinlik',
      sablon: sablon as TurSablonKodu,
      zorluk: (Number.isInteger(z) && z >= 1 && z <= 5 ? z : 1) as TurZorluk,
      tohum: Number.isInteger(t) && t >= 0 ? t : 1,
    };
  }
  return { ekran: 'giris' };
}
