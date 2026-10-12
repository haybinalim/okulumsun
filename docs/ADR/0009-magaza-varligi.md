# ADR-0009: Mağaza varlığı

- **Durum:** Taslak
- **Tarih:** 2026-10-12
- **Karar sahibi:** Kullanıcı · **Kullanıcı onayı:** Gerekecek
- **İlgili:** Adım 50, 51, Google Play Aileler politikası

## Bağlam

Uygulama bugün PWA olarak dağıtılıyor. Google Play'de yer almak görünürlük sağlar, ama çocuklara yönelik uygulamalar Aileler politikasına tabidir.

## Seçenekler

a) **TWA + 13+ hedef kitle** — **reddedilir**: ürün açıkça 6–7 yaş içindir, yanlış beyan politika ihlalidir (Y15).
b) **TWA + çocuk hedef kitle** — Google belgesine göre web içeriğini saran uygulamalar Aileler programıyla uyumsuz olabilir; doğrulanmalı.
c) **İçeriği paketleyen yerli kabuk** — politika riski azalır, bakım yükü artar.
d) **Mağaza yok, PWA + doğrudan/MDM kurulum** — bugünkü varsayılan.

## Karar

Henüz karar verilmedi. Bu kayıt seçenekleri ve kabul koşullarını sabitler; bağlı adım başlamadan önce `Önerildi` durumuna getirilir. Bugünkü varsayılan d. Adım 50'deki 1 günlük deneme başvurusunun sonucuna göre bu ADR yeniden yazılır.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: kabulde paketleme yapılandırması (Adım 51).
- Test / kanıt: Play konsol deneme sonucu.

## Gizlilik etkisi

Play hizmetleri, reklam veya analitik SDK'sı eklenmez; veri güvenliği formu "veri toplanmaz" olarak doldurulur.

## Lisans ve üçüncü taraf etkisi

Google Play Geliştirici Dağıtım Sözleşmesi; hesap ücreti (⛔ O7).

## Geri dönüş maliyeti

Orta.

## Kabul koşulları

- [ ] Deneme başvurusu yapıldı (Adım 50).
- [ ] Kullanıcı onayı.
