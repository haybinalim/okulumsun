import { lazy, Suspense, useState, useMemo } from 'react';
import { BoardHarness } from './dev/BoardHarness';
import { AudioUnlock } from './ui/screens/AudioUnlock';
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
import { useAppStore, accentBul } from './store/appStore';
import { useDeviceProfile } from './design/useDeviceProfile';
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
import { setSorusu } from './ogretmen/gunlukSet';
import { setSorusuUret, tahtaSorusuUret } from './ogretmen/tahtaSorusu';

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
  const accent = accentBul(useAppStore((s) => s.accentId));
  const ekranGit = useAppStore((s) => s.ekranGit);
  const secilenDugumId = useAppStore((s) => s.secilenDugumId);
  const bugunTamamlanan = useAppStore((s) => s.bugunTamamlanan);
  const [tahtaTohumu, setTahtaTohumu] = useState(7);

  // Tahta modu: bugünün seti varsa set akışı, yoksa seçilen konu (veya ilk hazır konu).
  const aktifSet = useAppStore((s) => s.aktifSet);
  const setBitir = useAppStore((s) => s.setBitir);
  const [setSirasi, setSetSirasi] = useState(0);
  const tahtaExercise = useMemo<Exercise>(() => {
    if (aktifSet) return setSorusuUret(setSorusu(aktifSet, setSirasi, (t) => REGISTRY.has(t)));
    return tahtaSorusuUret(secilenDugumId, tahtaTohumu);
  }, [aktifSet, setSirasi, secilenDugumId, tahtaTohumu]);

  const kisiselOturum = useKisiselOturum(ekran, mod);
  useUyanikTut(ekran);
  const tamEkran = useSyncExternalStore(dersAyariniDinle, () => dersteTamEkranMi(profile));

  // Ses kilidi ekranı — her zaman en başta
  if (ekran === 'audioUnlock') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <AudioUnlock tamEkran={tamEkran} onUnlocked={() => useAppStore.getState().ekranGit('modSecimi')} />
        </div>
      </BoardHarness>
    );
  }

  // Mod seçimi
  if (ekran === 'modSecimi') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <ModSecimi />
        </div>
      </BoardHarness>
    );
  }

  // Avatar seçimi (kişisel mod)
  if (ekran === 'avatarSecimi') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <AvatarSecimi />
        </div>
      </BoardHarness>
    );
  }

  // Renk seçimi (kişisel mod)
  if (ekran === 'renkSecimi') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <RenkSecimi />
        </div>
      </BoardHarness>
    );
  }

  // Veli kapısı
  if (ekran === 'veliKapisi') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <VeliKapisi />
        </div>
      </BoardHarness>
    );
  }

  // Veli paneli
  if (ekran === 'veliPaneli') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <CihazProfiliBaglami.Provider value={cihazProfili}>
            <VeliPaneli />
          </CihazProfiliBaglami.Provider>
        </div>
      </BoardHarness>
    );
  }

  // Bugünün seti hazırlama (Adım 34)
  if (ekran === 'setHazirla') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <SetHazirla />
        </div>
      </BoardHarness>
    );
  }

  // Sınıf Turu (Adım 36): kurulum → oyun → kavanoz kutlaması; durum yalnız bellekte.
  if (ekran === 'sinifTuruKurulum' || ekran === 'sinifTuru' || ekran === 'sinifTuruSonu') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          {ekran === 'sinifTuruKurulum' ? <SinifTuruKurulum /> : ekran === 'sinifTuru' ? <SinifTuruEkrani /> : <SinifTuruSonu />}
        </div>
      </BoardHarness>
    );
  }

  // Çalışma kâğıdı (Adım 35)
  if (ekran === 'calismaKagidi') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <Suspense fallback={<OturumYukleniyor />}>
            <CalismaKagidi />
          </Suspense>
        </div>
      </BoardHarness>
    );
  }

  // Sorun bildir (Adım 23)
  if (ekran === 'sorunBildir') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <SorunBildir cihaz={profile} />
        </div>
      </BoardHarness>
    );
  }

  // Kaynaklar
  if (ekran === 'kaynaklar') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <Kaynaklar />
        </div>
      </BoardHarness>
    );
  }

  // Ana ekran
  if (ekran === 'anaEkran') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <AnaEkran />
        </div>
      </BoardHarness>
    );
  }

  // Tema girişi
  if (ekran === 'temaGirisi') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <TemaGirisi />
        </div>
      </BoardHarness>
    );
  }

  // Konu seçimi (tahta modu)
  if (ekran === 'konuSecimi') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <KonuSecimi />
        </div>
      </BoardHarness>
    );
  }

  // Oturum sonu
  if (ekran === 'oturumSonu') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <OturumSonu oturumTamamlandi={true} onBahcem={() => ekranGit('bahcem')} />
        </div>
      </BoardHarness>
    );
  }

  // Bahçem
  if (ekran === 'bahcem') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <Bahcem koleksiyon={{ toplam: bugunTamamlanan, sahneIndeksi: 0, sonKazancMs: null }} onEv={() => ekranGit('anaEkran')} />
        </div>
      </BoardHarness>
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
            onDone={(sonuc) => void kisiselOturum.cevapla(sonuc.dogru)}
          />
        )
    : (
      <>
        <ExerciseScreen
          key={`${aktifSet ? `set-${setSirasi}` : secilenDugumId}-${tahtaExercise.itemId}`}
          exercise={tahtaExercise}
          accent={accent}
          onDone={() => (aktifSet ? setSetSirasi((sira) => sira + 1) : setTahtaTohumu((tohum) => tohum + 1))}
        />
        {aktifSet && (
          // Öğretmen çıkışı: bilerek küçük ve soluk, çocuğun erişemeyeceği üst köşede (Ayarlar dişlisi gibi).
          <button
            type="button"
            data-yetiskin=""
            aria-label="Seti bitir"
            onClick={() => {
              setSetSirasi(0);
              setBitir();
            }}
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

  return (
    <BoardHarness profile={profile}>
      <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
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
      </div>
    </BoardHarness>
  );
}
