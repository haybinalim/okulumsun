/**
 * EVE GÖNDER (plan v2 Adım 42 aşama 3, ADR-0010): öğretmen seti eve link ve QR olarak gösterir.
 *
 * Üstte (dokunulmaz) büyük QR + kısa bağlantı; alt bölümde "Kopyala" ve "Geri" (≥102 px). QR yerelde
 * üretilir (`qrcode-generator`, bu ekranla tembel yüklenir); bağlantı yalnız düğüm kodu + tohum taşır.
 * Yetişkin ekranı; ses yok. Hiçbir şey saklanmaz veya gönderilmez — paylaşımı öğretmen kendi kanalıyla yapar.
 */
import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { eveLinkUret } from '../../ogretmen/eveLink';
import { qrMatrisi, qrSvgYolu } from '../../ogretmen/qrMatrisi';
import { eveLinkKoku } from '../../platform/kanonikKok';
import { skillsData } from '../../content/skillsData';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';

type KopyaDurumu = 'bos' | 'kopyalandi' | 'elle';

export default function EveGonder() {
  const set = useAppStore((s) => s.eveGonderSeti);
  const [kopya, setKopya] = useState<KopyaDurumu>('bos');
  const linkRef = useRef<HTMLParagraphElement>(null);

  const link = useMemo(
    () => (set ? eveLinkUret(eveLinkKoku(window.location, import.meta.env.BASE_URL ?? '/'), set) : null),
    [set],
  );
  const qr = useMemo(() => (link ? qrSvgYolu(qrMatrisi(link)) : null), [link]);
  const basliklar = useMemo(
    () => (set ? set.dugumler.map((id) => skillsData.find((d) => d.id === id)?.childLabel ?? id) : []),
    [set],
  );

  const kopyala = async (): Promise<void> => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setKopya('kopyalandi');
    } catch {
      // Pano izni yoksa bağlantı seçili bırakılır; öğretmen elle kopyalar.
      const el = linkRef.current;
      if (el) window.getSelection()?.selectAllChildren(el);
      setKopya('elle');
    }
  };

  return (
    <main
      aria-labelledby="eve-gonder-baslik"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        gap: 12,
        color: COLOR.ink,
      }}
    >
      <section style={{ flex: '1 1 auto', display: 'flex', gap: 32, alignItems: 'center', minHeight: 0 }}>
        {qr && (
          <svg
            role="img"
            aria-label="Eve link QR kodu"
            data-testid="eve-qr"
            viewBox={`0 0 ${qr.boyut} ${qr.boyut}`}
            shapeRendering="crispEdges"
            style={{ height: 'min(56vh, 520px)', aspectRatio: '1', background: '#FFFFFF', flex: '0 0 auto' }}
          >
            <path d={qr.yol} fill="#000000" />
          </svg>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <h1 id="eve-gonder-baslik" style={{ margin: 0, fontSize: 36 }}>
            Eve gönder
          </h1>
          <p style={{ margin: 0, fontSize: 22 }}>
            Veliler telefonla QR'ı okutur ya da bağlantıyı açar; çocuk aynı konudan 8 soru çözer.
          </p>
          {basliklar.length > 0 && (
            <ul aria-label="Gönderilen etkinlikler" style={{ margin: 0, paddingLeft: 24, fontSize: 22 }}>
              {basliklar.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          {link ? (
            <p
              ref={linkRef}
              data-testid="eve-link"
              style={{ margin: 0, fontSize: 24, fontFamily: 'monospace', wordBreak: 'break-all', userSelect: 'all' }}
            >
              {link}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 22 }}>Gönderilecek set yok.</p>
          )}
          <p style={{ margin: 0, fontSize: 18, color: COLOR.inkSoft }}>
            Bağlantıda ad, sınıf, okul ya da cevap yoktur; yalnız etkinlik kodları bulunur ve sunucuya gitmez.
          </p>
          <p role="status" aria-live="polite" style={{ margin: 0, fontSize: 22, minHeight: 30 }}>
            {kopya === 'kopyalandi'
              ? '✓ Bağlantı kopyalandı.'
              : kopya === 'elle'
                ? 'Kopyalanamadı — bağlantı seçili, elle kopyalayın.'
                : ''}
          </p>
        </div>
      </section>
      <footer style={{ flex: '0 0 auto', display: 'flex', gap: 16, alignItems: 'center' }}>
        {/* Geri (gelinen ekrana) / Ana menü: ortak gezinme rayı (KG-103). */}
        <BigButton
          label="Kopyala"
          size="tapMin"
          variant="accent"
          disabled={!link}
          onBlockedPress={() => undefined}
          onPress={() => void kopyala()}
          style={{ padding: '0 40px', minHeight: 102, fontWeight: 700 }}
        >
          Kopyala
        </BigButton>
      </footer>
    </main>
  );
}
