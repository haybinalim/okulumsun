/**
 * 1. grup (a n e t i l) resimli sözcük görselleri — özgün kod çizimi (Adım 68). Stil: `ortak.tsx`.
 * Sözcük ve taslak no: `work/okuma-yazma/sozcuk-listesi-taslak.md` (iki öğretmen teyidi bekliyor).
 */
import { C, D, G, Isik, P, Yuz, Zemin, daire, ton, yuvarlakDikdortgen, type GorselTanimi, type ResimsizTanimi } from './ortak';

/** Kişi büstü: baş + saç + gövde. Kişiler genel, kimseyi temsil etmez; ten ve kıyafet paletten. */
function Bust({ k, x, y, o, giysi, sac, uzun }: { k: () => string; x: number; y: number; o: number; giysi: string; sac: string; uzun?: boolean }) {
  const q = (n: number) => Math.round(n * 10) / 10;
  const r = q(11 * o);
  const X = (dx: number) => q(x + dx * o);
  const Y = (dy: number) => q(y + dy * o);
  return (
    <g>
      {uzun && <P d={`M${X(-12)} ${Y(2)}C${X(-14)} ${Y(-12)} ${X(14)} ${Y(-12)} ${X(12)} ${Y(2)}L${X(14)} ${Y(22)}H${X(-14)}Z`} r={sac} />}
      <G d={`M${X(-17)} ${Y(64)}C${X(-17)} ${Y(24)} ${X(-12)} ${Y(15)} ${x} ${Y(15)}C${X(12)} ${Y(15)} ${X(17)} ${Y(24)} ${X(17)} ${Y(64)}Z`} r={giysi} k={k} ofset={4} />
      <P d={daire(x, y, r)} r="ten" sw={3} />
      <P d={`M${X(-11.5)} ${y}C${X(-11)} ${Y(-14)} ${X(11)} ${Y(-14)} ${X(11.5)} ${y}C${X(5.5)} ${Y(-6)} ${X(-4.4)} ${Y(-5.5)} ${X(-11.5)} ${y}Z`} r={sac} />
      <Yuz x={x} y={Y(2)} o={o} />
    </g>
  );
}

export const GRUP1: readonly GorselTanimi[] = [
  {
    id: 'anne',
    sozcuk: 'anne',
    taslakNo: 5,
    aciklama: 'kucağında kundaklı bebek tutan yetişkin',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M33 30C30 14 42 8 50 8C58 8 70 14 67 30L70 58L30 58Z" r="sac" k={k} ofset={3} />
        <G d="M18 98C18 62 30 52 50 52C70 52 82 62 82 98Z" r="cicek" k={k} ofset={4} />
        <G d={daire(50, 30, 15)} r="ten" k={k} ofset={3} />
        <G d="M35 30C33 18 42 12 50 12C60 12 67 18 65 30C60 22 52 20 44 22C40 24 37 27 35 30Z" r="sac" k={k} ofset={2} sw={2.4} />
        <Yuz x={50} y={33} o={1.1} />
        <G d="M26 80C26 68 38 62 54 64C68 66 76 72 74 80C72 90 60 94 46 92C34 90 26 88 26 80Z" r="cam" k={k} ofset={3} />
        <G d={daire(36, 72, 9)} r="ten" k={k} ofset={2} />
        <C d="M33 72H35M38 72H40" r="ten" w={1.6} />
        <C d="M34 76Q36 77.5 38 76" r="ten" w={1.3} />
        <G d="M54 70C64 72 74 78 80 86L74 94C66 86 58 82 52 80Z" r="cicek" k={k} ofset={2} />
      </g>
    ),
  },
  {
    id: 'nane',
    sozcuk: 'nane',
    taslakNo: 6,
    aciklama: 'nane dalı: sap ve üç kat tırtıklı yaprak',
    risk: 'orta',
    ciz: (k) => {
      const yaprak = (cx: number, cy: number, a: number, s: number) => (
        <g transform={`translate(${cx} ${cy}) rotate(${a}) scale(${s})`}>
          <G
            d="M0 0C6 -8 18 -10 30 -6C27 -3 30 0 26 2C29 4 25 7 22 7C22 10 17 10 15 11C9 12 3 7 0 0Z"
            r="nane"
            k={k}
            ofset={3}
            sw={2.6 / s}
          />
          <C d="M2 0C10 -1 18 -2 26 -3" r="nane" t="kontur" w={1.6 / s} />
        </g>
      );
      return (
        <g>
          <Zemin rx={22} />
          <C d="M50 92C50 70 50 40 51 12" r="koyuYesil" t="golge" w={4} />
          {yaprak(51, 72, -12, 1.25)}
          <g transform="translate(100 0) scale(-1 1)">{yaprak(49, 72, -12, 1.25)}</g>
          {yaprak(51, 48, -22, 1.05)}
          <g transform="translate(100 0) scale(-1 1)">{yaprak(49, 48, -22, 1.05)}</g>
          {yaprak(51, 26, -40, 0.75)}
          <g transform="translate(100 0) scale(-1 1)">{yaprak(49, 26, -40, 0.75)}</g>
        </g>
      );
    },
  },
  {
    id: 'at',
    sozcuk: 'at',
    taslakNo: 11,
    aciklama: 'yandan, ayakta duran at (yele ve kuyruk)',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <Zemin rx={36} />
        <C d="M80 46C90 50 92 62 88 74" r="sac" t="temel" w={6} />
        <G d="M66 58H74V90H66Z" r="at" k={k} ofset={2} sw={2.6} />
        <G d="M38 58H46V90H38Z" r="at" k={k} ofset={2} sw={2.6} />
        <G d="M28 46C28 37 40 34 56 35C72 35 84 38 84 50C84 62 72 66 56 66C40 66 28 58 28 46Z" r="at" k={k} />
        <G d="M75 60H83V90H75Z" r="at" k={k} ofset={2} sw={2.6} />
        <G d="M29 60H37V90H29Z" r="at" k={k} ofset={2} sw={2.6} />
        <g fill={ton('sac').temel} stroke={ton('sac').kontur} strokeWidth="2">
          <rect x="28" y="86" width="10" height="5" rx="1.5" />
          <rect x="74" y="86" width="10" height="5" rx="1.5" />
        </g>
        <G d="M30 50C26 40 22 32 18 26L30 18C36 26 40 34 44 44Z" r="at" k={k} ofset={3} />
        <G d="M10 26C10 18 18 12 26 13C32 14 35 19 33 25L28 36C26 39 21 40 17 38L11 34C9 32 9 29 10 26Z" r="at" k={k} ofset={3} />
        <P d="M26 14L30 4L33 16Z" r="at" />
        <C d="M30 14C38 22 42 32 45 42" r="sac" t="temel" w={6} />
        <D x={22} y={22} rr={2} r="sac" t="kontur" />
        <D x={13} y={33} rr={1.2} r="sac" t="kontur" />
      </g>
    ),
  },
  {
    id: 'et',
    sozcuk: 'et',
    taslakNo: 12,
    aciklama: 'çiğ et dilimi (biftek): yağ kenarı ve kemik',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Zemin rx={34} cy={86} />
        <G d="M14 46C12 30 30 20 50 22C72 20 90 30 88 50C86 70 68 82 48 80C28 80 16 64 14 46Z" r="krem" k={k} />
        <G
          d="M21 47C20 34 34 27 50 29C68 28 81 35 80 50C79 66 65 74 49 73C32 73 22 61 21 47Z"
          r="et"
          k={k}
          ofset={4}
          sw={2}
          isik={<Isik d="M28 42C30 36 36 33 42 33C38 37 34 41 32 46Z" r="et" />}
        />
        <C d="M34 56C40 52 46 58 52 54M56 62C60 58 66 62 70 58" r="krem" t="temel" w={2.4} />
        <G d={daire(62, 44, 7)} r="krem" k={k} ofset={2} sw={2.4} />
        <D x={62} y={44} rr={2.6} r="ahsap" t="golge" />
      </g>
    ),
  },
  {
    id: 'anten',
    sozcuk: 'anten',
    taslakNo: 18,
    aciklama: 'çatı üstünde televizyon anteni',
    risk: 'yuksek',
    ciz: (k) => (
      <g>
        <G d="M4 96L50 70L96 96Z" r="balik" k={k} ofset={4} />
        <C d="M20 96L50 79L80 96M36 96L50 88L64 96" r="balik" t="golge" w={2} />
        <G d="M47 14H53V80H47Z" r="metal" k={k} ofset={2} sw={2.4} />
        <G d="M14 22H86V28H14Z" r="metal" k={k} ofset={2} sw={2.4} />
        <G d="M22 38H78V44H22Z" r="metal" k={k} ofset={2} sw={2.4} />
        <G d="M30 54H70V60H30Z" r="metal" k={k} ofset={2} sw={2.4} />
        <C d="M18 22V14M30 22V14M70 22V14M82 22V14M26 38V31M74 38V31" r="metal" w={2.6} />
      </g>
    ),
  },
  {
    id: 'tente',
    sozcuk: 'tente',
    taslakNo: 19,
    aciklama: 'dükkân vitrininin üstünde çizgili, dalgalı kenarlı tente',
    risk: 'yuksek',
    ciz: (k) => (
      <g>
        <G d="M10 30H90V94H10Z" r="ahsap" k={k} ofset={3} />
        <G d="M18 54H50V84H18Z" r="cam" k={k} ofset={3} sw={2.4} />
        <G d="M58 50H82V94H58Z" r="sap" k={k} ofset={3} sw={2.4} />
        <D x={63} y={73} rr={1.8} r="sap" t="kontur" />
        <G
          d="M6 14H94L90 40C86 46 80 46 78 40C76 46 68 46 66 40C64 46 56 46 54 40C52 46 44 46 42 40C40 46 32 46 30 40C28 46 20 46 18 40C16 46 10 46 10 40Z"
          r="beyaz"
          k={k}
          ofset={3}
          ic={
            <g fill={ton('kumas').temel}>
              <path d="M18 0H30V50H18ZM42 0H54V50H42ZM66 0H78V50H66Z" />
            </g>
          }
        />
      </g>
    ),
  },
  {
    id: 'in',
    sozcuk: 'in',
    taslakNo: 20,
    aciklama: 'tümsekte hayvan ini: karanlık oyuk ve içinde iki göz',
    risk: 'yuksek',
    ciz: (k) => (
      <g>
        <G d="M4 90C10 54 34 34 56 36C78 38 94 60 96 90Z" r="toprak" k={k} />
        <G d="M32 90C32 66 42 56 52 56C62 56 70 66 70 90Z" r="lastik" k={k} ofset={3} />
        <D x={46} y={74} rr={2.4} r="far" />
        <D x={57} y={74} rr={2.4} r="far" />
        <C d="M30 40L28 30M34 38L36 28M70 42L72 32M74 44L78 36M40 36L40 28" r="nane" t="temel" w={3} />
        <C d="M14 74L20 72M80 70L86 72M22 58L28 60" r="toprak" t="golge" w={2.4} />
      </g>
    ),
  },
  {
    id: 'nine',
    sozcuk: 'nine',
    taslakNo: 23,
    aciklama: 'gözlüklü, beyaz saçı topuz yaşlı kadın (büst)',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d={daire(50, 13, 9)} r="agir" k={k} ofset={2} />
        <G d="M16 98C16 64 30 54 50 54C70 54 84 64 84 98Z" r="kelebek" k={k} ofset={4} />
        <C d="M50 58V98" r="kelebek" w={2} />
        <D x={46} y={70} rr={2} r="kelebek" t="isik" />
        <D x={46} y={84} rr={2} r="kelebek" t="isik" />
        <G d={daire(50, 36, 17)} r="ten" k={k} ofset={3} />
        <G d="M32 36C30 22 40 17 50 17C62 17 70 22 68 36C66 28 58 24 50 25C42 24 34 28 32 36Z" r="agir" k={k} ofset={2} sw={2.4} />
        <g fill="none" stroke={ton('lastik').kontur} strokeWidth="1.8">
          <circle cx="43" cy="37" r="5" />
          <circle cx="57" cy="37" r="5" />
          <path d="M48 37H52M38 36L34 34M62 36L66 34" />
        </g>
        <D x={43} y={37} rr={1.5} r="ten" t="kontur" />
        <D x={57} y={37} rr={1.5} r="ten" t="kontur" />
        <C d="M44 45Q50 49 56 45" r="ten" w={1.6} />
        <C d="M36 44Q38 46 40 45M60 45Q62 46 64 44" r="ten" t="golge" w={1.3} />
      </g>
    ),
  },
  {
    id: 'el',
    sozcuk: 'el',
    taslakNo: 29,
    aciklama: 'açık el, avuç içi önde, beş parmak',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <G d={yuvarlakDikdortgen(31, 16, 11, 40, 5.5)} r="ten" k={k} ofset={2} sw={2.8} />
        <G d={yuvarlakDikdortgen(43, 10, 11, 44, 5.5)} r="ten" k={k} ofset={2} sw={2.8} />
        <G d={yuvarlakDikdortgen(55, 14, 11, 42, 5.5)} r="ten" k={k} ofset={2} sw={2.8} />
        <G d={yuvarlakDikdortgen(67, 25, 10, 34, 5)} r="ten" k={k} ofset={2} sw={2.8} />
        <G d="M33 66C26 60 20 52 14 46C10 42 14 35 20 38C26 42 32 50 36 54Z" r="ten" k={k} ofset={2} sw={2.8} />
        <G d="M30 46H78V70C78 84 68 94 54 94C40 94 30 84 30 70Z" r="ten" k={k} ofset={3} />
        <C d="M42 66C48 70 58 70 66 64M44 78C50 80 58 79 62 76" r="ten" t="golge" w={1.6} />
      </g>
    ),
  },
  {
    id: 'lale',
    sozcuk: 'lale',
    taslakNo: 33,
    aciklama: 'saplı, iki yapraklı lale',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Zemin rx={20} />
        <C d="M50 52V92" r="yaprak" t="golge" w={4} />
        <G d="M50 92C34 84 26 66 28 50C40 58 48 72 50 92Z" r="yaprak" k={k} ofset={3} />
        <G d="M50 92C66 84 74 66 72 50C60 58 52 72 50 92Z" r="yaprak" k={k} ofset={3} />
        <G
          d="M30 14L41 26L50 10L59 26L70 14C76 34 70 54 50 56C30 54 24 34 30 14Z"
          r="elma"
          k={k}
          isik={<Isik d="M34 24C36 32 38 40 44 46C36 44 32 36 34 24Z" r="elma" />}
        />
        <C d="M41 26C44 36 46 46 50 54M59 26C56 36 54 46 50 54" r="elma" t="golge" w={2} />
      </g>
    ),
  },
  {
    id: 'aile',
    sozcuk: 'aile',
    taslakNo: 34,
    aciklama: 'iki yetişkin ve iki çocuktan oluşan aile (büstler)',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Bust k={k} x={22} y={30} o={0.95} giysi="top" sac="sac" />
        <Bust k={k} x={78} y={30} o={0.95} giysi="cicek" sac="govde" uzun />
        <Bust k={k} x={40} y={56} o={0.72} giysi="sari" sac="govde" />
        <Bust k={k} x={60} y={56} o={0.72} giysi="araba" sac="sac" uzun />
      </g>
    ),
  },
  {
    id: 'nal',
    sozcuk: 'nal',
    taslakNo: 36,
    aciklama: 'çivi delikli at nalı',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Zemin rx={30} cy={92} />
        <G
          d="M20 86C10 60 16 16 50 14C84 16 90 60 80 86L64 86C70 64 68 32 50 31C32 32 30 64 36 86Z"
          r="tas"
          k={k}
          isik={<Isik d="M24 60C22 40 28 24 42 19C32 28 28 42 29 60Z" r="tas" />}
        />
        <g fill={ton('tas').kontur}>
          <circle cx="24" cy="70" r="2.2" />
          <circle cx="24" cy="50" r="2.2" />
          <circle cx="32" cy="31" r="2.2" />
          <circle cx="76" cy="70" r="2.2" />
          <circle cx="76" cy="50" r="2.2" />
          <circle cx="68" cy="31" r="2.2" />
        </g>
      </g>
    ),
  },
  {
    id: 'tel',
    sozcuk: 'tel',
    taslakNo: 37,
    aciklama: 'kangal hâlinde bakır tel ve açık ucu',
    risk: 'yuksek',
    ciz: () => {
      const t = ton('gaga');
      const halka = (dx: number) => (
        <ellipse cx={34 + dx} cy="52" rx="14" ry="30" fill="none" stroke={t.kontur} strokeWidth="7.5" />
      );
      const ic = (dx: number) => (
        <ellipse cx={34 + dx} cy="52" rx="14" ry="30" fill="none" stroke={t.temel} strokeWidth="3.6" />
      );
      return (
        <g>
          <Zemin rx={36} />
          {[0, 8, 16, 24, 32].map((dx) => (
            <g key={dx}>
              {halka(dx)}
              {ic(dx)}
            </g>
          ))}
          <path d="M66 52C76 56 80 66 90 70" fill="none" stroke={t.kontur} strokeWidth="7.5" strokeLinecap="round" />
          <path d="M66 52C76 56 80 66 90 70" fill="none" stroke={t.temel} strokeWidth="3.6" strokeLinecap="round" />
          <path d="M26 30C24 40 24 50 26 60" fill="none" stroke={t.isik} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    },
  },
  {
    id: 'alet',
    sozcuk: 'alet',
    taslakNo: 39,
    aciklama: 'alet kutusu: çekiç, tornavida ve İngiliz anahtarı',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Zemin rx={40} />
        <G d="M33 12H37V50H33Z" r="sap" k={k} ofset={2} sw={2.4} />
        <G d="M24 8H48V18H24Z" r="metal" k={k} ofset={2} sw={2.4} />
        <G d="M54 22H62V48H54Z" r="kalem" k={k} ofset={2} sw={2.4} />
        <C d="M58 22V10" r="metal" t="kontur" w={4.6} />
        <C d="M58 21V11" r="metal" t="temel" w={2} />
        <C d="M72 48L78 18" r="metal" t="kontur" w={8} />
        <C d="M72 48L78 18" r="metal" t="temel" w={4.4} />
        <G d="M70 16C70 8 82 6 86 12L80 14L80 20L86 22C82 28 72 26 70 16Z" r="metal" k={k} ofset={2} sw={2.4} />
        <G d="M10 46H90V88C90 91 88 92 86 92H14C12 92 10 91 10 88Z" r="balik" k={k} />
        <G d="M10 46H90V58H10Z" r="balik" k={k} ofset={2} sw={2.6} />
        <G d="M44 52H56V64H44Z" r="metal" k={k} ofset={2} sw={2.4} />
      </g>
    ),
  },
  {
    id: 'atlet',
    sozcuk: 'atlet',
    taslakNo: 41,
    aciklama: 'kolsuz beyaz atlet (iç giysisi)',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G
          d="M30 8H38C38 22 44 30 50 30C56 30 62 22 62 8H70C70 22 72 30 80 38C80 56 80 76 82 94H18C20 76 20 56 20 38C28 30 30 22 30 8Z"
          r="beyaz"
          k={k}
          isik={<Isik d="M24 44C26 40 30 36 32 32C30 46 30 60 28 76H24Z" r="beyaz" />}
        />
        <C d="M26 88C40 90 60 90 74 88" r="beyaz" t="golge" w={2} />
        <C d="M44 50C46 60 46 70 44 80" r="beyaz" t="golge" w={1.6} />
      </g>
    ),
  },
];

/** Resimle karışıklıksız gösterilemeyen resimli adaylar (öğretmene sorulur). */
export const GRUP1_RESIMSIZ: readonly ResimsizTanimi[] = [
  {
    sozcuk: 'nene',
    taslakNo: 7,
    neden: '"nine" ile aynı resim (yaşlı kadın); iki sözcük tek resme düşer. Görsel "nine"de, "nene" resimsiz.',
  },
  {
    sozcuk: 'anneanne',
    taslakNo: 9,
    neden: 'Akrabalık resimle gösterilemez; çizim "nine" ile karışır.',
  },
  {
    sozcuk: 'alan',
    taslakNo: 38,
    neden: 'Soyut sözcük; oyun alanı çiziminde çocuk "park" ya da "kaydırak" der.',
  },
];
