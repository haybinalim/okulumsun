# Bağımsız gizlilik incelemesi — yol haritası (plan v2 Adım 39, G36, KG-54)

> Amaç: "Veri almıyoruz" iddiasını bizim dışımızda biri de doğrulasın. Bu belge **aday listesidir**; her programın
> şartları, ücreti ve Türkiye'deki bir ürüne açık olup olmadığı **[doğrulanmadı — Adım 56'da]**. Başvuru kullanıcı
> kararıdır (ücret, sözleşme, kurum yazışması).

## Elimizdeki kanıt (başvuruya eklenecek)

| Kanıt | Nerede | Nasıl üretilir |
|---|---|---|
| Kamuya açık gizlilik sayfası + 3 adımlı kendin doğrula | `public/gizlilik/index.html` | `npm run gizlilik:sayfa` (kaynaktan; test eşitliği denetler) |
| Gizlilik kanıt raporu (ağ + depolama, iki mod) | `docs/gizlilik/kanit-raporu.md`, CI artefaktı `gizlilik-kanit-raporu` | e2e `onizleme-gizlilik-ag` + `npm run gizlilik:rapor` |
| Statik tarama K9 (fetch, sendBeacon, WebSocket, çerez, izinsiz depolama yasak) | `scripts/gizlilik/kurallar.ts` | `npm run gizlilik:tara` (CI) |
| Güvenlik başlıkları (CSP `connect-src 'self'`, `form-action 'none'`) | `vercel.json` | e2e `onizleme-csp`, `onizleme-tanitim` |
| KVKK beyanı (Seçenek A) | `public/gizlilik/kvkk.html` | **taslak** — hukuki görüş kullanıcıda |

## Aday programlar ve incelemeler

| Aday | Ne sağlar (bizim anlayışımız) | Uygunluk soruları | Durum |
|---|---|---|---|
| Common Sense Privacy Program (ABD) | Eğitim uygulamalarının gizlilik politikasını puanlar | Türkçe ürün/politika kabul ediliyor mu? Ücret? | [doğrulanmadı — Adım 56'da] |
| kidSAFE Seal Program (ABD) | Çocuk siteleri/uygulamaları için güvenlik ve gizlilik mührü (Matific'in öğrenci sitesinde görüldü, 13 Eki 2026) | Ücret, yıllık denetim, yabancı ürün | [doğrulanmadı — Adım 56'da] |
| ST4S — Safer Technologies for Schools (Avustralya/Yeni Zelanda) | Okullara sunulan yazılım için güvenlik/gizlilik değerlendirmesi (Matific sayfasında rozet, 13 Eki 2026) | Avustralya dışı ürünlere açık mı? | [doğrulanmadı — Adım 56'da] |
| Student Privacy Pledge benzeri taahhüt metinleri | Kamuya açık taahhüt | Programın hâlâ yürürlükte olup olmadığı | [doğrulanmadı — Adım 56'da] |
| Yerli üniversite (bilgisayar mühendisliği / eğitim teknolojileri) bağımsız incelemesi | Kaynak kod + ağ trafiği incelemesi, yazılı rapor | Hangi bölüm, süre, ücretsiz akademik iş birliği mümkün mü? | [doğrulanmadı — Adım 56'da] |
| MEB / YEĞİTEK içerik veya güvenlik değerlendirmesi | Resmî kurum görüşü | Başvuru yolu var mı? (G43 hazırlığı) | [doğrulanmadı — Adım 56'da] |

## Sıra önerisi (taslak)

1. Hukuki görüş → KVKK beyanı taslaktan çıkar (kullanıcı).
2. Ücretsiz ve yerli seçenek: üniversite incelemesi (kanıt paketi hazır).
3. Uluslararası mühür, yalnız Adım 56'daki doğrulamadan ve maliyet kararından sonra.
