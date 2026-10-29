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
import { useId } from 'react';
import type { BanknotDegeri, Renk, SekilAdi, VisualSpec } from '../../exercises/types';
import { ACCENTS, FONT_YIGINI } from '../../design/tokens';
import { RAKAM_ARALIGI, RAKAM_GLIF_HARITASI } from './rakamGlifleri';
import { Sprite } from './Sprite';
import { RESMI_BANKNOT_GORSELLERI } from './banknotAssets';
import { banknotOrani } from '../../content/paraGorseli';
import {
  besliKumeYerlesimi,
  ekranKumeYerlesimi,
  KAGIT_NESNE_BOSLUK_MM,
  KAGIT_NESNE_EN_AZ_MM,
  KAGIT_NESNE_EN_BUYUK_MM,
  ikiliKumeKutulari,
  kagitOlcutu,
  kagitKumeYerlesimi,
  ortakKumeBoyutu,
  satirKumeKutulari,
  type Dikdortgen,
  type KumeTarifi,
} from './kumeYerlesimi';
import { Govde } from './Govde';
import { nesneTonlari } from './renkTonlari';
import { daire, guvenliKimlik, materyalKonturu, yuvarlakDikdortgen } from './cizimYardimcilari';

/** Renk adını hex'e çevirir — ACCENTS tek kaynak (mor=turuncu=… haritaları çift tutmaz). */
const RENK_HEX: Record<Renk, string> = Object.fromEntries(ACCENTS.map((a) => [a.id, a.hex])) as Record<Renk, string>;

/**
 * Kâğıt çizimi (KG-105): `mmBirim` = 1 görsel biriminin basılı mm karşılığı. Verilirse nesne kümeleri ve işlem
 * sahnesi ölçülen kutuya ızgarayla dizilir, nesne en çok `KAGIT_NESNE_EN_BUYUK_MM`; `kumeBoyutu` aynı maddedeki
 * kardeş kümelerin ortak nesne boyudur (görsel birimi). Verilmezse ekran çizimi (eski düzen).
 */
export interface BaskiOlcegi {
  readonly mmBirim: number;
  readonly kumeBoyutu?: number;
  /** Komşu nesne kutuları arası en az boşluk (görsel birimi; KG-106). Verilmezse 0 (KG-105 davranışı). */
  readonly bosluk?: number;
}
// Kâğıt nesne ölçüleri saf modülde (KG-106); buradan da dışa verilir.
export { KAGIT_NESNE_BOSLUK_MM, KAGIT_NESNE_EN_AZ_MM, KAGIT_NESNE_EN_BUYUK_MM };

export function Visual({
  spec,
  width,
  height,
  baski,
}: {
  spec: VisualSpec;
  width: number;
  height: number;
  baski?: BaskiOlcegi;
}) {
  switch (spec.type) {
    case 'rakam':
      return <Rakam sayi={spec.sayi} width={width} height={height} />;
    case 'sekil':
      return <Sekil spec={spec} width={width} height={height} />;
    case 'banknot':
      return <Banknot deger={spec.deger} width={width} height={height} />;
    case 'islemSahnesi':
      return <IslemSahnesi spec={spec} width={width} height={height} baski={baski} />;
    case 'islemKarti':
      return <IslemKarti spec={spec} width={width} height={height} />;
    case 'nesneKumesi':
      return <NesneKumesi spec={spec} width={width} height={height} baski={baski} />;
    case 'onlukCerceve':
      return <OnlukCerceve gruplar={spec.gruplar} width={width} height={height} />;
    case 'sayiDogrusu':
      return <SayiDogrusu spec={spec} width={width} height={height} />;
    case 'oruntu':
      return <Oruntu spec={spec} width={width} height={height} />;
    case 'yonKarti':
      return <YonKarti spec={spec} width={width} height={height} />;
    case 'sahne':
      return <Sahne spec={spec} width={width} height={height} baski={baski} />;
    case 'konumSahnesi':
      return <KonumSahnesi spec={spec} width={width} height={height} />;
    case 'olcumSahnesi':
      return <OlcumSahnesi spec={spec} width={width} height={height} />;
    case 'olcumKarsilastirma':
      return <OlcumKarsilastirma spec={spec} width={width} height={height} />;
  }
}

// --------------------------------------------------------------- basit görseller

/** Rakam/sayı kartı. Rakam okuma yazma değildir — güvenle büyük gösterilir.
 * MEB TYMM TemelYazi glifleri (KG-95), dolgulu SVG path — font yüklenmesine
 * bağlı değil; path verisinin tek kaynağı `rakamGlifleri.ts` (`RAKAM_GLIFLERI`).
 * Basamaklar glif genişliğiyle orantılı dizilir ve tek ölçekle büyütülür. */
function Rakam({ sayi, width, height }: { sayi: number; width: number; height: number }) {
  const glifler = String(sayi)
    .split('')
    .map((r) => RAKAM_GLIF_HARITASI[r])
    .filter((g) => g !== undefined);
  // viewBox birimi: rakam yüksekliği 70 (y 15–85); toplam genişlik glifler + aralıklar.
  // Rakam yüksekliği kutu yüksekliğinin en çok %63'ü (KG-42 glifleriyle aynı görsel boy).
  const toplam = glifler.reduce((t, g) => t + g.genislik, 0) + RAKAM_ARALIGI * Math.max(0, glifler.length - 1);
  const olcek = Math.min((width * 0.9) / Math.max(toplam, 1), (height * 0.63) / 70);
  let x = (width - toplam * olcek) / 2;
  const y = (height - 70 * olcek) / 2 - 15 * olcek;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {glifler.map((g, i) => {
        const gx = x - (50 - g.genislik / 2) * olcek;
        x += (g.genislik + RAKAM_ARALIGI) * olcek;
        return (
          <g key={i} transform={`translate(${gx}, ${y}) scale(${olcek})`}>
            <path d={g.path} fill="var(--color-ink)" />
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
      <rect
        x={3}
        y={3}
        width={width - 6}
        height={height - 6}
        rx={Math.min(width, height) * 0.12}
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth={3}
      />
      <g transform={`translate(${konumlar[0] * width} ${(height - rakamGenislik) / 2})`}>
        <Rakam sayi={spec.ilkSayi} width={rakamGenislik} height={rakamGenislik} />
      </g>
      <text
        x={konumlar[1] * width}
        y={merkezY + sembolBoyutu * 0.34}
        textAnchor="middle"
        fontFamily={FONT_YIGINI}
        fontWeight={700}
        fontSize={sembolBoyutu}
        fill="#1d4ed8"
      >
        {sembol}
      </text>
      <g transform={`translate(${(konumlar[1] + 0.06) * width} ${(height - rakamGenislik) / 2})`}>
        <Rakam sayi={spec.ikinciSayi} width={rakamGenislik} height={rakamGenislik} />
      </g>
      <text
        x={konumlar[2] * width}
        y={merkezY + sembolBoyutu * 0.34}
        textAnchor="middle"
        fontFamily={FONT_YIGINI}
        fontWeight={700}
        fontSize={sembolBoyutu}
        fill="#475569"
      >
        =
      </text>
      <g transform={`translate(${konumlar[3] * width} ${(height - rakamGenislik) / 2})`}>
        <Rakam sayi={spec.sonuc} width={rakamGenislik} height={rakamGenislik} />
      </g>
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
  const id = guvenliKimlik(useId());
  const t = nesneTonlari(spec.renk ? RENK_HEX[spec.renk] : 'var(--color-accent)');
  const cx = width / 2;
  const cy = height / 2;
  const r = (Math.min(width, height) / 2) * (spec.olcek ?? 0.8);
  const rot = spec.donusDerece ?? 0;
  const d = sekilYolu(spec.sekil, cx, cy, r);
  const sw = materyalKonturu(r * 2);
  // Zemin gölgesi ekranda sağ altta kalsın diye kaydırma dönüşün tersine çevrilir.
  const a = (-rot * Math.PI) / 180;
  const zx = r * 0.05;
  const zy = r * 0.08;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" data-sekil={spec.sekil}>
      <g transform={`rotate(${rot} ${cx} ${cy})`}>
        <path
          d={d}
          fill="#2B2B2B"
          opacity="0.13"
          transform={`translate(${zx * Math.cos(a) - zy * Math.sin(a)} ${zx * Math.sin(a) + zy * Math.cos(a)})`}
        />
        <Govde
          d={d}
          t={t}
          k={id}
          ofset={r * 0.13}
          donus={rot}
          sw={sw}
          isik={
            <ellipse
              cx={cx - r * 0.42}
              cy={cy - r * 0.42}
              rx={r * 0.2}
              ry={r * 0.09}
              fill={t.isik}
              transform={`rotate(${-45 - rot} ${cx - r * 0.42} ${cy - r * 0.42})`}
            />
          }
        />
      </g>
    </svg>
  );
}

/** Şekil yolu (tek `d`): gölge maskesi, kırpma ve kontur aynı yolu kullanır. Köşeler hafif yuvarlak. */
function sekilYolu(sekil: SekilAdi, cx: number, cy: number, r: number): string {
  switch (sekil) {
    case 'cember':
      return daire(cx, cy, r);
    case 'kare':
      return yuvarlakDikdortgen(cx - r, cy - r, r * 2, r * 2, r * 0.1);
    case 'dikdortgen':
      return yuvarlakDikdortgen(cx - r, cy - r * 0.62, r * 2, r * 1.24, r * 0.1);
    case 'ucgen':
      return `M${cx} ${cy - r}L${cx + r} ${cy + r}L${cx - r} ${cy + r}Z`;
  }
}

/**
 * Banknot — TCMB E9 5. tertip ön yüz örnek görseli ("ÖRNEKTİR GEÇMEZ"; KG-122). SVG bağlamı için `<image>`;
 * seçenek kartı ve kâğıt `TcmbBanknot` (HTML `<img>`) kullanır, dosya aynıdır. Kutuya ortalanır, gerçek kupür
 * oranı korunur (büyük kupür daha uzun). Erişilebilir ad seçenek düğmesinde; burada `aria-hidden`.
 */
function Banknot({ deger, width, height }: { deger: BanknotDegeri; width: number; height: number }) {
  const oran = banknotOrani(deger);
  const kartGenislik = Math.min(width * 0.96, height * 0.9 * oran);
  const kartYukseklik = kartGenislik / oran;
  const x = (width - kartGenislik) / 2;
  const y = (height - kartYukseklik) / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" data-banknot={deger}>
      <rect x={x + 2} y={y + 3} width={kartGenislik} height={kartYukseklik} rx={4} fill="#0f172a" opacity="0.16" />
      <image
        href={RESMI_BANKNOT_GORSELLERI[deger]}
        x={x}
        y={y}
        width={kartGenislik}
        height={kartYukseklik}
        preserveAspectRatio="xMidYMid meet"
      />
      <rect
        x={x}
        y={y}
        width={kartGenislik}
        height={kartYukseklik}
        rx={4}
        fill="none"
        stroke="#334155"
        strokeOpacity={0.55}
        strokeWidth={1}
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
  baski,
}: {
  spec: Extract<VisualSpec, { type: 'nesneKumesi' }>;
  width: number;
  height: number;
  baski?: BaskiOlcegi;
}) {
  const renk = spec.renk ? RENK_HEX[spec.renk] : undefined;
  // KG-105: nesne kutunun içinde kalır (kenarda kırpılma yok); kâğıtta ölçülen kutuya ızgara, ≤ 14 mm.
  const { noktalar, boyut } = baski
    ? kagitKumeYerlesimi(
        spec,
        width,
        height,
        KAGIT_NESNE_EN_BUYUK_MM / baski.mmBirim,
        baski.kumeBoyutu,
        KAGIT_NESNE_EN_AZ_MM / baski.mmBirim,
        baski.bosluk,
      )
    : ekranKumeYerlesimi(spec, width, height);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" data-nesne-boyutu={boyut}>
      {noktalar.map((p, i) => (
        <g key={i} transform={`translate(${p.x - boyut / 2} ${p.y - boyut / 2})`}>
          <Sprite name={spec.sprite} fill={renk} size={boyut} />
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
function OnlukCerceve({ gruplar, width, height }: { gruplar: readonly number[]; width: number; height: number }) {
  const id = guvenliKimlik(useId());
  const pul = nesneTonlari('var(--color-accent)');
  const cerceveSayisi = gruplar.length;
  const cerceveGenislik = width / cerceveSayisi;
  // Göz kare: 5 sütun × 2 satır, çerçevenin ortasında.
  const ic = Math.min(cerceveGenislik, height);
  const bosluk = ic * 0.06;
  const goz = Math.min((cerceveGenislik - bosluk * 2 - 8) / 5, (height - bosluk * 2 - 8) / 2);
  const sw = materyalKonturu(goz * 2.2);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {gruplar.map((dolu, ci) => {
        const gx = ci * cerceveGenislik + (cerceveGenislik - goz * 5) / 2;
        const gy = (height - goz * 2) / 2;
        const pay = goz * 0.14;
        const pullar: React.ReactNode[] = [];
        for (let i = 0; i < dolu && i < 10; i++) {
          const cx = gx + (i % 5) * goz + goz / 2;
          const cy = gy + Math.floor(i / 5) * goz + goz / 2;
          const r = goz * 0.36;
          pullar.push(
            <Govde
              key={i}
              d={daire(cx, cy, r)}
              t={pul}
              k={`${id}-${ci}-${i}`}
              ofset={r * 0.16}
              sw={sw * 0.8}
              isik={<circle cx={cx - r * 0.38} cy={cy - r * 0.38} r={r * 0.2} fill={pul.isik} />}
            />,
          );
        }
        const cizgiler: string[] = [];
        for (let s = 1; s < 5; s++) cizgiler.push(`M${gx + s * goz} ${gy}L${gx + s * goz} ${gy + goz * 2}`);
        cizgiler.push(`M${gx} ${gy + goz}L${gx + goz * 5} ${gy + goz}`);
        return (
          <g key={ci}>
            <path
              d={yuvarlakDikdortgen(gx - pay, gy - pay, goz * 5 + pay * 2, goz * 2 + pay * 2, pay * 1.6)}
              fill="#2B2B2B"
              opacity="0.1"
              transform={`translate(${pay * 0.5} ${pay * 0.8})`}
            />
            <path
              d={yuvarlakDikdortgen(gx - pay, gy - pay, goz * 5 + pay * 2, goz * 2 + pay * 2, pay * 1.6)}
              fill="#F4E3C3"
              stroke="#6E5235"
              strokeWidth={sw}
            />
            <rect x={gx} y={gy} width={goz * 5} height={goz * 2} fill="#FFFBF2" />
            <path d={cizgiler.join('')} stroke="#B89A72" strokeWidth={sw * 0.7} fill="none" />
            <rect x={gx} y={gy} width={goz * 5} height={goz * 2} fill="none" stroke="#6E5235" strokeWidth={sw} />
            {pullar}
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
              <text
                x={x}
                y={y - 22}
                textAnchor="middle"
                fontFamily={FONT_YIGINI}
                fontWeight={700}
                fontSize={fs}
                fill="var(--color-ink)"
              >
                {v}
              </text>
            )}
            {eksikte && (
              <rect
                x={x - fs * 0.6}
                y={y - fs * 1.4}
                width={fs * 1.2}
                height={fs * 1.2}
                rx={6}
                fill="#fff7ed"
                stroke="#fdba74"
                strokeWidth="3"
              />
            )}
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
              <rect
                width={vSize}
                height={vSize}
                rx={10}
                fill="#fff7ed"
                stroke="#fdba74"
                strokeWidth="4"
                strokeDasharray="8 6"
              />
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
  const id = guvenliKimlik(useId());
  const sahneBoyutu = Math.min(width, height);
  const hedefBoyutu = sahneBoyutu * 0.42;
  const refGenislik = width * 0.58;
  const refYukseklik = height * 0.46;

  const hedef = (cx: number, cy: number, boyut = hedefBoyutu) => (
    <g transform={`translate(${cx * width - boyut / 2} ${cy * height - boyut / 2})`}>
      <Sprite name={spec.hedef} size={boyut} />
    </g>
  );

  // Kutu/sepet önden ve hafif yukarıdan: arka duvar + alçak ön duvar. `katman` = 'arka' yalnız arka
  // duvarı, 'on' yalnız ön duvarı çizer — "içinde"de hedef ikisinin arasına girer (altı ön duvarla örtülür).
  // Ön duvarın üst kenarı referans yüksekliğinin yarısında (kutu 0,50, sepet ağzı 0,46): hedefin üst yarısı görünür.
  const referans = (cx: number, cy: number, katman: 'tam' | 'arka' | 'on' = 'tam', ek = '', olcek = 1) => (
    <KonumReferansi
      tur={spec.referans}
      cx={cx * width}
      cy={cy * height}
      genislik={refGenislik * olcek}
      yukseklik={refYukseklik * olcek}
      katman={katman}
      k={`${id}${ek}`}
    />
  );

  const sahne = (icerik: React.ReactNode) => (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" data-konum={spec.iliski}>
      {icerik}
    </svg>
  );

  switch (spec.iliski) {
    case 'altinda':
      return sahne(
        <>
          {referans(0.5, 0.36)}
          {hedef(0.5, 0.76)}
        </>,
      );
    case 'ustunde':
      return sahne(
        <>
          {referans(0.5, 0.64)}
          {hedef(0.5, 0.24)}
        </>,
      );
    case 'yaninda':
      return sahne(
        <>
          {referans(0.32, 0.54)}
          {hedef(0.78, 0.54)}
        </>,
      );
    case 'disinda':
      return sahne(
        <>
          {referans(0.31, 0.54)}
          {hedef(0.82, 0.54)}
        </>,
      );
    case 'icinde':
      return sahne(
        <>
          {referans(0.5, 0.55, 'arka')}
          {hedef(0.5, 0.43, hedefBoyutu * 0.76)}
          {referans(0.5, 0.55, 'on', 'o')}
        </>,
      );
    case 'arasinda':
      return sahne(
        <>
          {/* İki referans üst üste binmesin: arasında sahnesinde %74 boy. */}
          {referans(0.22, 0.55, 'tam', '', 0.74)}
          {referans(0.78, 0.55, 'tam', 'b', 0.74)}
          {hedef(0.5, 0.55, hedefBoyutu * 0.76)}
        </>,
      );
    case 'onunde':
      return sahne(
        <>
          {referans(0.5, 0.48)}
          {hedef(0.5, 0.67)}
        </>,
      );
    case 'arkasinda':
      return sahne(
        <>
          {hedef(0.5, 0.4)}
          {referans(0.5, 0.58)}
        </>,
      );
  }
}

/** Konum renkleri: karton kutu ve hasır sepet — hedef nesnelerin renklerinden ayrışan sıcak nötrler. */
const KUTU_RENGI = '#DDB27A';
const SEPET_RENGI = '#B97A3C';

/** Konum sorularında ortak referans: açık karton kutu veya hasır sepet (önden, hafif yukarıdan). */
function KonumReferansi({
  tur,
  cx,
  cy,
  genislik,
  yukseklik,
  katman,
  k,
}: {
  tur: Extract<VisualSpec, { type: 'konumSahnesi' }>['referans'];
  cx: number;
  cy: number;
  genislik: number;
  yukseklik: number;
  katman: 'tam' | 'arka' | 'on';
  k: string;
}) {
  const x = cx - genislik / 2;
  const y = cy - yukseklik / 2;
  const X = (f: number) => x + genislik * f;
  const Y = (f: number) => y + yukseklik * f;
  const sw = materyalKonturu(Math.min(genislik, yukseklik) * 1.4);
  const t = nesneTonlari(tur === 'kutu' ? KUTU_RENGI : SEPET_RENGI);
  const ofset = yukseklik * 0.06;
  const arka = katman !== 'on';
  const on = katman !== 'arka';
  const zemin = (
    <ellipse cx={cx} cy={Y(0.92)} rx={genislik * 0.4} ry={yukseklik * 0.05} fill="#2B2B2B" opacity="0.14" />
  );

  if (tur === 'sepet') {
    const agiz = `M${X(0.1)} ${Y(0.46)}L${X(0.9)} ${Y(0.46)}`;
    const onYuz = `M${X(0.1)} ${Y(0.48)}L${X(0.9)} ${Y(0.48)}L${X(0.78)} ${Y(0.9)}L${X(0.22)} ${Y(0.9)}Z`;
    const orgu: string[] = [];
    for (let i = 1; i < 4; i++) {
      const yy = 0.48 + i * 0.105;
      orgu.push(`M${X(0.05)} ${Y(yy)}L${X(0.95)} ${Y(yy)}`);
    }
    for (let i = 1; i < 7; i++) {
      const ust = 0.1 + i * (0.8 / 7);
      const alt = 0.22 + i * (0.56 / 7);
      orgu.push(`M${X(ust)} ${Y(0.48)}L${X(alt)} ${Y(0.9)}`);
    }
    return (
      <g data-referans="sepet">
        {arka && (
          <g>
            {zemin}
            <path
              d={`M${X(0.24)} ${Y(0.47)}Q${cx} ${Y(-0.12)} ${X(0.76)} ${Y(0.47)}`}
              fill="none"
              stroke={t.kontur}
              strokeWidth={sw * 3}
              strokeLinecap="round"
            />
            <path
              d={`M${X(0.24)} ${Y(0.47)}Q${cx} ${Y(-0.12)} ${X(0.76)} ${Y(0.47)}`}
              fill="none"
              stroke={t.temel}
              strokeWidth={sw * 1.6}
              strokeLinecap="round"
            />
            <path
              d={`M${X(0.1)} ${Y(0.46)}Q${cx} ${Y(0.3)} ${X(0.9)} ${Y(0.46)}Z`}
              fill={t.golge}
              stroke={t.kontur}
              strokeWidth={sw}
              strokeLinejoin="round"
            />
          </g>
        )}
        {on && (
          <g>
            <Govde
              d={onYuz}
              t={t}
              k={`${k}s`}
              ofset={ofset}
              sw={sw}
              ic={<path d={orgu.join('')} stroke={t.golge} strokeWidth={sw * 0.8} fill="none" />}
            />
            <path d={agiz} stroke={t.kontur} strokeWidth={sw * 3.2} strokeLinecap="round" />
            <path d={agiz} stroke={t.isik} strokeWidth={sw * 1.6} strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  }

  const arkaDuvar = `M${X(0.16)} ${Y(0.2)}L${X(0.84)} ${Y(0.2)}L${X(0.84)} ${Y(0.88)}L${X(0.16)} ${Y(0.88)}Z`;
  const onDuvar = `M${X(0.12)} ${Y(0.5)}L${X(0.88)} ${Y(0.5)}L${X(0.88)} ${Y(0.9)}L${X(0.12)} ${Y(0.9)}Z`;
  const kapakSol = `M${X(0.16)} ${Y(0.2)}L${X(0.03)} ${Y(0.06)}L${X(0.08)} ${Y(0.02)}L${X(0.3)} ${Y(0.2)}Z`;
  const kapakSag = `M${X(0.84)} ${Y(0.2)}L${X(0.97)} ${Y(0.06)}L${X(0.92)} ${Y(0.02)}L${X(0.7)} ${Y(0.2)}Z`;
  return (
    <g data-referans="kutu">
      {arka && (
        <g>
          {zemin}
          <path d={kapakSol} fill={t.isik} stroke={t.kontur} strokeWidth={sw} strokeLinejoin="round" />
          <path d={kapakSag} fill={t.temel} stroke={t.kontur} strokeWidth={sw} strokeLinejoin="round" />
          <path d={arkaDuvar} fill={t.golge} stroke={t.kontur} strokeWidth={sw} strokeLinejoin="round" />
          <path
            d={`M${X(0.16)} ${Y(0.44)}L${X(0.84)} ${Y(0.44)}`}
            stroke={t.kontur}
            strokeWidth={sw * 0.6}
            opacity="0.4"
          />
        </g>
      )}
      {on && (
        <Govde
          d={onDuvar}
          t={t}
          k={`${k}k`}
          ofset={ofset}
          sw={sw}
          ic={
            <g>
              <rect
                x={X(0.44)}
                y={Y(0.44)}
                width={genislik * 0.12}
                height={yukseklik * 0.46}
                fill={t.isik}
                opacity="0.7"
              />
              <path d={`M${X(0.12)} ${Y(0.56)}L${X(0.88)} ${Y(0.56)}`} stroke={t.isik} strokeWidth={sw} />
            </g>
          }
        />
      )}
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
      case 'ileri':
        return `M${cx} ${cy + uz} L${cx} ${cy - uz} M${cx - uz * 0.52} ${cy - uz * 0.42} L${cx} ${cy - uz} L${cx + uz * 0.52} ${cy - uz * 0.42}`;
      case 'geri':
        return `M${cx} ${cy - uz} L${cx} ${cy + uz} M${cx - uz * 0.52} ${cy + uz * 0.42} L${cx} ${cy + uz} L${cx + uz * 0.52} ${cy + uz * 0.42}`;
      case 'saga':
        return `M${cx - uz} ${cy} L${cx + uz} ${cy} M${cx + uz * 0.42} ${cy - uz * 0.52} L${cx + uz} ${cy} L${cx + uz * 0.42} ${cy + uz * 0.52}`;
      case 'sola':
        return `M${cx + uz} ${cy} L${cx - uz} ${cy} M${cx - uz * 0.42} ${cy - uz * 0.52} L${cx - uz} ${cy} L${cx - uz * 0.42} ${cy + uz * 0.52}`;
    }
  })();

  const sayiBoyutu = Math.min(width * 0.44, height * 0.72);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <rect
        x={4}
        y={4}
        width={width - 8}
        height={height - 8}
        rx={Math.min(width, height) * 0.12}
        fill="#eff6ff"
        stroke="#93c5fd"
        strokeWidth={3}
      />
      <path
        d={ok}
        fill="none"
        stroke={okRengi}
        strokeWidth={Math.max(5, sayiBoyutu * 0.12)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  baski,
}: {
  spec: Extract<VisualSpec, { type: 'sahne' }>;
  width: number;
  height: number;
  baski?: BaskiOlcegi;
}) {
  if (baski) {
    const kagit = KagitKumeSahnesi({ spec, width, height, baski });
    if (kagit) return kagit;
  }
  const pw = width * 0.46;
  const ph = height * 0.8;
  // Kâğıtta (KG-105) küme parçalarının kutusu komşu küme parçasına taşmaz: örtüşen iki kutu, ayrımı oransal olarak
  // büyük olan eksende merkezler arası uzaklığa daraltılır (nesne hücrenin ≤ %88'i, arada boşluk kalır; çetele/grafik
  // satırındaki tek tek nesneler büyüyünce üst üste binmesin). Şekil parçaları (GEO sahneleri) bilerek örtüşür.
  const kutular = spec.parcalar.map((p, i) => {
    let kw = pw;
    let kh = ph;
    if (baski && p.gorsel.type === 'nesneKumesi') {
      spec.parcalar.forEach((q, j) => {
        if (i === j || q.gorsel.type !== 'nesneKumesi') return;
        const dx = Math.abs(p.konum.x - q.konum.x) * width;
        const dy = Math.abs(p.konum.y - q.konum.y) * height;
        if (dx >= pw || dy >= ph || dx + dy === 0) return;
        if (dx / pw >= dy / ph) kw = Math.min(kw, dx);
        else kh = Math.min(kh, dy);
      });
    }
    return { w: kw, h: kh };
  });
  // Kâğıtta parçalardaki kümeler aynı nesne boyunda (KG-105): miktarla ilişkili boyut ipucu doğmaz.
  let parcaBaskisi = baski;
  if (baski) {
    const kumeler = spec.parcalar.flatMap((p, i) =>
      p.gorsel.type === 'nesneKumesi' ? [{ spec: p.gorsel as KumeTarifi, w: kutular[i].w, h: kutular[i].h }] : [],
    );
    const ortak = ortakKumeBoyutu(
      kumeler,
      KAGIT_NESNE_EN_BUYUK_MM / baski.mmBirim,
      KAGIT_NESNE_EN_AZ_MM / baski.mmBirim,
    );
    const boy = Math.min(ortak ?? Infinity, baski.kumeBoyutu ?? Infinity);
    parcaBaskisi = Number.isFinite(boy) ? { ...baski, kumeBoyutu: boy } : baski;
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {spec.parcalar.map((p, i) => {
        const { w: kw, h: kh } = kutular[i];
        const px = p.konum.x * width - kw / 2;
        const py = p.konum.y * height - kh / 2;
        return (
          <g key={i} transform={`translate(${px} ${py})`}>
            <Visual spec={p.gorsel} width={kw} height={kh} baski={parcaBaskisi} />
          </g>
        );
      })}
    </svg>
  );
}

type KumeSpec = Extract<VisualSpec, { type: 'nesneKumesi' }>;

/**
 * Kâğıtta yalnız nesne kümelerinden oluşan, tek satıra dizilmiş bileşik sahne (KG-106). Sahnenin tüm yüksekliği
 * kullanılır (eskiden parça kutusu yüksekliğin %80'i, genişliği komşuya uzaklık kadardı):
 *  · çetele (aynı nesneden ≥ 3 tekli parça): tek küme gibi beşli sıralar (sayma sırası satır satır);
 *  · iki küme (toplama, "eşit mi"): iki eşit kutu, yan yana ya da alt alta (`ikiliKumeKutulari`);
 *  · üç ve daha çok küme (veri grafiği): genişlik ihtiyaca göre bölüştürülür (`satirKumeKutulari`).
 * Nesneler hep aynı boyda (miktarla ilişkili boy ipucu yok). Başka sahneler için null (KG-105 yolu).
 */
function KagitKumeSahnesi({
  spec,
  width,
  height,
  baski,
}: {
  spec: Extract<VisualSpec, { type: 'sahne' }>;
  width: number;
  height: number;
  baski: BaskiOlcegi;
}) {
  const p = spec.parcalar;
  if (p.length < 2 || !p.every((q) => q.gorsel.type === 'nesneKumesi')) return null;
  const ys = p.map((q) => q.konum.y);
  if (Math.max(...ys) - Math.min(...ys) > 0.05) return null;
  const kumeler = p.map((q) => q.gorsel as KumeSpec);
  const o = kagitOlcutu(baski.mmBirim);
  const ilk = kumeler[0];
  if (p.length >= 3 && kumeler.every((k) => k.adet === 1 && k.sprite === ilk.sprite && k.renk === ilk.renk)) {
    const { noktalar, boyut: b } = besliKumeYerlesimi(p.length, width, height, o);
    const boyut = Math.min(b, baski.kumeBoyutu ?? Infinity);
    // Nesneler soldan sağa parça sırasıyla (konum x'e göre).
    const sira = p.map((q, i) => ({ x: q.konum.x, i })).sort((a, c) => a.x - c.x);
    const renk = ilk.renk ? RENK_HEX[ilk.renk] : undefined;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} data-nesne-boyutu={boyut}>
          {sira.map(({ i }, k) => (
            <g key={i} transform={`translate(${noktalar[k].x - boyut / 2} ${noktalar[k].y - boyut / 2})`}>
              <Sprite name={kumeler[i].sprite} fill={renk} size={boyut} />
            </g>
          ))}
        </svg>
      </svg>
    );
  }
  const sira = p.map((q, i) => ({ x: q.konum.x, i })).sort((a, c) => a.x - c.x);
  // Kümeler arası, küme içindeki boşluktan belirgin büyük (gruplar ayrı görünsün).
  const ara = Math.max(o.bosluk * 2, (p.length >= 3 ? 5 : 3.5) / baski.mmBirim);
  let kutular: readonly Dikdortgen[];
  let boyut: number;
  if (p.length === 2) {
    const r = ikiliKumeKutulari(kumeler[sira[0].i], kumeler[sira[1].i], width, height, ara, o);
    kutular = r.kutular;
    boyut = r.boyut;
  } else {
    const r = satirKumeKutulari(
      sira.map(({ i }) => ({ tur: 'kume' as const, spec: kumeler[i] })),
      width,
      height,
      ara,
      o,
    );
    kutular = r.kutular;
    boyut = r.boyut;
  }
  const parcaBaskisi: BaskiOlcegi = {
    ...baski,
    kumeBoyutu: Math.min(boyut, baski.kumeBoyutu ?? Infinity),
    bosluk: o.bosluk,
  };
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {sira.map(({ i }, k) => {
        const r = kutular[k];
        return (
          <g key={i} transform={`translate(${r.x} ${r.y})`}>
            <Visual spec={kumeler[i]} width={r.w} height={r.h} baski={parcaBaskisi} />
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
  baski,
}: {
  spec: Extract<VisualSpec, { type: 'islemSahnesi' }>;
  width: number;
  height: number;
  baski?: BaskiOlcegi;
}) {
  const sonuc = spec.islem === '+' ? spec.ilkAdet + spec.degisimAdedi : spec.ilkAdet - spec.degisimAdedi;
  const renk = spec.renk ? RENK_HEX[spec.renk] : '#60a5fa';
  if (baski)
    return <IslemSahnesiKagit spec={spec} width={width} height={height} baski={baski} sonuc={sonuc} renk={renk} />;
  const grup = (adet: number, x: number, y: number, soluk = false) => {
    const boyut = Math.min(width * 0.065, height * 0.22);
    const sutun = Math.max(1, Math.ceil(Math.sqrt(adet)));
    return Array.from({ length: adet }).map((_, i) => (
      <g
        key={`${x}-${y}-${i}`}
        transform={`translate(${x + (i % sutun) * boyut} ${y + Math.floor(i / sutun) * boyut})`}
        opacity={soluk ? 0.3 : 1}
      >
        <Sprite name={spec.nesne} fill={renk} size={boyut * 0.82} />
        {soluk && (
          <path
            d={`M${boyut * 0.1} ${boyut * 0.1} L${boyut * 0.72} ${boyut * 0.72} M${boyut * 0.72} ${boyut * 0.1} L${boyut * 0.1} ${boyut * 0.72}`}
            stroke="#6B7280"
            strokeWidth={3}
          />
        )}
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
      <text
        x={width * 0.34}
        y={height * 0.57}
        textAnchor="middle"
        fontFamily={FONT_YIGINI}
        fontSize={height * 0.26}
        fontWeight="700"
        fill="#334155"
      >
        {spec.islem}
      </text>
      {grup(spec.degisimAdedi, degisimX, y, spec.islem === '-')}
      <text
        x={width * 0.65}
        y={height * 0.57}
        textAnchor="middle"
        fontFamily={FONT_YIGINI}
        fontSize={height * 0.26}
        fontWeight="700"
        fill="#334155"
      >
        =
      </text>
      {grup(sonuc, sonucX, y)}
    </svg>
  );
}

/**
 * Kâğıtta işlem sahnesi (KG-105): üç küme (başlangıç, değişim, sonuç) kendi kutularına ızgarayla dizilir, üçü de
 * aynı nesne boyunda (≤ 14 mm); işaretler kutuların arasında. Ekrandaki 3,5 mm'lik sabit ızgaranın yerine.
 */
function IslemSahnesiKagit({
  spec,
  width,
  height,
  baski,
  sonuc,
  renk,
}: {
  spec: Extract<VisualSpec, { type: 'islemSahnesi' }>;
  width: number;
  height: number;
  baski: BaskiOlcegi;
  sonuc: number;
  renk: string;
}) {
  // KG-106: genişlik kümelere ihtiyaçlarına göre bölüştürülür (eskiden sabit %29/%24/%29 dilimler), tüm yükseklik.
  const o = kagitOlcutu(baski.mmBirim);
  const yazi = Math.min(height * 0.3, 70 / (baski.mmBirim * 10));
  const isaretW = yazi * 0.7;
  const ara = o.bosluk;
  const y0 = 0;
  const kh = height;
  const adetler = [spec.ilkAdet, spec.degisimAdedi, Math.max(0, sonuc)];
  const satir = satirKumeKutulari(
    [
      { tur: 'kume', spec: { adet: adetler[0], layout: 'sira' } },
      { tur: 'sabit', w: isaretW },
      { tur: 'kume', spec: { adet: adetler[1], layout: 'sira' } },
      { tur: 'sabit', w: isaretW },
      { tur: 'kume', spec: { adet: adetler[2], layout: 'sira' } },
    ],
    width,
    kh,
    ara,
    o,
  );
  const k = satir.kutular;
  const kutular = [
    { x0: k[0].x / width, x1: (k[0].x + k[0].w) / width, adet: adetler[0], soluk: false },
    { x0: k[2].x / width, x1: (k[2].x + k[2].w) / width, adet: adetler[1], soluk: spec.islem === '-' },
    { x0: k[4].x / width, x1: (k[4].x + k[4].w) / width, adet: adetler[2], soluk: false },
  ];
  const yerler = kutular.map((q) =>
    kagitKumeYerlesimi(
      { adet: q.adet, layout: 'sira' },
      (q.x1 - q.x0) * width,
      kh,
      o.enBuyuk,
      undefined,
      o.enAz,
      o.bosluk,
    ),
  );
  const dolu = yerler.filter((y) => y.noktalar.length > 0);
  const boyut = Math.min(...dolu.map((y) => y.boyut), satir.boyut || Infinity, baski.kumeBoyutu ?? Infinity);
  const isaret = (x: number, metin: string) => (
    <text
      x={x}
      y={height * 0.5}
      dominantBaseline="central"
      textAnchor="middle"
      fontFamily={FONT_YIGINI}
      fontSize={yazi}
      fontWeight="700"
      fill="#334155"
    >
      {metin}
    </text>
  );
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" data-nesne-boyutu={boyut}>
      {kutular.map((k, ki) =>
        yerler[ki].noktalar.map((p, i) => (
          <g
            key={`${ki}-${i}`}
            transform={`translate(${k.x0 * width + p.x - boyut / 2} ${y0 + p.y - boyut / 2})`}
            opacity={k.soluk ? 0.3 : 1}
          >
            <Sprite name={spec.nesne} fill={renk} size={boyut} />
            {k.soluk && (
              <path
                d={`M${boyut * 0.12} ${boyut * 0.12} L${boyut * 0.88} ${boyut * 0.88} M${boyut * 0.88} ${boyut * 0.12} L${boyut * 0.12} ${boyut * 0.88}`}
                stroke="#6B7280"
                strokeWidth={boyut * 0.06}
              />
            )}
          </g>
        )),
      )}
      {isaret(k[1].x + k[1].w / 2, spec.islem)}
      {isaret(k[3].x + k[3].w / 2, '=')}
    </svg>
  );
}

/** Eş birim blokları: açık bal rengi tahta blok. */
const BIRIM_TONU = nesneTonlari('#F3CF7A');

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
  const id = guvenliKimlik(useId());

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <line
        x1={baslangicX}
        y1={height * 0.16}
        x2={baslangicX}
        y2={height * 0.86}
        stroke="#64748b"
        strokeWidth={3}
        strokeDasharray="5 5"
      />
      <Govde
        d={yuvarlakDikdortgen(baslangicX, cubukY, olculenGenislik, height * 0.17, height * 0.07)}
        t={nesneTonlari(renk)}
        k={`${id}c`}
        ofset={height * 0.025}
        sw={materyalKonturu(height * 0.3)}
        isik={
          <path
            d={`M${baslangicX + height * 0.06} ${cubukY + height * 0.045}L${baslangicX + olculenGenislik - height * 0.06} ${cubukY + height * 0.045}`}
            stroke={nesneTonlari(renk).isik}
            strokeWidth={height * 0.025}
            strokeLinecap="round"
          />
        }
      />
      <g
        transform={`translate(${baslangicX + Math.min(olculenGenislik * 0.08, height * 0.12)} ${cubukY - height * 0.025})`}
      >
        <Sprite name={spec.nesne} size={Math.min(height * 0.22, olculenGenislik * 0.22)} />
      </g>
      {Array.from({ length: gorunenBirimler }).map((_, i) => {
        // Tahminde yalnız ilk gerçek birim görünür; genişliği ölçülen çubuğun
        // tamamı değil, çubuğun `birimAdedi` kadar bölünmüş tek parçasıdır.
        const birimGenisligi = olculenGenislik / spec.birimAdedi;
        const x = baslangicX + i * birimGenisligi;
        return (
          <g key={i}>
            <Govde
              d={yuvarlakDikdortgen(
                x + 2,
                birimY,
                birimGenisligi - 4,
                height * 0.16,
                Math.min(8, birimGenisligi * 0.2),
              )}
              t={BIRIM_TONU}
              k={`${id}b${i}`}
              ofset={height * 0.018}
              sw={materyalKonturu(height * 0.22)}
            />
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
  const id = guvenliKimlik(useId());

  if (spec.boyut === 'uzunluk') {
    const baslangicX = width * 0.16;
    const enBuyuk = Math.max(spec.sol.deger, spec.sag.deger);
    const olcek = (width * 0.68) / enBuyuk;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
        <line
          x1={baslangicX}
          y1={height * 0.12}
          x2={baslangicX}
          y2={height * 0.88}
          stroke="#64748b"
          strokeWidth={4}
          strokeDasharray="6 5"
        />
        <Govde
          d={yuvarlakDikdortgen(
            baslangicX,
            height * 0.24,
            spec.sol.deger * olcek,
            height * 0.18,
            Math.min(12, height * 0.06),
          )}
          t={nesneTonlari(solRenk)}
          k={`${id}sol`}
          ofset={height * 0.03}
          sw={materyalKonturu(height * 0.3)}
        />
        <Govde
          d={yuvarlakDikdortgen(
            baslangicX,
            height * 0.58,
            spec.sag.deger * olcek,
            height * 0.18,
            Math.min(12, height * 0.06),
          )}
          t={nesneTonlari(sagRenk)}
          k={`${id}sag`}
          ofset={height * 0.03}
          sw={materyalKonturu(height * 0.3)}
        />
        <g transform={`translate(${baslangicX + 8} ${height * 0.13})`}>
          <Sprite name={spec.sol.nesne} fill={solRenk} size={height * 0.18} />
        </g>
        <g transform={`translate(${baslangicX + 8} ${height * 0.47})`}>
          <Sprite name={spec.sag.nesne} fill={sagRenk} size={height * 0.18} />
        </g>
      </svg>
    );
  }

  const ortaX = width / 2;
  const kolAcisi = solDahaAgir ? 10 : -10;
  const solY = solDahaAgir ? height * 0.68 : height * 0.46;
  const sagY = solDahaAgir ? height * 0.46 : height * 0.68;
  const sw = materyalKonturu(Math.min(width, height) * 0.5);
  const metal = nesneTonlari('#8E9AAB');
  const ahsap = nesneTonlari('#C98F55');
  const kefe = (merkezX: number, kefeY: number, ek: string) => {
    const g = width * 0.26;
    const y2 = height * 0.07;
    const d = `M${merkezX - g / 2} ${kefeY - y2}L${merkezX + g / 2} ${kefeY - y2}Q${merkezX + g * 0.42} ${kefeY + y2 * 0.6} ${merkezX} ${kefeY + y2 * 0.6}Q${merkezX - g * 0.42} ${kefeY + y2 * 0.6} ${merkezX - g / 2} ${kefeY - y2}Z`;
    return (
      <g transform={`rotate(${kolAcisi} ${merkezX} ${kefeY})`}>
        <Govde d={d} t={metal} k={`${id}${ek}`} ofset={y2 * 0.3} sw={sw} />
      </g>
    );
  };
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      data-terazi={solDahaAgir ? 'sol' : 'sag'}
    >
      <ellipse cx={ortaX} cy={height * 0.86} rx={width * 0.16} ry={height * 0.025} fill="#2B2B2B" opacity="0.14" />
      <Govde
        d={`M${ortaX - width * 0.12} ${height * 0.84}L${ortaX - width * 0.025} ${height * 0.36}L${ortaX + width * 0.025} ${height * 0.36}L${ortaX + width * 0.12} ${height * 0.84}Z`}
        t={ahsap}
        k={`${id}a`}
        ofset={height * 0.02}
        sw={sw}
      />
      <path
        d={`M${ortaX} ${height * 0.34} L${ortaX - width * 0.32} ${solY} M${ortaX} ${height * 0.34} L${ortaX + width * 0.32} ${sagY}`}
        stroke={metal.kontur}
        strokeWidth={Math.max(7, sw * 3.2)}
        strokeLinecap="round"
      />
      <path
        d={`M${ortaX} ${height * 0.34} L${ortaX - width * 0.32} ${solY} M${ortaX} ${height * 0.34} L${ortaX + width * 0.32} ${sagY}`}
        stroke={metal.temel}
        strokeWidth={Math.max(3.5, sw * 1.6)}
        strokeLinecap="round"
      />
      <path
        d={`M${ortaX - width * 0.1} ${height * 0.84} L${ortaX + width * 0.1} ${height * 0.84}`}
        stroke={ahsap.kontur}
        strokeWidth={Math.max(7, sw * 3)}
        strokeLinecap="round"
      />
      <circle
        cx={ortaX}
        cy={height * 0.34}
        r={Math.max(5, sw * 2.4)}
        fill={metal.isik}
        stroke={metal.kontur}
        strokeWidth={sw}
      />
      {kefe(width * 0.2, solY, 'l')}
      {kefe(width * 0.8, sagY, 'r')}
      <g transform={`translate(${width * 0.15} ${solY - height * 0.24})`}>
        <Sprite name={spec.sol.nesne} fill={solRenk} size={height * 0.22} />
      </g>
      <g transform={`translate(${width * 0.73} ${sagY - height * 0.24})`}>
        <Sprite name={spec.sag.nesne} fill={sagRenk} size={height * 0.22} />
      </g>
    </svg>
  );
}
