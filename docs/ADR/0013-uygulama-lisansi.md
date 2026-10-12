# ADR-0013: Uygulama lisansı

- **Durum:** Önerildi
- **Tarih:** 2026-10-12
- **Karar sahibi:** Kullanıcı · **Kullanıcı onayı:** Bekliyor (§16 K-3, son tarih 22 Eki 2026)
- **İlgili:** Adım 20, 49, 56, KG-17

## Bağlam

Depo şimdilik herkese açık (KG-17, startup programı başvuruları için). LICENSE dosyası yok; bu durumda varsayılan "tüm hakları saklı"dır. Ürünün ileride ücretli satılması düşünülüyor (KG-06).

## Seçenekler

1. **AGPL-3.0 (kod) + CC BY-SA 4.0 (içerik)** — açık kaynak; rakip kapalı ürünler kodu alamaz, ama ticari satış zorlaşır.
2. **MIT (kod) + CC BY 4.0 (içerik)** — en serbest; ticari rakipler kopyalayabilir.
3. **Kaynağı görünür, ticari kullanım yok** (ör. PolyForm Noncommercial) — açık kaynak sayılmaz.
4. **Tüm hakları saklı** — açık LICENSE ile ticari niyet korunur; okul ağı dağıtımı (Adım 49) izin metni ister.

## Karar

Önerilen: **Seçenek 4, tüm hakları saklı** — ticari niyet nedeniyle en az geri dönüşü olmayan seçenek. Açık lisans sonra her zaman verilebilir, geri alınamaz.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `LICENSE` (yeni), LICENSES.md, README, Kaynaklar ekranı.
- Test / kanıt: lisans envanteri (K10) LICENSE dosyasını görür.

## Gizlilik etkisi

Yok.

## Lisans ve üçüncü taraf etkisi

Üçüncü taraf lisanslarla (Andika OFL, bağımlılıklar) uyumlu olmalı; K10 bunu denetler.

## Geri dönüş maliyeti

Seçenek 1 veya 2 sonrası yüksek (verilen lisans geri alınamaz); 4 düşük.

## Kabul koşulları

- [ ] Kullanıcı lisans türünü seçti.
- [ ] `LICENSE` eklendi (Adım 20).
