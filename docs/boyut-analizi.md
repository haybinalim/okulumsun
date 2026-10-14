# K5 boyut bütçesi — analiz ve düzeltme (plan v2 KG-87, KG-89; 14 Eki 2026)

Bütçe: `docs/boyut-butcesi.json` tabanı 759 431 B (12 Eki 2026, tek parça), tolerans %10 → **835 374 B**.
Ölçüm `npm run build && npm run boyut` (`dist/assets/*.js` toplamı; tembel parçalar dahil). Bu yüzden
yalnız kod bölmek toplamı düşürmez; düşüş paketten çıkan koddan gelmeli.

## Önce (main e358dcb): 929,7 KB (952 0xx B) — uyarı

Kaynak haritasıyla modül başına küçültülmüş bayt (`vite build --sourcemap`, yaklaşık):

| Kaynak | KB | Not |
|---|---:|---|
| react-dom | 174 | zorunlu |
| dexie | 93 | yerel depolama (ADR-0005 izin listesi); kaldırmak davranış riski |
| motion-dom + framer-motion | 120 | 15 ekranda yalnız `motion.div/span/button/output` + `AnimatePresence` |
| zod | 69 | yalnız içerik JSON'larını açılışta ayrıştırmak için |
| qrcode-generator | 20 | zaten tembel (Eve gönder) |
| uygulama kodu + içerik JSON | ~400 | — |

## Yapılanlar (davranış aynı)

1. **zod üretim paketinden çıktı (−77 KB).** `skills.json`, `kazanimlar.json`, `planDuzeltmeleri.json`,
   `evIpuclari.json` artık `scripts/yayin/icerikDogrulama.ts` Vite eklentisiyle modül yüklenirken Node'da aynı
   zod ayrıştırıcılarından geçer; modüle ayrıştırılmış veri (varsayılanlar dolu) gelir. Bozuk veri derlemeyi
   ve geliştirme sunucusunu kırar (eskiden uygulama açılışta hata verirdi). `skillsData`, `evIpuclari`,
   `yillikPlan` şemaları yalnız tür olarak içe aktarır. `tests/unit/icerikDogrulama.spec.ts` eşitliği,
   bozuk veride hatayı ve uygulama kodunda zod/şema değeri içe aktarılmadığını denetler.
2. **framer-motion: `LazyMotion` + `m` + `domAnimation` (−43 KB).** Kullanılan özellikler (initial/animate/
   exit/transition, AnimatePresence) `domAnimation` içinde; `strict` ile `motion` kullanımı çalışma anında hata
   verir, birim test de kaynakta yakalar.

## Sonra: 813,5 KB (833 008 B, TapCountScreen düzeni PR #69 dahil) — bütçe içinde (K5 ✓)

Kalan büyükler: react-dom 174, dexie 93, motion-dom 59, framer-motion 16, qrcode 20 (tembel), uygulama ~400.
Pay ~2,3 KB (bir sonraki özellik bütçeyi yeniden aşabilirdi).


## Dexie → kendi IndexedDB sarmalayıcısı (ADR-0015 Kabul, Seçenek 3, KG-89, 14 Eki 2026)

`src/persistence/db.ts` Dexie sınıfı yerine ham IndexedDB üzerinde `Tablo` sarmalayıcısı (aynı ad `okulumsun`,
IndexedDB sürümü 10, aynı 5 depo/anahtar/indeks; Dexie yalnız `devDependencies`'te, uyum testi için).
Bütçe tanımı değişmedi (taban 759 431 B + %10 = 835 374 B, `dist/assets/*.js` toplamı).

| Ölçüm | Toplam (B) | Toplam gz | İlk yük (B) | İlk yük gz | K5 payı (B) |
|---|---:|---:|---:|---:|---:|
| Önce (`main` 2b4b461 = 21e9453 kodu) | 833 147 | 262 063 | 699 526 | 213 255 | 2 227 |
| Sonra (bu değişiklik) | **740 264** | 231 454 | 606 643 | 182 646 | **95 110** |
| Fark | −92 883 | −30 609 | −92 883 | −30 609 | — |

ADR denemesindeki 739 457 B'tan +807 B fark: blocked/versionchange/onclose, açılış hatasını önbelleğe almama ve
işlem iptali işleme kodu. ADR kabul ölçütü (toplam ≤ 745 000 B) karşılandı. gz = `gzip -9`, bilgi amaçlı.

Kalan büyükler: react-dom 174, motion-dom 59, framer-motion 16, qrcode 20 (tembel), uygulama ~400. Sonraki aday
gerekirse: `BoardHarness`'ın yalnız `?harness=1` ile tembel yüklenmesi (~4 KB).
