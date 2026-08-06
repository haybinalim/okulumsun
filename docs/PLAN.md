# okulumsun — 1. Sınıf Matematik Öğrenme Uygulaması

## Context

**Problem.** 1. sınıf öğrencileri konuları farklı hızlarda öğreniyor. Geride kalan öğrenci eksiğini kapatacak hedefli tekrar bulamıyor; öğretmenin 30 çocuğa ayrı ayrı yetişmesi mümkün değil. Veli de çocuğun tam olarak nerede takıldığını bilmiyor.

**Çözüm.** Öğrencinin hangi kazanımda zayıf olduğunu ölçen, o kazanıma hedefli alıştırma veren, takıldığında adım adım yardım eden ve öğrendiğini unutmadan tekrarlatan bir uygulama. "İsviçre çakısı" hedefi burada: tek uygulamada eksik tespiti + pekiştirme + yeni kazanım öğretimi + anlık yardım.

**Kapsam.** MEB 2024 Türkiye Yüzyılı Maarif Modeli **1. Sınıf Matematik** — 19 öğrenme çıktısının tamamı. Sadece öğrenci kullanır; hesap/giriş yok, veri cihazda. Web + PWA, tamamen çevrimdışı. Yapay zeka yalnızca geliştirme anında içerik üretiminde.

**Cihaz önceliği.** 1) Okuldaki akıllı tahta, 2) tablet, 3) telefon. ⚠️ Akıllı tahta erişimi ~1 ay yok — bu, doğrulama stratejisini değiştiriyor (bkz. §13).

### Tasarımı yöneten dört kısıt

1. **Çocuk okuma yazma bilmiyor.** Yıl başında hiç, yıl sonunda kısmen. Metin hiçbir zaman tek taşıyıcı olamaz. Ses altyapısı arayüzden **önce** yazılır.
2. **Birincil cihaz akıllı tahta.** 16:9 yatay, çok büyük ölçek, çocuk ayakta ve kolu kısa. Ama **1 ay fiziksel test yok** → tahta katmanı yazılımsal olarak simüle edilip otomatik testle korunur, elle doğrulama 2. aya ertelenir.
3. **Sunucu yok.** Çalışma anında yapay zeka çağrısı yok → uygulama tamamen statik. Okul internetine bağımlı değil, USB'den bile açılır.
4. **Tek geliştirici.** Monorepo, CMS, state machine kütüphanesi, mikroservis — hepsi reddedildi.

### Kapsam kararının gerekçesi

Üç dersten (Türkçe, Matematik, Hayat Bilgisi) tek derse indirildi. Matematik seçilmesinin nedeni:

- **Görsel varlık maliyeti neredeyse sıfır.** Matematik görsellerinin ~%90'ı programatik SVG (§8). Türkçe ve Hayat Bilgisi özel illüstrasyon gerektirir — projenin en yavaş ve en pahalı kalemi.
- **Doğrulama kesin.** Cevap doğru/yanlış net; pedagojik belirsizlik yok. Bir sayma uygulamasında "7 elma her zaman 7 elmadır" garanti edilebilir.
- **Türkçe'yi yarım yapmak zararlıdır.** Ses-harf eşleştirmede yanlış telaffuz, düzeltmesi zor biçimde öğrenmeyi bozar.

Motor, içerik ve arayüz altyapısı ders-bağımsız tasarlanıyor; diğer dersler sonradan **veri ekleyerek** geliyor, kod yeniden yazılmadan.

---

## 0. Uygulayıcı Kılavuzu — planı koda çeviren herkes için

Bu belge **normatiftir** ve farklı yapay zeka modelleri farklı oturumlarda kod yazacağı
varsayımıyla yazılmıştır. Oturumlar arasında hafıza **yoktur**; bağlam yalnız bu repodur.

1. **Tek gerçek kaynaklar ve öncelik sırası.** Çelişki görürsen şu sıra geçerli:
   `docs/mufredat-kisitlari.md` (müfredat sınırları — ihlal edilemez)
   → `src/content/skills.json` (beceri düğümleri + şablon eşlemesi)
   → `src/exercises/types.ts` (veri modeli sözleşmesi)
   → bu plan → diğer her şey.
   Plan ile kod çelişiyorsa **sessizce sapma; planı düzelt ve düzeltmeyi commit'e yaz.**
2. **Anahtar kelimeler.** ZORUNLU = yapılmadan adım kapanamaz. YASAK = hiçbir koşulda
   yapılmaz. Tablolardaki sayısal değerler (px, %, gün, oran, ms) keyfî değildir;
   değiştirmek için önce bu planda gerekçeli değişiklik yap.
3. **Çalışmaya başlamadan önce** §14'teki ilgili adımın "Bitti tanımı"nı ve dokunacağın
   dosyaların baş yorum bloklarını oku — her dosya kendi gerekçesini taşır.
4. **Her değişiklikte doğrulama zinciri:** `npm run lint && npm test && npm run validate
   && npm run build`. Şablon veya ekran eklerken ayrıca `npm run e2e` (tahta geometrisi).
   Bunlardan biri kırıkken adım "bitti" **sayılamaz**.
5. **Yasaklar (özet — gerekçeleri ilgili bölümlerde):** `Math.random()` (§5.3) ·
   sürükle-bırak (§3.2) · kırmızı renk / `X` / buzzer / "yanlış" kelimesi (§7.1) ·
   çalışma anında yapay zeka çağrısı (Context) · `<` `>` karşılaştırma sembolleri,
   saat okuma, çarpma/bölme/kesir (mufredat-kisitlari §3) · TÜMÜ BÜYÜK HARF ve
   `toLocaleUpperCase('tr')` dışı büyütme (§3.4) · Lucide/Phosphor ikonları (§8) ·
   OpenMoji (§8 lisans) · sonucu 20'yi aşan işlem.
6. **Dil.** Kod yorumları, commit mesajları ve kullanıcıya görünen tüm metin Türkçe.
7. **Yeni şablon eklerken sıra:** `skills.json`'da düğüm/şablon zaten tanımlı →
   gerekli ses anahtarlarını `tr.json`'a ekle (§4.5) → jeneratörü `src/exercises/templates/`
   altına yaz (mevcut 4 şablonun dosya düzenini kopyala) → property-based test ekle →
   `validate-content.ts`'te "uygulandı" listesine geçir → ekranda oynat, e2e geçir.

---

## 1. Müfredat — Doğrulanmış Resmî Kaynak

Kaynak: **MEB, [TYMM] İLKOKUL MATEMATİK DERSİ (1-4) ÖĞRETİM PROGRAMI, 2024** — `mufredat.meb.gov.tr/ProgramDetay.aspx?PID=1972`, 160 sayfa. PDF indirildi ve metni çıkarılıp doğrulandı.

**1. Sınıf: 19 öğrenme çıktısı, 180 ders saati, 7 tema.** Temalar programdaki **öğretim sırasıyla**:

| # | Tema | Çıktı | Saat | % |
|---|---|---|---|---|
| 1 | Nesnelerin Geometrisi (1) | 2 | 15 | 8 |
| 2 | Sayılar ve Nicelikler (1) | 7 | 57 | 31 |
| 3 | Sayılar ve Nicelikler (2) | 1 | 18 | 10 |
| 4 | İşlemlerden Cebirsel Düşünmeye | 4 | 50 | 28 |
| 5 | Sayılar ve Nicelikler (3) | 1 | 7 | 4 |
| 6 | Nesnelerin Geometrisi (2) | 3 | 15 | 9 |
| 7 | Veriye Dayalı Araştırma | 1 | 10 | 6 |

> Yıl **geometriyle başlıyor**, sayılarla değil. Uygulamanın varsayılan ilerleme sırası buna uymalı.

### Kazanımların tam listesi (resmî metin)

**Tema 1 — Nesnelerin Geometrisi (1)**
- `MAT.1.3.1` Hedefe ulaşmak için mesafeleri ve yönleri içeren yönergeleri çözümleyebilme
- `MAT.1.3.2` Nesnelerin eşliğini değerlendirebilme

**Tema 2 — Sayılar ve Nicelikler (1)**
- `MAT.1.1.1` Rakamları ve 20'ye kadar olan sayıları (20 dâhil), niceliklerin büyüklüklerini temsil etmek için kullanabilme
- `MAT.1.1.2` Ögeleri dağınık veya düzenli bir şekilde bulunan bir nesne grubunu sayarken parçalar arasında ilişkileri çözümleyebilme
- `MAT.1.1.3` Nesnelerin sıra sayısını gösterebilme
- `MAT.1.1.4` İki niceliğin büyüklüğünü "çok", "daha çok", "az", "daha az" veya "eşit" terimleriyle karşılaştırabilme
- `MAT.1.1.5` **100'e kadar ileriye ve 20'den geriye** doğru ritmik sayabilme
- `MAT.1.1.6` Artan veya azalan sayı ve şekil örüntülerini çözümleyebilme
- `MAT.1.1.7` Verilen bir çokluktaki ilişkilerden yararlanarak 20'ye kadar olan nesnelerin sayısını tahmin edebilme

**Tema 3 — Sayılar ve Nicelikler (2)**
- `MAT.1.1.8` Standart olmayan uygun ölçme araçları ile nesnelerin **uzunluğunu ve tartacağı kütlenin** ölçüm sonuçlarını tahmin edebilme

**Tema 4 — İşlemlerden Cebirsel Düşünmeye** (20'ye kadar; "üzerine sayma" stratejisi programda açıkça anılıyor)
- `MAT.1.2.1` Günlük yaşamın içerdiği toplama ve çıkarma işlemlerini çözümleyebilme
- `MAT.1.2.2` Toplama ve çıkarma işlemlerinin sonuçlarını tahminde bulunarak ve zihinden işlem yaparak muhakeme edebilme
- `MAT.1.2.3` **Eşit işaretinin anlamını** toplama ve çıkarma işlemi bağlamında yorumlayabilme
- `MAT.1.2.4` Toplama ve çıkarma işlemlerinin **ilişkisini** yorumlayabilme (ters işlem)

**Tema 5 — Sayılar ve Nicelikler (3)**
- `MAT.1.1.9` **Paraların (1, 5, 10, 20, 50, 100, 200 TL)** temsil ettiği büyüklükleri tanıyabilme

**Tema 6 — Nesnelerin Geometrisi (2)**
- `MAT.1.3.3` Günlük yaşamdaki nesneleri biçimsel özelliklerine göre ayırt edebilme (yuvarlak/köşeli)
- `MAT.1.3.4` Günlük yaşamda karşılaşılan geometrik yapılardaki geometrik şekilleri çözümleyebilme
- `MAT.1.3.5` Biçimsel özelliklerine göre geometrik şekilleri sınıflandırabilme (**üçgen, kare, dikdörtgen, çember**)

**Tema 7 — Veriye Dayalı Araştırma**
- `MAT.1.4.1` Kategorik veriye dayalı temel veri grubu ile çalışabilme ve veriye dayalı karar verebilme (**çetele, sıklık tablosu, nesne grafiği**)

### ⚠️ Önceki varsayımlarda düzeltilen beş hata

Bu bölüm, müfredatı gerçekten okumanın neyi değiştirdiğini gösteriyor:

| Yaygın varsayım | Resmî program |
|---|---|
| 1. sınıfta **tam saat okuma** var | **YOK.** Zaman ölçü birimleri 2. sınıfta. `M-SAAT` şablonu kapsam dışı. |
| Para = madeni para, kuruş (1, 5, 10, 25, 50 kr) | **Banknot:** 1, 5, 10, 20, 50, 100, 200 TL. Ayrıca sadece **tanıma**, para toplama değil. |
| Ritmik sayma 20'ye kadar | **100'e kadar ileri**, 20'den geriye. |
| Ölçme = sadece uzunluk | **Uzunluk + kütle**, standart olmayan birimlerle, **tahmin** odaklı. |
| Şekiller: kare, üçgen, **daire** | Kare, üçgen, dikdörtgen, **çember**. Ayrıca önce yuvarlak/köşeli ayrımı. |

Ayrıca programın vurgusu "işlem yapma"dan çok **muhakeme**de: `MAT.1.2.2` tahmin ve zihinden işlem, `MAT.1.2.3` eşit işaretinin anlamı (`7 = 3 + 4` de geçerli), `MAT.1.2.4` ters işlem ilişkisi. Alıştırma şablonları buna göre tasarlandı (§5.2) — sadece "5+3=?" soran bir uygulama bu programı karşılamaz.

**Program PDF'i** `docs/meb-ilkokul-matematik-2024.pdf` olarak repoya konur; `content/kazanimlar.json` ondan türetilir ve kaynak sayfa numarası referans alanında tutulur.

---

## 2. Teknoloji Kararları

| Katman | Seçim | Gerekçe |
|---|---|---|
| Build | **Vite 6 + React 19 + TypeScript** | Sunucu gerekmiyor. En hızlı döngü, en az karmaşıklık. |
| Çıktı | **Tamamen statik** (`dist/`) | Netlify/GitHub Pages/okul sunucusu/USB. Sunucu maliyeti sıfır. |
| PWA | **`vite-plugin-pwa`** (Workbox) | Tüm varlıklar precache → tam çevrimdışı. |
| Stil | **Tailwind v4** + `src/design/tokens.ts` | Tahta ↔ telefon ölçekleme tek kaynaktan. |
| State | **Zustand** + açık persistence katmanı | Otomatik middleware yok — migrasyon kontrolü elde kalsın. |
| Kalıcılık | **Dexie (IndexedDB)** | `localStorage` yalnız `activeProfileId`, `schemaVersion`. |
| Animasyon | **Framer Motion** + lazy `canvas-confetti` | Yalnız `transform`/`opacity` — ucuz Android tablette akıcılık. |
| Test | **Vitest** + **Playwright** | Kritik parçalar (jeneratör, ustalık motoru) saf TS. |
| Doğrulama | **Zod** | İçerik JSON'ları + kayıtlı ilerleme şeması. |

**Reddedilenler:** Next.js (sunucu gereksiz), Redux/XState (aşırı), MUI/Chakra (yetişkin ölçeği), runtime AI SDK (kapsamda yok).

---

## 3. Akıllı Tahta Öncelikli Tasarım

Standart "responsive" yaklaşımıyla çözülmez — ayrı bir cihaz profili gerektirir.

### 3.1 Üç cihaz profili

`src/design/deviceProfile.ts`:

| Profil | Tetik | Ölçek |
|---|---|---|
| `board` | `≥1600px` **ve** `pointer: coarse` / `hover: none` | Temel birim 1.6× |
| `tablet` | `768–1599px` | 1.0× |
| `phone` | `<768px` | 0.75×, seçenekler 2×2 |

Ayarlarda **elle geçersiz kılma zorunlu**: bazı tahtalar 1920×1080 bildirir ama fiziksel olarak 86"; otomatik tespit güvenilmez. Ayrıca geliştirme için `?device=board` URL parametresi.

### 3.2 Tahtaya özgü kurallar

1. **Erişim bölgesi.** 86" tahtada 1. sınıf öğrencisi ekranın üstüne **fiziksel olarak ulaşamaz**. Tüm dokunulabilir öğeler ekranın **alt %65'inde**; üst %35 yalnız uyaran. İhlali ürünü tahtada kullanılamaz kılar → **otomatik testle korunuyor** (§13).
2. **Uzaktan okunabilirlik.** Sınıfın arkasından (≈6 m): uyaran öğe ekran yüksekliğinin ≥%25'i.
3. **Tek dokunma sözleşmesi.** Tahtaların çoğu tek noktalı IR; avuç reddi zayıf, sürükleme kayıyor. **Sürükle-bırak yok** — yerine `dokun-seç → dokun-yerleştir`. Üç cihazda da aynı (tutarlılık).
4. **Fare + dokunma birlikte.** `PointerEvent` kullan, `TouchEvent` değil. `:hover`'a asla anlam yükleme.
5. **Kalibrasyon kayması.** IR tahtalarda dokunma birkaç santim kayar → hedefler görsel sınırından 16px taşan görünmez `padding` alır.
6. **Tam ekran + Wake Lock** oturum boyunca.

### 3.3 Tahta modu ↔ Kişisel mod

Akıllı tahta **paylaşımlı** cihaz — orada kişisel ilerleme takibi anlamsız.

| | Tahta modu | Kişisel mod |
|---|---|---|
| Profil | Yok, "Misafir" | Avatar + renk, cihazda |
| İlerleme | Kaydedilmez | IndexedDB'ye yazılır |
| İçerik | Tema/konu elle seçilir | Adaptif motor seçer |
| Oturum | Serbest | 8 soru, sonra biter |
| Amaç | Sınıfça çözme, tahtaya kalkma | Bireysel eksik kapatma |

İlk açılışta bir kez sorulur (iki büyük ikonlu kart), ayarlardan değişir.

### 3.4 Dokunma hedefi ve tipografi

`tablet` profilinde (`board` = 1.6×, `phone` = 0.75×):

| Öğe | Minimum | Hedef |
|---|---|---|
| Dokunulabilir öğe | 64px | — |
| Geri / ses / yardım | 88px | 88px |
| Cevap kartı | 150px | 180–220px |
| Onayla | 120px | 140px |
| Hedefler arası boşluk | 24px | 32px |
| Kenar ölü bölge | 24px (altta 40px) | — |

iOS'un 44pt standardı yetişkin parmağı varsayar — bu yaş için yetersiz.

**Font: Andika (SIL OFL 1.1), self-host.** Okuryazarlık öğretimi için tasarlandı; **tek katlı `a` ve `g`** — çocuğun okulda öğrendiği form. Tam Türkçe (`ı İ ş ğ ç ö ü`). `latin-ext` alt kümesi dahil edilmezse `ğ ş İ` tofu çıkar.

Kullanılmayacak: Nunito, Comic Sans, Verdana, Arial, Lexend, Atkinson Hyperlegible — hepsi çift katlı `a`. MEB'in dolaşımdaki "Dik Temel" fontları: lisans belirsiz.

**Rakamlar (0–9) fonttan değil, özel SVG path'ten.** MEB dik temel formuna birebir uyum (kancalı `1`, çizgisiz `7`) garantiye alınır. 10 glif, küçük yatırım.

`toLocaleUpperCase('tr')` kullan (I/ı, i/İ tuzağı). TÜMÜ BÜYÜK HARF yasak.

---

## 4. Ses Mimarisi

Ürünün hayati bağımlılığı. Ses çalışmazsa uygulama çalışmaz. **İlk inşa edilen parça bu.**

### 4.1 Karar: önceden üretilmiş dosyalar

Web Speech API birincil motor **olamaz**: iOS'ta sessize alma anahtarıyla susuyor, bazı Android'lerde `tr-TR` sesi hiç yok, Chrome'un Google sesleri sunucu taraflı (çevrimdışı sessizlik), 15 sn üstü konuşmalarda motor donuyor, kalite robotik. Okuma bilmeyen çocuk için sessiz uygulama = ürün yok.

Tüm sabit metinler geliştirme anında sentezlenip `public/audio/` altına gömülür.

### 4.2 Ücretsiz üretim hattı

`scripts/generate-audio.ts` — sağlayıcı-bağımsız, `TTS_PROVIDER` env ile seçilir:

| Sağlayıcı | Durum | Kullanım |
|---|---|---|
| **macOS `say -v Yelda`** | ✅ Bu makinede doğrulandı | **Gün 1 prototipi.** Anında, bedava, sınırsız, çevrimdışı. Kalite orta ama akışı hemen test ettirir. |
| **Piper TTS** (`tr_TR-fahrettin-medium`) | Kurulacak, MIT | **Üretim varsayılanı.** Yerel, sınırsız, ücretsiz, **dağıtım lisansı net.** |
| **ElevenLabs ücretsiz kredi** | Hesap gerekir | **Sadece maskot replikleri** (~60 klip). Kredi sınırlı → en çok duyulan, kişilik taşıyan cümlelere ayrılır. ⚠️ Ücretsiz katmanın dağıtım şartları yayın öncesi doğrulanmalı. |

Hat, `src/content/tr.json`'u tarar, yalnız **hash'i değişen** anahtarları yeniden üretir, `audioManifest.generated.ts` + `SpeechKey` union tipini yazar. Sağlayıcı değişimi tek env değişkeni.

### 4.3 Sayı birleştirme tekniği (çekirdek fikir)

```ts
speak({ kind: 'sequence', keys: ['sayi.7', 'op.arti', 'sayi.5', 'soru.kac-eder'] })
```

Müfredat 100'e kadar ritmik sayma istediği için sayı klipleri **0–100** üretilir. **~140 klip ile sonsuz matematik sorusu seslendirilir** — tam çevrimdışı, üretim maliyeti sıfıra yakın.

⚠️ Bu teknik **yalnız sayı/işlem dizilerinde**. Cümleleri parçadan birleştirme ("Kaç" + "tane" + "elma") — prozodi bozulur, okuma öğrenen çocuğa yanlış dil modeli verir. Tam cümleler tek klip.

### 4.4 Merkezi servis

`src/audio/speech.ts` — tekil `SpeechService`: `prime()` (iOS/autoplay kilidi, ilk kullanıcı jestinde), `speak()`, `stop()`, `repeatLast(rate?)`, `prefetch()`.

Kurallar:
- Tek FIFO kuyruk, uzunluk 3 (hızlı dokunmalarda birikme yok). `priority:'high'` kuyruğu temizler.
- **Ekran değişiminde `useEffect` cleanup → `speech.stop()`.** İhlal edilirse önceki ekranın talimatı yenisinde çalar.
- Çocuk şıka dokununca talimat kesilir — geri bildirim öncelikli.
- **Ses kilidi ekranı:** ilk açılışta tek 240px daire + oynat ikonu. Estetik değil zorunluluk.
- **Cihaz sessizken ürün çalışmalı:** her sesli talimatın görsel karşılığı var.
- Hız normalden %10 yavaş, cümle araları 400ms. Talimatlar 6–8 kelime, tek yönerge.

### 4.5 Ses envanteri — şablon başına gerekli klip kümeleri

Mevcut manifest (171 klip): `sayi.0–100`, işlemler (`op.arti/eksi/esit/kadar`),
10 nesne adı, renkler, UI/geri bildirim cümleleri, tema girişleri. Bu envanter
ilk 4 şablonu karşılar; **kalan şablonlar için şu kümeler ÜRETİLMEDEN o şablon
yazılamaz** (jeneratör derlenir ama `validate-content.ts` eksik `speechKey`'de kırılır):

| Klip kümesi | Anahtarlar | Gereken şablon | Adet |
|---|---|---|---|
| Sıra sayıları | `sira.1` … `sira.20` ("birinci"…"yirminci") | `M-SIRA-SAYI` | 20 |
| Yön/konum | `yon.ileri`, `yon.geri`, `yon.saga`, `yon.sola`, `yon.yukari`, `yon.asagi`, `konum.altinda`, `konum.ustunde`, `konum.icinde`, `konum.onunde`, `konum.arkasinda`, `konum.arasinda`, `sayi-adim.bir-adim` … | `M-KONUM`, `M-YONERGE` | ~15 |
| Para | `para.lira`, `sayi.200` (manifestte yok!) | `M-PARA-TANI`, `M-PARA-SIRALA` | 2 |
| Şekil adları | `sekil.ucgen`, `sekil.kare`, `sekil.dikdortgen`, `sekil.cember`, `sekil.yuvarlak`, `sekil.koseli`, `sekil.kenar`, `sekil.kose` | `M-GEO-*` | 8 |
| Ölçme | `olcme.uzun`, `olcme.kisa`, `olcme.agir`, `olcme.hafif`, `olcme.atac`, `olcme.karis`, `olcme.blok` | `M-OLC-*` | ~7 |
| Karşılaştırma ek | (mevcut: çok/az/eşit kontrol et) `kiyas.daha-cok`, `kiyas.daha-az` | `M-KARSILASTIR` | ~2 |
| Veri | `veri.en-cok`, `veri.en-az`, `veri.kac-tane` + kategori adları | `M-VERI-*` | ~8 |
| Şablon talimat cümleleri | her yeni şablon için 1–3 tam cümle (`soru.*`) | tümü | ~50 |

Üretim akışı değişmez: anahtarı `src/content/tr.json`'a ekle → `npm run audio`
(yalnız hash'i değişeni üretir) → manifest ve `SpeechKey` tipi kendini günceller.
**Sayı birleştirme kuralı geçerli:** sıra sayıları ve yönler TAM KELİME klipleridir,
parçadan birleştirilmez (§4.3'teki prozodi kuralı).

---

## 5. Alıştırma Sistemi

### 5.1 Etkileşim primitifleri

Hepsi metinsiz çalışır, hepsi **tek dokunma**:

`AUDIO_TO_IMAGE` (sesi dinle, görseli seç — temel taş) · `TAP_COUNT` (dokunarak say) · `TAP_TO_PLACE` (seç sonra yerleştir) · `MATCH_PAIRS` · `SEQUENCE_ORDER` · `HOTSPOT_FIND` · `NUMBER_LINE`

### 5.2 Şablonlar — kazanım eşlemesi

> **Tek gerçek kaynak `src/content/skills.json`'dur** — her beceri düğümü
> `exerciseTemplates` alanıyla şablonlarına bağlıdır ve `validate-content.ts`
> bu eşlemeyi CI'da doğrular. Aşağıdaki tablo o dosyanın insan-okur özetidir;
> uygulama sırasında planın ilk taslağındaki 17 kaba şablon, tek tip etkileşim =
> tek şablon ilkesiyle **40 ince şablona** bölündü (ör. eski `M-VERI` dört
> aşamasının her biri ayrı ekran ve ayrı ölçüm gerektirdiği için 4 şablona ayrıldı).
> Tabloda ✅ = jeneratör yazıldı, ⬜ = `skills.json`'da tanımlı, jeneratör bekliyor.

**Tema 1 — Geometri (1):**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-KONUM` | `MAT.1.3.1` | ⬜ | Konum ifadeleri: altında/üstünde/içinde/önünde/arasında; sesi dinle, doğru sahneyi seç |
| `M-YONERGE` | `MAT.1.3.1` | ⬜ | Izgarada karakteri sesli yönergeyle hedefe götür ("iki adım ileri, sonra sağa"). Yön klipleri gerekli (§4.5) |
| `M-ESLIK` | `MAT.1.3.2` | ⬜ | İki nesne üst üste bindirilerek eş mi değil mi |

**Tema 2 — Sayılar ve Nicelikler (1):**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-SAY` | `MAT.1.1.1`, `.2`, `.7` | ✅ | **İki aşamalı:** önce dokunarak say, sonra rakam seç. Dokunma doğru/rakam yanlış = kardinalite sorunu. `layout: dağınık` sayma stratejisini ortaya çıkarır |
| `M-RAKAM-TANI` | `MAT.1.1.1` | ⬜ | Sesi dinle ("yedi"), rakam glifini seç |
| `M-ONLUK-COZUMLE` | `MAT.1.1.1`, `.2` | ⬜ | 11–20 arası sayıyı onluk+birlik olarak çözümle (onluk çerçeve) |
| `M-SIPSAK` | `MAT.1.1.2`, `.7` | ⬜ | Şipşak sayılama (subitizing): düzenli küme ≤1 sn gösterilir, saymadan tanınır |
| `M-SIRA-SAYI` | `MAT.1.1.3` | ⬜ | Sıradaki kaçıncı (birinci…onuncu). Sıra sayısı ses klipleri ZORUNLU (§4.5) |
| `M-KARSILASTIR` | `MAT.1.1.4` | ✅ | çok / daha çok / az / daha az / eşit. Boyut-çeliştirmeli maddeler zorunlu (büyük nesne ≠ çok). Sembol YASAK |
| `M-RITMIK` | `MAT.1.1.5` | ✅ | Dizide eksik sayı. Geçerli (yön, adım, sınır) üçlüleri YALNIZ mufredat-kisitlari §2'dekiler — genel jeneratör yazma |
| `M-ORUNTU-SAYI` | `MAT.1.1.6` | ⬜ | Artan/azalan sayı örüntüsünde verilmeyen terim; en çok 6 terim |
| `M-ORUNTU-SEKIL` | `MAT.1.1.6` | ⬜ | Tekrar eden şekil örüntüsünü sürdür |
| `M-TAHMIN-MIKTAR` | `MAT.1.1.7` | ⬜ | Küme ~2 sn gösterilir, çocuk tahmin eder, sonra birlikte sayılır. **Doğru/yanlış yok — yakınlık ölçülür** (puanlama: §6.1) |

**Tema 3 — Ölçme:**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-OLC-UZUNLUK` | `MAT.1.1.8` | ⬜ | İki nesnenin boyunu kıyasla (uzun/kısa) |
| `M-OLC-KUTLE` | `MAT.1.1.8` | ⬜ | Terazi görseliyle ağır/hafif kıyası |
| `M-OLC-BIRIM` | `MAT.1.1.8` | ⬜ | Standart olmayan birimle ölç: "kalem kaç ataç?" |
| `M-OLC-TAHMIN` | `MAT.1.1.8` | ⬜ | Önce tahmin, sonra ölçüm; yakınlık ölçülür (§6.1) |

**Tema 4 — İşlemlerden Cebirsel Düşünmeye:**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-TOPLA-GORSEL` | `MAT.1.2.1`, `.2` | ✅ | Onluk çerçeve / küme modelleriyle toplama, sonuç ≤20 |
| `M-TOPLA-SEMBOL` | `MAT.1.2.1`, `.2` | ⬜ | `7 + 5 = ?` sembolik; görsel destek şıklarda |
| `M-TOPLA-ONA-TUMLE` | `MAT.1.2.2` | ⬜ | 10'a tümleme: `8 + ? = 10` (onluk çerçeve) |
| `M-CIKAR-GORSEL` | `MAT.1.2.1`, `.2` | ⬜ | Ayırma/geriye sayma modeliyle çıkarma |
| `M-CIKAR-SEMBOL` | `MAT.1.2.1` | ⬜ | `9 − 4 = ?` sembolik; fark bulma dahil |
| `M-TAHMIN-ISLEM` | `MAT.1.2.2` | ⬜ | Sonucu tahmin et, sonra zihinden doğrula; yakınlık ölçülür |
| `M-ESIT-DENGE` | `MAT.1.2.3` | ⬜ | Terazi metaforu: `7 = 3 + ?`, `4 + 3 = ? + 5`. **Programın vurguladığı, çoğu uygulamanın atladığı kazanım** |
| `M-EKSIK-TOPLANAN` | `MAT.1.2.3`, `.4` | ⬜ | `3 + ? = 8` eksik toplanan |
| `M-TERS-ISLEM` | `MAT.1.2.4` | ⬜ | `8 − 3 = 5` gösterilir, `5 + 3 = 8` kurulur (aynı sayı üçlüsü) |
| `M-ISLEM-HIKAYE` | `MAT.1.2.1` | ⬜ | Sesli günlük yaşam problemi ("5 kuş vardı, 2'si uçtu"). Senaryolar `senaryolar.json`'dan |

**Tema 5 — Para:**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-PARA-TANI` | `MAT.1.1.9` | ⬜ | Banknot tanıma (1–200 TL, stilize görsel §8). **Toplama YASAK** — kazanım sadece tanıma |
| `M-PARA-SIRALA` | `MAT.1.1.9` | ⬜ | Banknotları değer büyüklüğüne sırala |

**Tema 6 — Geometri (2):**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-GEO-AYIR` | `MAT.1.3.3` | ⬜ | Günlük nesneleri yuvarlak/köşeli ayır |
| `M-GEO-ESLE` | `MAT.1.3.3` | ⬜ | Nesneyi biçimce benzediği şekille eşle |
| `M-GEO-KENAR-KOSE` | `MAT.1.3.4` | ⬜ | Kenar/köşe sayısıyla şekli tanımla |
| `M-GEO-YAPI` | `MAT.1.3.4` | ⬜ | Ev/robot resmindeki şekilleri bul (hotspot) |
| `M-GEO-ADLANDIR` | `MAT.1.3.5` | ⬜ | Üçgen/kare/dikdörtgen/**çember** adlandır ("daire" deme) |
| `M-GEO-SINIFLA` | `MAT.1.3.5` | ⬜ | Şekilleri sınıfla; öğelerin ≥%40'ı döndürülmüş — prototip hatasını hem ölçer hem düzeltir |

**Tema 7 — Veri:**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-VERI-GRUPLA` | `MAT.1.4.1` | ⬜ | Karışık nesneleri kategoriye grupla (dokun-seç → dokun-yerleştir) |
| `M-VERI-CETELE` | `MAT.1.4.1` | ⬜ | Sayarak çetele işaretle |
| `M-VERI-SIKLIK` | `MAT.1.4.1` | ⬜ | Çeteleden sıklık tablosu doldur |
| `M-VERI-GRAFIK` | `MAT.1.4.1` | ⬜ | Nesne grafiğini oku, soruyu cevapla ("en çok hangisi?") |

**40 şablon, 19 kazanımın tamamını ve 57 beceri düğümünü kapsıyor** (kanıt:
`npm run validate` müfredat kapsamını doğrular). 4 jeneratör yazıldı, 36 bekliyor.

### 5.3 Üretim ayrımı

> **Kural, mantık, sayı üretimi → kod. Kelime, senaryo, resim listesi → JSON.**

Matematikte şablonların **tamamı programatik** ya da **varlık-bağımlı programatik** (sonlu varlık seti + sonsuz kombinasyon). Yaratıcı içerik ihtiyacı çok düşük — matematik seçiminin ana getirisi bu.

Yapay zeka (geliştirme anında, `scripts/generate-content.ts`, insan onaylı):
- Günlük yaşam problem senaryoları (`MAT.1.2.1` — "5 kuş vardı, 2 tanesi uçtu")
- İpucu kütüphanesi: her `(kazanım × hata tipi × deneme)` için çocuk diliyle açıklama
- Nesne/sahne listeleri, kültürel uygunluk denetimi

**Yapay zeka kesinlikle matematik sorusu üretmez.** Deterministik jeneratörün üstünlüğü: %100 doğruluk, tohumla tekrar üretilebilirlik (test ve hata analizi mümkün), 0ms gecikme, sıfır maliyet, tam çevrimdışı. Bir aritmetik hatası 6 yaşındaki çocuğa yanlış öğretir.

---

## 6. Ustalık ve Adaptif Motor

### 6.1 Ustalık modeli

BKT/IRT reddedildi — 6 yaşta veri az, model açıklanamaz. Üç sinyal + zaman aşınması:

```ts
// src/progress/mastery.ts
q = 1.00 doğru,ipuçsuz,hızlı | 0.85 doğru,ipuçsuz | 0.45 ipucu 1-2
  | 0.20 tam gösterimden sonra | 0.00 yanlış

doğru:  strength += 0.35 · zorlukKatsayısı · q · (1 − strength)
yanlış: strength -= 0.30 · strength
strengthEff = strength · 2^(−Δgün / halfLife[box])   // [1,2,4,8,16,32] gün
```

**Leitner kutusu (`box`) — tam tanım.** `box ∈ {0..5}`, başlangıç `0`.
Yalnız **günler arası** hareket eder (aynı gün içindeki tekrarlar kutuyu değiştirmez —
aralıklı tekrarın özü zaman aralığıdır):

- Bir önceki cevaptan **farklı bir günde** gelen ilk cevapta değerlendirilir:
  - o günkü ilk cevap `q ≥ 0.85` → `box = min(box + 1, 5)`
  - o günkü ilk cevap `q = 0` → `box = max(box − 1, 0)` (asla 2+ düşmez)
  - aradaki `q` değerleri (ipuçlu doğru) → kutu değişmez.
- **Vade:** düğüm, son cevabından `halfLife[box]` gün sonra "vadesi gelmiş" sayılır ve
  §6.4'teki `review` kovasına aday olur. `strengthEff < 0.55`e düşen `mastered` düğüm
  `rusty` durumuna geçer.
- Kutu, ustalık koşulundan bağımsızdır; `mastered` olduktan sonra da işlemeye devam eder
  (unutma eğrisini yönetir).

**Yakınlık puanlaması (`M-TAHMIN-MIKTAR`, `M-OLC-TAHMIN`, `M-TAHMIN-ISLEM`).**
Bu şablonlarda doğru/yanlış ikiliği YOKTUR; `q` göreli hatadan türetilir:

```ts
// hata oranı: e = |tahmin − gerçek| / max(gerçek, 1)
q = e ≤ 0.15 → 1.00   // isabetli tahmin
  | e ≤ 0.30 → 0.85
  | e ≤ 0.50 → 0.45
  | aksi     → 0.20   // ASLA 0.00 değil — tahmin şablonunda "yanlış" yok (§7.1 ruhu)
```

Geri bildirim de ikili değildir: her tahminden sonra gerçek değer birlikte sayılarak/
ölçülerek gösterilir, kutlama tonu `q`'ya göre "harika tahmin" / "yaklaştın" olur.
`strength` güncellemesi aynı formülle çalışır; `yanlış` dalı bu şablonlarda hiç kullanılmaz.

Asimetri kasıtlı — yanlış cevap ilerlemenin çoğunu silmez. Çocuk asla "geri gitmiş" hissetmez.

**Ustalık koşulu:** `strengthEff ≥ 0.85` **ve** `streak ≥ 3` **ve** `distinctDays ≥ 2`.

Son şart kritik: tek oturumda 3 doğru "öğrendi" değil, "kısa süreli bellek". Bu tek şart sahte ustalığın çoğunu eler.

**Durumlar:** `locked` → `ready` → `learning` → `mastered`, ayrıca `rusty` ve `struggling` (6+ denemede <%45 → kök neden taraması).

**Çocuğa gösterim: sayı yok, yüzde yok.** 4 seviye: tohum → filiz → çiçek → meyve.

### 6.2 Ön-koşul grafiği

Kazanımlar bir DAG oluşturur (`hard` / `soft` / `related` kenarlar). Resmî kazanımların altında motorun çalıştığı **mikro düğümler** var — çünkü `MAT.1.2.2` gibi geniş bir kazanım tek başına ölçülemez:

```
sayma_ritmik_10 → birebir_eslesme → kardinalite ──┐   [kritik düğüm]
                                                  ├→ gorsel_birlestirme
rakam_tanima_0_9 ← kardinalite                    │
miktar_karsilastirma ← kardinalite                │
                                                  ▼
        hepsini_sayma_10 → ustune_sayma_10 → ikili_10_tumleme → 10_gecen_20ye
                                                  │              [strateji sıçraması]
        eksik_toplanan ← sembol_arti_esit ────────┘
        toplama_cikarma_iliskisi ← eksik_toplanan
```

`content/kazanimlar.json` resmî kodu tutar (raporlama), `content/skills.json` mikro düğümleri (motor). `skillId` müfredat sürümünden bağımsız isimlendirilir (`mat.top.ustune_sayma`, `MAT.1.2.2` değil) — program revize olunca ilerleme kayıtları korunur.

**Build-time doğrulama zorunlu** (`scripts/validate-content.ts`, CI'da): grafta çevrim yok, her düğüm en az bir şablona bağlı, her `imageId` diskte var, her `speechKey` ses manifestinde var. Projedeki en çok hata yakalayan araç bu olacak.

### 6.3 `readingLoad` — okuma yükü

Her madde taşır (0 = hiç okuma gerekmez … 3 = cümle). Motor sert filtre uygular:

> `readingLoad > learner.readingLevel` → madde **asla** gösterilmez.

Matematikte hedef `readingLoad: 0` — rakamlar hariç metin yok. Bu, uygulamayı Eylül'den itibaren kullanılabilir kılıyor.

**`readingLevel` yaşam döngüsü (tam tanım):**

- **Tip ve başlangıç:** `0 | 1 | 2 | 3`, yeni profilde **daima `0`** (Eylül varsayımı —
  yanlışsa zararsız: çocuk yalnız daha az metin görür).
- **Kim değiştirir:** YALNIZ veli, veli panelindeki ayardan ("Çocuğunuz okumaya
  başladı mı?" — 4 seviyeli ikonlu seçim). **Otomatik yükseltme YASAK:** uygulama
  matematik performansından okuma becerisi ÇIKARSAYAMAZ; yanlış pozitif, okuyamayan
  çocuğa metinli soru göstermek demektir ve ürünü kullanılamaz kılar.
- **Okul ayı ile ilişkisi yok:** okul ayı (§6.5) içerik başlangıç noktasını seçer,
  `readingLevel`'a dokunmaz.
- **Saklama:** `learner_profile` store'unda (§10); yedeğe dahildir.
- Matematik dersinde tüm maddeler `readingLoad: 0` hedeflendiği için bu alan pratikte
  ilk sürümde filtrelemez — mekanizma, Türkçe dersi eklendiğinde hazır olsun diye
  İLK SÜRÜMDE kurulur (sonradan eklemek migrasyon gerektirir).

### 6.4 Sıradaki soruyu seçme

Oturum = **8 soru ≈ 5–7 dakika.** Sonsuz akış yok — 6–7 yaşta sürdürülen dikkat 10–15 dakika.

| Kova | Oran | İçerik |
|---|---|---|
| `warmup` | %15 (ilk 1–2) | Ustalaşılmış, kolay. Oturum **daima başarıyla açılır**. |
| `frontier` | %45 | `learning`, `strengthEff` 0.3–0.85 |
| `new` | %20 | `ready`, oturum başına **en fazla 2 yeni düğüm** |
| `review` | %15 | `rusty` + Leitner vadesi gelmiş |
| `remediation` | %5 (tetiklenirse %30) | Aktif hata etiketi olanlar |

Skorlama: `urgency × novelty × readingFit × assetReady × interleave × difficultyFit`. En yüksek 3 aday arasından ağırlıklı rastgele — çocuk örüntüyü ezberlemesin.

**Sert kurallar:**
1. `readingLoad > readingLevel` → asla göster**me**.
2. Aynı düğüm üst üste 3'ten fazla → zorla tema değiştir.
3. **2 ardışık yanlış → sonraki soru zorunlu `warmup`** (duygusal toparlanma).
4. Bir düğümde 3 kez yanlış/destekli → 1 gün askıya al, en yakın ön-koşula in.
5. **Oturum daima ustalaşılmış bir soruyla biter** — son izlenim başarı.

### 6.5 Seviye tespiti

**İlk oturumda kalibrasyon testi YAPILMAZ.** İlk deneyimin başarısızlıkla başlaması en pahalı hata. Herkes kolaydan başlar, motor 2–3 oturumda yerini bulur.

Veli kapısı arkasında tek soru: **"Okulun kaçıncı ayı?"** (Eylül…Haziran, ikonlu). Programın tema sırası bilindiği için bu tek cevap başlangıç noktasını isabetle ayarlar. Soğuk başlangıç böyle çözülür.

### 6.6 Hata taksonomisi

Çeldiriciler rastgele değil — her biri bir yanlış zihinsel modeli temsil eder ve `diagnosticTag` taşır. Son 6 maddede aynı etiket ≥2 kez → `remediation` kovası devreye girer.

| Etiket | Hata | Tespit | Müdahale |
|---|---|---|---|
| `BIREBIR_ESLESME` | Sayarken atlama/çift sayma | `dağınık` düzende hata, `sıra` düzeninde doğru | Dokundukça işaretlenen sayma |
| `KARDINALITE` | Doğru sayar, "kaç tane?"ye cevap veremez | Dokunma doğru, rakam yanlış | "Son söylediğin sayı hepsidir" + küme kapsama animasyonu |
| `HEPSINI_SAYMA` | Toplamada hep 1'den sayar (verimsiz strateji) | Doğru ama latency >8sn | "Üzerine sayma" öğretimi — programın açıkça istediği strateji |
| `FAZLA/EKSIK_SAYMA` | `a+b±1` | Çeldirici etiketi | Sayı doğrusunda sıçrama görselleştirmesi |
| `TEK_KUMEYI_ALMA` | Sadece bir kümeyi cevaplama | Çeldirici `a` veya `b` | İki kümeyi tek çerçevede birleştirme |
| `ONLUK_BOZMA` | 10'u geçende tümleme kaybı | 10 altı/üstü keskin fark | `ikili_10_tumleme`'ye dön, onluk çerçeve |
| `ESIT_ISLEM_SONUCU` | `=` işaretini "cevap gelir" sanma; `3+4=7+2` yazma | `M-ESIT-DENGE` başarısız | Terazi metaforu, iki yönlü okuma |
| `SEKIL_PROTOTIP` | Döndürülmüş kareyi kare saymama | `rotation≠0` maddelerinde düşüş | Döndürme animasyonu, kenar/köşe sayarak tanımlama |
| `BUYUKLUK_MIKTAR` | Büyük nesneler = daha çok | Boyut-çeliştirmeli maddeler | Birebir eşleştirme kanıtı |
| `PARA_BOYUT_DEGER` | Banknot boyutunu değerle eşleme | `M-PARA-TANI` çeldiricileri | Değer sıralaması, renk+sayı vurgusu |
| `GOREV_ANLASILMADI` | Bilgi eksikliği değil, görev karışıklığı | `audioReplay ≥3` + rastgele seçim + yüksek latency | Talimatı tekrarla, örnek göster. **Ustalık skoru güncellenmez, `attempts` artmaz.** |

Son satır önemli bir mimari kural: **görevin anlaşılmaması bilgi eksikliği olarak kaydedilmez.**

---

## 7. Geri Bildirim, Yardım, Motivasyon

### 7.1 Yanlış cevap — hiçbir koşulda cezalandırıcı değil

**Yasak:** kırmızı renk, `X`, buzzer, maskotun üzülmesi, "yanlış" kelimesi, can/kalp, puan düşürme, seri kırılması, süre sayacı.

**Olacak:** seçilen kart amber (`#F59E0B`), yumuşak yay hareketiyle yerine oturur; nazik alçalan iki nota; **Yardım Kademe 1 otomatik devreye girer**; ikinci deneme. İkinci yanlışta doğru cevap gösterilir ve sesli açıklanır, sonraki soruya geçilir — aynı soru tekrar sorulmaz, kazanım tekrar kuyruğuna alınır.

### 7.2 "Takıldım" akışı — 3 kademeli artan destek

Tetik: maskota dokunma **veya** 15 sn hareketsizlik (K1), +30 sn (K2), +30 sn (K3). Çocuk asla ekranda takılıp kalamaz.

- **K1 — Yeniden yönlendirme.** Soru daha yavaş tekrar okunur, ilgili görsel nabız gibi büyür.
- **K2 — Eleme + strateji.** Bir yanlış seçenek soluklaşır. Nesneler tek tek, sesli sayımla parlar; onluk çerçeve belirir.
- **K3 — Birlikte yapalım.** Maskot işlemi ağır çekimde tamamlar, hayalet dokunuş halkası doğru seçenek üzerinde nabız atar. "Şimdi sen dene." Çocuk dokununca **tam doğru muamelesi görür** — kutlama aynı, ceza yok. Arka planda "destekli" işaretlenir, kazanım tekrar kuyruğuna girer.

Özü: **çocuk yardım istediği için bedel ödemez, ama sistem gerçek yeterliliği yine de doğru ölçer.**

### 7.3 Seç → Onayla

Seçenek dokunuşu cevabı göndermez; seçenek büyür ve çerçevelenir, sağ altta Onayla belirir. Onaydan önce sınırsız değiştirilebilir. Akıllı tahtada kalibrasyon kayması yüzünden zorunlu. 2 seçenekli sorularda bile aynı kural.

Ek koruma: 250ms dokunma soğuması, kenar 24px ölü bölge, `touch-action: manipulation`, uzun basma menüsü kapalı. **Geri butonu asla veri kaybettirmez** — oturumu duraklatır, dönünce kaldığı sorudan devam. Onay diyaloğu sorulmaz (okunamaz).

### 7.4 Ödül: koleksiyon

3 yıldız **hayır** (performans notudur; 1 yıldız alan çocuk başarısızlık yaşar). Rozet **hayır** ("başarım" bu yaşta soyut). **Koleksiyon evet** — somut, biriken, karşılaştırmasız.

**"Bahçem":** her tamamlanan oturum 1 çıkartma. Oturum sonu ekranından uçarak bahçeye yapışır. 30 çıkartma ≈ 6 hafta → yeni sahne.

Aşırı oyunlaştırma önlemleri: ödül **tamamlamaya** bağlı, doğru sayısına değil (yanlış yapan da alır) · sanal para/mağaza yok · **streak sayacı yok** (bir gün kaçırınca suçluluk üretir) · liderlik tablosu/sosyal karşılaştırma yok · kutlama ≤2 sn, atlanabilir · sayısal skor/yüzde hiçbir yerde yok.

Doğru cevap: 400–600ms, yeşil çerçeve + tik + %8 nabız + yükselen iki nota. Sesli onay 6–8 varyantlı. **Konfeti yalnız oturum sonunda.**

### 7.5 Maskot

Tek net işlevi: **sesin sahibi olmak.** Tüm sesli talimat ondan gelir; "kim konuşuyor" sorusunu çözer, yardım istemeyi doğallaştırır.

**İnsan değil** (etnik/cinsiyet temsili ve tekinsiz vadi) · türü belirsiz, yuvarlak, tüylü · silueti asla değişmez, yalnız yüz ifadesi ve kol pozu (6 durum) · sabit sıcak turuncu · 16px'te bile tanınabilir.

**Asla:** üzülmez, ağlamaz, suçlamaz, gereksiz konuşmaz, bekletmez. Sessiz kalabilmesi en önemli özelliği.

---

## 8. Görsel Varlık Stratejisi

**Dört katmanlı hibrit, ağırlık merkezi programatik SVG'de. Yapay zeka görsel üretimi kullanılmaz.**

| Katman | Kaynak | Ne için |
|---|---|---|
| **K1** | Programatik SVG (React) | ~%90: onluk çerçeve, sayı doğrusu, şekiller, rakam glifleri, çetele, nesne grafiği, ızgara, terazi |
| **K2** | **Noto Color Emoji (SIL OFL)** | Sayılacak nesneler, çıkartmalar |
| **K3** | Özel SVG (10–20 varlık) | Maskot, bahçe sahnesi, banknotlar (stilize), ölçme araçları |
| **K4** | Özel UI ikon seti (10–12) | Geri, ses, yardım, onay, ev |

**K1 neden ağırlık merkezi** — projenin en yüksek getirili tek kararı: soru üreteci ile **aynı veriden** çizilir (`{tip:'sayma', nesne:'elma', adet:7}` hem soruyu hem görseli üretir), sonsuz varyasyon sıfır varlık maliyetiyle. **7 elma her zaman 7 elmadır** — bu bir sayma uygulamasında pazarlık konusu değil. <2KB/dosya, temaya otomatik uyar, telifi temiz.

**Nesne yerleşim algoritması kritik:** 1–4 düzenli sıra, 5–10 gruplu (5+2), 10+ onluk çerçeve. Rastgele dağıtım sayma öğrenimini bozar — ama `MAT.1.1.2` **bilerek dağınık** düzen istiyor, o yüzden `layout` bir parametre ve dağınık düzen bir tanılama aracı (§6.6).

**K4 için Lucide/Phosphor kullanma** — yetişkin arayüzü için ince çizgili, tahta mesafesinde okunmuyorlar. Kendi setin: kalın (6–8px), dolgulu, daire içinde. Yarım günlük iş.

**Yapay zeka görsel üretimi reddedildi:** stil kayması · **7 nesne isteyip 6 almak ürünün temel işlevini bozar** · tekinsiz vadi · eser sahipliği belirsiz (okula sunulacaksa savunulamaz) · denetim döngüsü hesaba katılınca K1'den pahalı.

### Lisans notları

- **Noto Color Emoji — SIL OFL 1.1.** Birinci tercih, ShareAlike yok.
- **OpenMoji — CC BY-SA 4.0.** ShareAlike **bulaşıcı**, kapalı kaynak üründe hukuki yük. **Kaçın.**
- **Türk Lirası: gerçek banknot görseli kullanılamaz** (TCMB koruması). `MAT.1.1.9` için stilize temsil çizilir — doğru renk ve rakam, gerçekçi değil. Bu kazanımın tek varlık riski.
- **MEB:** kazanım kodları referans alınabilir; ders kitabı görselleri **kullanılamaz.**
- Ticari karakterler (Pepee, Rafadan Tayfa vb.) kullanılamaz.
- İlk sürümden itibaren `LICENSES.md` + uygulama içinde "Kaynaklar" ekranı.

---

## 9. Renk, Kontrast, Animasyon

| Rol | Değer |
|---|---|
| Zemin | `#FFFDF8` (saf beyaz tahtada parlar) |
| Metin/çizgi | `#2B2B2B` |
| Doğru | `#16A34A` + tik + yükselen iki nota |
| Tekrar dene | `#F59E0B` amber — **kırmızı asla** |
| Vurgu | Çocuğun seçtiği renk |

**Renge tek başına anlam yüklenmez** — her ayrım ≥3 kanaldan (renk + ikon + ses + hareket).

**Kontrast:** metin ≥7:1 (AAA), grafik ≥4.5:1 — WCAG'ın 3:1 grafik eşiği bilerek aşılıyor, çünkü okul cihazları ucuz ve sınıf ışığı kötü.

**Animasyon:** `prefers-reduced-motion` → hareket 0, geri bildirim ikon+sesle devam · 3 Hz üstü yanıp sönme yok (WCAG 2.3.1) · ekranın %25'inden fazlasını kaplayan hızlı hareket yok · konfeti ≤40 parçacık, ≤1.5 sn · yalnız `transform`/`opacity`.

---

## 10. Veri Katmanı

**IndexedDB (Dexie), `src/persistence/db.ts`:**

| Store | İçerik |
|---|---|
| `content_*` | Kazanımlar, mikro düğümler, şablonlar, hata kataloğu — salt-okunur |
| `learner_mastery` | Düğüm başına ustalık kaydı (§6.1: `strength`, `box`, `streak`, `distinctDays`, `lastAnsweredAt`, durum) |
| `learner_profile` | `readingLevel`, ayarlar, cihaz profili geçersiz kılma, okul ayı |
| `active_session` | Duraklatılmış oturumun TAM durumu (aşağıda) |
| `events` | Append-only cevap logu, son 2000 kayıt halka tampon |
| `sessions` | Oturum özeti, son 90 gün |

`localStorage` yalnız: `activeProfileId`, `contentPackVersion`, `dbSchemaVersion`.

**Duraklatılmış oturum (`active_session`).** §7.3 "geri butonu oturumu duraklatır,
dönünce kaldığı sorudan devam" der — bu, uygulama tamamen kapansa da geçerli olmalı:

- Her sorunun **cevap anında** (soru geçişinde değil) yazılır: seçilmiş 8 sorunun
  `itemId` + tohum listesi, güncel soru indeksi, verilen cevaplar, yardım kademeleri.
  Sorular tohumdan deterministik yeniden üretilebildiği için (§5.3) soru gövdesi saklanmaz.
- Açılışta `active_session` doluysa ana ekran yerine "Kaldığın yerden devam edelim mi?"
  (iki büyük ikonlu kart: devam / yeni). **24 saatten eski** duraklatılmış oturum
  sessizce atılır — dünkü yarım oturumu dayatmak cezalandırıcıdır.
- Oturum tamamlanınca kayıt silinir ve `sessions`'a özet yazılır.
- Tahta modunda (§3.3) `active_session` HİÇ yazılmaz.

**Kalıcılık garantisi — ZORUNLU, ilk sürümde:**

1. İlk oturum tamamlandığında `navigator.storage.persist()` çağrılır (ilk açılışta
   değil — tarayıcılar "etkileşim görmüş" siteye izni daha yüksek oranla verir).
   Sonuç `learner_profile`'a yazılır; `false` dönerse veli panelinde uyarı rozeti
   gösterilir ("Verileriniz güvence altında değil, yedek alın").
2. **iOS Safari 7 gün kuralı:** kullanılmayan sitenin tüm depolaması 7 günde silinir;
   **ana ekrana eklenmiş PWA muaftır.** Bu yüzden iOS Safari'de 2. oturum sonunda
   veli kapısı arkasında "ana ekrana ekle" yönergesi gösterilir. Bu, estetik değil
   veri güvenliği önlemidir.
3. `navigator.storage.estimate()` veli panelinde gösterilir (tanılama).

**Migrasyon:** `src/persistence/migrations/` — sürüm başına ayrı dosya, eski tipler **dondurulur** (`types/progressV1.ts`). Uygulama güncellenince yılın verisi bozulmaz.

**Yedekleme zorunlu, ilk sürümde.** Hesapsız mimarinin tek ciddi riski: tarayıcı verisi silinince yılın emeği gider. Veli kapısı arkasında tek düğmelik **JSON dışa/içe aktar**. Dışa aktarım dosya adı `okulumsun-yedek-YYYY-AA-GG.json`; içe aktarım Zod ile doğrulanır, sürümü eskiyse önce migrasyondan geçirilir, mevcut veriyle **birleştirilmez** — kullanıcıya "değiştir" onayı sorulur (veli ekranı, metin serbest).

---

## 11. Ekran Akışı

```
[0] Açılış — ses kilidi (240px daire + oynat)
      ├─ ilk kez ─→ [1] Mod seçimi (Tahta / Kişisel)
      │               └─ Kişisel ─→ [2] Avatar (2x4) → [3] Renk (6 top)
      ├─ active_session dolu ─→ [D] "Devam edelim mi?" (devam / yeni) → [6] veya [4]
      ▼
[4] ANA EKRAN — 7 tema kartı (ikon + renk + siluet) + maskot + dişli (32px, çocuk hedefi değil)
      ▼
[5] Tema girişi (2 sn, otomatik) — maskot "Bugün sayı sayacağız"
      ▼
[6] ALIŞTIRMA ×8 — 4. soruda "yarı yoldasın" mikro-animasyonu
      ▼
[7] Oturum sonu — çıkartma uçarak bahçeye
      ▼
[8] BAHÇEM → [Ev] → Ana ekran

Yan dal: [4] → dişli → Veli kapısı → [9] Veli paneli
```

**Tahta modunda akış farkı (§3.3).** Tahta modu seçiliyse:

- [2]/[3] (avatar/renk) atlanır — profil yok.
- [4] ana ekranda tema kartına dokununca [5]'e değil **[4b] Konu seçimi** ekranına
  gidilir: temanın beceri düğümleri `childLabel` etiketiyle büyük kartlar hâlinde
  (ör. "Nerede?", "Kaç tane?"). Öğretmen o günkü konuyu elle seçer — adaptif motor
  devre dışıdır, `readingLoad` filtresi hariç tüm §6.4 kuralları atlanır.
- [6] alıştırma serbest uzunluktadır: 8 soru sınırı ve boncuk yolu yerine sonsuz
  "sıradaki soru" akışı + her sorudan sonra büyük "bir tane daha" kartı.
- [7]/[8] (çıkartma/bahçe) atlanır — ödül kişiseldir, sınıf ekranında anlamsız.
  Oturum "Ev" ile biter.
- Hiçbir şey IndexedDB'ye yazılmaz (`events` dahil).

**Veli paneli [9] — içerik listesi (ilk sürüm, bu kadarı ZORUNLU, fazlası değil):**

1. Tema bazında ilerleme: 7 tema satırı × düğüm durumu (tohum/filiz/çiçek/meyve
   sayıları). Yüzde ve puan YOK — çocuğa yasak olan gösterim veliye de gösterilmez,
   veli çocuğa söyler.
2. "Zorlandığı konular": `struggling` durumundaki düğümlerin `childLabel` listesi +
   evde ne yapılabileceğine dair tek cümlelik öneri (içeriği `tr.json`'dan).
3. Ayarlar: `readingLevel` (§6.3) · okul ayı (§6.5) · cihaz profili geçersiz kılma
   (§3.1) · ses hızı.
4. Yedekleme: dışa/içe aktar (§10) + kalıcılık uyarı rozeti + depolama alanı.
5. "Kaynaklar" ekranı bağlantısı (§8 lisanslar).

**Alıştırma ekranı anatomisi** (yatay):

```
┌──────────────────────────────────────────────┐
│ [←]     ●●●●○○○○                             │  ÜST %12  — interaktif YOK
├──────────────────────────────────────────────┤
│      [ 7 elma — gruplu yerleşim ]   [🔊]     │  SORU %40 — tahtada dokunulmaz
├──────────────────────────────────────────────┤
│    ┌───┐  ┌───┐  ┌───┐  ┌───┐                │  SEÇENEK %35 ─┐ erişim bölgesi
├──────────────────────────────────────────────┤               │  (alt %65)
│ (maskot/yardım)              [ ✓ Onayla ]    │  ALT %13  ────┘
└──────────────────────────────────────────────┘
```

- **İlerleme göstergesi sayı içermez** — 8 boncuklu yol. Kalanın görünmesi öngörülebilirlik verir. Yanlışlar işaretlenmez.
- "Tekrar dinle" **her ekranda tam olarak aynı noktada.** Konum tutarlılığı ikon anlaşılırlığından güçlü bir öğrenme mekanizması.
- Seçenek sayısı: yıl başı 2 → 3 → yıl sonu 4. Asla 4'ten fazla.
- Seçenek kartları sabit ızgarada, her soruda yer değiştirmez — konum belleği çocuğun lehine.
- **Devre dışı buton gri değil, soluk** — dokunulunca sesle ne gerektiğini söyler. Sessiz devre dışı buton çocuk için "bozuldu" demektir.
- **Ampul ikonu yok** ("ampul = fikir" soyut yetişkin metaforu). Yardım = maskotun kendisi. Hamburger menü yok. Kaydırma yok.

**Veli kapısı:** "Aşağıdaki sayılara büyükten küçüğe dokunun", **yalnız metin**. Okuyamayan çocuk geçemez. ⚠️ Matematik işlemi kullanma — bu bir matematik uygulaması, çocuk çözer.

---

## 12. Proje Yapısı

Ağaç, hedef son durumu gösterir; `(✓)` bugün repoda var, `(⬜)` planlandı.

```
okulumsun/
├── .github/workflows/ci.yml        # (⬜) lint+test+validate+build, PR'da e2e (§14 adım 2b)
├── docs/
│   ├── meb-ilkokul-matematik-2024.pdf  # (✓) resmî kaynak
│   ├── meb-matematik-2024-metin.txt    # (✓) çıkarılmış metin, sayfa bölümlü
│   ├── mufredat-kisitlari.md           # (✓) İHLAL EDİLEMEZ sınırlar
│   ├── PLAN.md                         # (✓) bu belge
│   └── PROGRESS.md                     # (✓) plan ↔ kod durum raporu
├── src/
│   ├── content/                    # SAF VERİ (✓)
│   │   ├── kazanimlar.json         # 19 resmî çıktı + tema/saat
│   │   ├── skills.json             # 57 mikro düğüm + DAG + şablon eşlemesi (TEK KAYNAK)
│   │   ├── tr.json                 # UI metinleri + speech key'ler
│   │   ├── senaryolar.json         # (⬜) günlük yaşam problemleri (M-ISLEM-HIKAYE)
│   │   ├── hints.json              # (⬜) yapay zeka üretimi, insan onaylı
│   │   ├── misconceptions.json     # (✓) 15 hata etiketi kataloğu
│   │   └── schema/                 # (✓) Zod sınır doğrulayıcıları
│   ├── exercises/                  # DETERMİNİSTİK JENERATÖRLER
│   │   ├── types.ts rng.ts distractors.ts   # (✓) sözleşme + tohumlu RNG + çeldirici
│   │   ├── registry.ts             # (⬜) şablon kimliği → jeneratör haritası
│   │   └── templates/              # 4/40 şablon (✓ say, karsilastir, ritmik, toplaGorsel)
│   ├── progress/                   # (⬜) mastery.ts scheduler.ts session.ts (§6)
│   ├── persistence/                # (⬜) db.ts repository.ts backup.ts migrations/ (§10)
│   ├── audio/                      # (✓) speech.ts useSpeak.ts audioManifest.generated.ts
│   ├── design/                     # (✓) tokens.ts deviceProfile.ts useDeviceProfile.ts
│   ├── ui/
│   │   ├── primitives/             # (✓) BigButton SpeakButton ChoiceCard
│   │   ├── svg/                    # (✓ kısmen) Visual Sprite positions · (⬜) Rakam OnlukCerceve SayiDogrusu Terazi Banknot
│   │   ├── feedback/               # (⬜) HintPanel Celebration Maskot
│   │   ├── layout/                 # (✓) GameShell
│   │   └── screens/                # (✓) AudioUnlock ExerciseScreen TapCount TapToPlace · (⬜) AnaEkran Bahcem VeliPaneli KonuSecimi
│   ├── store/                      # (⬜) Zustand: session.ts progress.ts settings.ts
│   └── dev/                        # (✓) BoardHarness.tsx AudioProbe.tsx (§13)
├── scripts/                        # (✓) generate-audio, audit-audio, validate-content, fetch-fonts · (⬜) generate-content
├── public/
│   ├── audio/{sayi,op,nesne,renk,soru,tema,ui,geri,yardim}/   # (✓) 171 klip
│   └── fonts/                      # (✓) Andika latin + latin-ext
└── tests/{unit,e2e}/               # (✓) generators.spec, board-geometry.spec
```

**İçerik ayrı JSON'da.** Bir öğretmen/editör/script JSON üretebilir, TypeScript üretemez · `validate-content.ts` çapraz referansları doğrular · **kod deploy etmeden içerik güncellenebilir** · tip güvenliği Zod `z.infer` + üretilen union tipleriyle korunur.

---

## 13. Akıllı Tahta Erişimi Olmadan Doğrulama

Tahta 1 ay yok. Bu, tahta katmanını **ertelemek** için değil, **yazılımsal olarak korumak** için bir sebep — yoksa bir ay boyunca sessizce ihlal edilir ve sonradan her ekranı elden geçirmek gerekir.

**Üç katmanlı koruma:**

1. **`?device=board` geçersiz kılma.** Herhangi bir tarayıcıda tahta profili zorlanır. 1920×1080 tam ekranda geliştirme yapılabilir.
2. **`src/dev/BoardHarness.tsx`** (yalnız geliştirmede): erişim bölgesi sınırını (üst %35) yarı saydam kırmızı bantla çizer, tüm dokunma hedeflerinin gerçek boyutunu gösterir, 6 m mesafe simülasyonu için sayfayı %20'ye küçültüp okunabilirlik kontrolü yaptırır.
3. **Playwright geometri testi** (CI'da her değişiklikte): 1920×1080 `board` profilinde her ekranı gezer ve **hiçbir interaktif öğenin ekranın üst %35'inde olmadığını**, hiçbirinin 102px'den (64×1.6) küçük olmadığını doğrular. Bu test, elle test edilemeyen kuralı otomatik olarak korur.

**Bu bir aydaki elle doğrulama** tablet ve masaüstü tarayıcıda yapılır — bunlar zaten 2. ve 3. öncelik. **Fiziksel tahta doğrulaması 2. aya planlanır** ve şunları içerir: gerçek IR dokunma isabeti, kalibrasyon kayması, sınıfın arkasından okunabilirlik, tarayıcı sürümü uyumluluğu (bazı tahtalar eski Android WebView), çocuğun fiziksel erişimi.

⚠️ Risk açıkça kaydediliyor: bu üç katman geometriyi korur ama **fiziksel dokunma isabetini ve gerçek okunabilirliği kanıtlayamaz.** 2. aydaki test bulgularına göre `tokens.ts`'te ölçek ayarı gerekebilir — mimari bunu tek dosyadan değiştirilebilir kılacak şekilde kuruluyor.

---

## 14. İnşa Sırası

İlke: **en riskli parçayı önce kanıtla.** Kabuk işleri sona.

Her adımın **"Bitti tanımı"** vardır: listedeki her madde doğrulanmadan adım kapanamaz
ve bir sonraki adıma geçilemez. Durum sütunu bu repodaki gerçeği yansıtır; bir adımı
bitiren, bu tabloyu ve `docs/PROGRESS.md`'yi aynı commit'te günceller.

| # | İş | Durum | Bitti tanımı |
|---|---|---|---|
| 0 | Vite iskeleti, `tokens.ts`, `deviceProfile.ts`, `BoardHarness`, tek `BigButton` | ✅ | `npm run build` geçer; `?device=board` üç profili değiştirir; BoardHarness erişim bölgesini çizer |
| 1 | **Ses altyapısı:** `generate-audio.ts`, `SpeechService`, ses kilidi, 0–100 sayı klipleri | ✅ | 171 klip diskte; `npm run audio:audit` temiz; `speak({kind:'sequence'})` çalışır; ekran değişiminde ses kesilir |
| 2 | **İlk 4 jeneratör, saf TS, UI yok:** `M-SAY`, `M-KARSILASTIR`, `M-TOPLA-GORSEL`, `M-RITMIK` | ✅ | Property-based testler geçer (determinizm, tek doğru, ≤20, müfredat üçlüleri); `npm run validate` temiz |
| 2b | **CI kurulumu** (`.github/workflows/ci.yml`): push'ta `lint + test + validate + build`, PR'da ek olarak `e2e` (tahta geometrisi) | ⬜ | CI yeşil; geometri ihlali içeren kasıtlı commit CI'da KIRMIZI yanar (tuzak testiyle kanıtla) |
| 3 | SVG manipülatifler: `NesneKümesi` (yerleşim algoritması §8), `OnlukÇerçeve`, `SayıDoğrusu`, `Rakam` (10 özel glif §3.4), `SeçenekKartı` | ✅/⚠ | 4 şablonun ihtiyacı karşılandı (`Visual.tsx`, `positions.ts`); Rakam glifleri MEB dik temel formuna göre ELDEN GEÇİRİLMEDİ — Adım 10 öncesi doğrula |
| 4 | **Alıştırma ekranı** — uyaran + seçenek + seç/onayla + geri bildirim (§11 anatomi) | ✅ | 4 şablon ekranda oynanır; e2e tahta geometri testi geçer; **ilk gerçek çocuk testi burada yapılabilir** |
| 5 | **Oturum motoru:** `src/progress/` → `mastery.ts` (§6.1 formüller + Leitner + yakınlık `q`), `scheduler.ts` (§6.4 kovalar + 5 sert kural), `session.ts` (8 soru yaşam döngüsü) | ⬜ | §15'teki ustalık senaryo testleri geçer; kova oranları 1000 simüle oturumda ±%5 tutar; sert kuralların her biri birim testli |
| 6 | **Yardım akışı:** 3 kademe (§7.2) + hareketsizlik sayacı + hata taksonomisi bağlama (`diagnosticTag` → `remediation` kovası §6.6) | ⬜ | K1/K2/K3 senaryo testli; `GOREV_ANLASILMADI` ustalığı ETKİLEMEZ (testle kanıtla); 15/30/30 sn zamanlayıcılar ekran değişiminde sıfırlanır |
| 7 | Maskot durumları (6 poz §7.5) + kutlama + Bahçem (§7.4) | ⬜ | Maskot 6 duruma geçer; kutlama ≤2 sn ve atlanabilir; çıkartma oturum SONUNA bağlı (doğru sayısına değil, testle) |
| 8 | İlk açılış, mod seçimi, avatar, ana ekran (7 tema), tahta modu konu seçimi ([4b] §11), veli kapısı + panel (§11 liste) | ⬜ | §11 akışının tamamı gezilebilir; veli paneli 5 kalemi içerir; tahta modunda IndexedDB'ye yazılmadığı testle kanıtlı |
| 9 | **Kalıcılık + PWA:** `src/persistence/` (§10 store'lar, `active_session`, migrasyon iskeleti, yedek), `vite-plugin-pwa` precache, `storage.persist()` | ⬜ | Çevrimdışı tam oturum e2e geçer; yedek dışa/içe aktarım e2e geçer; sayfa yenilenince duraklatılmış oturum kaldığı sorudan sürer; Lighthouse PWA kurulabilir raporu |
| 10 | **Kalan 36 şablon** (§5.2'de ⬜ olanlar) + gerektirdikleri ses kümeleri (§4.5) + SVG varlıklar (banknot, terazi, ızgara, çetele) | ⬜ | Tema sırasına göre parti parti: T1 (3) → T2 kalanı (5) → T4 (9) → T3 (4) → T5 (2) → T6 (6) → T7 (4). Her şablon: jeneratör + property testi + ses klipleri + ekranda oynanabilir + `validate` temiz. 19 kazanımın TAMAMI kapsanınca kapanır |
| 11 | **Dağıtım:** statik host (GitHub Pages veya Netlify) + `LICENSES.md` + "Kaynaklar" ekranı (§8) | ⬜ | Ürün herkese açık URL'de; çevrimdışı ikinci ziyaret çalışır; USB'den `file://` ile açılış denendi (PWA hariç çalışmalı) |
| 12 | Erişilebilirlik denetimi + **5 gerçek çocukla tablet testi** + düzeltme | ⬜ | §15 elle doğrulama listesi işlenmiş; bulgular `docs/`e not edilmiş |
| 13 | *(2. ay)* Fiziksel akıllı tahta doğrulaması + ölçek ayarı | ⬜ | §13'teki fiziksel test listesi; gerekirse yalnız `tokens.ts` ayarı |

Adım 10, ilk tahmindeki "13 şablon / 6–7 gün"den **36 şablon / ~3 haftaya** büyüdü
(şablonların incelmesi §5.2). Toplam tahmin: **7–9 hafta / tek geliştirici.**
Sıra bilinçli: kalıcılık (9), şablon seline (10) girmeden ÖNCE gelir — 36 şablon
boyunca her oturum gerçek veri üretir ve motor gerçek koşulda pişer.

**Sonraya bırakılanlar:** Türkçe ve Hayat Bilgisi dersleri (altyapı hazır, veri eklenerek gelir), tanılayıcı test, çoklu profil, öğretmen/sınıf modu.

---

## 15. Doğrulama

### Otomatik testler

```bash
npm test
```

| Ne | Nasıl | Neden kritik |
|---|---|---|
| Soru jeneratörleri | Vitest **property-based**, 10.000 tohum: cevap doğru mu, sonuç ≤20 mi, negatif var mı, çeldirici cevaba eşit mi, ritmik üçlü müfredat listesinde mi, aynı tohum → birebir aynı soru mu | Bir aritmetik hatası 6 yaşındaki çocuğa yanlış öğretir |
| Ustalık motoru | Senaryo testleri (asgari liste): ① aynı gün 3 doğru → `mastered` DEĞİL (distinctDays) ② 2 farklı günde 3'lü seri + strengthEff ≥0.85 → `mastered` ③ tek yanlış strength'in en çok %30'unu siler ④ 32 gün cevapsız box-5 düğüm → `rusty` ⑤ aynı gün 10 doğru kutuyu EN ÇOK 1 yükseltir ⑥ `GOREV_ANLASILMADI` cevabı strength/attempts'i DEĞİŞTİRMEZ ⑦ yakınlık şablonunda q asla 0 olmaz | Yanlış ölçüm = yanlış içerik = ürün amacını kaçırır |
| Oturum seçici | 1000 simüle oturum: kova oranları ±%5; sert kuralların (§6.4) her biri ihlal senaryosuyla test edilir (ör. 2 ardışık yanlış → 3. soru `warmup` MI) | Seçici hataları sessizce yanlış zorlukta soru gösterir |
| Migrasyon | `fixtures/progress-v1.json` → v2 → doğrula | Veri kaybı geri alınamaz |
| İçerik bütünlüğü | `validate-content.ts`: DAG'da çevrim, eksik `imageId`/`speechKey`, kazanım referansları | Projedeki en çok hata yakalayan araç |
| **Müfredat kapsamı** | 19 resmî kazanımın **her biri** en az bir şablona bağlı mı | Müfredat uyumu iddiasının tek kanıtı |
| Tahta geometrisi | Playwright, 1920×1080 `board`: üst %35'te interaktif öğe yok, hedefler ≥102px | Elle test edilemeyen kuralın tek koruması |

**CI (`.github/workflows/ci.yml`, §14 adım 2b):** her push'ta `npm run lint && npm test
&& npm run validate && npm run build`; PR'da ek olarak Playwright e2e. "CI'da doğrulanır"
diyen her kural ancak bu iş akışı kurulunca doğrulanmış sayılır.

### Uçtan uca (Playwright)

`tests/e2e/`: ilk açılış → mod seçimi → 8 soruluk oturum · çevrimdışı (network kapalı) tam oturum · yedek dışa/içe aktar.

### Elle doğrulama

```bash
npm run dev
```

1. **`?device=board` + 1920×1080 tam ekran + `BoardHarness`:** erişim bölgesi ihlali var mı, %20'ye küçültünce hâlâ okunuyor mu.
2. **Ses:** cihaz sessizken uygulama kullanılabilir mi (görsel yönergeler yeterli mi). Ekran değişiminde önceki talimat kesiliyor mu.
3. **Gerçek tabletle parmak testi** — ekran görüntüsü yeterli değil, hedefler fiziksel denenmeli.
4. **`prefers-reduced-motion` açıkken** tüm geri bildirim anlaşılıyor mu.
5. **5 gerçek 1. sınıf öğrencisiyle test**, adım 4'ten sonra, kod kilitlenmeden önce. Planın en değerli doğrulama adımı.
6. **2. ay: fiziksel akıllı tahta** (§13).

---

## 16. Açık Riskler

1. **Fiziksel tahta doğrulanmamış** (1 ay). §13'teki üç katman geometriyi korur, dokunma isabetini kanıtlamaz. `tokens.ts` tek noktadan ayarlanabilir tutuluyor.
2. **ElevenLabs ücretsiz katmanı**nın üretilen sesi uygulamada dağıtma iznini veriyor mu — yayın öncesi şartlar okunmalı. Vermiyorsa Piper tek başına yeterli (lisansı net).
3. **Piper kurulumu** Python 3.9 ile uyumlu mu; değilse `python3.11` veya `edge-tts` alternatifi.
4. **`MAT.1.1.9` banknot görselleri** — TCMB koruması nedeniyle stilize temsil çizilmeli. Projedeki tek gerçek varlık riski.
5. **`MAT.1.4.1` (veriye dayalı araştırma)** doğası gereği çok adımlı ve sınıf ortamına dönük — tek kişilik dijital alıştırmaya indirgenmesi programın ruhunu tam karşılamayabilir. Sadeleştirilmiş bir versiyon yapılıp sınırı açıkça kaydedilecek.
6. **Tarayıcı depolama tahliyesi.** `storage.persist()` + PWA kurulumu + yedek (§10) riski azaltır ama sıfırlamaz; özellikle kurulmamış iOS Safari'de 7 gün kuralı yılın verisini silebilir. Karşı önlem davranışsal: veli panelindeki yedek uyarısı ve "ana ekrana ekle" yönergesi.
7. **Hata görünürlüğü yok.** Tamamen çevrimdışı üründe telemetri yok; sınıfta çökerse kimse bilmez. İlk sürüm kararı: `window.onerror` → `events` store'una yerel kayıt + veli panelinde "sorun bildir" (hata özetini panoya kopyalar). Uzak toplama BİLİNÇLİ olarak yok (KVKK ve okul ağı kısıtları).
8. **Kişisel veri notu.** Uygulama ad/soyad, fotoğraf, konum, hesap İSTEMEZ; tüm veri cihazda kalır, hiçbir sunucuya gitmez. Bu, KVKK yükünü pratikte sıfıra indirir ama okula resmî sunumda yazılı olarak beyan edilmeli — "Kaynaklar" ekranına tek paragraf gizlilik beyanı eklenir (§14 adım 11).
