/**
 * PARMAKLA İZLEME DEĞERLENDİRMESİ (Okuma Yazma planı §2.4.9 M-4, Adım 70; K-6 varsayılanı: hoşgörülü, puansız, P2). SAF.
 *
 * Çocuk bir hamleyi parmağıyla (tablet) ya da kalem/parmakla (tahta) izler; çizim hamlenin orta çizgisiyle aynı
 * koordinatta (0–100 satır dizgesi) karşılaştırılır. Hamle GEÇER, eğer:
 *   1. başlangıç noktası hamlenin başlangıcına ≤ `baslangic` birim (tablet 12),
 *   2. çizim noktalarının hamle çizgisine ortalama uzaklığı ≤ `sapma` birim (tablet 10),
 *   3. yön kosinüsü > 0 (açık hamlede baştan sona vektör, kapalı hamlede — daire — ilk yön; nokta hamlesinde yön yok),
 *   4. (ajan eki, geri alınabilir) çizim hamle uzunluğunun en az yarısı kadar (kısa bir dokunuş/fiske geçmesin;
 *      nokta hamlesinde aranmaz).
 * Tahtada tek noktalı kızılötesi (IR) dokunmatik için eşikler %50 geniştir. Üç başarısız denemeden sonra hamle
 * gösterilir ve geçilir. Puan, yıldız, süre YOK; hiçbir sonuç saklanmaz (çizim yalnız bellekte, ekran değişince silinir).
 */
import { baslangicYonu, hamleUzunlugu, type Nokta } from './hamleCizim';

export interface IzlemeEsikleri {
  readonly baslangic: number;
  readonly sapma: number;
}

export const IZLEME_ESIKLERI: Readonly<Record<'tablet' | 'board', IzlemeEsikleri>> = {
  tablet: { baslangic: 12, sapma: 10 },
  board: { baslangic: 18, sapma: 15 },
};

/** Bu kadar başarısız denemeden sonra hamle gösterilir ve sıradakine geçilir. */
export const IZLEME_DENEME = 3;

/** Nokta hamlesi (i, j, ü… noktaları): uzunluğu bundan kısa. */
const NOKTA_UZUNLUGU = 8;

function parcayaUzaklik(p: Nokta, a: Nokta, b: Nokta): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Noktanın çoklu çizgiye (hamle) en kısa uzaklığı. */
export function cizgiyeUzaklik(p: Nokta, cizgi: readonly Nokta[]): number {
  if (cizgi.length === 1) return Math.hypot(p[0] - cizgi[0][0], p[1] - cizgi[0][1]);
  let en = Infinity;
  for (let i = 1; i < cizgi.length; i++) en = Math.min(en, parcayaUzaklik(p, cizgi[i - 1], cizgi[i]));
  return en;
}

export type IzlemeNedeni = 'baslangic' | 'sapma' | 'yon' | 'kisa';

export interface HamleSonucu {
  readonly gecti: boolean;
  /** İlk karşılanmayan ölçüt (yetişkin ipucu ve test için; çocuğa puan olarak gösterilmez). */
  readonly neden?: IzlemeNedeni;
  readonly baslangic: number;
  readonly sapma: number;
  readonly kosinus: number;
}

export function hamleyiDegerlendir(cizim: readonly Nokta[], hamle: readonly Nokta[], esik: IzlemeEsikleri): HamleSonucu {
  if (cizim.length === 0) return { gecti: false, neden: 'kisa', baslangic: Infinity, sapma: Infinity, kosinus: 0 };
  const baslangic = Math.hypot(cizim[0][0] - hamle[0][0], cizim[0][1] - hamle[0][1]);
  const sapma = cizim.reduce((t, p) => t + cizgiyeUzaklik(p, hamle), 0) / cizim.length;
  const uzunluk = hamleUzunlugu(hamle);
  const nokta = uzunluk < NOKTA_UZUNLUGU;
  let kosinus = 1;
  if (!nokta) {
    const [hx0, hy0] = hamle[0];
    const [hx1, hy1] = hamle[hamle.length - 1];
    const kapali = Math.hypot(hx1 - hx0, hy1 - hy0) < uzunluk * 0.25;
    let a: Nokta;
    let b: Nokta;
    if (kapali) {
      a = baslangicYonu(hamle);
      b = cizim.length > 1 ? baslangicYonu(cizim) : [0, 0];
    } else {
      a = [hx1 - hx0, hy1 - hy0];
      b = [cizim[cizim.length - 1][0] - cizim[0][0], cizim[cizim.length - 1][1] - cizim[0][1]];
    }
    const na = Math.hypot(a[0], a[1]);
    const nb = Math.hypot(b[0], b[1]);
    kosinus = na === 0 || nb === 0 ? 0 : (a[0] * b[0] + a[1] * b[1]) / (na * nb);
  }
  const kisa = !nokta && hamleUzunlugu(cizim) < uzunluk * 0.5;
  const neden: IzlemeNedeni | undefined =
    baslangic > esik.baslangic ? 'baslangic' : sapma > esik.sapma ? 'sapma' : kosinus <= 0 ? 'yon' : kisa ? 'kisa' : undefined;
  return { gecti: neden === undefined, ...(neden ? { neden } : {}), baslangic, sapma, kosinus };
}

/** İzleme durumu (bellekte): sıradaki hamle, bu hamledeki başarısız deneme ve her hamlenin nasıl bittiği. */
export interface IzlemeDurumu {
  readonly hamle: number;
  readonly deneme: number;
  /** Biten hamleler: `cizdi` (çocuk izledi) ya da `gosterildi` (3 denemeden sonra gösterildi). Puan değildir. */
  readonly biten: readonly ('cizdi' | 'gosterildi')[];
}

export const IZLEME_BASI: IzlemeDurumu = { hamle: 0, deneme: 0, biten: [] };

/** Bir denemenin sonucunu duruma işler (saf). Hamle sayısı `toplam`a ulaşınca izleme biter. */
export function izlemeIlerle(d: IzlemeDurumu, gecti: boolean, toplam: number): IzlemeDurumu {
  if (d.hamle >= toplam) return d;
  if (gecti) return { hamle: d.hamle + 1, deneme: 0, biten: [...d.biten, 'cizdi'] };
  if (d.deneme + 1 >= IZLEME_DENEME) return { hamle: d.hamle + 1, deneme: 0, biten: [...d.biten, 'gosterildi'] };
  return { ...d, deneme: d.deneme + 1 };
}
