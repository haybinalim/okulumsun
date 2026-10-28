/**
 * M-SAY DOKUNMA SAHNESİ YERLEŞİMİ (plan v2 KG-86) — saf, JSX'siz.
 *
 * Eski ekran nesneleri sabit 64 px ve normalize konumlarla çiziyordu; tahtada (tapMin 102 px, büyük
 * hedefte 118 px) hedef küçük kalıyor, sahne kartlar ve alt çubuk arasında ~74 px'e sıkışıyordu.
 * Burada nesneler ÖLÇÜLEN sahne kutusuna, adet ve yerleşime göre seçilen bir ızgarayla dizilir:
 *
 *  · sıra / gruplu / onluk çerçeve: bloklar (gruplu = iki öbek, onluk = 10'luk çerçeveler; 5×2 ya da
 *    dikey 2×5) yan yana ya da alt alta; hücreyi en büyük yapan biçim seçilir. Sayma sırası
 *    (satır öncelikli, blok sırasıyla) korunur — `hedefIds[i]` ↔ i. nokta.
 *  · dağınık: sahnenin en-boy oranına uyan sarsıntılı ızgara; üreticinin tohumlu konumları en yakın
 *    boş hücreye atanır (düzen aynı tohumda aynıdır), sarsıntı nesneler çakışmayacak kadar sınırlanır.
 *
 * Nesne boyu = hücrenin %80'i, alt sınır `tapMin`, üst sınır 1,6 × `tapMin`. Hücre `tapMin`'den
 * küçükse boy yine `tapMin` olur (sınır asla delinmez); `hucre` alanı bunu ekranın seçimine bildirir.
 */

export interface Nokta {
  readonly x: number;
  readonly y: number;
}

export type SayYerlesimTuru = 'sira' | 'gruplu' | 'onlukCerceve' | 'dagınık';

export interface SahneSpec {
  readonly adet: number;
  readonly layout: SayYerlesimTuru;
  /** Dağınıkta üreticinin normalize (0..1) konumları. */
  readonly konumlar?: readonly Nokta[];
}

export interface SahneYerlesimi {
  /** Nesne merkezleri (px, sahne kutusuna göre), `hedefIds` sırasıyla. */
  readonly noktalar: readonly Nokta[];
  /** Nesne kenarı (px). */
  readonly boyut: number;
  /** En küçük hücre kenarı (px) — iki düzen adayını karşılaştırmak için. */
  readonly hucre: number;
}

/** Blok ızgarası: bloklar arası boşluk, hücre cinsinden. */
const BLOK_ARASI = 0.3;
/** Nesne boyu / hücre. */
const DOLULUK = 0.8;
/** Nesne üst sınırı = bu × tapMin (az nesnede dev hedef olmasın). */
export const UST_CARPAN = 1.6;
/** Dağınıkta hücre bolluğu ve en büyük sarsıntı (üreticiyle aynı: say.ts). */
const HUCRE_BOLLUGU = 1.45;
const EN_BUYUK_SARSINTI = 0.15;

interface BlokBicimi {
  readonly sutun: number;
  readonly satir: number;
}

function bloklar(spec: SahneSpec): readonly number[] {
  const n = spec.adet;
  if (spec.layout === 'gruplu') {
    const yarisi = Math.ceil(n / 2);
    return n - yarisi > 0 ? [yarisi, n - yarisi] : [yarisi];
  }
  if (spec.layout === 'onlukCerceve') {
    const out: number[] = [];
    for (let k = n; k > 0; k -= 10) out.push(Math.min(10, k));
    return out;
  }
  return [n];
}

/** Bir bloğun aday biçimleri (sütun × satır). */
function blokBicimleri(spec: SahneSpec, enBuyukBlok: number): readonly BlokBicimi[] {
  if (spec.layout === 'onlukCerceve') {
    // Onluk çerçeve yapısı korunur: 5×2 ya da dikey 2×5 (10'dan azsa da gözler aynı yerde).
    return [
      { sutun: 5, satir: 2 },
      { sutun: 2, satir: 5 },
    ];
  }
  const out: BlokBicimi[] = [];
  for (let s = 1; s <= enBuyukBlok; s++) out.push({ sutun: s, satir: Math.ceil(enBuyukBlok / s) });
  return out;
}

function boyutHesapla(hucre: number, tapMin: number): number {
  return Math.max(tapMin, Math.min(hucre * DOLULUK, tapMin * UST_CARPAN));
}

function blokluYerlesim(spec: SahneSpec, w: number, h: number, tapMin: number): SahneYerlesimi {
  const b = bloklar(spec);
  const enBuyuk = Math.max(...b);
  let en: { hucre: number; bicim: BlokBicimi; yatay: boolean } | null = null;
  for (const bicim of blokBicimleri(spec, enBuyuk)) {
    for (const yatay of b.length > 1 ? [true, false] : [true]) {
      const sutunlar = yatay ? b.length * bicim.sutun + (b.length - 1) * BLOK_ARASI : bicim.sutun;
      const satirlar = yatay ? bicim.satir : b.length * bicim.satir + (b.length - 1) * BLOK_ARASI;
      const hucre = Math.min(w / sutunlar, h / satirlar);
      // Eşitlikte ilk aday (yatay, kanonik biçim) kalır.
      if (en === null || hucre > en.hucre + 1e-9) en = { hucre, bicim, yatay };
    }
  }
  const { hucre, bicim, yatay } = en!;
  const toplamSutun = yatay ? b.length * bicim.sutun + (b.length - 1) * BLOK_ARASI : bicim.sutun;
  const toplamSatir = yatay ? bicim.satir : b.length * bicim.satir + (b.length - 1) * BLOK_ARASI;
  // Sıra yerleşiminde son satırda eksik kalan nesneler de soldan başlar (okuma yönü).
  const x0 = (w - toplamSutun * hucre) / 2;
  const y0 = (h - toplamSatir * hucre) / 2;
  const noktalar: Nokta[] = [];
  b.forEach((adet, bi) => {
    const bx = yatay ? bi * (bicim.sutun + BLOK_ARASI) : 0;
    const by = yatay ? 0 : bi * (bicim.satir + BLOK_ARASI);
    for (let i = 0; i < adet; i++) {
      const r = Math.floor(i / bicim.sutun);
      const c = i % bicim.sutun;
      noktalar.push({ x: x0 + (bx + c + 0.5) * hucre, y: y0 + (by + r + 0.5) * hucre });
    }
  });
  return { noktalar, boyut: boyutHesapla(hucre, tapMin), hucre };
}

function dagitikYerlesim(spec: SahneSpec, w: number, h: number, tapMin: number): SahneYerlesimi {
  const n = spec.adet;
  const izgaraSec = (hedef: number) => {
    let en: { sutun: number; satir: number; hucre: number } | null = null;
    for (let s = 1; s <= hedef; s++) {
      const r = Math.ceil(hedef / s);
      const hucre = Math.min(w / s, h / r);
      if (en === null || hucre > en.hucre + 1e-9) en = { sutun: s, satir: r, hucre };
    }
    return en!;
  };
  // Önce bol hücre (dağınık görünüm); hücre nesneyi sarsıntıyla taşıyamıyorsa yalnız n hücre.
  const bol = izgaraSec(Math.max(n, Math.ceil(n * HUCRE_BOLLUGU)));
  const izgara = bol.hucre * (1 - 2 * EN_BUYUK_SARSINTI) >= tapMin ? bol : izgaraSec(n);
  const hw = w / izgara.sutun;
  const hh = h / izgara.satir;
  const hucre = Math.min(hw, hh);
  const boyut = Math.max(tapMin, Math.min(hucre * (1 - 2 * EN_BUYUK_SARSINTI), tapMin * UST_CARPAN));
  // Sarsıntı: komşu iki nesne arasında en az `boyut` kalacak kadar.
  const sarsinti = Math.max(0, Math.min(EN_BUYUK_SARSINTI, (1 - boyut / hucre) / 2));

  const kaynak: readonly Nokta[] =
    spec.konumlar && spec.konumlar.length >= n
      ? spec.konumlar.slice(0, n)
      : Array.from({ length: n }, (_, i) => ({ x: (i + 0.5) / n, y: 0.5 }));
  const dolu = new Set<number>();
  const noktalar: Nokta[] = kaynak.map((p) => {
    // Üreticinin konumuna en yakın boş hücre (normalize uzayda).
    let enIyi = -1;
    let enUzaklik = Infinity;
    for (let k = 0; k < izgara.sutun * izgara.satir; k++) {
      if (dolu.has(k)) continue;
      const cx = ((k % izgara.sutun) + 0.5) / izgara.sutun;
      const cy = (Math.floor(k / izgara.sutun) + 0.5) / izgara.satir;
      const d = (cx - p.x) ** 2 + (cy - p.y) ** 2;
      if (d < enUzaklik - 1e-12) {
        enUzaklik = d;
        enIyi = k;
      }
    }
    dolu.add(enIyi);
    const c = enIyi % izgara.sutun;
    const r = Math.floor(enIyi / izgara.sutun);
    // Sarsıntı tohumlu konumun hücre içi kesrinden: aynı madde her cihazda aynı biçimde dağılır.
    const fx = (p.x * izgara.sutun) % 1;
    const fy = (p.y * izgara.satir) % 1;
    return {
      x: (c + 0.5) * hw + (fx - 0.5) * 2 * sarsinti * hw,
      y: (r + 0.5) * hh + (fy - 0.5) * 2 * sarsinti * hh,
    };
  });
  return { noktalar, boyut, hucre: Math.min(hucre * (1 - 2 * sarsinti), hucre) };
}

/** Nesneleri `w × h` px sahneye yerleştirir. */
export function sahneYerlesimi(spec: SahneSpec, w: number, h: number, tapMin: number): SahneYerlesimi {
  if (spec.adet <= 0 || w <= 0 || h <= 0) return { noktalar: [], boyut: tapMin, hucre: 0 };
  return spec.layout === 'dagınık' ? dagitikYerlesim(spec, w, h, tapMin) : blokluYerlesim(spec, w, h, tapMin);
}

export interface Kutu {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface EkranOlculeri {
  /** Etkileşim alanı (alt %65) iç ölçüsü. */
  readonly w: number;
  readonly h: number;
  /** Seçenek kartı kenarı ve kart sayısı. */
  readonly kart: number;
  readonly kartSayisi: number;
  /** Bölge arası boşluk ve kartlar arası dar boşluk. */
  readonly bosluk: number;
  readonly darBosluk: number;
  /** Alt çubuğun (Tekrar dinle + Onayla) ölçüsü; çubuk her zaman altta ortada. */
  readonly cubukW: number;
  readonly cubukH: number;
  readonly tapMin: number;
}

export interface EkranDuzeni {
  readonly tur: 'yan' | 'dikey';
  readonly sahne: Kutu;
  readonly kartlar: Kutu;
  readonly yerlesim: SahneYerlesimi;
}

/**
 * İki aday düzen; nesne hücresi büyük olan seçilir:
 *  · 'yan': sahne solda tüm yüksekliği kullanır (alt çubuğun soluna kadar), kartlar sağ üstte,
 *    alt çubuk altta ortada (yeri diğer ekranlarla aynı).
 *  · 'dikey': sahne üstte tam genişlik, altında kart satır(lar)ı, en altta çubuk (dar ekranlar).
 */
export function ekranDuzeni(o: EkranOlculeri, spec: SahneSpec): EkranDuzeni {
  const kartSatiriW = o.kartSayisi * o.kart + Math.max(0, o.kartSayisi - 1) * o.darBosluk;
  const ustYukseklik = Math.max(0, o.h - o.cubukH - o.bosluk);

  const yanSahneW = Math.max(0, Math.min((o.w - o.cubukW) / 2 - o.bosluk, o.w - kartSatiriW - o.bosluk));
  const yan: Omit<EkranDuzeni, 'yerlesim'> = {
    tur: 'yan',
    sahne: { x: 0, y: 0, w: yanSahneW, h: o.h },
    kartlar: { x: yanSahneW + o.bosluk, y: 0, w: Math.max(0, o.w - yanSahneW - o.bosluk), h: ustYukseklik },
  };
  const yanUygun = yanSahneW > 0 && ustYukseklik >= o.kart && o.w - yanSahneW - o.bosluk >= kartSatiriW;

  const satirBasina = Math.max(1, Math.floor((o.w + o.darBosluk) / (o.kart + o.darBosluk)));
  const kartSatirlari = Math.ceil(o.kartSayisi / satirBasina);
  const kartlarH = kartSatirlari * o.kart + (kartSatirlari - 1) * o.darBosluk;
  const dikeySahneH = Math.max(0, o.h - kartlarH - o.cubukH - 2 * o.bosluk);
  const dikey: Omit<EkranDuzeni, 'yerlesim'> = {
    tur: 'dikey',
    sahne: { x: 0, y: 0, w: o.w, h: dikeySahneH },
    kartlar: { x: 0, y: dikeySahneH + o.bosluk, w: o.w, h: kartlarH },
  };

  const dikeyY = sahneYerlesimi(spec, dikey.sahne.w, dikey.sahne.h, o.tapMin);
  if (!yanUygun) return { ...dikey, yerlesim: dikeyY };
  const yanY = sahneYerlesimi(spec, yan.sahne.w, yan.sahne.h, o.tapMin);
  return yanY.hucre >= dikeyY.hucre ? { ...yan, yerlesim: yanY } : { ...dikey, yerlesim: dikeyY };
}
