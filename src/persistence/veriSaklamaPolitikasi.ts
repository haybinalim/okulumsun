/**
 * GEÇİCİ VERİ SAKLAMA POLİTİKASI.
 *
 * Uygulama geliştirme aşamasındayken öğrenci veya veliye ilişkin ilerleme,
 * profil, oturum ve olay kayıtları hiçbir tarayıcı depolama alanında tutulmaz.
 * Bu karar; veri modelinin, saklama süresinin ve sorumlulukların ürün sahibi
 * tarafından ayrıca belirlenmesine kadar yürürlüktedir.
 *
 * Bu modül değiştirildiğinde; gizlilik metni, yedekleme davranışı ve testler
 * aynı değişiklikte yeniden değerlendirilmelidir.
 */
export const OGRENCI_VERISI_SAKLANIR_MI = false as const;

export const VERI_SAKLAMA_BILDIRIMI =
  'Bu geliştirme sürümünde öğrenci veya veli verisi saklanmaz; sayfa yenilendiğinde oturum bilgileri silinir.';

export const VERI_SAKLAMA_KAPALI_HATA =
  'Öğrenci ve veli verisi saklama bu geliştirme sürümünde kapalıdır.';
