# ADR-0003: Tek yayın kaynağı ve güvenlik başlıkları

- **Durum:** Kabul
- **Tarih:** 2026-10-12
- **Karar sahibi:** Kullanıcı · **Kullanıcı onayı:** Barındırıcı kararı verildi: Vercel, 11 Eki 2026 (KG-18); güvenlik başlıkları Adım 22'de
- **İlgili:** PLAN §14 Adım 11, Adım 22, 25, 26, 38, README yayın satırı

## Bağlam

README bir süre GitHub Pages diyordu, ürün ise Vercel'de (`okulumsun-tc.vercel.app`) yayında. İki yayın yolu iki farklı sürümün dolaşmasına yol açar. CSP ve güvenlik başlıkları (özellikle `connect-src 'self'`) Sıfır Veri Sözleşmesi madde 3'ü tarayıcıda zorlamanın yoludur.

## Seçenekler

1. **Vercel tek kaynak** — önizleme dağıtımları, başlıklar `vercel.json` ile; hesap kullanıcıda.
2. **GitHub Pages** — ücretsiz, depo içi; özel başlık tanımlanamaz (CSP yalnız meta etiketle, eksik).
3. **Netlify** — Vercel'e benzer; yeni hesap gerekir.

## Karar

**Seçenek 1, Vercel tek yayın kaynağı** (KG-18); kanonik adres `okulumsun-tc.vercel.app`, özel alan adı ayrı kararla. Yayın GitHub Actions'tan (`deploy-vercel.yml`, `workflow_run` ← `ci` başarılı) Vercel CLI ile yapılır; Vercel Git otomatik yayını kapalı (K11). GitHub Pages iş akışı silinmez, yalnız elle tetiklenen yedek olur. Başlıklar `vercel.json`'da (ayrıntı `docs/yayin.md`); CSP rapor uç noktası kurulmaz. `style-src 'unsafe-inline'` geçici; zod `jitless` ile `script-src`'de eval gerekmez (KG-30).

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `vercel.json` (başlıklar), README, PLAN §14 Adım 11.
- Test / kanıt: yayın kapısı K11 (Adım 22) başlıkları önizleme adresinde doğrular.

## Gizlilik etkisi

Olumlu: CSP `connect-src 'self'` dışarıya veri gönderimini tarayıcıda engeller. Vercel Analytics veya benzeri hiçbir izleme eklenmez.

## Lisans ve üçüncü taraf etkisi

Vercel hizmet şartları (barındırma). Yeni çalışma anı bağımlılığı yok.

## Geri dönüş maliyeti

Düşük: statik çıktı her statik barındırıcıya taşınabilir.

## Kabul koşulları

- [x] Barındırıcı seçildi (KG-18).
- [x] `vercel.json` güvenlik başlıkları; birim + e2e CSP testleri yeşil (Adım 22).
- [x] README tek adresi gösteriyor.
- [ ] Depo sırları (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) tanımlandı, ilk üretim yayını CI'dan yapıldı, securityheaders.com A (kullanıcı, O8).
