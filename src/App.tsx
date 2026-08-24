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
import { Kaynaklar } from './ui/screens/Kaynaklar';
import { OturumSonu } from './ui/screens/OturumSonu';
import { Bahcem } from './ui/screens/Bahcem';
import { useAppStore, accentBul } from './store/appStore';
import { useDeviceProfile } from './design/useDeviceProfile';
import { createRng } from './exercises/rng';
import { useKisiselOturum } from './ui/useKisiselOturum';
import { skillsData } from './content/skillsData';
import { REGISTRY } from './exercises/registry';
import type { Exercise } from './exercises/types';

/**
 * Uygulama kabuğu — plan §11 ekran akışını yönetir.
 *
 * Kişisel modda sekiz soruluk adaptif oturum `useKisiselOturum` üzerinden
 * çalışır ve her cevap IndexedDB'ye kalıcı biçimde yazılır. Tahta modunda
 * kalıcılık yoktur; öğretmen seçimi için seçilen konu üzerinden egzersiz üretilir.
 */
export default function App() {
  const { profile } = useDeviceProfile();
  const ekran = useAppStore((s) => s.ekran);
  const mod = useAppStore((s) => s.mod);
  const accent = accentBul(useAppStore((s) => s.accentId));
  const ekranGit = useAppStore((s) => s.ekranGit);
  const secilenDugumId = useAppStore((s) => s.secilenDugumId);
  const [tahtaTohumu, setTahtaTohumu] = useState(7);

  // Tahta modunda seçilen konuya göre (veya varsayılan ilk hazır konuya göre) egzersiz üret
  const tahtaExercise = useMemo<Exercise>(() => {
    const hedefDugum = skillsData.find((d) => d.id === secilenDugumId)
      ?? skillsData.find((d) => d.durum === 'hazir')
      ?? skillsData[0];

    const templateId = hedefDugum.exerciseTemplates.find((t) => REGISTRY.has(t))
      ?? 'M-SAY';

    const generator = REGISTRY.get(templateId);
    if (!generator) {
      const fallbackGen = REGISTRY.values().next().value!;
      return fallbackGen.uret({ seed: tahtaTohumu, difficulty: hedefDugum.difficulty, mod: 'tahta' }, createRng(tahtaTohumu));
    }

    const hedefParametreleri = templateId === 'M-ORUNTU-SAYI'
      ? {
          yon: hedefDugum.id === 'mat.oruntu.artan-sayi'
            ? 'artan' as const
            : hedefDugum.id === 'mat.oruntu.azalan-sayi'
              ? 'azalan' as const
              : undefined,
        }
      : templateId === 'M-CIKAR-GORSEL' && (
        hedefDugum.id === 'mat.cikarma.ayirma' ||
        hedefDugum.id === 'mat.cikarma.geriye-sayarak'
      )
        ? { hedefSkillId: hedefDugum.id }
        : templateId === 'M-CIKAR-SEMBOL' && (
          hedefDugum.id === 'mat.cikarma.fark-bulma' ||
          hedefDugum.id === 'mat.cikarma.onluk-bozmadan-20'
        )
          ? { hedefSkillId: hedefDugum.id }
          : {};

    return generator.uret(
      { seed: tahtaTohumu, difficulty: hedefDugum.difficulty, mod: 'tahta', ...hedefParametreleri },
      createRng(tahtaTohumu),
    );
  }, [secilenDugumId, tahtaTohumu]);

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
          <VeliPaneli />
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
          <Bahcem koleksiyon={{ toplam: 3, sahneIndeksi: 0, sonKazancMs: null }} onEv={() => ekranGit('anaEkran')} />
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
            onDone={kisiselOturum.cevapla}
          />
        )
    : (
      <ExerciseScreen
        key={`${secilenDugumId}-${tahtaExercise.itemId}`}
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

function OturumYukleniyor() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' }}>
      Oturum hazırlanıyor...
    </div>
  );
}

function OturumHatasi({ mesaj, onAnaEkran }: { readonly mesaj: string; readonly onAnaEkran: () => void }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 24, color: '#DC2626', fontWeight: 'bold' }}>Oturum Hatası</div>
      <div style={{ fontSize: 16, opacity: 0.8 }}>{mesaj}</div>
      <button
        onClick={onAnaEkran}
        style={{ padding: '12px 24px', background: '#7C3AED', color: '#FFF', borderRadius: 12, fontSize: 18, fontWeight: 'bold', cursor: 'pointer' }}
      >
        Ana Ekrana Dön
      </button>
    </div>
  );
}
