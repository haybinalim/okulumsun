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
import type { GunlukSet } from '../ogretmen/gunlukSet';
import type { Renk } from '../exercises/types';
import {
  sinifTuruBaslat as sinifTuruDurumuBaslat,
  sinifTuruIlerlet,
  type SinifTuruDurumu,
  type SinifTuruOlayi,
} from '../sinif/sinifTuru';

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
  | 'kaynaklar'
  | 'sorunBildir'
  | 'setHazirla'
  | 'haftalikPlan'
  | 'calismaKagidi'
  | 'sinifTuruKurulum'
  | 'sinifTuru'
  | 'sinifTuruSonu'
  | 'dersSonuOzeti'
  | 'evdeCalis'
  | 'veliIpucuKarti'
  | 'kesifMasasi'
  | 'eveGonder';

/** Sınıf Turu durumunun yaşadığı ekranlar; başka ekrana geçişte durum `null` olur. */
export const SINIF_TURU_EKRANLARI: ReadonlySet<Ekran> = new Set<Ekran>(['sinifTuruKurulum', 'sinifTuru', 'sinifTuruSonu']);

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
  /** Bugünün bahçesi: yalnız bellekte, yenilemede sıfırlanır (Adım 29). */
  bugunTamamlanan: number;
  /** Bugünün seti (Adım 34): yalnız bellekte, yenilemede kaybolur; kalıcılık için set kodu yer imine eklenir. */
  aktifSet: GunlukSet | null;
  /** Çalışma kâğıdı için hazırlanan set (Adım 35): yalnız bellekte; kâğıt saklanmaz, koddan yeniden üretilir. */
  kagitSeti: GunlukSet | null;
  /** Sınıf Turu (Adım 36): yalnız bellekte; turdan çıkınca `null` (ADR-0008, gizlilik). */
  sinifTuru: SinifTuruDurumu | null;
  /** Eve link (Adım 42, ADR-0010): bağlantıdan okunan set; yalnız bellekte, ev çalışması bitince `null`. */
  evSeti: GunlukSet | null;
  /** Eve gönder ekranındaki set (Adım 42 aşama 3): yalnız bellekte; ekrandan çıkınca kullanılmaz. */
  eveGonderSeti: GunlukSet | null;
  /** Evde 10 dakika (Adım 43): veli başlattıysa ipucu temasının numarası; yalnız bellekte. */
  evdeOnDakikaTema: number | null;

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
  setBaslat: (set: GunlukSet) => void;
  setBitir: () => void;
  kagitIcinSet: (set: GunlukSet) => void;
  sinifTuruKur: () => void;
  sinifTuruBaslat: (renkler: readonly Renk[], kaynak: GunlukSet, turPerTakim: number) => void;
  /** Geçersiz olay (ör. çift dokunuş) sessizce yok sayılır; durum değişmez. */
  sinifTuruOlay: (olay: SinifTuruOlayi) => void;
  sinifTuruKapat: () => void;
  /** Açılışta geçerli eve link okunduysa ayarlanır; ses kilidinden sonra `evdeCalis` açılır. */
  evSetiAyarla: (set: GunlukSet | null) => void;
  /** Ev çalışmasını kapatır: set silinir, mod seçimine dönülür. */
  evCalismasiniBitir: () => void;
  /** Veli: bu haftanın ev setini başlat (Adım 43); sonda ipucu kartı açılır. */
  evdeOnDakikaBaslat: (set: GunlukSet, tema: number) => void;
  /** Çocuk kısmı bitti: yetişkine ipucu kartı. */
  evIpucunaGec: () => void;
  /** İpucu kartı kapandı: set ve tema silinir, çocuk ekranına dönülür. */
  evdeOnDakikaBitir: () => void;
  /** Öğretmen: seti eve link/QR olarak göster. */
  eveGonder: (set: GunlukSet) => void;
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
  bugunTamamlanan: 0,
  aktifSet: null as GunlukSet | null,
  kagitSeti: null as GunlukSet | null,
  sinifTuru: null as SinifTuruDurumu | null,
  evSeti: null as GunlukSet | null,
  eveGonderSeti: null as GunlukSet | null,
  evdeOnDakikaTema: null as number | null,
};

export const useAppStore = create<AppStore>((set) => ({
  ...baslangicDurumu,

  ekranGit: (ekran) =>
    set((s) => ({
      oncekiEkran: s.ekran,
      ekran,
      // Sınıf Turu ekranlarından çıkınca tur durumu silinir (Adım 36, gizlilik).
      sinifTuru: SINIF_TURU_EKRANLARI.has(ekran) ? s.sinifTuru : null,
    })),

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
      aktifSet: null,
      ekran: 'alistirma',
      oncekiEkran: 'konuSecimi',
      oturumTamamlandi: false,
    }),

  oturumuTamamla: () =>
    set((s) => ({
      oturumTamamlandi: true,
      bugunTamamlanan: s.bugunTamamlanan + 1,
      ekran: 'oturumSonu',
      oncekiEkran: 'alistirma',
    })),

  setBaslat: (aktifSet) =>
    set({
      aktifSet,
      secilenDugumId: null,
      ekran: 'alistirma',
      oncekiEkran: 'setHazirla',
      oturumTamamlandi: false,
    }),

  setBitir: () => set((s) => ({ aktifSet: null, ekran: 'anaEkran', oncekiEkran: s.ekran })),

  kagitIcinSet: (kagitSeti) =>
    set((s) => ({ kagitSeti, ekran: 'calismaKagidi', oncekiEkran: s.ekran })),

  sinifTuruKur: () => set((s) => ({ sinifTuru: null, ekran: 'sinifTuruKurulum', oncekiEkran: s.ekran })),

  sinifTuruBaslat: (renkler, kaynak, turPerTakim) =>
    set((s) => ({
      sinifTuru: sinifTuruDurumuBaslat(renkler, kaynak, turPerTakim),
      ekran: 'sinifTuru',
      oncekiEkran: s.ekran,
    })),

  sinifTuruOlay: (olay) =>
    set((s) => {
      if (!s.sinifTuru) return {};
      let sonraki: SinifTuruDurumu;
      try {
        sonraki = sinifTuruIlerlet(s.sinifTuru, olay);
      } catch {
        return {};
      }
      return sonraki.asama === 'bitti'
        ? { sinifTuru: sonraki, ekran: 'sinifTuruSonu', oncekiEkran: s.ekran }
        : { sinifTuru: sonraki };
    }),

  sinifTuruKapat: () => set((s) => ({ sinifTuru: null, ekran: 'anaEkran', oncekiEkran: s.ekran })),

  evSetiAyarla: (evSeti) => set({ evSeti }),

  evCalismasiniBitir: () =>
    set((s) => ({ evSeti: null, evdeOnDakikaTema: null, ekran: 'modSecimi', oncekiEkran: s.ekran })),

  evdeOnDakikaBaslat: (evSeti, evdeOnDakikaTema) =>
    set((s) => ({ evSeti, evdeOnDakikaTema, ekran: 'evdeCalis', oncekiEkran: s.ekran })),

  evIpucunaGec: () => set((s) => ({ evSeti: null, ekran: 'veliIpucuKarti', oncekiEkran: s.ekran })),

  evdeOnDakikaBitir: () =>
    set((s) => ({ evSeti: null, evdeOnDakikaTema: null, ekran: 'anaEkran', oncekiEkran: s.ekran })),

  eveGonder: (eveGonderSeti) => set((s) => ({ eveGonderSeti, ekran: 'eveGonder', oncekiEkran: s.ekran })),

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
