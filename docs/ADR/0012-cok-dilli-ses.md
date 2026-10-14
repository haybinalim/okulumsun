# ADR-0012: Çok dilli ses

- **Durum:** Kabul
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici + kullanıcı · **Kullanıcı onayı:** 14 Eki 2026 — plan v2 KG-83
- **İlgili:** Adım 58, ADR-0004

## Bağlam

İleride Kürtçe, Arapça veya İngilizce yönergeler istenebilir. Her dilin ses kaynağı ve lisansı ayrı değerlendirilmeli.

## Seçenekler

1. **Anahtar alt kümesi + dil başına ses kaynağı ve lisans kaydı** — dil başına ayrı `sesKaynagi` girdisi.
2. **Tek kaynak tüm diller** — basit; her dil o kaynakta olmayabilir.
3. **Çok dilli ses yok**.

## Karar

**Seçenek 1** (kullanıcı kararı, 14 Eki 2026): anahtar alt kümesi + dil başına ayrı ses kaynağı ve lisans kaydı (dil başına ayrı `sesKaynagi` girdisi). Gerekçe: her dilin kaynağı ve lisansı ADR-0004 ölçütleriyle ayrı elenir; tek kaynağın her dili kapsaması gerekmez.

- Bu karar bugün **kod değişikliği getirmez**; uygulama ilk ek dil belli olunca yapılır (Adım 58).

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

- [x] Kullanıcı seçeneği onayladı (14 Eki 2026, Seçenek 1).
- [ ] İlk ek dil belli.
- [ ] O dilin ses kaynağı eleme ölçütlerini geçti.
