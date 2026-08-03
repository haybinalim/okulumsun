import type { CSSProperties, ReactNode } from 'react';

/**
 * Alıştırma ekranı iskeleti (plan §11).
 *
 * İki bölge, akıllı tahta erişim kuralına (§13) göre:
 *   · ÜST %35 — UYARAN alanı. Sahne/görsel burada DURUR; dokunulabilir ÖĞE YOK.
 *     (1. sınıf çocuğu 86" tahtanın üstüne fiziksel olarak ulaşamaz.)
 *   · ALT %65 — ETKİLEŞİM alanı. Tüm cevap kartları ve kontroller burada.
 * "Tekrar dinle" düğmesi sağ üstte SABİT — yerini ezberlemek zorunda (çocuk okuyamıyor).
 */
export function GameShell({
  stimulus,
  interaction,
  accent,
}: {
  stimulus: ReactNode;
  interaction: ReactNode;
  accent: string;
}) {
  const accentStyle: CSSProperties = { ['--color-accent' as string]: accent } as CSSProperties;
  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap)',
        overflow: 'hidden',
        ...accentStyle,
      }}
    >
      {/* Üst: uyaran alanı — dokunulabilir öğe YOK. */}
      <section
        style={{
          flex: '0 0 35%',
          display: 'grid',
          placeItems: 'center',
          minHeight: 0,
        }}
      >
        {stimulus}
      </section>

      {/* Alt: etkileşim alanı — tüm seçenekler ve kontroller. */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--size-gap)',
          minHeight: 0,
        }}
      >
        {interaction}
      </section>
    </main>
  );
}
