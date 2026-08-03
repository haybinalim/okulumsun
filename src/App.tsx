import { useState, useMemo } from 'react';
import { BoardHarness } from './dev/BoardHarness';
import { AudioUnlock } from './ui/screens/AudioUnlock';
import { ExerciseScreen } from './ui/screens/ExerciseScreen';
import { useDeviceProfile } from './design/useDeviceProfile';
import { ACCENTS, type Accent } from './design/tokens';
import { createRng } from './exercises/rng';
import { karsilastirUret } from './exercises/templates/karsilastir';

/**
 * Adım 4 doğrulama ekranı — artık gerçek bir alıştırma.
 *
 * Ses kilidi açıldıktan sonra tek bir M-KARSILASTIR sorusu üretilip gösterilir.
 * Henüz oturum motoru (Adım 5) olmadığı için tek sorudur; doğru/yanlış sonrası
 * yeni bir tohumla yeniden üretilir. Bu, "çocuğa gösterilebilir ilk deneyim".
 */
export default function App() {
  const { profile } = useDeviceProfile();
  const [accent, setAccent] = useState<Accent>(ACCENTS[0]);
  const [unlocked, setUnlocked] = useState(false);
  const [seed, setSeed] = useState(7);

  const exercise = useMemo(
    () => karsilastirUret({ seed, difficulty: 2 }, createRng(seed)),
    [seed],
  );

  return (
    <BoardHarness profile={profile}>
      <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
        {!unlocked ? (
          <AudioUnlock onUnlocked={() => setUnlocked(true)} />
        ) : (
          <>
            {/* Veli/geliştirici: accent rengini değiştir + yeni soru üret. */}
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
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a)}
                  aria-label={`Renk ${a.id}`}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: accent.id === a.id ? '2px solid #000' : '2px solid #fff',
                    background: a.hex,
                    cursor: 'pointer',
                  }}
                />
              ))}
              <button
                onClick={() => setSeed((s) => s + 1)}
                style={{ fontSize: 12, padding: '2px 8px', cursor: 'pointer' }}
              >
                yeni soru
              </button>
            </div>
            <ExerciseScreen
              exercise={exercise}
              accent={accent}
              onDone={() => setSeed((s) => s + 1)}
            />
          </>
        )}
      </div>
    </BoardHarness>
  );
}

