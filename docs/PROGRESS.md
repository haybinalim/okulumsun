# okulumsun — İlerleme Raporu

> Bu rapor, `docs/PLAN.md`'deki plan ile projenin mevcut durumunu karşılaştırır.
> Bir adımı bitiren, bu raporu ve PLAN §14 durum sütununu AYNI commit'te günceller.
> Tarih: 6 Ağustos 2026 (Adım 12 — Erişilebilirlik denetimi güncellemesi)

## Yönetici özeti

Proje, planın **§14 yol haritasında Adım 12 sonunda**: Erişilebilirlik denetimi
tamamlandı. `docs/TEST-PROTOKOLU.md` oluşturuldu — §15 elle doğrulama listesi
işlendi, çocuk test protokolü yazıldı, erişilebilirlik denetimi yapıldı.

Denetim bulguları:
- prefers-reduced-motion: tüm animasyonlarda korunuyor (5 bileşen)
- aria-label: tüm interaktif öğelerde mevcut
- Dokunma hedefi: tahta geometri testiyle korunuyor
- Renk kontrastı: AA uygun (retry rengi yalnız büyük metinde)
- Fiziksel tablet testi: protokol hazır, uygulama bekliyor

Sıradaki iş **Adım 13** — Fiziksel akıllı tahta doğrulaması (2. ay).

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
| 9 | Kalıcılık + PWA + yedekleme | ✅ (`db.ts` Dexie şema v1 + `repository.ts` (tahta modu no-op) + `backup.ts` dışa/içe + `persist.ts` storage.persist() + `migrations/` iskelet + vite-plugin-pwa precache; 33 yeni test) |
| 10 | Kalan 35 şablon + ses kümeleri (§4.5) + SVG varlıklar | ✅ T1 ✅ + T2 ✅ + T4 ✅ + T3 ✅ + T5 ✅ + T6 ✅ + T7 ✅ — 39/39 şablon tamam |
| 11 | Dağıtım + LICENSES + gizlilik beyanı | ✅ |
| 12 | Erişilebilirlik + 5 çocukla tablet testi | ✅ denetim + protokol (fiziksel test bekliyor) |
| 13 | (2. ay) Fiziksel tahta doğrulaması | ⬜ |

## Teknik doğrulama (son çalıştırma: 6 Ağustos 2026)

- `npm test` → ✅ 192/192 (jeneratör 40 + ustalık 14 + seçici 7 + madde yaşam döngüsü 23 + maskot 17 + çıkartma 13 + okul ayı 15 + app store 30 + kalıcılık 33)
- `npm run validate` → ✅ 19 kazanım · 57 beceri · 15/15 hata etiketi · 39 jeneratör · **0 bekliyor**
- `npm run build` → ✅ (PWA service worker üretildi, 12 precache entry)
- `npm run lint` → ✅ 0 uyarı 0 hata
- CI → ⬜ yok (Adım 2b)

## Bilinen sapmalar / notlar

- PLAN §5.2 artık `skills.json` ile senkron: **39 şablon** (ilk taslaktaki 17'nin
  incelmiş hâli). Şablon durumları oradaki tabloda işaretli.
- `M-SIRA-SAYI`, `M-KONUM`, `M-YONERGE`, `M-PARA-*`, `M-GEO-*`, `M-OLC-*`, `M-VERI-*`
  şablonları için gerekli ses klipleri henüz üretilmedi — envanter PLAN §4.5'te.
