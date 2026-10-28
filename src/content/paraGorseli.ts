/**
 * Para görselleri (plan v2 Adım 21, ADR-0014, KG-19, KG-121).
 *
 * TCMB'ye yazılı izin başvurusu YAPILMAZ (KG-19) → `TCMB_YAZILI_IZIN` kalıcı olarak `false`.
 * Banknotlar ekranda, basılı kâğıtta (Adım 35) ve kâğıt arşivinde (Adım 48) **şematik** çizilir
 * (`SematikBanknot`, "OYUN PARASI"). KG-121 (kullanıcı onayı 2026-10-29): ekran da şematiğe geçti;
 * TCMB E9 örnek raster dosyaları (`public/images/banknotlar/`) depodan kaldırıldı, ürünün hiçbir yerinde
 * TCMB görseli yok. Eski `EKRAN_TCMB_GECISI` bayrağı ve "tcmb" stratejisi bu yüzden kalktı.
 */
import { BANKNOTLAR, type BanknotDegeri } from '../exercises/types';

/** KG-19: başvurulmaz. Değiştirmek yeni bir karar günlüğü satırı ve ADR-0014 güncellemesi ister. */
export const TCMB_YAZILI_IZIN = false as const;

/**
 * Kaynaklar / veli paneli "Para görselleri" beyanı (KG-117, KG-121). Ekran, kâğıt ve arşiv aynı şematik
 * çizimi kullandığı için metin tektir. Kural: TCMB izni/onayı iddia edilmez (KG-19: başvurulmaz).
 */
export interface ParaGorseliBeyani {
  /** Kaynaklar ekranındaki paragraflar. */
  readonly paragraflar: readonly string[];
  /** Veli panelindeki tek cümle. */
  readonly kisa: string;
}

export function paraGorseliBeyani(): ParaGorseliBeyani {
  return {
    paragraflar: [
      'Ekranda, basılı çalışma kâğıtlarında ve kâğıt arşivinde banknotlar şematik çizimdir: değer, renk ve desen ' +
        'taşır, üzerinde "OYUN PARASI" yazar; TCMB görseli, adı veya portresi yoktur.',
      "TCMB'ye izin başvurusu yapılmamıştır; bu kullanım TCMB'nin izni veya onayı anlamına gelmez.",
    ],
    kisa: 'Banknotlar her yerde şematik "oyun parası" çizimleridir; TCMB görseli kullanılmaz.',
  };
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
