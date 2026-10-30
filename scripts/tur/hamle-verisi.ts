/**
 * Türkçe yazılış hamle verisi üreticisi (Okuma Yazma planı Adım 63, §2.4.9). `npm run tur:hamle`
 *
 * 68 glifin (29 küçük, 29 büyük harf, 10 rakam) ORTA ÇİZGİSİ burada, kendi geometrimizle (doğru parçası, elips yayı,
 * ikinci derece Bézier) tanımlanır ve `ders-verisi/tur/hamleler.json`'a örneklenmiş nokta dizisi olarak yazılır.
 * Font konturu (TemelYazi, Kilavuz, KesikCizgi) OKUNMAZ ve kopyalanmaz; hamle sayısı, sırası ve yönü öğretmen teyit
 * tablosu taslağından (`src/content/dersler/tur/hamleTablosu.ts`) gelir. Veri öğretmen teyidi gelene dek
 * `teyit: { durum: 'bekliyor' }` taşır; `npm run validate -- --yayin` teyitsiz glifi hata sayar (yayın kapısı).
 *
 * Koordinat: satır dizgesi 0–100 birim; üst çizgi 20, kesikli kılavuz 50, taban 80, kuyruk sınırı 100 (1 cm = 60 birim).
 * Yay açıları derece, matematik yönünde (0° = saat 3, 90° = saat 12, artan açı = saatin tersine); y aşağı doğru artar.
 *
 * `hamleVerisiUret()` SAF; `tests/unit/turHamle.spec.ts` commitlenmiş JSON'un bu çıktıyla aynı olduğunu denetler.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PROGRAM_SURUMU } from '../../src/content/dersler/tur/alfabe';
import type {
  HamleTipi,
  HamleYonu,
  TurHamleDosyasi,
  TurHamleGlifi,
  TurHamle,
  GlifBicimi,
} from '../../src/content/schema/turHamle';
import { HAMLE_KOORDINATI } from '../../src/content/dersler/tur/hamleTablosu';

type N = [number, number];

/** Örnekleme adımı (birim): ardışık iki nokta arası en çok bu kadar. */
const ADIM = 3;
const y1 = (n: number): number => Math.round(n * 10) / 10 + 0; // -0 → 0

function cizgi(a: N, b: N): N[] {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / ADIM));
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n] as N);
}

/** Elips yayı: merkez (cx, cy), yarıçaplar rx, ry; `bas` → `bit` derece (artan = saatin tersine). */
function yay(cx: number, cy: number, rx: number, ry: number, bas: number, bit: number): N[] {
  const uzunluk = (Math.abs(bit - bas) * Math.PI * (rx + ry)) / 360;
  const n = Math.max(2, Math.ceil(uzunluk / ADIM));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = ((bas + ((bit - bas) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(t), cy - ry * Math.sin(t)] as N;
  });
}

/** İkinci derece Bézier. */
function bezier(p0: N, p1: N, p2: N): N[] {
  const kaba = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  const n = Math.max(2, Math.ceil(kaba / ADIM));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]] as N;
  });
}

/** Parçaları uç uca ekler; bir parçanın ilk noktası öncekinin son noktasından uzaksa araya doğru parçası girer. */
function birlestir(...parcalar: N[][]): N[] {
  const out: N[] = [];
  for (const p of parcalar) {
    if (out.length > 0) {
      const son = out[out.length - 1];
      if (Math.hypot(p[0][0] - son[0], p[0][1] - son[1]) > 0.05) out.push(...cizgi(son, p[0]).slice(1));
      out.push(...p.slice(1));
    } else out.push(...p);
  }
  return out;
}

const nokta = (x: number, y: number): N[] => cizgi([x, y], [x, y + 4]);

interface Tanim {
  tip: HamleTipi;
  yon: HamleYonu;
  aciklama: string;
  noktalar: N[];
  geriDonus?: true;
  istisna?: string;
}

const h = (tip: HamleTipi, yon: HamleYonu, aciklama: string, noktalar: N[], ek: Partial<Tanim> = {}): Tanim => ({
  tip,
  yon,
  aciklama,
  noktalar,
  ...ek,
});
const dik = (x: number, ust: number, alt: number, aciklama = 'Yukarıdan aşağı düz iner.'): Tanim =>
  h('dik', 'asagi', aciklama, cizgi([x, ust], [x, alt]));
const yatay = (x1: number, x2: number, y: number, aciklama = 'Soldan sağa düz çizer.'): Tanim =>
  h('yatay', 'saga', aciklama, cizgi([x1, y], [x2, y]));
const nok = (x: number, y: number, aciklama = 'Nokta: kısa, yukarıdan aşağı.'): Tanim =>
  h('nokta', 'asagi', aciklama, nokta(x, y));
const cengel = (x: number, aciklama = 'Çengel: tabanın altında kısa, yukarıdan aşağı.'): Tanim =>
  h('cengel', 'asagi', aciklama, nokta(x, 84));

interface GlifTanimi {
  glif: string;
  bicim: GlifBicimi;
  genislik: number;
  hamleler: Tanim[];
}

// ------------------------------------------------------------------ küçük harfler (öğretim sırasıyla)
const kucukO = () =>
  h(
    'daire',
    'saat-tersi',
    'Saat 2 hizasından başlar, saatin tersine yuvarlak çizer ve başlangıçta kapanır.',
    yay(15, 65, 12, 15, 30, 390),
  );
const kucukU = () =>
  h(
    'karma',
    'karma',
    'Kılavuzdan aşağı iner, saatin tersine çanak çizer, sağda kılavuza çıkar ve aynı çizgiden tabana iner.',
    birlestir(
      cizgi([4, 50], [4, 70]),
      yay(14, 70, 10, 10, 180, 360),
      cizgi([24, 70], [24, 50]),
      cizgi([24, 50], [24, 80]),
    ),
    { geriDonus: true },
  );
const kucukG = () => [
  h('daire', 'saat-tersi', 'Saat 2 hizasından saatin tersine yuvarlak çizer.', yay(14, 65, 12, 15, 30, 390)),
  h(
    'karma',
    'karma',
    'Sağda kılavuzdan kuyruğa iner, sola kıvrılır.',
    birlestir(cizgi([26, 50], [26, 90]), yay(19, 90, 7, 8, 0, -160)),
  ),
];
const kucukS = () =>
  h(
    'karma',
    'karma',
    'Sağ üstten saatin tersine üst yayı, saat yönünde alt yayı çizer; sol altta biter.',
    birlestir(yay(14, 57.5, 9, 7.5, 25, 270), yay(14, 72.5, 9, 7.5, 90, -160)),
  );
const kucukC = () => h('yay', 'saat-tersi', 'Sağ üstten saatin tersine açık yay çizer.', yay(15, 65, 12, 15, 40, 320));

const KUCUK: GlifTanimi[] = [
  {
    glif: 'a',
    bicim: 'kucuk',
    genislik: 28,
    hamleler: [
      h('daire', 'saat-tersi', 'Saat 2 hizasından saatin tersine yuvarlak çizer.', yay(14, 65, 12, 15, 30, 390)),
      dik(26, 50, 80, 'Sağda kılavuzdan tabana düz iner.'),
    ],
  },
  {
    glif: 'n',
    bicim: 'kucuk',
    genislik: 28,
    hamleler: [
      h(
        'karma',
        'karma',
        'Kılavuzdan tabana iner, aynı çizgiden geri çıkar, saat yönünde kemer çizip sağda tabana iner.',
        birlestir(
          cizgi([4, 50], [4, 80]),
          cizgi([4, 80], [4, 60]),
          yay(14, 60, 10, 10, 180, 0),
          cizgi([24, 60], [24, 80]),
        ),
        { geriDonus: true },
      ),
    ],
  },
  {
    glif: 'e',
    bicim: 'kucuk',
    genislik: 30,
    hamleler: [
      h(
        'karma',
        'karma',
        'Ortada soldan sağa yatay çizer, saatin tersine dönerek yuvarlağı çizer, sağ altta biter.',
        birlestir(cizgi([3, 65], [27, 65]), yay(15, 65, 12, 15, 0, 300)),
      ),
    ],
  },
  {
    glif: 't',
    bicim: 'kucuk',
    genislik: 18,
    hamleler: [
      h(
        'karma',
        'karma',
        'Üst bölgenin ortasından tabana iner, altta sağa kıvrılır.',
        birlestir(cizgi([7, 30], [7, 74]), yay(13, 74, 6, 6, 180, 290)),
      ),
      yatay(1, 15, 50, 'Kılavuzda soldan sağa kısa yatay.'),
    ],
  },
  { glif: 'i', bicim: 'kucuk', genislik: 10, hamleler: [dik(5, 50, 80, 'Kılavuzdan tabana düz iner.'), nok(5, 38)] },
  {
    glif: 'l',
    bicim: 'kucuk',
    genislik: 14,
    hamleler: [
      h(
        'karma',
        'karma',
        'Üst çizgiden tabana iner, altta sağa kıvrılır.',
        birlestir(cizgi([5, 20], [5, 74]), yay(11, 74, 6, 6, 180, 290)),
      ),
    ],
  },
  { glif: 'o', bicim: 'kucuk', genislik: 30, hamleler: [kucukO()] },
  {
    glif: 'k',
    bicim: 'kucuk',
    genislik: 26,
    hamleler: [
      dik(4, 20, 80, 'Üst çizgiden tabana düz iner.'),
      h(
        'karma',
        'karma',
        'Sağda kılavuzdan sola-aşağı gövdeye, oradan sağa-aşağı tabana.',
        birlestir(cizgi([22, 50], [5, 66]), cizgi([5, 66], [22, 80])),
      ),
    ],
  },
  { glif: 'u', bicim: 'kucuk', genislik: 28, hamleler: [kucukU()] },
  {
    glif: 'r',
    bicim: 'kucuk',
    genislik: 22,
    hamleler: [
      h(
        'karma',
        'karma',
        'Kılavuzdan tabana iner, aynı çizgiden geri çıkar, saat yönünde kısa kemer çizer.',
        birlestir(cizgi([4, 50], [4, 80]), cizgi([4, 80], [4, 60]), yay(12, 60, 8, 8, 180, 40)),
        { geriDonus: true },
      ),
    ],
  },
  {
    glif: 'ı',
    bicim: 'kucuk',
    genislik: 10,
    hamleler: [dik(5, 50, 80, 'Kılavuzdan tabana düz iner. Noktası yoktur.')],
  },
  {
    glif: 'm',
    bicim: 'kucuk',
    genislik: 40,
    hamleler: [
      h(
        'karma',
        'karma',
        'Tabana iner, geri çıkıp kemer çizerek iner, yine geri çıkıp ikinci kemeri çizerek tabana iner.',
        birlestir(
          cizgi([4, 50], [4, 80]),
          cizgi([4, 80], [4, 60]),
          yay(12, 60, 8, 8, 180, 0),
          cizgi([20, 60], [20, 80]),
          cizgi([20, 80], [20, 60]),
          yay(28, 60, 8, 8, 180, 0),
          cizgi([36, 60], [36, 80]),
        ),
        { geriDonus: true },
      ),
    ],
  },
  {
    glif: 'ü',
    bicim: 'kucuk',
    genislik: 28,
    hamleler: [kucukU(), nok(9, 38, 'Sol nokta.'), nok(19, 38, 'Sağ nokta.')],
  },
  { glif: 's', bicim: 'kucuk', genislik: 26, hamleler: [kucukS()] },
  {
    glif: 'ö',
    bicim: 'kucuk',
    genislik: 30,
    hamleler: [kucukO(), nok(10, 38, 'Sol nokta.'), nok(20, 38, 'Sağ nokta.')],
  },
  {
    glif: 'y',
    bicim: 'kucuk',
    genislik: 28,
    hamleler: [
      h(
        'karma',
        'karma',
        'Kılavuzdan aşağı iner, saatin tersine çanak çizer, sağda kılavuza çıkar, aynı çizgiden kuyruğa iner ve sola kıvrılır.',
        birlestir(
          cizgi([4, 50], [4, 66]),
          yay(14, 66, 10, 10, 180, 360),
          cizgi([24, 66], [24, 50]),
          cizgi([24, 50], [24, 90]),
          yay(17, 90, 7, 8, 0, -160),
        ),
        { geriDonus: true },
      ),
    ],
  },
  {
    glif: 'd',
    bicim: 'kucuk',
    genislik: 28,
    hamleler: [
      h('daire', 'saat-tersi', 'Saat 2 hizasından saatin tersine yuvarlak çizer.', yay(14, 65, 12, 15, 30, 390)),
      dik(26, 20, 80, 'Sağda üst çizgiden tabana düz iner.'),
    ],
  },
  {
    glif: 'z',
    bicim: 'kucuk',
    genislik: 26,
    hamleler: [
      h(
        'karma',
        'karma',
        'Kılavuzda soldan sağa yatay, sola-aşağı çapraz, tabanda soldan sağa yatay.',
        birlestir(cizgi([3, 50], [23, 50]), cizgi([23, 50], [3, 80]), cizgi([3, 80], [23, 80])),
      ),
    ],
  },
  { glif: 'ç', bicim: 'kucuk', genislik: 28, hamleler: [kucukC(), cengel(15)] },
  {
    glif: 'b',
    bicim: 'kucuk',
    genislik: 26,
    hamleler: [
      dik(4, 20, 80, 'Üst çizgiden tabana düz iner.'),
      h('yay', 'saat-yonu', 'Gövdenin kılavuz hizasından saat yönünde yuvarlak çizer.', yay(14, 65, 10, 15, 150, -150)),
    ],
  },
  { glif: 'g', bicim: 'kucuk', genislik: 28, hamleler: kucukG() },
  { glif: 'c', bicim: 'kucuk', genislik: 28, hamleler: [kucukC()] },
  { glif: 'ş', bicim: 'kucuk', genislik: 26, hamleler: [kucukS(), cengel(14)] },
  {
    glif: 'p',
    bicim: 'kucuk',
    genislik: 26,
    hamleler: [
      dik(4, 50, 98, 'Kılavuzdan kuyruğa düz iner.'),
      h('yay', 'saat-yonu', 'Gövdenin kılavuz hizasından saat yönünde yuvarlak çizer.', yay(14, 65, 10, 15, 150, -150)),
    ],
  },
  {
    glif: 'h',
    bicim: 'kucuk',
    genislik: 28,
    hamleler: [
      h(
        'karma',
        'karma',
        'Üst çizgiden tabana iner, aynı çizgiden geri çıkar, saat yönünde kemer çizip tabana iner.',
        birlestir(
          cizgi([4, 20], [4, 80]),
          cizgi([4, 80], [4, 60]),
          yay(14, 60, 10, 10, 180, 0),
          cizgi([24, 60], [24, 80]),
        ),
        { geriDonus: true },
      ),
    ],
  },
  {
    glif: 'v',
    bicim: 'kucuk',
    genislik: 26,
    hamleler: [
      h(
        'karma',
        'karma',
        'Kılavuzdan sağa-aşağı tabana, oradan sağa-yukarı kılavuza.',
        birlestir(cizgi([2, 50], [13, 80]), cizgi([13, 80], [24, 50])),
      ),
    ],
  },
  {
    glif: 'ğ',
    bicim: 'kucuk',
    genislik: 28,
    hamleler: [
      ...kucukG(),
      h('kisaYay', 'saat-tersi', 'Üstte soldan sağa, saatin tersine kısa yay.', yay(14, 42, 6, 4, 180, 360)),
    ],
  },
  {
    glif: 'f',
    bicim: 'kucuk',
    genislik: 20,
    hamleler: [
      h(
        'karma',
        'karma',
        'Üst çizginin sağından saatin tersine kanca çizer, tabana düz iner.',
        birlestir(yay(13, 27, 6, 6, 20, 180), cizgi([7, 27], [7, 80])),
      ),
      yatay(1, 15, 50, 'Kılavuzda soldan sağa yatay.'),
    ],
  },
  {
    glif: 'j',
    bicim: 'kucuk',
    genislik: 18,
    hamleler: [
      h(
        'karma',
        'karma',
        'Kılavuzdan kuyruğa iner, sola kıvrılır.',
        birlestir(cizgi([14, 50], [14, 90]), yay(7, 90, 7, 8, 0, -160)),
      ),
      nok(14, 38),
    ],
  },
];

// ------------------------------------------------------------------ büyük harfler (öğretim sırasıyla)
const buyukO = () =>
  h(
    'daire',
    'saat-tersi',
    'Saat 2 hizasından saatin tersine büyük yuvarlak çizer ve başlangıçta kapanır.',
    yay(24, 50, 21, 30, 30, 390),
  );
const buyukU = () =>
  h(
    'karma',
    'karma',
    'Soldan aşağı iner, saatin tersine çanak çizer, sağda yukarı çıkar ve aynı çizgiden tabana iner.',
    birlestir(
      cizgi([4, 20], [4, 62]),
      yay(18, 62, 14, 18, 180, 360),
      cizgi([32, 62], [32, 20]),
      cizgi([32, 20], [32, 80]),
    ),
    { geriDonus: true },
  );
const buyukS = () =>
  h(
    'karma',
    'karma',
    'Sağ üstten saatin tersine üst yayı, saat yönünde alt yayı çizer.',
    birlestir(yay(17, 35, 13, 15, 30, 270), yay(17, 65, 14, 15, 90, -160)),
  );
const buyukC = () => h('yay', 'saat-tersi', 'Sağ üstten saatin tersine açık yay çizer.', yay(26, 50, 22, 30, 40, 320));
const buyukG = () =>
  h(
    'karma',
    'karma',
    'Sağ üstten saatin tersine yay çizer, sağda ortaya gelince sola doğru yatay çıkıntıyı çizer.',
    birlestir(yay(26, 50, 22, 30, 40, 360), cizgi([48, 50], [30, 50])),
  );
const kOrta = 20 + ((30 - 13) / 26) * 34; // K'nin 3. hamlesi 2. hamlenin üstünden başlar

const BUYUK: GlifTanimi[] = [
  {
    glif: 'A',
    bicim: 'buyuk',
    genislik: 36,
    hamleler: [
      h('capraz', 'sol-asagi', 'Tepeden sol tabana çapraz iner.', cizgi([18, 20], [3, 80])),
      h('capraz', 'sag-asagi', 'Tepeden sağ tabana çapraz iner.', cizgi([18, 20], [33, 80])),
      yatay(8.5, 27.5, 58, 'Ortada soldan sağa yatay.'),
    ],
  },
  {
    glif: 'N',
    bicim: 'buyuk',
    genislik: 36,
    hamleler: [
      dik(4, 20, 80, 'Solda yukarıdan aşağı.'),
      h('capraz', 'sag-asagi', 'Sol tepeden sağ tabana çapraz iner.', cizgi([4, 20], [32, 80])),
      dik(32, 20, 80, 'Sağda yukarıdan aşağı.'),
    ],
  },
  {
    glif: 'E',
    bicim: 'buyuk',
    genislik: 32,
    hamleler: [
      dik(4, 20, 80, 'Solda yukarıdan aşağı.'),
      yatay(4, 28, 20, 'Üstte soldan sağa.'),
      yatay(4, 24, 50, 'Ortada soldan sağa.'),
      yatay(4, 28, 80, 'Tabanda soldan sağa.'),
    ],
  },
  {
    glif: 'T',
    bicim: 'buyuk',
    genislik: 36,
    hamleler: [yatay(2, 34, 20, 'Üstte soldan sağa.'), dik(18, 20, 80, 'Ortadan yukarıdan aşağı.')],
  },
  { glif: 'İ', bicim: 'buyuk', genislik: 10, hamleler: [dik(5, 20, 80), nok(5, 10, 'Üstte nokta.')] },
  { glif: 'L', bicim: 'buyuk', genislik: 32, hamleler: [dik(4, 20, 80), yatay(4, 28, 80, 'Tabanda soldan sağa.')] },
  { glif: 'O', bicim: 'buyuk', genislik: 46, hamleler: [buyukO()] },
  {
    glif: 'K',
    bicim: 'buyuk',
    genislik: 34,
    hamleler: [
      dik(4, 20, 80),
      h('capraz', 'sol-asagi', 'Sağ üstten gövdenin ortasına çapraz iner.', cizgi([30, 20], [4, 54])),
      h('capraz', 'sag-asagi', 'Ortadan sağ tabana çapraz iner.', cizgi([13, kOrta], [32, 80])),
    ],
  },
  { glif: 'U', bicim: 'buyuk', genislik: 36, hamleler: [buyukU()] },
  {
    glif: 'R',
    bicim: 'buyuk',
    genislik: 34,
    hamleler: [
      dik(4, 20, 80),
      h(
        'karma',
        'karma',
        'Gövdenin tepesinden saat yönünde göbeği çizer, gövdeye döner.',
        birlestir(cizgi([4, 20], [16, 20]), yay(16, 35, 14, 15, 90, -90), cizgi([16, 50], [4, 50])),
      ),
      h('capraz', 'sag-asagi', 'Göbekten sağ tabana çapraz iner.', cizgi([16, 50], [32, 80])),
    ],
  },
  { glif: 'I', bicim: 'buyuk', genislik: 10, hamleler: [dik(5, 20, 80, 'Yukarıdan aşağı düz iner. Noktası yoktur.')] },
  {
    glif: 'M',
    bicim: 'buyuk',
    genislik: 44,
    hamleler: [
      dik(4, 20, 80, 'Solda yukarıdan aşağı.'),
      h('capraz', 'sag-asagi', 'Sol tepeden ortaya çapraz iner.', cizgi([4, 20], [22, 62])),
      h('capraz', 'sol-asagi', 'Sağ tepeden ortaya çapraz iner.', cizgi([40, 20], [22, 62])),
      dik(40, 20, 80, 'Sağda yukarıdan aşağı.'),
    ],
  },
  {
    glif: 'Ü',
    bicim: 'buyuk',
    genislik: 36,
    hamleler: [buyukU(), nok(12, 10, 'Sol nokta.'), nok(24, 10, 'Sağ nokta.')],
  },
  { glif: 'S', bicim: 'buyuk', genislik: 34, hamleler: [buyukS()] },
  {
    glif: 'Ö',
    bicim: 'buyuk',
    genislik: 46,
    hamleler: [buyukO(), nok(17, 10, 'Sol nokta.'), nok(31, 10, 'Sağ nokta.')],
  },
  {
    glif: 'Y',
    bicim: 'buyuk',
    genislik: 36,
    hamleler: [
      h('capraz', 'sag-asagi', 'Sol tepeden ortaya çapraz iner.', cizgi([3, 20], [18, 50])),
      h('capraz', 'sol-asagi', 'Sağ tepeden ortaya çapraz iner.', cizgi([33, 20], [18, 50])),
      dik(18, 50, 80, 'Ortadan tabana düz iner.'),
    ],
  },
  {
    glif: 'D',
    bicim: 'buyuk',
    genislik: 34,
    hamleler: [
      dik(4, 20, 80),
      h(
        'karma',
        'karma',
        'Gövdenin tepesinden saat yönünde büyük yay çizerek tabana iner, gövdeye döner.',
        birlestir(cizgi([4, 20], [14, 20]), yay(14, 50, 18, 30, 90, -90), cizgi([14, 80], [4, 80])),
      ),
    ],
  },
  {
    glif: 'Z',
    bicim: 'buyuk',
    genislik: 36,
    hamleler: [
      h(
        'karma',
        'karma',
        'Üstte soldan sağa yatay, sola-aşağı çapraz, tabanda soldan sağa yatay.',
        birlestir(cizgi([3, 20], [31, 20]), cizgi([31, 20], [3, 80]), cizgi([3, 80], [33, 80])),
      ),
    ],
  },
  { glif: 'Ç', bicim: 'buyuk', genislik: 50, hamleler: [buyukC(), cengel(26)] },
  {
    glif: 'B',
    bicim: 'buyuk',
    genislik: 34,
    hamleler: [
      dik(4, 20, 80),
      h(
        'karma',
        'karma',
        'Gövdenin tepesinden saat yönünde iki göbeği çizer, tabanda gövdeye döner.',
        birlestir(
          cizgi([4, 20], [16, 20]),
          yay(16, 34, 13, 14, 90, -90),
          yay(17, 64, 15, 16, 90, -90),
          cizgi([17, 80], [4, 80]),
        ),
      ),
    ],
  },
  { glif: 'G', bicim: 'buyuk', genislik: 50, hamleler: [buyukG()] },
  { glif: 'C', bicim: 'buyuk', genislik: 50, hamleler: [buyukC()] },
  { glif: 'Ş', bicim: 'buyuk', genislik: 34, hamleler: [buyukS(), cengel(17)] },
  {
    glif: 'P',
    bicim: 'buyuk',
    genislik: 33,
    hamleler: [
      dik(4, 20, 80),
      h(
        'karma',
        'karma',
        'Gövdenin tepesinden saat yönünde göbeği çizer, gövdeye döner.',
        birlestir(cizgi([4, 20], [16, 20]), yay(16, 36, 15, 16, 90, -90), cizgi([16, 52], [4, 52])),
      ),
    ],
  },
  {
    glif: 'H',
    bicim: 'buyuk',
    genislik: 36,
    hamleler: [
      dik(4, 20, 80, 'Solda yukarıdan aşağı.'),
      dik(32, 20, 80, 'Sağda yukarıdan aşağı.'),
      yatay(4, 32, 50, 'Ortada soldan sağa.'),
    ],
  },
  {
    glif: 'V',
    bicim: 'buyuk',
    genislik: 36,
    hamleler: [
      h(
        'karma',
        'karma',
        'Sol tepeden sağa-aşağı tabana, oradan sağa-yukarı sağ tepeye.',
        birlestir(cizgi([3, 20], [18, 80]), cizgi([18, 80], [33, 20])),
      ),
    ],
  },
  {
    glif: 'Ğ',
    bicim: 'buyuk',
    genislik: 50,
    hamleler: [
      buyukG(),
      h('kisaYay', 'saat-tersi', 'Üstte soldan sağa, saatin tersine kısa yay.', yay(26, 10, 7, 4, 180, 360)),
    ],
  },
  {
    glif: 'F',
    bicim: 'buyuk',
    genislik: 32,
    hamleler: [dik(4, 20, 80), yatay(4, 28, 20, 'Üstte soldan sağa.'), yatay(4, 24, 50, 'Ortada soldan sağa.')],
  },
  {
    glif: 'J',
    bicim: 'buyuk',
    genislik: 28,
    hamleler: [
      h(
        'karma',
        'karma',
        'Sağ üstten aşağı iner, saat yönünde sola kıvrılır.',
        birlestir(cizgi([24, 20], [24, 66]), yay(14, 66, 10, 14, 0, -170)),
      ),
    ],
  },
];

// ------------------------------------------------------------------ rakamlar (uygulamadaki YAZIM_SIRASI ile aynı)
const RAKAM: GlifTanimi[] = [
  {
    glif: '0',
    bicim: 'rakam',
    genislik: 32,
    hamleler: [
      h(
        'daire',
        'saat-tersi',
        'Sağ üstten başlar, sola doğru dönerek oval çizer ve başlangıçta kapanır.',
        yay(16, 50, 14, 30, 30, 390),
      ),
    ],
  },
  {
    glif: '1',
    bicim: 'rakam',
    genislik: 24,
    hamleler: [
      h(
        'karma',
        'karma',
        'Soldan kısa bayrak sağa-yukarı çıkar, tepeden düz aşağı iner.',
        birlestir(cizgi([6, 32], [18, 20]), cizgi([18, 20], [18, 80])),
      ),
    ],
  },
  {
    glif: '2',
    bicim: 'rakam',
    genislik: 32,
    hamleler: [
      h(
        'karma',
        'karma',
        'Sol üstten yay çizerek sağa döner, sola-aşağı çapraz iner, tabanda sağa düz çizer.',
        birlestir(
          yay(16, 34, 13, 14, 160, -40),
          cizgi([16 + 13 * Math.cos((-40 * Math.PI) / 180), 34 + 14 * Math.sin((40 * Math.PI) / 180)], [3, 80]),
          cizgi([3, 80], [30, 80]),
        ),
      ),
    ],
  },
  {
    glif: '3',
    bicim: 'rakam',
    genislik: 30,
    hamleler: [
      h(
        'karma',
        'karma',
        'Sol üstten üst yayı çizip ortaya döner, ikinci yayı çizerek sol altta biter.',
        birlestir(yay(15, 34, 12, 14, 160, -90), yay(15, 64, 14, 16, 90, -160)),
      ),
    ],
  },
  {
    glif: '4',
    bicim: 'rakam',
    genislik: 34,
    hamleler: [
      h(
        'karma',
        'karma',
        'Üstten sola-aşağı çapraz iner, sağa yatay çizer.',
        birlestir(cizgi([20, 20], [3, 62]), cizgi([3, 62], [32, 62])),
      ),
      dik(24, 38, 80, 'Sağdaki dik çizgi yukarıdan aşağı iner.'),
    ],
  },
  {
    glif: '5',
    bicim: 'rakam',
    genislik: 30,
    hamleler: [
      yatay(6, 28, 20, 'Üstteki yatay çizgi soldan sağa.'),
      h(
        'karma',
        'karma',
        'Soldan dik iner, göbek yayını çizerek sol altta biter.',
        birlestir(cizgi([6, 20], [6, 48]), yay(16, 62, 13, 18, 130, -150)),
      ),
    ],
  },
  {
    glif: '6',
    bicim: 'rakam',
    genislik: 30,
    hamleler: [
      h(
        'karma',
        'karma',
        'Sağ üstten sola-aşağı yay çizerek iner, alttaki halkayı çizip kapatır.',
        birlestir(bezier([26, 21], [5, 32], [4, 64]), yay(16, 64, 12, 16, 180, 540)),
      ),
    ],
  },
  {
    glif: '7',
    bicim: 'rakam',
    genislik: 32,
    hamleler: [
      h(
        'karma',
        'karma',
        'Üstte soldan sağa yatay çizer, sola-aşağı çapraz iner.',
        birlestir(cizgi([3, 20], [30, 20]), cizgi([30, 20], [12, 80])),
      ),
      yatay(13, 29, 50, 'Ortadaki kısa yatay çizgi soldan sağa.'),
    ],
  },
  {
    glif: '8',
    bicim: 'rakam',
    genislik: 32,
    hamleler: [
      h(
        'karma',
        'karma',
        'Sağ ortadan yukarı çıkar, üst halkayı sola döner, ortada kesişip alt halkayı çizerek başlangıca döner.',
        birlestir(
          yay(16, 34, 11, 14, -30, 270),
          yay(16, 64, 13, 16, 90, -270),
          cizgi([16, 48], [16 + 11 * Math.cos(Math.PI / 6), 34 + 14 * 0.5]),
        ),
      ),
    ],
  },
  {
    glif: '9',
    bicim: 'rakam',
    genislik: 30,
    hamleler: [
      h(
        'karma',
        'karma',
        'Halkanın sağ alt yanından sola doğru halkayı çizer, sağdan aşağı-sola kuyruğu iner.',
        birlestir(yay(16, 36, 12, 15, -40, -360), bezier([28, 36], [28, 62], [11, 80])),
      ),
    ],
  },
];

function hamleye(t: Tanim, i: number): TurHamle {
  return {
    sira: i + 1,
    tip: t.tip,
    yon: t.yon,
    ...(t.geriDonus ? { geriDonus: true as const } : {}),
    ...(t.istisna ? { istisna: t.istisna } : {}),
    aciklama: t.aciklama,
    noktalar: t.noktalar
      .map(([x, y]) => [y1(x), y1(y)] as [number, number])
      .filter((p, j, a) => j === 0 || p[0] !== a[j - 1][0] || p[1] !== a[j - 1][1]),
  };
}

export function hamleVerisiUret(): TurHamleDosyasi {
  const glifler: TurHamleGlifi[] = [...KUCUK, ...BUYUK, ...RAKAM].map((g) => ({
    glif: g.glif,
    bicim: g.bicim,
    genislik: g.genislik,
    hamleSayisi: g.hamleler.length,
    hamleler: g.hamleler.map(hamleye),
    teyit: { durum: 'bekliyor' as const },
  }));
  return {
    surum: 1,
    programSurumu: PROGRAM_SURUMU,
    koordinat: { ...HAMLE_KOORDINATI },
    kaynak:
      'Kendi orta çizgimiz (scripts/tur/hamle-verisi.ts). Hamle sayısı, sırası ve yönü öğretmen teyit tablosu taslağından; font konturu kullanılmadı.',
    glifler,
  };
}

/** JSON metni: glif ve hamle alanları satır satır, bir hamlenin noktaları tek satırda (okunur fark, küçük dosya). */
export function hamleVerisiJson(d: TurHamleDosyasi = hamleVerisiUret()): string {
  const yerTutucu: string[] = [];
  const metin = JSON.stringify(
    d,
    (anahtar, deger: unknown) => {
      if (anahtar !== 'noktalar') return deger;
      yerTutucu.push(JSON.stringify(deger));
      return `@@${yerTutucu.length - 1}@@`;
    },
    1,
  );
  return `${metin.replace(/"@@(\d+)@@"/g, (_, i: string) => yerTutucu[Number(i)])}\n`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const hedef = path.join(kok, 'ders-verisi/tur/hamleler.json');
  writeFileSync(hedef, hamleVerisiJson());
  console.log(`hamleler.json yazıldı (${hamleVerisiUret().glifler.length} glif).`);
}
