/**
 * Yazı yüzeyi (KG-96): hangi ekranın metni çocuğa, hangisininki yetişkine dönük.
 *
 * Çocuğa dönük ekranlar MEB TYMM 2024 TemelYazi (dik temel) ile yazılır (`--font-sans`);
 * yetişkin ekranları (öğretmen/veli alanı) Andika'da kalır (`--font-yetiskin`, `src/index.css`
 * `[data-yazi='yetiskin']`). Ölçüt kodun kendisi: ekran dosyasının başlık yorumu onu öğretmen,
 * veli ya da yetişkin ekranı olarak tanımlıyorsa veya ekrana veli kapısından ulaşılıyorsa
 * yetişkin; geri kalan her şey (çocuğun gördüğü, tahtada sınıfa gösterilen) çocuk. Çocuk
 * ekranlarındaki küçük yetişkin düğmeleri ayrıca `data-yetiskin` ile işaretlidir.
 * Basılan kâğıt (`kagit.css`) ve arşiv/etki formları çocuğa dönüktür; kâğıt arşivi dizini,
 * /ogretmen ve /gizlilik statik sayfaları yetişkine (Andika; `scripts/*-sayfasi.ts`).
 *
 * SAF VERİ: yan etkisiz.
 */
import type { Ekran } from '../store/appStore';

export type YaziYuzeyi = 'cocuk' | 'yetiskin';

export const YETISKIN_EKRANLARI: ReadonlySet<Ekran> = new Set<Ekran>([
  'veliKapisi', // veli kapısı: yetişkin doğrulaması
  'veliPaneli',
  'kaynaklar', // "Çocuk bu ekrana veli kapısından ulaşır"
  'sorunBildir',
  'setHazirla', // öğretmen: bugünün seti
  'haftalikPlan', // öğretmen: MEB haftalık plan
  'calismaKagidi', // öğretmen alanı; önizlemedeki kâğıdın kendisi kagit.css ile TemelYazi
  'eveGonder', // öğretmen: eve link + QR
  'sinifTuruKurulum', // "öğretmen ekranı"
  'dersSonuOzeti', // "Yetişkin ekranı"
  'veliIpucuKarti', // veliye ipucu kartı
]);

export function yaziYuzeyi(ekran: Ekran): YaziYuzeyi {
  return YETISKIN_EKRANLARI.has(ekran) ? 'yetiskin' : 'cocuk';
}
