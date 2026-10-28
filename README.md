# Okulumsun

**Okulumsun**, MEB 2024 İlkokul Matematik Dersi Öğretim Programı ile uyumlu, 1. sınıf için tasarlanmış çevrimdışı öncelikli bir matematik PWA'sıdır. React, TypeScript, Vite ve Zustand kullanır; yerel kayıt katmanı kendi IndexedDB sarmalayıcısıdır (ADR-0015), sesler Google Cloud Text-to-Speech ile önceden üretilip uygulamaya gömülür (ADR-0004; uygulama çalışırken ses servisine bağlanmaz). Çocuk arayüzünde görsel ve sesli yönlendirme; yetişkin arayüzünde ise yapılandırma ve gizlilik bilgisi sunar.

Öğretmenler için tanıtım sayfası: [`/ogretmen/`](public/ogretmen/index.html) (statik; `npm run ogretmen:sayfa [-- --kart]` ile kod ve ölçümlerden üretilir, elle düzenlenmez; dayanak `docs/konumlandirma.md`). Gizlilik kanıt sayfası: [`/gizlilik/`](public/gizlilik/index.html) ve KVKK beyanı taslağı (`npm run gizlilik:sayfa`).

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
npm run durum -- --denetle   # belgelerdeki sayılar ve PLAN §12 ağacı kodla eşleşiyor mu (K8)
npm run lisans:denetle      # her bağımlılık, font ve ses kaynağı lisans envanterinde mi (K10)
npm run audio:audit
npm run build
npm run e2e
```

**Ses üretimi ve ücretsiz katman (KG-109):** `npm run audio` yalnız değişen/eksik klipleri üretir; `npm run audio -- --kuru` hiç istek atmadan üretilecek klip ve karakter toplamını yazdırır, tam yeniden üretim yalnız `--zorla` ile. Google Cloud TTS isteklerinde aylık karakter defteri (depo dışında, `TTS_KULLANIM_DOSYASI`) tutulur ve betik ayda 900.000 karakterde (ücretsiz katman 1.000.000) durur; `TTS_GUVENLI_SINIR` yalnız aşağı çekilebilir. Ayrıntı: `docs/ses/SES_KAYNAKLARI.md` §10.

## Mimari notlar

| Alan | Yaklaşım |
|---|---|
| Çocuk deneyimi | Ses öncelikli, görsel destekli, akıllı tahta erişim bölgesine uygun |
| İçerik | MEB 2024 kazanımları ve beceri düğümleri |
| Para görselleri | Ekranda TCMB'nin E9 5. tertip örnek banknot görselleri ("ÖRNEKTİR GEÇMEZ", 5–200 TL, eğitim amaçlı, kaynak gösterilerek); basılı kâğıt ve arşivde şematik "OYUN PARASI". TCMB'ye izin başvurusu yapılmadı (KG-19, KG-117) |
| Çevrimdışı çalışma | PWA + önbelleğe alınan statik varlıklar |
| Öğrenci/veli verisi | Bu geliştirme sürümünde saklanmaz |
| Yayın | Tek kaynak Vercel: https://okulumsun-tc.vercel.app — yalnız yeşil CI sonrası yayınlanır, PR'lara önizleme; CSP ile dış ağ isteği tarayıcıda engellenir (`docs/yayin.md`, ADR-0003) |

## Lisanslar ve kaynaklar

**Lisans:** Tescilli, tüm hakları saklıdır (`LICENSE`, `CONTENT-LICENSE`, ADR-0013). Kaynak kod görüntülenebilir; kullanım, dağıtım veya barındırma için yazılı izin gerekir.

Müfredat, banknot görselleri, ses üretimi ve açık kaynak lisanslarına ilişkin ayrıntılar uygulamadaki **Kaynaklar ve Gizlilik** ekranında ve `LICENSES.md` dosyasında bulunur.
