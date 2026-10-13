# Yayın (plan v2 Adım 22, ADR-0003)

## Kanonik adres

**https://okulumsun-tc.vercel.app** — okullara, velilere ve tanıtım sayfasına verilen tek adres (KG-18).
Özel alan adı ayrı karar (O7); alındığında bu dosya ve README güncellenir.

## Yayın akışı (K11)

Yayın **Vercel Git entegrasyonuyla** yapılır (KG-31; token/sır gerekmez):

1. Vercel projesi `okulumsun-tc` GitHub deposu `haybinalim/okulumsun`'a bağlıdır; Vercel GitHub uygulaması
   yalnız bu depoya erişebilir.
2. `main`'e her push → üretim derlemesi; her PR → önizleme adresi (Vercel PR'a yazar).
3. **Deployment Checks (K11):** Vercel derlemeyi bitirince `vercel.deployment.ready` olayıyla
   `.github/workflows/vercel-kontrol.yml`'ı tetikler; iş akışı o commit'te lint, test, validate, K8, K10, ses denetimi
   ve build koşar, sonucu **`Vercel - okulumsun-tc: dogrula`** commit durumu olarak yazar. Vercel'de bu durum zorunlu
   kontroldür: kırmızıysa derleme üretim adresine alınmaz. (Vercel'in GitHub kontrol listesi `ci` iş akışını
   göstermediği için bu yol seçildi, KG-32.)
4. **Git Fork Protection** açık: fork'tan gelen PR'lar sahibin onayı olmadan derlenmez.
5. **Deployment Protection** (Vercel Authentication) önizlemelerde açık; üretim herkese açık.

`vercel.json` içinde `git.deploymentEnabled` yalnız `main` için açık bırakılır; diğer dallara push'lar PR üzerinden önizlenir.

### Yedek

`deploy-pages.yml` (GitHub Pages) yalnız **elle** tetiklenir (Actions → deploy-pages → Run workflow).
GitHub Pages özel HTTP başlığı desteklemez; yedekte CSP yoktur. Yalnız Vercel kesintisinde kullanılır.

## Güvenlik başlıkları

Tek kaynak `vercel.json`. `vite preview` aynı başlıkları sunar (`scripts/yayin/basliklar.ts`), böylece e2e
`onizleme-csp.spec.ts` üretim politikasını yerelde ve CI'da sınar.

| Başlık | Değer | Neden |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'` … `connect-src 'self'` | Sıfır Veri Sözleşmesi madde 3: uygulama yanlışlıkla üçüncü tarafa istek atarsa tarayıcı reddeder |
| ↳ `script-src 'self'` | satır içi betik ve `eval` yok | zod v4'ün eval yoklaması `z.config({ jitless: true })` ile kapatıldı (`src/content/schema/zodAyari.ts`) |
| ↳ `style-src 'self' 'unsafe-inline'` | | Bileşenler satır içi `style` kullanıyor; kaldırılması ayrı iş |
| ↳ `img-src 'self' data: blob:`, `media-src 'self' blob:` | | SVG veri adresleri, yedek dışa aktarımı ve ses |
| ↳ `frame-ancestors 'self'` | | EBA alan adı Adım 56'da doğrulanınca eklenir |
| ↳ `form-action 'none'`, `object-src 'none'` | | Form gönderimi ve eklenti yok |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | Çocuk cihazında hiçbir sensör/ödeme izni istenmez (`interest-cohort` kaldırılmış bir özellik; konsol uyarısı ürettiği için eklenmedi) |
| `Referrer-Policy` | `no-referrer` | Dış bağlantılara adres sızmaz |
| `X-Content-Type-Options` | `nosniff` | |
| `X-Frame-Options` | `SAMEORIGIN` | `frame-ancestors`'ı tanımayan eski tarayıcılar için |
| `Cross-Origin-Opener-Policy` | `same-origin` | |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Yalnız HTTPS |
| `Cache-Control` | `index.html`, `sw.js`, `registerSW.js`, manifest: `no-cache`; `/assets/*`: 1 yıl `immutable` | Güncelleme hemen gelir; hash'li dosyalar yeniden indirilmez |

CSP raporlama uç noktası kurulmaz (veri toplamama ilkesi).

## Kanıt

- `tests/unit/yayinBasliklari.spec.ts`: politika kuralları (connect-src yalnız `'self'`, harici alan yok, mikrofon/kamera kapalı, `form-action 'none'`, token tabanlı yayın iş akışı yok, Pages yalnız elle).
- `tests/e2e/onizleme-csp.spec.ts`: üretim derlemesi + başlıklar altında CSP ihlali yok; Andika fontu yüklü, service worker hazır, ses klibi `fetch` ile alınabiliyor. `E2E_HEDEF_URL=https://… npm run e2e -- onizleme-csp` ile canlı adrese karşı koşar.
- Tuzak (12 Eki 2026, yerel): sayfadan `fetch('https://example.com/')` → CSP tarafından engellendi.
- securityheaders.com raporu: sırlar tanımlanıp ilk üretim yayını yapılınca buraya eklenecek.

## Alt dizin / USB

Çıktı göreli yollarla (`base: './'`) çalışır; okul sunucusu alt dizini ve USB/`file://` açılışı Adım 49'da kanıtlanır.
`file://` açılışında HTTP başlığı olmadığı için CSP uygulanmaz; ağ yasağı orada uygulama kodunun kendisine dayanır.

## Çalışma kâğıdı arşivi (plan v2 Adım 48, KG-70)

`public/kagitlar/` (165 PDF + dizin sayfaları) ve `public/sitemap.xml` commitlenir; Vercel derlemesi yalnız kopyalar.
Beceri, şablon, kâğıt yerleşimi ya da `tr.json` metni değişince: `npm run build && npm run arsiv` → değişen PDF'leri
commitleyin. `tests/unit/arsivDizini.spec.ts` dizin/sitemap bayatlığını ve eksik PDF'yi CI'da yakalar (PDF içeriğinin
bayatlığını yakalamaz; içerik değişikliği PR'larında arşivi yeniden üretmek gözden geçirme maddesidir).

## Okul paketi (plan v2 Adım 49, KG-71)

`main` push'unda CI `dist-okul.zip` artefaktını üretir (`npm run okul-paketi`; 30 gün saklanır). GitHub Release eki
yapılmaz: okul/kurum ağı dağıtımı ADR-0013 gereği yazılı izin ister. Kurulum: `docs/kurulum/okul-agi.md`.
