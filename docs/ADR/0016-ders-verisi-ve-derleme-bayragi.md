# ADR-0016: Ders verisi JS dışında, derleme bayrağı ve ayrı veri bütçesi

- **Durum:** Kabul
- **Tarih:** 2026-10-30
- **Karar sahibi:** Kullanıcı (Okuma Yazma planı K-2) + geliştirici · **Kullanıcı onayı:** 30 Eki 2026 19:00 — plan v2 KG-133 ("onaylıyorum başla")
- **İlgili:** ADR-0011 (çok ders mimarisi), Okuma Yazma planı §2.4.1–2.4.2, Adım 60, 61, 73, 78; K5 boyut bütçesi (`scripts/boyut-butcesi.ts`)

## Bağlam

ADR-0011 tek uygulama + ders paketi kararını verdi; ikinci ders (Türkçe ilk okuma yazma) artık geliştiriliyor (KG-133).
Matematikte içerik JSON'u derleme zamanında zod ile doğrulanıp modüle gömülüyor (KG-87) ve ses manifesti JS'te
(`audioManifest.generated.ts`, klip başına ~60 B). Bu desen Türkçede ölçeklenmez: ~2.000 klip (90–150 KB manifest),
yüzlerce görsel (`Sprite.tsx` deseniyle nesne başına ~1,5 KB TSX → ~375 KB) ve 80–120 KB içerik JSON'u, JS toplamı
835 374 B olan K5 bütçesini birkaç kat aşar. K5'in amacı ayrıştırma ve çalıştırma maliyetini sınırlamaktır; veri
ayrıştırılmaz, önbelleğe alınır. Ayrıca Y9 gereği Türkçe, matematik kanıtı (53c) bitmeden genel yayına çıkmaz; geliştirme
üretim paketini etkilememelidir.

## Seçenekler

1. **Ders verisi JS dışında + derleme bayrağı + ayrı veri bütçesi** — içerik JSON'u, statik SVG'ler, ses ve ses manifesti
   ders başına veri varlığıdır (CI'da doğrulanır, çalışma anında aynı kökenden okunur, grup bazlı önbelleğe alınır); Türkçe
   kod `VITE_DERS_TUR` derleme bayrağı arkasında. Artı: K5 anlamını korur; bayrak kapalıyken üretim paketi bayt bayt aynı;
   precache çekirdekle sınırlı. Eksi: `SpeechKey` tür güvenliği yerine CI kuralı (her öğenin klibi var mı); çalışma anında
   veri yükleme ve hata durumu.
2. **Veri JS'e gömülür, K5 yükseltilir** — matematikle aynı desen. Artı: tek desen, tür güvenliği. Eksi: Türkçe yayın için
   toplam sınır en az +600 KB; ilk yük ve ayrıştırma büyür; binlerce anahtarlık birleşim türü `tsc`'yi yavaşlatır.
3. **Türkçe ayrı uygulama** — ADR-0011 ile çelişir; motor çoğalır.

## Karar

**Seçenek 1** (kullanıcı kararı K-2, 30 Eki 2026). Kurallar:

- `VITE_DERS_TUR` **derleme zamanı** bayrağıdır; varsayılan kapalı. Kapalıyken `import.meta.env` değiştirme ve ölü kod
  ayıklamayla Türkçe kod ve verisi `dist/`'e girmez; CI bunu bir imleç dizgesiyle denetler (e2e kancası denetimi gibi).
- Türkçe kod tek dinamik `import()` arkasındadır; matematik kullanıcısının ilk yükü değişmez.
- Ders verisi depoda `ders-verisi/<ders>/` altında durur (`public/` değil — `public/` her derlemeye ve precache'e kopyalanır);
  bayrak açık derlemede `dist/<ders>/` altına kopyalanır, geliştirme sunucusu aynı yoldan sunar.
- **Ayrı veri bütçesi** (`docs/ders-veri-butcesi.json`, `npm run boyut:ders`): çekirdek precache ≤ 1 MB (ünlüler, yönergeler,
  hamle verisi), harf grubu başına ≤ 6 MB, Türkçe tembel JS ≤ 120 KB. **Yayına kadar yalnız rapor**; Adım 73'te sert hata olur.
  K5 (`npm run boyut`) yalnız JS kodunu ölçmeye devam eder; 0.3.0'dan itibaren sert hata (mevcut kural).
- İçerik ve doğrulayıcı kuralları `docs/mufredat-kisitlari-turkce.md`'dedir; doğrulayıcı `scripts/` ve test tarafında koşar,
  zod üretim paketine girmez.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `src/content/dersler/` (kayıt defteri, bayrak), `ders-verisi/tur/`, `vite.config.ts`
  (veri kopyalama eklentisi), `scripts/ders-veri-butcesi.ts`, `.github/workflows/ci.yml`, `src/env.d.ts`; PLAN §14 Adım 61.
- Test / kanıt: `tests/unit/dersPaketi.spec.ts` (bayrak varsayılan kapalı, Türkçe modül yalnız dinamik içe aktarımla,
  veri `public/` altında değil); CI "Türkçe kod üretimde yok" adımı; bayrak açık derleme ve veri bütçesi raporu; üretim JS
  toplamı Adım 60–62 boyunca değişmez.

## Gizlilik etkisi

Yok. Veri aynı kökenden okunur (CSP `connect-src 'self'` değişmez); yeni depolama anahtarı yok. Çalışma anı önbelleği yalnız
statik ders verisidir, öğrenci verisi değildir. K9 taramasında Türkçe veri yükleyicisinin `fetch`'i yalnız aynı kökenli
göreli kök (`TUR_VERI_KOKU`) ile izinlidir.

## Lisans ve üçüncü taraf etkisi

Yeni bağımlılık yok. Ders verisi özgündür (tüm hakları saklı, ADR-0013); MEB/TDK/TEGM içerikleri yalnız referans. Sıklık
verisi (CC BY-SA) depoya girmez (K-4). TemelYazi kullanımı ayrıca yazılı izne bağlanmıştır (K-1; genel yayın izne bağlı).

## Geri dönüş maliyeti

Düşük–orta. Bayrak kapalı olduğu sürece üretim etkilenmez; Seçenek 2'ye dönmek veri dosyalarını derleme zamanında modüle
gömmek ve K5 tabanını yükseltmek demektir.

## Kabul koşulları

- [x] Kullanıcı K-2'yi onayladı (30 Eki 2026, KG-133).
- [ ] Bayrak ve veri iskeleti uygulandı, CI denetimi yeşil (Adım 61).
- [ ] Yayın öncesi veri bütçesi sert hataya çevrildi (Adım 73).
