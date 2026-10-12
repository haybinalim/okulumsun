# Yayın (plan v2 Adım 22, ADR-0003)

## Kanonik adres

**https://okulumsun-tc.vercel.app** — okullara, velilere ve tanıtım sayfasına verilen tek adres (KG-18).
Özel alan adı ayrı karar (O7); alındığında bu dosya ve README güncellenir.

## Yayın akışı (K11)

1. Her push ve PR'da `ci` iş akışı çalışır (lint, test, validate, K8, K10, ses denetimi, build; PR'da + e2e).
2. `ci` **başarıyla** biterse `deploy-vercel` (`workflow_run`) tetiklenir:
   - `main`'e push → **üretim** (`vercel deploy --prebuilt --prod`).
   - Aynı depodan açılan PR → **önizleme**; adres PR'a yorum olarak yazılır.
   - Fork'tan gelen PR'lar yayınlanmaz (sırlar fork koduyla kullanılmaz).
3. Kırmızı CI'da yayın olmaz. Vercel'in kendi Git otomatik yayını `vercel.json` içinde kapalıdır
   (`"git": { "deploymentEnabled": false }`), böylece CI'ı atlayan ikinci bir yol kalmaz.

### Gerekli depo sırları (GitHub → Settings → Secrets and variables → Actions)

| Sır | Nereden |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens (yalnız bu proje için, süreli) |
| `VERCEL_ORG_ID` | Proje → Settings → General → "Team ID" (kişisel hesapta kullanıcı kimliği) |
| `VERCEL_PROJECT_ID` | Proje → Settings → General → "Project ID" |

Sırlar tanımlı değilse `deploy-vercel` uyarı yazıp atlar; CI kırmızıya dönmez.

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

- `tests/unit/yayinBasliklari.spec.ts`: politika kuralları (connect-src yalnız `'self'`, harici alan yok, mikrofon/kamera kapalı, `form-action 'none'`, Git otomatik yayını kapalı, Pages yalnız elle).
- `tests/e2e/onizleme-csp.spec.ts`: üretim derlemesi + başlıklar altında CSP ihlali yok; Andika fontu yüklü, service worker hazır, ses klibi `fetch` ile alınabiliyor. `E2E_HEDEF_URL=https://… npm run e2e -- onizleme-csp` ile canlı adrese karşı koşar.
- Tuzak (12 Eki 2026, yerel): sayfadan `fetch('https://example.com/')` → CSP tarafından engellendi.
- securityheaders.com raporu: sırlar tanımlanıp ilk üretim yayını yapılınca buraya eklenecek.

## Alt dizin / USB

Çıktı göreli yollarla (`base: './'`) çalışır; okul sunucusu alt dizini ve USB/`file://` açılışı Adım 49'da kanıtlanır.
`file://` açılışında HTTP başlığı olmadığı için CSP uygulanmaz; ağ yasağı orada uygulama kodunun kendisine dayanır.
