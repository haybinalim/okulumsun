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
- `icerik/sozcukler.json` (Adım 69): şablonların sözcük havuzu — 1.–2. grup sözcük listesi taslağının 125 sözcüğü
  (kimlik, metin, giriş harfi, varsa görsel kimliği). Görsel ve hamle verisindeki gibi teyit gelmeden depoya girdi
  (kullanıcı kararı 1 Kasım 2026, KG-145: liste depoda `teyit: bekliyor` istisnasıyla kalır; geliştirme ve pilot
  önizlemesi kullanır, **genel yayın iki öğretmen teyidine bağlıdır**):
  dosya `teyit: { durum: "bekliyor" }` taşır, hiçbir sözcükte `anlamTeyidi` yok; `npm run validate -- --yayin` hem
  dosya teyidini hem D-14'ü (iki öğretmen) hata sayar. Hece listesi depoya girmez: şablonlar heceyi sözcükten
  heceler (bağlamsız hece yok, D-05).
- `icerik/metinler.json` (Adım 80): seviyeli okuma metinleri ve anlama soruları — 2.–5. grupta yedişer, toplam 28 kısa metin (82 cümle, 52 soru; resim cevaplı 11, sözcük cevaplı 41). Her metin yalnız o ana dek öğretilmiş harflerle yazılmıştır; "Metni oku" ekranı (tahta, sözcük sözcük vurgu, "Dinle") ve **T-13** Metni oku, soruyu cevapla bunu kullanır. Cümle havuzundaki istisnayla (KG-155) teyit gelmeden depoya girdi: dosya `teyit: { durum: "bekliyor" }` ve her metin `teyit: bekliyor` taşır; `npm run validate -- --yayin` hata sayar (genel yayın iki öğretmen teyidine bağlıdır). Doğrulama D-27 (cümle kuralları cümle havuzuyla ortak kod yolundan). **Elle düzenlenir** (etiketler `npm run validate` ile denetlenir); metin cümlelerinin klipleri (`tur.cumle.<metin>s<no>`) `npm run tur:klip` ile manifeste girer (durum `eksik`, ses `npm run audio` ile sonra).
- `ses/klipler.json` (Adım 69): şablonların isteyebileceği bütün klip kimlikleri ve metinleri (yönerge, geri bildirim,
  sözcük, sözcükten gelen hece). **Elle düzenlenmez:** `npm run tur:klip` üretir. Ses dosyaları `ses/<tür>/<ad>.m4a` (`tur.sozcuk.kale` → `sozcuk/kale.m4a`)
  olarak `npm run audio -- --ders tur` ile üretilir (Puck, hız 0,9; matematikle aynı defter ve artımlı plan, özetler
  `ses/.hashes.json`, bkz. `docs/ses/SES_KAYNAKLARI.md` §14). Dosyası olan klip `durum: "var"` + `dosya` taşır
  (diskten türetilir); olmayan `eksik`. Arayüz ses çalıcısı henüz bağlı değil: "Ses yok" gösterir. `--yayin` eksik
  klipte kırmızıdır. Tek ünsüz klibi yok (D-11); üretim betiği de reddeder.
  Üretilen klip ölçülür (süre, ses seviyesi); geçmeyen "Ka." biçimiyle yeniden denenir, yine geçmezse dosya yazılmaz
  ve klip `eksik` kalır. `ses/reddedilen.json` kulakla reddedilen klipleri tutar (üretilmez, durum `eksik`, yayına girmez);
  bkz. `docs/ses/SES_KAYNAKLARI.md` §14.
  **Resimli sözcük kuralı:** `gorselId` taşıyan her havuz sözcüğünün klibi `durum: "var"` olmalıdır
  (`tests/unit/turGorsel.spec.ts`; şablonlar klip durumunu bilmez). "ok" klibi kulakla reddedildi (`eksik`), bu yüzden
  `sozcukler.json`'da "ok"ta `gorselId` yoktur; görsel dosyası (`gorseller/ok.svg`) ve `gorseller/grup-2.json` kataloğu
  durur. "ok" klibi üretilip `var` olunca `"gorselId": "ok"` geri eklenir.
- `veli-karti.json` (Adım 71): eve link ekranında ve eve giden bağlantının açılışında veliye gösterilen kısa metin
  (ses esaslı çalışma, harf adı yerine ses, ünsüzü tek başına söyletmeme, kalem tutuşu, sol el, kısa ve süresiz).
  Katı ayrıştırıcı `src/content/dersler/tur/veliKarti.ts` (altı madde birer kez). Taslak: `teyit: { durum: "bekliyor" }`,
  arayüz "Taslak: öğretmen onayı bekliyor" yazar; `npm run validate -- --yayin` onaysız kartı hata sayar.
- Boyut: `npm run boyut:ders` (`docs/ders-veri-butcesi.json`; çekirdek ≤ 1 MB, grup başına ≤ 6 MB). Yayına kadar yalnız rapor.
- Kurallar: [`docs/mufredat-kisitlari-turkce.md`](../../docs/mufredat-kisitlari-turkce.md). Doğrulama `npm run validate`.
- İçerik özgündür (tüm hakları saklı). Öğretmen teyidi bekleyen taslaklar (öğretmen formları, açık sorular, hece
  tablosu) depoya girmez; proje çalışma alanında kalır. İstisnalar yukarıda, `teyit: bekliyor` ile: hamle verisi,
  görseller ve şablon sözcük havuzu.
- Sıklık listeleri ve TDK/MEB/TEGM içerikleri buraya konmaz.
