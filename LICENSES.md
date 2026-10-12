# Lisanslar

Bu dosya, "okulumsun" uygulamasında kullanılan tüm açık kaynak bileşenlerin
lisans bilgilerini içerir (plan §8).

## Uygulama lisansı

Tescilli — **tüm hakları saklıdır** (ADR-0013). Kod için `LICENSE`, `src/content/` metinleri için
`CONTENT-LICENSE`. Depo herkese açık görüntülenebilir; bu, kullanma, dağıtma veya barındırma
izni vermez. `package.json` → `"license": "UNLICENSED"`. Aşağıdaki üçüncü taraf bileşenler bu
lisansın dışındadır ve kendi lisanslarına tabidir.

## Bağımlılıklar

### Çalışma zamanı (runtime)

| Paket | Lisans | Sahip |
|---|---|---|
| react | MIT | Meta Platforms, Inc. |
| react-dom | MIT | Meta Platforms, Inc. |
| zustand | MIT | Paul Henschel |
| dexie | Apache-2.0 | David Fahlander |
| vite-plugin-pwa | MIT | userquin |

### Geliştirme (devDependencies)

| Paket | Lisans |
|---|---|
| vite | MIT |
| typescript | Apache-2.0 |
| vitest | MIT |
| fake-indexeddb | MIT |

## Görsel ve ses varlıkları

| Varlık | Lisans | Not |
|---|---|---|
| Noto Color Emoji | SIL OFL 1.1 | Birinci tercih, ShareAlike yok |
| OpenMoji | CC BY-SA 4.0 | **Kullanılmaz** — ShareAlike bulaşıcı |
| Ses klipleri (`public/audio/`) | Kaynak lisans incelemesinde (ADR-0004) | Ticari dağıtım öncesi değiştirilecek. Üretim aracı: Piper (GPL-3.0, yalnız geliştirme makinesinde; çıktıya lisans geçirmez). Köken: `docs/ses/SES_KAYNAKLARI.md` |
| macOS `say` | Apple yazılım lisansı | Yalnız `--prototip`, çıktı `public/audio-prototip/` (gitignore), dağıtılmaz |

> **Bilinen sapma — ses kaynağı değişikliği yapılıyor (Adım 15, 12 Ekim 2026).** Mevcut 287 klibin
> özetleri `piper:` önekiyle üretildiğini gösteriyor, ancak hangi Piper modeliyle üretildiği bilinmiyor.
> Türkçe Piper modellerinden `tr_TR-dfki` ticari olmayan (CC BY-NC-SA 4.0) veriyle eğitildi;
> `fahrettin`/`fettah` katkı verenlerin isteğiyle kaldırıldı. Bu yüzden klipler ticari dağıtım ve
> okullara resmî sunum için uygun kabul edilmez ve Google Cloud TTS (Chirp 3 HD, `tr-TR`) ile sıfırdan
> üretilecek (Adım 31). O zamana kadar `audio:audit` CI'da `SES_GECIS_MODU=1` istisnasıyla çalışır.

## Müfredat kaynağı

Matematik kazanım kodları MEB 2024 İlkokul Matematik Dersi Öğretim
Programı'ndan referans alınmıştır. Ders kitabı görselleri kullanılmamıştır.

## Para görselleri

Para etkinliklerinde, Türkiye Cumhuriyet Merkez Bankası'nın (TCMB) yayımladığı E9 5. tertip **ön yüz örnek banknot görselleri** kullanılır. Her yerel dosya, TCMB’nin kaynak görselindeki kırmızı `ORNEKTIR GECMEZ` ibaresini korur ve yalnız eğitim amaçlı banknot tanıma ile sıralama etkinliklerinde gösterilir.

Kaynak sayfaları ve kupür eşlemesi [`docs/BANKNOT_GORSEL_KAYNAKLARI.md`](docs/BANKNOT_GORSEL_KAYNAKLARI.md) dosyasında belgelenmiştir. TCMB kullanım koşulları uyarınca kaynak gösterilmelidir; ticari kullanım planlanırsa TCMB’den yazılı izin alınmalıdır.

## Gizlilik beyanı

Bu uygulama ad-soyad, fotoğraf, konum veya hesap bilgisi İSTEMEZ.
Bu geliştirme sürümünde öğrenci veya veli verisi saklanmaz; sayfa yenilendiğinde oturum bilgileri silinir.
İnternet bağlantısı ilk yüklemeden sonra gerekmez.
