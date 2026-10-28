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
| TCMB E9 5. tertip örnek banknot görselleri | TCMB kullanım şartları | Türkiye Cumhuriyet Merkez Bankası | Kaynak gösterilerek eğitim amaçlı; ticari kullanımda yazılı izin. TCMB'ye başvurulmaz (KG-19), Adım 29'da şematik banknotla değiştirilir |

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

## Müfredat kaynağı

Matematik kazanım kodları MEB 2024 İlkokul Matematik Dersi Öğretim
Programı'ndan referans alınmıştır. Ders kitabı görselleri kullanılmamıştır.

## Para görselleri

Para etkinliklerinde, Türkiye Cumhuriyet Merkez Bankası'nın (TCMB) yayımladığı E9 5. tertip **ön yüz örnek banknot görselleri** kullanılır. Her yerel dosya, TCMB’nin kaynak görselindeki kırmızı `ORNEKTIR GECMEZ` ibaresini korur ve yalnız eğitim amaçlı banknot tanıma ile sıralama etkinliklerinde gösterilir.

**TCMB'ye izin başvurusu yapılmaz** (KG-19, ADR-0014); bu görseller Adım 29'da ekranda, kâğıtta ve arşivde şematik banknot çizimleriyle (`SematikBanknot`) değiştirilir ve depodan kaldırılır.

Kaynak sayfaları ve kupür eşlemesi [`docs/BANKNOT_GORSEL_KAYNAKLARI.md`](docs/BANKNOT_GORSEL_KAYNAKLARI.md) dosyasında belgelenmiştir. TCMB kullanım koşulları uyarınca kaynak gösterilmelidir; ticari kullanım planlanırsa TCMB’den yazılı izin alınmalıdır.

## Gizlilik beyanı

Bu uygulama ad-soyad, fotoğraf, konum veya hesap bilgisi İSTEMEZ.
Bu geliştirme sürümünde öğrenci veya veli verisi saklanmaz; sayfa yenilendiğinde oturum bilgileri silinir.
İnternet bağlantısı ilk yüklemeden sonra gerekmez.
