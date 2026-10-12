# ADR-0011: Çok ders mimarisi

- **Durum:** Taslak
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici · **Kullanıcı onayı:** Gerekmez
- **İlgili:** Adım 57, PLAN §14 "Sonraya bırakılanlar"

## Bağlam

Türkçe ilk okuma-yazma ve Hayat Bilgisi ileride eklenebilir. Bugünkü içerik dosyaları matematiğe özgü adlandırılmış.

## Seçenekler

1. **Ders paketi: `DersKodu` + ders başına içerik dizini** — tek uygulama, paylaşılan motor.
2. **Ders başına ayrı uygulama** — basit, ama motor çoğalır.
3. **Şimdilik hiçbir şey** — erken soyutlamadan kaçınır.

## Karar

Henüz karar verilmedi. Bu kayıt seçenekleri ve kabul koşullarını sabitler; bağlı adım başlamadan önce `Önerildi` durumuna getirilir. Eğilim: 1, ama ikinci ders başlayana kadar uygulanmaz.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `src/content/` düzeni, kayıt defteri.
- Test / kanıt: validate-content ders başına çalışır.

## Gizlilik etkisi

Yok.

## Lisans ve üçüncü taraf etkisi

Yok.

## Geri dönüş maliyeti

Orta (içerik dizini taşıması).

## Kabul koşulları

- [ ] İkinci dersin kapsamı belli.
