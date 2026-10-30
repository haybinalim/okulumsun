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
 * KG-106 (kullanıcı kararı: "sayfa sayısını artırmayacak şekilde büyümeleri ayarla"): `bosluk` komşu iki nesne
 * kutusu arasında en az boşluk (kâğıtta 1,5 mm; parmakla sayarken nesneler ayrışsın). Bileşik sahnelerin küme
 * parçaları için kutu bölüştürme (`ikiliKumeKutulari`, `satirKumeKutulari`) ve çetele için beşli sıra
 * (`besliKumeYerlesimi`) burada, saf.
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

/** Kâğıtta sayılacak nesnenin en büyük kenarı (mm); yer varsa nesne buna kadar büyür. */
export const KAGIT_NESNE_EN_BUYUK_MM = 14;
/** Kâğıtta hedef en küçük nesne kenarı (mm; KG-105 gerekçesi `docs/tasarim/nesne-cizim-rehberi.md`). */
export const KAGIT_NESNE_EN_AZ_MM = 10;
/** Kâğıtta komşu iki nesne kutusu arasında en az boşluk (mm; KG-106, parmakla sayarken nesneler ayrışsın). */
export const KAGIT_NESNE_BOSLUK_MM = 1.5;

/** Ekranda nesne kenarı / kutunun kısa kenarı (eski değer). */
export const EKRAN_NESNE_ORANI = 0.22;
/**
 * Kâğıtta nesne kenarı / hücre en çok bu kadar (komşu nesneyle arada boşluk kalsın). Dağınıkta `hucre` zaten
 * sarsıntı payı düşülmüş serbest alandır (`sayYerlesimi.ts`), o yüzden yalnız %5 boşluk bırakılır.
 */
const KAGIT_HUCRE_TAVANI = { duzenli: 0.88, daginik: 0.95 } as const;

/**
 * KG-132: tek nesneli kümeler, kardeşleri de tek nesneyken (M-VERİ-GRUPLA kategori nesneleri) kutunun kısa
 * kenarının bu kadarı — %22'de kart ve sahnede ≈ 10–20 px kalıyordu. Miktar ipucu doğmaz: hepsi aynı boyda.
 */
export const EKRAN_TEK_NESNE_ORANI = 0.7;

/** Ekran kipi: eski konumlar, kutunun içine eşlenmiş. `tekBuyuk`: tek nesne kutuyu doldurur (KG-132). */
export function ekranKumeYerlesimi(spec: KumeTarifi, w: number, h: number, tekBuyuk = false): KumeCizimi {
  const boyut = Math.min(w, h) * (tekBuyuk && spec.adet === 1 ? EKRAN_TEK_NESNE_ORANI : EKRAN_NESNE_ORANI);
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
  bosluk = 0,
): KumeCizimi {
  if (spec.adet <= 0 || w <= 0 || h <= 0) return { noktalar: [], boyut: 0 };
  // sahneYerlesimi: boy = [enAz, UST_CARPAN × enAz] aralığında hücrenin %80'i; üst sınır ve hücre aşağıda uygulanır.
  const tavan = spec.layout === 'dagınık' ? KAGIT_HUCRE_TAVANI.daginik : KAGIT_HUCRE_TAVANI.duzenli;
  // Hedef hücre: nesne enAz ve arada `bosluk` kalsın (dağınıkta bol ızgara ancak bu sağlanıyorsa seçilir).
  const y = sahneYerlesimi(spec, w, h, Math.min(Math.max(enAz / tavan, enAz + bosluk), enBuyuk));
  // `hucre` komşu iki merkez arası en kısa uzaklık (dağınıkta sarsıntı düşülmüş): kutular arası ≥ bosluk.
  const boyut = Math.max(0, Math.min(y.boyut, enBuyuk, tavan * y.hucre, y.hucre - bosluk, ortakBoyut ?? Infinity));
  return { noktalar: y.noktalar, boyut };
}

/** Kardeş kümelerin ortak nesne boyu: her birinin kendi kutusunda alabileceği en küçük boy. */
export function ortakKumeBoyutu(
  kumeler: readonly { readonly spec: KumeTarifi; readonly w: number; readonly h: number }[],
  enBuyuk: number,
  enAz?: number,
  bosluk = 0,
): number | undefined {
  if (kumeler.length < 2) return undefined;
  return Math.min(...kumeler.map((k) => kagitKumeYerlesimi(k.spec, k.w, k.h, enBuyuk, undefined, enAz, bosluk).boyut));
}

// ------------------------------------------------------------------ KG-106

/** Kutu (çizim birimi). */
export interface Dikdortgen {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Kâğıt ölçüleri (çizim birimi): üst sınır, hedef alt sınır, nesneler arası en az boşluk. */
export interface KagitOlcutu {
  readonly enBuyuk: number;
  readonly enAz: number;
  readonly bosluk: number;
}

/** Kâğıt ölçütleri çizim biriminde; `mmBirim` = 1 birimin basılı mm karşılığı. */
export function kagitOlcutu(mmBirim: number): KagitOlcutu {
  return {
    enBuyuk: KAGIT_NESNE_EN_BUYUK_MM / mmBirim,
    enAz: KAGIT_NESNE_EN_AZ_MM / mmBirim,
    bosluk: KAGIT_NESNE_BOSLUK_MM / mmBirim,
  };
}

function boyutu(spec: KumeTarifi, w: number, h: number, o: KagitOlcutu): number {
  return kagitKumeYerlesimi(spec, w, h, o.enBuyuk, undefined, o.enAz, o.bosluk).boyut;
}

/**
 * Çetele (KG-106): tek tek dizilmiş aynı nesneler beşli sıralar hâlinde (5'ten çoksa 5 sütun; sayma sırası
 * satır satır, soldan sağa). Beşli sıra serbest ızgaradan küçük nesne veriyorsa serbest ızgara kalır.
 */
export function besliKumeYerlesimi(adet: number, w: number, h: number, o: KagitOlcutu): KumeCizimi {
  const serbest = kagitKumeYerlesimi({ adet, layout: 'sira' }, w, h, o.enBuyuk, undefined, o.enAz, o.bosluk);
  if (adet <= 0) return serbest;
  const sutun = Math.min(adet, 5);
  const satir = Math.ceil(adet / sutun);
  const hucre = Math.min(w / sutun, h / satir);
  const boyut = Math.max(0, Math.min(o.enBuyuk, KAGIT_HUCRE_TAVANI.duzenli * hucre, hucre - o.bosluk));
  if (boyut < serbest.boyut - 1e-9) return serbest;
  const x0 = (w - sutun * hucre) / 2;
  const y0 = (h - satir * hucre) / 2;
  const noktalar = Array.from({ length: adet }, (_, i) => ({
    x: x0 + ((i % sutun) + 0.5) * hucre,
    y: y0 + (Math.floor(i / sutun) + 0.5) * hucre,
  }));
  return { noktalar, boyut };
}

/**
 * İki kümeli bileşik sahne (toplama, karşılaştırma "eşit mi"): iki EŞİT kutu — yan yana (varsayılan) ya da alt
 * alta (ortak nesne boyu en az %10 büyükse; sıra korunur: ilk küme solda/üstte). Eşit kutu: kaplanan alan
 * koşulu (karsilastir.ts) kutu boyuyla bozulmaz. Kutular sahnenin tüm yüksekliğini/genişliğini kullanır.
 */
export function ikiliKumeKutulari(
  a: KumeTarifi,
  b: KumeTarifi,
  w: number,
  h: number,
  ara: number,
  o: KagitOlcutu,
): { readonly kutular: readonly [Dikdortgen, Dikdortgen]; readonly boyut: number } {
  const yw = (w - ara) / 2;
  const yan = Math.min(boyutu(a, yw, h, o), boyutu(b, yw, h, o));
  const ah = (h - ara) / 2;
  const alt = Math.min(boyutu(a, w, ah, o), boyutu(b, w, ah, o));
  if (alt > yan * 1.1)
    return {
      kutular: [
        { x: 0, y: 0, w, h: ah },
        { x: 0, y: ah + ara, w, h: ah },
      ],
      boyut: alt,
    };
  return {
    kutular: [
      { x: 0, y: 0, w: yw, h },
      { x: yw + ara, y: 0, w: yw, h },
    ],
    boyut: yan,
  };
}

/** Bir satırın öğesi: küme ya da sabit genişlikli ara (işlem işareti). */
export type SatirOgesi =
  { readonly tur: 'kume'; readonly spec: KumeTarifi } | { readonly tur: 'sabit'; readonly w: number };

/** `spec`'in `h` yükseklikte `boyut` nesneyle çizilebileceği en dar genişlik (yoksa Infinity). */
function gerekenGenislik(spec: KumeTarifi, h: number, boyut: number, enGenis: number, o: KagitOlcutu): number {
  if (boyutu(spec, enGenis, h, o) < boyut - 1e-9) return Infinity;
  let alt = 0;
  let ust = enGenis;
  for (let i = 0; i < 40; i++) {
    const orta = (alt + ust) / 2;
    if (boyutu(spec, orta, h, o) >= boyut - 1e-9) ust = orta;
    else alt = orta;
  }
  return ust;
}

/**
 * Yan yana kümeler (veri grafiği sütunları, işlem sahnesi): genişlik kümelere ihtiyaçlarına göre bölüştürülür,
 * ortak nesne boyu en büyük olacak şekilde (ikili arama). Nesneler hep aynı boyda; çok nesneli küme daha geniş yer
 * kaplar (doğal: aynı boyda daha çok nesne). Artan genişlik kümelere eşit dağıtılır; sıra korunur, `ara` kümeler
 * ve sabit öğeler arasıdır.
 */
export function satirKumeKutulari(
  ogeler: readonly SatirOgesi[],
  w: number,
  h: number,
  ara: number,
  o: KagitOlcutu,
): { readonly kutular: readonly Dikdortgen[]; readonly boyut: number } {
  const kumeler = ogeler.flatMap((g) => (g.tur === 'kume' && g.spec.adet > 0 ? [g.spec] : []));
  const sabit = ogeler.reduce((t, g) => t + (g.tur === 'sabit' ? g.w : 0), 0) + ara * Math.max(0, ogeler.length - 1);
  const serbest = w - sabit;
  const genislikler = (b: number) => kumeler.map((k) => gerekenGenislik(k, h, b, serbest, o));
  const sigar = (b: number) => genislikler(b).reduce((t, x) => t + x, 0) <= serbest + 1e-9;
  let alt = 0;
  let ust = o.enBuyuk;
  if (sigar(ust)) alt = ust;
  else
    for (let i = 0; i < 40; i++) {
      const orta = (alt + ust) / 2;
      if (sigar(orta)) alt = orta;
      else ust = orta;
    }
  const g = alt > 0 ? genislikler(alt) : kumeler.map(() => serbest / Math.max(1, kumeler.length));
  const artan = Math.max(0, serbest - g.reduce((t, x) => t + x, 0)) / Math.max(1, kumeler.length);
  const kutular: Dikdortgen[] = [];
  let x = 0;
  let k = 0;
  for (const og of ogeler) {
    const gw = og.tur === 'sabit' ? og.w : og.spec.adet > 0 ? g[k++] + artan : 0;
    kutular.push({ x, y: 0, w: gw, h });
    x += gw + ara;
  }
  return { kutular, boyut: alt };
}
