# Rakam glifleri — öğretmen görüş formu (plan v2 Adım 30)

> **Durum (16 Ekim 2026, KG-95):** Rakamlar artık MEB'in Türkiye Yüzyılı Maarif Modeli (2024) için
> "ders kitapları ve eğitim araçlarında kullanılması amacıyla" yayımladığı resmî temel yazı fontu
> **TemelYazi**'den (HBY Tasarım) alınır — [MEB TTKB duyurusu](https://ttkb.meb.gov.tr/www/ilkokulturkcedersiogretimprogramiveilkokumayazmaderskitabindayeralanalfabeverakamlaryayimlandi/icerik/610).
> Bu form artık **isteğe bağlı teyit**tir (sınıfta öğretilen biçim ve yazım yönü). Form şimdilik **boş**.
> Path verisi: `src/ui/svg/rakamGlifleri.ts` (`RAKAM_GLIFLERI`, tek kaynak; `scripts/rakam-glif-uret.py` üretir).

## Amaç

Uygulamadaki 0–9 rakamlarının (MEB TemelYazi) ve MEB yazım yönünün sınıfta öğretilen biçimle aynı olduğu iki 1. sınıf
öğretmenine sorulur (isteğe bağlı).

- Yazdırılabilir form: `npm run glif:formu -- --cikti <dosya.pdf>` (A4; gerçek `RAKAM_GLIFLERI` verisinden çizer,
  her öğretmen için ayrı sayfa takımı). Geliştirmede ekranda: `vite dev` → `?gelistirme=glif`.
- MEB formu (PLAN §3.4): **bayraklı, tabansız 1**, **açık üstlü 4**, **ortası çizgili 7**. (Eski "çizgisiz 7"
  varsayımı yanlıştı; KG-95.)
- Yazım yönü: MEB TemelYazi-Kilavuz fontundaki numaralı oklar (4, 5 ve 7 iki hamle).

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
