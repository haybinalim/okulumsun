/**
 * SINIF TURU — takım kimliği ve tur sonucu yardımcıları (SAF; plan v2 Adım 36 aşama 2b, KG-47).
 *
 * Takım kimliği en az üç kanaldan taşınır: renk (görsel), hayvan ikonu (renk körlüğü için
 * biçim) ve mevcut `renk.*` ses klibi (ses). Takım ADI yoktur; öğrenci adı girişi YASAKTIR.
 * Saat, rastgelelik, depolama ve ağ yok.
 */
import { renkSesAnahtari, RENKLER, type Renk } from '../exercises/types';
import type { SpeechKey } from '../audio/audioManifest.generated';
import type { MaddeSonuc } from '../progress/itemLifecycle';
import { TAKIM_SAYISI_ARALIGI } from './sinifTuru';

export interface TakimKimligi {
  readonly renk: Renk;
  readonly hex: string;
  /** Renkten bağımsız ikinci görsel kanal (hayvan ikonu). */
  readonly hayvan: string;
  /** Erişilebilir ad: "mor takım (kedi)". Sayı içermez. */
  readonly etiket: string;
  /** Sıra duyurusu sesi: mevcut renk klibi (yeni klip Adım 31'e ertelendi). */
  readonly ses: SpeechKey;
}

const HEX: Record<Renk, string> = {
  mor: '#7C3AED',
  turuncu: '#EA580C',
  yesil: '#059669',
  mavi: '#2563EB',
  pembe: '#DB2777',
  sari: '#CA8A04',
};

const HAYVAN: Record<Renk, readonly [string, string]> = {
  mor: ['🐱', 'kedi'],
  turuncu: ['🦊', 'tilki'],
  yesil: ['🐸', 'kurbağa'],
  mavi: ['🐳', 'balina'],
  pembe: ['🐰', 'tavşan'],
  sari: ['🐥', 'civciv'],
};

const AD: Record<Renk, string> = {
  mor: 'mor',
  turuncu: 'turuncu',
  yesil: 'yeşil',
  mavi: 'mavi',
  pembe: 'pembe',
  sari: 'sarı',
};

export function takimKimligi(renk: Renk): TakimKimligi {
  const [hayvan, hayvanAdi] = HAYVAN[renk];
  return { renk, hex: HEX[renk], hayvan, etiket: `${AD[renk]} takım (${hayvanAdi})`, ses: renkSesAnahtari(renk) };
}

/** Renk adı (Türkçe karakterli), ekranda "Sıra mor takımda." için. */
export function renkAdi(renk: Renk): string {
  return AD[renk];
}

/** Kurulum varsayılanı: ilk `adet` renk. */
export function varsayilanRenkler(adet: number): readonly Renk[] {
  const [en, cok] = TAKIM_SAYISI_ARALIGI;
  const n = Math.max(en, Math.min(cok, Math.trunc(adet)));
  return RENKLER.slice(0, n);
}

/** Kavanoz büyüklüğü: takım başına tur sayısı. Sayı ekranda gösterilmez, yalnız boyut adı. */
export const KAVANOZ_BOYUTLARI = [
  { ad: 'Küçük kavanoz', turPerTakim: 2 },
  { ad: 'Orta kavanoz', turPerTakim: 3 },
  { ad: 'Büyük kavanoz', turPerTakim: 4 },
] as const;

/** İkinci yanlışta tur birlikte çözülür (plan v2 Adım 36 kural 4). */
export const BIRLIKTE_COZME_ESIGI = 2;

/**
 * Turun kapanış sonucu. İlk denemede doğru → olduğu gibi; yanlıştan sonra doğru → `dogru:false`,
 * K1 (aynı takım tekrar denedi); birlikte çözülen → `dogru:false`, K3. Yalnız bellekte (Adım 40).
 */
export function turSonucu(sonuc: MaddeSonuc, yanlisSayisi: number, birlikteCozuldu: boolean): MaddeSonuc {
  if (birlikteCozuldu) return { ...sonuc, dogru: false, kullanilanYardimKademesi: 3 };
  if (yanlisSayisi > 0) return { ...sonuc, dogru: false, kullanilanYardimKademesi: 1 };
  return sonuc;
}
