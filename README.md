# Okulumsun

**Okulumsun**, MEB 2024 İlkokul Matematik Dersi Öğretim Programı ile uyumlu, 1. sınıf için tasarlanmış çevrimdışı öncelikli bir matematik PWA'sıdır. React, TypeScript, Vite, Zustand, Dexie ve Piper TTS kullanır. Çocuk arayüzünde görsel ve sesli yönlendirme; yetişkin arayüzünde ise yapılandırma ve gizlilik bilgisi sunar.

## Geliştirme sürümünde veri saklama politikası

> **Bu geliştirme sürümünde öğrenci veya veli verisi toplanmaz, depoya gönderilmez ya da tarayıcıda saklanmaz.**

Uygulama; ad-soyad, fotoğraf, konum, hesap bilgisi, öğrenci ilerlemesi, oturum özeti ve yanıt olayı istemez. Önceki geliştirme sürümlerinden kalmış yerel öğrenci/veli kayıtları uygulama açıldığında silinir. İlerleme özeti, yedekleme ve içe/dışa aktarma geçici olarak devre dışıdır.

Öğrenci verisinin gelecekte **nerede, ne kadar süreyle, hangi amaçla ve hangi izinle** saklanacağı; ürün gereksinimleri, çocukların gizliliği ve ilgili mevzuat birlikte değerlendirilerek ayrıca kararlaştırılacaktır. Bu karar alınmadan kalıcı saklama özelliği yeniden etkinleştirilmemelidir.

## Çalıştırma

```bash
npm ci
npm run dev
```

Üretim derlemesi için:

```bash
npm run build
```

## Kalite kontrolleri

```bash
npm run lint
npm run test
npm run validate
npm run audio:audit
npm run build
npm run e2e
```

## Mimari notlar

| Alan | Yaklaşım |
|---|---|
| Çocuk deneyimi | Ses öncelikli, görsel destekli, akıllı tahta erişim bölgesine uygun |
| İçerik | MEB 2024 kazanımları ve beceri düğümleri |
| Para görselleri | TCMB örnek banknot görselleri; 5–200 TL kupürleri |
| Çevrimdışı çalışma | PWA + önbelleğe alınan statik varlıklar |
| Öğrenci/veli verisi | Bu geliştirme sürümünde saklanmaz |
| Yayın | GitHub Actions ile GitHub Pages |

## Lisanslar ve kaynaklar

Müfredat, banknot görselleri, ses üretimi ve açık kaynak lisanslarına ilişkin ayrıntılar uygulamadaki **Kaynaklar ve Gizlilik** ekranında ve `LICENSES.md` dosyasında bulunur.
