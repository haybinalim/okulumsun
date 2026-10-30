# ADR-0011: Çok ders mimarisi

- **Durum:** Kabul
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici + kullanıcı · **Kullanıcı onayı:** 14 Eki 2026 — plan v2 KG-82
- **İlgili:** Adım 57, PLAN §14 "Sonraya bırakılanlar"

## Bağlam

Türkçe ilk okuma-yazma ve Hayat Bilgisi ileride eklenebilir. Bugünkü içerik dosyaları matematiğe özgü adlandırılmış.

## Seçenekler

1. **Ders paketi: `DersKodu` + ders başına içerik dizini** — tek uygulama, paylaşılan motor.
2. **Ders başına ayrı uygulama** — basit, ama motor çoğalır.
3. **Şimdilik hiçbir şey** — erken soyutlamadan kaçınır.

## Karar

**Seçenek 1, ders paketi** (kullanıcı kararı, 14 Eki 2026): tek uygulama, `DersKodu` + ders başına içerik dizini, paylaşılan motor. Gerekçe: motor ve içerik doğrulaması tek yerde kalır; ikinci ayrı uygulama motoru çoğaltırdı.

- Eğilim olduğu gibi korunur: ikinci ders başlayana kadar uygulanmaz. Bu karar bugün **kod değişikliği getirmez**; `DersKodu` ve içerik dizini taşıması ikinci dersin ilk adımında yapılır (Adım 57).

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

- [x] Kullanıcı seçeneği onayladı (14 Eki 2026, Seçenek 1).
- [x] İkinci dersin kapsamı belli: Türkçe ilk okuma yazma (30 Eki 2026, plan v2 KG-133, Okuma Yazma planı Adım 60–78). Uygulama Adım 61'de başlar; veri yerleşimi ve derleme bayrağı ADR-0016'da.
