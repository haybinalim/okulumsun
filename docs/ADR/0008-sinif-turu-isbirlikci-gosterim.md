# ADR-0008: Sınıf Turu: iş birlikçi gösterim

- **Durum:** Taslak
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici + kullanıcı · **Kullanıcı onayı:** Gerekecek
- **İlgili:** Adım 36, PLAN §7

## Bağlam

Tahtada grup oyunu istendi. Takım skorları ve sıralama, PLAN §7.1'in "cezalandırıcı değil" ilkesine ve 1. sınıf sınıf iklimine ters düşebilir.

## Seçenekler

1. **Ortak kavanoz**: her doğru cevap sınıfın ortak kavanozuna bir nesne ekler; sayısal skor ve kazanan yok. Emsal: Matific Play'in sınıf "tamamlama panosu" (rekabet yerine ortak ilerleme).
2. **Takım skoru ve sıralama** — motive edici olabilir; kaybeden takım, utanç riski.
3. **Grup oyunu yok**.

## Karar

Henüz karar verilmedi. Bu kayıt seçenekleri ve kabul koşullarını sabitler; bağlı adım başlamadan önce `Önerildi` durumuna getirilir. Eğilim: 1.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: Sınıf Turu ekranı, PLAN §7.
- Test / kanıt: tahta geometri testi; takım bilgisinin yazılmadığı test.

## Gizlilik etkisi

Tahta modudur: takım adı ve tur bilgisi hiçbir yere yazılmaz (Sıfır Veri Sözleşmesi madde 1).

## Lisans ve üçüncü taraf etkisi

Yok.

## Geri dönüş maliyeti

Düşük.

## Kabul koşulları

- [ ] Seçenek seçildi.
- [ ] Tahta denemesinde (Adım 41) tur süreleri ölçüldü.
