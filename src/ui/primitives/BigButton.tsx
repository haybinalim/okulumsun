import { useRef, type CSSProperties, type ReactNode } from 'react';
import { MOTION } from '../../design/tokens';

export type BigButtonSize = 'tapMin' | 'control' | 'primary' | 'mascot' | 'unlock';

const SIZE_VAR: Record<BigButtonSize, string> = {
  tapMin: 'var(--size-tap-min)',
  control: 'var(--size-control)',
  primary: 'var(--size-primary)',
  mascot: 'var(--size-mascot)',
  unlock: 'var(--size-unlock)',
};

export interface BigButtonProps {
  children: ReactNode;
  onPress: () => void;
  /** Ekran okuyucu ve otomatik test için. Görsel etiket ayrı. */
  label: string;
  size?: BigButtonSize;
  shape?: 'circle' | 'rounded';
  /**
   * Devre dışı buton GRİ GÖSTERİLMEZ, soluk gösterilir ve dokunulduğunda
   * `onBlockedPress` çağrılır — orada sesle ne gerektiği söylenir.
   * Sessiz devre dışı buton 6 yaşındaki çocuk için "uygulama bozuldu" demektir.
   */
  disabled?: boolean;
  onBlockedPress?: () => void;
  variant?: 'solid' | 'ghost' | 'accent';
  style?: CSSProperties;
  className?: string;
}

/**
 * Tüm dokunulabilir öğelerin temeli.
 *
 * Üç şey garanti eder ve bunlar bileşenlere bırakılamayacak kadar kritiktir:
 *  1. Dokunma alanı görsel sınırdan `--size-touch-bleed` kadar taşar — IR akıllı
 *     tahtalarda kalibrasyon kayması birkaç santime varabiliyor.
 *  2. Aynı öğeye ardışık dokunmalar arasında soğuma var — yanlışlıkla çift
 *     dokunma hem duygusal ceza hem veri kirliliği üretir.
 *  3. Devre dışıyken sessiz kalmaz.
 */
export function BigButton({
  children,
  onPress,
  label,
  size = 'tapMin',
  shape = 'rounded',
  disabled = false,
  onBlockedPress,
  variant = 'solid',
  style,
  className,
}: BigButtonProps) {
  // -Infinity, 0 DEĞİL. `performance.now()` sayfa yüklenmesinden bu yana geçen
  // süredir; 0 ile başlatılırsa ilk 250 ms içindeki dokunuş "çok hızlı tekrar"
  // sanılıp sessizce yutulur. Çocuk uygulamayı açıp hemen dokunuyor ve hiçbir
  // şey olmuyor — geri bildirim de yok, çünkü buton devre dışı bile değil.
  const lastPressRef = useRef(-Infinity);

  const handlePress = () => {
    const now = performance.now();
    if (now - lastPressRef.current < MOTION.tapCooldown) return;
    lastPressRef.current = now;

    if (disabled) onBlockedPress?.();
    else onPress();
  };

  const dim = SIZE_VAR[size];

  return (
    <button
      type="button"
      aria-label={label}
      // Devre dışı buton yine de dokunulabilir olmalı ki sesli açıklama yapabilsin.
      // `aria-disabled` durumu bildirir, `disabled` niteliği olayı öldürürdü.
      aria-disabled={disabled || undefined}
      data-blocked={disabled || undefined}
      // `click` kullanılıyor, `pointerup` değil: klavye (Enter/Space), switch
      // erişimi ve ekran okuyucular yalnızca `click` üretir. `pointerup` ile
      // bu kullanıcılar hiçbir butona basamaz. Gecikme endişesi yok — gövdedeki
      // `touch-action: manipulation` 300ms dokunma gecikmesini zaten kaldırıyor.
      onClick={handlePress}
      className={className}
      style={{
        position: 'relative',
        minWidth: dim,
        minHeight: dim,
        // Yuvarlak butonlar kare kalmak ZORUNDA. İçerik (özellikle yüzde
        // genişlikli SVG) düğmeyi yanlara doğru esnetirse daire elipse döner.
        ...(shape === 'circle' ? { width: dim, height: dim, aspectRatio: '1 / 1' } : null),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'var(--text-ui)',
        borderRadius: shape === 'circle' ? '50%' : 'calc(24px * var(--scale))',
        background:
          variant === 'ghost'
            ? 'transparent'
            : variant === 'accent'
              ? 'var(--color-accent)'
              : 'var(--color-surface)',
        color: variant === 'accent' ? '#fff' : 'var(--color-ink)',
        boxShadow:
          variant === 'ghost' ? 'none' : '0 calc(4px * var(--scale)) 0 var(--color-border)',
        // Soluk, gri değil. Renk kanalı korunur, sadece belirginlik düşer.
        opacity: disabled ? 0.45 : 1,
        transition: `opacity ${MOTION.retry}ms, transform ${MOTION.retry}ms`,
        touchAction: 'manipulation',
        ...style,
      }}
    >
      {/*
        Görünmez dokunma taşması. Görsel sınırı büyütmeden isabet alanını genişletir.
        `inset` negatif olduğu için düzeni etkilemez.
      */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 'calc(-1 * var(--size-touch-bleed))',
          borderRadius: 'inherit',
        }}
      />
      {children}
    </button>
  );
}
