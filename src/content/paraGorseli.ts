/**
 * Para görseli stratejisi (plan v2 Adım 21, ADR-0014, KG-19).
 *
 * TCMB'ye yazılı izin başvurusu YAPILMAZ (KG-19) → `TCMB_YAZILI_IZIN` kalıcı olarak `false`.
 * Kâğıt (Adım 35) ve arşiv (Adım 48) her zaman şematik banknot kullanır.
 * Ekran bugün (Ekim 2026) hâlâ TCMB örnek görsellerini gösteriyor: Adım 29 kapandı ama ekran
 * geçişi yapılmadı (KG-117). Geçişte `EKRAN_TCMB_GECISI` false yapılır, TCMB dosyaları depodan
 * kalkar; Kaynaklar/veli paneli beyanı (`paraGorseliBeyani`) kendiliğinden şematik metne döner.
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

/**
 * Kaynaklar / veli paneli "Para görselleri" beyanı (KG-117). Metin stratejiden türetilir; böylece
 * ekranın gerçekte ne gösterdiğini söyler ve ekran şematiğe geçince kendiliğinden değişir.
 * Kural: TCMB izni/onayı iddia edilmez (KG-19: başvurulmaz); kâğıt ve arşiv her zaman şematik.
 */
export interface ParaGorseliBeyani {
  /** Kaynaklar ekranındaki paragraflar. */
  readonly paragraflar: readonly string[];
  /** Veli panelindeki tek cümle. */
  readonly kisa: string;
}

export function paraGorseliBeyani(ekranTcmbGecisi: boolean = EKRAN_TCMB_GECISI): ParaGorseliBeyani {
  const kupurler = `${BANKNOTLAR.slice(0, -1).join(', ')} ve ${BANKNOTLAR[BANKNOTLAR.length - 1]} TL`;
  const kagit =
    'Basılı çalışma kâğıtlarında ve kâğıt arşivinde banknotlar şematik çizimdir: değer, renk ve desen taşır, ' +
    'üzerinde "OYUN PARASI" yazar; TCMB görseli, adı veya portresi yoktur.';
  const izin =
    "TCMB'ye izin başvurusu yapılmamıştır; bu kullanım TCMB'nin izni veya onayı anlamına gelmez.";
  if (ekranTcmbGecisi) {
    return {
      paragraflar: [
        `Ekrandaki etkinliklerde ${kupurler} banknotları için TCMB'nin internet sitesinde yayımladığı ` +
          'E9 5. tertip ön yüz örnek görselleri, üzerlerindeki "ÖRNEKTİR GEÇMEZ" ibaresi korunarak, ' +
          'eğitim amacıyla ve kaynak gösterilerek kullanılır.',
        kagit,
        izin,
      ],
      kisa:
        'Banknotlar ekranda TCMB örnek görselleri ("ÖRNEKTİR GEÇMEZ"), basılı kâğıtlarda şematik "oyun parası" çizimleridir.',
    };
  }
  return {
    paragraflar: [
      'Ekranda, basılı çalışma kâğıtlarında ve kâğıt arşivinde banknotlar şematik çizimdir: değer, renk ve desen ' +
        'taşır, üzerinde "OYUN PARASI" yazar; TCMB görseli, adı veya portresi yoktur.',
      izin,
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
