import type { TurHamleGlifi } from '../../../content/schema/turHamle';
import { SATIR, yolVerisi } from '../hamleCizim';
import {
  A4,
  ALT_BANT_MM,
  BIRIM_MM,
  CIZGI_MM,
  DIZGE_MM,
  ICERIK,
  KALEM_MM,
  KALIBRASYON_MM,
  KALIBRASYON_NOTU,
  glifEniMm,
  type KagitSatiri,
  type TurKagitSayfasi as Sayfa,
} from './turKagidi';
import './turKagit.css';

/**
 * Türkçe kâğıt sayfası (Adım 65): A4, tek SVG, `viewBox` mm. Yazdırmada `width: 210mm` → kalibrasyon karesi gerçek
 * 1 cm (CSS mm). Renk yok; gri baskıda aynı. SVG maskesi yok, font konturu yok (orta çizgi verisi).
 */
const MUREKKEP = '#000';
const CIZGI = '#555';
const YAZI = "'TemelYazi', 'TemelYaziRakam', 'Andika', sans-serif";
const u = (mm: number): number => mm / BIRIM_MM; // mm → hamle birimi

export function TurKagitSayfasi({
  sayfa,
  glif,
  glifler,
}: {
  readonly sayfa: Sayfa;
  readonly glif?: TurHamleGlifi;
  /** Destek kâğıdı: satırın `glifSirasi` buradan seçer. */
  readonly glifler?: readonly TurHamleGlifi[];
}) {
  return (
    <svg
      className="tk-sayfa"
      data-tur-kagit={sayfa.kod}
      viewBox={`0 0 ${A4.en} ${A4.boy}`}
      width={`${A4.en}mm`}
      height={`${A4.boy}mm`}
      role="img"
      aria-label={sayfa.baslik}
      fontFamily={YAZI}
    >
      <rect x={0} y={0} width={A4.en} height={A4.boy} fill="#fff" />
      <UstBilgi sayfa={sayfa} />
      {sayfa.ornek && glif && <BuyukOrnek glif={glif} kutu={sayfa.ornek} />}
      {sayfa.satirlar.map((s, k) => (
        <Satir key={k} satir={s} glif={s.glifSirasi !== undefined ? glifler?.[s.glifSirasi] : glif} />
      ))}
      {sayfa.gozlem.length > 0 && <GozlemTablosu sayfa={sayfa} />}
      <AltBilgi kod={sayfa.kod} />
    </svg>
  );
}

function UstBilgi({ sayfa }: { readonly sayfa: Sayfa }) {
  const y0 = A4.kenar;
  return (
    <g data-ust-bilgi="">
      <text x={ICERIK.x} y={y0 + 5} fontSize={5.2} fontWeight={700} fill={MUREKKEP}>
        {sayfa.baslik}
      </text>
      <text x={ICERIK.x + ICERIK.en - 78} y={y0 + 5} fontSize={3.6} fill={MUREKKEP}>
        Adı:
      </text>
      <line
        x1={ICERIK.x + ICERIK.en - 68}
        x2={ICERIK.x + ICERIK.en}
        y1={y0 + 5.6}
        y2={y0 + 5.6}
        stroke={MUREKKEP}
        strokeWidth={0.3}
      />
      <text x={ICERIK.x} y={y0 + 11.5} fontSize={3.4} fill={MUREKKEP}>
        {sayfa.altBaslik}
      </text>
    </g>
  );
}

/** Satır dizgesi: üst ve taban düz 0,35 mm, kılavuz kesikli 0,25 mm (mm koordinatı, `y` üst çizgi). */
function Dizge({ y, x = ICERIK.x, en = ICERIK.en, olcek = 1 }: { y: number; x?: number; en?: number; olcek?: number }) {
  const h = DIZGE_MM * olcek;
  return (
    <g data-dizge="" aria-hidden="true">
      <line x1={x} x2={x + en} y1={y} y2={y} stroke={CIZGI} strokeWidth={CIZGI_MM.ust} />
      <line
        x1={x}
        x2={x + en}
        y1={y + h / 2}
        y2={y + h / 2}
        stroke={CIZGI}
        strokeWidth={CIZGI_MM.kilavuz}
        strokeDasharray={CIZGI_MM.kilavuzKesik.join(' ')}
      />
      <line x1={x} x2={x + en} y1={y + h} y2={y + h} stroke={CIZGI} strokeWidth={CIZGI_MM.taban} />
    </g>
  );
}

type Kalem = 'ornek' | 'izle' | 'birlestir';

/** Glif, sol kenarı `x` ve üst çizgisi `y` (mm) olan dizgeye; ölçek 1 = 1 cm dizge. */
function Glif({
  glif,
  x,
  y,
  kalem,
  olcek = 1,
}: {
  glif: TurHamleGlifi;
  x: number;
  y: number;
  kalem: Kalem;
  olcek?: number;
}) {
  const s = BIRIM_MM * olcek;
  const ortak = { fill: 'none', stroke: MUREKKEP, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  const ciz =
    kalem === 'ornek'
      ? { strokeWidth: u(KALEM_MM.ornek) / olcek }
      : kalem === 'izle'
        ? {
            strokeWidth: u(KALEM_MM.izle) / olcek,
            strokeDasharray: KALEM_MM.izleKesik.map((m) => u(m) / olcek).join(' '),
          }
        : { strokeWidth: u(KALEM_MM.nokta) / olcek, strokeDasharray: `0 ${u(KALEM_MM.noktaAraligi) / olcek}` };
  return (
    <g transform={`translate(${x} ${y - SATIR.ust * s}) scale(${s})`} data-glif-kalem={kalem}>
      {glif.hamleler.map((h, i) => (
        <path key={i} d={yolVerisi(h.noktalar)} {...ortak} {...ciz} />
      ))}
      {kalem !== 'ornek' &&
        glif.hamleler.map((h, i) => (
          <circle
            key={`b${i}`}
            cx={h.noktalar[0][0]}
            cy={h.noktalar[0][1]}
            r={u(0.55) / olcek}
            fill={MUREKKEP}
            data-baslangic=""
          />
        ))}
    </g>
  );
}

function Satir({ satir, glif }: { readonly satir: KagitSatiri; readonly glif?: TurHamleGlifi }) {
  return (
    <g data-satir-kipi={satir.kip}>
      <Dizge y={satir.y} />
      {glif && satir.ornekX !== undefined && <Glif glif={glif} x={satir.ornekX} y={satir.y} kalem="ornek" />}
      {glif &&
        satir.kopyalar.map((x, k) => (
          <Glif key={k} glif={glif} x={x} y={satir.y} kalem={satir.kip === 'birlestir' ? 'birlestir' : 'izle'} />
        ))}
    </g>
  );
}

/** Hamlenin ucundaki yön oku (son ~`boy` birimin yönü), birim koordinatında üçgen. */
function ucOku(noktalar: readonly (readonly [number, number])[], boy: number): string {
  const [x1, y1] = noktalar[noktalar.length - 1];
  let [x0, y0] = noktalar[0];
  for (let k = noktalar.length - 2; k >= 0; k--) {
    [x0, y0] = noktalar[k];
    if (Math.hypot(x1 - x0, y1 - y0) >= 4) break;
  }
  const d = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [ux, uy] = [(x1 - x0) / d, (y1 - y0) / d];
  const [nx, ny] = [-uy, ux];
  const uc: [number, number] = [x1 + ux * boy * 0.9, y1 + uy * boy * 0.9];
  const a: [number, number] = [x1 - ux * boy * 0.2 + nx * boy * 0.55, y1 - uy * boy * 0.2 + ny * boy * 0.55];
  const b: [number, number] = [x1 - ux * boy * 0.2 - nx * boy * 0.55, y1 - uy * boy * 0.2 - ny * boy * 0.55];
  return [uc, a, b].map((p) => p.map((v) => +v.toFixed(2)).join(',')).join(' ');
}

/**
 * Üstte yazılış sırası: her hamle ayrı karede (önceki hamleler açık gri, sıradaki siyah ve kalın, başlangıçta dolu
 * nokta, uçta yön oku, karenin üstünde numarası). Renk yok: sıra numarayla ve gri/siyah ayrımıyla, gri baskıda okunur.
 */
function BuyukOrnek({ glif, kutu }: { glif: TurHamleGlifi; kutu: NonNullable<Sayfa['ornek']> }) {
  const olcek = kutu.dizgeMm / DIZGE_MM;
  const s = BIRIM_MM * olcek;
  const n = glif.hamleler.length;
  const kareEn = Math.min(46, (kutu.en - 8) / n);
  const ustCizgi = kutu.y + 8 + SATIR.ust * s;
  const glifEn = glifEniMm(glif) * olcek;
  return (
    <g data-buyuk-ornek="">
      <rect
        x={kutu.x}
        y={kutu.y}
        width={kutu.en}
        height={kutu.boy}
        fill="none"
        stroke={CIZGI}
        strokeWidth={0.3}
        rx={2}
      />
      {glif.hamleler.map((h, i) => {
        const kx = kutu.x + 4 + i * kareEn;
        const gx = kx + (kareEn - glifEn) / 2;
        return (
          <g key={i} data-yazilis-karesi={h.sira}>
            <text x={kx + 3} y={kutu.y + 6.5} fontSize={5} fontWeight={700} fill={MUREKKEP}>
              {h.sira}
            </text>
            <Dizge y={ustCizgi} x={kx + 2} en={kareEn - 4} olcek={olcek} />
            <g transform={`translate(${gx} ${ustCizgi - SATIR.ust * s}) scale(${s})`}>
              {glif.hamleler.slice(0, i).map((o, k) => (
                <path
                  key={k}
                  d={yolVerisi(o.noktalar)}
                  fill="none"
                  stroke="#B5B5B5"
                  strokeWidth={u(1.1) / olcek}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              <path
                d={yolVerisi(h.noktalar)}
                fill="none"
                stroke={MUREKKEP}
                strokeWidth={u(1.1) / olcek}
                strokeLinecap="round"
                strokeLinejoin="round"
                data-hamle={h.sira}
              />
              <circle cx={h.noktalar[0][0]} cy={h.noktalar[0][1]} r={u(1.1) / olcek} fill={MUREKKEP} />
              {h.noktalar.length > 2 && <polygon points={ucOku(h.noktalar, u(2.2) / olcek)} fill={MUREKKEP} />}
            </g>
          </g>
        );
      })}
    </g>
  );
}

function GozlemTablosu({ sayfa }: { readonly sayfa: Sayfa }) {
  const x0 = ICERIK.x;
  const en = ICERIK.en;
  const kutuX1 = x0 + 104;
  const kutuX2 = x0 + 128;
  const notX = x0 + 150;
  const satirBoy = 13;
  let y = ICERIK.y + 6;
  const parcalar = [];
  parcalar.push(
    <g key="alanlar">
      <text x={x0} y={y} fontSize={3.6} fill={MUREKKEP}>
        Harf veya ses:
      </text>
      <line x1={x0 + 33} x2={x0 + 86} y1={y + 0.6} y2={y + 0.6} stroke={MUREKKEP} strokeWidth={0.3} />
      <text x={x0 + 96} y={y} fontSize={3.6} fill={MUREKKEP}>
        Tarih:
      </text>
      <line x1={x0 + 112} x2={x0 + en} y1={y + 0.6} y2={y + 0.6} stroke={MUREKKEP} strokeWidth={0.3} />
    </g>,
  );
  y += 12;
  for (const [b, bolum] of sayfa.gozlem.entries()) {
    parcalar.push(
      <g key={`b${b}`} data-gozlem-bolumu={bolum.baslik}>
        <text x={x0} y={y} fontSize={4.4} fontWeight={700} fill={MUREKKEP}>
          {bolum.baslik}
        </text>
        <text x={kutuX1 - 6} y={y} fontSize={3} fill={MUREKKEP}>
          Gözlendi
        </text>
        <text x={kutuX2 - 4} y={y} fontSize={3} fill={MUREKKEP}>
          Destek
        </text>
        <text x={notX} y={y} fontSize={3} fill={MUREKKEP}>
          Not
        </text>
      </g>,
    );
    y += 4;
    for (const [k, o] of bolum.olcutler.entries()) {
      parcalar.push(
        <g key={`o${b}-${k}`} data-gozlem-olcutu="">
          <line x1={x0} x2={x0 + en} y1={y} y2={y} stroke={CIZGI} strokeWidth={0.2} />
          <text x={x0} y={y + 8} fontSize={3.6} fill={MUREKKEP}>
            {o}
          </text>
          <rect
            x={kutuX1}
            y={y + 3.5}
            width={6}
            height={6}
            fill="none"
            stroke={MUREKKEP}
            strokeWidth={0.35}
            data-kutu=""
          />
          <rect
            x={kutuX2}
            y={y + 3.5}
            width={6}
            height={6}
            fill="none"
            stroke={MUREKKEP}
            strokeWidth={0.35}
            data-kutu=""
          />
          <line x1={notX} x2={x0 + en} y1={y + 9.5} y2={y + 9.5} stroke={CIZGI} strokeWidth={0.25} />
        </g>,
      );
      y += satirBoy;
    }
    parcalar.push(<line key={`s${b}`} x1={x0} x2={x0 + en} y1={y} y2={y} stroke={CIZGI} strokeWidth={0.2} />);
    y += 14;
  }
  parcalar.push(
    <text key="dip" x={x0} y={y} fontSize={3.2} fill={MUREKKEP}>
      Destek: bu noktada çocuğa birlikte yazma, el üstünden yönlendirme ya da ek örnek gerekiyor.
    </text>,
  );
  return <g data-gozlem-tablosu="">{parcalar}</g>;
}

/** Alt bilgi: 10 × 10 mm kalibrasyon karesi + not + kâğıt kodu. */
function AltBilgi({ kod }: { readonly kod: string }) {
  const y = A4.boy - A4.kenar - ALT_BANT_MM + 2;
  return (
    <g data-alt-bilgi="">
      <rect
        x={ICERIK.x}
        y={y}
        width={KALIBRASYON_MM}
        height={KALIBRASYON_MM}
        fill="none"
        stroke={MUREKKEP}
        strokeWidth={0.3}
        data-kalibrasyon=""
      />
      <text x={ICERIK.x + KALIBRASYON_MM + 3} y={y + 4.2} fontSize={3.2} fill={MUREKKEP}>
        {KALIBRASYON_NOTU}
      </text>
      <text x={ICERIK.x + KALIBRASYON_MM + 3} y={y + 8.6} fontSize={2.8} fill={MUREKKEP}>
        Okulumsun, MEB TYMM 2026 Türkçe 1. sınıf. Ücretsiz, çoğaltılabilir.
      </text>
      <text x={ICERIK.x + ICERIK.en} y={y + 4.2} fontSize={2.8} fill={MUREKKEP} textAnchor="end" data-kagit-kodu="">
        {kod}
      </text>
    </g>
  );
}
