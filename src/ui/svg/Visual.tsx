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
import { RESMI_BANKNOT_GORSELLERI } from './banknotAssets';
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
    case 'islemSahnesi':
      return <IslemSahnesi spec={spec} width={width} height={height} />;
    case 'islemKarti':
      return <IslemKarti spec={spec} width={width} height={height} />;
    case 'nesneKumesi':
      return <NesneKumesi spec={spec} width={width} height={height} />;
    case 'onlukCerceve':
      return <OnlukCerceve gruplar={spec.gruplar} width={width} height={height} />;
    case 'sayiDogrusu':
      return <SayiDogrusu spec={spec} width={width} height={height} />;
    case 'oruntu':
      return <Oruntu spec={spec} width={width} height={height} />;
    case 'yonKarti':
      return <YonKarti spec={spec} width={width} height={height} />;
    case 'sahne':
      return <Sahne spec={spec} width={width} height={height} />;
    case 'konumSahnesi':
      return <KonumSahnesi spec={spec} width={width} height={height} />;
    case 'olcumSahnesi':
      return <OlcumSahnesi spec={spec} width={width} height={height} />;
    case 'olcumKarsilastirma':
      return <OlcumKarsilastirma spec={spec} width={width} height={height} />;
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
/** Dört terimli işlem kartı: rakam + işlem sembolü + rakam = sonuç.
 * Semboller sayılardan ayrı çizilir; böylece çocuk yalnız sayı dizisini değil
 * toplama/çıkarma yönünü de eşleştirir. */
function IslemKarti({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'islemKarti' }>;
  width: number;
  height: number;
}) {
  const merkezY = height / 2;
  const sembolBoyutu = Math.min(width, height) * 0.18;
  const rakamGenislik = width * 0.19;
  const konumlar = [0.04, 0.29, 0.5, 0.77] as const;
  const sembol = spec.islem === '+' ? '+' : '−';
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <rect x={3} y={3} width={width - 6} height={height - 6} rx={Math.min(width, height) * 0.12} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={3} />
      <g transform={`translate(${konumlar[0] * width} ${(height - rakamGenislik) / 2})`}><Rakam sayi={spec.ilkSayi} width={rakamGenislik} height={rakamGenislik} /></g>
      <text x={konumlar[1] * width} y={merkezY + sembolBoyutu * 0.34} textAnchor="middle" fontFamily="'Andika', sans-serif" fontWeight={700} fontSize={sembolBoyutu} fill="#1d4ed8">{sembol}</text>
      <g transform={`translate(${(konumlar[1] + 0.06) * width} ${(height - rakamGenislik) / 2})`}><Rakam sayi={spec.ikinciSayi} width={rakamGenislik} height={rakamGenislik} /></g>
      <text x={konumlar[2] * width} y={merkezY + sembolBoyutu * 0.34} textAnchor="middle" fontFamily="'Andika', sans-serif" fontWeight={700} fontSize={sembolBoyutu} fill="#475569">=</text>
      <g transform={`translate(${konumlar[3] * width} ${(height - rakamGenislik) / 2})`}><Rakam sayi={spec.sonuc} width={rakamGenislik} height={rakamGenislik} /></g>
    </svg>
  );
}

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

/**
 * Banknot — yalnız TCMB'nin yayımladığı, üzerinde `ORNEKTIR GECMEZ`
 * ibaresi bulunan resmî E9 5. tertip ön yüz örneğini gösterir. Banknot türü
 * yalnızca eşlemesi bulunan gerçek kupürleri kabul eder; stilize geri dönüş yoktur.
 */
function Banknot({
  deger,
  width,
  height,
}: {
  deger: BanknotDegeri;
  width: number;
  height: number;
}) {
  const resmiGorsel = RESMI_BANKNOT_GORSELLERI[deger];
  const kartGenislik = width * 0.93;
  const kartYukseklik = Math.min(height * 0.7, kartGenislik * 0.5);
  const x = (width - kartGenislik) / 2;
  const y = (height - kartYukseklik) / 2;
  const clipId = `banknot-${deger}-${width}-${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={kartGenislik} height={kartYukseklik} rx={kartYukseklik * 0.045} />
        </clipPath>
      </defs>
      <rect
        x={x + 3}
        y={y + 4}
        width={kartGenislik}
        height={kartYukseklik}
        rx={kartYukseklik * 0.045}
        fill="#0f172a"
        opacity="0.16"
      />
      <image
        href={resmiGorsel}
        x={x}
        y={y}
        width={kartGenislik}
        height={kartYukseklik}
        preserveAspectRatio="xMidYMid meet"
        clipPath={`url(#${clipId})`}
      />
      <rect
        x={x}
        y={y}
        width={kartGenislik}
        height={kartYukseklik}
        rx={kartYukseklik * 0.045}
        fill="none"
        stroke="#334155"
        strokeWidth={Math.max(1.5, kartYukseklik * 0.018)}
      />
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

/**
 * Konum sorularının açıklayıcı sahnesi.
 * Her ilişkide aynı hedef nesne ile aynı kutu/sepet kullanılır; yalnızca ilişkisel
 * düzen değişir. Böylece sesli yönerge, görülen düzen ve doğru şık aynı kavramı ölçer.
 */
function KonumSahnesi({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'konumSahnesi' }>;
  width: number;
  height: number;
}) {
  const sahneBoyutu = Math.min(width, height);
  const hedefBoyutu = sahneBoyutu * 0.42;
  const refGenislik = width * 0.58;
  const refYukseklik = height * 0.46;

  const hedef = (cx: number, cy: number, boyut = hedefBoyutu) => (
    <g transform={`translate(${cx * width - boyut / 2} ${cy * height - boyut / 2})`}>
      <Sprite name={spec.hedef} size={boyut} />
    </g>
  );

  const referans = (cx: number, cy: number, doluluk = 0.16) => (
    <KonumReferansi
      tur={spec.referans}
      cx={cx * width}
      cy={cy * height}
      genislik={refGenislik}
      yukseklik={refYukseklik}
      doluluk={doluluk}
    />
  );

  switch (spec.iliski) {
    case 'altinda':
      return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">{referans(0.5, 0.36)}{hedef(0.5, 0.76)}</svg>;
    case 'ustunde':
      return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">{hedef(0.5, 0.24)}{referans(0.5, 0.64)}</svg>;
    case 'yaninda':
      return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">{referans(0.32, 0.54)}{hedef(0.78, 0.54)}</svg>;
    case 'disinda':
      return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">{referans(0.31, 0.54)}{hedef(0.82, 0.54)}</svg>;
    case 'icinde':
      return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">{referans(0.5, 0.55, 0.09)}{hedef(0.5, 0.56, hedefBoyutu * 0.76)}{referans(0.5, 0.55, 0)}</svg>;
    case 'arasinda':
      return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">{referans(0.24, 0.55)}{referans(0.76, 0.55)}{hedef(0.5, 0.55, hedefBoyutu * 0.76)}</svg>;
    case 'onunde':
      return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">{referans(0.5, 0.51, 0.12)}{hedef(0.5, 0.65)}{referans(0.5, 0.51, 0)}</svg>;
    case 'arkasinda':
      return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">{hedef(0.5, 0.42)}{referans(0.5, 0.55, 0.72)}</svg>;
  }
}

/** Konum sorularında ortak referans: açık kutu veya sepet. */
function KonumReferansi({
  tur,
  cx,
  cy,
  genislik,
  yukseklik,
  doluluk,
}: {
  tur: Extract<VisualSpec, { type: 'konumSahnesi' }>['referans'];
  cx: number;
  cy: number;
  genislik: number;
  yukseklik: number;
  doluluk: number;
}) {
  const x = cx - genislik / 2;
  const y = cy - yukseklik / 2;
  const kenar = '#64748b';
  const dolgu = tur === 'kutu' ? '#dbeafe' : '#fef3c7';

  if (tur === 'sepet') {
    return (
      <g>
        <path d={`M${x + genislik * 0.22} ${y + yukseklik * 0.34} Q${cx} ${y - yukseklik * 0.12} ${x + genislik * 0.78} ${y + yukseklik * 0.34}`} fill="none" stroke={kenar} strokeWidth={Math.max(3, genislik * 0.035)} strokeLinecap="round" />
        <path d={`M${x + genislik * 0.12} ${y + yukseklik * 0.3} L${x + genislik * 0.88} ${y + yukseklik * 0.3} L${x + genislik * 0.76} ${y + yukseklik * 0.9} L${x + genislik * 0.24} ${y + yukseklik * 0.9} Z`} fill={dolgu} fillOpacity={doluluk} stroke={kenar} strokeWidth={Math.max(3, genislik * 0.035)} strokeLinejoin="round" />
      </g>
    );
  }

  return (
    <g>
      <path d={`M${x + genislik * 0.12} ${y + yukseklik * 0.16} L${x + genislik * 0.12} ${y + yukseklik * 0.88} L${x + genislik * 0.88} ${y + yukseklik * 0.88} L${x + genislik * 0.88} ${y + yukseklik * 0.16}`} fill={dolgu} fillOpacity={doluluk} stroke={kenar} strokeWidth={Math.max(3, genislik * 0.035)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${x + genislik * 0.12} ${y + yukseklik * 0.16} L${x + genislik * 0.88} ${y + yukseklik * 0.16}`} fill="none" stroke={kenar} strokeWidth={Math.max(3, genislik * 0.035)} strokeLinecap="round" strokeDasharray={doluluk === 0 ? undefined : '0'} />
    </g>
  );
}

/** Sesli yönergedeki yön ve adımı aynı karta bağlayan görsel işaret. */
function YonKarti({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'yonKarti' }>;
  width: number;
  height: number;
}) {
  const okRengi = '#2563eb';
  const ok = (() => {
    const cx = width * 0.3;
    const cy = height * 0.5;
    const uz = Math.min(width, height) * 0.22;
    switch (spec.yon) {
      case 'ileri': return `M${cx} ${cy + uz} L${cx} ${cy - uz} M${cx - uz * 0.52} ${cy - uz * 0.42} L${cx} ${cy - uz} L${cx + uz * 0.52} ${cy - uz * 0.42}`;
      case 'geri': return `M${cx} ${cy - uz} L${cx} ${cy + uz} M${cx - uz * 0.52} ${cy + uz * 0.42} L${cx} ${cy + uz} L${cx + uz * 0.52} ${cy + uz * 0.42}`;
      case 'saga': return `M${cx - uz} ${cy} L${cx + uz} ${cy} M${cx + uz * 0.42} ${cy - uz * 0.52} L${cx + uz} ${cy} L${cx + uz * 0.42} ${cy + uz * 0.52}`;
      case 'sola': return `M${cx + uz} ${cy} L${cx - uz} ${cy} M${cx - uz * 0.42} ${cy - uz * 0.52} L${cx - uz} ${cy} L${cx - uz * 0.42} ${cy + uz * 0.52}`;
    }
  })();

  const sayiBoyutu = Math.min(width * 0.44, height * 0.72);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <rect x={4} y={4} width={width - 8} height={height - 8} rx={Math.min(width, height) * 0.12} fill="#eff6ff" stroke="#93c5fd" strokeWidth={3} />
      <path d={ok} fill="none" stroke={okRengi} strokeWidth={Math.max(5, sayiBoyutu * 0.12)} strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${width * 0.51} ${(height - sayiBoyutu) / 2})`}>
        <Rakam sayi={spec.adim} width={sayiBoyutu} height={sayiBoyutu} />
      </g>
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

/** İşlem hikâyesindeki başlangıç, değişim ve sonuç miktarlarını aynı bağlamda gösterir. */
function IslemSahnesi({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'islemSahnesi' }>;
  width: number;
  height: number;
}) {
  const sonuc = spec.islem === '+' ? spec.ilkAdet + spec.degisimAdedi : spec.ilkAdet - spec.degisimAdedi;
  const renk = spec.renk ? RENK_HEX[spec.renk] : '#60a5fa';
  const grup = (adet: number, x: number, y: number, soluk = false) => {
    const boyut = Math.min(width * 0.065, height * 0.22);
    const sutun = Math.max(1, Math.ceil(Math.sqrt(adet)));
    return Array.from({ length: adet }).map((_, i) => (
      <g key={`${x}-${y}-${i}`} transform={`translate(${x + (i % sutun) * boyut} ${y + Math.floor(i / sutun) * boyut})`} opacity={soluk ? 0.3 : 1}>
        <Sprite name={spec.nesne} fill={renk} size={boyut * 0.82} />
        {soluk && <path d={`M${boyut * 0.1} ${boyut * 0.1} L${boyut * 0.72} ${boyut * 0.72} M${boyut * 0.72} ${boyut * 0.1} L${boyut * 0.1} ${boyut * 0.72}`} stroke="#dc2626" strokeWidth={3} />}
      </g>
    ));
  };
  const ilkX = width * 0.04;
  const degisimX = width * 0.42;
  const sonucX = width * 0.72;
  const y = height * 0.25;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {grup(spec.ilkAdet, ilkX, y)}
      <text x={width * 0.34} y={height * 0.57} textAnchor="middle" fontSize={height * 0.26} fontWeight="700" fill="#334155">{spec.islem}</text>
      {grup(spec.degisimAdedi, degisimX, y, spec.islem === '-')}
      <text x={width * 0.65} y={height * 0.57} textAnchor="middle" fontSize={height * 0.26} fontWeight="700" fill="#334155">=</text>
      {grup(sonuc, sonucX, y)}
    </svg>
  );
}

/** Ölçme sahnesi: ölçülen çubuk ile eş birimler aynı başlangıç çizgisinden hizalanır. */
function OlcumSahnesi({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'olcumSahnesi' }>;
  width: number;
  height: number;
}) {
  const birim = Math.min(width / Math.max(spec.birimAdedi + 2, 6), height * 0.18);
  const olculenGenislik = Math.min(width * 0.78, birim * spec.birimAdedi);
  const baslangicX = (width - olculenGenislik) / 2;
  const cubukY = height * 0.28;
  const birimY = height * 0.66;
  const renk = spec.renk ? RENK_HEX[spec.renk] : 'var(--color-accent)';
  const gorunenBirimler = spec.gorunum === 'birimlerleOlcum' ? spec.birimAdedi : 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <line x1={baslangicX} y1={height * 0.16} x2={baslangicX} y2={height * 0.86} stroke="#64748b" strokeWidth={3} strokeDasharray="5 5" />
      <rect x={baslangicX} y={cubukY} width={olculenGenislik} height={height * 0.17} rx={height * 0.07} fill={renk} stroke="#334155" strokeWidth={3} />
      <g transform={`translate(${baslangicX + Math.min(olculenGenislik * 0.08, height * 0.12)} ${cubukY - height * 0.025})`}>
        <Sprite name={spec.nesne} size={Math.min(height * 0.22, olculenGenislik * 0.22)} />
      </g>
      {Array.from({ length: gorunenBirimler }).map((_, i) => {
        // Tahminde yalnız ilk gerçek birim görünür; genişliği ölçülen çubuğun
        // tamamı değil, çubuğun `birimAdedi` kadar bölünmüş tek parçasıdır.
        const birimGenisligi = olculenGenislik / spec.birimAdedi;
        const x = baslangicX + i * birimGenisligi;
        return (
          <g key={i}>
            <rect x={x + 2} y={birimY} width={birimGenisligi - 4} height={height * 0.16} rx={8} fill="#fef3c7" stroke="#d97706" strokeWidth={2} />
            <g transform={`translate(${x + birimGenisligi * 0.25} ${birimY + height * 0.025})`}>
              <Sprite name={spec.birim} size={Math.min(birimGenisligi * 0.5, height * 0.1)} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/** Karşılaştırma sahnesi: uzunlukta ortak başlangıç, kütlede görünür terazi kullanılır. */
function OlcumKarsilastirma({
  spec,
  width,
  height,
}: {
  spec: Extract<VisualSpec, { type: 'olcumKarsilastirma' }>;
  width: number;
  height: number;
}) {
  const solRenk = RENK_HEX[spec.sol.renk];
  const sagRenk = RENK_HEX[spec.sag.renk];
  const solDahaAgir = spec.sol.deger > spec.sag.deger;

  if (spec.boyut === 'uzunluk') {
    const baslangicX = width * 0.16;
    const enBuyuk = Math.max(spec.sol.deger, spec.sag.deger);
    const olcek = (width * 0.68) / enBuyuk;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
        <line x1={baslangicX} y1={height * 0.12} x2={baslangicX} y2={height * 0.88} stroke="#64748b" strokeWidth={4} strokeDasharray="6 5" />
        <rect x={baslangicX} y={height * 0.24} width={spec.sol.deger * olcek} height={height * 0.18} rx={12} fill={solRenk} stroke="#334155" strokeWidth={3} />
        <rect x={baslangicX} y={height * 0.58} width={spec.sag.deger * olcek} height={height * 0.18} rx={12} fill={sagRenk} stroke="#334155" strokeWidth={3} />
        <g transform={`translate(${baslangicX + 8} ${height * 0.13})`}><Sprite name={spec.sol.nesne} fill={solRenk} size={height * 0.18} /></g>
        <g transform={`translate(${baslangicX + 8} ${height * 0.47})`}><Sprite name={spec.sag.nesne} fill={sagRenk} size={height * 0.18} /></g>
      </svg>
    );
  }

  const ortaX = width / 2;
  const kolAcisi = solDahaAgir ? 10 : -10;
  const solY = solDahaAgir ? height * 0.68 : height * 0.46;
  const sagY = solDahaAgir ? height * 0.46 : height * 0.68;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <path d={`M${ortaX} ${height * 0.34} L${ortaX - width * 0.32} ${solY} M${ortaX} ${height * 0.34} L${ortaX + width * 0.32} ${sagY}`} stroke="#475569" strokeWidth={7} strokeLinecap="round" />
      <path d={`M${ortaX - width * 0.12} ${height * 0.84} L${ortaX} ${height * 0.34} L${ortaX + width * 0.12} ${height * 0.84} Z`} fill="#e2e8f0" stroke="#475569" strokeWidth={5} />
      <line x1={ortaX - width * 0.1} y1={height * 0.84} x2={ortaX + width * 0.1} y2={height * 0.84} stroke="#475569" strokeWidth={7} strokeLinecap="round" />
      <rect x={width * 0.08} y={solY - height * 0.08} width={width * 0.24} height={height * 0.08} rx={8} fill="#f8fafc" stroke="#64748b" strokeWidth={3} transform={`rotate(${kolAcisi} ${width * 0.2} ${solY})`} />
      <rect x={width * 0.68} y={sagY - height * 0.08} width={width * 0.24} height={height * 0.08} rx={8} fill="#f8fafc" stroke="#64748b" strokeWidth={3} transform={`rotate(${kolAcisi} ${width * 0.8} ${sagY})`} />
      <g transform={`translate(${width * 0.15} ${solY - height * 0.24})`}><Sprite name={spec.sol.nesne} fill={solRenk} size={height * 0.22} /></g>
      <g transform={`translate(${width * 0.73} ${sagY - height * 0.24})`}><Sprite name={spec.sag.nesne} fill={sagRenk} size={height * 0.22} /></g>
    </svg>
  );
}

