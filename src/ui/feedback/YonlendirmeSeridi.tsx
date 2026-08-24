import { SpeakButton } from '../primitives/SpeakButton';

/**
 * Karar ekranları için sesli yönergenin görsel yedeği.
 *
 * Çocuk ekrandaki metni okumak zorunda değildir: hoparlör ikonu "dinle"yi,
 * büyük ok da sıradaki dokunulabilir alanı anlatır. Kısa metin, yetişkinin
 * çocuğa eşlik ettiği durumda yardımcı olur; birincil yönerge ses klibidir.
 */
export function YonlendirmeSeridi({
  metin = 'Dinle, sonra seç.',
  tekrarEtiketi = 'Yönergeyi tekrar dinle',
}: {
  metin?: string;
  tekrarEtiketi?: string;
}) {
  return (
    <aside
      aria-label={metin}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'calc(var(--size-gap-tight) * 0.65)',
        width: 'min(100%, 620px)',
        minHeight: 'calc(var(--size-control) * 0.9)',
        padding: '12px 16px',
        border: '3px solid var(--color-border)',
        borderRadius: 'calc(22px * var(--scale))',
        background: 'var(--color-surface)',
        boxShadow: '0 3px 0 var(--color-border)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--color-accent)',
          color: '#fff',
          flex: '0 0 auto',
        }}
      >
        <svg viewBox="0 0 64 64" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 38H22L38 51V13L22 26H10Z" fill="currentColor" stroke="currentColor" />
          <path d="M46 24C50 28 50 36 46 40" />
          <path d="M53 17C62 25 62 39 53 47" />
        </svg>
      </div>

      <div style={{ display: 'grid', gap: 0, minWidth: 0, textAlign: 'left' }}>
        <strong style={{ fontSize: 'var(--text-min)', lineHeight: 1.1, color: 'var(--color-ink)' }}>
          Dinle
        </strong>
        <span style={{ fontSize: 'var(--text-adult)', lineHeight: 1.2, color: 'var(--color-ink-soft)' }}>
          {metin}
        </span>
      </div>

      <svg aria-hidden="true" viewBox="0 0 40 48" width="32" height="38" fill="none" stroke="var(--color-accent)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto' }}>
        <path d="M20 4V38" />
        <path d="M8 28L20 40L32 28" />
      </svg>

      <SpeakButton label={tekrarEtiketi} />
    </aside>
  );
}
