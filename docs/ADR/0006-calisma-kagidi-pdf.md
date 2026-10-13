# ADR-0006: Çalışma kâğıdı: HTML ve yazdırma

- **Durum:** Kabul
- **Tarih:** 2026-10-13
- **Karar sahibi:** Geliştirici · **Kullanıcı onayı:** Gerekmez
- **İlgili:** Adım 35, 48

## Bağlam

Öğretmenler yazdırılabilir çalışma kâğıdı ve cevap anahtarı istiyor. Çalışma anında PDF kütüphanesi paket boyutunu büyütür ve yeni lisans getirir.

## Seçenekler

1. **HTML + SVG + yazdırma CSS'i (`window.print`)** — bağımlılık yok, tarayıcı "PDF olarak kaydet" ile çevrimdışı PDF üretir.
2. **Çalışma anında PDF kütüphanesi (jsPDF, pdfmake)** — tam düzen kontrolü; paket büyür, Türkçe font gömmek gerekir, SVG rasterleşir, lisans envanteri büyür.
3. **Derleme anında üretilmiş statik PDF'ler** — SEO için iyi (Adım 48), kişiselleştirme yok.

## Karar

**Seçenek 1 (ekranda) + 3 (arşiv)**, Adım 35'te uygulandı. Çalışma anında PDF kütüphanesi YOK: kâğıt, ekran önizlemesiyle aynı React bileşeninden (`KagitSayfalari`) HTML+SVG olarak çizilir; "Yazdır" tarayıcının yazdırma diyaloğunu açar (`@page { size: A4; margin: 12mm }`, `@media print` kabuğu gizler, yazdırma kopyası `<body>` altında ayrı bir kapta). Statik PDF arşivi derleme anında Playwright `page.pdf` ile Adım 48'de üretilir. Reddedilen: jsPDF/pdfmake (boyut, Türkçe font, SVG rasterleşmesi). Kâğıt hiçbir yerde saklanmaz; `OK-<setKodu>-<madde>-<düzen>-<d|y>` koduyla yeniden üretilir.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `src/ogretmen/calismaKagidi/` (yeni), `src/ui/screens/CalismaKagidi.tsx` ve `src/ui/print/` (yeni), `SetHazirla`, `VeliPaneli`, `appStore` (`calismaKagidi` ekranı, `kagitSeti`).
- Test / kanıt: `tests/unit/calismaKagidi.spec.ts`; e2e `calisma-kagidi.spec.ts` (`page.pdf` sayfa sayısı, yazdırma ortamı görsel tabanı, kutu ölçüleri).

## Gizlilik etkisi

Kâğıt tohum + içerik kodundan üretilir; öğrenci adı alanı boş bırakılır (üstte yazılı "Adım: ________" satırı), uygulama ad istemez. Üretim yerel, depolama ve ağ yok (birim casus + e2e).

## Lisans ve üçüncü taraf etkisi

Yeni bağımlılık yok. Banknotlar şematik (ADR-0014, KG-19).

## Geri dönüş maliyeti

Düşük.

## Kabul koşulları

- [x] Seçenek seçildi.
- [x] Tahta ve A4 düzeni denendi (e2e: 1920×1080 ayar ekranı geometrisi, A4 yazdırma görüntüsü).
