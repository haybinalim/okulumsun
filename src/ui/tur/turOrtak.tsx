import { HARF_GRUPLARI } from '../../content/dersler/tur/alfabe';

/** Türkçe ekranlarının ortak parçaları (Adım 64–65). YALNIZ bayraklı derlemede. */
export const ekranStili = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--size-gap)',
  padding: 'var(--size-edge)',
  paddingBottom: 'var(--size-edge-bottom)',
  boxSizing: 'border-box',
} as const;

export function Baslik({ baslik, alt }: { baslik: string; alt?: string }) {
  return (
    <header data-yetiskin="" style={{ textAlign: 'center', flex: '0 0 auto' }}>
      <h1 style={{ margin: 0, fontSize: 'calc(var(--text-ui) * 1.1)' }}>{baslik}</h1>
      {alt && (
        <p style={{ margin: '0.3em 0 0', fontSize: 'var(--text-adult)', color: 'var(--color-ink-soft, #6B6B6B)' }}>
          {alt}
        </p>
      )}
    </header>
  );
}

export const SEKME_SAYISI = HARF_GRUPLARI.length + 1;
