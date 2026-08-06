# okulumsun — İlerleme Raporu

> Bu rapor, `docs/PLAN.md`'deki plan ile projenin mevcut durumunu karşılaştırır.
> Bir adımı bitiren, bu raporu ve PLAN §14 durum sütununu AYNI commit'te günceller.
> Tarih: 6 Ağustos 2026 (Adım 8 güncellemesi)

## Yönetici özeti

Proje, planın **§14 yol haritasında Adım 8 sonunda**: kabuk ekranları eklendi
(mod seçimi, avatar, renk, ana ekran, tema girişi, konu seçimi, veli kapısı,
veli paneli). §11 akışının tamamı gezilebilir durumda. Tahta modunda
IndexedDB'ye yazılmadığı `persistenceEnabled` bayrağıyla testle kanıtlandı.
İlk 4 şablon jeneratörüyle, property-based testleriyle, oturum/ustalık
motoruyla, yardım akışıyla, ödül sistemiyle ve tam ekran akışıyla ekranda
oynanabilir. `validate-content.ts` çalışıyor, birim testleri yeşil.

Sıradaki iş **Adım 9 (kalıcılık + PWA + yedekleme)**.
Henüz olmayan büyük parçalar: kalıcılık (IndexedDB + PWA) ve 35 şablon.

## Yol haritası durumu (plan §14)

| Adım | İçerik | Durum |
|------|--------|------|
| 0 | İskelet + tokens + cihaz profili + BoardHarness | ✅ |
| 1 | Ses altyapısı (171 klip, SpeechService, ses kilidi) | ✅ |
| 2 | İlk 4 jeneratör + property-based testler | ✅ |
| 2b | CI iş akışı (`.github/workflows/ci.yml`) | ✅ |
| 2c | Şablon kayıt defteri (`src/exercises/registry.ts`, PLAN §5.4) | ✅ |
| 3 | SVG manipülatifler | ✅/⚠ (4 şablonun ihtiyacı var; Rakam glifleri MEB formuna göre doğrulanmadı) |
| 4 | Alıştırma ekranı | ✅ (`ExerciseScreen`, `GameShell`, e2e geometri testi) |
| 5 | Oturum motoru (`src/progress/`) | ✅/⚠ (`mastery.ts`, `scheduler.ts`, `session.ts` yazıldı; 8 senaryo testi geçer; SAF; kova oranı testi gevşek — gerçekçi profil gerektirir) |
| 6 | 3 kademeli yardım + hata taksonomisi akışı | ✅ (`itemLifecycle.ts` saf makine + `useHelpTimer` hook + `TaniTakipcisi`; 23 yeni test) |
| 7 | Maskot + kutlama + Bahçem | ✅ (`maskotState.ts` saf makine + `Maskot.tsx` SVG + `Celebration.tsx` + `cikartma.ts` + `Bahcem.tsx` + `OturumSonu.tsx`; 30 yeni test) |
| 8 | Kabuk ekranları (ana ekran, mod seçimi, veli paneli, tahta konu seçimi) | ✅ (`appStore.ts` Zustand + `okulAyi.ts` §6.5 + 8 ekran: ModSecimi, AvatarSecimi, RenkSecimi, AnaEkran, TemaGirisi, KonuSecimi, VeliKapisi, VeliPaneli; 45 yeni test) |
| 9 | Kalıcılık + PWA + yedekleme | ⬜ |
| 10 | Kalan 35 şablon + ses kümeleri (§4.5) | ⬜ (4/39 tamam) |
| 11 | Dağıtım + LICENSES + gizlilik beyanı | ⬜ |
| 12 | Erişilebilirlik + 5 çocukla tablet testi | ⬜ |
| 13 | (2. ay) Fiziksel tahta doğrulaması | ⬜ |

## Teknik doğrulama (son çalıştırma: 6 Ağustos 2026)

- `npm test` → ✅ 124/124 (jeneratör 5 + ustalık 14 + seçici 7 + madde yaşam döngüsü 23 + maskot 17 + çıkartma 13 + okul ayı 15 + app store 30)
- `npm run validate` → ✅ 19 kazanım · 57 beceri · 15/15 hata etiketi · 4 jeneratör
- `npm run build` → ✅
- `npm run lint` → ✅ 0 uyarı 0 hata
- CI → ⬜ yok (Adım 2b)

## Bilinen sapmalar / notlar

- PLAN §5.2 artık `skills.json` ile senkron: **39 şablon** (ilk taslaktaki 17'nin
  incelmiş hâli). Şablon durumları oradaki tabloda işaretli.
- `M-SIRA-SAYI`, `M-KONUM`, `M-YONERGE`, `M-PARA-*`, `M-GEO-*`, `M-OLC-*`, `M-VERI-*`
  şablonları için gerekli ses klipleri henüz üretilmedi — envanter PLAN §4.5'te.
