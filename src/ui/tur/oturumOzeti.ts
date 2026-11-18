/**
 * OTURUM ÖZETİ (öğretmen; Okuma Yazma Adım 81, E5) — YALNIZ `VITE_DERS_TUR=1` derlemesinde. SAF + yalnız bellek.
 *
 * Tahtada bir set bitince öğretmen ekranında "Bu derste ne yaptık": hangi harfler, hangi etkinlik türleri, kaç etkinlik
 * açıldı, hangi etkinlikte yanlış denemeden sonra düzeltildi ya da soru yeniden dinlendi. NİTEL: puan, yüzde, süre, deneme sayısı ve
 * öğrenci adı YOKTUR (matematikteki tema sonu nitel düzey deseni). Kayıt bu modülün değişkeninde durur; set ekranından
 * çıkınca silinir (`ozetSil`); hiçbir depoya (yerel depo, veritabanı, çerez, ağ) yazılmaz. Yazdırma tarayıcının
 * yazdırma penceresidir (ağ yok).
 *
 * Olay işlevleri oturum açık değilse (set akışı dışındaki tek etkinlik, eve link cihazı) hiçbir şey yapmaz.
 */
import { OGRETIM_SIRASI, trBuyuk } from '../../content/dersler/tur/alfabe';
import type { TurSablonKodu } from '../../content/dersler/tur/sablonlar/turSoru';

export interface EtkinlikKaydi {
  readonly sablon: TurSablonKodu;
  /** Yanlış denemeden sonra düzeltilerek çözüldü (sınıfın "birlikte çözdüğü" anlamına gelmez; yalnız bu gözlenir). */
  readonly birlikte: boolean;
  /** "Tekrar dinle" basıldı: soru yeniden dinlendi (kimin dinlettiği, çocuk ya da öğretmen, bilinmez; "yardım istendi" denmez). */
  readonly yardim: boolean;
  readonly cozuldu: boolean;
}

export type EtkinlikDuzeyi = 'hemen' | 'birlikte' | 'yardim' | 'birlikteVeYardim' | 'cozulmedi';

let oturum: EtkinlikKaydi[] | null = null;
let suanki = -1;

/** Yeni oturum (set başı ve "Baştan"): önceki kayıt silinir. */
export function ozetBaslat(): void {
  oturum = [];
  suanki = -1;
}

/** Set ekranından çıkış: kayıt bellekten silinir. */
export function ozetSil(): void {
  oturum = null;
  suanki = -1;
}

export function ozetAcikMi(): boolean {
  return oturum !== null;
}

/** `sira`. adımdaki etkinlik açıldı (aynı adım yeniden bildirilirse tek kayıt kalır). */
export function ozetEtkinlikAcildi(sira: number, sablon: TurSablonKodu): void {
  if (!oturum) return;
  suanki = sira;
  oturum[sira] ??= { sablon, birlikte: false, yardim: false, cozuldu: false };
}

function guncelle(f: Partial<Omit<EtkinlikKaydi, 'sablon'>>): void {
  const k = oturum?.[suanki];
  if (oturum && k) oturum[suanki] = { ...k, ...f };
}

export const ozetYanlisDenendi = (): void => guncelle({ birlikte: true });
export const ozetTekrarDinlendi = (): void => guncelle({ yardim: true });
export const ozetCozuldu = (): void => guncelle({ cozuldu: true });

/** Açılan etkinlikler sırayla; oturum yoksa `null`. */
export function ozetKaydi(): readonly EtkinlikKaydi[] | null {
  return oturum ? oturum.filter((k): k is EtkinlikKaydi => k !== undefined) : null;
}

export function etkinlikDuzeyi(k: EtkinlikKaydi): EtkinlikDuzeyi {
  if (!k.cozuldu) return 'cozulmedi';
  if (k.birlikte && k.yardim) return 'birlikteVeYardim';
  if (k.birlikte) return 'birlikte';
  if (k.yardim) return 'yardim';
  return 'hemen';
}

export const DUZEY_METNI: Readonly<Record<EtkinlikDuzeyi, string>> = {
  hemen: 'İlk denemede çözüldü',
  birlikte: 'Yanlış denemeden sonra düzeltilerek çözüldü',
  yardim: 'Soru yeniden dinlendi',
  birlikteVeYardim: 'Yanlış denemeden sonra düzeltilerek çözüldü, soru yeniden dinlendi',
  cozulmedi: 'Çözülmeden geçildi',
};

export interface OturumOzeti {
  /** Öğretilen harflerin gösterimi (küme sırasıyla verilir). */
  readonly harfler: readonly string[];
  /** Etkinlik türleri, ilk açılış sırasıyla, yinelenmeden. */
  readonly turler: readonly TurSablonKodu[];
  /** Açılan etkinlik sayısı (olgu; başarı ölçüsü değildir). */
  readonly acilan: number;
  readonly satirlar: readonly { readonly sira: number; readonly sablon: TurSablonKodu; readonly duzey: EtkinlikDuzeyi }[];
  /** Yanlış denemeden sonra düzeltilerek çözülen etkinlik türleri. */
  readonly birlikteCozulen: readonly TurSablonKodu[];
  /** Sorusu yeniden dinlenen etkinlik türleri. */
  readonly yardimIstenen: readonly TurSablonKodu[];
}

const tekil = <T>(l: readonly T[]): T[] => [...new Set(l)];

export function ozetOlustur(kayit: readonly EtkinlikKaydi[], harfler: readonly string[]): OturumOzeti {
  const satirlar = kayit.map((k, i) => ({ sira: i + 1, sablon: k.sablon, duzey: etkinlikDuzeyi(k) }));
  const birlikte = (d: EtkinlikDuzeyi) => d === 'birlikte' || d === 'birlikteVeYardim';
  const yardim = (d: EtkinlikDuzeyi) => d === 'yardim' || d === 'birlikteVeYardim';
  return {
    harfler,
    turler: tekil(kayit.map((k) => k.sablon)),
    acilan: kayit.length,
    satirlar,
    birlikteCozulen: tekil(satirlar.filter((s) => birlikte(s.duzey)).map((s) => s.sablon)),
    yardimIstenen: tekil(satirlar.filter((s) => yardim(s.duzey)).map((s) => s.sablon)),
  };
}

/** Küme → gösterilecek harfler (resmî sırada küçük harf; büyük harf de açıksa "A" biçimiyle eklenir). */
export function ozetHarfleri(kume: ReadonlySet<string>): string[] {
  return OGRETIM_SIRASI.filter((h) => kume.has(h)).map((h) => (kume.has(trBuyuk(h)) ? `${h} ${trBuyuk(h)}` : h));
}
