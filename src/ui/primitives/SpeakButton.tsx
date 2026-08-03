import { useReplay } from '../../audio/useSpeak';
import { BigButton } from './BigButton';

/**
 * "Tekrar dinle" düğmesi — her alıştırma ekranında AYNI yerde durur (plan §11).
 *
 * Çocuk okuyamadığı için talimatı kaçırdığında tek umudu budur; yerini ezberlemek
 * zorunda. Arka arkaya basınca yavaşlar (1.0 → 0.85 → 0.75): anlamadığı için
 * tekrar basıyordur, aynı hız aynı sonucu verir.
 */
export function SpeakButton({ label = 'Tekrar dinle' }: { label?: string }) {
  const replay = useReplay();
  return (
    <BigButton
      label={label}
      size="control"
      shape="circle"
      variant="solid"
      onPress={replay}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" width="60%" height="60%" style={{ display: 'block' }}>
        <path
          d="M52 18 A30 30 0 1 0 80 50"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path d="M70 14 V40 H46 Z" fill="var(--color-ink)" />
      </svg>
    </BigButton>
  );
}
