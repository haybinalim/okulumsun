/**
 * MASKOT DURUM MAKİNESİ — plan §7.5.
 *
 * SAF VE SENKRONDUR — `Date.now()`, `setTimeout`, DOM, React hiçbirini
 * çağırmaz. UI bu makineyi olaylarla besler; makine yeni durum döndürür.
 * Böylece her senaryo birim testte deterministik tekrar üretilebilir.
 *
 * ALTIN ALTIN DURUM (plan §7.5 tablosu):
 *
 * | Durum             | Ne zaman                              | Yüz / kol                         |
 * |-------------------|---------------------------------------|-----------------------------------|
 * | `sakin`           | Varsayılan, çocuk düşünürken          | Nötr gülümseme, kollar aşağıda    |
 * | `konusuyor`       | Talimat veya ipucu çalarken           | Ağız senkron, bir kol işaret eder |
 * | `dinliyor`        | Çocuk seçim yaparken (seç→onayla)     | Hafif öne eğik, baş yönelmiş      |
 * | `sevinmis`        | Doğru cevap                           | Kollar yukarı, gözler kısık gülüş |
 * | `cesaretlendiriyor` | Yanlış cevap ve K1/K2/K3            | Nötr-sıcak, bir kol "devam"       |
 * | `uykulu`          | 60 sn tam hareketsizlik               | Gözler yarı kapalı, esneme        |
 *
 * KURALLAR:
 *  · Geçişler yalnız bu tablodaki olaylarla tetiklenir; ara durum yoktur.
 *  · `sevinmis` ≤2 sn sonra `sakin`'e döner (plan §7.5).
 *  · `cesaretlendiriyor` yardım başlayınca gelir, çocuk dokununca `dinliyor`'a.
 *  · `uykulu`'dan çıkış: herhangi bir dokunma → `sakin`.
 *  · ASLA: üzülmez, ağlamaz, suçlamaz (plan §7.1).
 */

// ---------------------------------------------------------------- durumlar

/** Maskotun 6 durumu — plan §7.5 tablosu. */
export type MaskotDurumu =
  | 'sakin'
  | 'konusuyor'
  | 'dinliyor'
  | 'sevinmis'
  | 'cesaretlendiriyor'
  | 'uykulu';

// ---------------------------------------------------------------- olaylar

/** Makineye beslenen olaylar. */
export type MaskotOlayi =
  | { readonly tur: 'talimatBasladi' }
  | { readonly tur: 'talimatBitti' }
  | { readonly tur: 'secimBasladi' }
  | { readonly tur: 'dogruCevap' }
  | { readonly tur: 'yanlisCevap' }
  | { readonly tur: 'yardimIstendi' }
  | { readonly tur: 'hareketsizlik60sn' }
  | { readonly tur: 'dokunma' }
  | { readonly tur: 'sifirla' };

// ---------------------------------------------------------------- makine

/**
 * Bir olayı işler ve yeni maskot durumu döndürür.
 *
 * SAF: girdiyi değiştirmez, yalnız yeni durum döndürür.
 * Ara durum yoktur — her olay bilinen 6 durumdan birine geçer.
 */
export function maskotGuncelle(durum: MaskotDurumu, olay: MaskotOlayi): MaskotDurumu {
  switch (olay.tur) {
    case 'sifirla':
      return 'sakin';

    case 'dokunma':
      // Herhangi bir dokunma uykulu'dan çıkarır.
      if (durum === 'uykulu') return 'sakin';
      // Diğer durumlarda dokunma durumu değiştirmez — çocuk denken rahatsız olmaz.
      return durum;

    case 'talimatBasladi':
      // Talimat veya ipucu çalmaya başlayınca konusuyor.
      return 'konusuyor';

    case 'talimatBitti':
      // Talimat bitti — çocuk düşünmeye başlar.
      if (durum === 'konusuyor') return 'sakin';
      return durum;

    case 'secimBasladi':
      // Çocuk seçim yapmaya başladı (seç→onayla arası) — dinliyor.
      return 'dinliyor';

    case 'dogruCevap':
      // Doğru cevap — sevinmis. ≤2 sn sonra sakin (UI'da setTimeout).
      return 'sevinmis';

    case 'yanlisCevap':
      // Yanlış cevap — cesaretlendiriyor. ASLA üzgün değil (§7.1).
      return 'cesaretlendiriyor';

    case 'yardimIstendi':
      // Yardım kademesi açıldı — cesaretlendiriyor.
      return 'cesaretlendiriyor';

    case 'hareketsizlik60sn':
      // 60 sn tam hareketsizlik — uykulu.
      return 'uykulu';
  }
}

// ----------------------------------------------------- geçerlilik yardımcıları

/** Maskotun geçerli 6 durumdan biri mi? (Test ve runtime doğrulama için.) */
export function gecerliMaskotDurumu(d: string): d is MaskotDurumu {
  return (
    d === 'sakin' ||
    d === 'konusuyor' ||
    d === 'dinliyor' ||
    d === 'sevinmis' ||
    d === 'cesaretlendiriyor' ||
    d === 'uykulu'
  );
}

/**
 * `sevinmis` durumundan otomatik `sakin`'e dönüş süresi (ms).
 *
 * Plan §7.5: "≤2 sn, sonra sakin". MOTION.celebrate = 1500 ms kullanırız
 * (§17 KUTLAMA_SURESI ≤2 sn sınırının altında).
 */
export const SEVINMIS_SURE_MS = 1500;
