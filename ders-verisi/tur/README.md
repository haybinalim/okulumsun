# Türkçe ders verisi (ADR-0016)

Bu klasör Türkçe ilk okuma yazma paketinin **JS dışı verisidir**: içerik JSON'ları, ileride statik SVG görseller ve ses
manifesti. `public/` altında değildir; yalnız `VITE_DERS_TUR=1` derlemesinde `dist/tur/` altına kopyalanır
(`scripts/yayin/dersVerisi.ts`) ve uygulama tarafından aynı kökenden okunur (`src/content/dersler/tur/veriYukleyici.ts`).
Üretim derlemesine girmez.

- `manifest.json`: program sürümü, çekirdek dosyalar (önceden önbelleğe alınacaklar) ve harf grubu başına dosyalar.
- `hamleler.json` (Adım 63): 68 glifin (29 küçük, 29 büyük harf, 10 rakam) numaralı yazılış hamleleri — kendi orta
  çizgimiz, 0–100 satır dizgesinde. **Elle düzenlenmez:** `npm run tur:hamle` (`scripts/tur/hamle-verisi.ts`) üretir.
  Hamle sayısı/sıra/yön öğretmen teyit tablosu taslağından (`src/content/dersler/tur/hamleTablosu.ts`); font konturu
  kopyalanmadı. Kullanıcı kararıyla (31 Ekim 2026) teyit gelmeden depoya girdi ve her glif `teyit: bekliyor` taşır;
  `npm run validate -- --yayin` teyitsiz glifi hata sayar (yayın kapısı).
- `gorseller/` (Adım 68): resimli sözcüklerin statik SVG görselleri (`<id>.svg`, 100×100, ≤ 6 KB) ve harf grubu başına
  dizin (`grup-<n>.json`: sözcük, taslak no, açıklama, tanınırlık riski, bayt, `teyit`). Kodla çizilmiş özgün SVG
  (KG-104; maske, metin, dış kaynak yok; palet matematik nesneleriyle aynı). **Elle düzenlenmez:** `npm run tur:gorsel`
  (`scripts/tur/gorsel-uret.tsx`) üretir ve `manifest.json` → `gruplar` listesini günceller (grup açılınca önbelleğe
  alınacak dosyalar). Sözcük listesi iki öğretmen teyidini beklediği için her görsel `teyit: bekliyor`; yalnız sözcük
  ve görsel kimliği depoya girer, taslak liste girmez. Denetim: D-25 (`npm run validate`).
- Boyut: `npm run boyut:ders` (`docs/ders-veri-butcesi.json`; çekirdek ≤ 1 MB, grup başına ≤ 6 MB). Yayına kadar yalnız rapor.
- Kurallar: [`docs/mufredat-kisitlari-turkce.md`](../../docs/mufredat-kisitlari-turkce.md). Doğrulama `npm run validate`.
- İçerik özgündür (tüm hakları saklı). Öğretmen teyidi bekleyen sözcük/hece taslakları depoya girmez; proje çalışma
  alanında kalır (hamle verisi istisnası yukarıda, `teyit: bekliyor` ile).
- Sıklık listeleri ve TDK/MEB/TEGM içerikleri buraya konmaz.
