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
import { nesneKonumlari } from './positions';

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

/**
 * MEB dik temel rakam glifleri (0-9) — özel SVG path.
 * Plan §3.4: "Rakamlar fonttan değil, özel SVG path'ten.
 * MEB dik temel formuna birebir uyum (kancalı 1, çizgisiz 7)."
 *
 * Her glif 100×100 viewBox içinde tanımlı, merkeze hizalı.
 * Stroke tabanlı (çocuk yazı öğrenirken gördüğü form).
 */
const RAKAM_PATHS: Readonly<Record<string, string>> = {
  // 0 — yumuşak yuvarlak
  '0': 'M50 15 C30 15 22 35 22 50 C22 65 30 85 50 85 C70 85 78 65 78 50 C78 35 70 15 50 15 Z',
  // 1 — kancalı (MEB dik temel: üstte küçük kanca)
  '1': 'M38 20 L42 18 C46 16 50 18 48 22 L45 30 L45 82',
  // 2 — üstte yay, altta düz taban
  '2': 'M28 35 C28 22 38 15 50 15 C62 15 72 22 72 35 C72 48 55 55 45 68 L42 72 L75 72 L75 82 L25 82 L25 74 C35 62 55 52 55 38 C55 30 52 25 50 25 C47 25 45 28 45 32 C45 36 47 38 50 38',
  // 3 — iki yay, üst ve alt
  '3': 'M30 25 C35 18 42 15 50 15 C60 15 72 22 72 33 C72 42 65 47 57 48 C66 49 72 55 72 65 C72 78 62 85 50 85 C40 85 33 80 28 73 L35 67 C38 72 43 75 50 75 C56 75 60 71 60 65 C60 59 56 55 50 55 L45 55 L45 45 L50 45 C55 45 58 41 58 36 C58 31 55 27 50 27 C45 27 42 30 40 34 L30 25 Z',
  // 4 — düz dikey + yatay çapraz
  '4': 'M55 15 L25 55 L25 62 L60 62 L60 82 L60 82 M60 15 L60 62 M25 62 L75 62',
  // 5 — üst yatay + yay + alt yay
  '5': 'M68 20 L30 20 L30 45 L45 43 C48 42 52 42 55 45 C60 48 62 55 62 62 C62 72 57 82 50 82 C42 82 35 78 30 72 L37 66 C40 70 44 73 50 73 C55 73 58 69 58 63 C58 57 54 53 50 53 C47 53 44 55 42 57 L32 52 L32 15 L68 15 L68 20 Z',
  // 6 — alt yuvarlak, üst yay
  '6': 'M72 30 C68 20 60 15 50 15 C35 15 25 28 25 50 C25 70 35 85 50 85 C62 85 72 75 72 62 C72 50 63 42 52 42 C45 42 39 46 35 52 C35 38 42 25 50 25 C56 25 60 28 62 33 L72 30 Z M50 52 C57 52 62 57 62 63 C62 70 57 75 50 75 C43 75 38 70 38 63 C38 57 43 52 50 52 Z',
  // 7 — çizgisiz (MEB dik temel: üst yatay, çapraz iniş, ortada çizgi yok)
  '7': 'M25 20 L75 20 L75 25 L50 82',
  // 8 — iki yuvarlak üst üste
  '8': 'M50 15 C40 15 32 21 32 30 C32 38 40 43 50 43 C60 43 68 38 68 30 C68 21 60 15 50 15 Z M50 47 C39 47 30 54 30 65 C30 77 39 85 50 85 C61 85 70 77 70 65 C70 54 61 47 50 47 Z M50 52 C57 52 62 57 62 65 C62 73 57 78 50 78 C43 78 38 73 38 65 C38 57 43 52 50 52 Z',
  // 9 — üst yuvarlak, alt yay
  '9': 'M28 70 C32 80 40 85 50 85 C65 85 75 72 75 50 C75 30 65 15 50 15 C38 15 28 25 28 38 C28 50 37 58 48 58 C55 58 61 54 65 48 C65 62 58 75 50 75 C44 75 40 72 38 67 L28 70 Z M50 25 C43 25 38 30 38 38 C38 45 43 50 50 50 C57 50 62 45 62 38 C62 30 57 25 50 25 Z',
};

/** Rakam/sayı kartı. Rakam okuma yazma değildir — güvenle büyük gösterilir.
 * MEB dik temel SVG glifleri (§3.4) — font bağımlılığı yok. */
function Rakam({ sayi, width, height }: { sayi: number; width: number; height: number }) {
  const rakamStr = String(sayi);
  const basamak = rakamStr.length;
  // Her basamak için genişlik ayarla — çift basamakta daha dar
  const basamakGenislik = basamak === 1 ? width : width / (basamak + 0.3);
  const basamakYukseklik = Math.min(basamakGenislik, height) * 0.9;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {rakamStr.split('').map((rakam, i) => {
        const path = RAKAM_PATHS[rakam];
        if (!path) return null;
        const offsetX = basamak === 1
          ? 0
          : (width - basamak * basamakGenislik) / 2 + i * basamakGenislik;
        return (
          <g key={i} transform={`translate(${offsetX}, ${(height - basamakYukseklik) / 2}) scale(${basamakGenislik / 100}, ${basamakYukseklik / 100})`}>
            <path
              d={path}
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
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

/** Banknot — TCMB koruması nedeniyle STİLİZE temsil (gerçek banknot çizilmez).
 * Rakamlar MEB dik temel SVG glifleri (§3.4). */
function Banknot({
  deger,
  width,
  height,
}: {
  deger: BanknotDegeri;
  width: number;
  height: number;
}) {
  const rakamStr = String(deger);
  const basamak = rakamStr.length;
  const basamakGenislik = Math.min(width * 0.6 / (basamak + 0.5), height * 0.5);
  const basamakYukseklik = basamakGenislik * 0.9;
  const toplamGenislik = basamak * basamakGenislik + basamakGenislik * 0.4; // ₺ için ek
  const startX = (width - toplamGenislik) / 2;
  const startY = (height - basamakYukseklik) / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <rect x="3" y="3" width={width - 6} height={height - 6} rx={14} fill="#fef9c3" stroke="#ca8a04" strokeWidth="4" />
      {rakamStr.split('').map((rakam, i) => {
        const path = RAKAM_PATHS[rakam];
        if (!path) return null;
        return (
          <g key={i} transform={`translate(${startX + i * basamakGenislik}, ${startY}) scale(${basamakGenislik / 100}, ${basamakYukseklik / 100})`}>
            <path d={path} fill="none" stroke="#854d0e" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
      {/* ₺ sembolü — basit SVG path */}
      <g transform={`translate(${startX + basamak * basamakGenislik}, ${startY}) scale(${basamakGenislik / 100}, ${basamakYukseklik / 100})`}>
        <path d="M30 30 L70 30 M30 40 L70 40 M50 15 C40 15 35 25 35 50 C35 70 40 82 50 82 C58 82 62 75 62 68 C62 60 57 55 50 55" fill="none" stroke="#854d0e" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
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
  const yerler = nesneKonumlari(spec);
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

