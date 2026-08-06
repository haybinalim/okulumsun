/**
 * AVATAR SEÇİMİ EKRANI — plan §11 [2].
 *
 * Kişisel modda, mod seçiminden sonra gelir.
 * 2×4 ızgara — 8 hayvan figürü (insan değil, etnik/cinsiyet nötr).
 *
 * Tahta modunda atlanır (§3.3).
 */

import { useAppStore, AVATARLAR } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { useScreenSpeech } from '../../audio/useSpeak';
import { motion, useReducedMotion } from 'framer-motion';
import { COLOR, SIZE } from '../../design/tokens';

export function AvatarSecimi() {
  const avatarSec = useAppStore((s) => s.avatarSec);
  const reducedMotion = useReducedMotion();

  useScreenSpeech({ kind: 'key', key: 'ui.avatar-sec' }, []);

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLOR.bg,
        gap: 'var(--size-gap)',
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--size-gap)',
          justifyItems: 'center',
        }}
      >
        {AVATARLAR.map((avatar, i) => (
          <motion.div
            key={avatar.id}
            initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: reducedMotion ? 0 : 0.2,
              delay: reducedMotion ? 0 : i * 0.05,
            }}
          >
            <BigButton
              label={avatar.ad}
              size="choice"
              variant="solid"
              onPress={() => avatarSec(avatar.id)}
              style={{
                background: avatar.renk,
                color: '#fff',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <AvatarIkon id={avatar.id} size={SIZE.choice * 0.4} />
            </BigButton>
          </motion.div>
        ))}
      </div>
    </main>
  );
}

/** Basit hayvan ikonları — türü belirsiz, tanınabilir, 16px'te bile okunabilir. */
function AvatarIkon({ id, size }: { id: string; size: number }) {
  const beyaz = '#fff';
  switch (id) {
    case 'kedi':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
          <circle cx="50" cy="56" r="32" fill={beyaz} opacity={0.9} />
          <path d="M24 32 L30 14 L42 30 Z" fill={beyaz} opacity={0.9} />
          <path d="M76 32 L70 14 L58 30 Z" fill={beyaz} opacity={0.9} />
          <circle cx="40" cy="52" r="3" fill="#2B2B2B" />
          <circle cx="60" cy="52" r="3" fill="#2B2B2B" />
          <path d="M46 60 L50 64 L54 60" stroke="#2B2B2B" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'kopek':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
          <circle cx="50" cy="56" r="30" fill={beyaz} opacity={0.9} />
          <ellipse cx="28" cy="38" rx="10" ry="16" fill={beyaz} opacity={0.9} transform="rotate(-20 28 38)" />
          <ellipse cx="72" cy="38" rx="10" ry="16" fill={beyaz} opacity={0.9} transform="rotate(20 72 38)" />
          <circle cx="40" cy="52" r="3" fill="#2B2B2B" />
          <circle cx="60" cy="52" r="3" fill="#2B2B2B" />
          <ellipse cx="50" cy="62" rx="5" ry="3" fill="#2B2B2B" />
        </svg>
      );
    case 'kus':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
          <ellipse cx="50" cy="56" rx="28" ry="24" fill={beyaz} opacity={0.9} />
          <circle cx="66" cy="40" r="14" fill={beyaz} opacity={0.9} />
          <path d="M80 40 L92 44 L80 48 Z" fill="#F97316" />
          <circle cx="70" cy="38" r="2" fill="#2B2B2B" />
        </svg>
      );
    case 'balik':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
          <path d="M14 50 Q30 22 60 38 Q84 50 60 62 Q30 78 14 50 Z" fill={beyaz} opacity={0.9} />
          <path d="M60 38 L82 24 V50 L82 76 Z" fill={beyaz} opacity={0.9} />
          <circle cx="68" cy="46" r="3" fill="#2B2B2B" />
        </svg>
      );
    case 'kelebek':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
          <ellipse cx="28" cy="40" rx="20" ry="24" fill={beyaz} opacity={0.9} />
          <ellipse cx="72" cy="40" rx="20" ry="24" fill={beyaz} opacity={0.9} />
          <ellipse cx="30" cy="66" rx="12" ry="14" fill={beyaz} opacity={0.7} />
          <ellipse cx="70" cy="66" rx="12" ry="14" fill={beyaz} opacity={0.7} />
          <rect x="47" y="22" width="6" height="60" rx="3" fill="#2B2B2B" />
        </svg>
      );
    case 'tavsan':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
          <ellipse cx="40" cy="24" rx="8" ry="18" fill={beyaz} opacity={0.9} />
          <ellipse cx="60" cy="24" rx="8" ry="18" fill={beyaz} opacity={0.9} />
          <circle cx="50" cy="56" r="28" fill={beyaz} opacity={0.9} />
          <circle cx="42" cy="52" r="3" fill="#2B2B2B" />
          <circle cx="58" cy="52" r="3" fill="#2B2B2B" />
          <ellipse cx="50" cy="62" rx="4" ry="3" fill="#F97316" />
        </svg>
      );
    case 'ayi':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
          <circle cx="28" cy="30" r="10" fill={beyaz} opacity={0.9} />
          <circle cx="72" cy="30" r="10" fill={beyaz} opacity={0.9} />
          <circle cx="50" cy="54" r="32" fill={beyaz} opacity={0.9} />
          <circle cx="40" cy="50" r="3" fill="#2B2B2B" />
          <circle cx="60" cy="50" r="3" fill="#2B2B2B" />
          <ellipse cx="50" cy="60" rx="6" ry="4" fill="#2B2B2B" />
        </svg>
      );
    case 'kurbağa':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
          <ellipse cx="50" cy="58" rx="34" ry="28" fill={beyaz} opacity={0.9} />
          <circle cx="34" cy="36" r="10" fill={beyaz} opacity={0.9} />
          <circle cx="66" cy="36" r="10" fill={beyaz} opacity={0.9} />
          <circle cx="34" cy="36" r="4" fill="#2B2B2B" />
          <circle cx="66" cy="36" r="4" fill="#2B2B2B" />
          <path d="M38 62 Q50 68 62 62" stroke="#2B2B2B" strokeWidth="2.5" fill="none" />
        </svg>
      );
    default:
      return null;
  }
}
