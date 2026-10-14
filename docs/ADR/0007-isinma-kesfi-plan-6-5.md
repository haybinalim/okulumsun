# ADR-0007: Isınma Keşfi ve PLAN §6.5

- **Durum:** Kabul
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici + kullanıcı · **Kullanıcı onayı:** Verildi (2026-10-14)
- **İlgili:** PLAN §6.5, Adım 47

## Bağlam

PLAN §6.5 seviye tespitini okul ayına göre tema açma ile yapıyor. Kısa bir "Isınma Keşfi" çocuğun başlangıç düzeyini daha iyi bulabilir, ama sınav hissi ve veri saklama riski taşır.

## Seçenekler

1. **Yalnız okul ayı eşlemesi** (bugünkü PLAN §6.5).
2. **Varsayılan kapalı, ≤8 maddelik, oturum içi Isınma Keşfi** — sonuç yalnız o oturumda kullanılır, saklanmaz.
3. **Kalıcı seviye testi** — ADR-0002 B olmadan mümkün değil.

## Karar

**Kabul (2026-10-14, kullanıcı onayı, KG-76; öneri 2026-10-13, KG-68): Seçenek 2.** Isınma Keşfi varsayılan **kapalı**dır; yalnız kişisel modda veli açar
(yetişkin alanında "Oturuma kısa ısınmayla başla", yalnız bellekte). En çok 8 madde; en kolay işaretten başlar, doğruda
2 işaret yukarı, yanlışta 1 aşağı iner; ardışık 2 yanlışta biter (ilk deneyim başarısızlıkla uzamaz). Isınmada boncuk yolu
gösterilmez. Sonuç yalnız o oturumun başlangıç noktasını belirler; ADR-0002 B'de bile saklanmaz. PLAN §6.5'e "Isınma Keşfi
(isteğe bağlı)" alt başlığı eklenir: "ilk oturumda kalibrasyon testi yapılmaz" kuralı varsayılan davranış olarak kalır.
Isınma Keşfi tahta/sınıf modunda yoktur (tahtada içeriği öğretmen seçer, PLAN §3.3); ısınmada puan/skor gösterilmez.
Kullanıcı Seçenek 2'yi 2026-10-14'te onayladı; Adım 47 bu karara göre uygulanır.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: PLAN §6.5 ("Isınma Keşfi (isteğe bağlı)"), §17 sabitleri; `src/progress/seviyeTespiti.ts`
  (SAF), `scheduler.ts` (isteğe bağlı oturum içi girdiler), kişisel oturum bağlaması ve veli paneli anahtarı.
- Test / kanıt: `tests/unit/seviyeTespiti.spec.ts` (≤8 madde, kolaydan başlar, +2/−1, ardışık 2 yanlışta biter, SAF,
  sonucun hiçbir depoya yazılmadığı casus testi); `scheduler.spec.ts` (yeni girdiler yokken davranış aynı).

## Gizlilik etkisi

Seçenek 2 oturum içidir; Sıfır Veri Sözleşmesi'ni değiştirmez. Seçenek 3 ADR-0002'ye bağlıdır.

## Lisans ve üçüncü taraf etkisi

Yok.

## Geri dönüş maliyeti

Düşük.

## Kabul koşulları

- [x] PLAN §6.5 ile çelişki çözüldü (2026-10-14: §6.5'e "Isınma Keşfi (isteğe bağlı)" alt başlığı; varsayılan kural aynen kalır).
- [x] Kullanıcı onayı (2026-10-14, Seçenek 2).
