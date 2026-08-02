import { useState } from 'react';
import { BigButton } from './ui/primitives/BigButton';
import { BoardHarness } from './dev/BoardHarness';
import { AudioProbe } from './dev/AudioProbe';
import { AudioUnlock } from './ui/screens/AudioUnlock';
import { useDeviceProfile } from './design/useDeviceProfile';
import { ACCENTS, type Accent } from './design/tokens';

/**
 * GEÇİCİ — Adım 0 doğrulama ekranı.
 *
 * Amacı üç şeyi gözle kanıtlamak:
 *  1. Türkçe harfler doğru çiziliyor (ğ ş İ ı Ç Ö Ü) ve 'a' tek katlı
 *  2. Cihaz profili ölçeği gerçekten değiştiriyor
 *  3. BoardHarness erişim bölgesi ihlallerini yakalıyor
 *
 * Adım 4'te gerçek alıştırma ekranıyla değiştirilecek.
 */
export default function App() {
  const { profile, setOverride } = useDeviceProfile();
  const [accent, setAccent] = useState<Accent>(ACCENTS[0]);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <BoardHarness profile={profile}>
        <div style={{ height: '100%', ['--color-accent' as string]: accent.hex }}>
          <AudioUnlock onUnlocked={() => setUnlocked(true)} />
        </div>
      </BoardHarness>
    );
  }

  return (
    <BoardHarness profile={profile}>
      <main
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--size-edge)',
          paddingBottom: 'var(--size-edge-bottom)',
          gap: 'var(--size-gap)',
          overflow: 'hidden',
          ['--color-accent' as string]: accent.hex,
        }}
      >
        {/* Üst bölge: uyaran alanı. Akıllı tahtada dokunulabilir öğe konmaz. */}
        <section style={{ flex: '0 0 35%', display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 'var(--text-stimulus)',
                fontWeight: 700,
                lineHeight: 1,
                color: 'var(--color-accent)',
              }}
            >
              7
            </div>
            <div style={{ fontSize: 'var(--text-ui)', color: 'var(--color-ink-soft)' }}>
              Işığı gören çilingir düğüm çözdü · ağaç ĞŞİıÇÖÜ
            </div>
          </div>
        </section>

        {/* Alt bölge: erişim alanı. Tüm dokunulabilir öğeler burada. */}
        <section
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-gap)',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--size-gap)', flexWrap: 'wrap' }}>
            {ACCENTS.map((a) => (
              <BigButton
                key={a.id}
                label={`Renk: ${a.id}`}
                size="control"
                shape="circle"
                onPress={() => setAccent(a)}
                style={{
                  background: a.hex,
                  border: accent.id === a.id ? '4px solid var(--color-ink)' : 'none',
                }}
              >
                {''}
              </BigButton>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 'var(--size-gap)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <BigButton
              label="Onayla"
              size="primary"
              variant="accent"
              onPress={() => setBlocked(null)}
            >
              Onayla
            </BigButton>

            <BigButton
              label="Devam"
              size="primary"
              disabled
              onBlockedPress={() => setBlocked('Önce bir cevap seç.')}
              onPress={() => {}}
            >
              Devam
            </BigButton>

            {blocked && (
              <span style={{ fontSize: 'var(--text-ui)', color: 'var(--color-retry)' }}>
                🔊 {blocked}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--size-gap-tight)', flexWrap: 'wrap' }}>
            {(['board', 'tablet', 'phone'] as const).map((p) => (
              <BigButton
                key={p}
                label={`Profil: ${p}`}
                size="tapMin"
                variant={profile === p ? 'accent' : 'solid'}
                onPress={() => setOverride(p)}
                style={{ paddingInline: 'var(--size-gap-tight)' }}
              >
                {p}
              </BigButton>
            ))}
            <BigButton
              label="Profil geçersiz kılmayı temizle"
              size="tapMin"
              variant="ghost"
              onPress={() => setOverride(null)}
              style={{ paddingInline: 'var(--size-gap-tight)' }}
            >
              otomatik
            </BigButton>
          </div>

          <AudioProbe />

          <p style={{ fontSize: 'var(--text-adult)', color: 'var(--color-ink-soft)', margin: 0 }}>
            Aktif profil: <b>{profile}</b> · Tahta denetimi için <code>?harness=1</code> veya{' '}
            <kbd>H</kbd> tuşu
          </p>
        </section>
      </main>
    </BoardHarness>
  );
}
