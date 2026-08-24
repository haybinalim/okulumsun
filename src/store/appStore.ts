/**
 * UYGULAMA DURUMU — Zustand store (plan §10, §11).
 *
 * Tüm navigasyon, profil ve ayar durumu burada.
 * Geliştirme sürümünde öğrenci/veli ayarları yalnız bellek durumunda tutulur.
 * Navigasyon durumu kalıcı DEĞİL — ekran geçici, yenilemede sıfırlanır.
 *
 * TAHTA MODU KURALI (plan §3.3, §11):
 *  · Geliştirme sürümünde hiçbir mod öğrenci/veli verisini IndexedDB'ye yazmaz.
 *  · Bu, `persistenceEnabled` bayrağıyla kod düzeyinde garanti edilir.
 *    repository.ts tüm yazma fonksiyonlarında bu bayrağı kontrol eder.
 *  · Tahta modunda avatar/renk seçilmez, çıkartma/bahçe atlanır.
 */

import { create } from 'zustand';
import { ACCENTS, type Accent } from '../design/tokens';
import { OGRENCI_VERISI_SAKLANIR_MI } from '../persistence/veriSaklamaPolitikasi';

// ---------------------------------------------------------------- tipler

/** Uygulama ekranları — plan §11 akış. */
export type Ekran =
  | 'audioUnlock'
  | 'modSecimi'
  | 'avatarSecimi'
  | 'renkSecimi'
  | 'anaEkran'
  | 'temaGirisi'
  | 'alistirma'
  | 'oturumSonu'
  | 'bahcem'
  | 'konuSecimi'
  | 'veliKapisi'
  | 'veliPaneli'
  | 'kaynaklar';

/** Kullanım modu — plan §3.3. */
export type Mod = 'tahta' | 'kisisel';

/**
 * Geliştirme sürümünde öğrenci ve veli verisi hiçbir modda saklanmaz.
 * Ürün sahibi saklama modelini onayladığında bu karar merkezi politika modülünden
 * ayrıca ele alınacaktır.
 */
export function persistenceEnabled(mod: Mod | null): boolean {
  return OGRENCI_VERISI_SAKLANIR_MI && mod === 'kisisel';
}

/** Okuma seviyesi — plan §6.3. 0=Eylül varsayımı (okumıyor). */
export type ReadingLevel = 0 | 1 | 2 | 3;

/** Avatar seçeneği — 2×4 ızgara için 8 seçenek. */
export interface AvatarSecenegi {
  readonly id: string;
  readonly ad: string;
  readonly renk: string;
}

/** 8 avatar — hayvan Figürleri (insan değil, etnik/cinsiyet nötr). */
export const AVATARLAR: readonly AvatarSecenegi[] = [
  { id: 'kedi', ad: 'Kedi', renk: '#F97316' },
  { id: 'kopek', ad: 'Köpek', renk: '#CA8A04' },
  { id: 'kus', ad: 'Kuş', renk: '#0EA5E9' },
  { id: 'balik', ad: 'Balık', renk: '#2563EB' },
  { id: 'kelebek', ad: 'Kelebek', renk: '#7C3AED' },
  { id: 'tavsan', ad: 'Tavşan', renk: '#DB2777' },
  { id: 'ayi', ad: 'Ayı', renk: '#92400E' },
  { id: 'kurbağa', ad: 'Kurbağa', renk: '#059669' },
] as const;

/** Tema bilgisi — ana ekrandaki 7 kart. */
export interface TemaKart {
  readonly no: number;
  readonly ad: string;
  readonly renk: string;
  readonly speechKey: string;
}

/** 7 tema — plan §1 öğretim sırasıyla. */
export const TEMALAR: readonly TemaKart[] = [
  { no: 1, ad: 'Yön ve Yerler', renk: '#EA580C', speechKey: 'tema.geometri-1' },
  { no: 2, ad: 'Sayılar', renk: '#2563EB', speechKey: 'tema.sayilar-1' },
  { no: 3, ad: 'Ölçme', renk: '#059669', speechKey: 'tema.sayilar-2' },
  { no: 4, ad: 'Toplama ve Çıkarma', renk: '#7C3AED', speechKey: 'tema.islemler' },
  { no: 5, ad: 'Paralarımız', renk: '#CA8A04', speechKey: 'tema.sayilar-3' },
  { no: 6, ad: 'Şekiller', renk: '#DB2777', speechKey: 'tema.geometri-2' },
  { no: 7, ad: 'Sayalım ve Gösterelim', renk: '#0EA5E9', speechKey: 'tema.veri' },
] as const;

// ---------------------------------------------------------------- store

interface AppStore {
  // --- Navigasyon
  ekran: Ekran;
  oncekiEkran: Ekran | null;

  // --- Profil (plan §3.3)
  mod: Mod | null;
  avatarId: string | null;
  accentId: Accent['id'] | null;

  // --- Ayarlar (veli paneli)
  readingLevel: ReadingLevel;
  okulAyiIndex: number; // 0–9 (0=Eylül)
  sesHizi: number; // 1.0 normal

  // --- Veli
  veliGecildi: boolean;

  // --- Oturum durumu
  secilenTemaNo: number | null;
  secilenDugumId: string | null;
  oturumTamamlandi: boolean;

  // --- Actions
  ekranGit: (ekran: Ekran) => void;
  modSec: (mod: Mod) => void;
  avatarSec: (id: string) => void;
  renkSec: (id: Accent['id']) => void;
  readingLevelAyarla: (level: ReadingLevel) => void;
  okulAyiAyarla: (index: number) => void;
  sesHiziAyarla: (hiz: number) => void;
  veliGec: (gecildi: boolean) => void;
  temaSec: (temaNo: number) => void;
  dugumSec: (dugumId: string) => void;
  oturumuTamamla: () => void;
  sifirla: () => void;
  // --- Kalıcılık (Adım 9)
  profildenYukle: (profil: Partial<AppStore>) => void;
}

const baslangicDurumu = {
  ekran: 'audioUnlock' as Ekran,
  oncekiEkran: null as Ekran | null,
  mod: null as Mod | null,
  avatarId: null as string | null,
  accentId: null as Accent['id'] | null,
  readingLevel: 0 as ReadingLevel,
  okulAyiIndex: 0, // Eylül varsayımı
  sesHizi: 1.0,
  veliGecildi: false,
  secilenTemaNo: null as number | null,
  secilenDugumId: null as string | null,
  oturumTamamlandi: false,
};

export const useAppStore = create<AppStore>((set) => ({
  ...baslangicDurumu,

  ekranGit: (ekran) =>
    set((s) => ({ oncekiEkran: s.ekran, ekran })),

  modSec: (mod) =>
    set({
      mod,
      // Tahta modunda avatar/renk atlanır → ana ekrana git.
      // Kişisel modda avatar seçimine git.
      ekran: mod === 'tahta' ? 'anaEkran' : 'avatarSecimi',
      oncekiEkran: 'modSecimi',
    }),

  avatarSec: (id) =>
    set({ avatarId: id, ekran: 'renkSecimi', oncekiEkran: 'avatarSecimi' }),

  renkSec: (id) =>
    set({ accentId: id, ekran: 'anaEkran', oncekiEkran: 'renkSecimi' }),

  readingLevelAyarla: (level) => set({ readingLevel: level }),
  okulAyiAyarla: (index) => set({ okulAyiIndex: Math.max(0, Math.min(index, 9)) }),
  sesHiziAyarla: (hiz) => set({ sesHizi: Math.max(0.5, Math.min(hiz, 1.5)) }),

  veliGec: (gecildi) => set({ veliGecildi: gecildi }),

  temaSec: (temaNo) =>
    set((s) => ({
      secilenTemaNo: temaNo,
      secilenDugumId: null,
      // Kişisel mod → tema girişi → gerçek oturum, tahta → konu seçimi.
      ekran: s.mod === 'kisisel' ? 'temaGirisi' : 'konuSecimi',
      oncekiEkran: 'anaEkran',
      oturumTamamlandi: false,
    })),

  dugumSec: (dugumId: string) =>
    set({
      secilenDugumId: dugumId,
      ekran: 'alistirma',
      oncekiEkran: 'konuSecimi',
      oturumTamamlandi: false,
    }),

  oturumuTamamla: () =>
    set({ oturumTamamlandi: true, ekran: 'oturumSonu', oncekiEkran: 'alistirma' }),

  sifirla: () => set({ ...baslangicDurumu }),

  profildenYukle: (profil) => set(profil),
}));

export function accentBul(id: Accent['id'] | null): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
}

export function avatarBul(id: string | null): AvatarSecenegi | null {
  if (!id) return null;
  return AVATARLAR.find((a) => a.id === id) ?? null;
}
