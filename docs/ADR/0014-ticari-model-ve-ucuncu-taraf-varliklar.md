# ADR-0014: Ticari model ve üçüncü taraf varlık izinleri

- **Durum:** Önerildi
- **Tarih:** 2026-10-12
- **Karar sahibi:** Kullanıcı · **Kullanıcı onayı:** TCMB kararı verildi 11 Eki 2026 (KG-19); iş modeli bekliyor (KG-06)
- **İlgili:** Adım 21, 29, 35, 48, 56, LICENSES, `docs/BANKNOT_GORSEL_KAYNAKLARI.md`

## Bağlam

Ürün abonelik veya tek seferlik fiyatla satılabilir (KG-06). Bu, her üçüncü taraf varlığın ticari kullanım iznini sorgular: TCMB banknot görselleri (ticari kullanım için yazılı izin gerekir), ses (ADR-0004), fontlar (Andika, OFL), emoji ve ikonlar.

## Seçenekler

**TCMB banknotları:** (a) TCMB'den yazılı izin · (b) her yerde şematik banknot (`SematikBanknot`) · (c) ekranda TCMB, kâğıtta şematik.

**İş modeli:** (a) abonelik · (b) tek seferlik fiyat · (c) okul/kurum lisansı · (d) ücretsiz.

## Karar

Önerilen: TCMB için **(b) her yerde şematik** — kullanıcı kararı KG-19: TCMB'ye başvurulmaz, TCMB görselleri ürünün hiçbir yerinde kullanılmaz, kırmızı "ÖRNEKTİR" istisnası gereksizleşir. İş modeli açık; ticari lansmandan önce avukat incelemesi (KVKK ile birlikte).

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `SematikBanknot` bileşeni, para şablonları, LICENSES ve Kaynaklar'dan TCMB satırlarının kaldırılması (Adım 21, 29), `docs/BANKNOT_GORSEL_KAYNAKLARI.md`.
- Test / kanıt: lisans envanteri K10'da her varlığın ticari izni "evet".

## Gizlilik etkisi

Ödeme eklenirse ödeme altyapısı Sıfır Veri Sözleşmesi'ne karşı ayrıca değerlendirilir (yeni ADR).

## Lisans ve üçüncü taraf etkisi

TCMB görselleri kaldırılır; fontlar OFL (ticari uygun); ses ADR-0004'e bağlı. Her varlık K10 envanterinde lisans ve ticari izin sütunuyla tutulur.

## Geri dönüş maliyeti

Orta.

## Kabul koşulları

- [x] TCMB yolu seçildi (KG-19).
- [ ] İş modeli seçildi.
- [ ] Avukat incelemesi.
