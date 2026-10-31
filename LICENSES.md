# Lisanslar

Bu dosya, "okulumsun" uygulamasının lisansını ve kullandığı tüm üçüncü taraf bileşenlerin
lisans bilgilerini içerir (plan §8, ADR-0013, ADR-0014).

## Uygulama lisansı

Tescilli — **tüm hakları saklıdır** (ADR-0013). Kod için `LICENSE`, `src/content/` metinleri için
`CONTENT-LICENSE`. Depo herkese açık görüntülenebilir; bu, kullanma, dağıtma veya barındırma
izni vermez. `package.json` → `"license": "UNLICENSED"`. Aşağıdaki üçüncü taraf bileşenler bu
lisansın dışındadır ve kendi lisanslarına tabidir.

## Üçüncü taraf varlıklar

Bu bölüm `src/content/ucuncuTarafVarliklar.ts` envanterinden **üretilir**; elle düzenlemeyin.
`npm run lisans:denetle -- --yaz` yeniden yazar, `npm run lisans:denetle` (CI, K10) farkı yakalar.
Uygulamadaki Kaynaklar ekranı aynı listeyi çizer.

<!-- lisans:basla -->
### Çalışma zamanı bağımlılıkları

| Ad | Lisans | Sahip | Koşul |
|---|---|---|---|
| react | MIT | Meta Platforms, Inc. | — |
| react-dom | MIT | Meta Platforms, Inc. | — |
| zustand | MIT | Paul Henschel | — |
| zod | MIT | Colin McDonnell | — |
| framer-motion | MIT | Matt Perry | — |
| qrcode-generator | MIT | Kazuhiko Arase | yalnız Eve gönder ekranıyla tembel yüklenir (Adım 42) |
| canvas-confetti | ISC | Kiril Vatev | — |
| workbox-window | MIT | Google LLC | vite-plugin-pwa ile service worker içine derlenir |

### Yazı tipleri

| Ad | Lisans | Sahip | Koşul |
|---|---|---|---|
| Andika | SIL OFL 1.1 | SIL International | — |
| TemelYazi | MEB TTKB yayını; gömülü lisans metni yok | T.C. Millî Eğitim Bakanlığı TTKB (tasarım: HBY Tasarım) | Alt kümeler: rakam + işaret (TemelYazi-Rakam.woff2, KG-95) ve çocuğa dönük metnin harfleri — Türkçe alfabe, rakam, temel noktalama, ₺ % (TemelYazi-Harf.woff2, KG-96); ikisi de TemelYazi-Bold konturları, tam font dağıtılmaz. MEB amacı: "ders kitapları ve eğitim araçlarında kullanılması". Ticari dağıtım ve açık repo için MEB TTKB/tasarımcıdan yazılı izin önerilir (henüz istenmedi) |

### Görseller

| Ad | Lisans | Sahip | Koşul |
|---|---|---|---|
| TCMB E9 5. tertip örnek banknot görselleri | TCMB kullanım şartları | Türkiye Cumhuriyet Merkez Bankası | Ekranda, basılı kâğıtta ve arşivde (KG-122); "ÖRNEKTİR GEÇMEZ" korunur, kaynak gösterilerek eğitim amaçlı. TCMB çoğaltma duyurusu (RG 24.02.2004/25383): dosyalar gerçek boyutta ≤ 72 dpi, kâğıtta tek yüz ve en/boyun %75'inden küçük. TCMB site kullanım şartları ticari kullanımı yazılı izne bağlar; TCMB'ye başvurulmadı (KG-19) |

### Ses

| Ad | Lisans | Sahip | Koşul |
|---|---|---|---|
| Ses klipleri (public/audio/, google:tr-TR-Chirp3-HD-Puck@2026-10) | ADR-0004 kaynağının şartları | Okulumsun (üretim), ses modeli sağlayıcısı | Sesler Google Cloud Text-to-Speech ile üretilmiştir (gönüllü ifşa, ADR-0004) |

### Geliştirme araçları (dağıtılmaz)

| Ad | Lisans | Sahip | Koşul |
|---|---|---|---|
| vite | MIT | Evan You ve Vite katkıcıları | — |
| vite-plugin-pwa | MIT | Anthony Fu | — |
| typescript | Apache-2.0 | Microsoft Corp. | — |
| vitest | MIT | Anthony Fu ve Vitest katkıcıları | — |
| happy-dom | MIT | David Ortner | — |
| fake-indexeddb | Apache-2.0 | Jeremy Scheff | — |
| dexie | Apache-2.0 | David Fahlander | Yalnız IndexedDB biçim uyum testinde (ADR-0015); uygulama kendi sarmalayıcısını kullanır |
| Piper | GPL-3.0 | Open Home Foundation | Yalnız geliştirme makinesinde; ürettiği ses dosyalarına lisans geçirmez |
<!-- lisans:bitir -->

**Kullanılmayanlar.** Emoji yazı tipi paketlenmez (emoji, cihazın kendi yazı tipiyle çizilir); OpenMoji
(CC BY-SA 4.0, ShareAlike bulaşıcı) kullanılmaz. macOS `say` yalnız `--prototip` ile geliştirme makinesinde
çalışır, çıktısı `public/audio-prototip/` (gitignore) dağıtılmaz.

> **Ses kaynağı (Adım 31, 28 Ekim 2026).** Tüm klipler Google Cloud Text-to-Speech (Chirp 3 HD,
> `tr-TR-Chirp3-HD-Puck`, hız 0,9) ile sıfırdan üretildi; kökeni bilinmeyen eski `piper:` klipleri
> (KG-15) dağıtımdan çıktı. Google atıf şartı koymuyor; gönüllü ifşa: "Sesler Google Cloud
> Text-to-Speech ile üretilmiştir." Şartlar, şart sürümü ve 18 yaş altı kısıtı notu ADR-0004'te
> (`cocukUrunundeKullanim: kosullu`, ticari lansman öncesi avukat incelemesi). `audio:audit` CI'da
> geçiş istisnası olmadan çalışır (K4).

**Kendi çizimlerimiz.** Soru nesneleri ve materyaller (`src/ui/svg/`) ile Türkçe sözcük görselleri
(`ders-verisi/tur/gorseller/`, Okuma Yazma Adım 68) bu depoda kodla yazılmış özgün SVG'lerdir: üçüncü taraf ikon
seti, emoji, yapay zekâ görseli, metin ve `<mask>` yoktur (KG-104; `npm run validate` D-25 denetler). Üçüncü taraf
varlık olmadıkları için yukarıdaki envanterde satırları yoktur; görsel envanteri (hangi sözcüğe hangi görsel, teyit
durumu) `ders-verisi/tur/gorseller/grup-<n>.json` dizinleridir. İçerik lisansı: `CONTENT-LICENSE`.

## Müfredat kaynağı

Matematik kazanım kodları MEB 2024 İlkokul Matematik Dersi Öğretim
Programı'ndan referans alınmıştır. Ders kitabı görselleri kullanılmamıştır.

## Para görselleri

Banknotlar ekranda, basılı çalışma kâğıtlarında ve kâğıt arşivinde Türkiye Cumhuriyet Merkez Bankası'nın (TCMB) internet sitesinde yayımladığı E9 5. tertip **ön yüz örnek banknot görselleridir** (KG-122). Her yerel dosya TCMB'nin kırmızı "ÖRNEKTİR GEÇMEZ" ibaresini korur; görseller yalnız eğitim amaçlı banknot tanıma ve sıralama etkinliklerinde, kaynak gösterilerek kullanılır.

TCMB'nin "Banknotların Resim ve Görüntülerinin Çoğaltılması ve Yayınlanması ile İlgili Duyuru"suna (Resmî Gazete 24.02.2004/25383, değişik 13.10.2004/25612) uyum: dosyalar gerçek banknot boyutunda 72 dpi'ı aşmaz (madde 4) ve "ÖRNEKTİR GEÇMEZ" ibaresini taşır (madde 5); kâğıtta yalnız ön yüz, tek taraflı ve gerçek en/boyun %75'inden küçük basılır (madde 1; ≈ 39,7 mm genişlik).

**TCMB'ye izin başvurusu yapılmamıştır** (KG-19, ADR-0014); bu kullanım TCMB'nin izni veya onayı anlamına gelmez. TCMB site kullanım şartları sitedeki bilgilerin ticari amaçlarla kullanımını TCMB'nin yazılı iznine bağlar: okul/kurum lisansı satışından (ADR-0014 c) önce yazılı izin alınmalı veya karar yeniden değerlendirilmelidir. Kaynak sayfaları ve kupür eşlemesi: [`docs/BANKNOT_GORSEL_KAYNAKLARI.md`](docs/BANKNOT_GORSEL_KAYNAKLARI.md).

## Gizlilik beyanı

Bu uygulama ad-soyad, fotoğraf, konum veya hesap bilgisi İSTEMEZ.
Bu geliştirme sürümünde öğrenci veya veli verisi saklanmaz; sayfa yenilendiğinde oturum bilgileri silinir.
İnternet bağlantısı ilk yüklemeden sonra gerekmez.
