# Rakam glifleri — öğretmen görüş formu (plan v2 Adım 30)

> **Durum:** ⚠ Kod hazır, öğretmen formları bekleniyor (13 Ekim 2026). Form şimdilik **boş**.
> Path verisi: `src/ui/svg/rakamGlifleri.ts` (`RAKAM_GLIFLERI`, tek kaynak). Path'ler öğretmen görüşü
> gelmeden değiştirilmez.

## Amaç

Uygulamadaki 0–9 rakam gliflerinin **MEB dik temel harf** formuna uygunluğu iki 1. sınıf öğretmenine sorulur.
Kâğıt çalışma sayfası (Adım 35) basılmadan önce kapanır.

- Yazdırılabilir form: `npm run glif:formu -- --cikti <dosya.pdf>` (A4; gerçek `RAKAM_GLIFLERI` verisinden çizer,
  her öğretmen için ayrı sayfa takımı). Geliştirmede ekranda: `vite dev` → `?gelistirme=glif`.
- Planın hedef formu (PLAN §3.4): **kancalı 1**, **çizgisiz 7**.
- MEB dik temel harf kılavuzunun rakam formlarını içeren güncel resmî belgesi doğrulanmamıştır;
  öğretmenlerden kaynak (belge adı/yılı) istenir.

## Gizlilik

Görüşme kişisel veri toplamaz; form yalnız görüş içerir. Öğretmenin **adı yalnız yazılı izniyle** yazılır
(formdaki "adımın yazılmasına izin veriyorum" kutusu); aksi hâlde yalnız unvan. Okul adı yazılmaz
(okul türü isteğe bağlı). İmzalı kâğıt formlar depoya taranıp eklenmez; yalnız sonuç bu tabloya işlenir.

## Öğretmenler

| | Öğretmen 1 | Öğretmen 2 |
|---|---|---|
| Unvan | | |
| Ad (yalnız izinle) | | |
| Okul türü (isteğe bağlı) | | |
| Görüşme tarihi | | |
| Gösterdiği kaynak (MEB kılavuzu vb.) | | |

## Görüşler

Her rakam için bir kutu işaretlenir; "Küçük düzeltme" veya "Yanlış" ise not zorunludur.

| Rakam | Öğretmen 1 | Not 1 | Öğretmen 2 | Not 2 |
|---|---|---|---|---|
| 0 | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | |
| 1 | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | |
| 2 | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | |
| 3 | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | |
| 4 | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | |
| 5 | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | |
| 6 | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | |
| 7 | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | |
| 8 | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | |
| 9 | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | | ☐ Uygun ☐ Küçük düzeltme ☐ Yanlış | |

## Sonuç ve karar

- "Yanlış" işaretli glif sayısı: — (Bitti tanımı: 0)
- Görüş ayrılığı: MEB kılavuzu metni belirleyicidir; ayrılık buraya yazılır.
- Yapılacak path düzeltmeleri (rakam → değişiklik): —
- Düzeltme PR'ı / commit: —
