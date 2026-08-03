/**
 * VISUALSPEC RENDERER — jeneratörün TARİF ettiği görseli ÇİZER (plan §8).
 *
 * Jeneratör görseli üretmez, tarif eder: "12 elma, onluk çerçevede" der, nasıl
 * görüneceğine karışmaz. Bu bileşen her VisualSpec dalını SVG'ye çevirir.
 * Ayrımlı birleşim (discriminated union) olduğu için `switch` KAPSAMLIdır — yeni
 * bir görsel türü eklenirse ve bir dal unutulursa DERLEME hatası verir; bu, sessiz
 * bir boş ekranı önleyen tek şey.
 *
 * Tüm koordinatlar normalize (0..1) ya da verilen piksel boyutuna göre hesaplanır
 * — bileşen asla ham piksel yazmaz, ölçek `width`/`height` props'undan gelir.
 * Böylece aynı tarif akıllı tahtada (1.6×) ve telefonda (0.75×) doğru ölçeklenir.
 */
import type {
  BanknotDegeri,
  Renk,
  SekilAdi,
  VisualSpec,
} from '../../exercises/types';
import { ACCENTS } from '../../design/tokens';
import { Sprite } from './Sprite';

/** Renk adını hex'e çevirir — ACCENTS tek kaynak (mor=turuncu=… haritaları çift tutmaz). */
const RENK_HEX: Record<Renk, string> = Object.fromEntries(
  ACCENTS.map((a) => [a.id, a.hex]),
) as Record<Renk, string>;

export function Visual({
  spec,
  width,
  height,
}: {
  spec: VisualSpec;
  width: number;
  height: number;
}) {
  switch (spec.type) {
    case 'rakam':
      return <Rakam sayi={spec.sayi} width={width} height={height} />;
    case 'sekil':
      return <Sekil spec={spec} width={width} height={height} />;
    case 'banknot':
      return <Banknot deger={spec.deger} width={width} height={height} />;
    case 'nesneKumesi':
      return <NesneKumesi spec={spec} width={width} height={height} />;
    case 'onlukCerceve':
      return <OnlukCerceve gruplar={spec.gruplar} width={width} height={height} />;
    case 'sayiDogrusu':
      return <SayiDogrusu spec={spec} width={width} height={height} />;
    case 'oruntu':
      return <Oruntu spec={spec} width={width} height={height} />;
    case 'sahne':
      return <Sahne spec={spec} width={width} height={height} />;
    case 'olcumSahnesi':
      return <OlcumSahnesi spec={spec} width={width} height={height} />;
  }
}

// --------------------------------------------------------------- basit görseller

/** Rakam/sayı kartı. Rakam okuma yazma değildir — güvenle büyük gösterilir. */
function Rakam({ sayi, width, height }: { sayi: number; width: number; height: number }) {
  const fs = Math.min(width, height) * 0.7;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Andika', sans-serif"
        fontWeight={700}
        fontSize={fs}
        fill="var(--color-ink)"
      >
        {sayi}
      </text>
    </svg>
  );
}

/** Tek geometrik şekil. Döndürme prototip etkisini kırar (SEKIL_PROTOTIP hatası). */
function Sekil({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'sekil' }>;
  width: number;
  height: number;
}) {
  const fill = spec.renk ? RENK_HEX[spec.renk] : 'var(--color-accent)';
  const cx = width / 2;
  const cy = height / 2;
  const r = (Math.min(width, height) / 2) * (spec.olcek ?? 0.8);
  const rot = spec.donusDerece ?? 0;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <g transform={`rotate(${rot} ${cx} ${cy})`} fill={fill} stroke="#1f2937" strokeWidth="2">
        {sekilYolu(spec.sekil, cx, cy, r)}
      </g>
    </svg>
  );
}

function sekilYolu(sekil: SekilAdi, cx: number, cy: number, r: number) {
  switch (sekil) {
    case 'cember':
      return <circle cx={cx} cy={cy} r={r} />;
    case 'kare':
      return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={6} />;
    case 'dikdortgen':
      return <rect x={cx - r} y={cy - r * 0.62} width={r * 2} height={r * 1.24} rx={6} />;
    case 'ucgen':
      return <path d={`M${cx} ${cy - r} L${cx + r} ${cy + r} L${cx - r} ${cy + r} Z`} />;
  }
}

/** Banknot — TCMB koruması nedeniyle STİLİZE temsil (gerçek banknot çizilmez). */
function Banknot({
  deger,
  width,
  height,
}: {
  deger: BanknotDegeri;
  width: number;
  height: number;
}) {
  const fs = Math.min(width, height) * 0.4;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <rect x="3" y="3" width={width - 6} height={height - 6} rx={14} fill="#fef9c3" stroke="#ca8a04" strokeWidth="4" />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Andika', sans-serif"
        fontWeight={700}
        fontSize={fs}
        fill="#854d0e"
      >
        {deger}₺
      </text>
    </svg>
  );
}

// ----------------------------------------------------------- nesne kümeleri

/** Sayılacak/karşılaştırılacak nesne kümesi. Yerleşim düzeni kazanımı yansıtır. */
function NesneKumesi({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'nesneKumesi' }>;
  width: number;
  height: number;
}) {
  const renk = spec.renk ? RENK_HEX[spec.renk] : undefined;
  // Her yerleşim için normalize (0..1) konumlar üret; tek çizim yolu.
  const yerler = yerlesimKonumlari(spec);
  const spriteSize = Math.min(width, height) * 0.22;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {yerler.map((p, i) => (
        <g key={i} transform={`translate(${p.x * width} ${p.y * height})`}>
          <g transform={`translate(${-spriteSize / 2} ${-spriteSize / 2})`}>
            <Sprite name={spec.sprite} fill={renk} size={spriteSize} />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** Yerleşim biçimine göre normalize konum dizisi üretir (deterministik). */
function yerlesimKonumlari(spec: Extract<VisualSpec, { type: 'nesneKumesi' }>): readonly { x: number; y: number }[] {
  const n = spec.adet;
  if (spec.layout === 'dagınık' && spec.konumlar && spec.konumlar.length >= n) {
    return spec.konumlar.slice(0, n);
  }
  if (spec.layout === 'onlukCerceve') {
    // Onluk çerçeve: 5 sütun × 2 satır. [10,3] → 2 çerçeve.
    return onlukKonumlari(spec.adet);
  }
  if (spec.layout === 'gruplu') {
    // İki alt küme yan yana; her biri sira düzeninde.
    const yarisi = Math.ceil(n / 2);
    const sol = siraKonumlari(yarisi, 0.0, 0.42);
    const sag = siraKonumlari(n - yarisi, 0.5, 1.0);
    return [...sol, ...sag];
  }
  // 'sira' ve verilmeyen — tek blok düzenli ızgara.
  return siraKonumlari(n, 0.04, 0.96);
}

/** n nesneyi soldan sağa, satırlara sararak [x0..x1] aralığna dizer. */
function siraKonumlari(n: number, x0: number, x1: number): readonly { x: number; y: number }[] {
  if (n <= 0) return [];
  const sutun = Math.min(n, Math.max(1, Math.round(Math.sqrt(n))));
  const satir = Math.ceil(n / sutun);
  const adimX = sutun > 1 ? (x1 - x0) / (sutun - 1) : 0;
  const adimY = satir > 1 ? 0.85 / (satir - 1) : 0;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / sutun);
    const c = i % sutun;
    out.push({ x: x0 + c * adimX, y: 0.12 + r * adimY });
  }
  return out;
}

/** Onluk çerçeve konumları: 5 sütun × 2 satır, 10'dan sonrası yeni çerçeve. */
function onlukKonumlari(n: number): readonly { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const kalan = i % 10;
    const satir = Math.floor(kalan / 5);
    const sutun = kalan % 5;
    out.push({ x: 0.1 + sutun * 0.18, y: 0.12 + satir * 0.4 });
  }
  return out;
}

// ----------------------------------------------------------- onluk çerçeve

/**
 * Onluk çerçeve. `gruplar` her çerçevedeki dolu göz sayısı: [10, 3] = 13.
 * Burada mesele nesne değil YAPI (5'li/10'lu görme).
 */
function OnlukCerceve({
  gruplar,
  width,
  height,
}: {
  gruplar: readonly number[];
  width: number;
  height: number;
}) {
  const cerceveSayisi = gruplar.length;
  const cerceveGenislik = width / cerceveSayisi;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {gruplar.map((dolu, ci) => {
        const ox = ci * cerceveGenislik;
        const dots: React.ReactNode[] = [];
        for (let i = 0; i < 10; i++) {
          const satir = Math.floor(i / 5);
          const sutun = i % 5;
          const cx = ox + cerceveGenislik * 0.1 + sutun * cerceveGenislik * 0.16;
          const cy = height * 0.15 + satir * height * 0.4;
          const doluMu = i < dolu;
          dots.push(
            <circle key={i} cx={cx} cy={cy} r={Math.min(cerceveGenislik, height) / 14} fill={doluMu ? 'var(--color-accent)' : '#f3f4f6'} stroke={doluMu ? 'none' : '#e5e7eb'} />,
          );
        }
        return (
          <g key={ci}>
            <rect x={ox + 4} y={4} width={cerceveGenislik - 8} height={height - 8} rx={8} fill="none" stroke="#d1d5db" strokeWidth="3" />
            {dots}
          </g>
        );
      })}
    </svg>
  );
}

// ----------------------------------------------------------- sayı doğrusu

/** Sayı doğrusu. `eksik` boş bırakılır; `isaretli` üzerinde yazılır. */
function SayiDogrusu({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'sayiDogrusu' }>;
  width: number;
  height: number;
}) {
  const degerler: number[] = [];
  for (let v = spec.bas; v <= spec.son; v += spec.adim) degerler.push(v);
  const y = height * 0.6;
  const x0 = width * 0.08;
  const x1 = width * 0.92;
  const fs = Math.min(width, height) * 0.14;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <line x1={x0} y1={y} x2={x1} y2={y} stroke="#9ca3af" strokeWidth="4" />
      {degerler.map((v, i) => {
        const x = x0 + (x1 - x0) * (i / Math.max(1, degerler.length - 1));
        const eksikte = spec.eksik.includes(v);
        const isaretli = spec.isaretli.includes(v);
        return (
          <g key={i}>
            <line x1={x} y1={y - 14} x2={x} y2={y + 14} stroke="#6b7280" strokeWidth="4" />
            {isaretli && !eksikte && (
              <text x={x} y={y - 22} textAnchor="middle" fontFamily="'Andika',sans-serif" fontWeight={700} fontSize={fs} fill="var(--color-ink)">{v}</text>
            )}
            {eksikte && <rect x={x - fs * 0.6} y={y - fs * 1.4} width={fs * 1.2} height={fs * 1.2} rx={6} fill="#fff7ed" stroke="#fdba74" strokeWidth="3" />}
          </g>
        );
      })}
    </svg>
  );
}

// ----------------------------------------------------------- örüntü + sahne

/** Sıralanacak kart dizisi. `eksikIndeksler` boşluk olarak çizilir. */
function Oruntu({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'oruntu' }>;
  width: number;
  height: number;
}) {
  const n = spec.ogeler.length;
  const hucre = width / Math.max(1, n);
  const vSize = Math.min(hucre, height) * 0.9;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {spec.ogeler.map((o, i) => {
        const ox = i * hucre + (hucre - vSize) / 2;
        const oy = (height - vSize) / 2;
        const eksik = spec.eksikIndeksler.includes(i);
        return (
          <g key={i} transform={`translate(${ox} ${oy})`}>
            {eksik ? (
              <rect width={vSize} height={vSize} rx={10} fill="#fff7ed" stroke="#fdba74" strokeWidth="4" strokeDasharray="8 6" />
            ) : (
              <Visual spec={o} width={vSize} height={vSize} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Birden çok görselin tek sahnedeki bileşimi. Konumlar normalize (0..1). */
function Sahne({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'sahne' }>;
  width: number;
  height: number;
}) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {spec.parcalar.map((p, i) => {
        const pw = width * 0.46;
        const ph = height * 0.8;
        const px = p.konum.x * width - pw / 2;
        const py = p.konum.y * height - ph / 2;
        return (
          <g key={i} transform={`translate(${px} ${py})`}>
            <Visual spec={p.gorsel} width={pw} height={ph} />
          </g>
        );
      })}
    </svg>
  );
}

/** Ölçme sahnesi: nesne, birimleri yan yana dizerek ölçülür. */
function OlcumSahnesi({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'olcumSahnesi' }>;
  width: number;
  height: number;
}) {
  const birimSize = Math.min(width, height) * 0.18;
  const nesneSize = Math.min(width, height) * 0.6;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <g transform={`translate(${width * 0.06} ${(height - nesneSize) / 2})`}>
        <Sprite name={spec.nesne} size={nesneSize} />
      </g>
      {Array.from({ length: spec.birimAdedi }).map((_, i) => (
        <g key={i} transform={`translate(${width * 0.5 + i * birimSize * 0.9} ${(height - birimSize) / 2})`}>
          <Sprite name={spec.birim} size={birimSize} />
        </g>
      ))}
    </svg>
  );
}

