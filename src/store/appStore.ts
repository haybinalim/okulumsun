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
import { VARSAYILAN_KAPSAYICILIK, type KapsayicilikAyarlari } from '../design/kapsayicilik';
import { OGRENCI_VERISI_SAKLANIR_MI } from '../persistence/veriSaklamaPolitikasi';
import type { GunlukSet } from '../ogretmen/gunlukSet';
import type { TemaTuruPlani } from '../ogretmen/temaTuru';
import type { Renk } from '../exercises/types';
import type { SpeechKey } from '../audio/audioManifest.generated';
import {
  sinifTuruBaslat as sinifTuruDurumuBaslat,
  sinifTuruIlerlet,
  type SinifTuruDurumu,
  type SinifTuruOlayi,
} from '../sinif/sinifTuru';
import { gezinmeHedefi, type GezinmeDurumu, type GezinmeYonu } from '../ui/gezinme/gezinme';
import { kisiselGirisBicimi } from '../ui/temaGirisiAkisi';
import { temaOturumuEkle } from '../ui/hikayeAkisi';

// ---------------------------------------------------------------- tipler

/**
 * Uygulama ekranları — plan §11 akış. Liste çalışma anında da var (KG-103): "her ekranda gezinme"
 * sözleşme testi bu listeyi dolaşır; yeni ekran eklenince `GERI_KURALLARI` (src/ui/gezinme/gezinme.ts)
 * derlenmez hâle gelir ve test onu da kapsar.
 */
export const EKRANLAR = [
  'audioUnlock',
  'modSecimi',
  'avatarSecimi',
  'renkSecimi',
  'anaEkran',
  'temaGirisi',
  'alistirma',
  'oturumSonu',
  'bahcem',
  'konuSecimi',
  'veliKapisi',
  'veliPaneli',
  'kaynaklar',
  'sorunBildir',
  'setHazirla',
  'haftalikPlan',
  'calismaKagidi',
  'sinifTuruKurulum',
  'sinifTuru',
  'sinifTuruSonu',
  'dersSonuOzeti',
  'evdeCalis',
  'veliIpucuKarti',
  'kesifMasasi',
  'temaTuru',
  'eveGonder',
] as const;

export type Ekran = (typeof EKRANLAR)[number];

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
  /**
   * KG-103: her ekrana en son hangi ekrandan İLERİ gidildiği (Geri düğmesi birden çok yerden açılan
   * ekranda buna bakar; `src/ui/gezinme/gezinme.ts`). Geri/Ana menü geçişleri buraya yazılmaz.
   */
  girisler: Partial<Record<Ekran, Ekran>>;

  // --- Profil (plan §3.3)
  mod: Mod | null;
  avatarId: string | null;
  accentId: Accent['id'] | null;

  // --- Ayarlar (veli paneli)
  readingLevel: ReadingLevel;
  okulAyiIndex: number; // 0–9 (0=Eylül)
  sesHizi: number; // 1.0 normal
  /** Kapsayıcılık ayarları (Adım 55): yalnız bellekte; tahtada `#ayar=` hash'i yer imiyle taşır. */
  kapsayicilik: KapsayicilikAyarlari;
  /** Isınma Keşfi (Adım 47, ADR-0007): varsayılan kapalı; yalnız kişisel modda veli açar; yalnız bellekte. */
  isinmaAcik: boolean;

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
  /** Tema sonu turu (Adım 46): plan yalnız bellekte; tur kapanınca `null`. Sonuçlar ekranda yerel. */
  temaTuru: { readonly tema: number; readonly plan: TemaTuruPlani } | null;
  /**
   * Tek seferlik sesli duyuru (KG-110): bir eylemin sonucunu bir sonraki ekranın talimatından önce söyler
   * (ör. "Seti bitir" → ana ekranda "Bugünkü etkinlikleri bitirdik."). Ekran okuyunca `duyuruTemizle`.
   * Yalnız bellekte; içerik kimliğidir, kişisel değil.
   */
  duyuru: SpeechKey | null;
  /** Tema girişinin biçimi (Adım 45, KG-112): `kisa` 2 sn tema adı, `derin` 4 adımlı sesli giriş. */
  temaGirisiBicimi: 'kisa' | 'derin';
  /** Kişisel modda bu oturumda derin giriş gösterildi mi (en çok bir kez; yalnız bellekte). */
  derinGirisGosterildi: boolean;
  /**
   * Kişisel modda tema başına tamamlanan oturum sayısı (Adım 54, KG-116): oturum sonundaki hikâye sahnesini
   * seçer. Yalnız bellekte (Seçenek A), uygulama kapanınca sıfırlanır; içerik kimliği, kişisel veri değil.
   */
  temaOturumlari: Readonly<Record<number, number>>;

  // --- Actions
  ekranGit: (ekran: Ekran) => void;
  /**
   * KG-103: Geri ya da Ana menü. Hedef `gezinme.ts` kurallarından; ayrılınan ekranın bellekteki durumu
   * (set, tema turu, ev çalışması, Sınıf Turu) o ekranın kendi "bitir" düğmesi gibi silinir. Onay
   * (ilerleme kaybı) arayüzde sorulur; bu eylem doğrudan geçer. Gezinmesiz ekranda hiçbir şey yapmaz.
   */
  gezin: (yon: GezinmeYonu) => void;
  modSec: (mod: Mod) => void;
  avatarSec: (id: string) => void;
  renkSec: (id: Accent['id']) => void;
  readingLevelAyarla: (level: ReadingLevel) => void;
  okulAyiAyarla: (index: number) => void;
  sesHiziAyarla: (hiz: number) => void;
  /** Bir veya birkaç kapsayıcılık ayarını değiştirir; diğerleri aynen kalır. */
  kapsayicilikAyarla: (degisiklik: Partial<KapsayicilikAyarlari>) => void;
  isinmaAyarla: (acik: boolean) => void;
  veliGec: (gecildi: boolean) => void;
  temaSec: (temaNo: number) => void;
  dugumSec: (dugumId: string) => void;
  oturumuTamamla: () => void;
  setBaslat: (set: GunlukSet) => void;
  setBitir: () => void;
  duyuruTemizle: () => void;
  /** Tahta: öğretmen "Temaya giriş" kartı → seçili temanın derin girişi; bitince konu seçimine döner. */
  temaGirisiBaslat: () => void;
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
  /** Tema sonu turunu başlat (tahtada konu seçiminden, kişiselde yetişkin alanından). */
  temaTuruBaslat: (tema: number, plan: TemaTuruPlani) => void;
  /** Turu kapat: plan silinir, ana ekrana dönülür. */
  temaTuruKapat: () => void;
  sifirla: () => void;
  // --- Kalıcılık (Adım 9)
  profildenYukle: (profil: Partial<AppStore>) => void;
}

const baslangicDurumu = {
  ekran: 'audioUnlock' as Ekran,
  oncekiEkran: null as Ekran | null,
  girisler: {} as Partial<Record<Ekran, Ekran>>,
  mod: null as Mod | null,
  avatarId: null as string | null,
  accentId: null as Accent['id'] | null,
  readingLevel: 0 as ReadingLevel,
  okulAyiIndex: 0, // Eylül varsayımı
  sesHizi: 1.0,
  kapsayicilik: VARSAYILAN_KAPSAYICILIK as KapsayicilikAyarlari,
  isinmaAcik: false,
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
  temaTuru: null as { readonly tema: number; readonly plan: TemaTuruPlani } | null,
  duyuru: null as SpeechKey | null,
  temaGirisiBicimi: 'kisa' as 'kisa' | 'derin',
  derinGirisGosterildi: false,
  temaOturumlari: {} as Readonly<Record<number, number>>,
};

type Parca = Partial<AppStore> | ((s: AppStore) => Partial<AppStore>);

/** Durumdan Geri kurallarının girdisi (KG-103). */
export function gezinmeDurumu(s: AppStore): GezinmeDurumu {
  return {
    ekran: s.ekran,
    mod: s.mod,
    aktifSetVar: s.aktifSet !== null,
    evdeOnDakika: s.evdeOnDakikaTema !== null,
    girisler: s.girisler,
  };
}

/** Ayrılınan ekranın yalnız-bellek durumu: ekranın kendi "bitir/kapat" eylemiyle aynı alanlar silinir. */
function ayrilisTemizligi(kaynak: Ekran, hedef: Ekran): Partial<AppStore> {
  const t: Partial<AppStore> = {};
  if (kaynak === 'alistirma') t.aktifSet = null; // setBitir
  if (kaynak === 'temaTuru') t.temaTuru = null; // temaTuruKapat
  if (kaynak === 'evdeCalis' || kaynak === 'veliIpucuKarti') {
    t.evSeti = null; // evCalismasiniBitir / evdeOnDakikaBitir
    t.evdeOnDakikaTema = null;
  }
  if (hedef === 'sinifTuruKurulum') t.sinifTuru = null; // sinifTuruKur
  return t;
}

export const useAppStore = create<AppStore>((hamSet, get) => {
  /**
   * KG-103: ekranı değiştiren her geçiş `girisler`e "hedefe nereden gelindi" yazar (Geri/Ana menü hariç:
   * `geri = true`). `girisler`i kendisi veren parça (ör. `sifirla`) olduğu gibi uygulanır.
   */
  const set = (parca: Parca, geri = false): void =>
    hamSet((s) => {
      const p = typeof parca === 'function' ? parca(s) : parca;
      if (geri || 'girisler' in p || p.ekran === undefined || p.ekran === s.ekran) return p;
      return { ...p, girisler: { ...s.girisler, [p.ekran]: s.ekran } };
    });
  return {
    ...baslangicDurumu,

    gezin: (yon) => {
      const s = get();
      const hedef = gezinmeHedefi(gezinmeDurumu(s), yon);
      if (hedef === null) return;
      set(
        {
          ...ayrilisTemizligi(s.ekran, hedef),
          oncekiEkran: s.ekran,
          ekran: hedef,
          sinifTuru: SINIF_TURU_EKRANLARI.has(hedef) && hedef !== 'sinifTuruKurulum' ? s.sinifTuru : null,
        },
        true,
      );
    },

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
        // Isınma Keşfi tahtada yok (ADR-0007); mod değişince kapanır.
        isinmaAcik: false,
      }),

    avatarSec: (id) =>
      set({ avatarId: id, ekran: 'renkSecimi', oncekiEkran: 'avatarSecimi' }),

    renkSec: (id) =>
      set({ accentId: id, ekran: 'anaEkran', oncekiEkran: 'renkSecimi' }),

    readingLevelAyarla: (level) => set({ readingLevel: level }),
    okulAyiAyarla: (index) => set({ okulAyiIndex: Math.max(0, Math.min(index, 9)) }),
    sesHiziAyarla: (hiz) => set({ sesHizi: Math.max(0.5, Math.min(hiz, 1.5)) }),
    kapsayicilikAyarla: (degisiklik) => set((s) => ({ kapsayicilik: { ...s.kapsayicilik, ...degisiklik } })),
    isinmaAyarla: (acik) => set({ isinmaAcik: acik }),

    veliGec: (gecildi) => set({ veliGecildi: gecildi }),

    temaSec: (temaNo) =>
      set((s) => ({
        secilenTemaNo: temaNo,
        secilenDugumId: null,
        // Kişisel mod → tema girişi → gerçek oturum, tahta → konu seçimi.
        ekran: s.mod === 'kisisel' ? 'temaGirisi' : 'konuSecimi',
        // Adım 45: kişiselde oturum başına bir derin giriş, sonrakiler kısa (KG-112).
        temaGirisiBicimi: s.mod === 'kisisel' ? kisiselGirisBicimi(s.derinGirisGosterildi) : 'kisa',
        derinGirisGosterildi: s.derinGirisGosterildi || s.mod === 'kisisel',
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
        // Adım 54 (KG-116): kişisel tema oturumu hikâye sayacını ilerletir (set/tahta oturumu değil).
        temaOturumlari:
          s.mod === 'kisisel' && s.secilenTemaNo !== null && s.aktifSet === null
            ? temaOturumuEkle(s.temaOturumlari, s.secilenTemaNo)
            : s.temaOturumlari,
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

    setBitir: () => set((s) => ({ aktifSet: null, ekran: 'anaEkran', oncekiEkran: s.ekran, duyuru: 'ui.set-bitti' })),

    duyuruTemizle: () => set({ duyuru: null }),

    temaGirisiBaslat: () =>
      set((s) => (s.secilenTemaNo === null ? {} : { ekran: 'temaGirisi', oncekiEkran: s.ekran, temaGirisiBicimi: 'derin' })),

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

    temaTuruBaslat: (tema, plan) =>
      set((s) => ({ temaTuru: { tema, plan }, aktifSet: null, ekran: 'temaTuru', oncekiEkran: s.ekran })),

    temaTuruKapat: () => set((s) => ({ temaTuru: null, ekran: 'anaEkran', oncekiEkran: s.ekran })),

    sifirla: () => set({ ...baslangicDurumu }),

    profildenYukle: (profil) => set(profil),
  };
});

export function accentBul(id: Accent['id'] | null): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
}

export function avatarBul(id: string | null): AvatarSecenegi | null {
  if (!id) return null;
  return AVATARLAR.find((a) => a.id === id) ?? null;
}
