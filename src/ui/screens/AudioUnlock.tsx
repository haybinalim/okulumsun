import { useState } from 'react';
import { BigButton } from '../primitives/BigButton';
import { speech } from '../../audio/speech';
import { CORE_KEYS } from '../../audio/audioManifest.generated';

/**
 * Ses kilidi ekranı — uygulamanın ilk ekranı.
 *
 * Estetik bir tercih değil, tarayıcı zorunluluğu: iOS Safari ve tüm modern
 * tarayıcılar bir kullanıcı jesti olmadan ses çalmaz. Bu ekran o jesti alır.
 *
 * Tek büyük daire, tek anlam, sıfır metin bağımlılığı: çocuk okuyamıyor ama
 * "oynat" üçgeni evrensel. Dokunduğu an ses açılır ve karşılama duyulur.
 */
export function AudioUnlock({ onUnlocked }: { onUnlocked: () => void }) {
  const [busy, setBusy] = useState(false);

  const handlePress = () => {
    if (busy) return;
    setBusy(true);

    // prime() jestin İÇİNDEN senkron başlamalı — await'ten sonra çağrılırsa
    // tarayıcı artık kullanıcı etkileşimi saymaz ve kilit açılmaz.
    void speech
      .prime()
      .then(() => {
        void speech.speak({ kind: 'key', key: 'ui.hosgeldin' });
        // Çekirdek klipleri arka planda indir; ilk soruda takılma olmasın.
        void speech.prefetch(CORE_KEYS);
        onUnlocked();
      })
      .catch(() => {
        // Ses açılamadıysa bile ilerlemeyi engelleme: uygulama görsel
        // yönergelerle çalışmaya devam eder, çocuk ekranda kilitli kalmaz.
        onUnlocked();
      });
  };

  return (
    <main
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--size-edge)',
      }}
    >
      <BigButton
        label="Başla"
        size="unlock"
        shape="circle"
        variant="accent"
        onPress={handlePress}
        style={{ boxShadow: '0 calc(8px * var(--scale)) 0 rgba(0,0,0,.12)' }}
      >
        {/*
          Oynat üçgeni — okuma gerektirmeyen evrensel işaret.
          Boyut yüzdeyle değil calc ile veriliyor: SVG'de yüzde genişlik
          döngüsel çözülür ve tarayıcı 300px varsayılanına düşer.
        */}
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          style={{
            width: 'calc(var(--size-unlock) * 0.4)',
            height: 'calc(var(--size-unlock) * 0.4)',
            display: 'block',
          }}
        >
          <path d="M30 18 L82 50 L30 82 Z" fill="#fff" strokeLinejoin="round" strokeWidth="8" stroke="#fff" />
        </svg>
      </BigButton>
    </main>
  );
}
