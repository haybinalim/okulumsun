# ADR-0014: Ticari model ve üçüncü taraf varlık izinleri

- **Durum:** Kabul
- **Tarih:** 2026-10-12
- **Karar sahibi:** Kullanıcı · **Kullanıcı onayı:** TCMB kararı verildi 11 Eki 2026 (KG-19); iş modeli 12 Eki 2026, sohbette ("evet uygun") — plan v2 KG-29
- **İlgili:** Adım 21, 29, 35, 48, 56, LICENSES, `docs/BANKNOT_GORSEL_KAYNAKLARI.md`

## Bağlam

Ürün abonelik veya tek seferlik fiyatla satılabilir (KG-06). Bu, her üçüncü taraf varlığın ticari kullanım iznini sorgular: TCMB banknot görselleri (ticari kullanım için yazılı izin gerekir), ses (ADR-0004), fontlar (Andika, OFL), emoji ve ikonlar.

## Seçenekler

**TCMB banknotları:** (a) TCMB'den yazılı izin · (b) her yerde şematik banknot (`SematikBanknot`) · (c) ekranda TCMB, kâğıtta şematik.

**İş modeli** (Sıfır Veri Sözleşmesi'yle uyumu ve gerektirdiği izinlerle):

| Seçenek | Veriyle uyum | Gerektirdiği izinler / koşullar |
|---|---|---|
| (a) Veli aboneliği | Zayıf — hesap ve ödeme kişisel veri ister (Y4) | Ödeme altyapısı için yeni ADR, KVKK, mağaza politikaları |
| (b) Tek seferlik fiyat (mağaza veya web) | Orta — ödeme sağlayıcısında kalır | Mağaza aile politikaları; ses (ADR-0004) ticari izinli |
| (c) Okul/kurum lisansı: kurulum, eğitim, destek hizmeti | Güçlü — uygulama yine veri tutmaz | ADR-0013 yazılı izin metni; ses (ADR-0004) |
| (d) Ücretsiz + hibe/sponsorluk, basılı çalışma kitabı, öğretmen atölyesi | Güçlü | Kâğıtta şematik banknot (KG-19), Andika OFL |
| Uyumsuz: reklam, uygulama içi satın alma | Yok (Y4/Y12) | — |

Plan önerisi: ilk 12 ay satış yok; hibe + pilot okul ilişkisi (d), ardından okul/kurum lisansı (c).

## Karar

Önerilen: TCMB için **(b) her yerde şematik** — kullanıcı kararı KG-19: TCMB'ye başvurulmaz, TCMB görselleri ürünün hiçbir yerinde kullanılmaz, kırmızı "ÖRNEKTİR" istisnası gereksizleşir. **İş modeli (kullanıcı kararı, 12 Eki 2026):** ilk 12 ay **satış yok** — ücretsiz, hibe/sponsorluk ve pilot okul ilişkisi (d); ardından **okul/kurum lisansı** (c: kurulum, eğitim, destek hizmeti). Veli aboneliği, reklam ve uygulama içi satın alma yapılmaz. Ticari lansmandan (c) önce avukat incelemesi (KVKK ile birlikte) şarttır.

Uygulandı (Adım 21): `src/content/paraGorseli.ts` (`TCMB_YAZILI_IZIN = false`, strateji fonksiyonu), `src/ui/svg/SematikBanknot.tsx`, lisans envanteri `src/content/ucuncuTarafVarliklar.ts` ve K10 (`npm run lisans:denetle`). TCMB görselleri Adım 29'da kaldırılacaktı; ekran geçişi o adımda yapılmadı (KG-117). **29 Eki 2026 (KG-121, kullanıcı onayı):** ekran da `SematikBanknot`'a geçti, `public/images/banknotlar/` ve `src/ui/svg/banknotAssets.ts` depodan kaldırıldı, lisans envanterinden TCMB satırı silindi, kırmızı denetimindeki TCMB istisnası kalktı; karar artık ekran, kâğıt ve arşivde tam uygulanıyor.

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
- [x] İş modeli seçildi (12 Eki 2026, KG-29).
- [ ] Avukat incelemesi — okul/kurum lisansı satışından önce (Adım 56); Kabul'ü engellemez, ticari lansmanı engeller.
