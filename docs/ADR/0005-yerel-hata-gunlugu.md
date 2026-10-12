# ADR-0005: Yerel hata günlüğü

- **Durum:** Önerildi
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici · **Kullanıcı onayı:** Gerekmez (Sıfır Veri Sözleşmesi'ni değiştirmiyor)
- **İlgili:** Adım 23, `OturumHatasi`

## Bağlam

Pilot ve sınıf kullanımında hatalar görünmez kalıyor; uzaktan hata raporlama (Sentry vb.) Sıfır Veri Sözleşmesi madde 3'ü ihlal eder.

## Seçenekler

1. **Bellekte halka tampon + "Sorun bildir" ile yetişkinin elle kopyalaması** — gönderim yok.
2. **Uzaktan hata raporlama hizmeti** — YASAK (ağ, üçüncü taraf).
3. **Hiç günlük tutmamak** — pilot bulguları kaybolur.

## Karar

Önerilen: **Seçenek 1**. Günlük yalnız bellekte tutulur (sayfa yenilenince silinir), kişisel veri içermez (yalnız hata türü, ekran, sürüm kimliği, şablon kodu), dışarıya gönderilmez; yetişkin alanındaki "Sorun bildir" metni panoya kopyalar.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `src/hata/` (yeni), veli paneli "Sorun bildir", sürüm kimliği (Adım 23).
- Test / kanıt: depolama casusu ve ağ denetimi günlüğün hiçbir yere yazılmadığını kanıtlar.

## Gizlilik etkisi

Bellekte kalır; IndexedDB, `localStorage` veya ağa yazılmaz. Cevap, ad veya ilerleme bilgisi içermez.

## Lisans ve üçüncü taraf etkisi

Yok.

## Geri dönüş maliyeti

Düşük.

## Kabul koşulları

- [ ] Günlük şeması kişisel alan içermiyor (birim test).
- [ ] Ağ ve depolama denetimi yeşil.
