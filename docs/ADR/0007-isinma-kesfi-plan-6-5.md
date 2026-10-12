# ADR-0007: Isınma Keşfi ve PLAN §6.5

- **Durum:** Taslak
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici + kullanıcı · **Kullanıcı onayı:** Gerekecek
- **İlgili:** PLAN §6.5, Adım 47

## Bağlam

PLAN §6.5 seviye tespitini okul ayına göre tema açma ile yapıyor. Kısa bir "Isınma Keşfi" çocuğun başlangıç düzeyini daha iyi bulabilir, ama sınav hissi ve veri saklama riski taşır.

## Seçenekler

1. **Yalnız okul ayı eşlemesi** (bugünkü PLAN §6.5).
2. **Varsayılan kapalı, ≤8 maddelik, oturum içi Isınma Keşfi** — sonuç yalnız o oturumda kullanılır, saklanmaz.
3. **Kalıcı seviye testi** — ADR-0002 B olmadan mümkün değil.

## Karar

Henüz karar verilmedi. Bu kayıt seçenekleri ve kabul koşullarını sabitler; bağlı adım başlamadan önce `Önerildi` durumuna getirilir. Eğilim: 2.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: PLAN §6.5, seçici.
- Test / kanıt: sonucun hiçbir depoya yazılmadığı birim testi.

## Gizlilik etkisi

Seçenek 2 oturum içidir; Sıfır Veri Sözleşmesi'ni değiştirmez. Seçenek 3 ADR-0002'ye bağlıdır.

## Lisans ve üçüncü taraf etkisi

Yok.

## Geri dönüş maliyeti

Düşük.

## Kabul koşulları

- [ ] PLAN §6.5 ile çelişki çözüldü.
- [ ] Kullanıcı onayı.
