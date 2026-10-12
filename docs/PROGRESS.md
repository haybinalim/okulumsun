# okulumsun — İlerleme Raporu

> Bu rapor, `docs/PLAN.md`'deki plan ile projenin mevcut durumunu karşılaştırır.
> Bir adımı bitiren, bu raporu ve PLAN §14 durum sütununu AYNI commit'te günceller.
> Kural: **kanıt neredeyse durum odur.** Kanıtı olmayan ✅ yazılmaz.
> Tarih: 12 Ekim 2026 (Adım 16 — durum tablosu kanıtla hizalandı)

<!-- durum:birim_test=214 durum:birim_dosya=22 durum:e2e_dosya=2 durum:kazanim=19 durum:beceri=57 durum:sablon=39 durum:ses=287 -->

## Yönetici özeti

Durum tablosu kanıtla hizalandı: daha önce ✅ görünen Adım 8, 9, 11 ve 12 **kısmi**,
Adım 13 **başlanmadı** olarak yeniden açıldı. Kod geri gitmedi; yalnız doğrulanmamış
iddialar geri çekildi ve her eksik maddenin hangi adımda kapanacağı yazıldı.

İçerik ve motor tarafı tamam: 19 kazanımın tamamı 39 şablonla kapsanıyor, oturum motoru,
yardım akışı, maskot ve Bahçem çalışıyor. Ürün okulumsun-tc.vercel.app'te yayında.
Açık işler: ticari kullanıma uygun ses kaynağı (Adım 31), gerçek çocuk ve fiziksel tahta
testleri (Adım 32, 33), PWA kurulabilirlik ve çevrimdışı kanıtı (Adım 25, 26).

Sıradaki iş **Adım 17** (geliştirme planı v2).

## Yol haritası durumu (plan §14)

| Adım | İçerik | Durum |
|------|--------|------|
| 0 | İskelet + tokens + cihaz profili + BoardHarness | ✅ |
| 1 | Ses altyapısı (287 klip, SpeechService, ses kilidi) | ✅ |
| 2 | İlk 4 jeneratör + property-based testler | ✅ |
| 2b | CI iş akışı (`.github/workflows/ci.yml`) | ✅ |
| 2c | Şablon kayıt defteri (`src/exercises/registry.ts`, PLAN §5.4) | ✅ |
| 3 | SVG manipülatifler | ✅/⚠ (rakam glifleri MEB onayı bekliyor → Adım 30) |
| 4 | Alıştırma ekranı | ✅ (`ExerciseScreen`, `GameShell`, e2e geometri testi) |
| 5 | Oturum motoru (`src/progress/`) | ✅/⚠ (SAF; kova oranı testi gevşek — gerçekçi profil gerektirir) |
| 6 | 3 kademeli yardım + hata taksonomisi akışı | ✅ |
| 7 | Maskot + kutlama + Bahçem | ✅ |
| 8 | Kabuk ekranları + veli kapısı/paneli | 🔄 kısmi — veli paneli 5 kalemden 2'si (ayarlar kısmen: cihaz profili ayarı yok → Adım 27; Kaynaklar bağlantısı). İlerleme, zorlanılan konular, yedekleme Seçenek A (veri saklanmaz) gereği kapalı → Adım 52 |
| 9 | Kalıcılık + PWA + yedekleme | 🔄 kısmi — çevrimdışı tam oturum e2e yok → Adım 26; yedek dışa/içe aktarım e2e yok → Adım 52; Lighthouse PWA kurulabilir değil → Adım 25 |
| 10 | Kalan 35 şablon + ses kümeleri (§4.5) + SVG varlıklar | ✅ 39/39 şablon; §4.5 ses kümeleri üretildi |
| 11 | Dağıtım + LICENSES + Kaynaklar ekranı | 🔄 kısmi — Vercel'de yayında; USB/`file://` açılış kanıtı yok → Adım 49; kalıcı yayın hedefi kararı (ADR-0003) → Adım 22 |
| 12 | Erişilebilirlik + 5 çocukla tablet testi | 🔄 kısmi — erişilebilirlik denetimi ✅; 5 çocukla tablet testi yapılmadı → Adım 32 |
| 13 | (2. ay) Fiziksel tahta doğrulaması | ⬜ — yapılmadı → Adım 33, 41 |
| 14 | PR #14 — erişilebilir şık etiketleri, veli kapısı/panel, `adult-area` e2e | ✅ |
| 15 | Ses kökeni envanteri + acil lisans beyanı düzeltmesi + `audio:audit` köken denetimi | ✅ |
| 16 | Durumu gerçeğe döndürme (PLAN §14, PROGRESS, TEST-PROTOKOLU, README, LICENSES) + `belgeTutarliligi.spec.ts` | ✅ |

Adım 17–58: depo dışındaki geliştirme planı v2.

## Teknik doğrulama (son çalıştırma: 12 Ekim 2026)

- `npm test` → ✅ 214/214, 22 dosya
- `npm run e2e` → ✅ 2 dosya: 5 geçti, 1 bilinçli atlandı
- `npm run validate` → ✅ 19 kazanım · 57 beceri · 15/15 hata etiketi · 39 jeneratör
- `SES_GECIS_MODU=1 npm run audio:audit` → ✅ 287/287 klip, köken eşleşmesi tam
- `npm run build` → ✅ PWA service worker, 305 precache girdisi (~5,9 MB)
- `npm run lint` → ✅ 0 uyarı 0 hata
- CI → ✅ `.github/workflows/ci.yml` (push: lint, test, validate, audio:audit, build; PR: + e2e)

## Bilinen sapmalar / notlar

- **Ses kaynağı değişiyor.** Mevcut 287 klip `piper:` önekiyle üretildi, modeli bilinmiyor;
  Türkçe Piper sesleri ticari dağıtıma uygun değil (`docs/ses/SES_KAYNAKLARI.md`).
  `npm run audio:audit` ticari izinsiz aktif kaynakta çıkış 1 verir; yerelde ve CI'da
  `SES_GECIS_MODU=1` ile çalıştırılır. Klipler Adım 31'de Google Cloud TTS Chirp 3 HD ile
  yeniden üretilecek.
- **Veri saklanmıyor (Seçenek A).** Öğrenci ve veli verisi saklanmaz; Dexie kalıcılık katmanı
  kodda var ama politika modülü (`veriSaklamaPolitikasi.ts`) kapalı tutuyor. LICENSES gizlilik
  paragrafı veli panelindeki `VERI_SAKLAMA_BILDIRIMI` cümlesini birebir içerir (testle korunur);
  Kaynaklar ekranı aynı politikayı kendi metniyle anlatır.
- **Bilinen hatalar** (plan v2'de adımlara bağlı): PWA simgeleri `icon-192/512` eksik;
  manifest `portrait` ile yatay tahta çelişiyor; Bahçem sahne toplamı sabit `3`.
- `origin/v0/okulumsun-b1ba469b` dalı silinmez; arşiv etiketi `arsiv/v0-okulumsun-b1ba469b`
  ile korunur (karar KG-16).
