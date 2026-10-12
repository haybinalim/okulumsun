## Adım

<!-- Geliştirme planı v2 adım numarası ve başlığı, ör. "Adım 18 · F0.5 — Ses kaynağı kararı" -->
Adım:

Kapattığı eksikler (G/E):

## Bağlı karar kaydı

<!-- Bağlı ADR'si `Kabul` olmayan PR birleştirilmez (docs/ADR/README.md). Yoksa "Yok". -->
ADR: · Durumu:

## Değişiklikler

-

## Gizlilik kontrol listesi (Sıfır Veri Sözleşmesi)

- [ ] 1. Tahta modu hiçbir öğrenci, oturum, cevap, ilerleme veya takım bilgisini depolamaya, çereze veya ağa yazmıyor.
- [ ] 2. Kişisel mod da sıfır veri (ADR-0002 `Kabul` + hukuki görüş + Adım 52 tamamlanana kadar).
- [ ] 3. Çalışma anında yalnız aynı kökene statik GET; POST/PUT, `sendBeacon`, WebSocket, üçüncü taraf alan adı yok.
- [ ] 4. Yeni yerel depolama anahtarı yok (varsa ADR numarası: ).
- [ ] 5. URL'de kişisel veri yok; paylaşılan bağlantı yalnız içerik kodu + tohum, hash parçasında.
- [ ] 6. Kanıt testle verildi (depolama casusu / ağ denetimi).
- [ ] 7. Geliştirme anı hizmetleri (TTS vb.) çalışma anına istek eklemiyor; onlara yalnız `tr.json` metni gidiyor.

## Ekran görüntüleri

<!-- Ekran değiştiyse: tahta 1920×1080 ve tablet 1080×810. Değişmediyse "Ekran değişmedi". -->

## Doğrulama zinciri

- [ ] `npm run lint`
- [ ] `npm test` (sayı: )
- [ ] `npm run validate`
- [ ] `SES_GECIS_MODU=1 npm run audio:audit`
- [ ] `npm run build`
- [ ] `npm run e2e` (ekran veya şablon değiştiyse)

## Bitti tanımı

<!-- Adımın kendi Bitti tanımı kutuları -->
- [ ] PLAN §14 satırı ve `docs/PROGRESS.md` bu PR'da güncellendi.

## Onay kaydı

<!-- Push, PR açma ve birleştirme için kullanıcı onayının bağlantısı veya tarihi -->
Push/PR onayı: · Birleştirme onayı:
