import { useMemo, useState } from 'react';
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
import { OturumSonu } from './ui/screens/OturumSonu';
import { Bahcem } from './ui/screens/Bahcem';
import { useAppStore, accentBul } from './store/appStore';
import { useDeviceProfile } from './design/useDeviceProfile';
import { createRng } from './exercises/rng';
import { karsilastirUret } from './exercises/templates/karsilastir';
import { useKisiselOturum } from './ui/useKisiselOturum';

/**
 * Uygulama kabuğu — plan §11 ekran akışını yönetir.
 *
 * Kişisel modda sekiz soruluk adaptif oturum `useKisiselOturum` üzerinden
 * çalışır ve her cevap IndexedDB'ye kalıcı biçimde yazılır. Tahta modunda
 * kalıcılık yoktur; öğretmen seçimi için önceki güvenli tek-soru önizlemesi
 * korunur.
 */
export default function App() {
  const { profile } = useDeviceProfile();
  const ekran = useAppStore((s) => s.ekran);
  const mod = useAppStore((s) => s.mod);
  const accent = accentBul(useAppStore((s) => s.accentId));
  const oturumTamamlandi = useAppStore((s) => s.oturumTamamlandi);
  const ekranGit = useAppStore((s) => s.ekranGit);
  const [tahtaTohumu, setTahtaTohumu] = useState(7);

  const tahtaExercise = useMemo(
    () => karsilastirUret({ seed: tahtaTohumu, difficulty: 2, mod: 'tahta' }, createRng(tahtaTohumu)),
    [tahtaTohumu],
  );
  const kisiselOturum = useKisiselOturum(ekran, mod);

  // Ses kilidi ekranı — her zaman en başta
  if (ekran === 'audioUnlock') {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <AudioUnlock onUnlocked={() => useAppStore.getState().ekranGit('modSecimi')} />
        </div>
      </BoardHarness>
    );
  }

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
            onDone={kisiselOturum.cevapla}
          />
        )
    : (
      <ExerciseScreen
        key={tahtaExercise.itemId}
        exercise={tahtaExercise}
        accent={accent}
        onDone={() => setTahtaTohumu((tohum) => tohum + 1)}
      />
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
            }}
          >
            <button
              onClick={() => useAppStore.getState().sifirla()}
              style={{ fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}
            >
              sıfırla
            </button>
            {mod !== 'kisisel' && (
              <button
                onClick={() => setTahtaTohumu((tohum) => tohum + 1)}
                style={{ fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}
              >
                yeni soru
              </button>
            )}
          </div>
        )}

        {ekran === 'modSecimi' && <ModSecimi />}
        {ekran === 'avatarSecimi' && <AvatarSecimi />}
        {ekran === 'renkSecimi' && <RenkSecimi />}
        {ekran === 'anaEkran' && <AnaEkran />}
        {ekran === 'temaGirisi' && <TemaGirisi />}
        {ekran === 'konuSecimi' && <KonuSecimi />}
        {ekran === 'veliKapisi' && <VeliKapisi />}
        {ekran === 'veliPaneli' && <VeliPaneli />}
        {ekran === 'kaynaklar' && <Kaynaklar />}
        {ekran === 'alistirma' && alistirmaIcerigi}

        {ekran === 'oturumSonu' && (
          <OturumSonu
            oturumTamamlandi={oturumTamamlandi}
            onBahcem={() => ekranGit('bahcem')}
          />
        )}

        {ekran === 'bahcem' && (
          <Bahcem
            koleksiyon={{
              toplam: 1,
              sahneIndeksi: 0,
              sonKazancMs: Date.now(),
            }}
            onEv={() => ekranGit('anaEkran')}
          />
        )}
      </div>
    </BoardHarness>
  );
}

function OturumYukleniyor() {
  return (
    <main style={{ height: '100%', display: 'grid', placeItems: 'center', background: '#F8FAFC' }}>
      <p aria-live="polite" style={{ fontSize: 'var(--text-ui)', color: '#334155' }}>Oturum hazırlanıyor…</p>
    </main>
  );
}

function OturumHatasi({ mesaj, onAnaEkran }: { mesaj: string; onAnaEkran: () => void }) {
  return (
    <main style={{ height: '100%', display: 'grid', placeItems: 'center', gap: 16, padding: 24, background: '#F8FAFC' }}>
      <p role="alert" style={{ fontSize: 'var(--text-ui)', color: '#991B1B', textAlign: 'center' }}>{mesaj}</p>
      <button onClick={onAnaEkran}>Ana ekrana dön</button>
    </main>
  );
}
