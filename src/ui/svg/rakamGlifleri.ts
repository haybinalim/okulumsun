/**
 * MEB DİK TEMEL RAKAM GLİFLERİ (0–9) — TEK KAYNAK (plan v2 Adım 30, KG-42).
 *
 * Plan §3.4: "Rakamlar fonttan değil, özel SVG path'ten. MEB dik temel formuna
 * birebir uyum (kancalı 1, çizgisiz 7)."
 *
 * - Her glif 100×100 viewBox içinde tanımlı; çizgi tabanlı (dolgu yok), çizgi
 *   kalınlığı `tokens.ts` → `GLIF.cizgiKalinligi`.
 * - Ekrandaki `Rakam` bileşeni (`Visual.tsx`), geliştirme glif kartı
 *   (`src/dev/GlifKarti.tsx`, `?gelistirme=glif`), öğretmen görüş formu
 *   (`scripts/icerik/glif-formu.ts`) ve ileride kâğıt üreticisi (Adım 35) bu
 *   veriyi kullanır. Path'i başka yerde KOPYALAMAYIN.
 * - Path'ler iki 1. sınıf öğretmeninin görüşü (`docs/icerik/rakam-glifleri.md`)
 *   gelmeden DEĞİŞTİRİLMEZ. Değişirse snapshot/glif testleri ve form PDF'i
 *   yeniden üretilir.
 */

export type Rakam = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface RakamGlifi {
  readonly rakam: Rakam;
  /** SVG path verisi, 100×100 viewBox. */
  readonly path: string;
  /** Path'in yatay kapsamı (viewBox birimi; kontrol noktaları dahil yaklaşık). */
  readonly genislik: number;
  /**
   * Path'in uygulamada çizildiği sıranın sözlü tarifi (her öğe bir alt yol).
   * MEB yazım sırasının KENDİSİ değildir; öğretmen görüşüyle karşılaştırılır.
   */
  readonly yazimSirasi: readonly string[];
}

export const RAKAM_GLIFLERI: readonly RakamGlifi[] = [
  {
    rakam: 0,
    // yumuşak yuvarlak
    path: 'M50 15 C30 15 22 35 22 50 C22 65 30 85 50 85 C70 85 78 65 78 50 C78 35 70 15 50 15 Z',
    genislik: 56,
    yazimSirasi: ['Üst ortadan başlar, sola doğru aşağı iner, alttan dönüp sağdan yukarı çıkarak başlangıçta kapanır.'],
  },
  {
    rakam: 1,
    // kancalı (MEB dik temel: üstte küçük kanca)
    path: 'M38 20 L42 18 C46 16 50 18 48 22 L45 30 L45 82',
    genislik: 12,
    yazimSirasi: ['Üst solda küçük kancayla başlar, sağa-yukarı çıkar, dönüp düz aşağı iner.'],
  },
  {
    rakam: 2,
    // üstte yay, altta düz taban
    path: 'M28 35 C28 22 38 15 50 15 C62 15 72 22 72 35 C72 48 55 55 45 68 L42 72 L75 72 L75 82 L25 82 L25 74 C35 62 55 52 55 38 C55 30 52 25 50 25 C47 25 45 28 45 32 C45 36 47 38 50 38',
    genislik: 50,
    yazimSirasi: ['Sol üstten yay çizerek sağa döner, sola-aşağı iner, tabanı çizer; ardından içten geri dönen ikinci bir kontur çizer.'],
  },
  {
    rakam: 3,
    // iki yay, üst ve alt
    path: 'M30 25 C35 18 42 15 50 15 C60 15 72 22 72 33 C72 42 65 47 57 48 C66 49 72 55 72 65 C72 78 62 85 50 85 C40 85 33 80 28 73 L35 67 C38 72 43 75 50 75 C56 75 60 71 60 65 C60 59 56 55 50 55 L45 55 L45 45 L50 45 C55 45 58 41 58 36 C58 31 55 27 50 27 C45 27 42 30 40 34 L30 25 Z',
    genislik: 44,
    yazimSirasi: ['Sol üstten üst yayı, ortada dönüp alt yayı çizer; içten geri dönerek başlangıçta kapanan bir kontur çizer.'],
  },
  {
    rakam: 4,
    // düz dikey + yatay çapraz
    path: 'M55 15 L25 55 L25 62 L60 62 L60 82 L60 82 M60 15 L60 62 M25 62 L75 62',
    genislik: 50,
    yazimSirasi: [
      'Üstten sola-aşağı çapraz iner, sağa döner, aşağı iner.',
      'Üstten dik çizgi ortadaki yatay çizgiye iner.',
      'Soldan sağa yatay çizgi.',
    ],
  },
  {
    rakam: 5,
    // üst yatay + yay + alt yay
    path: 'M68 20 L30 20 L30 45 L45 43 C48 42 52 42 55 45 C60 48 62 55 62 62 C62 72 57 82 50 82 C42 82 35 78 30 72 L37 66 C40 70 44 73 50 73 C55 73 58 69 58 63 C58 57 54 53 50 53 C47 53 44 55 42 57 L32 52 L32 15 L68 15 L68 20 Z',
    genislik: 38,
    yazimSirasi: ['Sağ üstten sola yatay, aşağı dik, sağa göbek yayı çizer; içten geri dönüp üstte kapanan bir kontur çizer.'],
  },
  {
    rakam: 6,
    // alt yuvarlak, üst yay
    path: 'M72 30 C68 20 60 15 50 15 C35 15 25 28 25 50 C25 70 35 85 50 85 C62 85 72 75 72 62 C72 50 63 42 52 42 C45 42 39 46 35 52 C35 38 42 25 50 25 C56 25 60 28 62 33 L72 30 Z M50 52 C57 52 62 57 62 63 C62 70 57 75 50 75 C43 75 38 70 38 63 C38 57 43 52 50 52 Z',
    genislik: 47,
    yazimSirasi: [
      'Sağ üstten sola yay çizerek aşağı iner, alttan döner; içten geri dönen dış kontur.',
      'Alttaki halka (iç kontur).',
    ],
  },
  {
    rakam: 7,
    // çizgisiz (MEB dik temel: üst yatay, çapraz iniş, ortada çizgi yok)
    path: 'M25 20 L75 20 L75 25 L50 82',
    genislik: 50,
    yazimSirasi: ['Soldan sağa üst yatay çizgi, sonra sola-aşağı çapraz iniş; ortada çizgi yok.'],
  },
  {
    rakam: 8,
    // iki yuvarlak üst üste
    path: 'M50 15 C40 15 32 21 32 30 C32 38 40 43 50 43 C60 43 68 38 68 30 C68 21 60 15 50 15 Z M50 47 C39 47 30 54 30 65 C30 77 39 85 50 85 C61 85 70 77 70 65 C70 54 61 47 50 47 Z M50 52 C57 52 62 57 62 65 C62 73 57 78 50 78 C43 78 38 73 38 65 C38 57 43 52 50 52 Z',
    genislik: 40,
    yazimSirasi: [
      'Üst halka: üst ortadan sola doğru.',
      'Alt halka (dış): ortadan sola doğru.',
      'Alt halka (iç): sağa doğru.',
    ],
  },
  {
    rakam: 9,
    // üst yuvarlak, alt yay
    path: 'M28 70 C32 80 40 85 50 85 C65 85 75 72 75 50 C75 30 65 15 50 15 C38 15 28 25 28 38 C28 50 37 58 48 58 C55 58 61 54 65 48 C65 62 58 75 50 75 C44 75 40 72 38 67 L28 70 Z M50 25 C43 25 38 30 38 38 C38 45 43 50 50 50 C57 50 62 45 62 38 C62 30 57 25 50 25 Z',
    genislik: 47,
    yazimSirasi: [
      'Sol alttan sağa yay çizerek yukarı çıkar, üstte dönüp halkayı çizer; içten geri dönen dış kontur.',
      'Üstteki halka (iç kontur).',
    ],
  },
];

/** Rakam karakterinden ('0'–'9') glif path'ine hızlı erişim. */
export const RAKAM_PATHLERI: Readonly<Record<string, string>> = Object.fromEntries(
  RAKAM_GLIFLERI.map((g) => [String(g.rakam), g.path]),
);

/** Bir alt yolun başlangıç noktası ve ilk segmentinin yönü (birim vektör). */
export interface AltYolBaslangici {
  readonly x: number;
  readonly y: number;
  readonly dx: number;
  readonly dy: number;
}

/**
 * Path'teki her alt yolun (`M` ile başlayan) başlangıç noktasını ve ilk
 * segmentin yönünü verir. Yalnız bu dosyadaki mutlak `M`/`L`/`C`/`Z` komutlarını
 * destekler. Glif kartı ve öğretmen formu yön oklarını buradan çizer; testler
 * "kancalı 1" yön denetimini buradan yapar.
 */
export function altYolBaslangiclari(path: string): AltYolBaslangici[] {
  const sonuc: AltYolBaslangici[] = [];
  for (const parca of path.split(/(?=M)/)) {
    const [mKomutu, ilkSegment] = parca.trim().match(/[MLCZ][^MLCZ]*/g) ?? [];
    if (!mKomutu?.startsWith('M') || !ilkSegment || ilkSegment.startsWith('Z')) continue;
    const [x = 0, y = 0] = mKomutu.slice(1).trim().split(/\s+/).map(Number);
    // İlk segmentin yönü: L ise hedef nokta, C ise ilk kontrol noktası
    // (başlangıçla çakışıyorsa sonraki nokta).
    const sayilar = ilkSegment.slice(1).trim().split(/\s+/).map(Number);
    let hx = x;
    let hy = y;
    for (let i = 0; i + 1 < sayilar.length && hx === x && hy === y; i += 2) {
      hx = sayilar[i] ?? x;
      hy = sayilar[i + 1] ?? y;
    }
    const uz = Math.hypot(hx - x, hy - y) || 1;
    sonuc.push({ x, y, dx: (hx - x) / uz, dy: (hy - y) / uz });
  }
  return sonuc;
}
