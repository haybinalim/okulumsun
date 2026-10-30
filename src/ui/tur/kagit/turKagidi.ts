/**
 * Türkçe kâğıt ailesi v1 (Okuma Yazma planı §2.4.10, Adım 65). SAF: sayfa düzeni mm cinsinden hesaplanır; çizim
 * `TurKagitSayfasi.tsx`. YALNIZ `VITE_DERS_TUR=1` derlemesinde kullanılır (ADR-0016); matematik kâğıtlarına
 * (`src/ogretmen/calismaKagidi/`, `src/ui/print/`) dokunmaz — mevcut arşiv PDF'leri ve etki A/B formları aynı kalır.
 *
 * Ölçüler (plan §2.4.10):
 *  - A4 210 × 297 mm, kenar 12 mm; sayfa tek SVG, `viewBox` mm (yazdırmada CSS mm = gerçek mm).
 *  - Satır dizgesi 1 cm: üst ve taban çizgisi 0,35 mm, ortada 0,5 + 0,5 cm kesikli kılavuz 0,25 mm; dizge arası 10 mm.
 *    Kuyruk için ayrı çizgi yok (taban altına dengeli taşar), hamle verisinin 0–100 birimi: 1 cm = 60 birim.
 *  - Glifler `hamleler.json` orta çizgisinden (font konturu yok): örnek düz, izleme kesikli, birleştirme noktalı.
 *  - Her sayfanın altında 10 × 10 mm kalibrasyon karesi + "Gerçek boyut (%100) yazdırın; kare 1 cm olmalı."
 *  - Renk yok (siyah/gri): gri baskıda aynı okunur. Puan yok; öğrenci verisi yok (kâğıt kodu yalnız tür + glif).
 */
import type { TurHamleGlifi } from '../../../content/schema/turHamle';
import { SATIR } from '../hamleCizim';

export const A4 = { en: 210, boy: 297, kenar: 12 } as const;
/** Bir satır dizgesinin yüksekliği (üst → taban), mm. */
export const DIZGE_MM = 10;
/** Hamle verisinde 1 birim kaç mm (1 cm = 60 birim). */
export const BIRIM_MM = DIZGE_MM / (SATIR.taban - SATIR.ust);
/** Bir dizgenin tabanından sonrakinin üst çizgisine boşluk, mm (kuyruk ve noktalar sığar). */
export const DIZGE_ARASI_MM = 10;
export const SATIR_ADIMI_MM = DIZGE_MM + DIZGE_ARASI_MM;
export const CIZGI_MM = { ust: 0.35, taban: 0.35, kilavuz: 0.25, kilavuzKesik: [1.2, 1] } as const;
export const KALIBRASYON_MM = 10;
export const KALIBRASYON_NOTU = 'Gerçek boyut (%100) yazdırın; kare 1 cm olmalı.';
/** Üst bilgi ve alt bilgi bantları (içerik alanının içinde), mm. */
export const UST_BANT_MM = 16;
export const ALT_BANT_MM = 14;
/** Kalem: örnek glif, izleme kesiği, birleştirme noktası (mm). */
export const KALEM_MM = { ornek: 0.8, izle: 0.45, nokta: 0.75, noktaAraligi: 2.2, izleKesik: [1.1, 0.9] } as const;

export const ICERIK = {
  x: A4.kenar,
  y: A4.kenar + UST_BANT_MM,
  en: A4.en - 2 * A4.kenar,
  boy: A4.boy - 2 * A4.kenar - UST_BANT_MM - ALT_BANT_MM,
} as const;

export type TurKagitTuru = 'harf' | 'rakam' | 'dikte' | 'gozlem' | 'destek';

export type TurKagitIstegi =
  | { readonly tur: 'harf'; readonly bicim: 'kucuk' | 'buyuk'; readonly glif: string }
  | { readonly tur: 'rakam'; readonly bicim: 'rakam'; readonly glif: string }
  | { readonly tur: 'dikte' }
  | { readonly tur: 'gozlem' }
  | { readonly tur: 'destek'; readonly glifler: readonly DestekGlifi[] };

/** Destek kâğıdında bir glif (öğretmen seçer; en çok `DESTEK_EN_COK`). */
export interface DestekGlifi {
  readonly bicim: 'kucuk' | 'buyuk' | 'rakam';
  readonly glif: string;
}

/** Destek kâğıdı tek sayfa: glif başına izleme + bağımsız satır → en çok 6 glif. */
export const DESTEK_EN_COK = 6;

const KUCUK = 'abcçdefgğhıijklmnoöprsştuüvyz';
const BUYUK = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';

/**
 * Kâğıt kodu (`?arsiv=tur-…`): `tur-harf-a`, `tur-harf-A`, `tur-rakam-3`, `tur-dikte`, `tur-gozlem`, destek kâğıdı
 * `tur-destek-a.n.E.4` (glifler noktayla, seçim sırasıyla; rakam 0–9). Büyük/küçük harf anlamlı. Kod yalnız glif
 * seçimini taşır, öğrenciye ait hiçbir şey taşımaz; uygulama saklamaz.
 */
export function turKagitKodu(i: TurKagitIstegi): string {
  if (i.tur === 'destek') return `tur-destek-${i.glifler.map((g) => g.glif).join('.')}`;
  return i.tur === 'dikte' || i.tur === 'gozlem' ? `tur-${i.tur}` : `tur-${i.tur}-${i.glif}`;
}

function destekGlifi(ch: string): DestekGlifi | null {
  if ([...ch].length !== 1) return null;
  if (/^[0-9]$/.test(ch)) return { bicim: 'rakam', glif: ch };
  if (KUCUK.includes(ch)) return { bicim: 'kucuk', glif: ch };
  if (BUYUK.includes(ch)) return { bicim: 'buyuk', glif: ch };
  return null;
}

export function turKagitKoduCoz(ham: string): TurKagitIstegi | null {
  let kod: string;
  try {
    kod = decodeURIComponent(ham).normalize('NFC');
  } catch {
    return null;
  }
  if (kod === 'tur-dikte') return { tur: 'dikte' };
  if (kod === 'tur-gozlem') return { tur: 'gozlem' };
  const d = /^tur-destek-(.+)$/u.exec(kod);
  if (d) {
    const parcalar = d[1].split('.');
    if (parcalar.length < 1 || parcalar.length > DESTEK_EN_COK || new Set(parcalar).size !== parcalar.length)
      return null;
    const glifler = parcalar.map(destekGlifi);
    return glifler.every((g): g is DestekGlifi => g !== null) ? { tur: 'destek', glifler } : null;
  }
  const m = /^tur-(harf|rakam)-(.)$/u.exec(kod);
  if (!m) return null;
  const [, tur, glif] = m;
  if (tur === 'rakam') return /^[0-9]$/.test(glif) ? { tur: 'rakam', bicim: 'rakam', glif } : null;
  if (KUCUK.includes(glif)) return { tur: 'harf', bicim: 'kucuk', glif };
  if (BUYUK.includes(glif)) return { tur: 'harf', bicim: 'buyuk', glif };
  return null;
}

export type SatirKipi = 'izle' | 'birlestir' | 'bagimsiz' | 'bos';

export interface KagitSatiri {
  readonly kip: SatirKipi;
  /** Dizgenin üst çizgisinin y'si (mm, sayfa koordinatı). */
  readonly y: number;
  /** Satır başındaki düz örneğin sol kenarı (mm); `bos` satırda yok. */
  readonly ornekX?: number;
  /** Kesikli / noktalı kopyaların sol kenarları (mm). */
  readonly kopyalar: readonly number[];
  /** Destek kâğıdında satırın glifi (`destekGlifleri` sırası); diğer kâğıtlarda yok (sayfanın tek glifi). */
  readonly glifSirasi?: number;
}

export interface OrnekKutusu {
  readonly x: number;
  readonly y: number;
  /** Büyük örnekte dizge yüksekliği (mm); numaralı oklar bu ölçekte. */
  readonly dizgeMm: number;
  readonly en: number;
  readonly boy: number;
}

export interface TurKagitSayfasi {
  readonly kod: string;
  readonly baslik: string;
  readonly altBaslik: string;
  readonly ornek?: OrnekKutusu;
  readonly satirlar: readonly KagitSatiri[];
  /** Gözlem listesi bölümleri (puansız; yalnız `tur-gozlem`). */
  readonly gozlem: readonly GozlemBolumu[];
}

export interface GozlemBolumu {
  readonly baslik: string;
  readonly olcutler: readonly string[];
}

/** Glifin dizge üstündeki eni (mm). */
export const glifEniMm = (g: Pick<TurHamleGlifi, 'genislik'>): number => g.genislik * BIRIM_MM;

/** Bir satıra sığan kopya konumları: örnekten sonra eşit aralık (adım en az 16 mm, glif eninin iki katı ve en + 9 mm). */
export function kopyaKonumlari(g: Pick<TurHamleGlifi, 'genislik'>, basX: number, bitisX: number): number[] {
  const en = glifEniMm(g);
  const adim = Math.max(16, 2 * en, en + 9);
  const sonuc: number[] = [];
  for (let x = basX; x + en <= bitisX + 1e-9; x += adim) sonuc.push(+x.toFixed(3));
  return sonuc;
}

const SATIR_KIPLERI: readonly SatirKipi[] = [
  'izle',
  'izle',
  'izle',
  'birlestir',
  'birlestir',
  'birlestir',
  'bagimsiz',
  'bagimsiz',
  'bagimsiz',
];

/**
 * Gözlem listesi ölçütleri (kendi tasarımımız; programın "gözlem formu / kontrol listesi" önerisine göre, Ek 2
 * formlarının birebir kopyası değildir; öğretmen teyidinde sorulur). PUAN YOK: her ölçüt için "Gözlendi" ve
 * "Desteğe ihtiyaç var" kutusu ve not alanı. Öğretmen elle doldurur; uygulama hiçbir şey saklamaz.
 */
export const GOZLEM_BOLUMLERI: readonly GozlemBolumu[] = [
  {
    baslik: 'Harf ve rakam yazılışı',
    olcutler: [
      'Hamleye doğru noktadan başlıyor.',
      'Hamle sırasını ve yönünü izliyor.',
      'Satır çizgileri arasında kalıyor.',
      'Kalemi rahat tutuyor, oturuşu uygun.',
    ],
  },
  {
    baslik: 'Ses hissettirme',
    olcutler: [
      'Sesi doğru çıkarıyor.',
      'Sesi sözcüğün başında fark ediyor.',
      'Sesi sözcüğün içinde ve sonunda fark ediyor.',
      'Sesin geçtiği görseli seçiyor.',
    ],
  },
];

const ORNEK_DIZGE_MM = 16;

/**
 * Harf / rakam kâğıdı (tür 1, 2): üstte hamle hamle yazılış sırası (her hamle ayrı karede: önceki hamleler gri,
 * sıradaki siyah, başlangıç noktası ve uçta yön oku, üstünde numarası); sonra 3 izleme (kesikli), 3 birleştirme
 * (noktalı) ve 3 bağımsız satır; her satırın başında düz örnek. Tek sayfa (sayfa tavanı).
 */
export function yazilisSayfasi(
  i: Extract<TurKagitIstegi, { tur: 'harf' | 'rakam' }>,
  g: TurHamleGlifi,
): TurKagitSayfasi {
  const ornekBoy = ORNEK_DIZGE_MM * (110 / 60) + 8;
  const ornek: OrnekKutusu = { x: ICERIK.x, y: ICERIK.y, dizgeMm: ORNEK_DIZGE_MM, en: ICERIK.en, boy: ornekBoy };
  const ilkUst = ICERIK.y + ornekBoy + 10;
  const en = glifEniMm(g);
  const solX = ICERIK.x + 2;
  const kopyaBas = solX + en + Math.max(8, en);
  const satirlar = SATIR_KIPLERI.map((kip, n) => ({
    kip,
    y: +(ilkUst + n * SATIR_ADIMI_MM).toFixed(3),
    ornekX: solX,
    kopyalar: kip === 'bagimsiz' ? [] : kopyaKonumlari(g, kopyaBas, ICERIK.x + ICERIK.en - 2),
  }));
  const ad = i.tur === 'rakam' ? `${i.glif} rakamı` : `${i.glif} harfi (${i.bicim === 'kucuk' ? 'küçük' : 'büyük'})`;
  return {
    kod: turKagitKodu(i),
    baslik: `Yazılış: ${ad}`,
    altBaslik: 'Örneğe bak. Kesik çizginin, sonra noktaların üzerinden geç. Son satırlarda kendin yaz.',
    ornek,
    satirlar,
    gozlem: [],
  };
}

/** Dikte sayfası (tür 4): boş satır dizgeleri; öğretmen okur. Gözlem yok (sayfa yalnız yazı içindir). */
export function dikteSayfasi(): TurKagitSayfasi {
  const n = Math.floor((ICERIK.boy + DIZGE_ARASI_MM - 4) / SATIR_ADIMI_MM);
  return {
    kod: 'tur-dikte',
    baslik: 'Dikte',
    altBaslik: 'Öğretmenin söylediğini satırlara yaz.',
    satirlar: Array.from({ length: n }, (_, k) => ({
      kip: 'bos' as const,
      y: +(ICERIK.y + 4 + k * SATIR_ADIMI_MM).toFixed(3),
      kopyalar: [],
    })),
    gozlem: [],
  };
}

/** Gözlem listesi (tür 5 + 6, puansız): iki bölüm, her ölçütte iki kutu ve not çizgisi. Tek sayfa. */
export function gozlemSayfasi(): TurKagitSayfasi {
  return {
    kod: 'tur-gozlem',
    baslik: 'Gözlem listesi',
    altBaslik: 'Puan yok. Gördüğünüzü işaretleyin; uygulama bu kâğıdı saklamaz.',
    satirlar: [],
    gozlem: GOZLEM_BOLUMLERI,
  };
}

/**
 * Öğrenciye özel destek kâğıdı (tür 8): öğretmenin seçtiği her glif için bir izleme (kesikli) ve bir bağımsız satır,
 * satır başında düz örnek. Tek sayfa (≤ 6 glif). Öğretmen seçer; kâğıt kodu yalnız gliflerdir, uygulama saklamaz.
 */
export function destekSayfasi(
  i: Extract<TurKagitIstegi, { tur: 'destek' }>,
  glifler: readonly TurHamleGlifi[],
): TurKagitSayfasi {
  const solX = ICERIK.x + 2;
  const satirlar: KagitSatiri[] = [];
  i.glifler.forEach((dg, n) => {
    const g = glifler.find((x) => x.bicim === dg.bicim && x.glif === dg.glif);
    if (!g) return;
    const en = glifEniMm(g);
    const kopyaBas = solX + en + Math.max(8, en);
    for (const [k, kip] of (['izle', 'bagimsiz'] as const).entries()) {
      satirlar.push({
        kip,
        y: +(ICERIK.y + 6 + (2 * n + k) * SATIR_ADIMI_MM).toFixed(3),
        ornekX: solX,
        kopyalar: kip === 'izle' ? kopyaKonumlari(g, kopyaBas, ICERIK.x + ICERIK.en - 2) : [],
        glifSirasi: n,
      });
    }
  });
  return {
    kod: turKagitKodu(i),
    baslik: 'Destek kâğıdı',
    altBaslik: 'Örneğe bak. Kesik çizginin üzerinden geç, alt satırda kendin yaz.',
    satirlar,
    gozlem: [],
  };
}

/** Satırın en alt noktası (kuyruk dahil), mm. */
export const satirAltiMm = (s: Pick<KagitSatiri, 'y'>): number => s.y + (SATIR.kuyruk - SATIR.ust) * BIRIM_MM;

/** Sayfa içerik alanı denetimi (test ve geliştirme): her satır ve örnek kutusu içerik alanında mı? */
export function sayfaTasmasi(s: TurKagitSayfasi): string[] {
  const hata: string[] = [];
  const alt = ICERIK.y + ICERIK.boy;
  if (s.ornek && s.ornek.y + s.ornek.boy > alt) hata.push('örnek kutusu taşıyor');
  for (const [k, r] of s.satirlar.entries()) {
    if (r.y - SATIR.ust * BIRIM_MM < ICERIK.y - 1e-9) hata.push(`satır ${k + 1} üstten taşıyor`);
    if (satirAltiMm(r) > alt + 1e-9) hata.push(`satır ${k + 1} alttan taşıyor`);
  }
  return hata;
}

/** Destek isteğinin gliflerini veride bulur (sırayla; bulunamayan atlanır). */
export function destekGlifleri(i: TurKagitIstegi, glifler: readonly TurHamleGlifi[]): TurHamleGlifi[] {
  if (i.tur !== 'destek') return [];
  return i.glifler.flatMap((d) => glifler.filter((g) => g.bicim === d.bicim && g.glif === d.glif));
}

/** İsteğin glifini hamle verisinde bulur (`bicim` + `glif`). */
export function istekGlifi(i: TurKagitIstegi, glifler: readonly TurHamleGlifi[]): TurHamleGlifi | undefined {
  if (i.tur === 'dikte' || i.tur === 'gozlem' || i.tur === 'destek') return undefined;
  return glifler.find((g) => g.bicim === i.bicim && g.glif === i.glif);
}

/** Bir kâğıt isteğinin sayfaları (v1'de her tür tek sayfa; sayfa tavanı: harf kâğıdı 1, set ≤ 4). */
export function turKagitSayfalari(
  i: TurKagitIstegi,
  glifler: readonly TurHamleGlifi[],
): { sayfa: TurKagitSayfasi; glif?: TurHamleGlifi; glifler?: readonly TurHamleGlifi[] }[] {
  if (i.tur === 'dikte') return [{ sayfa: dikteSayfasi() }];
  if (i.tur === 'destek') {
    const g = destekGlifleri(i, glifler);
    return g.length === i.glifler.length ? [{ sayfa: destekSayfasi(i, glifler), glifler: g }] : [];
  }
  if (i.tur === 'gozlem') return [{ sayfa: gozlemSayfasi() }];
  const g = istekGlifi(i, glifler);
  return g ? [{ sayfa: yazilisSayfasi(i, g), glif: g }] : [];
}
