# Lisanslar

Bu dosya, "okulumsun" uygulamasında kullanılan tüm açık kaynak bileşenlerin
lisans bilgilerini içerir (plan §8).

## Uygulama lisansı

Bu proje henüz bir lisans seçmedi. Eğitim amaçlı açık kaynak olarak
dağıtılması planlanmaktadır.

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
| Piper TTS (tr_TR-fahrettin-medium) | MIT | Üretim ses sağlayıcısı |
| macOS `say` | — | Yalnızca geliştirme, dağıtılmaz |

## Müfredat kaynağı

Matematik kazanım kodları MEB 2024 İlkokul Matematik Dersi Öğretim
Programı'ndan referans alınmıştır. Ders kitabı görselleri kullanılmamıştır.

## Para görselleri

Para etkinliklerinde, Türkiye Cumhuriyet Merkez Bankası'nın (TCMB) yayımladığı E9 5. tertip **ön yüz örnek banknot görselleri** kullanılır. Her yerel dosya, TCMB’nin kaynak görselindeki kırmızı `ORNEKTIR GECMEZ` ibaresini korur ve yalnız eğitim amaçlı banknot tanıma ile sıralama etkinliklerinde gösterilir.

Kaynak sayfaları ve kupür eşlemesi [`docs/BANKNOT_GORSEL_KAYNAKLARI.md`](docs/BANKNOT_GORSEL_KAYNAKLARI.md) dosyasında belgelenmiştir. TCMB kullanım koşulları uyarınca kaynak gösterilmelidir; ticari kullanım planlanırsa TCMB’den yazılı izin alınmalıdır.

## Gizlilik beyanı

Bu uygulama ad-soyad, fotoğraf, konum veya hesap bilgisi İSTEMEZ.
Tüm veri yalnızca cihazda saklanır (IndexedDB), hiçbir sunucuya
gönderilmez. Uygulamayı kaldırdığınızda tüm veri silinir. İnternet
bağlantısı gerekmez — ilk yüklemeden sonra çevrimdışı çalışır.
