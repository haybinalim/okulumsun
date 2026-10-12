# ADR-0010: Eve link URL sözleşmesi

- **Durum:** Taslak
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici · **Kullanıcı onayı:** Gerekmez
- **İlgili:** Adım 42, Sıfır Veri Sözleşmesi madde 5

## Bağlam

Öğretmen, sınıfta çalışılan konuyu evde tekrar için velilere bir bağlantıyla göndermek istiyor. URL'de kişisel veri olmamalı ve bağlantı sürümler arasında bozulmamalı.

## Seçenekler

1. **Hash parçasında yalnız içerik kodu + tohum + sürüm** (`#v1/k=M-SAY&t=1234`) — sunucuya gitmez, kişisel veri yok.
2. **Sorgu dizesinde** — sunucu günlüklerine düşer.
3. **Kısa bağlantı hizmeti** — üçüncü taraf, YASAK.

## Karar

Henüz karar verilmedi. Bu kayıt seçenekleri ve kabul koşullarını sabitler; bağlı adım başlamadan önce `Önerildi` durumuna getirilir. Eğilim: 1.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: bağlantı ayrıştırıcı, eve link ekranı.
- Test / kanıt: ayrıştırıcı birim testleri; bilinmeyen sürüm güvenli varsayılana düşer.

## Gizlilik etkisi

URL yalnız içerik kodu ve tohum taşır; ad, sınıf veya cevap taşımaz (madde 5).

## Lisans ve üçüncü taraf etkisi

Yok.

## Geri dönüş maliyeti

Düşük; sürüm alanı geriye uyumu korur.

## Kabul koşulları

- [ ] Biçim sabitlendi ve sürümlendi.
