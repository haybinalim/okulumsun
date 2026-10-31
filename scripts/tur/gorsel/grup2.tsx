/**
 * 2. grup (o k u r ı m) resimli sözcük görselleri — özgün kod çizimi (Adım 68). Stil: `ortak.tsx`.
 * Sözcük ve taslak no: `work/okuma-yazma/sozcuk-listesi-taslak.md` (iki öğretmen teyidi bekliyor).
 * "elma" ve "kalem" matematik nesneleridir (`Sprite.tsx`); aynı çizim statik olarak yazılır.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { Sprite } from '../../../src/ui/svg/Sprite';
import type { NesneSprite } from '../../../src/exercises/types';
import { C, D, G, Isik, P, Yuz, Zemin, daire, ton, yuvarlakDikdortgen, type GorselTanimi, type ResimsizTanimi } from './ortak';

/** Matematik nesnesinin çizimini (iç öğeleri) aynen alır; kimlikler üreticide yeniden adlandırılır. */
function NesneSpritei({ ad }: { ad: NesneSprite }) {
  const ham = renderToStaticMarkup(<Sprite name={ad} size={100} />);
  const ic = ham.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return <g dangerouslySetInnerHTML={{ __html: ic }} />;
}

/** Ağaç (orman): gövde + yuvarlak taç. */
function Agac({ k, x, y, s }: { k: () => string; x: number; y: number; s: number }) {
  const q = (n: number) => Math.round(n * 10) / 10;
  return (
    <g>
      <P d={`M${q(x - 3 * s)} ${q(y)}H${q(x + 3 * s)}V${q(y + 20 * s)}H${q(x - 3 * s)}Z`} r="sap" />
      <G
        d={`M${q(x)} ${q(y - 26 * s)}C${q(x + 12 * s)} ${q(y - 26 * s)} ${q(x + 16 * s)} ${q(y - 14 * s)} ${q(x + 15 * s)} ${q(y - 6 * s)}C${q(x + 15 * s)} ${q(y + 2 * s)} ${q(x + 8 * s)} ${q(y + 6 * s)} ${q(x)} ${q(y + 6 * s)}C${q(x - 8 * s)} ${q(y + 6 * s)} ${q(x - 15 * s)} ${q(y + 2 * s)} ${q(x - 15 * s)} ${q(y - 6 * s)}C${q(x - 16 * s)} ${q(y - 14 * s)} ${q(x - 12 * s)} ${q(y - 26 * s)} ${q(x)} ${q(y - 26 * s)}Z`}
        r="koyuYesil"
        k={k}
        ofset={3}
      />
    </g>
  );
}

const yaprakD = (x: number, y: number) => `M${x} ${y}C${x + 4} ${y - 9} ${x + 14} ${y - 12} ${x + 22} ${y - 9}C${x + 18} ${y} ${x + 8} ${y + 4} ${x} ${y}Z`;

export const GRUP2: readonly GorselTanimi[] = [
  {
    id: 'ot',
    sozcuk: 'ot',
    taslakNo: 45,
    aciklama: 'toprakta bir tutam yeşil ot',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M14 84C14 76 30 72 50 72C70 72 86 76 86 84C86 90 70 92 50 92C30 92 14 90 14 84Z" r="toprak" k={k} ofset={3} />
        <G
          d="M22 80C22 64 18 46 10 32C26 42 32 58 34 72C34 52 32 30 26 12C42 28 46 52 46 72C48 50 52 30 62 14C60 36 58 56 58 74C62 58 72 42 86 34C76 50 70 66 70 80Z"
          r="nane"
          k={k}
        />
        <C d="M30 74C30 60 28 46 24 34M46 72C46 56 46 40 42 26M60 74C62 58 64 44 68 32" r="nane" t="golge" w={1.8} />
      </g>
    ),
  },
  {
    id: 'nota',
    sozcuk: 'nota',
    taslakNo: 46,
    aciklama: 'iki sekizlik nota (müzik işareti)',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <G d="M30 22L80 10V24L30 36Z" r="govde" k={k} ofset={2} />
        <G d="M30 22H37V76H30ZM73 12H80V64H73Z" r="govde" k={k} ofset={2} />
        <G d="M14 80C14 72 22 66 32 66C38 66 38 72 37 76C36 84 28 90 20 90C16 90 14 86 14 80Z" r="govde" k={k} ofset={3} />
        <G d="M57 68C57 60 65 54 75 54C81 54 81 60 80 64C79 72 71 78 63 78C59 78 57 74 57 68Z" r="govde" k={k} ofset={3} />
        <Isik d="M20 76C22 72 26 70 30 70C26 72 23 75 22 79Z" r="ten" />
      </g>
    ),
  },
  {
    id: 'olta',
    sozcuk: 'olta',
    taslakNo: 47,
    aciklama: 'makaralı olta kamışı, misina ve iğne',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <C d="M14 90L72 12" r="sap" t="kontur" w={6.5} />
        <C d="M14 90L72 12" r="sap" t="temel" w={3.2} />
        <C d="M72 12C82 24 84 50 84 70" r="murekkep" t="temel" w={1.4} />
        <C d="M84 70V80C84 86 76 86 76 80" r="metal" t="kontur" w={2.6} />
        <G d={daire(30, 70, 9)} r="metal" k={k} ofset={2} sw={2.6} />
        <D x={30} y={70} rr={3} r="metal" t="golge" />
        <G d="M10 84L20 92L16 96L6 88Z" r="lastik" k={k} ofset={1} sw={2.4} />
      </g>
    ),
  },
  {
    id: 'ok',
    sozcuk: 'ok',
    taslakNo: 54,
    aciklama: 'tüylü, sivri uçlu ok',
    risk: 'dusuk',
    ciz: (k) => (
      <g transform="rotate(-35 50 50)">
        <G d="M18 47H78V53H18Z" r="ahsap" k={k} ofset={2} sw={2.4} />
        <G d="M76 40L96 50L76 60L80 50Z" r="metal" k={k} ofset={2} />
        <G d="M4 40L22 40L30 48H12Z" r="balon" k={k} ofset={2} sw={2.4} />
        <G d="M4 60L22 60L30 52H12Z" r="balon" k={k} ofset={2} sw={2.4} />
      </g>
    ),
  },
  {
    id: 'kale',
    sozcuk: 'kale',
    taslakNo: 56,
    aciklama: 'mazgallı iki kuleli taş kale ve kapısı',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M22 48H78V92H22Z" r="tas" k={k} />
        <G d="M8 30H12V24H18V30H22V24H28V30H32V92H8Z" r="tas" k={k} ofset={3} />
        <G d="M68 30H72V24H78V30H82V24H88V30H92V92H68Z" r="tas" k={k} ofset={3} />
        <G d="M32 48V42H38V48H46V42H54V48H62V42H68V48Z" r="tas" k={k} ofset={2} sw={2.6} />
        <G d="M40 92V72C40 64 60 64 60 72V92Z" r="sap" k={k} ofset={2} />
        <G d="M17 44H23V54H17ZM77 44H83V54H77Z" r="lastik" k={k} ofset={1} sw={2.2} />
        <C d="M22 64H32M68 64H78M22 80H40M60 80H78" r="tas" t="golge" w={1.6} />
      </g>
    ),
  },
  {
    id: 'kek',
    sozcuk: 'kek',
    taslakNo: 60,
    aciklama: 'ortası delik kalıp kek (üstü pudra şekerli)',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M6 78C6 72 26 68 50 68C74 68 94 72 94 78C94 86 74 90 50 90C26 90 6 86 6 78Z" r="cam" k={k} ofset={2} sw={2.6} />
        <G
          d="M16 76V46C16 36 32 30 50 30C68 30 84 36 84 46V76C84 82 68 84 50 84C32 84 16 82 16 76Z"
          r="gobek"
          k={k}
          ic={<path d="M16 60H84V90H16Z" fill={ton('sap').temel} />}
        />
        <C d="M30 56V80M44 58V83M58 58V83M72 56V80" r="sap" t="golge" w={1.8} />
        <G d="M38 40C38 36 44 34 50 34C56 34 62 36 62 40C62 44 56 46 50 46C44 46 38 44 38 40Z" r="sap" k={k} ofset={2} sw={2.4} />
        <C d="M22 44C30 38 42 36 50 36M66 37C72 38 78 41 80 44" r="beyaz" t="temel" w={2.6} />
      </g>
    ),
  },
  {
    id: 'kol',
    sozcuk: 'kol',
    taslakNo: 61,
    aciklama: 'dirsekten bükülmüş, pazısı görünen kol',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M24 62C32 44 52 40 60 56L62 58L64 32H82L84 72C84 84 76 88 66 88H24Z" r="ten" k={k} />
        <G d={yuvarlakDikdortgen(58, 8, 30, 28, 10)} r="ten" k={k} ofset={3} />
        <C d="M66 12V20M73 11V20M80 12V20" r="ten" t="kontur" w={2} />
        <C d="M44 60C50 64 56 68 60 74" r="ten" t="golge" w={2} />
        <G d="M4 56H28V92H4Z" r="kumas" k={k} ofset={3} />
      </g>
    )
  },
  {
    id: 'etek',
    sozcuk: 'etek',
    taslakNo: 63,
    aciklama: 'kloş etek (bel bandı ve pliler)',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M32 16H68V28H32Z" r="cicek" k={k} ofset={2} sw={2.8} />
        <G
          d="M32 28H68L90 86C80 92 66 90 58 86C50 92 40 92 34 86C26 92 14 90 10 86Z"
          r="balon"
          k={k}
          isik={<Isik d="M34 32H42L26 80C22 80 18 78 16 76Z" r="balon" />}
        />
        <C d="M42 30L34 86M50 30V88M58 30L66 86" r="balon" t="golge" w={2} />
        <D x={62} y={22} rr={2.2} r="cicek" t="kontur" />
      </g>
    ),
  },
  {
    id: 'inek',
    sozcuk: 'inek',
    taslakNo: 64,
    aciklama: 'yandan, alacalı inek',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <Zemin rx={38} />
        <G d="M64 60H72V90H64ZM34 60H42V90H34Z" r="beyaz" k={k} ofset={2} sw={2.6} />
        <G
          d="M24 46C24 36 36 32 54 32C74 32 88 36 88 48C88 62 76 66 56 66C36 66 24 60 24 46Z"
          r="beyaz"
          k={k}
          ic={
            <g fill={ton('lastik').temel}>
              <path d="M44 32C50 40 46 48 40 48C34 48 32 40 34 34Z" />
              <path d="M66 40C76 38 80 46 76 54C70 60 62 56 62 48Z" />
            </g>
          }
        />
        <G d="M74 62H82V90H74ZM26 60H34V90H26Z" r="beyaz" k={k} ofset={2} sw={2.6} />
        <C d="M88 46C94 50 94 60 92 68" r="lastik" t="temel" w={2.6} />
        <G d="M44 66C44 72 54 72 54 66Z" r="silgi" k={k} ofset={1} sw={2} />
        <G d="M6 28C6 20 14 16 22 18C30 20 32 28 30 36L28 44C26 48 18 50 12 46C6 42 6 34 6 28Z" r="beyaz" k={k} ofset={3} />
        <G d="M8 40C8 36 14 34 20 36C26 38 28 42 26 46C24 50 14 50 10 48C8 46 8 44 8 40Z" r="silgi" k={k} ofset={1} sw={2.2} />
        <P d="M12 18L8 8L16 14ZM24 18L28 8L22 14Z" r="krem" />
        <P d="M28 22C34 20 38 22 38 26C34 28 30 28 28 26Z" r="beyaz" />
        <D x={16} y={28} rr={1.8} r="lastik" t="kontur" />
        <g fill={ton('lastik').kontur}>
          <rect x="25" y="86" width="10" height="5" rx="1.5" />
          <rect x="73" y="86" width="10" height="5" rx="1.5" />
        </g>
      </g>
    ),
  },
  {
    id: 'kanat',
    sozcuk: 'kanat',
    taslakNo: 65,
    aciklama: 'açık kuş kanadı (tüyleri belirgin)',
    risk: 'yuksek',
    ciz: (k) => (
      <g>
        <G
          d="M8 72C20 40 50 18 92 12C88 24 82 32 74 36C80 40 78 46 70 48C74 54 70 58 62 58C64 66 58 70 50 68C50 76 44 80 36 78C34 86 26 88 20 84C14 86 8 80 8 72Z"
          r="beyaz"
          k={k}
          isik={<Isik d="M16 64C26 44 46 28 76 20C56 30 38 44 26 62Z" r="beyaz" />}
        />
        <C d="M74 36C62 40 52 46 44 54M70 48C60 52 52 58 46 64M62 58C54 62 48 66 42 72M50 68C44 72 40 76 34 80" r="tas" t="golge" w={2} />
      </g>
    )
  },
  {
    id: 'kilit',
    sozcuk: 'kilit',
    taslakNo: 66,
    aciklama: 'asma kilit (anahtar deliği)',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <Zemin rx={30} />
        <path d="M32 46V30C32 18 40 10 50 10C60 10 68 18 68 30V46" fill="none" stroke={ton('metal').kontur} strokeWidth="13" />
        <path d="M32 46V30C32 18 40 10 50 10C60 10 68 18 68 30V46" fill="none" stroke={ton('metal').temel} strokeWidth="7" />
        <G
          d={yuvarlakDikdortgen(18, 42, 64, 48, 9)}
          r="kalem"
          k={k}
          isik={<Isik d="M24 48H34V82H24Z" r="kalem" />}
        />
        <G d="M44 60C44 52 56 52 56 60C56 63 54 65 53 66L55 76H45L47 66C46 65 44 63 44 60Z" r="lastik" k={k} ofset={1} sw={1.6} />
      </g>
    ),
  },
  {
    id: 'tekne',
    sozcuk: 'tekne',
    taslakNo: 67,
    aciklama: 'yelkenli küçük tekne, dalga üstünde',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <G d="M48 8V64H52V8Z" r="sap" k={k} ofset={1} sw={2.4} />
        <G d="M54 12C70 26 80 44 82 58H54Z" r="beyaz" k={k} ofset={3} />
        <G d="M46 20C36 32 28 46 24 58H46Z" r="sari" k={k} ofset={3} />
        <G d="M8 62H92C88 76 78 84 64 84H34C20 84 12 76 8 62Z" r="balik" k={k} isik={<Isik d="M12 64H88V68H13Z" r="balik" />} />
        <C d="M6 90C14 86 20 86 28 90C36 94 42 94 50 90C58 86 64 86 72 90C80 94 86 94 94 90" r="top" t="temel" w={3.4} />
      </g>
    ),
  },
  {
    id: 'tilki',
    sozcuk: 'tilki',
    taslakNo: 68,
    aciklama: 'oturan turuncu tilki, beyaz uçlu gür kuyruk',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <Zemin rx={34} />
        <G
          d="M58 88C76 90 92 82 92 66C92 54 84 46 78 50C82 58 80 70 70 74C64 76 60 80 58 88Z"
          r="balik"
          k={k}
          ic={<path d="M76 46C90 46 96 56 94 66L82 64C84 58 82 52 76 50Z" fill={ton('beyaz').temel} />}
        />
        <G d="M30 90C24 76 26 58 36 50C46 44 60 48 64 60C68 72 66 84 60 90Z" r="balik" k={k} />
        <G d="M38 90C36 80 38 70 46 66C52 70 54 80 52 90Z" r="beyaz" k={k} ofset={2} sw={2.4} />
        <G d="M24 30L20 8L36 20ZM60 20L76 8L72 30Z" r="balik" k={k} ofset={2} sw={2.6} />
        <G d="M22 28C24 16 36 14 48 14C60 14 72 16 74 28C76 40 62 48 48 58C34 48 20 40 22 28Z" r="balik" k={k} />
        <G d="M30 36C38 38 44 42 48 58C52 42 58 38 66 36C64 46 56 52 48 58C40 52 32 46 30 36Z" r="beyaz" k={k} ofset={1} sw={2} />
        <D x={48} y={56} rr={3} r="lastik" t="temel" />
        <D x={38} y={30} rr={2.4} r="lastik" t="kontur" />
        <D x={58} y={30} rr={2.4} r="lastik" t="kontur" />
      </g>
    ),
  },
  {
    id: 'un',
    sozcuk: 'un',
    taslakNo: 69,
    aciklama: 'ağzı açık çuvalda un ve kepçe; önünde un yığını',
    risk: 'yuksek',
    ciz: (k) => (
      <g>
        <Zemin rx={40} />
        <G d="M22 34C18 52 16 72 20 90H74C78 72 76 52 72 34Z" r="ahsap" k={k} ofset={4} />
        <G d="M18 32C18 26 32 22 47 22C62 22 76 26 76 32C76 38 62 40 47 40C32 40 18 38 18 32Z" r="ahsap" k={k} ofset={2} sw={2.6} />
        <G d="M24 32C26 22 36 16 47 16C58 16 68 22 70 32C62 36 32 36 24 32Z" r="beyaz" k={k} ofset={2} sw={2.4} />
        <G d="M60 92C60 82 70 76 80 76C90 76 96 84 96 92Z" r="beyaz" k={k} ofset={2} sw={2.6} />
        <C d="M30 50C40 54 54 54 64 50" r="ahsap" t="golge" w={2} />
        <D x={84} y={70} rr={1.6} r="beyaz" t="golge" />
        <D x={70} y={72} rr={1.2} r="beyaz" t="golge" />
      </g>
    ),
  },
  {
    id: 'kule',
    sozcuk: 'kule',
    taslakNo: 71,
    aciklama: 'sivri çatılı, pencereli yüksek taş kule',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M34 36H66V94H34Z" r="tas" k={k} />
        <G d="M28 36L50 4L72 36Z" r="kalem" k={k} ofset={3} />
        <G d="M44 46C44 40 56 40 56 46V56H44Z" r="lastik" k={k} ofset={1} sw={2.4} />
        <G d="M44 66C44 60 56 60 56 66V76H44Z" r="lastik" k={k} ofset={1} sw={2.4} />
        <G d="M42 94V86C42 80 58 80 58 86V94Z" r="sap" k={k} ofset={1} sw={2.4} />
        <C d="M34 60H40M60 60H66M34 80H40M60 80H66M34 44H40M60 50H66" r="tas" t="golge" w={1.6} />
      </g>
    ),
  },
  {
    id: 'kutu',
    sozcuk: 'kutu',
    taslakNo: 72,
    aciklama: 'kapağı açık karton kutu',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <Zemin rx={40} />
        <G d="M14 40L50 50V92L14 80Z" r="ahsap" k={k} ofset={3} />
        <G d="M50 50L86 40V80L50 92Z" r="ahsap" k={k} ofset={3} ic={<path d="M50 40H90V96H50Z" fill={ton('ahsap').golge} />} />
        <G d="M14 40L50 30L86 40L50 50Z" r="toprak" k={k} ofset={1} sw={2.6} />
        <G d="M14 40L4 26L40 18L50 30Z" r="ahsap" k={k} ofset={2} sw={2.6} />
        <G d="M86 40L96 26L60 18L50 30Z" r="ahsap" k={k} ofset={2} sw={2.6} />
      </g>
    ),
  },
  {
    id: 'koltuk',
    sozcuk: 'koltuk',
    taslakNo: 75,
    aciklama: 'tek kişilik kollu koltuk',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Zemin rx={40} />
        <C d="M20 84V92M80 84V92" r="sap" t="temel" w={5} />
        <G d={yuvarlakDikdortgen(22, 18, 56, 52, 12)} r="kelebek" k={k} />
        <G d={yuvarlakDikdortgen(22, 58, 56, 18, 6)} r="kelebek" k={k} ofset={3} />
        <G d={yuvarlakDikdortgen(8, 46, 18, 42, 8)} r="kelebek" k={k} ofset={3} />
        <G d={yuvarlakDikdortgen(74, 46, 18, 42, 8)} r="kelebek" k={k} ofset={3} />
        <G d="M26 76H74V88H26Z" r="kelebek" k={k} ofset={2} sw={2.6} />
      </g>
    ),
  },
  {
    id: 'kukla',
    sozcuk: 'kukla',
    taslakNo: 77,
    aciklama: 'iplerle oynatılan tahta kukla ve tutacağı',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M20 6H80V12H20ZM46 2H54V20H46Z" r="ahsap" k={k} ofset={1} sw={2.2} />
        <C d="M24 12L22 54M76 12L78 54M50 20V24M34 12L38 86M66 12L62 86" r="murekkep" t="temel" w={1} />
        <G d="M38 40H62L66 70H34Z" r="top" k={k} ofset={3} />
        <C d="M38 44L22 54M62 44L78 54" r="ten" t="kontur" w={6} />
        <C d="M38 44L22 54M62 44L78 54" r="ten" t="temel" w={3} />
        <C d="M42 70L38 86M58 70L62 86" r="sap" t="kontur" w={6} />
        <C d="M42 70L38 86M58 70L62 86" r="sap" t="temel" w={3} />
        <G d={daire(50, 30, 10)} r="ten" k={k} ofset={2} />
        <P d="M40 28C40 18 60 18 60 28C56 24 44 24 40 28Z" r="sari" />
        <Yuz x={50} y={31} o={0.8} />
        <D x={44} y={34} rr={1.6} r="balon" t="isik" />
        <D x={56} y={34} rr={1.6} r="balon" t="isik" />
      </g>
    ),
  },
  {
    id: 'kulak',
    sozcuk: 'kulak',
    taslakNo: 78,
    aciklama: 'insan kulağı (yandan)',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <G
          d="M30 40C30 20 44 8 60 8C78 8 88 22 86 40C84 54 72 58 68 66C64 76 64 90 50 92C38 94 32 84 36 76C40 70 44 70 46 62C40 58 30 54 30 40Z"
          r="ten"
          k={k}
        />
        <C d="M44 40C44 28 52 22 62 22C72 22 76 30 74 40C72 48 64 50 62 56" r="ten" t="kontur" w={2.4} />
        <C d="M56 40C56 34 62 32 64 38C64 44 58 46 56 52C54 58 50 62 48 66" r="ten" t="golge" w={3} />
      </g>
    ),
  },
  {
    id: 'okul',
    sozcuk: 'okul',
    taslakNo: 79,
    aciklama: 'saatli ve zilli okul binası, merdivenli kapı',
    risk: 'yuksek',
    ciz: (k) => (
      <g>
        <G d="M6 46H94V92H6Z" r="kalem" k={k} ofset={4} />
        <G d="M2 48L50 26L98 48Z" r="balik" k={k} ofset={3} />
        <G d="M38 30H62V14H38Z" r="kalem" k={k} ofset={2} sw={2.6} />
        <G d="M34 16L50 4L66 16Z" r="balik" k={k} ofset={2} sw={2.6} />
        <G d={daire(50, 38, 7)} r="beyaz" k={k} ofset={1} sw={2.4} />
        <C d="M50 38V34M50 38H53" r="lastik" t="kontur" w={1.6} />
        <G d="M44 26C44 20 56 20 56 26Z" r="gobek" k={k} ofset={1} sw={2} />
        <G d="M42 92V68C42 62 58 62 58 68V92Z" r="sap" k={k} ofset={2} sw={2.6} />
        <G d="M12 56H32V70H12ZM68 56H88V70H68ZM12 76H32V88H12ZM68 76H88V88H68Z" r="cam" k={k} ofset={1} sw={2.2} />
        <C d="M22 56V70M78 56V70M22 76V88M78 76V88" r="cam" t="kontur" w={1.4} />
        <G d="M36 92H64V96H36Z" r="tas" k={k} ofset={1} sw={2} />
      </g>
    ),
  },
  {
    id: 'tutkal',
    sozcuk: 'tutkal',
    taslakNo: 80,
    aciklama: 'sivri kapaklı beyaz yapıştırıcı şişesi ve damla',
    risk: 'yuksek',
    ciz: (k) => (
      <g>
        <Zemin rx={26} />
        <G d="M44 6L50 4L56 6L58 24H42Z" r="kus" k={k} ofset={1} sw={2.4} />
        <G d="M36 22H64V32H36Z" r="kus" k={k} ofset={1} sw={2.4} />
        <G d={yuvarlakDikdortgen(28, 30, 44, 62, 10)} r="beyaz" k={k} isik={<Isik d="M32 36H40V86H32Z" r="beyaz" />} />
        <G d={yuvarlakDikdortgen(34, 48, 32, 26, 6)} r="kus" k={k} ofset={2} sw={2.2} />
        <G d="M80 64C80 58 84 50 84 50C84 50 88 58 88 64C88 68 86 70 84 70C82 70 80 68 80 64Z" r="beyaz" k={k} ofset={1} sw={2} />
      </g>
    ),
  },
  {
    id: 'kare',
    sozcuk: 'kare',
    taslakNo: 82,
    aciklama: 'mavi kare (geometrik şekil)',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <G d="M18 18H82V82H18Z" r="top" k={k} ofset={5} isik={<Isik d="M22 22H40V26H26V40H22Z" r="top" />} />
      </g>
    ),
  },
  {
    id: 'kar',
    sozcuk: 'kar',
    taslakNo: 84,
    aciklama: 'kar tanesi',
    risk: 'yuksek',
    ciz: () => {
      const kol = 'M50 50V10M50 22L42 14M50 22L58 14M50 34L40 26M50 34L60 26';
      return (
        <g>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <g key={a} transform={`rotate(${a} 50 50)`}>
              <path d={kol} fill="none" stroke={ton('top').kontur} strokeWidth="8" strokeLinecap="round" />
            </g>
          ))}
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <g key={`i${a}`} transform={`rotate(${a} 50 50)`}>
              <path d={kol} fill="none" stroke={ton('cam').temel} strokeWidth="3.6" strokeLinecap="round" />
            </g>
          ))}
          <circle cx="50" cy="50" r="7" fill={ton('cam').temel} stroke={ton('top').kontur} strokeWidth="2.4" />
        </g>
      );
    },
  },
  {
    id: 'nar',
    sozcuk: 'nar',
    taslakNo: 85,
    aciklama: 'taçlı bütün nar ve yarım nar taneleri',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Zemin rx={34} />
        <G d="M38 20L34 8L42 14L46 6L50 14L56 8L56 20Z" r="elma" k={k} ofset={1} sw={2.4} />
        <G
          d="M46 18C66 16 82 32 82 52C82 74 66 90 46 90C26 90 12 74 12 54C12 34 26 20 46 18Z"
          r="elma"
          k={k}
          isik={<Isik d="M22 46C24 36 30 28 38 26C32 34 28 42 28 52Z" r="elma" />}
        />
        <G d="M58 74C58 62 68 56 80 56C92 56 98 64 98 74C98 86 90 94 78 94C66 94 58 86 58 74Z" r="krem" k={k} ofset={2} sw={2.6} />
        <g fill={ton('elma').temel} stroke={ton('elma').kontur} strokeWidth="1">
          <circle cx="70" cy="70" r="3" />
          <circle cx="78" cy="66" r="3" />
          <circle cx="86" cy="70" r="3" />
          <circle cx="74" cy="78" r="3" />
          <circle cx="82" cy="78" r="3" />
          <circle cx="90" cy="78" r="3" />
          <circle cx="78" cy="86" r="3" />
          <circle cx="86" cy="86" r="3" />
        </g>
      </g>
    ),
  },
  {
    id: 'erik',
    sozcuk: 'erik',
    taslakNo: 88,
    aciklama: 'saplı, yapraklı mor erik',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Zemin rx={28} />
        <G
          d="M50 26C70 24 82 40 80 58C78 78 64 90 48 90C32 90 20 78 20 60C20 42 32 28 50 26Z"
          r="kelebek"
          k={k}
          isik={<Isik d="M30 52C30 42 36 36 42 34C38 40 36 48 36 56Z" r="kelebek" />}
        />
        <C d="M50 28C46 42 46 60 50 86" r="kelebek" t="golge" w={2} />
        <C d="M50 28C52 20 54 14 58 8" r="sap" t="temel" w={3.4} />
        <G d={yaprakD(56, 16)} r="yaprak" k={k} ofset={2} sw={2.2} />
      </g>
    ),
  },
  {
    id: 'kartal',
    sozcuk: 'kartal',
    taslakNo: 90,
    aciklama: 'dalda tünemiş, beyaz başlı, kanca gagalı kartal',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M6 84H94V90H6Z" r="sap" k={k} ofset={1} sw={2.4} />
        <G d="M44 76L40 92L52 92L56 76Z" r="sap" k={k} ofset={2} sw={2.4} />
        <G d="M30 40C30 30 40 28 54 30C70 32 78 44 76 60C74 72 66 80 54 80C40 80 30 70 30 56Z" r="sap" k={k} />
        <G d="M56 40C70 42 84 56 84 74L70 70C68 58 62 50 56 48Z" r="govde" k={k} ofset={2} />
        <C d="M44 82V88M52 82V88" r="gaga" t="kontur" w={5} />
        <C d="M44 82V88M52 82V88" r="gaga" t="temel" w={2.6} />
        <G d="M26 26C26 14 36 8 46 10C56 12 60 22 56 32C52 40 38 42 32 38C28 36 26 32 26 26Z" r="beyaz" k={k} ofset={3} />
        <G d="M16 22C18 16 24 14 30 16L30 28C26 28 22 30 20 32C18 28 16 26 16 22Z" r="gaga" k={k} ofset={1} sw={2.4} />
        <D x={36} y={20} rr={2.4} r="lastik" t="kontur" />
        <C d="M33 17L40 16" r="lastik" t="kontur" w={1.6} />
      </g>
    ),
  },
  {
    id: 'terlik',
    sozcuk: 'terlik',
    taslakNo: 91,
    aciklama: 'bir çift ev terliği (üstten)',
    risk: 'orta',
    ciz: (k) => (
      <g>
        {[
          [14, -8],
          [54, 8],
        ].map(([x, a]) => (
          <g key={x} transform={`rotate(${a} ${x + 16} 50)`}>
            <G d={`M${x} 26C${x} 12 ${x + 32} 12 ${x + 32} 26V78C${x + 32} 92 ${x} 92 ${x} 78Z`} r="krem" k={k} ofset={2} sw={2.8} />
            <G d={`M${x - 2} 30C${x - 2} 16 ${x + 34} 16 ${x + 34} 30V50C${x + 22} 54 ${x + 10} 54 ${x - 2} 50Z`} r="kumas" k={k} ofset={3} />
          </g>
        ))}
      </g>
    ),
  },
  {
    id: 'tekerlek',
    sozcuk: 'tekerlek',
    taslakNo: 92,
    aciklama: 'jantlı lastik tekerlek',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <Zemin rx={30} cy={95} />
        <G d={daire(50, 50, 42)} r="lastik" k={k} />
        <G d={daire(50, 50, 24)} r="jant" k={k} ofset={3} />
        <C d="M50 30V70M30 50H70M36 36L64 64M64 36L36 64" r="jant" t="golge" w={3} />
        <G d={daire(50, 50, 7)} r="metal" k={k} ofset={1} sw={2.4} />
        <C d="M20 40C22 32 28 24 36 20" r="lastik" t="isik" w={2.4} />
      </g>
    ),
  },
  {
    id: 'kral',
    sozcuk: 'kral',
    taslakNo: 94,
    aciklama: 'taçlı ve pelerinli, sakallı masal kralı (büst)',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M12 98C12 66 28 54 50 54C72 54 88 66 88 98Z" r="kelebek" k={k} />
        <G d="M38 56H62L58 98H42Z" r="beyaz" k={k} ofset={2} sw={2.4} />
        <G d={daire(50, 40, 16)} r="ten" k={k} ofset={3} />
        <G d="M34 42C36 58 44 64 50 64C56 64 64 58 66 42C60 50 40 50 34 42Z" r="beyaz" k={k} ofset={2} sw={2.4} />
        <Yuz x={50} y={38} o={1} />
        <G d="M32 28L30 8L40 18L50 4L60 18L70 8L68 28Z" r="yildiz" k={k} ofset={2} />
        <D x={50} y={20} rr={2.6} r="elma" />
      </g>
    ),
  },
  {
    id: 'kurt',
    sozcuk: 'kurt',
    taslakNo: 95,
    aciklama: 'aya doğru başını kaldırıp uluyan gri kurt',
    risk: 'yuksek',
    ciz: (k) => (
      <g>
        <Zemin rx={34} />
        <G d="M78 6C90 10 94 26 84 34C78 38 68 36 64 30C74 30 82 20 78 6Z" r="far" k={k} ofset={2} sw={2.4} />
        <G d="M58 88C72 90 88 86 92 76C84 76 74 78 64 78Z" r="tas" k={k} ofset={2} sw={2.6} />
        <G d="M30 92C26 74 30 58 40 50C50 44 62 50 66 64C70 78 68 88 62 92Z" r="tas" k={k} />
        <G d="M36 92C34 78 38 66 44 60C48 68 50 82 48 92Z" r="agir" k={k} ofset={2} sw={2.4} />
        <G d="M40 56C36 46 32 38 26 30L16 14C18 12 22 12 24 14L34 24L38 12L44 24C50 32 54 42 54 54Z" r="tas" k={k} />
        <C d="M19 18L27 26" r="lastik" t="kontur" w={2} />
        <D x={33} y={28} rr={1.8} r="lastik" t="kontur" />
      </g>
    )
  },
  {
    id: 'tren',
    sozcuk: 'tren',
    taslakNo: 97,
    aciklama: 'bacalı lokomotif ve vagon, raylarda',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <C d="M2 90H98" r="sap" t="temel" w={3} />
        <G d="M6 46H34V30H48V46H58V80H6Z" r="araba" k={k} />
        <G d="M38 34H46V42H38Z" r="cam" k={k} ofset={1} sw={2} />
        <G d="M12 22H24V46H12Z" r="lastik" k={k} ofset={1} sw={2.4} />
        <G d="M8 16H28V22H8Z" r="lastik" k={k} ofset={1} sw={2.2} />
        <G d="M62 40H96V80H62Z" r="top" k={k} />
        <G d="M68 48H78V58H68ZM82 48H92V58H82Z" r="cam" k={k} ofset={1} sw={2} />
        <C d="M58 72H62" r="lastik" t="kontur" w={3} />
        {[16, 40, 72, 88].map((x) => (
          <g key={x}>
            <circle cx={x} cy="82" r="8" fill={ton('lastik').temel} stroke={ton('lastik').kontur} strokeWidth="3" />
            <circle cx={x} cy="82" r="3" fill={ton('jant').temel} />
          </g>
        ))}
      </g>
    ),
  },
  {
    id: 'ari',
    sozcuk: 'arı',
    taslakNo: 99,
    aciklama: 'çizgili bal arısı, kanatlı',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <Zemin rx={22} cy={94} />
        <G d="M44 40C38 22 50 10 60 14C68 18 64 32 54 42Z" r="cam" k={k} ofset={2} sw={2.4} />
        <G d="M54 42C60 26 76 22 82 30C86 38 74 46 60 46Z" r="cam" k={k} ofset={2} sw={2.4} />
        <G
          d="M20 62C20 48 34 40 52 40C72 40 86 50 86 62C86 76 70 82 52 82C34 82 20 76 20 62Z"
          r="sari"
          k={k}
          ic={
            <g fill={ton('lastik').temel}>
              <path d="M42 36H52V86H42ZM60 36H70V86H60Z" />
            </g>
          }
        />
        <P d="M86 60L96 62L86 66Z" r="lastik" />
        <G d={daire(22, 58, 13)} r="lastik" k={k} ofset={2} />
        <D x={18} y={55} rr={2.6} r="beyaz" />
        <C d="M16 46C12 38 10 34 6 32M24 45C24 38 26 34 28 30" r="lastik" t="kontur" w={2} />
      </g>
    ),
  },
  {
    id: 'altin',
    sozcuk: 'altın',
    taslakNo: 101,
    aciklama: 'üst üste altın külçeleri',
    risk: 'orta',
    ciz: (k) => {
      const kulce = (x: number, y: number) => `M${x} ${y + 22}L${x + 6} ${y}H${x + 32}L${x + 38} ${y + 22}Z`;
      return (
        <g>
          <Zemin rx={42} />
          <G d={kulce(8, 66)} r="yildiz" k={k} ofset={3} />
          <G d={kulce(54, 66)} r="yildiz" k={k} ofset={3} />
          <G d={kulce(31, 42)} r="yildiz" k={k} ofset={3} />
          <C d="M18 72H36M64 72H82M41 48H59" r="yildiz" t="isik" w={2.6} />
          <P d="M20 24L22 30L28 32L22 34L20 40L18 34L12 32L18 30Z" r="far" sw={1.6} />
          <P d="M78 18L79.5 22L84 23.5L79.5 25L78 29L76.5 25L72 23.5L76.5 22Z" r="far" sw={1.4} />
        </g>
      );
    },
  },
  {
    id: 'tirnak',
    sozcuk: 'tırnak',
    taslakNo: 105,
    aciklama: 'yakın plan parmak ucu ve tırnağı',
    risk: 'yuksek',
    ciz: (k) => (
      <g>
        <G d="M28 96V36C28 18 38 8 50 8C62 8 72 18 72 36V96Z" r="ten" k={k} />
        <G
          d="M36 40V22C36 14 42 12 50 12C58 12 64 14 64 22V40C64 46 58 48 50 48C42 48 36 46 36 40Z"
          r="silgi"
          k={k}
          ofset={3}
          isik={<Isik d="M40 18C44 15 48 15 50 15C46 18 44 24 44 32H40Z" r="silgi" />}
        />
        <C d="M38 20C44 16 56 16 62 20" r="krem" t="temel" w={3} />
        <C d="M36 64C44 68 56 68 64 64M38 76C46 79 54 79 62 76" r="ten" t="golge" w={1.8} />
      </g>
    ),
  },
  {
    id: 'tirtil',
    sozcuk: 'tırtıl',
    taslakNo: 106,
    aciklama: 'boğumlu yeşil tırtıl, yaprak üstünde',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M4 86C20 70 60 68 96 80C70 94 30 96 4 86Z" r="yaprak" k={k} ofset={3} />
        <C d="M8 86C34 80 64 80 92 81" r="yaprak" t="golge" w={2} />
        {[
          [80, 66],
          [68, 62],
          [56, 66],
          [44, 62],
          [32, 66],
        ].map(([x, y]) => (
          <G key={x} d={daire(x, y, 9)} r="araba" k={k} ofset={2} sw={2.6} />
        ))}
        <G d={daire(20, 56, 12)} r="araba" k={k} ofset={3} />
        <C d="M16 45L12 36M24 45L28 36" r="lastik" t="kontur" w={2} />
        <D x={16} y={54} rr={2} r="lastik" t="kontur" />
        <D x={25} y={54} rr={2} r="lastik" t="kontur" />
        <C d="M16 61Q20 64 24 61" r="lastik" t="kontur" w={1.6} />
      </g>
    ),
  },
  {
    id: 'kirlent',
    sozcuk: 'kırlent',
    taslakNo: 109,
    aciklama: 'köşeleri püsküllü, desenli kare kırlent',
    risk: 'yuksek',
    ciz: (k) => (
      <g>
        <C d="M14 14L6 6M86 14L94 6M14 86L6 94M86 86L94 94" r="sari" t="golge" w={4} />
        <G
          d="M14 14C34 20 66 20 86 14C80 34 80 66 86 86C66 80 34 80 14 86C20 66 20 34 14 14Z"
          r="balik"
          k={k}
          isik={<Isik d="M20 22C30 26 40 26 48 26C38 30 30 40 26 50C24 40 22 30 20 22Z" r="balik" />}
        />
        <G d="M50 34L66 50L50 66L34 50Z" r="sari" k={k} ofset={2} sw={2.4} />
        <D x={50} y={50} rr={4} r="balik" t="golge" />
      </g>
    ),
  },
  {
    id: 'elma',
    sozcuk: 'elma',
    taslakNo: 110,
    aciklama: 'yapraklı kırmızı elma (matematik nesnesiyle aynı çizim)',
    risk: 'dusuk',
    ciz: () => <NesneSpritei ad="elma" />,
  },
  {
    id: 'kamera',
    sozcuk: 'kamera',
    taslakNo: 111,
    aciklama: 'büyük mercekli kamera',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Zemin rx={40} />
        <G d="M30 22H48V32H30Z" r="lastik" k={k} ofset={1} sw={2.4} />
        <G d={yuvarlakDikdortgen(8, 30, 84, 56, 10)} r="lastik" k={k} />
        <G d="M66 30H84V40H66Z" r="jant" k={k} ofset={1} sw={2} />
        <G d={daire(50, 58, 21)} r="metal" k={k} ofset={3} />
        <G d={daire(50, 58, 13)} r="top" k={k} ofset={3} sw={2.6} />
        <D x={45} y={53} rr={4} r="cam" />
        <D x={18} y={40} rr={3} r="elma" />
      </g>
    ),
  },
  {
    id: 'mum',
    sozcuk: 'mum',
    taslakNo: 113,
    aciklama: 'yanan mum, altlıkta',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <G d="M14 84C14 78 30 76 50 76C70 76 86 78 86 84C86 90 70 92 50 92C30 92 14 90 14 84Z" r="metal" k={k} ofset={2} sw={2.6} />
        <G d="M36 36H64V84H36Z" r="beyaz" k={k} isik={<Isik d="M38 38H44V82H38Z" r="beyaz" />} />
        <P d="M58 36C58 44 62 46 62 52C62 56 58 56 58 52V36Z" r="beyaz" t="golge" sw={1.8} />
        <C d="M50 36V30" r="lastik" t="kontur" w={2.4} />
        <G d="M50 6C56 14 60 20 60 26C60 32 56 34 50 34C44 34 40 32 40 26C40 20 44 14 50 6Z" r="gaga" k={k} ofset={2} sw={2.4} />
        <P d="M50 18C53 22 54 25 54 28C54 30 52 31 50 31C48 31 46 30 46 28C46 25 47 22 50 18Z" r="far" sw={0} />
      </g>
    ),
  },
  {
    id: 'ekmek',
    sozcuk: 'ekmek',
    taslakNo: 114,
    aciklama: 'çizikli somun ekmek',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <Zemin rx={42} cy={88} />
        <G
          d="M8 66C8 46 26 32 50 32C74 32 92 46 92 66C92 78 76 84 50 84C24 84 8 78 8 66Z"
          r="gobek"
          k={k}
          isik={<Isik d="M18 54C22 44 32 38 44 36C34 42 26 50 24 60Z" r="gobek" />}
        />
        <C d="M28 46L36 62M44 40L52 58M60 40L68 58M74 46L80 60" r="gobek" t="kontur" w={2.4} />
        <C d="M29 48L35 60M45 42L51 56M61 42L67 56" r="krem" t="temel" w={1.6} />
      </g>
    ),
  },
  {
    id: 'kalem',
    sozcuk: 'kalem',
    taslakNo: 115,
    aciklama: 'silgili kurşun kalem (matematik nesnesiyle aynı çizim)',
    risk: 'dusuk',
    ciz: () => <NesneSpritei ad="kalem" />,
  },
  {
    id: 'limon',
    sozcuk: 'limon',
    taslakNo: 116,
    aciklama: 'sarı limon ve dilimi',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <Zemin rx={40} />
        <G
          d="M6 52C6 50 8 48 10 46C16 32 30 24 46 24C62 24 74 32 78 46C80 48 82 50 82 52C82 54 80 56 78 58C74 72 62 80 46 80C30 80 16 72 10 58C8 56 6 54 6 52Z"
          r="sari"
          k={k}
          isik={<Isik d="M20 46C24 36 32 30 42 30C34 34 28 40 26 48Z" r="sari" />}
        />
        <G d="M58 92C58 76 70 66 84 66C96 66 98 76 98 92Z" r="sari" k={k} ofset={2} sw={2.6} />
        <G d="M63 90C63 78 72 71 82 71C92 71 93 80 93 90Z" r="krem" k={k} ofset={1} sw={1.6} />
        <C d="M78 90L74 76M78 90L84 74M78 90L91 80M78 90L66 82" r="sari" t="golge" w={1.6} />
      </g>
    ),
  },
  {
    id: 'mantar',
    sozcuk: 'mantar',
    taslakNo: 117,
    aciklama: 'benekli şapkalı mantar',
    risk: 'dusuk',
    ciz: (k) => (
      <g>
        <Zemin rx={26} />
        <G d="M40 52H60L64 88C56 92 44 92 36 88Z" r="krem" k={k} ofset={3} />
        <G
          d="M8 54C8 30 28 12 50 12C72 12 92 30 92 54C80 60 20 60 8 54Z"
          r="balik"
          k={k}
          isik={<Isik d="M20 40C24 28 34 20 44 18C36 26 30 34 28 44Z" r="balik" />}
        />
        <g fill={ton('krem').temel} stroke={ton('balik').kontur} strokeWidth="1.6">
          <circle cx="36" cy="30" r="5" />
          <circle cx="62" cy="26" r="6" />
          <circle cx="76" cy="44" r="4" />
          <circle cx="24" cy="48" r="3.5" />
          <circle cx="50" cy="46" r="4" />
        </g>
      </g>
    ),
  },
  {
    id: 'marul',
    sozcuk: 'marul',
    taslakNo: 118,
    aciklama: 'uzun yapraklı baş marul',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Zemin rx={26} />
        <G d="M40 92C24 80 18 56 24 30C32 44 38 66 46 92Z" r="nane" k={k} ofset={3} />
        <G d="M60 92C76 80 82 56 76 30C68 44 62 66 54 92Z" r="nane" k={k} ofset={3} />
        <G d="M38 92C30 70 30 40 40 14C46 34 48 64 48 92Z" r="yaprak" k={k} ofset={3} />
        <G d="M62 92C70 70 70 40 60 14C54 34 52 64 52 92Z" r="yaprak" k={k} ofset={3} />
        <G d="M42 92C38 64 42 30 50 8C58 30 62 64 58 92Z" r="nane" k={k} isik={<Isik d="M46 40C47 30 48 22 50 16C49 28 49 40 49 52Z" r="nane" />} />
        <C d="M50 20V90M50 50L44 42M50 64L56 56M50 76L44 68" r="krem" t="temel" w={2} />
      </g>
    ),
  },
  {
    id: 'motor',
    sozcuk: 'motor',
    taslakNo: 121,
    aciklama: 'yandan motosiklet',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <Zemin rx={44} cy={92} />
        {[20, 80].map((x) => (
          <g key={x}>
            <circle cx={x} cy="72" r="15" fill={ton('lastik').temel} stroke={ton('lastik').kontur} strokeWidth="3.5" />
            <circle cx={x} cy="72" r="6" fill={ton('jant').temel} />
          </g>
        ))}
        <C d="M80 72L70 40H62" r="metal" t="kontur" w={5} />
        <C d="M80 72L70 40H62" r="metal" t="temel" w={2.4} />
        <G d="M30 52C30 44 40 40 52 40H68L66 56C60 64 44 66 36 64Z" r="elma" k={k} />
        <G d="M38 62H58V76H38Z" r="metal" k={k} ofset={2} sw={2.4} />
        <C d="M20 72H42" r="metal" t="kontur" w={3} />
        <G d="M16 46C16 40 34 40 40 42L38 50H18C16 50 16 48 16 46Z" r="lastik" k={k} ofset={1} sw={2.4} />
        <G d="M60 34H72V38H60Z" r="lastik" k={k} ofset={1} sw={2} />
        <D x={74} y={46} rr={3} r="far" />
      </g>
    ),
  },
  {
    id: 'orman',
    sozcuk: 'orman',
    taslakNo: 123,
    aciklama: 'sık ağaçlardan oluşan orman',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M2 84C20 78 80 78 98 84V96H2Z" r="nane" k={k} ofset={2} sw={2.6} />
        <Agac k={k} x={22} y={52} s={0.95} />
        <Agac k={k} x={78} y={52} s={0.95} />
        <Agac k={k} x={50} y={46} s={1.15} />
        <Agac k={k} x={34} y={70} s={0.8} />
        <Agac k={k} x={66} y={70} s={0.8} />
      </g>
    ),
  },
  {
    id: 'makarna',
    sozcuk: 'makarna',
    taslakNo: 125,
    aciklama: 'tabakta spagetti makarna ve çatal',
    risk: 'orta',
    ciz: (k) => (
      <g>
        <G d="M2 64C2 56 24 50 50 50C76 50 98 56 98 64C98 76 76 84 50 84C24 84 2 76 2 64Z" r="beyaz" k={k} ofset={3} />
        <G d="M14 62C14 46 30 34 50 34C70 34 86 46 86 62C76 70 24 70 14 62Z" r="sari" k={k} />
        <C
          d="M20 58C28 46 40 50 34 58C28 66 48 66 46 52C44 40 58 42 56 54C54 64 72 64 68 52C64 42 78 44 80 58M30 48C38 40 48 40 54 44M60 42C68 42 74 46 76 52"
          r="sari"
          t="kontur"
          w={1.6}
        />
        <C d="M64 36L84 8" r="metal" t="kontur" w={5} />
        <C d="M64 36L84 8" r="metal" t="temel" w={2.4} />
        <C d="M80 6L88 12M78 9L86 15M83 3L91 9" r="metal" t="kontur" w={1.8} />
      </g>
    ),
  },
];

/** Resimle karışıklıksız gösterilemeyen resimli adaylar (öğretmene sorulur). */
export const GRUP2_RESIMSIZ: readonly ResimsizTanimi[] = [
  {
    sozcuk: 'oto',
    taslakNo: 49,
    neden: 'Resimde çocuk "araba" der; "oto" ile "araba" tek resme düşer.',
  },
  {
    sozcuk: 'otel',
    taslakNo: 52,
    neden: 'Yazısız bir otel binası apartman ya da evden ayırt edilemez (görselde metin yok).',
  },
  {
    sozcuk: 'kakao',
    taslakNo: 57,
    neden: 'Fincanda kahverengi içecek çay, kahve ya da sütlü içecekle karışır; kakao çekirdeği çocuğa tanıdık değil.',
  },
  {
    sozcuk: 'karne',
    taslakNo: 89,
    neden: 'Karne ancak yazı ve notlarla tanınır; görselde metin yok.',
  },
  {
    sozcuk: 'tatlı',
    taslakNo: 104,
    neden: 'Üst kavram (sıfat); resimde çocuk "pasta" ya da "kek" der, "kek" görseliyle çakışır.',
  },
];
