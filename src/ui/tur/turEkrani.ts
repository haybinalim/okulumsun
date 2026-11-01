import { useSyncExternalStore } from 'react';
import type { TurKagitIstegi } from './kagit/turKagidi';
import type { TurSablonKodu, TurZorluk } from '../../content/dersler/tur/sablonlar/turSoru';
import type { SetAdimi } from '../../content/dersler/tur/turSet';

/**
 * Türkçe (Okuma Yazma) ekran durumu — YALNIZ `VITE_DERS_TUR=1` derlemesinde kullanılır (Adım 64, ADR-0016).
 *
 * Matematik akışının `appStore`'una dokunmaz: Türkçe ekranı açıkken `App.tsx` onu ortak kabukla (`kabuk()`) çizer;
 * kapanınca uygulama kaldığı ekrana döner. Durum yalnız bellekte, hiçbir yere yazılmaz (öğrenci verisi yok).
 * Modülün üst düzeyinde yan etki yoktur: bayraksız üretim derlemesinde `App.tsx`'teki kullanım ölü kod olarak
 * atılınca bu modül de pakete girmez (üretim JS bayt bayt aynı; CI imleç denetimi).
 */

export type TurEkrani =
  /** Öğretmen ana ekranı (Adım 71): ders seçimi, bugünkü ses, araçlar. */
  | { readonly ekran: 'giris' }
  /** Öğretilen harfler — gelişmiş küme düzenleme (Adım 71, §2.4.11 madde 2). */
  | { readonly ekran: 'harfler' }
  /** Günün akışı (Adım 71, §2.4.11 madde 3): basamaklar, sıra öğretmence değişir. */
  | { readonly ekran: 'akis' }
  /** Haftalık ses planı (Adım 71, §2.4.11 madde 4): yalnız öneri. */
  | { readonly ekran: 'sesPlani' }
  /** Set hazırla (Türkçe; Adım 71, §2.4.11 madde 5). */
  | { readonly ekran: 'setHazirla' }
  /** Eve gönder (öğretmen; Adım 71 aşama 3): set → eve link + QR + veli kartı. */
  | { readonly ekran: 'eveGonder'; readonly duzey: 'destek' | 'sinif' | 'zengin'; readonly tohum: number }
  /** Eve link açılışı (veli/çocuk): `?ders=tur&ev=<set kodu>&tur=<küme>`; kod TurEkrani'nda çözülür. Öğretmen ekranına yol yok. */
  | { readonly ekran: 'ev'; readonly kod: string }
  /** Kaynaklar (Okuma Yazma): program, TemelYazi, özgün içerik, ses kaynağı. */
  | { readonly ekran: 'kaynaklar' }
  /** Set akışı: adımlar sırayla (çocuk yüzeyi); `geri` seti açan ekran. */
  | { readonly ekran: 'set'; readonly adimlar: readonly SetAdimi[]; readonly sira: number; readonly geri: TurEkrani }
  | { readonly ekran: 'yazilisSecimi'; readonly sekme?: number }
  /** `geri`: gösterimi açan ekran (ör. günün akışı); yoksa harf seçimi. */
  | { readonly ekran: 'yazilis'; readonly anahtar: string; readonly sekme: number; readonly geri?: TurEkrani }
  /** Parmakla izleme (Adım 70, M-4): çizim yalnız bu ekranın belleğinde, ekran değişince silinir. */
  | { readonly ekran: 'izleme'; readonly anahtar: string; readonly sekme: number; readonly geri?: TurEkrani }
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
  | {
      readonly ekran: 'etkinlik';
      readonly sablon: TurSablonKodu;
      readonly zorluk: TurZorluk;
      readonly tohum: number;
      /** Etkinliği açan ekran (ör. günün akışı); yoksa etkinlik seçimi. */
      readonly geri?: TurEkrani;
    }
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
 * `?ders=tur&etkinlik=T-04&zorluk=3&tohum=1` (öğretmen bağlantısı ve e2e; küme `&tur=<kod>`); parmakla izleme
 * `?ders=tur&izle=kucuk:a`.
 */
export function turAcilisEkrani(arama: string): TurEkrani | null {
  const p = new URLSearchParams(arama);
  if (p.get('ders') !== 'tur') return null;
  // Eve link (veli/çocuk cihazı): her şeyden önce gelir; set kodu ve küme TurEkrani'nda katı çözülür (bozuksa açıklama).
  const ev = p.get('ev');
  if (ev !== null) return { ekran: 'ev', kod: ev };
  // Öğretmen ekranları doğrudan (yer imi, e2e): `?ders=tur&ekran=akis`.
  const ogretmenEkrani = p.get('ekran');
  if (
    ogretmenEkrani === 'akis' ||
    ogretmenEkrani === 'harfler' ||
    ogretmenEkrani === 'sesPlani' ||
    ogretmenEkrani === 'setHazirla' ||
    ogretmenEkrani === 'kaynaklar'
  )
    return { ekran: ogretmenEkrani };
  const izle = p.get('izle');
  if (izle !== null) return /^(kucuk|buyuk|rakam):.$/u.test(izle) ? { ekran: 'izleme', anahtar: izle, sekme: 0 } : { ekran: 'giris' };
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
