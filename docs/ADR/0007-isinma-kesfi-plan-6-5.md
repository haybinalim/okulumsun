# ADR-0007: Isınma Keşfi ve PLAN §6.5

- **Durum:** Önerildi
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

**Önerilen (2026-10-13, KG-68): Seçenek 2.** Isınma Keşfi varsayılan **kapalı**dır; yalnız kişisel modda veli açar
(yetişkin alanında "Oturuma kısa ısınmayla başla", yalnız bellekte). En çok 8 madde; en kolay işaretten başlar, doğruda
2 işaret yukarı, yanlışta 1 aşağı iner; ardışık 2 yanlışta biter (ilk deneyim başarısızlıkla uzamaz). Isınmada boncuk yolu
gösterilmez. Sonuç yalnız o oturumun başlangıç noktasını belirler; ADR-0002 B'de bile saklanmaz. PLAN §6.5'e "Isınma Keşfi
(isteğe bağlı)" alt başlığı eklenir: "ilk oturumda kalibrasyon testi yapılmaz" kuralı varsayılan davranış olarak kalır.
Kullanıcı onayı gelene kadar kod davranışı değişmez; Adım 47 beklemede.

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
