/**
 * MASKOT HİKÂYESİ ÖNİZLEMESİ — YALNIZ GELİŞTİRME (plan v2 Adım 54 aşama 1, KG-91).
 *
 * `vite dev` altında `?gelistirme=hikaye&tema=2&sahne=1` ile bir hikâye sahnesini (tema arka planı + maskot pozu +
 * sahne görseli) gösterir; metin yalnız burada, ekranda yazılı (çocuk okumaz — uygulamada ses gelince söylenecek).
 * Karakter kitabı incelemesi ve görsel denetim içindir. Üretim derlemesinde `import.meta.env.DEV` `false` olduğundan
 * bu modül paketlenmez. Hiçbir şey saklanmaz, ses çalmaz.
 */
import { siradakiSahne, temaHikayesi } from '../content/maskotHikayeleri';
import { COLOR } from '../design/tokens';
import { Maskot } from '../ui/feedback/Maskot';
import { TemaSahnesi } from '../ui/svg/temaSahneleri';
import { Visual } from '../ui/svg/Visual';

export function HikayeOnizleme() {
  const p = new URLSearchParams(location.search);
  const tema = Number(p.get('tema') ?? '1');
  const sahneNo = Number(p.get('sahne') ?? '1');
  const hikaye = temaHikayesi(tema);
  const sahne = siradakiSahne(tema, sahneNo - 1);
  if (!hikaye || !sahne) return <main style={{ padding: 24 }}>Bilinmeyen tema: {tema}</main>;
  return (
    <main
      style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: COLOR.bg }}
      data-hikaye-onizleme
    >
      <TemaSahnesi sahne={hikaye.sahne} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4vw',
        }}
      >
        <Maskot durum={sahne.poz} size={180} />
        <div style={{ background: COLOR.surface, borderRadius: 24, padding: 16, border: `3px solid ${COLOR.border}` }}>
          <Visual spec={sahne.gorsel} width={320} height={320} />
        </div>
      </div>
      <p
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 24,
          transform: 'translateX(-50%)',
          margin: 0,
          padding: '8px 16px',
          borderRadius: 12,
          background: COLOR.surface,
          color: COLOR.ink,
          font: '600 20px system-ui, sans-serif',
          maxWidth: '80vw',
        }}
      >
        {hikaye.baslik} · {sahne.sesAnahtari} · {sahne.poz} — “{sahne.metin}”
      </p>
    </main>
  );
}
