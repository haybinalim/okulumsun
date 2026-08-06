import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * HATA SINIRI — "beyaz ekran" sınıfını ortadan kaldırır.
 *
 * NEDEN VAR: React 19'da render sırasında fırlatılan bir hata, kök bileşeni
 * söker ve geriye TAMAMEN BOŞ bir `#root` bırakır. Kullanıcı bembeyaz bir sayfa
 * görür; ne mesaj, ne ikon, ne de kurtarma yolu vardır. Bu, plan §16 risk 7'nin
 * ("çevrimdışı üründe hata görünürlüğü yok — sınıfta çökerse kimse bilmez")
 * en somut hâlidir: uygulama sınıfta çökerse öğretmen yalnızca beyaz bir tahta
 * görür ve dersi kurtaramaz.
 *
 * TASARIM KISITLARI (plan §7.1 ve okuma-yazma bilmeyen kullanıcı):
 *  - Bu ekranı ÇOCUK da görebilir. Bu yüzden KIRMIZI YOK, `X` YOK, "hata"
 *    kelimesi YOK — ürünün hiçbir yerinde ceza dili kullanılmaz.
 *  - Çocuk okuyamadığı için birincil kanal İKONdur: büyük, dost bir yeniden
 *    deneme dairesi. Metin yetişkine dönüktür ve küçüktür.
 *  - Tek eylem: yeniden dene. Çocuk seçim yapmak zorunda kalmaz.
 *  - Teknik ayrıntı `<details>` içinde KAPALI durur; veli/öğretmen açıp
 *    kopyalayabilir (plan §16'daki "sorun bildir" akışının çekirdeği).
 *
 * ADIM 9 NOTU: Kalıcılık geldiğinde `componentDidCatch` gövdesindeki kayıt
 * `events` store'una yazılacak. Şimdilik konsola yazar; sessiz kalmaz.
 */

interface Props {
  children: ReactNode;
}

interface State {
  hata: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hata: null };

  static getDerivedStateFromError(hata: Error): State {
    return { hata };
  }

  componentDidCatch(hata: Error, bilgi: ErrorInfo): void {
    // Çevrimdışı üründe uzak telemetri YOK (plan §16 risk 7 — KVKK ve okul ağı).
    // Yerel görünürlük şart: en azından konsolda ve ekranda iz bırakır.
    console.error('[okulumsun] Ekran çizilemedi:', hata, bilgi.componentStack);
  }

  private yenidenDene = (): void => {
    this.setState({ hata: null });
  };

  render(): ReactNode {
    const { hata } = this.state;
    if (hata === null) return this.props.children;

    return (
      <main
        style={{
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          gap: 'var(--size-gap)',
          padding: 'var(--size-edge)',
          background: 'var(--color-bg)',
          color: 'var(--color-ink)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--size-gap-tight)' }}>
          {/*
            Yeniden deneme dairesi. `BigButton` KULLANILMIYOR: hata sınırı,
            uygulamanın kendi bileşenlerinden biri bozulduğunda da çalışmak
            zorunda. Kendi bağımlılığı ne kadar azsa o kadar güvenilir.
          */}
          <button
            type="button"
            aria-label="Yeniden dene"
            onClick={this.yenidenDene}
            style={{
              width: 'var(--size-unlock)',
              height: 'var(--size-unlock)',
              minWidth: 'var(--size-tap-min)',
              minHeight: 'var(--size-tap-min)',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--color-accent)',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 calc(8px * var(--scale)) 0 rgba(0,0,0,.12)',
              touchAction: 'manipulation',
            }}
          >
            {/* Dönen ok — "tekrar" için okuma gerektirmeyen evrensel işaret. */}
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              style={{
                width: 'calc(var(--size-unlock) * 0.45)',
                height: 'calc(var(--size-unlock) * 0.45)',
                display: 'block',
              }}
            >
              <path
                d="M50 18 A32 32 0 1 0 82 50"
                fill="none"
                stroke="#fff"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path d="M50 4 L50 32 L72 18 Z" fill="#fff" />
            </svg>
          </button>

          {/* Yetişkine dönük; çocuk için taşıyıcı kanal yukarıdaki ikondur. */}
          <p style={{ margin: 0, fontSize: 'var(--text-ui)' }}>Bir şeyler ters gitti.</p>
          <p style={{ margin: 0, fontSize: 'var(--text-adult)', color: 'var(--color-ink-soft)' }}>
            Daireye dokunup yeniden deneyebilirsiniz.
          </p>

          <details style={{ fontSize: 'var(--text-adult)', color: 'var(--color-ink-soft)' }}>
            <summary style={{ cursor: 'pointer' }}>Teknik ayrıntı</summary>
            <pre
              style={{
                margin: '8px 0 0',
                maxWidth: '80ch',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                textAlign: 'left',
                userSelect: 'text',
              }}
            >
              {hata.message}
            </pre>
          </details>
        </div>
      </main>
    );
  }
}
