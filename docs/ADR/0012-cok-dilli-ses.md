# ADR-0012: Çok dilli ses

- **Durum:** Taslak
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici + kullanıcı · **Kullanıcı onayı:** Gerekecek
- **İlgili:** Adım 58, ADR-0004

## Bağlam

İleride Kürtçe, Arapça veya İngilizce yönergeler istenebilir. Her dilin ses kaynağı ve lisansı ayrı değerlendirilmeli.

## Seçenekler

1. **Anahtar alt kümesi + dil başına ses kaynağı ve lisans kaydı** — dil başına ayrı `sesKaynagi` girdisi.
2. **Tek kaynak tüm diller** — basit; her dil o kaynakta olmayabilir.
3. **Çok dilli ses yok**.

## Karar

Henüz karar verilmedi. Bu kayıt seçenekleri ve kabul koşullarını sabitler; bağlı adım başlamadan önce `Önerildi` durumuna getirilir. Eğilim: 1.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `public/audio/<dil>/`, `sesKaynagi.json`.
- Test / kanıt: `audio:audit` dil başına köken denetimi.

## Gizlilik etkisi

Yok (yalnız metin gider).

## Lisans ve üçüncü taraf etkisi

Her dil için ADR-0004'teki eleme ölçütleri ayrı uygulanır.

## Geri dönüş maliyeti

Düşük.

## Kabul koşulları

- [ ] İlk ek dil belli.
- [ ] O dilin ses kaynağı eleme ölçütlerini geçti.
