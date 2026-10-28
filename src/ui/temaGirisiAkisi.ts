/**
 * DERİN TEMA GİRİŞİ AKIŞI (plan v2 Adım 45 aşama 2, KG-112) — SAF durum makinesi.
 *
 * Her adım: anlatım söylenir → `izle` adımı `enUzunBeklemeMs` sonra kendiliğinden ilerler; `dokun` adımı
 * dokunuşu bekler, dokunulmazsa `enUzunBeklemeMs` sonra anlatımı BİR kez tekrarlar, yine dokunulmazsa
 * kendiliğinden ilerler (çocuk takılıp kalmaz; ceza/yanlış yok). Dokununca kısa övgü, sonra ilerler.
 * Saat, ses, rastgelelik ve depolama YOK: zamanlayıcılar ve ses ekranda (`DerinTemaGirisi.tsx`).
 */
import type { TemaGirisAdimi } from '../content/schema/temaGirisi';

/** `dokun` adımında anlatımın en çok kaç kez tekrarlanacağı (sonra kendiliğinden ilerler). */
export const DOKUN_TEKRAR_SINIRI = 1;
/** Övgüden sonra bir sonraki adıma geçmeden önceki kısa ara (ms). */
export const OVGU_SONRASI_MS = 500;

export interface GirisDurumu {
  readonly adim: number;
  /** Bu adımda anlatım kaç kez tekrarlandı. */
  readonly tekrar: number;
  readonly dokunuldu: boolean;
  readonly bitti: boolean;
}

export type GirisOlayi =
  /** Anlatımdan sonra beklenen süre doldu. */
  | { readonly tur: 'beklemeDoldu' }
  /** Çocuk hedef karta dokundu. */
  | { readonly tur: 'dokun' }
  /** Dokunuştan sonraki övgü bitti. */
  | { readonly tur: 'ovguBitti' };

export const GIRIS_BASLANGIC: GirisDurumu = { adim: 0, tekrar: 0, dokunuldu: false, bitti: false };

function ilerle(d: GirisDurumu, adimSayisi: number): GirisDurumu {
  return d.adim + 1 >= adimSayisi
    ? { ...d, dokunuldu: false, bitti: true }
    : { adim: d.adim + 1, tekrar: 0, dokunuldu: false, bitti: false };
}

/** Geçersiz olay durumu DEĞİŞTİRMEZ (aynı nesne döner): ör. izle adımında dokunuş, çift dokunuş. */
export function girisIlerlet(d: GirisDurumu, o: GirisOlayi, adimlar: readonly Pick<TemaGirisAdimi, 'eylem'>[]): GirisDurumu {
  if (d.bitti) return d;
  const adim = adimlar[d.adim];
  if (!adim) return { ...d, bitti: true };
  switch (o.tur) {
    case 'beklemeDoldu':
      if (d.dokunuldu) return d;
      if (adim.eylem === 'izle') return ilerle(d, adimlar.length);
      return d.tekrar < DOKUN_TEKRAR_SINIRI ? { ...d, tekrar: d.tekrar + 1 } : ilerle(d, adimlar.length);
    case 'dokun':
      return adim.eylem === 'dokun' && !d.dokunuldu ? { ...d, dokunuldu: true } : d;
    case 'ovguBitti':
      return d.dokunuldu ? ilerle(d, adimlar.length) : d;
  }
}

/**
 * Kişisel modda tema girişinin biçimi: oturum (uygulama açık kaldığı süre) başına en çok BİR derin giriş;
 * sonrakiler kısa. Tahtada derin giriş yalnız öğretmen "Temaya giriş" kartıyla başlatır.
 */
export function kisiselGirisBicimi(derinGosterildi: boolean): 'kisa' | 'derin' {
  return derinGosterildi ? 'kisa' : 'derin';
}
