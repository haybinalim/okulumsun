# ADR-0013: Uygulama lisansı

- **Durum:** Kabul
- **Tarih:** 2026-10-12
- **Karar sahibi:** Kullanıcı · **Kullanıcı onayı:** 12 Eki 2026, sohbette ("ticari niyetim var, tüm hakları saklı yapalım") — plan v2 KG-27
- **İlgili:** Adım 20, 49, 56, KG-17

## Bağlam

Depo şimdilik herkese açık (KG-17, startup programı başvuruları için). LICENSE dosyası yok; bu durumda varsayılan "tüm hakları saklı"dır. Ürünün ileride ücretli satılması düşünülüyor (KG-06).

## Seçenekler

1. **AGPL-3.0 (kod) + CC BY-SA 4.0 (içerik)** — açık kaynak; rakip kapalı ürünler kodu alamaz, ama ticari satış zorlaşır.
2. **MIT (kod) + CC BY 4.0 (içerik)** — en serbest; ticari rakipler kopyalayabilir.
3. **Kaynağı görünür, ticari kullanım yok** (ör. PolyForm Noncommercial) — açık kaynak sayılmaz.
4. **Tüm hakları saklı** — açık LICENSE ile ticari niyet korunur; okul ağı dağıtımı (Adım 49) izin metni ister.

## Karar

**Seçenek 4, tüm hakları saklı** (kullanıcı kararı, 12 Eki 2026). Gerekçe: ticari niyet (KG-06); en az geri dönüşü olmayan seçenek — açık lisans sonra her zaman verilebilir, verilmiş açık lisans geri alınamaz.

- Kod: `LICENSE` (tescilli, TR + EN). İçerik: `CONTENT-LICENSE` (`src/content/`; MEB metinleri, ses klipleri, banknot çizimleri, yazı tipleri **kapsam dışı**).
- `package.json`: `"license": "UNLICENSED"`, `"private": true` kalır.
- Telif sahibi şimdilik `haybinalim (Okulumsun)`; şirket kurulunca tüzel kişi adına güncellenir.
- Okul ağı dağıtımı (Adım 49) ve kurum kullanımı ayrı yazılı izin metniyle verilir.

### Bağımlılık uyumu (12 Eki 2026)

`npx license-checker --production --summary`: MIT 10 · ISC 1 · Apache-2.0 1 · 0BSD 1 · UNLICENSED 1 (projenin kendisi). Tümü tescilli dağıtımla uyumlu izin verici lisanslar; copyleft çalışma zamanı bağımlılığı yok. Piper (GPL-3.0) yalnız geliştirme aracı, çıktıya geçmez. Andika SIL OFL 1.1: yazı tipi ayrı dosya olarak dağıtılır, uyumlu.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `LICENSE` (yeni), LICENSES.md, README, Kaynaklar ekranı.
- Test / kanıt: lisans envanteri (K10) LICENSE dosyasını görür.

## Gizlilik etkisi

Yok. Not: kapalı lisans, gizlilik iddiasının üçüncü taraflarca bağımsız denetimini açık kaynak kadar kolaylaştırmaz; depo herkese açık kaldığı sürece kaynak yine incelenebilir.

## Lisans ve üçüncü taraf etkisi

Üçüncü taraf lisanslarla (Andika OFL, bağımlılıklar) uyumlu olmalı; K10 bunu denetler.

## Geri dönüş maliyeti

Seçenek 1 veya 2 sonrası yüksek (verilen lisans geri alınamaz); 4 düşük.

## Kabul koşulları

- [x] Kullanıcı lisans türünü seçti (12 Eki 2026).
- [x] `LICENSE` ve `CONTENT-LICENSE` eklendi (Adım 20).
