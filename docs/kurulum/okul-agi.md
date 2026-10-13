# Okul ağı ve yerel dağıtım (plan v2 Adım 49, KG-71)

Okulumsun statik bir uygulamadır: sunucu kodu, veritabanı ya da hesap yoktur. İnterneti kısıtlı veya filtreli
okullarda üç yol vardır.

## 1. Adresi filtre listesine ekletmek (en kolay)

Okulun ya da il/ilçe MEB ağının filtresine eklenecek tek alan adı: **`okulumsun-tc.vercel.app`**. Uygulama başka
hiçbir alan adına istek atmaz (yazı tipi, ses, görsel dâhil hepsi aynı kökenden; `tests/e2e/onizleme-gizlilik-ag.spec.ts`).
Bir kez açıldıktan sonra çevrimdışı da çalışır (hizmet çalışanı, PWA).

## 2. Okul sunucusu (internet yoksa önerilen)

1. CI artefaktı `dist-okul.zip`'i indirin (GitHub Actions → `ci` → `okul-paketi`) ya da depoda
   `npm ci && npm run build && npm run okul-paketi` çalıştırın.
2. Zipteki `okulumsun/` klasörünü okulun web sunucusuna kopyalayın. Alt klasör sorun değildir
   (`http://sunucu/okul/okulumsun/` e2e ile sınanır: `tests/e2e/onizleme-yerel.spec.ts`). Tüm yollar görelidir (`base: './'`).
3. Sunucu MIME türleri: `.js` → `text/javascript`, `.webmanifest` → `application/manifest+json`, `.m4a` → `audio/mp4`,
   `.woff2` → `font/woff2`. Güvenlik başlıkları isteğe bağlıdır; önerilenler `vercel.json`'dadır.
4. Hizmet çalışanı yalnız HTTPS veya `localhost` altında kurulur; düz HTTP okul sunucusunda çevrimdışı önbellek
   kurulmaz (her açılışta sunucudan yüklenir). Düz HTTP'de (güvenli olmayan bağlam) tam akış henüz sınanmadı: e2e
   `127.0.0.1` kullanır ve tarayıcı onu güvenli bağlam sayar. Mümkünse okul sunucusunda HTTPS kullanın.

## 3. Tek bilgisayar / USB

`index.html`'e çift tıklamak (**`file://`**) **çalışmaz**: tarayıcılar modül betiklerini ve stil dosyalarını dosyadan
yüklemeyi CORS kuralı gereği engeller (Chromium'da doğrulandı). Bu durumda boş ekran yerine `public/yerel-acilis.js`
ne yapılacağını anlatan bir uyarı gösterir (e2e ile sınanır). Çözüm: klasörde yerel bir sunucu başlatmak, örneğin
`python -m http.server 8080` → `http://localhost:8080/` (localhost'ta hizmet çalışanı da kurulur).

`file://` desteği için tek dosyalık, modülsüz ayrı bir derleme ve sesler için `<audio>` yolu gerekir; şimdilik yapılmadı
(KG-71: akıllı tahtaların çoğu tarayıcıdan adres açabildiği ve okul sunucusu yolu çalıştığı için).

## Güncelleme

Yeni sürümde `okulumsun/` klasörünü tümüyle değiştirin (eski dosyaları silin). `SURUM.txt` sürümü,
`SHA256SUMS.txt` dosya bütünlüğünü verir (`sha256sum -c SHA256SUMS.txt`).

## Lisans

Yazılım tüm hakları saklıdır (ADR-0013). Okul/kurum ağında dağıtım telif hakkı sahibinin **yazılı iznine** bağlıdır;
izin metni hazırlanana kadar paket yalnız CI artefaktıdır, GitHub Release eki yapılmaz.
