# okulumsun — İlerleme Raporu

> Bu rapor, `docs/PLAN.md`'deki plan ile projenin mevcut durumunu karşılaştırır.
> Bir adımı bitiren, bu raporu ve PLAN §14 durum sütununu AYNI commit'te günceller.
> Tarih: 6 Ağustos 2026

## Yönetici özeti

Proje, planın **§14 yol haritasında Adım 4 sonunda**: ilk 4 şablon jeneratörüyle,
property-based testleriyle ve alıştırma ekranıyla ekranda oynanabilir durumda.
`validate-content.ts` çalışıyor, birim testleri yeşil.

Sıradaki iş **Adım 2b (CI)** ve **Adım 5 (oturum motoru, `src/progress/`)**.
Henüz olmayan büyük parçalar: oturum/ustalık motoru, kalıcılık (IndexedDB + PWA),
yardım akışı, kabuk ekranları ve 36 şablon.

## Yol haritası durumu (plan §14)

| Adım | İçerik | Durum |
|------|--------|------|
| 0 | İskelet + tokens + cihaz profili + BoardHarness | ✅ |
| 1 | Ses altyapısı (171 klip, SpeechService, ses kilidi) | ✅ |
| 2 | İlk 4 jeneratör + property-based testler | ✅ |
| 2b | CI iş akışı (`.github/workflows/ci.yml`) | ⬜ |
| 3 | SVG manipülatifler | ✅/⚠ (4 şablonun ihtiyacı var; Rakam glifleri MEB formuna göre doğrulanmadı) |
| 4 | Alıştırma ekranı | ✅ (`ExerciseScreen`, `GameShell`, e2e geometri testi) |
| 5 | Oturum motoru (`src/progress/`) | ⬜ — SIRADAKİ |
| 6 | 3 kademeli yardım + hata taksonomisi akışı | ⬜ |
| 7 | Maskot + kutlama + Bahçem | ⬜ |
| 8 | Kabuk ekranları (ana ekran, mod seçimi, veli paneli, tahta konu seçimi) | ⬜ |
| 9 | Kalıcılık + PWA + yedekleme | ⬜ |
| 10 | Kalan 36 şablon + ses kümeleri (§4.5) | ⬜ (4/40 tamam) |
| 11 | Dağıtım + LICENSES + gizlilik beyanı | ⬜ |
| 12 | Erişilebilirlik + 5 çocukla tablet testi | ⬜ |
| 13 | (2. ay) Fiziksel tahta doğrulaması | ⬜ |

## Teknik doğrulama (son çalıştırma: 6 Ağustos 2026)

- `npm test` → ✅ 5/5 (property-based jeneratör testleri)
- `npm run validate` → ✅ 19 kazanım · 57 beceri · 15/15 hata etiketi · 4 jeneratör
- `npm run build` → ✅
- CI → ⬜ yok (Adım 2b)

## Bilinen sapmalar / notlar

- PLAN §5.2 artık `skills.json` ile senkron: **40 şablon** (ilk taslaktaki 17'nin
  incelmiş hâli). Şablon durumları oradaki tabloda işaretli.
- `M-SIRA-SAYI`, `M-KONUM`, `M-YONERGE`, `M-PARA-*`, `M-GEO-*`, `M-OLC-*`, `M-VERI-*`
  şablonları için gerekli ses klipleri henüz üretilmedi — envanter PLAN §4.5'te.
