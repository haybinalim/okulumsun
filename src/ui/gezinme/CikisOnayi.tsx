import { useEffect, useRef } from 'react';
import { BigButton } from '../primitives/BigButton';
import { CIKIS_ONAYI_METNI } from './gezinme';

/**
 * ÇIKIŞ ONAYI (KG-103) — "Etkinlikten çıkmak istiyor musun?" Evet / Hayır.
 *
 * Yalnız ilerleme kaybolacaksa açılır (set, Sınıf Turu, tema sonu turu, ev çalışması). Çocuk Geri'ye
 * yanlışlıkla dokunursa etkinlik kaybolmasın diye; düğmeler büyük (`--size-primary`: tablet 140, tahta
 * 224 px) ve pencere ekranın alt bölümünde (tahtada üst %35'e girmez). Varsayılan güvenli seçim
 * "Hayır" (odak onda, Esc ve geri tuşu = Hayır). Kırmızı yok; Evet nötr, Hayır vurgu rengi.
 * Metin yalnız görsel: ses anahtarı Adım 31'e kadar eklenmez (KG-01, yeni `ui.*` yok).
 */
export function CikisOnayi({ onYanit }: { onYanit: (evet: boolean) => void }) {
  const hayir = useRef<HTMLDivElement>(null);
  useEffect(() => {
    hayir.current?.querySelector('button')?.focus();
    const tus = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onYanit(false);
    };
    window.addEventListener('keydown', tus);
    return () => window.removeEventListener('keydown', tus);
  }, [onYanit]);

  return (
    <div
      data-cikis-onayi=""
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(31, 41, 55, 0.45)',
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cikis-onayi-baslik"
        style={{
          // Tahtada pencerenin tamamı alt %65'te: üst kenar en az %38'de.
          marginTop: '38vh',
          maxWidth: 'min(100%, calc(720px * var(--scale)))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--size-gap)',
          padding: 'var(--size-gap)',
          borderRadius: 'calc(28px * var(--scale))',
          background: 'var(--color-surface)',
          boxShadow: '0 calc(6px * var(--scale)) 0 var(--color-border)',
        }}
      >
        <p
          id="cikis-onayi-baslik"
          style={{ margin: 0, fontSize: 'var(--text-ui)', lineHeight: 1.3, textAlign: 'center', color: 'var(--color-ink)' }}
        >
          {CIKIS_ONAYI_METNI}
        </p>
        <div style={{ display: 'flex', gap: 'var(--size-gap)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <BigButton label="Evet, çık" size="primary" variant="solid" onPress={() => onYanit(true)} style={dugme}>
            <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" style={simge}>
              <path
                d="M13 6H7v20h6M20 10l6 6-6 6M26 16H12"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span aria-hidden="true">Evet</span>
          </BigButton>
          <div ref={hayir} style={{ display: 'contents' }}>
            <BigButton label="Hayır, devam et" size="primary" variant="accent" onPress={() => onYanit(false)} style={dugme}>
              <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" style={simge}>
                <path d="M11 7v18l14-9z" fill="currentColor" />
              </svg>
              <span aria-hidden="true">Hayır</span>
            </BigButton>
          </div>
        </div>
      </div>
    </div>
  );
}

const dugme = {
  flexDirection: 'column',
  gap: 'calc(6px * var(--scale))',
  padding: '0 calc(28px * var(--scale))',
} as const;
const simge = { width: 'calc(44px * var(--scale))', height: 'calc(44px * var(--scale))' } as const;
