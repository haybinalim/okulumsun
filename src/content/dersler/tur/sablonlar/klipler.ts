/**
 * TÜRKÇE SES KLİBİ KİMLİKLERİ (Okuma Yazma planı §2.4.7, Adım 69; D-11, D-21). SAF.
 *
 * Şablonlar ses DOSYASI değil klip KİMLİĞİ ister. Kimlik deterministiktir: aynı metin her yerde aynı kimliği
 * verir (`tur.sozcuk.kale`, `tur.hece.ta`, `tur.yonerge.t02`). Türkçe özel harfler kimlikte ASCII'ye iki
 * karakterle açılır (ç→c2, ğ→g2, ı→i2, ö→o2, ş→s2, ü→u2): "kır" ile "kir" çakışmaz.
 *
 * Klip türleri: sözcük, hece (yalnız sözcükten gelen), yönerge, geri bildirim. TEK ÜNSÜZ KLİBİ YOKTUR
 * (K-OY-03, D-11): harf kimliği üretilemez; `klipMetniGecerliMi` her klibin en az bir ünlü taşıdığını sınar.
 * Ses dosyaları Adım 67'de üretilir; o güne dek manifest (`ders-verisi/tur/ses/klipler.json`) her klibi
 * `durum: "eksik"` taşır ve arayüz sessiz çalışır ("ses yok").
 */
import { yalnizUnsuzMu } from '../alfabe';

export type TurKlipKimligi = `tur.${'sozcuk' | 'hece' | 'yonerge' | 'geri'}.${string}`;

const ASCII: Readonly<Record<string, string>> = { ç: 'c2', ğ: 'g2', ı: 'i2', ö: 'o2', ş: 's2', ü: 'u2' };

/** Küçük Türkçe metni kimlik parçasına çevirir (yalnız a-z, 0-9). */
export function klipParcasi(metin: string): string {
  const p = [...metin].map((c) => ASCII[c] ?? c).join('');
  if (!/^[a-z0-9]+$/.test(p)) throw new Error(`Klip kimliği yapılamaz: "${metin}"`);
  return p;
}

export function sozcukKlibi(sozcuk: string): TurKlipKimligi {
  return `tur.sozcuk.${klipParcasi(sozcuk)}`;
}

/** Hece klibi; hece tek ünsüz olamaz (D-11). */
export function heceKlibi(hece: string): TurKlipKimligi {
  if (yalnizUnsuzMu(hece)) throw new Error(`Tek ünsüz klibi yok (D-11): "${hece}"`);
  return `tur.hece.${klipParcasi(hece)}`;
}

/**
 * Yönerge ve geri bildirim metinleri. Okuma hedefli öğede (T-03, T-04, T-05, T-06) yönerge hedef metni
 * İÇERMEZ (D-12); bu metinler sabit olduğu için hiçbir sözcük veya hece taşımazlar.
 */
export const TUR_YONERGELERI = {
  't02': 'Dinle. Bu sözcüklerin hepsinde aynı ses var. O sesin harfini bul.',
  't03': 'Yukarıdaki harfin aynısını bul.',
  't04': 'Yukarıdaki heceyi harf kartlarıyla oluştur.',
  't05': 'Heceleri birleştir. Anlamlı bir sözcük oluştur.',
  't05-model': 'Yukarıdaki sözcüğü hece kartlarıyla oluştur.',
  't06': 'Sözcükte bir harf eksik. Eksik harfi bul.',
  't07': 'Dinle. Duyduğun sözcüğü harf kartlarıyla yaz.',
} as const;

export type TurYonergeAnahtari = keyof typeof TUR_YONERGELERI;

export function yonergeKlibi(anahtar: TurYonergeAnahtari): TurKlipKimligi {
  return `tur.yonerge.${anahtar}`;
}

export const TUR_GERI_BILDIRIMLERI = {
  dogru: 'Aferin!',
  tekrar: 'Bir daha deneyelim.',
} as const;

export function geriBildirimKlibi(anahtar: keyof typeof TUR_GERI_BILDIRIMLERI): TurKlipKimligi {
  return `tur.geri.${anahtar}`;
}

/** Klip metni seslendirilebilir mi: boş değil ve tek başına ünsüz değil (D-11). */
export function klipMetniGecerliMi(metin: string): boolean {
  return metin.trim().length > 0 && !yalnizUnsuzMu(metin);
}
