/**
 * Para görseli stratejisi (plan v2 Adım 21, ADR-0014, KG-19).
 *
 * TCMB'ye yazılı izin başvurusu YAPILMAZ (KG-19) → `TCMB_YAZILI_IZIN` kalıcı olarak `false`.
 * Kâğıt (Adım 35) ve arşiv (Adım 48) her zaman şematik banknot kullanır.
 * Ekran bugün TCMB örnek görsellerini gösteriyor; Adım 29 ekranı da şematiğe geçirip
 * TCMB dosyalarını depodan kaldırır (o adımda `EKRAN_TCMB_GECISI` false yapılır).
 */
import { BANKNOTLAR, type BanknotDegeri } from '../exercises/types';

export type ParaGorselStratejisi = 'tcmb' | 'sematik';

export interface ParaGorselBaglami {
  readonly ortam: 'ekran' | 'kagit' | 'arsiv';
  readonly tcmbYaziliIzin: boolean;
}

/** KG-19: başvurulmaz. Değiştirmek yeni bir karar günlüğü satırı ve ADR-0014 güncellemesi ister. */
export const TCMB_YAZILI_IZIN = false as const;

/** Adım 29'a kadar ekranda TCMB örnek görselleri (eğitim amaçlı, kaynak gösterilerek). */
export const EKRAN_TCMB_GECISI = true;

export function paraGorselStratejisi(b: ParaGorselBaglami, ekranTcmbGecisi: boolean = EKRAN_TCMB_GECISI): ParaGorselStratejisi {
  if (b.ortam === 'ekran') return ekranTcmbGecisi ? 'tcmb' : 'sematik';
  return b.tcmbYaziliIzin ? 'tcmb' : 'sematik';
}

export interface SematikBanknotStili {
  /** Kupürün baskın rengi (renk tek başına anlam taşımaz: rakam + desen de var). */
  readonly renk: string;
  /** Koyu kontur/metin rengi (renk üzerinde ≥ 4.5:1). */
  readonly kontur: string;
  readonly desen: 'nokta' | 'cizgi' | 'kare' | 'dalga' | 'capraz' | 'halka';
  /** Genişlik/yükseklik oranı; kupür büyüdükçe banknot uzar (gerçek ölçüleri birebir kopyalamaz). */
  readonly oran: number;
}

/** Kupür başına ayırt edici, TCMB tasarımını taklit etmeyen şematik stil. */
export const SEMATIK_BANKNOT_STILI: Readonly<Record<BanknotDegeri, SematikBanknotStili>> = {
  5: { renk: '#C9B6E4', kontur: '#3B2466', desen: 'nokta', oran: 1.9 },
  10: { renk: '#F4B6B6', kontur: '#6B1A1A', desen: 'cizgi', oran: 1.95 },
  20: { renk: '#B9E3C6', kontur: '#1E5631', desen: 'kare', oran: 2.0 },
  50: { renk: '#F9D3A5', kontur: '#6B3A0A', desen: 'dalga', oran: 2.05 },
  100: { renk: '#B5D3F2', kontur: '#173F6B', desen: 'capraz', oran: 2.1 },
  200: { renk: '#F2B8DA', kontur: '#5E1745', desen: 'halka', oran: 2.15 },
};

export { BANKNOTLAR };
