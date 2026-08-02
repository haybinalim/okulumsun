# okulumsun — İlerleme Raporu

> Bu rapor, `docs/PLAN.md`'deki plan ile projenin mevcut durumunu karşılaştırır.
> Tarih: 2 Ağustos 2026 · Üretilen: plan + kod tabanı incelemesi

## Yönetici özeti

Proje, planın **§14 yol haritasında Adım 3'ün sonunda / Adım 4'ün başında**.
Yani temel altyapı (müfredat verisi, ses, cihaz profilleri, tahta simülasyonu,
sözleşme katmanı) üretim kalitesinde tamam; ancak **ürün katmanı** (gerçek
alıştırma ekranı, oturum motoru, ustalık, kalıcılık, PWA, kalan 13 şablon)
henüz başlanmamış.

Planın "erken sinyal noktası" — *Adım 4 sonunda çocuğa gösterilebilir gerçek bir
deneyim* — henüz geçilmedi: 4 şablon hazır ama onları ekrana getirecek alıştırma
ekranı yok (`App.tsx` hâlâ "Adım 0 doğrulama ekranı").

**Yapılandırma kalitesi yüksek.** Her dosya bol Türkçe gerekçeyle belgelenmiş,
tip güvenliği derleme zamanında zorlanıyor, determinizm (tohumlu RNG) ve
tanılayıcı çeldiriciler plana sadık şekilde implemente edilmiş.

---

## Yol haritası durumu (plan §14)

| Adım | İçerik | Durum | Not |
|------|--------|------|-----|
| 1 | Müfredat doğrulama (MEB 2024 PDF → JSON) | ✅ Bitti | 19 kazanım, 7 tema, 57 mikro düğüm |
| 2 | Proje iskeleti + tokens + Andika fontu + cihaz profili + BoardHarness | ✅ Bitti | Üç profil, erişim bölgesi, e2e testi |
| 3 | Ses altyapısı + manifest + AudioUnlock ekranı | ✅ Bitti | 171 klip, Web Audio API, sayı birleştirme |
| 4 | İlk 4 şablon + **alıştırma ekranı** | ⚠️ Yarı | 4 şablon bitti, alıştırma ekranı YOK |
| 5 | Oturum motoru (8 soru, ustalık, seçici, tekrar kuyruğu, DAG) | ❌ Başlanmadı | `src/progress/` klasörü yok |
| 6 | 3 kademeli yardım + hareketsizlik + hata taksonomisi | ❌ Başlanmadı | Veri var (`misconceptions.json`), akış yok |
| 7 | Maskot durumları + kutlama + Bahçem | ❌ Başlanmadı | `src/ui/feedback/` yok |
| 8 | İlk açılış, mod seçimi, avatar, ana ekran, veli kapısı | ❌ Başlanmadı | `App.tsx` geçici doğrulama ekranı |
| 9 | PWA, service worker, IndexedDB kalıcılık, yedekleme | ❌ Başlanmadı | PWA eklentisi kurulu değil |
| 10 | Kalan 13 şablon | ❌ Başlanmadı | 4/17 tamam |
| 11 | Erişilebilirlik denetimi + 5 gerçek çocuk testi | ❌ Başlanmadı | |
| 12 | Fiziksel akıllı tahta doğrulaması (2. ay) | ❌ Bekliyor | Erişim gelince |

**Tahmini konum:** ~2. haftanın başı (tek geliştirici, ~5–6 haftalık plan).

---

## Bölüm bazlı durum (plan §1–§16)

| § | Bölüm | Durum | Mevcut / Eksik |
|---|-------|------|----------------|
| 1 | Müfredat | ✅ | `kazanimlar.json` (19 çıktı, 7 tema), `skills.json` (57 düğüm), `misconceptions.json` (1996 satır), `tr.json`, MEB PDF + metin + `mufredat-kisitlari.md` |
| 2 | Teknoloji | ✅/⚠️ | Vite+React19+TS+Tailwind4 ✅ · Zod+Vitest+Playwright ✅ · **Zustand/Dexie/Framer-Motion kurulu ama kullanılmıyor** · **PWA eklentisi yok** |
| 3 | Akıllı tahta tasarımı | ✅ | `deviceProfile.ts`, `tokens.ts`, `useDeviceProfile.ts`, `BoardHarness.tsx`, `board-geometry.spec.ts` — hepsi plana sadık |
| 4 | Ses mimarisi | ✅ | `speech.ts` (Web Audio, kuyruk, prime, sequence), `audioManifest.generated.ts` (171), ~170 `.m4a`, `generate-audio.ts`+`audit-audio.ts`, Andika fontları |
| 5 | Alıştırma sistemi | ⚠️ | `types.ts` (sözleşme), `rng.ts` (mulberry32), `distractors.ts` (tanılayıcı) ✅ · **4/17 şablon** · `registry.ts` yok · `senaryolar.json`/`hints.json` yok |
| 6 | Ustalık & adaptif motor | ❌ | `src/progress/` yok (mastery/scheduler/session) |
| 7 | Geri bildirim/yardım/motivasyon | ❌ | `BigButton.tsx` ✅ (cooldown, touch-bleed, blocked) · `ui/feedback/` yok (HintPanel/Celebration) · yardım akışı yok |
| 8 | Görsel varlık | ⚠️ | `icons.svg`, `favicon.svg` · `ui/svg/` yok (Rakam/Sekiller/OnlukCerceve/Manipulatives) · `public/images/` yok (plan %90 programatik SVG hedefliyor) |
| 9 | Renk/kontrast/animasyon | ✅ | `tokens.ts` (kırmızı yok, amber retry), `index.css` (reduced-motion, AAA kontrast hedefi) |
| 10 | Veri katmanı | ❌ | `src/persistence/` yok (db/repository/backup/migrations) · Dexie kurulu ama kullanılmıyor |
| 11 | Ekran akışı | ⚠️ | `App.tsx` (geçici Adım 0), `AudioUnlock.tsx` ✅ · ana ekran/tema kartları/oturum/bahçe/veli kapısı YOK |
| 12 | Proje yapısı | ✅/⚠ | content/exercises/design/audio/ui.primitives/dev ✅ · progress/persistence/ui.svg/ui.feedback/ui.layout/store ❌ |
| 13 | Tahta olmadan doğrulama | ✅ | `BoardHarness.tsx` + `board-geometry.spec.ts` (ihlal tuzak testi dahil) |
| 14 | Yol haritası | ⚠️ | Adım 1–3 ✅, Adım 4 yarı, 5–12 ❌ |
| 15 | Doğrulama | ⚠️ | build ✅ · **tek birim testi KIRIK** · property-based (10.000 tohum) yok · `validate-content.ts` yok |
| 16 | Açık riskler | 📋 | Plan içinde belgelenmiş, değişiklik yok |

---

## Şablon tamamlanma durumu (plan §5.2 — 17 şablon)

| Şablon | Kazanım | Dosya | Durum |
|--------|---------|-------|-------|
| `M-SAY` | MAT.1.1.1, 1.1.2 | `templates/say.ts` | ✅ (iki aşamalı, tanı fonksiyonu dahil) |
| `M-KARSILASTIR` | MAT.1.1.4 | `templates/karsilastir.ts` | ✅ |
| `M-RITMIK` | MAT.1.1.5 | `templates/ritmik.ts` | ✅ |
| `M-TOPLA-GORSEL` | MAT.1.2.1, 1.2.2 | `templates/toplaGorsel.ts` | ✅ |
| `M-YON-YONERGE`/`M-KONUM` | MAT.1.3.1 | — | ❌ *(skills.json'da `M-KONUM` referansı var)* |
| `M-ESLIK` | MAT.1.3.2 | — | ❌ |
| `M-SIRA-SAYI` | MAT.1.1.3 | — | ❌ |
| `M-ORUNTU` | MAT.1.1.6 | — | ❌ |
| `M-TAHMIN` | MAT.1.1.7 | — | ❌ |
| `M-OLCME` | MAT.1.1.8 | — | ❌ |
| `M-ESIT-ISARET` | MAT.1.2.3 | — | ❌ |
| `M-TERS-ISLEM` | MAT.1.2.4 | — | ❌ |
| `M-PARA-TANI` | MAT.1.1.9 | — | ❌ |
| `M-YUVARLAK-KOSELI` | MAT.1.3.3 | — | ❌ |
| `M-YAPIDA-SEKIL` | MAT.1.3.4 | — | ❌ |
| `M-SEKIL-SINIFLA` | MAT.1.3.5 | — | ❌ |
| `M-VERI` | MAT.1.4.1 | — | ❌ |

**4/17 tamam.** Müfredat kapsamı (19 kazanım) henüz tam karşılanmıyor.

---

## Teknik doğrulama sonuçları

- **`npm run build`** → ✅ Başarılı. `tsc -b && vite build`: 26 modül, 213.6 KB JS (gzip 67 KB), 9 KB CSS.
- **`npm test`** (birim) → ❌ 1 test, 1 başarısız. Tek dosya `tests/unit/__scratch.spec.ts` geçici bir "dump" testi; Claude Code'un geçici scratchpad dizinine (`/private/tmp/claude-501/.../scratchpad/dump2.txt`) yazmaya çalışıyor ve dizin silindiği için `ENOENT` fırlatıyor. Planın istediği property-based testler (10.000 tohum, jeneratör doğrulama) henüz yazılmamış.
- **PWA** → ❌ `vite-plugin-pwa` ne `package.json`'da ne `vite.config.ts`'te. Plan §2/§9 service worker + precache istiyor.
- **Kalıcılık** → ❌ Dexie `package.json`'da ama `src/persistence/` yok. IndexedDB kullanılmıyor.

---

## Önerilen sıradaki adımlar

1. **Kırık testi temizle** — `__scratch.spec.ts` silinmeli veya gerçek bir teste dönüştürülmeli. Şu an `npm test` kırmızı.
2. **Adım 4'ü bitir** — 4 hazır şablonu ekrana getirecek alıştırma ekranı (`ui/layout/GameShell` + `ChoiceCard` + `SpeakButton`) yazılmalı. Bu, "çocuğa gösterilebilir deneyim" eşiği.
3. **Adım 5 (oturum motoru)** — `src/progress/` (mastery + scheduler + session). Alıştırma ekranı tek başına anlamsız; 8 soruluk adaptif oturum olmalı.
4. **Adım 9 (PWA + kalıcılık)** paralel ilerleyebilir — Dexie + vite-plugin-pwa, çevrimdışı çalışma için planın omurgası.
5. **`validate-content.ts`** erken yazılmalı — plan §15 bunu "projedeki en çok hata yakalayan araç" olarak tanımlıyor; 57 düğüm + 19 kazanım + şablon referansları elle tutulmaz hâle gelmeden.
