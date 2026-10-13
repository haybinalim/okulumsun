# ADR-0010: Eve link URL sözleşmesi

- **Durum:** Kabul
- **Tarih:** 2026-10-13
- **Karar sahibi:** Geliştirici · **Kullanıcı onayı:** Gerekmez
- **İlgili:** Adım 42, Sıfır Veri Sözleşmesi madde 5

## Bağlam

Öğretmen, sınıfta çalışılan konuyu evde tekrar için velilere bir bağlantıyla göndermek istiyor. URL'de kişisel veri olmamalı ve bağlantı sürümler arasında bozulmamalı.

## Seçenekler

1. **Hash parçasında yalnız içerik kodu + tohum + sürüm** — sunucuya gitmez, kişisel veri yok.
2. **Sorgu dizesinde** — sunucu günlüklerine düşer.
3. **Kısa bağlantı hizmeti** — üçüncü taraf, YASAK.

## Karar

**Seçenek 1**, Adım 42 aşama 1'de sabitlendi (KG-58). Biçim:

```
https://<kanonik kök>/#ev=<sürüm>.<set kodu>        örn.  https://okulumsun-tc.vercel.app/#ev=1.1.a1b7.k3f9q
```

- `<sürüm>` eve link sürümü (`EVE_LINK_SURUMU = '1'`); `<set kodu>` Adım 34'ün `setKodla` çıktısıdır
  (`<set sürümü>.<1–4 düğüm kodu>.<tohum base36>`). Yeni biçim yeni sürüm numarası alır; eski sürümler çözücüde korunur.
- Veri yalnız hash parçasında: tarayıcı hash'i sunucuya göndermez; `Referrer-Policy: no-referrer` (ADR-0003) yönlendiren
  başlığı da boşaltır. Sorgu dizesi (`?`) kullanılmaz.
- Çözücü (`src/ogretmen/eveLink.ts`, saf) katıdır: `[a-z0-9.]` dışı karakter, fazladan alan (`&`, ek nokta), uyumsuz sürüm,
  bilinmeyen/kayıtsız düğüm veya 40 karakteri aşan hash → `null`; uygulama bu durumda ana ekrana açılır.
- Okunduktan sonra hash `history.replaceState` ile adresten silinir (aşama 2; geçmişte kalmaz).
- Reddedilen: sorgu dizesi (sunucu/CDN günlükleri), kısa bağlantı hizmeti (üçüncü taraf), set dışı alanlar (ad, sınıf, tarih).

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `src/ogretmen/eveLink.ts` (yeni, aşama 1); açılış ayrıştırma + `EvdeCalis` (aşama 2); `EveGonder` QR ekranı (aşama 3); `/gizlilik` "eve link" bölümü.
- Test / kanıt: `tests/unit/eveLink.spec.ts` (üret/çöz tersi, fazla alan → null, sürüm uyumsuz → null, `?` yok); e2e `eve-link.spec.ts` (aşama 2: hash temizlenir, ağ isteklerinde hash yok).

## Gizlilik etkisi

URL yalnız düğüm kodu ve tohum taşır; ad, sınıf, okul, tarih veya cevap taşımaz (madde 5). Hash sunucuya ve yönlendiren başlığına gitmez; fazladan alan taşıyan bağlantı geçersiz sayılır.

## Lisans ve üçüncü taraf etkisi

Yok (aşama 1). QR kodlayıcı bağımlılığı aşama 3'te K10 envanteriyle eklenir.

## Geri dönüş maliyeti

Düşük; sürüm alanı geriye uyumu korur.

## Kabul koşulları

- [x] Biçim sabitlendi ve sürümlendi (`EVE_LINK_SURUMU`, `tests/unit/eveLink.spec.ts`).
