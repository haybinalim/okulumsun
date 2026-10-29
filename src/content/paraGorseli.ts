/**
 * Para görselleri (plan v2 Adım 21, ADR-0014, KG-122).
 *
 * KG-122 (kullanıcı kararı 2026-10-29): banknotlar ekranda, basılı çalışma kâğıtlarında ve kâğıt arşivinde
 * TCMB'nin yayımladığı E9 5. tertip ön yüz örnek görselleridir ("ÖRNEKTİR GEÇMEZ"); çocuk gerçek parayı
 * tanımalı, şematik çizim okuma gerektiriyordu ve "gerçek para değil" izlenimi veriyordu. KG-19'un şematik
 * kuralı, KG-121 ve KG-28/KG-117'nin şematik kısımlarının yerine geçer. TCMB'ye izin başvurusu yapılmadı
 * (KG-19'un başvuru kısmı geçerli); metinler izin/onay iddia etmez.
 *
 * Uyum: TCMB "Banknotların Resim ve Görüntülerinin Çoğaltılması ve Yayınlanması ile İlgili Duyuru"
 * (RG 24.02.2004/25383, değişik 13.10.2004/25612) — elektronik ortamda gerçek boyutta ≤ 72 dpi ve
 * "ÖRNEKTİR GEÇMEZ" ibaresi (madde 4–5); kâğıtta tek taraflı ve en/boyun %75'inden küçük (madde 1).
 */
import { BANKNOTLAR, type BanknotDegeri } from '../exercises/types';

/** Gerçek banknot ölçüleri, mm (TCMB E9 duyurusu: 64×130 … 72×160). */
export const BANKNOT_OLCULERI_MM: Readonly<Record<BanknotDegeri, { readonly en: number; readonly boy: number }>> = {
  5: { en: 130, boy: 64 },
  10: { en: 136, boy: 64 },
  20: { en: 142, boy: 68 },
  50: { en: 148, boy: 68 },
  100: { en: 154, boy: 72 },
  200: { en: 160, boy: 72 },
};

/** Duyuru madde 4: elektronik çoğaltmada gerçek boyutta çözünürlük üst sınırı. */
export const TCMB_EKRAN_DPI_SINIRI = 72;
/** Duyuru madde 1: tek taraflı basılı çoğaltma gerçek en ve boyun %75'inden küçük olmalı. */
export const TCMB_KAGIT_OLCEK_SINIRI = 0.75;

/** Kupürün en/boy oranı (gerçek ölçüden). */
export function banknotOrani(deger: BanknotDegeri): number {
  const o = BANKNOT_OLCULERI_MM[deger];
  return o.en / o.boy;
}

/** Görsel dosyasının gerçek boyutta 72 dpi'ı aşmayan en büyük piksel ölçüsü. */
export function tcmbEnBuyukPiksel(deger: BanknotDegeri): {
  readonly en: number;
  readonly boy: number;
} {
  const o = BANKNOT_OLCULERI_MM[deger];
  return {
    en: Math.floor((o.en / 25.4) * TCMB_EKRAN_DPI_SINIRI),
    boy: Math.floor((o.boy / 25.4) * TCMB_EKRAN_DPI_SINIRI),
  };
}

/**
 * Kaynaklar / veli paneli "Para görselleri" beyanı (KG-117, KG-122). Kural: TCMB izni/onayı iddia edilmez.
 */
export interface ParaGorseliBeyani {
  /** Kaynaklar ekranındaki paragraflar. */
  readonly paragraflar: readonly string[];
  /** Veli panelindeki tek cümle. */
  readonly kisa: string;
}

export function paraGorseliBeyani(): ParaGorseliBeyani {
  const kupurler = `${BANKNOTLAR.slice(0, -1).join(', ')} ve ${BANKNOTLAR[BANKNOTLAR.length - 1]} TL`;
  return {
    paragraflar: [
      `Ekranda, basılı çalışma kâğıtlarında ve kâğıt arşivinde ${kupurler} banknotları için Türkiye Cumhuriyet ` +
        'Merkez Bankası’nın (TCMB) internet sitesinde yayımladığı E9 5. tertip ön yüz örnek görselleri, ' +
        'üzerlerindeki "ÖRNEKTİR GEÇMEZ" ibaresi korunarak, eğitim amacıyla kullanılır. Kaynak: TCMB, tcmb.gov.tr.',
      'Görseller TCMB’nin banknot görüntülerinin çoğaltılmasına ilişkin duyurusuna göre hazırlanmıştır: ' +
        'dosyalar gerçek boyutta 72 dpi’ı aşmaz; kâğıtta tek yüz ve gerçek boyutun dörtte üçünden küçük basılır.',
      "TCMB'ye izin başvurusu yapılmamıştır; bu kullanım TCMB'nin izni veya onayı anlamına gelmez.",
    ],
    kisa: 'Banknotlar TCMB’nin "ÖRNEKTİR GEÇMEZ" örnek görselleridir (kaynak: TCMB); TCMB izni veya onayı iddia edilmez.',
  };
}

export { BANKNOTLAR };
