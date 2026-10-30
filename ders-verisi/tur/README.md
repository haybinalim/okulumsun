# Türkçe ders verisi (ADR-0016)

Bu klasör Türkçe ilk okuma yazma paketinin **JS dışı verisidir**: içerik JSON'ları, ileride statik SVG görseller ve ses
manifesti. `public/` altında değildir; yalnız `VITE_DERS_TUR=1` derlemesinde `dist/tur/` altına kopyalanır
(`scripts/yayin/dersVerisi.ts`) ve uygulama tarafından aynı kökenden okunur (`src/content/dersler/tur/veriYukleyici.ts`).
Üretim derlemesine girmez.

- `manifest.json`: program sürümü, çekirdek dosyalar (önceden önbelleğe alınacaklar) ve harf grubu başına dosyalar.
- Boyut: `npm run boyut:ders` (`docs/ders-veri-butcesi.json`; çekirdek ≤ 1 MB, grup başına ≤ 6 MB). Yayına kadar yalnız rapor.
- Kurallar: [`docs/mufredat-kisitlari-turkce.md`](../../docs/mufredat-kisitlari-turkce.md). Doğrulama `npm run validate`.
- İçerik özgündür (tüm hakları saklı). Öğretmen teyidi bekleyen taslaklar depoya girmez; proje çalışma alanında kalır.
- Sıklık listeleri ve TDK/MEB/TEGM içerikleri buraya konmaz.
