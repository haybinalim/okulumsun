/**
 * TEMA SAHNELERİ — programatik SVG arka planlar (plan v2 Adım 54, alt görev 3; PLAN §8).
 *
 * Katman: K1/K3 — kodla çizilir; üçüncü taraf varlık, emoji ve yapay zekâ görseli YOK (lisans envanterine girmez).
 *
 * KURALLAR
 *  · **Dokunulmaz arka plan:** `aria-hidden`, `pointer-events: none`, odaklanamaz; içinde düğme/bağlantı/metin yok.
 *    Etkileşim alt %65 kuralı (PLAN §3.2) değişmez — sahne hedef taşımaz, yalnız arkada durur.
 *  · **Alıştırma ekranının arkasında kullanılmaz** (geri bildirim çerçeveleri ve sayılacak nesneler sahneyle yarışmasın);
 *    yeri tema girişi ve oturum sonu hikâye anıdır (Adım 45/54; bağlama ses kaynağı gelince — KG-91).
 *  · **Renk anlam taşımaz:** sahnede hiçbir bilgi renkle kodlanmaz; nesneler biçimle ayrışır. Palet açık pastel —
 *    her renk metin rengine (`COLOR.ink`) ≥ 7:1 (AAA) kontrastta, kırmızı ton yok; renk körlüğü dostu palet açıkken de
 *    aynı sahne kullanılır (testle: `tests/unit/maskotHikayesi.spec.ts`).
 *  · Hareket yok (sabit çizim); `prefers-reduced-motion` gerektirmez.
 *
 * Görüş kutusu 1600 × 900; `xMidYMid slice` ile her en-boy oranında ekranı doldurur. Zemin alt %35'te; ortadaki geniş
 * alan boş bırakılır (maskot ve hikâye görseli oraya gelir).
 */
import { memo, type CSSProperties, type ReactNode } from 'react';
import type { SahneAdi } from '../../content/temaDunyalari';
import { SAHNE_PALETI } from '../../design/sahnePaleti';

const P = SAHNE_PALETI;
const W = 1600;
const H = 900;
/** Zemin çizgisi: alt %35 (900 × 0,65). */
const ZEMIN_Y = 585;

function Gok({ renk = P.gok }: { renk?: string }) {
  return <rect x={0} y={0} width={W} height={ZEMIN_Y} fill={renk} />;
}

function Bulut({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={P.bulut}>
      <ellipse cx={0} cy={0} rx={70} ry={34} />
      <ellipse cx={55} cy={-18} rx={50} ry={34} />
      <ellipse cx={-50} cy={-8} rx={42} ry={28} />
    </g>
  );
}

function Gunes({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={62} fill={P.gunes} />;
}

function Zemin({ renk = P.cimen }: { renk?: string }) {
  return <rect x={0} y={ZEMIN_Y} width={W} height={H - ZEMIN_Y} fill={renk} />;
}

function Agac({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${ZEMIN_Y}) scale(${s})`}>
      <rect x={-14} y={-150} width={28} height={150} rx={8} fill={P.govde} />
      <circle cx={0} cy={-190} r={80} fill={P.agac} />
      <circle cx={-55} cy={-150} r={50} fill={P.agac} />
      <circle cx={55} cy={-150} r={50} fill={P.agac} />
    </g>
  );
}

function Park() {
  return (
    <>
      <Gok />
      <Gunes x={1400} y={130} />
      <Bulut x={300} y={130} />
      <Bulut x={980} y={90} s={0.8} />
      <Zemin />
      {/* Yol: ortadan aşağı, yön sözcükleri (sağ/sol) için */}
      <path d={`M 700 ${ZEMIN_Y} L 900 ${ZEMIN_Y} L 1100 ${H} L 500 ${H} Z`} fill={P.yol} />
      <Agac x={170} />
      <Agac x={1430} s={1.1} />
      {/* Kaydırak (solda) ve bank (sağda) — dokunulmaz dekor */}
      <g fill={P.tente}>
        <rect x={330} y={ZEMIN_Y - 170} width={18} height={170} />
        <rect x={420} y={ZEMIN_Y - 170} width={18} height={170} />
        <rect x={322} y={ZEMIN_Y - 182} width={124} height={22} rx={8} />
        <path d={`M 438 ${ZEMIN_Y - 165} L 590 ${ZEMIN_Y - 10} L 570 ${ZEMIN_Y} L 430 ${ZEMIN_Y - 140} Z`} />
      </g>
      <g fill={P.tahta}>
        <rect x={1150} y={ZEMIN_Y - 70} width={180} height={18} rx={6} />
        <rect x={1150} y={ZEMIN_Y - 110} width={180} height={14} rx={6} />
        <rect x={1162} y={ZEMIN_Y - 52} width={14} height={52} />
        <rect x={1304} y={ZEMIN_Y - 52} width={14} height={52} />
      </g>
    </>
  );
}

function Cicek({ x, y, renk }: { x: number; y: number; renk: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-3} y={0} width={6} height={44} fill={P.cimenKoyu} />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle
          key={a}
          cx={Math.cos((a * Math.PI) / 180) * 14}
          cy={Math.sin((a * Math.PI) / 180) * 14}
          r={11}
          fill={renk}
        />
      ))}
      <circle cx={0} cy={0} r={8} fill={P.gunes} />
    </g>
  );
}

function Bahce() {
  const cicekler: ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const x = 120 + i * 170;
    cicekler.push(
      <Cicek
        key={i}
        x={x}
        y={ZEMIN_Y + 150 + (i % 2) * 60}
        renk={i % 3 === 0 ? P.lila : i % 3 === 1 ? P.seftali : P.krem}
      />,
    );
  }
  return (
    <>
      <Gok />
      <Gunes x={1380} y={140} />
      <Bulut x={420} y={120} s={0.9} />
      <Zemin />
      {/* Çit */}
      <g fill={P.krem} stroke={P.cizgi} strokeWidth={3}>
        <rect x={0} y={ZEMIN_Y - 46} width={W} height={14} />
        {Array.from({ length: 21 }, (_, i) => (
          <path
            key={i}
            d={`M ${i * 80 + 10} ${ZEMIN_Y} V ${ZEMIN_Y - 80} L ${i * 80 + 30} ${ZEMIN_Y - 100} L ${i * 80 + 50} ${ZEMIN_Y - 80} V ${ZEMIN_Y} Z`}
          />
        ))}
      </g>
      <Agac x={240} s={1.15} />
      {/* Sebze sırası */}
      {[0, 1].map((r) => (
        <rect key={r} x={180} y={ZEMIN_Y + 40 + r * 60} width={1240} height={30} rx={15} fill={P.cimenKoyu} />
      ))}
      {cicekler}
    </>
  );
}

function Mutfak() {
  return (
    <>
      <Gok renk={P.duvar} />
      <Zemin renk={P.zemin} />
      {/* Pencere */}
      <g>
        <rect x={620} y={90} width={360} height={260} rx={16} fill={P.gok} stroke={P.cizgi} strokeWidth={10} />
        <rect x={795} y={90} width={10} height={260} fill={P.cizgi} />
        <rect x={620} y={215} width={360} height={10} fill={P.cizgi} />
      </g>
      {/* Raf: farklı boyda kavanozlar (uzun/kısa, büyük/küçük) */}
      <rect x={120} y={250} width={380} height={16} rx={6} fill={P.tahta} />
      <g fill={P.krem} stroke={P.cizgi} strokeWidth={4}>
        <rect x={150} y={150} width={60} height={100} rx={12} />
        <rect x={240} y={190} width={70} height={60} rx={12} />
        <rect x={340} y={120} width={50} height={130} rx={12} />
        <rect x={420} y={205} width={50} height={45} rx={10} />
      </g>
      {/* Tezgâh */}
      <rect x={0} y={ZEMIN_Y - 120} width={W} height={24} fill={P.tahta} />
      <rect x={0} y={ZEMIN_Y - 96} width={W} height={96} fill={P.tente2} />
      {/* Terazi (sağda) */}
      <g fill={P.lila} stroke={P.cizgi} strokeWidth={4}>
        <rect x={1240} y={ZEMIN_Y - 230} width={14} height={110} />
        <rect x={1150} y={ZEMIN_Y - 236} width={194} height={12} rx={6} />
        <path d={`M 1140 ${ZEMIN_Y - 224} q 30 50 60 0 Z`} />
        <path d={`M 1294 ${ZEMIN_Y - 224} q 30 50 60 0 Z`} />
      </g>
    </>
  );
}

function Ordek({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={P.krem} stroke={P.cizgi} strokeWidth={3}>
      <ellipse cx={0} cy={0} rx={46} ry={26} />
      <circle cx={34} cy={-30} r={20} />
      <path d="M 52 -30 l 20 6 l -20 6 Z" fill={P.gunes} />
    </g>
  );
}

function Gol() {
  return (
    <>
      <Gok />
      <Bulut x={260} y={110} />
      <Bulut x={1200} y={150} s={0.7} />
      <Zemin />
      <ellipse cx={800} cy={ZEMIN_Y + 170} rx={720} ry={150} fill={P.su} />
      <ellipse cx={800} cy={ZEMIN_Y + 170} rx={560} ry={95} fill={P.suKoyu} opacity={0.6} />
      <Agac x={120} s={0.95} />
      <Agac x={1480} s={0.9} />
      {/* İskele (solda) — ördekler buradan gelir/gider */}
      <rect x={60} y={ZEMIN_Y + 60} width={260} height={22} fill={P.tahta} />
      <Ordek x={560} y={ZEMIN_Y + 170} />
      <Ordek x={1060} y={ZEMIN_Y + 200} s={0.85} />
      {/* Sazlar */}
      <g fill={P.cimenKoyu}>
        {[1300, 1330, 1360].map((x) => (
          <rect key={x} x={x} y={ZEMIN_Y - 40} width={10} height={90} rx={5} />
        ))}
      </g>
    </>
  );
}

function Pazar() {
  const tezgahlar = [180, 640, 1100];
  return (
    <>
      <Gok />
      <Gunes x={1450} y={110} />
      <Zemin renk={P.yol} />
      {tezgahlar.map((x, i) => (
        <g key={x}>
          {/* Tente: şeritler biçimle (dalga) ayrışır, renkle anlam yok */}
          <rect x={x} y={250} width={320} height={70} fill={i % 2 ? P.tente2 : P.tente} />
          <path
            d={`M ${x} 320 ${Array.from({ length: 8 }, () => 'q 20 30 40 0').join(' ')}`}
            fill={i % 2 ? P.tente2 : P.tente}
            stroke={P.cizgi}
            strokeWidth={3}
          />
          <rect x={x + 10} y={320} width={12} height={ZEMIN_Y - 320 + 20} fill={P.tahta} />
          <rect x={x + 298} y={320} width={12} height={ZEMIN_Y - 320 + 20} fill={P.tahta} />
          {/* Tezgâh ve kasalar */}
          <rect x={x - 10} y={ZEMIN_Y - 60} width={340} height={80} rx={8} fill={P.tahta} />
          <rect
            x={x + 30}
            y={ZEMIN_Y - 100}
            width={110}
            height={40}
            rx={6}
            fill={P.krem}
            stroke={P.cizgi}
            strokeWidth={3}
          />
          <rect
            x={x + 180}
            y={ZEMIN_Y - 100}
            width={110}
            height={40}
            rx={6}
            fill={P.krem}
            stroke={P.cizgi}
            strokeWidth={3}
          />
        </g>
      ))}
    </>
  );
}

function Atolye() {
  return (
    <>
      <Gok renk={P.duvar} />
      <Zemin renk={P.tahta} />
      {/* Duvarda şekil panosu: üçgen, kare, dikdörtgen, çember — yalnız çizgi, dolgu açık */}
      <rect x={480} y={90} width={640} height={300} rx={20} fill={P.krem} stroke={P.cizgi} strokeWidth={8} />
      <g fill={P.lila} stroke={P.cizgi} strokeWidth={4}>
        <path d="M 570 330 L 640 170 L 710 330 Z" />
        <rect x={750} y={190} width={130} height={130} rx={6} />
      </g>
      <g fill={P.seftali} stroke={P.cizgi} strokeWidth={4}>
        <rect x={910} y={220} width={170} height={100} rx={6} />
      </g>
      {/* Tezgâh ve bloklar */}
      <rect x={160} y={ZEMIN_Y - 40} width={1280} height={30} rx={8} fill={P.zemin} />
      <g fill={P.tente} stroke={P.cizgi} strokeWidth={4}>
        <rect x={220} y={ZEMIN_Y - 130} width={90} height={90} rx={6} />
        <rect x={320} y={ZEMIN_Y - 100} width={140} height={60} rx={6} />
        <circle cx={1300} cy={ZEMIN_Y - 90} r={50} />
      </g>
      <g fill={P.tente2} stroke={P.cizgi} strokeWidth={4}>
        <path d={`M 1120 ${ZEMIN_Y - 40} L 1180 ${ZEMIN_Y - 150} L 1240 ${ZEMIN_Y - 40} Z`} />
      </g>
    </>
  );
}

function Ciftlik() {
  return (
    <>
      <Gok />
      <Gunes x={180} y={130} />
      <Bulut x={900} y={110} s={0.9} />
      <Zemin />
      {/* Ahır */}
      <g stroke={P.cizgi} strokeWidth={6}>
        <rect x={1080} y={ZEMIN_Y - 260} width={340} height={260} fill={P.tente2} />
        <path d={`M 1050 ${ZEMIN_Y - 250} L 1250 ${ZEMIN_Y - 400} L 1450 ${ZEMIN_Y - 250} Z`} fill={P.krem} />
        <rect x={1200} y={ZEMIN_Y - 140} width={100} height={140} fill={P.tahta} />
      </g>
      {/* Çetele panosu (solda) — sayım çizgileri, sayı yazılmaz */}
      <g>
        <rect
          x={140}
          y={ZEMIN_Y - 240}
          width={260}
          height={170}
          rx={12}
          fill={P.krem}
          stroke={P.cizgi}
          strokeWidth={6}
        />
        <rect x={262} y={ZEMIN_Y - 70} width={16} height={70} fill={P.tahta} />
        <g stroke={P.cizgi} strokeWidth={8} strokeLinecap="round">
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={185 + i * 30} y1={ZEMIN_Y - 205} x2={185 + i * 30} y2={ZEMIN_Y - 115} />
          ))}
          <line x1={170} y1={ZEMIN_Y - 125} x2={290} y2={ZEMIN_Y - 195} />
        </g>
      </g>
      {/* Çit */}
      <g fill={P.krem} stroke={P.cizgi} strokeWidth={3}>
        <rect x={0} y={ZEMIN_Y + 40} width={W} height={14} />
        <rect x={0} y={ZEMIN_Y + 80} width={W} height={14} />
      </g>
    </>
  );
}

const CIZIM: Readonly<Record<SahneAdi, () => ReactNode>> = {
  park: Park,
  bahce: Bahce,
  mutfak: Mutfak,
  gol: Gol,
  pazar: Pazar,
  atolye: Atolye,
  ciftlik: Ciftlik,
};

export interface TemaSahnesiProps {
  readonly sahne: SahneAdi;
  readonly style?: CSSProperties;
}

/**
 * Dokunulmaz tema arka planı. Kapsayıcısını doldurur (`position: absolute; inset: 0`); üstüne gelen içerik normal akışta
 * çizilir. Sahne hiçbir olay almaz.
 */
export const TemaSahnesi = memo(function TemaSahnesi({ sahne, style }: TemaSahnesiProps) {
  const Ciz = CIZIM[sahne];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      role="presentation"
      data-tema-sahnesi={sahne}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
    >
      <Ciz />
    </svg>
  );
});
