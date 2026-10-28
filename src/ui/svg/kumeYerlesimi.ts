/**
 * NESNE KÜMESİ YERLEŞİMİ — saf, JSX'siz (plan v2 Adım 59 aşama 3, KG-105).
 *
 * İki kip:
 *  · ekran: eski normalize konumlar (`positions.ts`), nesne kutunun kısa kenarının %22'si. Konumlar kutunun
 *    İÇİNE eşlenir (merkez ∈ [boyut/2, kenar − boyut/2]); eskiden kenardaki nesnenin yarısı SVG sınırında
 *    kırpılıyordu (tek nesne sol üst köşede yarımdı).
 *  · kâğıt: ölçülen kutuya M-SAY tahta düzeniyle (`sayYerlesimi.ts`, KG-86) aynı ızgara; nesne hücreyi
 *    doldurur, üst sınır `enBuyuk` (kâğıtta 14 mm). Sıra/gruplu/onluk yapısı ve sayma sırası korunur; nesne
 *    hücreden büyük olamaz (çakışma ve kırpılma yok).
 *
 * Aynı maddedeki kümeler (karşılaştırma seçenekleri, toplama sahnesinin iki parçası) `ortakBoyut` ile AYNI
 * nesne boyunda çizilir: "az olanın nesnesi büyük" gibi miktarla ilişkili yeni bir algısal ipucu doğmaz
 * (karsilastir.ts çelişki koşulları sprite boyut sınıfı ve düzenle kurulur, çizimle değil).
 */
import { nesneKonumlari } from './positions';
import { sahneYerlesimi, UST_CARPAN, type Nokta } from './sayYerlesimi';

export interface KumeTarifi {
  readonly adet: number;
  readonly layout: 'sira' | 'gruplu' | 'onlukCerceve' | 'dagınık';
  readonly konumlar?: readonly Nokta[];
}

export interface KumeCizimi {
  /** Nesne merkezleri (kutu birimi), nesne sırasıyla. */
  readonly noktalar: readonly Nokta[];
  /** Nesne kenarı (kutu birimi). */
  readonly boyut: number;
}

/** Ekranda nesne kenarı / kutunun kısa kenarı (eski değer). */
export const EKRAN_NESNE_ORANI = 0.22;
/**
 * Kâğıtta nesne kenarı / hücre en çok bu kadar (komşu nesneyle arada boşluk kalsın). Dağınıkta `hucre` zaten
 * sarsıntı payı düşülmüş serbest alandır (`sayYerlesimi.ts`), o yüzden yalnız %5 boşluk bırakılır.
 */
const KAGIT_HUCRE_TAVANI = { duzenli: 0.88, daginik: 0.95 } as const;

/** Ekran kipi: eski konumlar, kutunun içine eşlenmiş. */
export function ekranKumeYerlesimi(spec: KumeTarifi, w: number, h: number): KumeCizimi {
  const boyut = Math.min(w, h) * EKRAN_NESNE_ORANI;
  const noktalar = nesneKonumlari(spec).map((p) => ({
    x: boyut / 2 + p.x * Math.max(0, w - boyut),
    y: boyut / 2 + p.y * Math.max(0, h - boyut),
  }));
  return { noktalar, boyut };
}

/**
 * Kâğıt kipi: `w × h` kutuya ızgara; nesne en çok `enBuyuk`, en çok hücrenin %88'i (dağınıkta serbest alanın
 * %95'i). `enAz` hedeftir, sınır değil: dağınıkta bol hücreli (daha dağınık görünen) ızgara ancak nesne ≥ `enAz`
 * kalıyorsa seçilir; yer yoksa nesne hücreye sığacak kadar küçülür. `ortakBoyut` verilirse nesne ondan büyük
 * olmaz (aynı maddedeki kardeş kümelerle eşit boy).
 */
export function kagitKumeYerlesimi(
  spec: KumeTarifi,
  w: number,
  h: number,
  enBuyuk: number,
  ortakBoyut?: number,
  enAz: number = enBuyuk / UST_CARPAN,
): KumeCizimi {
  if (spec.adet <= 0 || w <= 0 || h <= 0) return { noktalar: [], boyut: 0 };
  // sahneYerlesimi: boy = [enAz, UST_CARPAN × enAz] aralığında hücrenin %80'i; üst sınır ve hücre aşağıda uygulanır.
  const tavan = spec.layout === 'dagınık' ? KAGIT_HUCRE_TAVANI.daginik : KAGIT_HUCRE_TAVANI.duzenli;
  const y = sahneYerlesimi(spec, w, h, Math.min(enAz / tavan, enBuyuk));
  const boyut = Math.min(y.boyut, enBuyuk, tavan * y.hucre, ortakBoyut ?? Infinity);
  return { noktalar: y.noktalar, boyut };
}

/** Kardeş kümelerin ortak nesne boyu: her birinin kendi kutusunda alabileceği en küçük boy. */
export function ortakKumeBoyutu(
  kumeler: readonly { readonly spec: KumeTarifi; readonly w: number; readonly h: number }[],
  enBuyuk: number,
  enAz?: number,
): number | undefined {
  if (kumeler.length < 2) return undefined;
  return Math.min(...kumeler.map((k) => kagitKumeYerlesimi(k.spec, k.w, k.h, enBuyuk, undefined, enAz).boyut));
}
