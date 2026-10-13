/**
 * GLİF KARTI — YALNIZ GELİŞTİRME (plan v2 Adım 30).
 *
 * `vite dev` altında `?gelistirme=glif` ile açılır (bkz. `src/main.tsx`).
 * Üretim derlemesinde `import.meta.env.DEV` derleme anında `false` olduğu için
 * bu modül hiç yüklenmez ve paketlenmez.
 *
 * 0–9 glifleri büyük, çizgili/ızgaralı zemin üstünde; her alt yolun başlangıcı
 * numaralı bir okla (yön) gösterilir. Veri tek kaynaktan: `RAKAM_GLIFLERI`.
 * MEB kılavuzundaki form görsel olarak KOPYALANMAZ; yalnız tarif edilir.
 * Kişisel veri yok.
 */
import { COLOR, GLIF } from '../design/tokens';
import { RAKAM_GLIFLERI, altYolBaslangiclari, type RakamGlifi } from '../ui/svg/rakamGlifleri';

/** Plan §3.4'teki hedef formun sözlü tarifi (kaynak: PLAN §3.4; MEB kılavuzu öğretmenlerden istenir). */
const HEDEF_TARIF: Readonly<Record<number, string>> = {
  1: 'Hedef: kancalı 1 (üstte küçük kanca).',
  7: 'Hedef: çizgisiz 7 (ortada yatay çizgi yok).',
};

const OK_RENGI = '#1D4ED8';

function GlifCizimi({ glif, boyut }: { glif: RakamGlifi; boyut: number }) {
  const oklar = altYolBaslangiclari(glif.path);
  return (
    <svg viewBox="0 0 100 100" width={boyut} height={boyut} role="img" aria-label={`Rakam ${glif.rakam}`}>
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
      <path
        d={glif.path}
        fill="none"
        stroke={COLOR.ink}
        strokeWidth={GLIF.cizgiKalinligi}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {oklar.map((o, i) => (
        <g key={i}>
          <circle cx={o.x} cy={o.y} r={3.2} fill={OK_RENGI} />
          <line x1={o.x} y1={o.y} x2={o.x + o.dx * 12} y2={o.y + o.dy * 12} stroke={OK_RENGI} strokeWidth={1.4} />
          <text x={o.x - 7} y={o.y - 4} fontSize={7} fill={OK_RENGI}>{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

export function GlifKarti() {
  return (
    <main style={{ padding: 24, background: COLOR.bg, color: COLOR.ink, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24 }}>Rakam glifleri (geliştirme) — plan v2 Adım 30</h1>
      <p style={{ maxWidth: 760 }}>
        Uygulamadaki 0–9 glifleri (`RAKAM_GLIFLERI`). Mavi nokta ve sayı her alt yolun başlangıcını,
        kısa çizgi ilk yönünü gösterir. Öğretmen görüşü: `docs/icerik/rakam-glifleri.md`.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {RAKAM_GLIFLERI.map((g) => (
          <section key={g.rakam} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: 12, background: COLOR.surface }}>
            <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>{g.rakam}</h2>
            <GlifCizimi glif={g} boyut={220} />
            <ol style={{ fontSize: 13, paddingLeft: 18 }}>
              {g.yazimSirasi.map((t) => <li key={t}>{t}</li>)}
            </ol>
            {HEDEF_TARIF[g.rakam] && <p style={{ fontSize: 13, color: COLOR.inkSoft }}>{HEDEF_TARIF[g.rakam]}</p>}
          </section>
        ))}
      </div>
    </main>
  );
}
