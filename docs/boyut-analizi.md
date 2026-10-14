# K5 boyut bütçesi — analiz ve düzeltme (plan v2 KG-87, 14 Eki 2026)

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

## Sonra: 809,5 KB (~828 900 B) — bütçe içinde (K5 ✓)

Kalan büyükler: react-dom 174, dexie 93, motion-dom 59, framer-motion 16, qrcode 20 (tembel), uygulama ~400.
Pay ~6 KB; sonraki büyük adımlar gerekirse: dexie yerine ince IndexedDB sarmalayıcı (ADR gerektirir),
`BoardHarness`'ın yalnız `?harness=1` ile tembel yüklenmesi (~4 KB).
