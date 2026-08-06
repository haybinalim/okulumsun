import { useState, useMemo } from 'react';
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
import { OturumSonu } from './ui/screens/OturumSonu';
import { Bahcem } from './ui/screens/Bahcem';
import { useAppStore, accentBul } from './store/appStore';
import { useDeviceProfile } from './design/useDeviceProfile';
import { createRng } from './exercises/rng';
import { karsilastirUret } from './exercises/templates/karsilastir';

/**
 * Uygulama kabuğu — plan §11 ekran akışını yönetir.
 *
 * Akış:
 *  [0] Ses kilidi → [1] Mod seçimi → [2] Avatar → [3] Renk → [4] Ana ekran
 *  [4] → tema → [5] Tema girişi → [6] Alıştırma ×8 → [7] Oturum sonu → [8] Bahçem
 *  [4] → dişli → Veli kapısı → [9] Veli paneli
 *  Tahta modunda [2]/[3] atlanır, [4] → [4b] Konu seçimi.
 */
export default function App() {
  const { profile } = useDeviceProfile();
  const ekran = useAppStore((s) => s.ekran);
  const accent = accentBul(useAppStore((s) => s.accentId));
  const oturumTamamlandi = useAppStore((s) => s.oturumTamamlandi);
  const ekranGit = useAppStore((s) => s.ekranGit);
  const [seed, setSeed] = useState(7);

  const exercise = useMemo(
    () => karsilastirUret({ seed, difficulty: 2 }, createRng(seed)),
    [seed],
  );

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

  return (
    <BoardHarness profile={profile}>
      <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
        {/* Geliştirici araçları */}
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
          <button
            onClick={() => setSeed((s) => s + 1)}
            style={{ fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}
          >
            yeni soru
          </button>
        </div>

        {ekran === 'modSecimi' && <ModSecimi />}
        {ekran === 'avatarSecimi' && <AvatarSecimi />}
        {ekran === 'renkSecimi' && <RenkSecimi />}
        {ekran === 'anaEkran' && <AnaEkran />}
        {ekran === 'temaGirisi' && <TemaGirisi />}
        {ekran === 'konuSecimi' && <KonuSecimi />}
        {ekran === 'veliKapisi' && <VeliKapisi />}
        {ekran === 'veliPaneli' && <VeliPaneli />}

        {ekran === 'alistirma' && (
          <ExerciseScreen
            exercise={exercise}
            accent={accent}
            onDone={() => {
              // Şimdilik basit: her cevap sonrası yeni soru.
              // Tam oturum motoru entegrasyonu Adım 9'da gelecek.
              setSeed((s) => s + 1);
            }}
          />
        )}

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
