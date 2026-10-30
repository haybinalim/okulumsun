/**
 * Yazılış gösterimi çizim yardımcıları (Okuma Yazma planı §2.4.9, Adım 64). SAF.
 *
 * Hamle verisi (`ders-verisi/tur/hamleler.json`) orta çizgidir; ekranda ve kâğıtta aynı noktalardan SVG yolu,
 * numaralı yön oku ve kesikli kopya üretilir. Font konturu kullanılmaz (Kilavuz ve KesikCizgi pakete girmez).
 * Sol el ayarı yalnız arayüzü aynalar; buradaki hiçbir fonksiyon el tercihini almaz — harf ve hamle yönü
 * aynalanmaz (K-OY-19, D-19).
 */
import type { TurHamle, TurHamleGlifi } from '../../content/schema/turHamle';

export type Nokta = readonly [number, number];

/** Satır dizgesi çizgileri (0–100 birim; 1 cm = 60 birim → üst ve alt bölge 0,5'er cm). */
export const SATIR = { ust: 20, kilavuz: 50, taban: 80, kuyruk: 100, cmBirim: 60 } as const;

/** Ekranda kalem kalınlığı (birim) ve kâğıtta izleme kesiği (birim). */
export const KALEM = 5.5;
export const KESIK_DIZISI = '3.2 3';

export function yolVerisi(noktalar: readonly Nokta[], dx = 0, dy = 0): string {
  return noktalar.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${+(x + dx).toFixed(2)} ${+(y + dy).toFixed(2)}`).join(' ');
}

export function hamleUzunlugu(noktalar: readonly Nokta[]): number {
  let u = 0;
  for (let i = 1; i < noktalar.length; i++)
    u += Math.hypot(noktalar[i][0] - noktalar[i - 1][0], noktalar[i][1] - noktalar[i - 1][1]);
  return u;
}

export type Hiz = 'yavas' | 'orta' | 'hizli';
export const HIZLAR: readonly Hiz[] = ['yavas', 'orta', 'hizli'];
export const HIZ_ADI: Readonly<Record<Hiz, string>> = { yavas: 'Yavaş', orta: 'Orta', hizli: 'Hızlı' };
/** Birim/saniye: yavaş tempoda bir küçük harf hamlesi ≈ 2–3 sn. */
const HIZ_BIRIM: Readonly<Record<Hiz, number>> = { yavas: 30, orta: 55, hizli: 95 };
/** Hamleler arası bekleme (sn): kalem kalkar, sıradaki numara görünür. */
export const HAMLE_ARASI_SN = 0.5;

export interface Zamanlama {
  readonly gecikme: number;
  readonly sure: number;
}

/** Her hamlenin başlama gecikmesi ve çizim süresi (sn). Noktalar ve çengeller kısa ama görünür sürer. */
export function zamanlama(hamleler: readonly Pick<TurHamle, 'noktalar'>[], hiz: Hiz): Zamanlama[] {
  let t = 0.3;
  return hamleler.map((h) => {
    const sure = Math.max(0.45, hamleUzunlugu(h.noktalar) / HIZ_BIRIM[hiz]);
    const z = { gecikme: +t.toFixed(3), sure: +sure.toFixed(3) };
    t += sure + HAMLE_ARASI_SN;
    return z;
  });
}

/** Hamlenin ilk ~`uzunluk` birimlik yönü (birim vektör). */
export function baslangicYonu(noktalar: readonly Nokta[], uzunluk = 6): Nokta {
  const [x0, y0] = noktalar[0];
  for (const [x, y] of noktalar.slice(1)) {
    const d = Math.hypot(x - x0, y - y0);
    if (d >= uzunluk) return [(x - x0) / d, (y - y0) / d];
  }
  const [x, y] = noktalar[noktalar.length - 1];
  const d = Math.hypot(x - x0, y - y0) || 1;
  return [(x - x0) / d, (y - y0) / d];
}

export interface YonOku {
  /** Numara dairesinin merkezi. */
  readonly numara: Nokta;
  /** Okun gövdesi (başlangıç → uç) ve uç üçgeni. */
  readonly govde: readonly [Nokta, Nokta];
  readonly uc: readonly [Nokta, Nokta, Nokta];
}

/**
 * Numaralı yön oku: numara hamlenin başlangıcının hemen gerisinde, ok hamlenin yanında ve ilk yönüne paralel.
 * Ok çizginin üstüne binmesin diye hamlenin soluna (yönün sol normali) kaydırılır.
 */
export function yonOku(noktalar: readonly Nokta[], olcek = 1): YonOku {
  const [ux, uy] = baslangicYonu(noktalar);
  const [nx, ny] = [uy, -ux]; // yönün solu (ekran koordinatı, y aşağı)
  const [x0, y0] = noktalar[0];
  const kay = 6.5 * olcek;
  const boy = 9 * olcek;
  const b: Nokta = [x0 + nx * kay, y0 + ny * kay];
  const e: Nokta = [b[0] + ux * boy, b[1] + uy * boy];
  const u = 2.6 * olcek;
  return {
    numara: [x0 - ux * 6 * olcek - nx * 1.5 * olcek, y0 - uy * 6 * olcek - ny * 1.5 * olcek],
    govde: [b, [e[0] - ux * u, e[1] - uy * u]],
    uc: [
      e,
      [e[0] - ux * u * 1.8 + nx * u, e[1] - uy * u * 1.8 + ny * u],
      [e[0] - ux * u * 1.8 - nx * u, e[1] - uy * u * 1.8 - ny * u],
    ],
  };
}

/** Gösterim çerçevesi: glif ortada, satır dizgesi iki yana taşar; y −4…104 (İ noktası, kuyruk ve numaralar sığar). */
export function cerceve(
  g: Pick<TurHamleGlifi, 'genislik'>,
  kenar = 18,
): { genislik: number; dx: number; viewBox: string } {
  const genislik = Math.max(g.genislik + 2 * kenar, 64);
  const dx = (genislik - g.genislik) / 2;
  return { genislik, dx, viewBox: `0 -4 ${genislik} 108` };
}

/** Grup sekmeleri: 1–5. harf grubu (küçük + büyük, öğretim sırasıyla) ve rakamlar. */
export function sekmeGlifleri(
  glifler: readonly TurHamleGlifi[],
  gruplar: readonly (readonly string[])[],
  sekme: number,
): TurHamleGlifi[] {
  if (sekme >= gruplar.length) return glifler.filter((g) => g.bicim === 'rakam');
  return gruplar[sekme].flatMap((h) =>
    glifler.filter(
      (g) => (g.bicim === 'kucuk' && g.glif === h) || (g.bicim === 'buyuk' && g.glif === h.toLocaleUpperCase('tr-TR')),
    ),
  );
}

export function glifAdi(g: Pick<TurHamleGlifi, 'glif' | 'bicim'>): string {
  return g.bicim === 'rakam' ? `Rakam ${g.glif}` : `${g.bicim === 'kucuk' ? 'Küçük' : 'Büyük'} ${g.glif}`;
}

export function glifAnahtari(g: Pick<TurHamleGlifi, 'glif' | 'bicim'>): string {
  return `${g.bicim}:${g.glif}`;
}
