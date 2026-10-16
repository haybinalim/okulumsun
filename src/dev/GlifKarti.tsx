/**
 * GLİF KARTI — YALNIZ GELİŞTİRME (plan v2 Adım 30, KG-95).
 *
 * `vite dev` altında `?gelistirme=glif` ile açılır (bkz. `src/main.tsx`).
 * Üretim derlemesinde `import.meta.env.DEV` derleme anında `false` olduğu için
 * bu modül hiç yüklenmez ve paketlenmez.
 *
 * 0–9 glifleri büyük, çizgili/ızgaralı zemin üstünde: solda uygulamanın çizdiği
 * dolgulu glif (`RAKAM_GLIFLERI`), sağda MEB Kılavuz glifi (numaralı yazım yönü
 * okları; `RAKAM_KILAVUZ_YOLLARI`). Kaynak: MEB TYMM 2024 TemelYazi. Kişisel veri yok.
 */
import { COLOR } from '../design/tokens';
import { RAKAM_GLIFLERI } from '../ui/svg/rakamGlifleri';
import { RAKAM_KILAVUZ_YOLLARI } from '../ui/svg/rakamKilavuzYollari';

function Zemin() {
  return (
    <>
      {/* Izgara: 10 birimlik kareler */}
      {Array.from({ length: 11 }, (_, i) => (
        <g key={i} stroke={COLOR.border} strokeWidth={0.4}>
          <line x1={i * 10} y1={0} x2={i * 10} y2={100} />
          <line x1={0} y1={i * 10} x2={100} y2={i * 10} />
        </g>
      ))}
      {/* Yazı çizgileri: üst (15), orta (50, kesikli), taban (85) */}
      <line x1={0} y1={15} x2={100} y2={15} stroke={COLOR.inkSoft} strokeWidth={0.6} />
      <line x1={0} y1={50} x2={100} y2={50} stroke={COLOR.inkSoft} strokeWidth={0.6} strokeDasharray="3 2" />
      <line x1={0} y1={85} x2={100} y2={85} stroke={COLOR.inkSoft} strokeWidth={0.6} />
    </>
  );
}

function GlifCizimi({ d, boyut, etiket }: { d: string; boyut: number; etiket: string }) {
  return (
    <svg viewBox="-8 -8 116 116" width={boyut} height={boyut} role="img" aria-label={etiket}>
      <Zemin />
      <path d={d} fill={COLOR.ink} />
    </svg>
  );
}

export function GlifKarti() {
  return (
    <main style={{ padding: 24, background: COLOR.bg, color: COLOR.ink, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24 }}>Rakam glifleri (geliştirme) — MEB TYMM TemelYazi (KG-95)</h1>
      <p style={{ maxWidth: 760 }}>
        Solda uygulamadaki 0–9 glifleri (`RAKAM_GLIFLERI`, TemelYazi-Bold), sağda MEB Kılavuz glifi (kesikli numaralı
        oklar yazım yönünü ve hamle sırasını gösterir). Metindeki rakamlar: font 'TemelYaziRakam'.
      </p>
      <p data-testid="metin-rakamlari" style={{ fontFamily: 'var(--font-sans)', fontSize: 48, margin: '8px 0 16px' }}>
        0 1 2 3 4 5 6 7 8 9 · 5 + 3 = 8 · 17 &gt; 12 · 9 − 4
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {RAKAM_GLIFLERI.map((g) => (
          <section
            key={g.rakam}
            style={{ border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 12, background: COLOR.surface }}
          >
            <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>{g.rakam}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <GlifCizimi d={g.path} boyut={136} etiket={`Rakam ${g.rakam}`} />
              <GlifCizimi
                d={RAKAM_KILAVUZ_YOLLARI[g.rakam] ?? g.path}
                boyut={136}
                etiket={`Rakam ${g.rakam} yazım yönü`}
              />
            </div>
            <ol style={{ fontSize: 13, paddingLeft: 18 }}>
              {g.yazimSirasi.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}
