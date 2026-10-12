# ADR-0003: Tek yayın kaynağı ve güvenlik başlıkları

- **Durum:** Önerildi
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

Önerilen: **Seçenek 1, Vercel tek yayın kaynağı**; kanonik adres şimdilik `okulumsun-tc.vercel.app`, özel alan adı ayrı kararla (KG-18). GitHub Pages iş akışı varsa kaldırılır. CSP: `default-src 'self'; connect-src 'self'`; CSP rapor uç noktası kurulmaz.

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
- [ ] `vercel.json` güvenlik başlıkları ve K11 kapısı yeşil (Adım 22).
- [ ] README ve Kaynaklar ekranı tek adresi gösteriyor.
