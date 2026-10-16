/**
 * MEB TEMEL YAZI RAKAM GLİFLERİ (0–9) — TEK KAYNAK (plan v2 Adım 30, KG-95).
 *
 * Kaynak: MEB TTKB, Türkiye Yüzyılı Maarif Modeli (TYMM, 2024) kapsamında
 * "ders kitapları ve eğitim araçlarında kullanılması amacıyla" yayımlanan
 * resmî temel yazı fontu **TemelYazi** (HBY Tasarım, sürüm 1.007). Duyuru:
 * https://ttkb.meb.gov.tr/www/ilkokulturkcedersiogretimprogramiveilkokumayazmaderskitabindayeralanalfabeverakamlaryayimlandi/icerik/610
 * MEB formu: bayraklı tabansız `1`, açık üstlü `4`, ortası çizgili `7`.
 * (KG-42'deki el yapımı, çizgi tabanlı glifler ve "çizgisiz 7" varsayımı
 * KG-95 ile yerine geçti.)
 *
 * - Path'ler `scripts/rakam-glif-uret.py` ile TemelYazi-Bold konturlarından
 *   ÜRETİLİR (`rakamGlifYollari.ts`); elle değiştirmeyin, betiği çalıştırın.
 * - 100×100 viewBox, taban y=85, rakam yüksekliği 70, glif x=50'ye ortalı.
 *   DOLGULU çizilir (`fill`), çizgi kalınlığı yoktur.
 * - Ekrandaki `Rakam` bileşeni (`Visual.tsx`) bu veriyi kullanır; geliştirme glif
 *   kartı (`?gelistirme=glif`) ve öğretmen formu (`npm run glif:formu`) ayrıca
 *   MEB Kılavuz glifini (`rakamKilavuzYollari.ts`, numaralı yazım yönü okları)
 *   gösterir. Path'i başka yerde KOPYALAMAYIN.
 * - Metindeki rakamlar aynı fonttan gelir: `public/fonts/TemelYazi-Rakam.woff2`,
 *   `src/index.css` → 'TemelYaziRakam'.
 */
import { RAKAM_GLIF_YOLLARI } from './rakamGlifYollari';

export type Rakam = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface RakamGlifi {
  readonly rakam: Rakam;
  /** Dolgulu SVG path verisi, 100×100 viewBox. */
  readonly path: string;
  /** Glifin yatay kapsamı (viewBox birimi). */
  readonly genislik: number;
  /**
   * MEB yazım yönü: her öğe bir hamle (kalem kaldırılana kadar). Kaynak:
   * TemelYazi-Kilavuz fontundaki numaralı oklar.
   */
  readonly yazimSirasi: readonly string[];
}

/** MEB Kılavuz fontundaki numaralı oklara göre yazım yönü (hamle başına bir öğe). */
const YAZIM_SIRASI: Readonly<Record<Rakam, readonly string[]>> = {
  0: ['Sağ üstten başlar, sola doğru dönerek oval çizer ve başlangıçta kapanır.'],
  1: ['Soldan kısa bayrak sağa-yukarı çıkar, tepeden düz aşağı iner.'],
  2: ['Sol üstten yay çizerek sağa döner, sola-aşağı çapraz iner, tabanda sağa düz çizer.'],
  3: ['Sol üstten üst yayı çizip ortaya döner, ikinci yayı çizerek sol altta biter.'],
  4: ['Üstten sola-aşağı çapraz iner, sağa yatay çizer.', 'Sağdaki dik çizgi yukarıdan aşağı iner.'],
  5: ['Üstteki yatay çizgi soldan sağa.', 'Soldan dik iner, göbek yayını çizerek sol altta biter.'],
  6: ['Sağ üstten sola-aşağı yay çizerek iner, alttaki halkayı çizip kapatır.'],
  7: ['Üstte soldan sağa yatay çizer, sola-aşağı çapraz iner.', 'Ortadaki kısa yatay çizgi soldan sağa.'],
  8: ['Sağ ortadan yukarı çıkar, üst halkayı sola döner, ortada kesişip alt halkayı çizerek başlangıca döner.'],
  9: ['Halkanın sağ alt yanından sola doğru halkayı çizer, sağdan aşağı-sola kuyruğu iner.'],
};

export const RAKAM_GLIFLERI: readonly RakamGlifi[] = RAKAM_GLIF_YOLLARI.map(([rakam, path, genislik]) => ({
  rakam: rakam as Rakam,
  path,
  genislik,
  yazimSirasi: YAZIM_SIRASI[rakam as Rakam],
}));

/** Rakam karakterinden ('0'–'9') glife hızlı erişim. */
export const RAKAM_GLIF_HARITASI: Readonly<Record<string, RakamGlifi>> = Object.fromEntries(
  RAKAM_GLIFLERI.map((g) => [String(g.rakam), g]),
);

/** Rakam karakterinden ('0'–'9') glif path'ine hızlı erişim. */
export const RAKAM_PATHLERI: Readonly<Record<string, string>> = Object.fromEntries(
  RAKAM_GLIFLERI.map((g) => [String(g.rakam), g.path]),
);

/** Çok basamaklı sayıda rakamlar arası boşluk (viewBox birimi). */
export const RAKAM_ARALIGI = 8;
