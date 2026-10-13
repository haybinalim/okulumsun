/**
 * KAPSAYICILIK AYARLARI — SAF (plan v2 Adım 55, G33).
 *
 * Erişilebilirlik denetiminin üstüne, yalnız YETİŞKİNİN açabileceği altı ayar. Hepsi varsayılan
 * kapalıdır; açık uygulama oturumunda bellekte (Zustand) ve tahtada URL hash'inde (`#ayar=…`,
 * `src/ogretmen/ayarKodu.ts`) yaşar. Yeni depolama anahtarı YOK; öğrenci verisi değildir.
 *
 * Bu modül DOM'a, depolamaya, saate dokunmaz: girdi → CSS değişkenleri / sayılar.
 * Uygulayan taraf `deviceProfile.ts` (`applyProfile`) ve `speech.ts` (temel hız).
 */
import { ACCENTS, ACCENTS_RENK_KORLUGU, COLOR, COLOR_RENK_KORLUGU, SCALE, SIZE, type Accent, type DeviceProfile } from './tokens';

export interface KapsayicilikAyarlari {
  /** `yavas` → çalma hızı 0,85 × ses hızı (alt sınır 0,5). */
  readonly tempo: 'normal' | 'yavas';
  /** 8 sn hareketsizlikte talimat bir kez tekrarlanır (K1 yardımının 15 sn'si aynen kalır). */
  readonly talimatTekrari: boolean;
  readonly palet: 'standart' | 'renkKorluguDostu';
  /** Alt düğme çubuğu (Tekrar dinle ↔ Onayla) aynalanır. */
  readonly solEl: boolean;
  /** Dokunma hedefleri × 1,15 (tahtada 102 → ~118 px). */
  readonly buyukHedef: boolean;
  /** İşletim sistemi ayarından bağımsız hareket azaltma. */
  readonly hareketAzalt: boolean;
}

export const VARSAYILAN_KAPSAYICILIK: KapsayicilikAyarlari = Object.freeze({
  tempo: 'normal',
  talimatTekrari: false,
  palet: 'standart',
  solEl: false,
  buyukHedef: false,
  hareketAzalt: false,
});

/** Yavaş tempo çarpanı ve çalma hızının alt sınırı. */
export const YAVAS_TEMPO_CARPANI = 0.85;
export const EN_DUSUK_CALMA_HIZI = 0.5;
/** Büyük hedef çarpanı. */
export const BUYUK_HEDEF_CARPANI = 1.15;
/** Talimat tekrarı gecikmesi (ms) — K1'in 15 sn'sinden önce, bir kez. */
export const TALIMAT_TEKRARI_MS = 8_000;

/**
 * Büyük hedefte büyüyen uzunluklar: yalnız DOKUNULAN öğeler. Boşluk, kenar ve ölü bölge
 * değişmez — kenar payları büyürse alt %65'e sığmayan ekranlar taşar.
 */
export const BUYUYEN_HEDEFLER = ['tapMin', 'control', 'choiceMin', 'choice', 'primary', 'mascot', 'unlock'] as const satisfies readonly (keyof typeof SIZE)[];

/** Ayarlarda en az biri varsayılandan farklı mı? */
export function varsayilandanFarkliMi(a: KapsayicilikAyarlari): boolean {
  return (Object.keys(VARSAYILAN_KAPSAYICILIK) as (keyof KapsayicilikAyarlari)[]).some(
    (k) => a[k] !== VARSAYILAN_KAPSAYICILIK[k],
  );
}

/** Ses hızı (veli ayarı, 0,5–1,5) ve tempoya göre klip çalma hızı. */
export function etkinCalmaHizi(sesHizi: number, tempo: KapsayicilikAyarlari['tempo']): number {
  const temel = Number.isFinite(sesHizi) ? sesHizi : 1;
  const hiz = tempo === 'yavas' ? temel * YAVAS_TEMPO_CARPANI : temel;
  return Math.max(EN_DUSUK_CALMA_HIZI, Math.round(hiz * 1000) / 1000);
}

/** Talimat tekrarı açıksa gecikme (ms), kapalıysa `null`. */
export function talimatTekrariGecikmesi(a: KapsayicilikAyarlari): number | null {
  return a.talimatTekrari ? TALIMAT_TEKRARI_MS : null;
}

/** Profil + büyük hedef → uzunluk çarpanı. */
export function hedefOlcegi(a: KapsayicilikAyarlari, profil: DeviceProfile): number {
  return SCALE[profil] * (a.buyukHedef ? BUYUK_HEDEF_CARPANI : 1);
}

/** Seçilen paletteki vurgu rengi (id aynı kalır; ses adı değişmez). */
export function paletliVurgu(accent: Accent, palet: KapsayicilikAyarlari['palet']): string {
  if (palet === 'standart') return accent.hex;
  return ACCENTS_RENK_KORLUGU[accent.id];
}

/** Bütün vurgu renkleri seçilen palette (Sınıf Turu/avatar ızgarası gibi toplu gösterimler için). */
export function paletliVurgular(palet: KapsayicilikAyarlari['palet']): readonly { id: Accent['id']; hex: string }[] {
  return ACCENTS.map((a) => ({ id: a.id, hex: paletliVurgu(a, palet) }));
}

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * `applyProfile`'ın yazdığı değişkenlerin ÜSTÜNE yazılacak olanlar. Varsayılan ayarlarda boş
 * nesne döner (profil değişkenleri aynen kalır). Anahtarlar `--size-*`, `--color-*`, `--scale-hedef`.
 */
export function cssDegiskenleri(a: KapsayicilikAyarlari, profil: DeviceProfile): Readonly<Record<string, string>> {
  const sonuc: Record<string, string> = {};
  if (a.buyukHedef) {
    const k = hedefOlcegi(a, profil);
    for (const ad of BUYUYEN_HEDEFLER) sonuc[`--size-${kebab(ad)}`] = `${Math.round(SIZE[ad] * k)}px`;
    sonuc['--scale-hedef'] = String(Math.round(k * 1000) / 1000);
  }
  if (a.palet === 'renkKorluguDostu') {
    for (const [ad, deger] of Object.entries(COLOR_RENK_KORLUGU)) sonuc[`--color-${kebab(ad)}`] = deger;
  }
  return Object.freeze(sonuc);
}

/** Kökte (`<html>`) işaretlenecek veri öznitelikleri; CSS kuralları bunlara bağlıdır. */
export function veriOznitelikleri(a: KapsayicilikAyarlari): Readonly<Record<string, string | null>> {
  return Object.freeze({
    solEl: a.solEl ? '1' : null,
    hareketAzalt: a.hareketAzalt ? '1' : null,
    palet: a.palet === 'renkKorluguDostu' ? 'renk-korlugu' : null,
    buyukHedef: a.buyukHedef ? '1' : null,
  });
}

/** Varsayılan `COLOR` değerleri — palet kapandığında geri yazmak için (`applyProfile` zaten yazar). */
export const STANDART_RENKLER: Readonly<Pick<typeof COLOR, keyof typeof COLOR_RENK_KORLUGU>> = Object.freeze({
  correct: COLOR.correct,
  correctSoft: COLOR.correctSoft,
  retry: COLOR.retry,
  retrySoft: COLOR.retrySoft,
});
