/**
 * Eve bağlantısının karekodu (Okuma Yazma Adım 81, E4 "kâğıttan dijitale"). SAF. YALNIZ `VITE_DERS_TUR=1` derlemesinde.
 *
 * Karekod ve bağlantı Adım 71'in tek kaynağından gelir: bağlantıyı `turEveLink` üretir, karekodu yerel `qrMatrisi`
 * (ağ yok) çizer. Burada yeni bir kodlayıcı ya da bağlantı biçimi YOKTUR. Üretilemezse (bağlantı çok uzun vb.)
 * sonuç `hata` olur; çağıran boş kutu çizmez, görünür "karekod üretilemedi" yazar (sessiz hata başarı sayılmaz).
 */
import { qrMatrisi, qrSvgYolu } from '../../../ogretmen/qrMatrisi';

export type EveKarekodu =
  | {
      readonly durum: 'hazir';
      readonly baglanti: string;
      /** Kâğıtta okunacak kısa biçim (şema yok; tarayıcıya yazılınca açılır). */
      readonly kisa: string;
      readonly yol: string;
      readonly boyut: number;
    }
  | { readonly durum: 'hata'; readonly baglanti: string; readonly neden: string };

/** `https://alan/?ders=tur&ev=…` → `alan/?ders=tur&ev=…`. */
export function kisaBaglanti(baglanti: string): string {
  return baglanti.replace(/^https?:\/\//u, '');
}

export function eveKarekodu(baglanti: string): EveKarekodu {
  try {
    const { yol, boyut } = qrSvgYolu(qrMatrisi(baglanti));
    return { durum: 'hazir', baglanti, kisa: kisaBaglanti(baglanti), yol, boyut };
  } catch (e) {
    return { durum: 'hata', baglanti, neden: e instanceof Error ? e.message : String(e) };
  }
}
