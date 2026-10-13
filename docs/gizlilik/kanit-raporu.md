# Gizlilik kanıt raporu

> Üretildi: `npm run gizlilik:rapor` (plan v2 Adım 39, KG-54). Kaynak: e2e `onizleme-gizlilik-ag.spec.ts`, üretim
> derlemesi + `vercel.json` güvenlik başlıkları. Sürüm **v0.1.0**, derleme `e745289`.
> CI her PR'da bu raporu `gizlilik-kanit-raporu` artefaktı olarak yükler; depodaki kopya son yerel üretimdir.

**Sonuç: TEMİZ** — 3 akış; başka kökene istek, gövdeli istek, WebSocket,
sessionStorage, çerez ve IndexedDB kaydı yok.

| Akış | İstek | Türe göre | Yöntem | Başka köken | Gövdeli | Soket | localStorage | sessionStorage | Çerez | IndexedDB kaydı |
|---|---|---|---|---|---|---|---|---|---|---|
| kişisel mod: tam oturum + Bahçem | 176 | uygulama kodu 3, ses 168, font 4, belge/manifest 1 | GET | 0 | 0 | 0 | `okulumsun.deviceOverride` | 0 | yok | 0 |
| tahta modu: Sınıf Turu | 176 | uygulama kodu 3, ses 168, font 4, belge/manifest 1 | GET | 0 | 0 | 0 | — | 0 | yok | 0 |
| tahta modu: tema + 5 soru | 167 | uygulama kodu 3, ses 159, font 4, belge/manifest 1 | GET | 0 | 0 | 0 | — | 0 | yok | 0 |

İzinli tek localStorage anahtarı ekran boyutu tercihidir (`src/persistence/depolamaIzinListesi.ts`). İstek sayısı
akıştaki ses ve görsel sayısına göre değişir; tümü uygulamanın kendi dosyalarıdır.
