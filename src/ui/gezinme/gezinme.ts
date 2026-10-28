/**
 * GEZİNME KURALLARI (KG-103) — her ekranda "Geri" ve "Ana menü".
 *
 * Geri = ekranın MANTIKSAL ÜST ekranı (hiyerarşik "yukarı"), sınırsız bir geçmiş yığını değil:
 *  · Her ekranın izinli üst ekranları sabit tabloda (`GERI_KURALLARI`); ilk eleman varsayılandır.
 *  · Birden çok yerden açılan ekranlarda (ör. çalışma kâğıdı: set hazırla ya da haftalık plan) son
 *    girişin geldiği ekran (`girisler`) izinliyse oraya dönülür — kullanıcı için "bir önceki ekran".
 *  · Tablo döngüsüzdür: Geri'ye arka arkaya basmak her zaman ana ekranda (ya da mod seçiminde) biter;
 *    Geri→ileri→Geri gidip gelmesi olmaz. Kendiliğinden geçen ekranlar (tema girişi, oturum sonu) ve
 *    kapısı olan ekranlar (veli kapısı) hedef olmaz: oraya dönmek çocuğu hemen geri fırlatırdı.
 *
 * Ana menü = ana ekran (`anaEkran`); mod henüz seçilmemişse (eve link ile açılan ev çalışması) mod seçimi.
 *
 * Gezinmesiz ekranlar: ses kilidi (tek düğmeli ilk ekran), mod seçimi (uygulamanın girişi) ve ana ekranın
 * kendisi. Bu üç ekranda Geri/Ana menü anlamsızdır (dönülecek üst ekran yok; ana menü zaten burası).
 *
 * Çıkış onayı: yalnız gerçekten ilerleme kaybolacaksa (set, Sınıf Turu, tema sonu turu, ev çalışması).
 * Kişisel oturum KAYBOLMAZ (aynı oturum ana ekrandan dönünce kaldığı yerden sürer), tahtadaki serbest
 * soru da tek sorudur; bu ekranlarda onay sorulmaz.
 *
 * SAF: yan etkisiz; durum `appStore`dan okunup buraya verilir.
 */
import type { Ekran, Mod } from '../../store/appStore';

export type GezinmeYonu = 'geri' | 'anaMenu';

export interface GezinmeDurumu {
  readonly ekran: Ekran;
  readonly mod: Mod | null;
  /** Tahtada bugünün seti oynanıyor mu (alıştırma ekranının üstü ve onay buna bağlı). */
  readonly aktifSetVar: boolean;
  /** Veli "Evde 10 dakika"yı başlattı mı (ev çalışmasının üstü veli paneli olur). */
  readonly evdeOnDakika: boolean;
  /** Her ekrana en son hangi ekrandan ileri gidildiği (`appStore.girisler`). */
  readonly girisler: Readonly<Partial<Record<Ekran, Ekran>>>;
}

interface GeriKurali {
  /** İzinli üst ekranlar; ilki varsayılan. */
  readonly ustler: (d: GezinmeDurumu) => readonly Ekran[];
  /** Çıkışta ilerleme kaybolur mu → büyük düğmeli onay. */
  readonly onay?: (d: GezinmeDurumu) => boolean;
}

const sabit =
  (...ustler: Ekran[]) =>
  (): readonly Ekran[] =>
    ustler;

/**
 * Ekran → Geri kuralı. `null` = gezinmesiz ekran. `Record<Ekran, …>` olduğu için yeni bir ekran
 * buraya satır eklenmeden derlenmez (sözleşme testi ayrıca çalışma anında denetler).
 */
export const GERI_KURALLARI: Readonly<Record<Ekran, GeriKurali | null>> = {
  audioUnlock: null,
  modSecimi: null,
  anaEkran: null,
  avatarSecimi: { ustler: sabit('modSecimi') },
  renkSecimi: { ustler: sabit('avatarSecimi') },
  temaGirisi: { ustler: sabit('anaEkran') },
  konuSecimi: { ustler: sabit('anaEkran') },
  alistirma: {
    // Kişisel: ana ekran (tema girişi kendiliğinden geçer). Tahta seti: seti başlatan ekran (ders sonu
    // özeti "Yarın için set"te özeti kapattığı için hedef olmaz). Tahta serbest soru: konu seçimi.
    ustler: (d) =>
      d.mod === 'kisisel'
        ? ['anaEkran']
        : d.aktifSetVar
          ? ['anaEkran', 'setHazirla', 'haftalikPlan']
          : ['konuSecimi'],
    onay: (d) => d.mod === 'tahta' && d.aktifSetVar,
  },
  // Oturum sonu ve Bahçem: biten oturuma dönülmez (oturum sonu ≤2 sn'de Bahçem'e geçer).
  oturumSonu: { ustler: sabit('anaEkran') },
  bahcem: { ustler: sabit('anaEkran') },
  // Veli kapısından geçince Geri kapıya değil çocuk ekranına (kapı yeniden sorulur).
  veliKapisi: { ustler: sabit('anaEkran') },
  veliPaneli: { ustler: sabit('anaEkran') },
  kaynaklar: { ustler: sabit('veliPaneli') },
  sorunBildir: { ustler: sabit('veliPaneli') },
  setHazirla: { ustler: sabit('veliPaneli') },
  haftalikPlan: { ustler: sabit('veliPaneli') },
  calismaKagidi: { ustler: sabit('setHazirla', 'haftalikPlan') },
  eveGonder: { ustler: sabit('anaEkran', 'setHazirla', 'dersSonuOzeti', 'haftalikPlan') },
  sinifTuruKurulum: { ustler: sabit('anaEkran') },
  sinifTuru: { ustler: sabit('sinifTuruKurulum'), onay: () => true },
  // Tur bitti: biten oyuna değil kuruluma (yeni tur) döner.
  sinifTuruSonu: { ustler: sabit('sinifTuruKurulum') },
  dersSonuOzeti: { ustler: sabit('anaEkran') },
  evdeCalis: {
    ustler: (d) => (d.evdeOnDakika ? ['veliPaneli'] : d.mod === null ? ['modSecimi'] : ['anaEkran']),
    onay: () => true,
  },
  veliIpucuKarti: { ustler: sabit('anaEkran') },
  kesifMasasi: { ustler: sabit('anaEkran') },
  temaTuru: {
    ustler: (d) => (d.mod === 'kisisel' ? ['veliPaneli', 'konuSecimi'] : ['konuSecimi', 'veliPaneli']),
    onay: () => true,
  },
};

/** Geri ve Ana menü düğmelerinin hiç gösterilmediği ekranlar (yukarıdaki `null` satırlar). */
export const GEZINMESIZ_EKRANLAR: ReadonlySet<Ekran> = new Set(
  (Object.keys(GERI_KURALLARI) as Ekran[]).filter((e) => GERI_KURALLARI[e] === null),
);

/** Geri'nin götüreceği ekran; gezinmesiz ekranda `null`. */
export function geriHedefi(d: GezinmeDurumu): Ekran | null {
  const kural = GERI_KURALLARI[d.ekran];
  if (!kural) return null;
  const ustler = kural.ustler(d);
  const giris = d.girisler[d.ekran];
  return giris !== undefined && ustler.includes(giris) ? giris : ustler[0];
}

/** Ana menü'nün götüreceği ekran; gezinmesiz ekranda `null`. */
export function anaMenuHedefi(d: GezinmeDurumu): Ekran | null {
  if (GERI_KURALLARI[d.ekran] === null) return null;
  return d.mod === null ? 'modSecimi' : 'anaEkran';
}

export function gezinmeHedefi(d: GezinmeDurumu, yon: GezinmeYonu): Ekran | null {
  return yon === 'geri' ? geriHedefi(d) : anaMenuHedefi(d);
}

/** Bu ekrandan çıkınca ilerleme kaybolur mu (→ "Etkinlikten çıkmak istiyor musun?"). */
export function cikisOnayiGerekir(d: GezinmeDurumu): boolean {
  return GERI_KURALLARI[d.ekran]?.onay?.(d) ?? false;
}

/** Onay penceresinin metni; sesi `ui.cikis-onayi` aynı cümle (KG-110, `cikisOnayiSesi.spec`). */
export const CIKIS_ONAYI_METNI = 'Etkinlikten çıkmak istiyor musun?';
export const CIKIS_ONAYI_SESI = 'ui.cikis-onayi' as const;
