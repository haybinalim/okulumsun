import { lazy, Suspense, useState, useMemo, useRef, type ReactNode } from 'react';
import { EkranCercevesi } from './ui/gezinme/EkranCercevesi';
import { useGeriTusu } from './ui/gezinme/useGeriTusu';
import { gomuluDurum } from './platform/gomuluAcilis';
import { useKapsayicilikEtkileri } from './ui/useKapsayicilikEtkileri';
import { useVurgu } from './design/useVurgu';
import { BoardHarness } from './dev/BoardHarness';
import { AudioUnlock } from './ui/screens/AudioUnlock';
import { DersSonuOzeti } from './ui/screens/DersSonuOzeti';
import { EvdeCalis } from './ui/screens/EvdeCalis';
import { useDersOturumu } from './ui/useDersOturumu';
import { dersOlayiUret } from './ogretmen/dersOzeti';
import { ExerciseScreen } from './ui/screens/ExerciseScreen';
import { ModSecimi } from './ui/screens/ModSecimi';
import { AvatarSecimi } from './ui/screens/AvatarSecimi';
import { RenkSecimi } from './ui/screens/RenkSecimi';
import { AnaEkran } from './ui/screens/AnaEkran';
import { TemaGirisi } from './ui/screens/TemaGirisi';
import { KonuSecimi } from './ui/screens/KonuSecimi';
import { VeliKapisi } from './ui/screens/VeliKapisi';
import { VeliPaneli } from './ui/screens/VeliPaneli';
import { Kaynaklar } from './ui/screens/Kaynaklar';
import { SorunBildir } from './ui/screens/SorunBildir';
import { OturumSonu } from './ui/screens/OturumSonu';
import { Bahcem } from './ui/screens/Bahcem';
import { OturumHatasi, OturumYukleniyor } from './ui/screens/OturumDurumlari';
import { useAppStore } from './store/appStore';
import { useDeviceProfile } from './design/useDeviceProfile';
import { yaziYuzeyi } from './design/yaziYuzeyi';
import { CihazProfiliBaglami } from './design/CihazProfiliBaglami';
import { useUyanikTut } from './ui/useUyanikTut';
import { dersteTamEkranMi, dersAyariniDinle } from './platform/dersAyari';
import { useSyncExternalStore } from 'react';
import { useKisiselOturum } from './ui/useKisiselOturum';
import { REGISTRY } from './exercises/registry';
import type { Exercise } from './exercises/types';
import { SetHazirla } from './ui/screens/SetHazirla';
import { SinifTuruKurulum } from './ui/screens/SinifTuruKurulum';
import { SinifTuruEkrani } from './ui/screens/SinifTuruEkrani';
import { SinifTuruSonu } from './ui/screens/SinifTuruSonu';
// Çalışma kâğıdı (Adım 35) ana pakete girmez: yazdırma ekranı açılınca yüklenir.
const CalismaKagidi = lazy(() => import('./ui/screens/CalismaKagidi'));
// Haftalık plan (Adım 37) ve plan verisi (kazanimlar.json) ana pakete girmez.
const HaftalikPlan = lazy(() => import('./ui/screens/HaftalikPlan'));
// Eve gönder (Adım 42) ve QR kodlayıcı ana pakete girmez.
const EveGonder = lazy(() => import('./ui/screens/EveGonder'));
// Evde 10 dakika ipucu kartı (Adım 43) ve ipucu verisi ana pakete girmez.
const VeliIpucuKarti = lazy(() => import('./ui/screens/VeliIpucuKarti'));
// Keşif Masası (Adım 44) ana pakete girmez.
const KesifMasasi = lazy(() => import('./ui/screens/KesifMasasi'));
// Tema sonu turu (Adım 46) ana pakete girmez.
const TemaTuru = lazy(() => import('./ui/screens/TemaTuru'));
import { setSorusu } from './ogretmen/gunlukSet';
import { setSorusuUret, tahtaSorusuUret } from './ogretmen/tahtaSorusu';
import { girisliSoru } from './audio/girisSesi';

/**
 * Uygulama kabuğu — plan §11 ekran akışını yönetir.
 *
 * Kişisel modda sekiz soruluk adaptif oturum `useKisiselOturum` üzerinden
 * çalışır. Geliştirme sürümünde öğrenci/veli verisi hiçbir modda kalıcı olarak
 * yazılmaz; öğretmen seçimi için seçilen konu üzerinden egzersiz üretilir.
 */
export default function App() {
  const { profile, elleSecilen, setOverride } = useDeviceProfile();
  const cihazProfili = useMemo(
    () => ({ profil: profile, elleSecilen, sec: setOverride }),
    [profile, elleSecilen, setOverride],
  );
  const ekran = useAppStore((s) => s.ekran);
  const mod = useAppStore((s) => s.mod);
  // KG-96: çocuğa dönük ekran TemelYazi, öğretmen/veli ekranı Andika (`src/design/yaziYuzeyi.ts`).
  const yazi = yaziYuzeyi(ekran);
  const accent = useVurgu();
  const ekranGit = useAppStore((s) => s.ekranGit);
  const secilenDugumId = useAppStore((s) => s.secilenDugumId);
  const bugunTamamlanan = useAppStore((s) => s.bugunTamamlanan);
  const [tahtaTohumu, setTahtaTohumu] = useState(7);

  // Tahta modu: bugünün seti varsa set akışı, yoksa seçilen konu (veya ilk hazır konu).
  const aktifSet = useAppStore((s) => s.aktifSet);
  const evSeti = useAppStore((s) => s.evSeti);
  const setBitir = useAppStore((s) => s.setBitir);
  const temaTuru = useAppStore((s) => s.temaTuru);
  // Setin kaçıncı sorusunda olunduğu, sete bağlı: set biter ya da Geri/Ana menü ile bırakılırsa (KG-103)
  // yeni set her zaman ilk sorudan başlar (eskiden yalnız "Seti bitir" sıfırlıyordu).
  const [setIlerleme, setSetIlerleme] = useState<{ set: typeof aktifSet; sira: number }>({ set: null, sira: 0 });
  const setSirasi = setIlerleme.set === aktifSet ? setIlerleme.sira : 0;
  const yanlisVar = useRef(false);
  const tahtaExercise = useMemo<Exercise>(() => {
    // KG-110: setin ilk sorusu "Bugünün etkinlikleri başlıyor." ile açılır (tekrar dinlemede yinelenmez).
    if (aktifSet)
      return girisliSoru(
        setSorusuUret(setSorusu(aktifSet, setSirasi, (t) => REGISTRY.has(t))),
        setSirasi === 0 ? 'ui.set-basliyor' : null,
      );
    return tahtaSorusuUret(secilenDugumId, tahtaTohumu);
  }, [aktifSet, setSirasi, secilenDugumId, tahtaTohumu]);

  const kisiselOturum = useKisiselOturum(ekran, mod);
  useKapsayicilikEtkileri();
  useUyanikTut(ekran);
  // KG-103: tarayıcı/Android geri tuşu = ekrandaki Geri; gömülü modda geçmişe dokunulmaz (üst portal).
  useGeriTusu(gomuluDurum().baglam === 'yok');
  const tamEkranAyari = useSyncExternalStore(dersAyariniDinle, () => dersteTamEkranMi(profile));
  // Adım 56: gömülü modda iframe tam ekrana izin vermiyorsa ses kilidi tam ekran denemez.
  const tamEkran = tamEkranAyari && gomuluDurum().kisitlar.tamEkran;

  /**
   * Her ekranın kabuğu: tahta aracı + yazı yüzeyi/vurgu + KG-103 gezinme çerçevesi (Geri / Ana menü).
   * Yeni ekran da buradan çizilir; `gezinmeSozlesmesi.spec.ts` başka yoldan çizilen ekran bırakmaz.
   */
  const kabuk = (icerik: ReactNode, isinmada = false) => (
    <BoardHarness profile={profile}>
      <div
        data-yazi={yazi}
        style={{ height: '100%', ['--color-accent' as string]: accent.hex }}
        data-isinma={isinmada ? '' : undefined}
      >
        <EkranCercevesi profil={profile}>{icerik}</EkranCercevesi>
      </div>
    </BoardHarness>
  );

  // Ses kilidi ekranı — her zaman en başta
  if (ekran === 'audioUnlock') {
    return kabuk(
      <AudioUnlock
        tamEkran={tamEkran}
        // Adım 42: geçerli eve link okunduysa ses kilidinden sonra doğrudan ev çalışması.
        onUnlocked={() => useAppStore.getState().ekranGit(useAppStore.getState().evSeti ? 'evdeCalis' : 'modSecimi')}
      />,
    );
  }

  // Eve link ile açılan ev çalışması (Adım 42)
  if (ekran === 'evdeCalis' && evSeti) {
    return kabuk(<EvdeCalis set={evSeti} />);
  }

  // Evde 10 dakika sonu: veliye ipucu kartı (Adım 43)
  if (ekran === 'veliIpucuKarti') {
    return kabuk(
      <Suspense fallback={<OturumYukleniyor />}>
        <VeliIpucuKarti />
      </Suspense>,
    );
  }

  // Keşif Masası: serbest manipülatif alanı, iki modda (Adım 44)
  if (ekran === 'kesifMasasi') {
    return kabuk(
      <Suspense fallback={<OturumYukleniyor />}>
        <KesifMasasi />
      </Suspense>,
    );
  }

  // Tema sonu turu: 8–10 soru → kutlama → yetişkine nitel özet (Adım 46)
  if (ekran === 'temaTuru' && temaTuru) {
    return kabuk(
      <Suspense fallback={<OturumYukleniyor />}>
        <TemaTuru tema={temaTuru.tema} plan={temaTuru.plan} />
      </Suspense>,
    );
  }

  // Mod seçimi
  if (ekran === 'modSecimi') {
    return kabuk(<ModSecimi />);
  }

  // Avatar seçimi (kişisel mod)
  if (ekran === 'avatarSecimi') {
    return kabuk(<AvatarSecimi />);
  }

  // Renk seçimi (kişisel mod)
  if (ekran === 'renkSecimi') {
    return kabuk(<RenkSecimi />);
  }

  // Veli kapısı
  if (ekran === 'veliKapisi') {
    return kabuk(<VeliKapisi />);
  }

  // Veli paneli
  if (ekran === 'veliPaneli') {
    return kabuk(
      <CihazProfiliBaglami.Provider value={cihazProfili}>
        <VeliPaneli />
      </CihazProfiliBaglami.Provider>,
    );
  }

  // Bugünün seti hazırlama (Adım 34)
  if (ekran === 'setHazirla') {
    return kabuk(<SetHazirla />);
  }

  // Sınıf Turu (Adım 36): kurulum → oyun → kavanoz kutlaması; durum yalnız bellekte.
  if (ekran === 'sinifTuruKurulum' || ekran === 'sinifTuru' || ekran === 'sinifTuruSonu') {
    return kabuk(ekran === 'sinifTuruKurulum' ? <SinifTuruKurulum /> : ekran === 'sinifTuru' ? <SinifTuruEkrani /> : <SinifTuruSonu />);
  }

  if (ekran === 'dersSonuOzeti') {
    return kabuk(<DersSonuOzeti />);
  }

  // Çalışma kâğıdı (Adım 35)
  if (ekran === 'calismaKagidi') {
    return kabuk(
      <Suspense fallback={<OturumYukleniyor />}>
        <CalismaKagidi />
      </Suspense>,
    );
  }

  // Eve gönder: eve link + QR (Adım 42)
  if (ekran === 'eveGonder') {
    return kabuk(
      <Suspense fallback={<OturumYukleniyor />}>
        <EveGonder />
      </Suspense>,
    );
  }

  // Haftalık MEB planı (Adım 37)
  if (ekran === 'haftalikPlan') {
    return kabuk(
      <Suspense fallback={<OturumYukleniyor />}>
        <HaftalikPlan />
      </Suspense>,
    );
  }

  // Sorun bildir (Adım 23)
  if (ekran === 'sorunBildir') {
    return kabuk(<SorunBildir cihaz={profile} />);
  }

  // Kaynaklar
  if (ekran === 'kaynaklar') {
    return kabuk(<Kaynaklar />);
  }

  // Ana ekran
  if (ekran === 'anaEkran') {
    return kabuk(<AnaEkran />);
  }

  // Tema girişi
  if (ekran === 'temaGirisi') {
    return kabuk(<TemaGirisi />);
  }

  // Konu seçimi (tahta modu)
  if (ekran === 'konuSecimi') {
    return kabuk(<KonuSecimi />);
  }

  // Oturum sonu
  if (ekran === 'oturumSonu') {
    return kabuk(<OturumSonu oturumTamamlandi={true} onBahcem={() => ekranGit('bahcem')} />);
  }

  // Bahçem
  if (ekran === 'bahcem') {
    return kabuk(
      <Bahcem koleksiyon={{ toplam: bugunTamamlanan, sahneIndeksi: 0, sonKazancMs: null }} onEv={() => ekranGit('anaEkran')} />,
    );
  }

  // Alıştırma ekranı
  const alistirmaIcerigi = mod === 'kisisel'
    ? kisiselOturum.hata
      ? <OturumHatasi mesaj={kisiselOturum.hata} onAnaEkran={() => ekranGit('anaEkran')} />
      : kisiselOturum.yukleniyor || !kisiselOturum.exercise
        ? <OturumYukleniyor />
        : (
          <ExerciseScreen
            key={kisiselOturum.exercise.itemId}
            exercise={kisiselOturum.exercise}
            accent={accent}
            onYanlis={kisiselOturum.yanlisBildir}
            onDone={(sonuc) => void kisiselOturum.cevapla(sonuc.dogru)}
          />
        )
    : (
      <>
        <ExerciseScreen
          key={`${aktifSet ? `set-${setSirasi}` : secilenDugumId}-${tahtaExercise.itemId}`}
          exercise={tahtaExercise}
          accent={accent}
          onYanlis={() => { yanlisVar.current = true; }}
          onDone={(sonuc) => {
            // Adım 40 aşama 3: tanı ve yardım kademesi MaddeSonuc'tan taşınır (yalnız bellekte).
            useDersOturumu.getState().kaydet(dersOlayiUret(tahtaExercise.skillIds[0], sonuc, yanlisVar.current));
            yanlisVar.current = false;
            if (aktifSet) setSetIlerleme({ set: aktifSet, sira: setSirasi + 1 });
            else setTahtaTohumu((tohum) => tohum + 1);
          }}
        />
        {aktifSet && (
          // Öğretmen çıkışı: bilerek küçük ve soluk, çocuğun erişemeyeceği üst köşede (Ayarlar dişlisi gibi).
          <button
            type="button"
            data-yetiskin=""
            aria-label="Seti bitir"
            onClick={setBitir}
            style={{
              position: 'fixed',
              top: 8,
              right: 8,
              minWidth: 44,
              minHeight: 44,
              padding: '0 12px',
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              color: 'var(--color-ink)',
              opacity: 0.5,
              cursor: 'pointer',
              fontSize: 'var(--text-adult)',
              zIndex: 5,
            }}
          >
            Seti bitir
          </button>
        )}
      </>
    );

  return kabuk(
    <>
      {import.meta.env.DEV && (
        <div
          data-harness
          style={{
            position: 'fixed',
            bottom: 8,
            left: 8,
            display: 'flex',
            gap: 6,
            zIndex: 9999,
            background: 'rgba(255,255,255,0.9)',
            padding: 4,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: 12,
          }}
        >
          <span>Ekran: {ekran}</span>
          <span>| Mod: {mod ?? '-'}</span>
        </div>
      )}
      {alistirmaIcerigi}
    </>,
    mod === 'kisisel' && kisiselOturum.isinmada,
  );
}
