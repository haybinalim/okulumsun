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
   `docs/mufredat-kisitlari.md` (müfredat sınırları — ihlal edilemez; Türkçe ders paketi için
   `docs/mufredat-kisitlari-turkce.md`, ADR-0016)
   → `src/content/skills.json` (beceri düğümleri + şablon eşlemesi)
   → `src/exercises/types.ts` (veri modeli sözleşmesi)
   → kabul edilmiş ADR'ler (`docs/ADR/`, durumu `Kabul` olanlar)
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
5. **Yasaklar (özet — gerekçeleri ilgili bölümlerde):** `Math.random()` (§5.3; K9 ile CI'da: `npm run gizlilik:tara`) ·
   sürükle-bırak (§3.2) · kırmızı renk / `X` / buzzer / "yanlış" kelimesi (§7.1) ·
   çalışma anında yapay zeka çağrısı (Context) · `<` `>` karşılaştırma sembolleri,
   saat okuma, çarpma/bölme/kesir (mufredat-kisitlari §3) · TÜMÜ BÜYÜK HARF ve
   `toLocaleUpperCase('tr')` dışı büyütme (§3.4) · Lucide/Phosphor ikonları (§8) ·
   OpenMoji (§8 lisans) · sonucu 20'yi aşan işlem.
6. **Dil.** Kod yorumları, commit mesajları ve kullanıcıya görünen tüm metin Türkçe.
7. **Yeni şablon eklerken** §5.5'teki 8 adımlı reçeteyi harfiyen izle. Kısa hâli:
   ses anahtarları → gerekçe bloğu → saf jeneratör → property testi → kayıt defteri
   (§5.4) → ekran → doğrulama zinciri.
8. **Bir şeyi burada bulamıyorsan uydurma.** Plan bir sayı, eşik veya kural için sessizse
   bu bir eksiktir: önce bu belgeye gerekçesiyle yaz, sonra kodla. "Uygulayıcının
   takdirine bırakıldı" diyen tek bir yer yoktur; varsa hatadır ve kapatılmalıdır.

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
| Kalıcılık | **IndexedDB** (kendi ince sarmalayıcı, ADR-0015; biçim Dexie v1 ile aynı) | `localStorage` yalnız `activeProfileId`, `schemaVersion`. |
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

Ayarlarda **elle geçersiz kılma zorunlu**: bazı tahtalar 1920×1080 bildirir ama fiziksel olarak 86"; otomatik tespit güvenilmez. Ayrıca geliştirme için `?device=board` URL parametresi. Elle geçersiz kılma ✓ (Adım 27): yetişkin alanı → "Ekran boyutu" (Otomatik / Akıllı tahta / Tablet / Telefon), tek izinli `localStorage` anahtarı `okulumsun.deviceOverride`, yenilemede kalıcı; URL parametresi ayardan önce gelir.

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

**Font: çocuğa dönük metin MEB TYMM 2024 TemelYazi (dik temel), yetişkin metni Andika (KG-96).** Çocuğun gördüğü ekranlar ve basılan kâğıtlar (arşiv, etki formları) harfleri de MEB'in resmî temel yazı fontu TemelYazi'den alır: tek katlı `a`, MEB'in kuyruklu harf formları, tam Türkçe. Alt küme `public/fonts/TemelYazi-Harf.woff2` (TemelYazi-Bold konturları; `scripts/rakam-glif-uret.py`), `src/index.css` `'TemelYazi'` (400, `size-adjust: 120%` — TemelYazi'nin x yüksekliği 0,35 em, Andika 0,50; 700'de sentetik kalınlaştırma), yığın `'TemelYazi', 'TemelYaziRakam', 'Andika', …` (`--font-sans`, `kagit.css`; SVG `<text>` için size-adjust'sız `'TemelYaziSvg'`, `FONT_YIGINI`). Regular (gövde 47/1000 em) 12–20 px'te kılcal kaldığı için dağıtılmaz. Hangi ekranın yetişkine dönük olduğu `src/design/yaziYuzeyi.ts`'tedir (öğretmen/veli alanı, `[data-yazi='yetiskin']` ve `[data-yetiskin]` → `--font-yetiskin`: harfler Andika, rakamlar TemelYaziRakam); /ogretmen, /gizlilik ve kâğıt arşivi dizini de Andika'dadır.

**Andika (SIL OFL 1.1), self-host** — yetişkin metni ve yedek (TemelYazi'de olmayan `[ ] { } # $ – — … ·`). Okuryazarlık öğretimi için tasarlandı; **tek katlı `a` ve `g`**. Tam Türkçe (`ı İ ş ğ ç ö ü`). `latin-ext` alt kümesi dahil edilmezse `ğ ş İ` tofu çıkar.

Kullanılmayacak: Nunito, Comic Sans, Verdana, Arial, Lexend, Atkinson Hyperlegible — hepsi çift katlı `a`. MEB'in dolaşımdaki resmî olmayan "Dik Temel" kopyaları (kaynağı belirsiz). MEB TTKB'nin 2024'te yayımladığı **TemelYazi** bu yasağın dışındadır (KG-95/96): kaynağı resmî duyuru; lisans metni yok, ticari kullanım için yazılı izin kullanıcıda.

**Rakamlar (0–9) MEB'in resmî temel yazı fontu TemelYazi'den (KG-95).** MEB TTKB, Türkiye Yüzyılı Maarif Modeli (2024) kapsamında ders kitapları ve eğitim araçları için "TemelYazi" fontunu (HBY Tasarım) yayımladı ([duyuru](https://ttkb.meb.gov.tr/www/ilkokulturkcedersiogretimprogramiveilkokumayazmaderskitabindayeralanalfabeverakamlaryayimlandi/icerik/610)). MEB formu: bayraklı, tabansız `1`; açık üstlü `4`; **ortası çizgili `7`** (eski "çizgisiz 7" varsayımı yanlıştı). Ekrandaki `Rakam` bileşeni TemelYazi-Bold konturlarından üretilmiş dolgulu SVG path çizer (`src/ui/svg/rakamGlifleri.ts`, üretici `scripts/rakam-glif-uret.py`); metin ve kâğıtlardaki rakamlar ile `+ − = < >` yalnız bu karakterleri içeren alt küme fonttan gelir (`public/fonts/TemelYazi-Rakam.woff2`, `'TemelYaziRakam'`, unicode-range; yetişkin yığınında Andika harfleriyle; çocuk yığınında rakamlar da harf dosyasından, KG-96). Fontta lisans metni yok: ticari dağıtım ve açık repo için MEB TTKB/tasarımcıdan yazılı izin önerilir (`public/fonts/LICENSE.md`).

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
| **Piper TTS** (`tr_TR-fahrettin-medium`) | ⛔ Kullanılmaz — ADR-0004 | **Üretimde kullanılmaz** (Adım 15): `fahrettin`/`fettah` 30 Ara 2025'te katkı verenlerin isteğiyle kaldırıldı, `dfki` CC BY-NC-SA. Kökeni bilinmeyen eski 287 klip 28 Eki 2026'da Google Cloud TTS Chirp 3 HD ile sıfırdan yeniden üretildi (Adım 31). Bkz. `docs/ses/SES_KAYNAKLARI.md`, §16 risk 2–3 |
| **Google Cloud TTS, Chirp 3 HD `tr-TR`** | ✅ Karar (KG-01) — ADR-0004 `Kabul` (28 Eki 2026): ses `tr-TR-Chirp3-HD-Puck`, hız 0,9 (KG-107) | **Üretim kaynağı — aktif** (Adım 31, 28 Eki 2026; `google:tr-TR-Chirp3-HD-Puck@2026-10`). Yalnız derleme anında; ayda 1M karakter ücretsiz (betik 900.000'de durur, KG-109); üretilen sesin uygulamada kullanımına izin. İstemci `scripts/ses/googleTts.ts`, örnekler `npm run audio -- --ornek`. |
| **ElevenLabs** | ⛔ Kullanılmaz (KG-01, ADR-0004) | Çağrılırsa betik hata verir. Maskot sesi ayrı karar (Adım 54). |

Hat, `src/content/tr.json`'u tarar, yalnız **hash'i değişen** anahtarları yeniden üretir, `audioManifest.generated.ts` + `SpeechKey` union tipini yazar. Sağlayıcı `src/content/sesKaynagi.json`'daki aktif kaynaktan gelir; model kimliği özete girer (Adım 15).

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

Mevcut manifest (**171 klip**, diskte doğrulandı): `sayi.0–100` (101), `op.*` (4),
`nesne.*` (10), `renk.*` (6), `soru.*` (14), `ui.*` (14), `geri.*` (9), `yardim.*` (6),
`tema.*` (7). Bu envanter ilk 4 şablonu karşılar; **kalan şablonlar için şu kümeler
ÜRETİLMEDEN o şablon yazılamaz** (jeneratör zaten DERLENMEZ: `SpeechKey` bir union tiptir
ve manifestte olmayan anahtar tip hatası verir — bu, unutmayı imkânsız kılan bir korumadır).

| Klip kümesi | Anahtarlar | Gereken şablon | Adet |
|---|---|---|---|
| Sıra sayıları | `sira.1` … `sira.20` ("birinci"…"yirminci") | `M-SIRA-SAYI` | 20 |
| Yön | `yon.ileri`, `yon.geri`, `yon.saga`, `yon.sola`, `yon.yukari`, `yon.asagi` | `M-YONERGE` | 6 |
| Konum | `konum.altinda`, `konum.ustunde`, `konum.icinde`, `konum.onunde`, `konum.arkasinda`, `konum.arasinda`, `konum.yaninda`, `konum.disinda` | `M-KONUM` | 8 |
| Adım | `adim.bir-adim`, `adim.iki-adim`, `adim.uc-adim`, `adim.dort-adim`, `adim.bes-adim` | `M-YONERGE` | 5 |
| Para | `para.lira`, `sayi.200` (manifestte yok) | `M-PARA-TANI`, `M-PARA-SIRALA` | 2 |
| Şekil adları | `sekil.ucgen`, `sekil.kare`, `sekil.dikdortgen`, `sekil.cember`, `sekil.yuvarlak`, `sekil.koseli`, `sekil.kenar`, `sekil.kose` | `M-GEO-*` | 8 |
| Ölçme | `olcme.uzun`, `olcme.kisa`, `olcme.agir`, `olcme.hafif`, `olcme.atac`, `olcme.karis`, `olcme.blok` | `M-OLC-*` | 7 |
| Karşılaştırma ek | `kiyas.daha-cok`, `kiyas.daha-az`, `terim.esit`, `terim.esit-degil` | `M-KARSILASTIR` (şık sesleri) | 4 |
| Veri | `veri.en-cok`, `veri.en-az`, `veri.kac-tane`, `veri.cetele`, `veri.tablo`, `veri.grafik` | `M-VERI-*` | 6 |
| Eşitlik/denge | `esit.dengede`, `esit.dengede-degil`, `esit.ayni-mi` | `M-ESIT-DENGE` | 3 |
| Örüntü | `oruntu.sirada-ne-var`, `oruntu.devam-ettir` | `M-ORUNTU-*` | 2 |
| Tahmin | `tahmin.kac-tahmin`, `tahmin.harika-tahmin`, `tahmin.yaklastin`, `tahmin.birlikte-sayalim` | tahmin şablonları | 4 |
| Şablon talimat cümleleri | Şablon başına 1–3 tam cümle (`soru.*`) | 35 şablon | ≤ 90 |

**Toplam yeni klip: 75 sabit + en çok 90 talimat cümlesi ≈ 165.** Toplam manifest yaklaşık
336 klipte kapanır. Şablon başına talimat cümlesi listesi, o şablon yazılırken §5.5 adım 2'de
`tr.json`'a eklenir — hepsini önceden yazmak, yazılmayan şablonlar için ölü klip üretir.

Üretim akışı değişmez: anahtarı `src/content/tr.json`'a ekle → `npm run audio`
(yalnız hash'i değişeni üretir) → manifest ve `SpeechKey` tipi kendini günceller →
`npm run audio:audit` ile diskteki dosya ↔ manifest eşleşmesini doğrula.
**Sayı birleştirme kuralı geçerli:** sıra sayıları, yönler ve konum ifadeleri TAM KELİME
klipleridir, parçadan birleştirilmez (§4.3'teki prozodi kuralı).

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
> tek şablon ilkesiyle **39 ince şablona** bölündü (ör. eski `M-VERI` dört
> aşamasının her biri ayrı ekran ve ayrı ölçüm gerektirdiği için 4 şablona ayrıldı).
> Tabloda ✅ = jeneratör yazıldı, ⬜ = `skills.json`'da tanımlı, jeneratör bekliyor.

**Tema 1 — Geometri (1):**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-KONUM` | `MAT.1.3.1` | ✅ | Konum ifadeleri: altında/üstünde/içinde/önünde/arasında; sesi dinle, doğru sahneyi seç |
| `M-YONERGE` | `MAT.1.3.1` | ✅ | Izgarada karakteri sesli yönergeyle hedefe götür ("iki adım ileri, sonra sağa"). Yön klipleri gerekli (§4.5) |
| `M-ESLIK` | `MAT.1.3.2` | ✅ | İki nesne üst üste bindirilerek eş mi değil mi |

**Tema 2 — Sayılar ve Nicelikler (1):**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-SAY` | `MAT.1.1.1`, `.2`, `.7` | ✅ | **İki aşamalı:** önce dokunarak say, sonra rakam seç. Dokunma doğru/rakam yanlış = kardinalite sorunu. `layout: dağınık` sayma stratejisini ortaya çıkarır |
| `M-RAKAM-TANI` | `MAT.1.1.1` | ✅ | Sesi dinle ("yedi"), rakam glifini seç |
| `M-ONLUK-COZUMLE` | `MAT.1.1.1`, `.2` | ✅ | 11–20 arası sayıyı onluk+birlik olarak çözümle (onluk çerçeve) |
| `M-SIPSAK` | `MAT.1.1.2`, `.7` | ✅ | Şipşak sayılama (subitizing): düzenli küme ≤1 sn gösterilir, saymadan tanınır |
| `M-SIRA-SAYI` | `MAT.1.1.3` | ✅ | Sıradaki kaçıncı (birinci…onuncu). Sıra sayısı ses klipleri ZORUNLU (§4.5) |
| `M-KARSILASTIR` | `MAT.1.1.4` | ✅ | çok / daha çok / az / daha az / eşit. Boyut-çeliştirmeli maddeler zorunlu (büyük nesne ≠ çok). Sembol YASAK |
| `M-RITMIK` | `MAT.1.1.5` | ✅ | Dizide eksik sayı. Geçerli (yön, adım, sınır) üçlüleri YALNIZ mufredat-kisitlari §2'dekiler — genel jeneratör yazma |
| `M-ORUNTU-SAYI` | `MAT.1.1.6` | ✅ | Artan/azalan sayı örüntüsünde verilmeyen terim; en çok 6 terim |
| `M-ORUNTU-SEKIL` | `MAT.1.1.6` | ✅ | Tekrar eden şekil örüntüsünü sürdür |
| `M-TAHMIN-MIKTAR` | `MAT.1.1.7` | ✅ | Küme ~2 sn gösterilir, çocuk tahmin eder, sonra birlikte sayılır. **Doğru/yanlış yok — yakınlık ölçülür** (puanlama: §6.1) |

**Tema 3 — Ölçme:**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-OLC-UZUNLUK` | `MAT.1.1.8` | ✅ | İki nesnenin boyunu kıyasla (uzun/kısa) |
| `M-OLC-KUTLE` | `MAT.1.1.8` | ✅ | Terazi görseliyle ağır/hafif kıyası |
| `M-OLC-BIRIM` | `MAT.1.1.8` | ✅ | Standart olmayan birimle ölç: "kalem kaç ataç?" |
| `M-OLC-TAHMIN` | `MAT.1.1.8` | ✅ | Önce tahmin, sonra ölçüm; yakınlık ölçülür (§6.1) |

**Tema 4 — İşlemlerden Cebirsel Düşünmeye:**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-TOPLA-GORSEL` | `MAT.1.2.1`, `.2` | ✅ | Onluk çerçeve / küme modelleriyle toplama, sonuç ≤20 |
| `M-TOPLA-SEMBOL` | `MAT.1.2.1`, `.2` | ✅ | `7 + 5 = ?` sembolik; görsel destek şıklarda |
| `M-TOPLA-ONA-TUMLE` | `MAT.1.2.2` | ✅ | 10'a tümleme: `8 + ? = 10` (onluk çerçeve) |
| `M-CIKAR-GORSEL` | `MAT.1.2.1`, `.2` | ✅ | Ayırma/geriye sayma modeliyle çıkarma |
| `M-CIKAR-SEMBOL` | `MAT.1.2.1` | ✅ | `9 − 4 = ?` sembolik; fark bulma dahil |
| `M-TAHMIN-ISLEM` | `MAT.1.2.2` | ✅ | Sonucu tahmin et, sonra zihinden doğrula; yakınlık ölçülür |
| `M-ESIT-DENGE` | `MAT.1.2.3` | ✅ | Terazi metaforu: `7 = 3 + ?`, `4 + 3 = ? + 5`. **Programın vurguladığı, çoğu uygulamanın atladığı kazanım** |
| `M-EKSIK-TOPLANAN` | `MAT.1.2.3`, `.4` | ✅ | `3 + ? = 8` eksik toplanan |
| `M-TERS-ISLEM` | `MAT.1.2.4` | ✅ | `8 − 3 = 5` gösterilir, `5 + 3 = 8` kurulur (aynı sayı üçlüsü) |
| `M-ISLEM-HIKAYE` | `MAT.1.2.1` | ✅ | Sesli günlük yaşam problemi ("5 kuş vardı, 2'si uçtu"). Senaryolar `senaryolar.json`'dan |

**Tema 5 — Para:**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-PARA-TANI` | `MAT.1.1.9` | ✅ | Banknot tanıma (1–200 TL, stilize görsel §8). **Toplama YASAK** — kazanım sadece tanıma |
| `M-PARA-SIRALA` | `MAT.1.1.9` | ✅ | Banknotları değer büyüklüğüne sırala |

**Tema 6 — Geometri (2):**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-GEO-AYIR` | `MAT.1.3.3` | ✅ | Günlük nesneleri yuvarlak/köşeli ayır |
| `M-GEO-ESLE` | `MAT.1.3.3` | ✅ | Nesneyi biçimce benzediği şekille eşle |
| `M-GEO-KENAR-KOSE` | `MAT.1.3.4` | ✅ | Kenar/köşe sayısıyla şekli tanımla |
| `M-GEO-YAPI` | `MAT.1.3.4` | ✅ | Ev/robot resmindeki şekilleri bul (hotspot) |
| `M-GEO-ADLANDIR` | `MAT.1.3.5` | ✅ | Üçgen/kare/dikdörtgen/**çember** adlandır ("daire" deme) |
| `M-GEO-SINIFLA` | `MAT.1.3.5` | ✅ | Şekilleri sınıfla; öğelerin ≥%40'ı döndürülmüş — prototip hatasını hem ölçer hem düzeltir |

**Tema 7 — Veri:**

| Şablon | Kazanım | Durum | Not |
|---|---|---|---|
| `M-VERI-GRUPLA` | `MAT.1.4.1` | ✅ | Karışık nesneleri kategoriye grupla (dokun-seç → dokun-yerleştir) |
| `M-VERI-CETELE` | `MAT.1.4.1` | ✅ | Sayarak çetele işaretle |
| `M-VERI-SIKLIK` | `MAT.1.4.1` | ✅ | Çeteleden sıklık tablosu doldur |
| `M-VERI-GRAFIK` | `MAT.1.4.1` | ✅ | Nesne grafiğini oku, soruyu cevapla ("en çok hangisi?") |

**39 şablon, 19 kazanımın tamamını ve 57 beceri düğümünü kapsıyor** (kanıt:
`npm run validate` müfredat kapsamını doğrular). 39 jeneratör yazıldı, **0 bekliyor**.
Sayı `src/content/skills.json`'daki BENZERSİZ `exerciseTemplates` değerlerinden sayılır;
değiştiğinde bu cümle ve §14 adım 10 aynı commit'te güncellenir.

**Şablon → etkileşim biçimi (`Exercise.kind`) eşlemesi.** Jeneratör hangi `Exercise`
dalını üreteceğini burada bulur; bu seçim keyfî değildir, `Validation` dalını ve ekran
bileşenini belirler. `ExerciseScreen` yalnız işaretli biçimleri bağlar; yeni bir biçim
ilk kez kullanılıyorsa ekranını yazmak o şablonun işidir (§5.5 adım 7).

| `kind` | Ekran | Şablonlar |
|---|---|---|
| `AUDIO_TO_IMAGE` | ✅ var | `M-KONUM`, `M-ESLIK`, `M-RAKAM-TANI`, `M-SIPSAK`, `M-SIRA-SAYI`, `M-KARSILASTIR`, `M-TAHMIN-MIKTAR`, `M-TOPLA-GORSEL`, `M-TOPLA-SEMBOL`, `M-CIKAR-GORSEL`, `M-CIKAR-SEMBOL`, `M-TAHMIN-ISLEM`, `M-ISLEM-HIKAYE`, `M-PARA-TANI`, `M-GEO-ADLANDIR`, `M-GEO-KENAR-KOSE`, `M-OLC-UZUNLUK`, `M-OLC-KUTLE`, `M-OLC-BIRIM`, `M-OLC-TAHMIN`, `M-VERI-GRAFIK` |
| `TAP_COUNT` | ✅ var | `M-SAY`, `M-VERI-CETELE` |
| `TAP_TO_PLACE` | ✅ var | `M-RITMIK`, `M-ONLUK-COZUMLE`, `M-ORUNTU-SAYI`, `M-ORUNTU-SEKIL`, `M-ESIT-DENGE`, `M-EKSIK-TOPLANAN`, `M-TOPLA-ONA-TUMLE`, `M-VERI-GRUPLA`, `M-VERI-SIKLIK` |
| `MATCH_PAIRS` | ⬜ yazılacak | `M-GEO-ESLE`, `M-TERS-ISLEM` |
| `SEQUENCE_ORDER` | ⬜ yazılacak | `M-PARA-SIRALA`, `M-YONERGE` |
| `HOTSPOT_FIND` | ⬜ yazılacak | `M-GEO-YAPI`, `M-GEO-AYIR`, `M-GEO-SINIFLA` |
| `NUMBER_LINE` | ⬜ yazılacak | (ilk sürümde şablon atanmadı; `M-RITMIK`'in görsel varyantı olarak değerlendirilecek) |

Sıra da buradan çıkar: **`AUDIO_TO_IMAGE` şablonları önce yazılır** (ekranı hazır,
en hızlı geri dönüş), sonra `TAP_TO_PLACE`, en son yeni ekran gerektiren dört biçim.

### 5.3 Üretim ayrımı

> **Kural, mantık, sayı üretimi → kod. Kelime, senaryo, resim listesi → JSON.**

Matematikte şablonların **tamamı programatik** ya da **varlık-bağımlı programatik** (sonlu varlık seti + sonsuz kombinasyon). Yaratıcı içerik ihtiyacı çok düşük — matematik seçiminin ana getirisi bu.

Yapay zeka (geliştirme anında, `scripts/generate-content.ts`, insan onaylı):
- Günlük yaşam problem senaryoları (`MAT.1.2.1` — "5 kuş vardı, 2 tanesi uçtu")
- İpucu kütüphanesi: her `(kazanım × hata tipi × deneme)` için çocuk diliyle açıklama
- Nesne/sahne listeleri, kültürel uygunluk denetimi

**Yapay zeka kesinlikle matematik sorusu üretmez.** Deterministik jeneratörün üstünlüğü: %100 doğruluk, tohumla tekrar üretilebilirlik (test ve hata analizi mümkün), 0ms gecikme, sıfır maliyet, tam çevrimdışı. Aynı tohum → aynı soru → aynı kâğıt (Adım 35: çalışma kâğıdı ve cevap anahtarı aynı jeneratörlerden, saklanmadan yeniden üretilir). Bir aritmetik hatası 6 yaşındaki çocuğa yanlış öğretir.

### 5.4 Kayıt defteri ve tohum türetme

Planlayıcı bir `skillId` seçer; **soruyu üreten şey şablon kayıt defteridir.**
`src/exercises/registry.ts` bu iki dünyayı bağlayan TEK yerdir:

```ts
// src/exercises/registry.ts
export const REGISTRY: ReadonlyMap<TemplateId, ExerciseGenerator> = new Map([
  [M_SAY_TEMPLATE_ID, saySablonu],
  [KARSILASTIR_TEMPLATE_ID, karsilastirGenerator],
  [RITMIK_TEMPLATE_ID, M_RITMIK],
  [TOPLA_GORSEL_TEMPLATE_ID, toplaGorselJeneratoru],
]);
```

Kurallar (hepsi ZORUNLU):

1. **Yeni şablonun son adımı buraya eklenmektir.** Kayıtlı olmayan şablon `assetReady = 0`
   alır (§6.4) ve motor onu asla seçmez — yani yarım bir şablon uygulamayı kırmaz,
   sadece görünmez olur. Bu, 35 şablonu tek tek eklemeyi güvenli kılan mekanizmadır.
2. `validate-content.ts` şunu doğrular: `skills.json`'da `durum: "hazir"` olan her
   düğümün her `exerciseTemplates` kaydı defterde vardır. Tersi serbesttir (defterde
   olup düğümü `planlandi` olan şablon, geliştirme sırasında normaldir).
3. Bir düğümün birden çok şablonu varsa seçim `rng.pick` ile yapılır — ama önce
   `REGISTRY`de olmayanlar elenir.

**Madde tohumu (`seed`) türetme — deterministik ve tekrarsız.** Aynı çocuğa aynı soruyu
üst üste göstermemek ile "aynı tohum aynı soru" garantisini bir arada tutan tek formül:

```ts
seed = hash32(`${profilTohumu}|${skillId}|${templateId}|${dugumSayaci}`)
```

- `profilTohumu`: profil oluşturulurken bir kez üretilir, `learner_profile`'a yazılır.
  İki çocuk aynı sırayla aynı soruları görmesin diye vardır.
- `dugumSayaci`: bu düğümde şimdiye kadar sorulmuş madde sayısı (`attempts` değil —
  `GOREV_ANLASILMADI` maddeleri de sayaçta ilerler, yoksa aynı soru tekrar gelir).
- Üretilen `itemId` son 20 madde içinde varsa `dugumSayaci` bir artırılıp yeniden
  denenir (en çok 5 kez); hâlâ çakışıyorsa madde olduğu gibi kabul edilir. Küçük
  şablonlarda (ör. `M-ESLIK`) havuz gerçekten sınırlıdır; sonsuza dek denemek donma
  demektir.
- Tahta modunda `profilTohumu` yerine oturum başında üretilen geçici bir değer kullanılır
  (profil yok, §3.3).

### 5.5 Yeni şablon yazma — adım adım şablon

Bu bölüm, "35 şablon" işini birbirini görmeyen oturumlarda tekrarlanabilir kılar.
Kopyalanacak referans: `src/exercises/templates/karsilastir.ts` (en eksiksiz örnek).

1. **Oku:** `skills.json`'da şablonu isteyen düğümler, `docs/mufredat-kisitlari.md`'nin
   ilgili bölümü, `src/exercises/types.ts`'in ilgili `Validation` dalı.
2. **Ses anahtarlarını ekle:** §4.5 tablosundan bu şablonun kümesi → `src/content/tr.json`
   → `npm run audio`. Manifest ve `SpeechKey` tipi kendini günceller. **Bu adım atlanırsa
   jeneratör derlenmez** (`SpeechKey` union'ında anahtar yoktur).
3. **Dosya başına gerekçe bloğu yaz:** kazanım, müfredat sınırı, hangi mikro düğümleri
   ölçtüğü, çeldirici etiketlerinin mantığı, bilinen eksikler. Diğer modeller bunu okuyacak.
4. **Jeneratörü yaz:** saf fonksiyon, `Math.random()` yok, tüm rastgelelik `rng`'den ve
   ayrı alt akışlardan (`rng.fork('sahne')`, `rng.fork('celdirici')`). Her yanlış şık
   `diagnosticTag` taşır.
5. **Property-based test ekle** (`tests/unit/generators.spec.ts` düzenini kopyala):
   10.000 tohumda determinizm, tek doğru cevap, müfredat sınırı, `alistirmaIhlalleri(ex)`
   boş dizi döndürür, her yanlış şıkta etiket var.
6. **Kayıt defterine ekle** (§5.4) ve ilgili düğümlerin `durum`unu `hazir` yap.
7. **Ekranda oynat:** gerekiyorsa `ExerciseScreen`'e `kind` dalını bağla.
8. **Doğrulama zinciri:** `npm run lint && npm test && npm run validate && npm run build
   && npm run e2e`. Beşi de yeşil olmadan şablon bitmiş sayılmaz.

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

**Formüldeki her terimin tam tanımı.** Hiçbiri uygulayıcının yorumuna bırakılmamıştır:

| Terim | Tanım |
|---|---|
| `q = 1.00` | Doğru · hiç ipucu alınmadı · **hızlı** |
| `q = 0.85` | Doğru · hiç ipucu alınmadı · hızlı değil |
| `q = 0.45` | Doğru, ama K1 veya K2 yardımından sonra. **İlk deneme yanlış olan madde de buraya düşer** — §7.1'e göre ilk yanlıştan sonra K1 otomatik açılır, yani ikinci denemede verilen doğru cevap tanımı gereği ipuçludur |
| `q = 0.20` | Doğru, K3'ten (tam gösterim) sonra |
| `q = 0.00` | Madde yanlış kapandı (ikinci deneme de yanlış → doğru gösterildi) |
| *kayıt yok* | `GOREV_ANLASILMADI` etiketli madde. `strength`, `box`, `streak`, `attempts` **hiç dokunulmaz** (misconceptions.json `skorlamaYokSay: true`) |
| **hızlı** | `latencyMs ≤ exercise.estimatedSec · 1000`. Sabit bir saniye eşiği şablonlar arasında haksızlık olurdu; her madde kendi süre tahminini `ExerciseBase.estimatedSec` alanında zaten taşıyor |
| `zorlukKatsayısı` | `[0.8, 0.9, 1.0, 1.1, 1.2][difficulty − 1]` — **düğümün** `skills.json`'daki `difficulty` alanı (maddenin `difficulty`si değil). Zor düğümdeki doğru cevap daha güçlü kanıttır |
| `strength` | `[0, 1]` aralığında, yeni kayıtta `0`. Formül matematiksel olarak 1'i aşmaz, yine de yazmadan önce `clamp(0, 1)` uygulanır |
| `Δgün` | `gunAnahtari(bugün) − gunAnahtari(lastAnsweredAt)` tam gün farkı |
| `gunAnahtari` | **YEREL** saatle `YYYY-AA-GG`. UTC KULLANMA: 23:30'da çözülen soru ertesi güne yazılırsa `distinctDays` sahte biçimde şişer ve ustalık koşulu delinir |

**Sayaçların güncellenmesi** (madde kapandığında, tam bir kez):

| Sayaç | Kural |
|---|---|
| `attempts` | `+1` (yalnız `GOREV_ANLASILMADI` hariç) |
| `streak` | `q ≥ 0.85` → `+1` · `q = 0` → `0` · aradaki `q` (ipuçlu doğru) → **değişmez** (ne artar ne sıfırlanır) |
| `distinctDays` | `gunAnahtari(bugün) !== gunAnahtari(lastAnsweredAt)` ise `+1` |
| `lastAnsweredAt` | Her kayıtta güncel zaman damgası |
| `son6` | Son 6 maddenin `q ≥ 0.45` olup olmadığı — halka tampon, `struggling` tespiti için |

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

**`strength` mi `strengthEff` mi — iki sayının işi ayrıdır.** Bu ayrım karıştırılırsa
ustalık her gece kendiliğinden bozulur; aşağıdaki tablo bağlayıcıdır:

| Nerede | Hangisi | Neden |
|---|---|---|
| Ustalık koşulu (`mastered`) | **`strength`** (aşınmasız) | Kazanılmış ustalık geri alınmaz |
| Çocuğa gösterim (tohum→meyve) | **`strength`** | Bahçe bir gecede solmaz (§7.4) |
| `rusty` tespiti | `strengthEff` | Unutma tam olarak buradan ölçülür |
| `frontier` kovası aralığı, `urgency` | `strengthEff` | Planlama tazeliğe bakmalı |

Sayısal kanıt (neden bu ayrım şart): `q = 1.00` ile 5 doğru → `strength = 0.884`.
Aynı düğüm `box = 2` (halfLife 4 gün) iken bir gün sonra `strengthEff = 0.777`'ye düşer.
Ustalık koşulu `strengthEff`e bakıyor olsaydı düğüm gece `mastered` olur, sabah
olmazdı — çocuğun bahçesindeki meyve çiçeğe geri dönerdi. Bu, planın en açık
kendi kendiyle çelişkisiydi.

**Ustalık koşulu:** `strength ≥ 0.85` **ve** `streak ≥ 3` **ve** `distinctDays ≥ 2`
**ve** `strengthEff ≥ 0.55` (tazelik).

Son şart, mastered düğümün aşınınca `rusty`'ye geçişini mümkün kılar: `strength`
kendiliğinden azalmaz (yalnız cevapla değişir), ama `strengthEff` zamanla düşer.
Tazelik eşiği olmazsa `rusty` durumuna ulaşılamaz — plan §15 senaryo ④ bunu
gerektirir. `strength ≥ 0.85` koşulu hâlâ aşınmasızdır (kazanılmış ustalık geri
alınmaz), yalnızca tazelik eklenir.

Üç şart birlikte pratikte ≥5 doğru cevap ve ≥2 ayrı gün demektir
(`skills.json`'daki `estimatedItemsToMastery` 10–14 ile tutarlı).
`distinctDays` şartı kritik: tek oturumda 3 doğru "öğrendi" değil, "kısa süreli bellek".
Bu tek şart sahte ustalığın çoğunu eler.

**Durum makinesi — tam tanım.** Durum saklanmaz, her okumada **türetilir** (tek gerçek
kaynak sayaçlardır; saklanan durum sayaçlarla tutarsızlaşır). Sıra önemlidir, ilk eşleşen kazanır:

| # | Durum | Koşul |
|---|---|---|
| 1 | `struggling` | `attempts ≥ 6` **ve** `son6` içindeki başarı oranı `< 0.45` |
| 2 | `mastered` | `strength ≥ 0.85` **ve** `streak ≥ 3` **ve** `distinctDays ≥ 2` **ve** `strengthEff ≥ 0.55` |
| 3 | `rusty` | Daha önce `mastered` olmuş (`enYuksekStrength ≥ 0.85`) **ve** şimdi `strengthEff < 0.55` |
| 4 | `learning` | `attempts ≥ 1` |
| 5 | `ready` | Tüm `hard` ön-koşulları `mastered` **veya** düğüm `isEntryPoint: true` |
| 6 | `locked` | Aksi hâlde |

`enYuksekStrength` (gördüğü en yüksek `strength`) kayıtta tutulur — yoksa `rusty`,
"hiç öğrenilmemiş" düğümden ayırt edilemez. `struggling` en üstte, çünkü kök neden
taraması diğer her şeyi geçersiz kılar. `struggling`ten çıkış: `son6` oranı `≥ 0.45`.

**Kayıt sözleşmesi ve saf fonksiyon imzası.** `src/progress/mastery.ts` içeriği
**saf ve senkron**dur — `Date.now()`, IndexedDB veya rastgelelik ÇAĞIRMAZ; test
edilebilirliğin tek garantisi budur. Zaman ve kalıcılık dışarıdan verilir:

```ts
export interface MasteryRecord {
  readonly skillId: SkillId;
  readonly strength: number;        // 0..1
  readonly enYuksekStrength: number;// 0..1, rusty tespiti
  readonly box: 0 | 1 | 2 | 3 | 4 | 5;
  readonly streak: number;
  readonly attempts: number;
  readonly distinctDays: number;
  readonly lastAnsweredAt: number | null;  // epoch ms
  readonly son6: readonly boolean[];       // en fazla 6, sonuncu en yeni
}

export interface CevapOlayi {
  readonly skillIds: readonly SkillId[];   // madde birden çok düğümü yoklar
  readonly dogru: boolean;
  readonly kullanilanYardimKademesi: 0 | 1 | 2 | 3;
  readonly latencyMs: number;
  readonly estimatedSec: number;
  readonly nodeDifficulty: Difficulty;     // skills.json'daki düğüm zorluğu
  readonly tani: HataEtiketi | null;
  readonly yakinlik?: number;              // yalnız tahmin şablonları: e = |tahmin−gerçek|/max(gerçek,1)
  readonly zamanMs: number;                // olayın zamanı — Date.now() İÇERİDE çağrılmaz
}

export function qHesapla(olay: CevapOlayi): number | null;   // null = skorlama yok
export function masteryGuncelle(kayit: MasteryRecord, olay: CevapOlayi): MasteryRecord;
export function durumTuret(
  kayit: MasteryRecord, dugum: SkillNode, simdiMs: number,
  onKosulDurumlari: ReadonlyMap<SkillId, MasteryDurumu>,
): MasteryDurumu;
```

Bir madde birden çok `skillId` yokluyorsa (`Exercise.skillIds`) **her biri için ayrı ayrı,
aynı `q` ile** güncellenir. Ağırlıklandırma yapılmaz: hangi düğümün ne kadar sorumlu
olduğu ölçülemez, uydurulan ağırlık ölçümü bozar.

**Çocuğa gösterim: sayı yok, yüzde yok.** 4 seviye — eşikler **`strength`** üzerinden
(aşınmasız; bahçe bir gecede solmaz): tohum `< 0.25` · filiz `< 0.55` · çiçek `< 0.85` ·
meyve `mastered`.

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

Kova dağılımı **oturum başına sabit sayıdır**, yüzde değil. (Planın ilk taslağındaki
%15/%45/%20/%15/%5 hedefleri 8 soruya tam bölünmüyordu ve uygulayıcıyı yuvarlama
kararıyla baş başa bırakıyordu; aşağıdaki tablo o belirsizliği kapatır.)

| Sıra | Kova | Adet | İçerik |
|---|---|---|---|
| 1 | `warmup` | **1** | `mastered`, düşük zorluk. Oturum **daima başarıyla açılır**. |
| 2–5 | `frontier` | **4** | `learning`, `strengthEff` 0.3–0.85 |
| 6 | `new` | **1** | `ready` düğüm. Oturum başına **en fazla 2** (yalnız devir yoluyla 2 olabilir) |
| 7 | `review` | **1** | `rusty` **veya** Leitner vadesi gelmiş (§6.1) |
| 8 | *kapanış* | **1** | `mastered` — sert kural 5: son izlenim başarı |
| — | `remediation` | **0 / 2** | Tetiklenirse (§6.6) 2 soru alır ve `frontier` 4 → 2'ye iner |

Uzun vadeli oran bu tablodan çıkar: frontier %50, diğerleri %12.5. §15'teki "1000 simüle
oturumda ±%5" testi bu değerleri denetler — sapma yalnız **devirden** doğar.

**Devir kuralı.** Bir kova aday bulamazsa (ör. hiç `rusty` düğüm yok) kotası şu sırayla
devredilir: `review → frontier → new → warmup`. Hiçbir kova doldurulamıyorsa oturum
daha kısa kapanır — **uydurma soru üretilmez.** Yeni profilin ilk oturumu doğal olarak
`new` ağırlıklıdır (başka aday yoktur); "en fazla 2 yeni düğüm" tavanı burada bağlar
ve oturumu 2 yeni düğümün tekrarlarıyla doldurur, 8 farklı yeni düğümle değil.

**Skorlama.** Kova içinde adaylar `urgency × novelty × readingFit × assetReady ×
interleave × difficultyFit` ile puanlanır. Her çarpan `[0, 1]` aralığındadır; **çarpanlardan
biri 0 ise aday elenir** (`readingFit`, `assetReady` ve `novelty` bilerek sıfır
verebilir — bu bir eleme mekanizmasıdır, zayıf bir puan değil). Tam tanımlar:

| Çarpan | Formül | Neden |
|---|---|---|
| `urgency` | `1 − strengthEff` (min 0.05) | Zayıf düğüm önce gelir |
| `novelty` | Bu oturumda hiç sorulmadıysa `1.0`; 1 kez `0.5`; 2 kez `0.2`; 3+ `0` | Aynı düğümün oturuma hâkim olmasını engeller |
| `readingFit` | `readingLoad ≤ readingLevel` → `1.0`, aksi `0` | Sert kural 1'in çarpan karşılığı (çift koruma) |
| `assetReady` | Şablonun jeneratörü `registry.ts`'te kayıtlı **ve** gerekli ses anahtarları manifestte var → `1.0`, aksi `0` | Yazılmamış şablon asla seçilmez; 35 şablon eklenirken motor kırılmaz |
| `interleave` | Son sorunun temasından farklı tema → `1.0`, aynı tema → `0.6` | Araya girmeli tekrar (interleaving) öğrenmeyi güçlendirir |
| `difficultyFit` | `1 − |dugum.difficulty − hedefZorluk| / 5`, `hedefZorluk` = son 4 maddede ≥%75 doğruysa `+1`, ≤%25 doğruysa `−1`, aksi hâlde sabit; `1..5`e kelepçelenir | Akış (flow) bandında tutar |

En yüksek 3 aday arasından **ağırlıklı rastgele** seçilir (ağırlık = puan). Rastgelelik
`createRng(oturumTohumu)` alt akışından gelir; `Math.random()` burada da YASAK — aynı
tohumla aynı oturum yeniden üretilebilmelidir (hata ayıklamanın tek yolu).

**Sert kurallar** (skorlamadan ÖNCE uygulanır; skorlama yalnız hayatta kalan adaylara):
1. `readingLoad > readingLevel` → asla göster**me**.
2. Aynı düğüm üst üste 3'ten fazla → zorla tema değiştir.
3. **2 ardışık yanlış → sonraki soru zorunlu `warmup`** (duygusal toparlanma).
4. Bir düğümde 3 kez yanlış/destekli → 1 gün askıya al (`askidaBitis` zaman damgası
   `learner_mastery` kaydına yazılır), en yakın `hard` ön-koşula in.
5. **Oturum daima ustalaşılmış bir soruyla biter** — son izlenim başarı.

Çakışma sırası: **1 > 3 > 5 > 4 > 2**. Kural 1 hiçbir koşulda esnemez; 3 ile 5 aynı anda
geçerliyse (7. soruda 2 ardışık yanlış) ikisi de `mastered` düğüm ister, çelişki yoktur.
Kural 4'ün askı süresi dolmadan düğüm hiçbir kovada aday olamaz — ama askı **`review`
kovasını boşaltabilir**, o zaman devir kuralı işler.

**8 soruluk kilit varsayım.** `warmup` ve kapanış soruları `mastered` düğüm ister; yeni
bir profilde hiç `mastered` düğüm YOKTUR. Bu durumda ikisi de sırasıyla "en yüksek
`strength`e sahip düğüm"e düşer (hiç cevap yoksa: en düşük `difficulty` değerine sahip
`isEntryPoint` düğüm). Aksi hâlde ilk oturum hiç kurulamazdı — bu kural yazılmazsa
uygulayıcı burada takılır.

**Kalıcılıkla ilişkisi.** `scheduler.ts` de **saftır**: girdisi `MasteryRecord[]`,
`SkillNode[]`, oturum geçmişi ve `oturumTohumu`; çıktısı seçilmiş `skillId` + şablon +
madde tohumu. Veritabanına `session.ts` yazar. Bu ayrım olmadan 1000 oturumluk
simülasyon testi (§15) yazılamaz.

### 6.5 Seviye tespiti

**İlk oturumda kalibrasyon testi YAPILMAZ.** İlk deneyimin başarısızlıkla başlaması en pahalı hata. Herkes kolaydan başlar, motor 2–3 oturumda yerini bulur.

Veli kapısı arkasında tek soru: **"Okulun kaçıncı ayı?"** (Eylül…Haziran, ikonlu). Programın tema sırası bilindiği için bu tek cevap başlangıç noktasını isabetle ayarlar. Soğuk başlangıç böyle çözülür.

**Okul ayı → açılan tema (tam eşleme).** Ders saatleri (§1) aya oranlanarak türetildi;
ay seçildiğinde o aya kadarki temaların düğümleri `locked` yerine `ready`ye açılır
(ön-koşulları da karşılanmışsa). Sonraki temalar normal ilerlemeyle açılır.

| Okul ayı | Açılan temalar | Gerekçe (saat) |
|---|---|---|
| Eylül | 1 | 15 saat, yıl geometriyle başlar |
| Ekim | 1–2 | Tema 2 başlar (57 saat, en uzun) |
| Kasım | 1–2 | Tema 2 sürüyor |
| Aralık | 1–3 | Tema 3 (18 saat) |
| Ocak | 1–4 | Tema 4 başlar (50 saat) |
| Şubat | 1–4 | Tema 4 sürüyor |
| Mart | 1–5 | Tema 5 (7 saat) |
| Nisan | 1–6 | Tema 6 (15 saat) |
| Mayıs | 1–7 | Tema 7 (10 saat) — tümü açık |
| Haziran | 1–7 | Tümü açık, `review` kovası ağırlıklı |

**Isınma Keşfi (isteğe bağlı; ADR-0007 Kabul, 2026-10-14).** Yukarıdaki kural **varsayılan davranıştır**: ilk oturumda
kalibrasyon testi yapılmaz. Isınma Keşfi varsayılan **kapalıdır**; yalnız kişisel modda veli, yetişkin alanında
"Oturuma kısa ısınmayla başla" anahtarıyla açar (yalnız bellekte; sayfa kapanınca kapanır). Tahta/sınıf modunda yoktur.
Açıkken oturumun 8 sorusundan önce en çok `ISINMA_EN_FAZLA_MADDE` (8) maddelik ısınma gelir: okul ayının açtığı temaların
hazır düğümleri ön koşul sırasına dizilip en çok `ISINMA_ISARET_SAYISI` (15) işarete eşit aralıkla örneklenir (hep doğru cevaplayan çocuk 8. maddede tepeye varır); ısınma
**en kolay işaretten** başlar, ilk denemede doğruda `ISINMA_YUKARI_ADIM` (2) işaret yukarı, yanlışta `ISINMA_ASAGI_ADIM` (1)
aşağı iner; ardışık `ISINMA_ARDISIK_YANLIS_SINIRI` (2) yanlışta biter (ilk deneyim başarısızlıkla uzamaz). Isınmada boncuk
yolu, puan ya da skor yoktur. Sonuç (geçilen işaretler ve sert ön koşulları) yalnız **o oturumun** başlangıç noktasını
belirler — planlayıcıya `oturumIciAcikDugumler` ve `hedefZorlukBaslangici` olarak verilir — ve **hiçbir depoya yazılmaz**
(ustalık kaydı, olay, oturum özeti, tarayıcı deposu; ADR-0002 B'de bile). Isınma maddeleri ustalık kaydını değiştirmez.

**Haftalık plan ile ilişkisi (Adım 37).** Öğretmenin haftalık planı (`src/ogretmen/haftalikPlan.ts`) aynı ders
saatlerinden haftaya iner; her plan haftasının teması o haftanın okul ayında bu tabloya göre açıktır
(`haftalikPlan.spec.ts` "okulAyi ile çelişmez" testi). Plan daha ince taneli (hafta), bu tablo kilit açar (ay).

Bu eşleme **yalnız kilit açar, ustalık uydurmaz**: açılan düğümler `ready` durumunda
başlar, `strength = 0`. Çocuk Mart'ta başlasa bile Tema 1'i hiç çözmemiştir ve motor
onu `new` kovasında sırayla sunar. Veli ayı yanlış girerse zarar sınırlıdır (fazla
açılırsa ön-koşul DAG'ı yine sıralamayı korur; az açılırsa motor 2–3 oturumda ilerler).

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

**Madde yaşam döngüsü — §7.1, §7.2 ve §6.1'i birleştiren tek makine.** Uygulayıcı bu
tabloyu doğrudan koda çevirir; her satır bir geçiştir ve `q` yalnız "kapandı" satırlarında
hesaplanır:

| Durum | Olay | Sonraki durum | Yan etki |
|---|---|---|---|
| `bekliyor` | Ekran açıldı | `deneme1` | Talimat çalar, 15 sn hareketsizlik sayacı başlar |
| `deneme1` | Onayla → doğru | **kapandı** | `q` = 1.00 / 0.85 / 0.45 / 0.20 (alınan en yüksek yardım kademesine göre) |
| `deneme1` | Onayla → yanlış | `deneme2` | Amber geri bildirim; **K1 otomatik açılır** (§7.1); sayaçlar sıfırlanır |
| `deneme1` | Maskota dokundu / 15 sn sessizlik | `deneme1` (K1) | Yardım kademesi 1; +30 sn sonra K2, +30 sn sonra K3 |
| `deneme2` | Onayla → doğru | **kapandı** | `q = 0.45` (K1 zaten açık) veya K3 alındıysa `0.20` |
| `deneme2` | Onayla → yanlış | **kapandı** | `q = 0.00`; doğru cevap gösterilir ve sesle açıklanır; **aynı soru tekrar sorulmaz** |
| herhangi | K3 sonrası doğru dokunuş | **kapandı** | `q = 0.20`; kutlama TAM doğruyla aynı (§7.2) |
| herhangi | `GOREV_ANLASILMADI` tespiti | **kapandı** | Skorlama yok (`q = null`); talimat tekrarlanır, madde tekrar kuyruğuna girer |

Zamanlayıcı kuralları: sayaçlar **ekran değişiminde ve her dokunuşta** sıfırlanır;
`deneme2`ye geçişte yeniden başlar; kademe geri gitmez (K2'den K1'e dönülmez).
Kapanan madde `session.ts`'e tek bir `CevapOlayi` (§6.1) olarak bildirilir — **tam bir kez.**

### 7.3 Seç → Onayla

Seçenek dokunuşu cevabı göndermez; seçenek büyür ve çerçevelenir, sağ altta Onayla belirir. Onaydan önce sınırsız değiştirilebilir. Akıllı tahtada kalibrasyon kayması yüzünden zorunlu. 2 seçenekli sorularda bile aynı kural.

Ek koruma: 250ms dokunma soğuması, kenar 24px ölü bölge, `touch-action: manipulation`, uzun basma menüsü kapalı. **Geri butonu asla veri kaybettirmez** — oturumu duraklatır, dönünce kaldığı sorudan devam. Onay diyaloğu sorulmaz (okunamaz).

### 7.4 Ödül: koleksiyon

3 yıldız **hayır** (performans notudur; 1 yıldız alan çocuk başarısızlık yaşar). Rozet **hayır** ("başarım" bu yaşta soyut). **Koleksiyon evet** — somut, biriken, karşılaştırmasız.

**"Bahçem":** her tamamlanan oturum 1 çıkartma. Oturum sonu ekranından uçarak bahçeye yapışır. 30 çıkartma ≈ 6 hafta → yeni sahne.

Aşırı oyunlaştırma önlemleri: ödül **tamamlamaya** bağlı, doğru sayısına değil (yanlış yapan da alır) · sanal para/mağaza yok · **streak sayacı yok** (bir gün kaçırınca suçluluk üretir) · liderlik tablosu/sosyal karşılaştırma yok · kutlama ≤2 sn, atlanabilir · sayısal skor/yüzde hiçbir yerde yok.

Doğru cevap: 400–600ms, yeşil çerçeve + tik + %8 nabız + yükselen iki nota. Sesli onay 6–8 varyantlı. **Konfeti yalnız oturum sonunda.**

**Sınıf Turu notu (Adım 36, ADR-0008 Kabul).** Tahtadaki grup oyununda da aynı ilke: ödül tamamlanan
tura bağlıdır (doğru, ipuçlu veya birlikte çözülmüş fark etmez) — sınıfın ortak kavanozuna bir yaprak, takıma
bir yıldız. Yıldızlar simgedir, sayı yazılmaz; kavanoz yüzde göstermez; kazanan, sıralama ve süre yoktur.

### 7.5 Maskot

Tek net işlevi: **sesin sahibi olmak.** Tüm sesli talimat ondan gelir; "kim konuşuyor" sorusunu çözer, yardım istemeyi doğallaştırır.

**İnsan değil** (etnik/cinsiyet temsili ve tekinsiz vadi) · türü belirsiz, yuvarlak, tüylü · silueti asla değişmez, yalnız yüz ifadesi ve kol pozu (6 durum) · sabit sıcak turuncu · 16px'te bile tanınabilir.

**Altı durum — tam liste.** Silüet ve renk sabit; değişen yalnız yüz ve kol:

| Durum | Ne zaman | Yüz / kol |
|---|---|---|
| `sakin` | Varsayılan, çocuk düşünürken | Nötr gülümseme, kollar aşağıda. **Hareketsiz** — bekleyen çocuğu rahatsız etmez |
| `konusuyor` | Talimat veya ipucu çalarken | Ağız senkron açılıp kapanır, bir kol işaret eder |
| `dinliyor` | Çocuk seçim yaparken (seç→onayla arası) | Hafif öne eğik, kulak/baş yönelmiş |
| `sevinmis` | Doğru cevap | Kollar yukarı, gözler kısılmış gülüş. ≤2 sn, sonra `sakin` |
| `cesaretlendiriyor` | Yanlış cevap ve K1/K2/K3 | Nötr-sıcak, bir kol "devam" işareti. **ASLA üzgün değil** (§7.1) |
| `uykulu` | 60 sn tam hareketsizlik (K3'ten sonra da cevap yok) | Gözler yarı kapalı, esneme. Çocuk oyundan kopmuşsa ekran onu suçlamaz |

Geçişler yalnız bu tablodaki olaylarla tetiklenir; ara durum yoktur. `prefers-reduced-motion`
açıkken poz değişir ama animasyon yoktur (anlık geçiş).

**Asla:** üzülmez, ağlamaz, suçlamaz, gereksiz konuşmaz, bekletmez. Sessiz kalabilmesi en önemli özelliği.

**Karakter kitabı (plan v2 Adım 54, KG-91):** [`docs/maskot/karakter-kitabi.md`](maskot/karakter-kitabi.md) — isim **Lokum** (kullanıcı kararı 28 Eki 2026, değiştirilebilir; tek kaynak `src/content/maskot.json`, KG-115), üç sıfat (meraklı, sabırlı, sıcak), konuşma tarzı, yapmadıkları, tema dünyaları. Tema hikâyeleri `src/content/maskotHikayeleri.json` (7 tema × 3 sahne; şema `src/content/schema/maskotHikayesi.ts`, derleme zamanında doğrulanır): hikâyede yalnız `konusuyor`/`dinliyor`/`sevinmis`/`sakin`; olaya bağlı `cesaretlendiriyor` ve `uykulu` kullanılmaz. Maskot sesi `tr-TR-Chirp3-HD-Achernar` hız 0,9 (KG-114; yönergeler Puck). Bağlama (KG-116): derin tema girişi `maskot.selam` + 1. sahneyle açılır; kişisel oturum sonunda sıradaki sahne (bellekte sayaç); sahne ve maskot dokunulmaz.

---

## 8. Görsel Varlık Stratejisi

**Dört katmanlı hibrit, ağırlık merkezi programatik SVG'de. Yapay zeka görsel üretimi kullanılmaz.**

| Katman | Kaynak | Ne için |
|---|---|---|
| **K1** | Programatik SVG (React) | ~%90: onluk çerçeve, sayı doğrusu, şekiller, rakam glifleri, çetele, nesne grafiği, ızgara, terazi |
| **K2** | **Noto Color Emoji (SIL OFL)** | Sayılacak nesneler, çıkartmalar |
| **K3** | Özel SVG (10–20 varlık) | Maskot, bahçe sahnesi, ölçme araçları |
| **K4** | Özel UI ikon seti (10–12) | Geri, ses, yardım, onay, ev |
| **K5** | TCMB resmî örnek görselleri | MAT.1.1.9 için 5, 10, 20, 50, 100 ve 200 TL banknot ön yüzleri |

> **Lisans notu (Adım 21, 12 Eki 2026).** Her üçüncü taraf varlık `src/content/ucuncuTarafVarliklar.ts` envanterindedir; LICENSES ve Kaynaklar ondan üretilir, `npm run lisans:denetle` (K10) CI'da denetler. K2: emoji yazı tipi **paketlenmez**, emojiler cihazın yazı tipiyle çizilir (envantere girmez). K5: TCMB'ye başvurulmaz (KG-19); kâğıt ve arşiv `SematikBanknot` kullanır, ekran Adım 29'da şematiğe geçer.

**Nesne çizimleri (plan v2 Adım 59, KG-104):** sorulardaki 10 nesne ve materyaller K1'dir — depoda elle/kodla yazılmış SVG, çocuk kitabı düz illüstrasyonu (nesne başına 3–5 ton: temel + gölge + ışık + koyu kontur, ışık sol üst); K2 emoji kullanılmaz. Tek `fill` temel rengi verir, tonlar ondan türetilir. Kurallar: [`docs/tasarim/nesne-cizim-rehberi.md`](tasarim/nesne-cizim-rehberi.md).

**Tema sahneleri (plan v2 Adım 54, KG-91):** `src/ui/svg/temaSahneleri.tsx` — 7 tema dünyası (park, bahçe, mutfak, göl, pazar, atölye, çiftlik) programatik SVG arka plan (K1/K3; üçüncü taraf varlık yok). Dokunulmaz (`aria-hidden`, olay almaz, metin/düğme yok), alt %65 etkileşim kuralını değiştirmez, alıştırma ekranının arkasında kullanılmaz; palet açık pastel (metin rengine ≥7:1, kırmızı ton yok), renk anlam taşımaz — renk körlüğü dostu paletle de aynı sahne.

**K1 neden ağırlık merkezi** — projenin en yüksek getirili tek kararı: soru üreteci ile **aynı veriden** çizilir (`{tip:'sayma', nesne:'elma', adet:7}` hem soruyu hem görseli üretir), sonsuz varyasyon sıfır varlık maliyetiyle. **7 elma her zaman 7 elmadır** — bu bir sayma uygulamasında pazarlık konusu değil. <2KB/dosya, temaya otomatik uyar, telifi temiz.

**Nesne yerleşim algoritması kritik:** 1–4 düzenli sıra, 5–10 gruplu (5+2), 10+ onluk çerçeve. Rastgele dağıtım sayma öğrenimini bozar — ama `MAT.1.1.2` **bilerek dağınık** düzen istiyor, o yüzden `layout` bir parametre ve dağınık düzen bir tanılama aracı (§6.6).

**K4 için Lucide/Phosphor kullanma** — yetişkin arayüzü için ince çizgili, tahta mesafesinde okunmuyorlar. Kendi setin: kalın (6–8px), dolgulu, daire içinde. Yarım günlük iş.

**Yapay zeka görsel üretimi reddedildi:** stil kayması · **7 nesne isteyip 6 almak ürünün temel işlevini bozar** · tekinsiz vadi · eser sahipliği belirsiz (okula sunulacaksa savunulamaz) · denetim döngüsü hesaba katılınca K1'den pahalı.

### Lisans notları

- **Noto Color Emoji — SIL OFL 1.1.** Birinci tercih, ShareAlike yok.
- **OpenMoji — CC BY-SA 4.0.** ShareAlike **bulaşıcı**, kapalı kaynak üründe hukuki yük. **Kaçın.**
- **Türk Lirası:** `MAT.1.1.9` için TCMB'nin yayımladığı, üzerinde `ORNEKTIR GECMEZ` ibaresi bulunan resmî ön yüz örnekleri kullanılır. Görseller yalnız eğitim amaçlıdır; TCMB kaynak bağlantıları [`docs/BANKNOT_GORSEL_KAYNAKLARI.md`](BANKNOT_GORSEL_KAYNAKLARI.md) içinde tutulur. Ticari kullanım planlanırsa TCMB'den yazılı izin alınmalıdır.
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

**Renk körlüğü dostu palet** (plan v2 Adım 55, yetişkin ayarı, varsayılan kapalı): doğru mavi `#0B5FA5`, tekrar dene koyu turuncu `#A34700`, vurgular koyulaştırılmış eşler; zemine ve beyaza ≥4,5:1, renk körlüğü benzetiminde ayrışır (test hesaplar). Onayla'daki beyaz yazı büyük metin olduğundan bu palette 4,5:1 (WCAG AAA büyük metin) eşiği uygulanır.

**Animasyon:** `prefers-reduced-motion` **veya yetişkinin açtığı "Hareketi azalt"** (Adım 55) → hareket 0, geri bildirim ikon+sesle devam · 3 Hz üstü yanıp sönme yok (WCAG 2.3.1) · ekranın %25'inden fazlasını kaplayan hızlı hareket yok · konfeti ≤40 parçacık, ≤1.5 sn · yalnız `transform`/`opacity`.

---

## 10. Veri Katmanı

**IndexedDB (kendi sarmalayıcı, ADR-0015 Kabul), `src/persistence/db.ts`:**

| Store | İçerik |
|---|---|
| `content_*` | Kazanımlar, mikro düğümler, şablonlar, hata kataloğu — salt-okunur |
| `learner_mastery` | Düğüm başına ustalık kaydı (§6.1: `strength`, `box`, `streak`, `distinctDays`, `lastAnsweredAt`, durum) |
| `learner_profile` | `readingLevel`, ayarlar, cihaz profili geçersiz kılma, okul ayı |
| `active_session` | Duraklatılmış oturumun TAM durumu (aşağıda) |
| `events` | Append-only cevap logu, son 2000 kayıt halka tampon |
| `sessions` | Oturum özeti, son 90 gün |

`localStorage` yalnız: `activeProfileId`, `contentPackVersion`, `dbSchemaVersion`.

**Şema tanımı — birebir bu** (Dexie gösterimi; `db.ts` `SEMA` aynı depo/anahtar/indeksleri ham IndexedDB ile
kurar, IndexedDB sürümü **10** = Dexie v1×10, ADR-0015; uyum `tests/unit/indexeddbUyum.spec.ts`). Sürüm numarası
ve indeksler uygulayıcının seçimine bırakılmaz; farklı oturumlarda farklı şema yazılırsa migrasyon zinciri kopar:

```ts
// src/persistence/db.ts
db.version(1).stores({
  learner_mastery: 'skillId, box, lastAnsweredAt',   // skillId birincil anahtar
  learner_profile: 'id',                              // tek kayıt: id = 'aktif'
  active_session:  'id',                              // tek kayıt: id = 'aktif'
  events:          '++seq, ts, skillId',              // halka tampon, son 2000
  sessions:        'sessionId, bitisTs',              // son 90 gün
});
```

`content_*` store'ları **yoktur** — içerik JSON'ları paketle birlikte gelir ve
salt-okunurdur; IndexedDB'ye kopyalamak ikinci bir gerçek kaynak yaratır ve sürüm
uyuşmazlığı üretir. İçerik sürümü `localStorage.contentPackVersion` ile izlenir.

**Budama (ZORUNLU, aksi hâlde depolama sınırsız büyür):** her oturum kapanışında
`events` 2000 kaydı aşarsa en eskiler silinir, `sessions` 90 günden eski kayıtları
silinir. Silme oturum kapanışında yapılır — soru arasında yapılırsa çocuğu bekletir.

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

**Yedek dosyası biçimi — sürümler arası sözleşme:**

```jsonc
{
  "format": "okulumsun-yedek",
  "formatVersion": 1,          // yedek biçiminin sürümü
  "dbSchemaVersion": 1,        // yazıldığı andaki şema sürümü (MEVCUT_SEMA_SURUMU)
  "olusturulmaTs": 1754400000000,
  "uygulamaSurumu": "0.1.0",
  "veri": {
    "learner_profile": { },
    "learner_mastery": [ ],
    "sessions": [ ],
    "events": [ ]              // isteğe bağlı; dosyayı küçük tutmak için atlanabilir
  }
}
```

İçe aktarım kuralları: `format` alanı eşleşmiyorsa dosya **reddedilir** (sessizce
yorumlamaya çalışma) · `dbSchemaVersion` mevcut sürümden **büyükse** reddedilir
("bu yedek daha yeni bir sürümle alınmış") · küçükse migrasyon zincirinden geçirilir ·
`active_session` yedeğe **dahil edilmez** (yarım oturumu başka bir cihazda sürdürmenin
anlamı yok ve tohum bağlamı taşınmaz).

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
[5] Tema girişi — kısa: 2 sn, otomatik, maskot tema adını söyler; derin (Adım 45): 4 adımlı sesli
      giriş (izle → dokun → dokun → izle), oturumdaki ilk tema seçiminde bir kez; tahtada [4b]'nin ilk kartı
      ▼
[6] ALIŞTIRMA ×8 — 4. soruda "yarı yoldasın" mikro-animasyonu
      ▼
[7] Oturum sonu — çıkartma uçarak bahçeye
      ▼
[8] BAHÇEM → [Ev] → Ana ekran

Yan dal: [4] → dişli → Veli kapısı → [9] Veli paneli
Yan dal: [4] → [K] Keşif Masası (iki modda; soru/puan yok; onluk çerçeve · nesneler · sayı doğrusu · terazi · ayır-birleştir) → [Ev] → [4]
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
- **[4d] Sınıf Turu** (plan v2 Adım 36, ADR-0008 Kabul): ana ekranın 8. kartı → kurulum (2–4 takım,
  renk, soru kaynağı: bugünün seti veya tema, kavanoz büyüklüğü) → sıra duyurusu → soru (`ExerciseScreen`
  gömülü; üst %12 kavanoz + takım şeritleri) → tur kutlaması → … → kavanoz kutlaması. Yalnız tahta modunda;
  durum yalnız bellekte, ekrandan çıkınca silinir.
- **[4e] Ders sonu** (plan v2 Adım 40): ana ekranda ve Sınıf Turu sonunda küçük "Dersi bitir" (yetişkin) →
  ders sonu özeti: en çok 3 zorlanılan beceri (düzey metin + simge, sayı/yüzde yok), baskın hata türü
  (yanlış şıkkın tanısı `MaddeSonuc.tani` ile taşınır), sınıfta fiziksel etkinlik; alt %65'te "Yarın için set",
  "Kâğıt yazdır", "Kapat". Tek konu, bugünün seti ve Sınıf Turu maddeleri olay olarak yalnız bellekte birikir;
  Kapat/Yarın seti/Kâğıt, mod değişimi ve sayfa yenileme siler.
- **[E] Eve link** (plan v2 Adım 42, ADR-0010): `…/#ev=1.<set kodu>` ile açılış → hash adresten hemen silinir →
  [1] ses kilidi → **Evde çalış** (set tabanlı 8 soru, adaptif değil) → kutlama → [Ev] mod seçimi. Bozuk/fazla alanlı
  bağlantı olağan açılışa düşer. Set yalnız bellekte; sonuç tutulmaz.
  Öğretmen tarafı: "Bugünün seti" (tahta) ve ders sonu özetinde **Eve gönder** → büyük QR (yerel) + bağlantı + Kopyala.
- **[4f] Tema turu** (plan v2 Adım 46, KG-66/67): [4b] konu seçiminin son kartı "Tema turu" → temanın becerilerini
  dolaşan 8–10 soru (≤10 düğüm hepsi, fazlası eşit aralıklı 10) → kutlama → yetişkine beceri başına nitel düzey
  (Rahat / Biraz destek gerekti / Tekrar çalışılabilir; ders özeti eşikleri, tek madde yeterli; sayı/yüzde yok) →
  "Bitti" → [4]. Kişisel modda aynı tur veli panelinden başlar. Olaylar yalnız tur ekranında; kapanınca silinir.

**Veli paneli [9] — içerik listesi (ilk sürüm, bu kadarı ZORUNLU, fazlası değil):**

1. Tema bazında ilerleme: 7 tema satırı × düğüm durumu (tohum/filiz/çiçek/meyve
   sayıları). Yüzde ve puan YOK — çocuğa yasak olan gösterim veliye de gösterilmez,
   veli çocuğa söyler.
2. "Zorlandığı konular": `struggling` durumundaki düğümlerin `childLabel` listesi +
   evde ne yapılabileceğine dair tek cümlelik öneri (içeriği `tr.json`'dan).
3. Ayarlar: `readingLevel` (§6.3) · okul ayı (§6.5) · cihaz profili geçersiz kılma
   (§3.1, ✓ Adım 27 "Ekran boyutu") · ses hızı.
4. Yedekleme: dışa/içe aktar (§10) + kalıcılık uyarı rozeti + depolama alanı.
5. "Kaynaklar" ekranı bağlantısı (§8 lisanslar).

Kişisel modda ek bölüm (plan v2 Adım 43): "Evde 10 dakika başlat" — bu haftanın MEB konusundan 8 soru,
sonunda veliye 3 cümlelik ipucu kartı (gözlem, soru, ev nesnesiyle etkinlik). Yanıt/puan gösterilmez, saklanmaz.
Kişisel modda ek bölüm (plan v2 Adım 46): "Tema turu başlat" — açık temalardan biri seçilir (varsayılan en son açılan),
[4f] turu oynanır, sonunda yetişkine beceri başına nitel düzey.

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

Elle yazılmış ağaç hedef son durumu gösterir; `(✓)` bugün repoda var, `(⬜)` planlandı.
Altındaki **üretilmiş ağaç** bugünkü klasörleri gösterir: `npm run durum -- --agac` yazar,
`npm run durum -- --denetle` (CI, K8) bayatsa kırar. Sayılar elle yazılmaz; makine bloğundan okunur.

```
okulumsun/
├── .github/workflows/ci.yml        # (✓) lint+test+validate+audio:audit+build, PR'da e2e (§14 adım 2b)
├── docs/
│   ├── meb-ilkokul-matematik-2024.pdf  # (✓) resmî kaynak
│   ├── meb-matematik-2024-metin.txt    # (✓) çıkarılmış metin, sayfa bölümlü
│   ├── mufredat-kisitlari.md           # (✓) İHLAL EDİLEMEZ sınırlar
│   ├── mufredat-kisitlari-turkce.md    # (✓) Türkçe ilk okuma yazma sınırları (K-OY-01…20, D-01…D-24)
│   ├── PLAN.md                         # (✓) bu belge
│   ├── PROGRESS.md                     # (✓) plan ↔ kod durum raporu (makine okunur durum bloğu)
│   ├── TEST-PROTOKOLU.md               # (✓) erişilebilirlik denetimi + çocuk test protokolü
│   └── ses/                            # (✓) SES_KAYNAKLARI.md (köken envanteri), dinleme-testi.md
├── src/
│   ├── content/                    # SAF VERİ (✓)
│   │   ├── kazanimlar.json         # 19 resmî çıktı + tema/saat
│   │   ├── skills.json             # 57 mikro düğüm + DAG + şablon eşlemesi (TEK KAYNAK)
│   │   ├── tr.json                 # UI metinleri + speech key'ler
│   │   ├── senaryolar.json         # (⬜) günlük yaşam problemleri (M-ISLEM-HIKAYE)
│   │   ├── hints.json              # (⬜) yapay zeka üretimi, insan onaylı
│   │   ├── misconceptions.json     # (✓) 15 hata etiketi kataloğu
│   │   ├── okulAyi.ts              # (✓) okul ayı → tema açma eşlemesi (§6.5)
│   │   └── schema/                 # (✓) Zod sınır doğrulayıcıları
│   ├── exercises/                  # DETERMİNİSTİK JENERATÖRLER
│   │   ├── types.ts rng.ts distractors.ts   # (✓) sözleşme + tohumlu RNG + çeldirici
│   │   ├── registry.ts             # (✓) şablon kimliği → jeneratör haritası
│   │   └── templates/              # (✓) 39/39 şablon
│   ├── progress/                   # (✓) mastery.ts scheduler.ts session.ts itemLifecycle.ts cikartma.ts (§6, §7)
│   ├── persistence/                # (✓) db.ts repository.ts backup.ts persist.ts migrations/ (§10)
│   ├── audio/                      # (✓) speech.ts useSpeak.ts audioManifest.generated.ts
│   ├── design/                     # (✓) tokens.ts deviceProfile.ts useDeviceProfile.ts
│   ├── ui/
│   │   ├── primitives/             # (✓) BigButton SpeakButton ChoiceCard
│   │   ├── svg/                    # (✓ kısmen) Visual Sprite positions · (⬜) Rakam OnlukCerceve SayiDogrusu Terazi Banknot
│   │   ├── feedback/               # (✓) Maskot Celebration useMaskot maskotState
│   │   ├── layout/                 # (✓) GameShell
│   │   └── screens/                # (✓) AudioUnlock ExerciseScreen TapCount TapToPlace OturumSonu Bahcem AnaEkran ModSecimi AvatarSecimi RenkSecimi TemaGirisi KonuSecimi VeliKapisi VeliPaneli
│   ├── store/                      # (✓) appStore.ts — Zustand: navigasyon, profil, ayarlar + profildenYukle (Adım 9)
│   └── dev/                        # (✓) BoardHarness.tsx AudioProbe.tsx (§13)
├── scripts/                        # (✓) generate-audio, audit-audio, validate-content, fetch-fonts, ses/ (klipler, sesKaynagi) · (⬜) generate-content
├── public/
│   ├── audio/                      # (✓) 287 klip, 29 klasör (kaynak değişiyor → plan v2 Adım 31)
│   └── fonts/                      # (✓) Andika latin + latin-ext
└── tests/{unit,e2e}/               # (✓) birim ve e2e testleri (sayılar: §14 durum bloğu)
```

Bugünkü klasörler (üretilmiş, elle düzenlemeyin):

<!-- agac:basla -->
```
okulumsun/
├── ders-verisi/
├── docs/
│   ├── ADR/
│   ├── basvuru/
│   ├── gizlilik/
│   ├── icerik/
│   ├── kurulum/
│   ├── maskot/
│   ├── ogretmen/
│   ├── research/
│   ├── ses/
│   ├── strateji/
│   └── tasarim/
├── public/
│   ├── audio/
│   ├── fonts/
│   ├── gizlilik/
│   ├── images/
│   ├── kagitlar/
│   └── ogretmen/
├── screenshots/
├── scripts/
│   ├── basvuru/
│   ├── denetim/
│   ├── gizlilik/
│   ├── icerik/
│   ├── ses/
│   ├── tur/
│   └── yayin/
├── src/
│   ├── assets/
│   ├── audio/
│   ├── content/
│   ├── design/
│   ├── dev/
│   ├── exercises/
│   ├── hata/
│   ├── kesif/
│   ├── ogretmen/
│   ├── persistence/
│   ├── platform/
│   ├── progress/
│   ├── sinif/
│   ├── store/
│   └── ui/
└── tests/
    ├── e2e/
    └── unit/
```
<!-- agac:bitir -->

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

<!-- durum:kazanim=19 durum:beceri=57 durum:hazir_beceri=57 durum:sablon=39 durum:hata_etiketi=15 durum:ses=364 durum:birim_dosya=113 durum:e2e_dosya=44 durum:adr=16 -->

| # | İş | Durum | Bitti tanımı |
|---|---|---|---|
| 0 | Vite iskeleti, `tokens.ts`, `deviceProfile.ts`, `BoardHarness`, tek `BigButton` | ✅ | `npm run build` geçer; `?device=board` üç profili değiştirir; BoardHarness erişim bölgesini çizer |
| 1 | **Ses altyapısı:** `generate-audio.ts`, `SpeechService`, ses kilidi, 0–100 sayı klipleri | ✅ | 287 klip diskte (§4.5 kümeleri dâhil); `npm run audio:audit` temiz; `speak({kind:'sequence'})` çalışır; ekran değişiminde ses kesilir |
| 2 | **İlk 4 jeneratör, saf TS, UI yok:** `M-SAY`, `M-KARSILASTIR`, `M-TOPLA-GORSEL`, `M-RITMIK` | ✅ | Property-based testler geçer (determinizm, tek doğru, ≤20, müfredat üçlüleri); `npm run validate` temiz |
| 2b | **CI kurulumu** (`.github/workflows/ci.yml`): push'ta `lint + test + validate + build`, PR'da ek olarak `e2e` (tahta geometrisi) | ✅ | CI yeşil; geometri ihlali içeren kasıtlı commit CI'da KIRMIZI yanar (tuzak testiyle kanıtla) |
| 2c | **Kayıt defteri** (`src/exercises/registry.ts`, §5.4) + `validate-content.ts`'e "hazır düğümün şablonu defterde mi" denetimi | ✅ | 4 şablon defterde; `durum:"hazir"` bir düğümün şablonunu defterden silmek `npm run validate`'i KIRAR (kanıtla); defterde olmayan şablon `assetReady = 0` alır |
| 3 | SVG manipülatifler: `NesneKümesi` (yerleşim algoritması §8), `OnlukÇerçeve`, `SayıDoğrusu`, `Rakam` (10 MEB glifi §3.4), `SeçenekKartı` | ✅ | 4 şablonun ihtiyacı karşılandı (`Visual.tsx`, `positions.ts`); Rakam glifleri MEB TYMM TemelYazi fontundan üretilen dolgulu SVG path'lerle çizilir (KG-95; bayraklı `1`, çizgili `7`) → Adım 30 |
| 4 | **Alıştırma ekranı** — uyaran + seçenek + seç/onayla + geri bildirim (§11 anatomi) | ✅ | 4 şablon ekranda oynanır; e2e tahta geometri testi geçer; **ilk gerçek çocuk testi burada yapılabilir** |
| 5 | **Oturum motoru:** `src/progress/` → `mastery.ts` (§6.1 formüller + Leitner + yakınlık `q`), `scheduler.ts` (§6.4 kovalar + 5 sert kural), `session.ts` (8 soru yaşam döngüsü) | ✅ | §15'teki ustalık senaryo testleri geçer; kova oranları 1000 simüle oturumda ±%5 tutar; sert kuralların her biri birim testli; `mastery.ts` ve `scheduler.ts` SAF (içlerinde `Date.now`, Dexie, `Math.random` yok — grep ile kanıtla) |
| 6 | **Yardım akışı:** 3 kademe (§7.2) + hareketsizlik sayacı + hata taksonomisi bağlama (`diagnosticTag` → `remediation` kovası §6.6) | ✅ | K1/K2/K3 senaryo testli (23 test); `GOREV_ANLASILMADI` ustalığı ETKİLEMEZ (testle kanıtla ✓); 15/30/30 sn zamanlayıcılar ekran değişiminde sıfırlanır (`useHelpTimer` hook); `TaniTakipcisi` remediation tetikleme |
| 7 | Maskot durumları (6 poz §7.5) + kutlama + Bahçem (§7.4) | ✅ | Maskot 6 duruma geçer (17 test); kutlama ≤2 sn ve atlanabilir (`Celebration.tsx`); çıkartma oturum SONUNA bağlı (doğru sayısına değil, 13 testle kanıtla ✓); `cikartma.ts` SAF + 30 çıkartma→yeni sahne |
| 8 | İlk açılış, mod seçimi, avatar, ana ekran (7 tema), tahta modu konu seçimi ([4b] §11), veli kapısı + panel (§11 liste) | 🔄 kısmi — veli paneli 5 kalemden 2'si: ayarlar (cihaz profili ayarı ✓ Adım 27), Kaynaklar bağlantısı; ilerleme/zorlanılan konular/yedekleme Seçenek A gereği kapalı → Adım 52 | §11 akışının tamamı gezilebilir; veli paneli 5 kalemi içerir; tahta modunda IndexedDB'ye yazılmadığı testle kanıtlı |
| 9 | **Kalıcılık + PWA:** `src/persistence/` (§10 store'lar, `active_session`, migrasyon iskeleti, yedek), `vite-plugin-pwa` precache, `storage.persist()` | 🔄 kısmi — çevrimdışı tam oturum e2e ✅ (Adım 26, `onizleme-cevrimdisi.spec.ts`); yedek dışa/içe aktarım e2e yok → Adım 52; manifest/ikon/yön Adım 25'te düzeldi, Lighthouse "Installable" raporu canlı yayın onarılınca (KG-34) | Çevrimdışı tam oturum e2e geçer; yedek dışa/içe aktarım e2e geçer; sayfa yenilenince duraklatılmış oturum kaldığı sorudan sürer; Lighthouse PWA kurulabilir raporu |
| 10 | **Kalan 35 şablon** (§5.2'de ⬜ olanlar) + gerektirdikleri ses kümeleri (§4.5) + SVG varlıklar (banknot, terazi, ızgara, çetele) | ✅ | Tema sırasına göre parti parti: **T1 (3) → T2 kalanı (7) → T4 (9) → T3 (4) → T5 (2) → T6 (6) → T7 (4) = 35.** Her şablon §5.5'teki 8 adımı tamamlar. 19 kazanımın TAMAMI kapsanınca kapanır |
| 11 | **Dağıtım:** statik host (GitHub Pages veya Netlify) + `LICENSES.md` + "Kaynaklar" ekranı (§8) | ✅ — ürün okulumsun-tc.vercel.app'te yayında (ADR-0003 Kabul, Adım 22); `file://` açılışı denendi (Adım 49, KG-71): Chromium modül betiklerini dosyadan yüklemez, uygulama başlamaz → `yerel-acilis.js` uyarısı + okul sunucusu/alt dizin yolu (e2e `onizleme-yerel.spec.ts`), belgeli sınır `docs/kurulum/okul-agi.md` | Ürün herkese açık URL'de; çevrimdışı ikinci ziyaret çalışır; USB'den `file://` ile açılış denendi (PWA hariç çalışmalı) |
| 12 | Erişilebilirlik denetimi + **5 gerçek çocukla tablet testi** + düzeltme | 🔄 kısmi — erişilebilirlik denetimi ✅ (`docs/TEST-PROTOKOLU.md`); 5 çocukla tablet testi yapılmadı → Adım 32 | §15 elle doğrulama listesi işlenmiş; bulgular `docs/`e not edilmiş |
| 13 | *(2. ay)* Fiziksel akıllı tahta doğrulaması + ölçek ayarı | ⬜ — fiziksel tahta doğrulaması yapılmadı → Adım 33, 41 | §13'teki fiziksel test listesi; gerekirse yalnız `tokens.ts` ayarı |
| 14 | PR #14: erişilebilir seçim kartları (`choiceErisim.ts`) + veli kapısı/paneli + `adult-area` e2e | ✅ | Rebase çakışmasız; lint/test (193)/validate/audio:audit/build/e2e yeşil. Adım 15–58: `reports/gelistirme-plani-v2.md` (depo dışı plan) |
| 15 | Ses kökeni envanteri (`docs/ses/SES_KAYNAKLARI.md`), Kaynaklar/LICENSES acil lisans beyanı düzeltmesi, `scripts/ses/` (klip çıkarımı + `SesKaynagi` sözleşmesi), model kimliği özete, `audio:audit` köken denetimi, dinleme testi protokolü | ✅ | 287/287 özet `piper:` önekli, model bilinmiyor; `audio:audit` ticari izinsiz kaynakta kırmızı, CI'da `SES_GECIS_MODU=1` (Adım 31 kaldırır); `say` yalnız `--prototip`; 210 birim test |
| 16 | Durumu gerçeğe döndürme: Adım 3/8/9/11/12/13 kanıta göre yeniden açıldı; PROGRESS yeniden yazıldı (makine okunur blok); TEST-PROTOKOLU numaralama + ekran bağlama düzeltmesi; LICENSES gizlilik = `VERI_SAKLAMA_BILDIRIMI`; README yayın satırı; §12 ağacı | ✅ | `tests/unit/belgeTutarliligi.spec.ts` geçer (LICENSES ↔ politika, PROGRESS bloğu ↔ test dosya sayısı, TEST-PROTOKOLU'nda "bağlanmadı" yok); yalnız belge, kod davranışı değişmedi |
| 17 | ADR altyapısı: `docs/ADR/` (README dizini + durum sözlüğü + "ne zaman zorunlu" kuralı, 0000 şablon, 0001–0015), `.github/pull_request_template.md`, §0 kural 1'e "kabul edilmiş ADR'ler" | ✅ | 15 dosya + README; 0001 Kabul, 0002/0003/0004/0005/0013/0014 Önerildi, 0006–0012 Taslak; `tests/unit/adrBicimi.spec.ts` geçer; ADR-0004 seçenek matrisi kullanıcıya sunuldu |
| 18 | Ses kaynağı kararı (ADR-0004): şartlar birincil kaynaktan alıntılı, `sesKaynagi.json` `bekleyen` = Google Chirp 3 HD `tr-TR-Chirp3-HD-Puck`, `scripts/ses/googleTts.ts` (vekil uç noktası `GOOGLE_TTS_UC_NOKTA`, 429 geri çekilme), `npm run audio -- --ornek` | ✅ | ADR-0004 `Kabul` 28 Eki 2026 (KG-107): kullanıcı Kore/Aoede/Puck örneklerinden Puck'ı seçti, hız 0,9; çocuğa dinletme yapılmadı → Adım 32; bütçe uyarısı/anahtar kısıtı kullanıcı beyanıyla doğrulanmadı |
| 19 | Bayatlık kapısı K8: `scripts/durum.ts`, `npm run durum [-- --denetle | --agac]`, §14 durum bloğu, §12 üretilmiş ağaç, CI adımı | ✅ | `--denetle` CI'da yeşil; PROGRESS'e kasıtlı `ses=288` yazınca çıkış 1 (PR #19 açıklamasında çıktı); `durum.spec.ts` |
| 20 | Uygulama lisansı (ADR-0013 Kabul): tüm hakları saklı — `LICENSE`, `CONTENT-LICENSE`, `package.json` `UNLICENSED`, Kaynaklar ekranında lisans satırı | ✅ | Bağımlılık uyumu temiz (license-checker); `belgeTutarliligi.spec.ts` LICENSE ↔ package.json |
| 21 | Lisans envanteri K10 (`ucuncuTarafVarliklar.ts`, `npm run lisans:denetle`, LICENSES/Kaynaklar envanterden), `paraGorseli.ts` (KG-122: TCMB örnek banknotları, çoğaltma koşulları; KG-123: gerçek birbirine göre boyut, `banknotGoreliOlcek`), ADR-0014 Kabul (ilk 12 ay satış yok → okul/kurum lisansı); TCMB başvurusu yok (KG-19) | ✅ | K10 CI'da yeşil, tuzak testte kırmızı; TCMB çoğaltma koşulları testli (`paraGorseli.spec`) |
| 22 | Tek yayın kaynağı Vercel (ADR-0003 Kabul): `vercel.json` güvenlik başlıkları (CSP `connect-src 'self'`), Vercel Git entegrasyonu + Deployment Checks (`vercel-kontrol.yml` → `Vercel - okulumsun-tc: dogrula` geçmeden üretim yok, K11) + PR önizleme, `deploy-pages.yml` elle yedek, `robots.txt`, `docs/yayin.md` | ✅ PR #22 (`3bf9877`); zorunlu Deployment Check eklendi, canlı adreste 6 güvenlik başlığı doğrulandı | Birim + e2e CSP testleri yeşil; tuzak `fetch` dış alan engellendi |
| 23 | Yerel hata günlüğü (ADR-0005 Kabul): `src/hata/hataKaydi.ts` bellekte 20 kayıtlık halka tampon, `ErrorBoundary` + `error`/`unhandledrejection` + ses klibi hataları; yetişkin alanında "Sorun bildir" (kopyala/temizle, gönderim yok); sürüm kimliği `v0.1.0 · <sha>` | ✅ PR #23 (`ad0e235`); canlıya alma ertelendi (Vercel tetiği ulaşmıyor, KG-34) | `hataKaydi.spec.ts` (depolama/ağ casusu), e2e `sorun-bildir.spec.ts` |
| 24 | Deterministik geri bildirim sesi (`randomPraise(tohum)`/`randomRetry(tohum, denemeNo)`, `useGeriBildirim`; `Math.random` 0) + K9 gizlilik statik taraması (`npm run gizlilik:tara`, `scripts/gizlilik/kurallar.ts`, `depolamaIzinListesi.ts`) CI'da | ✅ PR #24 (`ae7f0d9`) | `geriBildirimSesi.spec.ts` (dağılım, ardışık farklı), `gizlilikTarama.spec.ts` (tuzak) |
| 25 | PWA kurulabilirlik: kendi ikonumuz (Bahçem çiçeği, KG-37, `npm run ikon:uret`; 192/512/maskable/apple-touch), `orientation: 'any'`, tema ve arka plan rengi `COLOR.bg` (krem, KG-36), manifest tek kaynak `scripts/yayin/pwaAyari.ts`, göreli favicon; Vite şablon logosu ve `icons.svg` kaldırıldı | ✅ PR #25 (`511c93c`); Lighthouse ve cihazda kurulum denemesi canlı yayın bekliyor (KG-34) | `manifest.spec.ts`, e2e `onizleme-pwa.spec.ts` |
| 26 | E2E genişletme ve gizlilik kanıtı: Playwright `onizleme` projesi (e2e kancalı test derlemesi `dist-e2e/` + `vite preview`, KG-38), tablet kişisel tam oturum, tahta sınıfça akış, çevrimdışı tam oturum + SW önbelleğinden ses, manifest/ikon 200, iki modda ağ/depolama gizlilik kanıtı (tuzaklı); ortak geometri yardımcısı; `depolamaIzinListesi` (`izinliMi`), birim `depolamaCasusu`; K5 boyut bütçesi (`npm run boyut`, `docs/boyut-butcesi.json`; 14 Eki 2026 Dexie → kendi IndexedDB sarmalayıcısı, ADR-0015 Kabul, KG-89: 833 147 → 740 264 B); e2e `main` push + PR, 3 projeli matris | ✅ | 9 e2e dosyası (board/tablet/onizleme), `depolamaIzinListesi.spec.ts`, `boyutButcesi.spec.ts`, `indexeddbUyum.spec.ts` |
| 27 | Cihaz profili ayar ekranı: yetişkin alanında "Ekran boyutu" (Otomatik / Akıllı tahta / Tablet / Telefon, 4 büyük düğme, gerçek boyutta önizleme kartı), `CihazProfiliBaglami` + `useCihazProfili`, `useDeviceProfile` `elleSecilen` döndürür ve seçimi aynı karede uygular; yalnız `okulumsun.deviceOverride` yazılır; birim depolama casusu happy-dom bağlı yöntem açığı kapatıldı. KG-101: elle seçilen tahta profili ya da kısa ekranda kişisel ana ekranın alt şeridi sığmıyorsa (`anaEkranYerlesimi.ts`, ölçüme dayalı) "Başla" ve Keşif Masası kart ızgarasının boş hücrelerine alınır; "Başla" kartlara binmez. KG-103 (kullanıcı bildirimi: etkinlikte geri/ana menü yoktu): her ekranda **Geri** ve **Ana menü** — tek bileşen `src/ui/gezinme/` (`GezinmeCubugu` simge + kısa metin, `--size-control`; `EkranCercevesi` her ekranı `App.tsx` `kabuk`undan sarar; yatayda solda yer kaplayan ray, tahtada düğmeler altta, portrede şerit), kurallar `gezinme.ts` (Geri = mantıksal üst ekran, birden çok girişli ekranda gelinen ekran; döngüsüz; ses kilidi, mod seçimi, ana ekran gezinmesiz), `appStore.gezin` + `girisler`, ilerleme kaybında büyük düğmeli "Etkinlikten çıkmak istiyor musun?" (set, Sınıf Turu, tema turu, ev çalışması), tarayıcı/Android geri tuşu aynı (`useGeriTusu`; gömülü modda geçmişe dokunulmaz), `?arsiv=` görünümünde ekran-yalnız çubuk; yerel Geri/Ev/"Çocuk ekranına dön" düğmeleri kaldırıldı | ✅ | `cihazProfiliAyari.spec.ts`, `anaEkranYerlesimi.spec.ts`, `gezinme.spec.ts` (kurallar, döngüsüzlük, onay, `gezin`), `gezinmeSozlesmesi.spec.ts` (her ekranda iki düğme, App kabuğu, yerel Geri yok, onay, geri tuşu, gömülü), e2e `cihaz-ayari.spec.ts` (tahta → `--scale` 1.6 → yenilemede kalıcı → Otomatik → tablet), e2e `ana-ekran-yerlesim.spec.ts` (tahta/tablet × 6 ekran, sınır kutusu kesişimi yok), e2e `gezinme.spec.ts` (tahta/tablet/tablet boyutunda tahta: etkinlikte Geri/Ana menü, çakışma ve taşma yok, onay, geri tuşu), gizlilik e2e akışında ayar seçimi |
| 28 | `src/platform/{tamEkran,uyanikTut,dersAyari}.ts`, `useUyanikTut`, AudioUnlock jestinde `tamEkranIste`, veli paneli "Derste tam ekran" (bellekte, yeni depolama yok) | ✅ | `tamEkran.spec.ts`, `uyanikTut.spec.ts`, e2e `board-tam-ekran.spec.ts` |
| 29 | Ürün hijyeni: `OturumDurumlari` (kırmızı yok, ham hata yok, hata yerel günlüğe), `acilistaTemizle` (mod bağımsız açılış silmesi), bugünün bahçesi (`bugunTamamlanan`, bellekte), `scripts/denetim/kirmiziYok.ts` K9a bağlı, `.gitignore` claude-cikti. Ses klipleri (3) Adım 18 anahtarı bekler. Not (KG-117): KG-19'un ekran şematik geçişi (`EKRAN_TCMB_GECISI` false, `public/images/banknotlar/` kaldırma) bu adımda yapılmadı; KG-121 (29 Eki 2026) ile her yerde şematiğe geçildi; **KG-122 (29 Eki 2026, kullanıcı kararı) bunun yerine geçti:** banknotlar ekranda, kâğıtta ve arşivde TCMB E9 5. tertip ön yüz örnek görselleri ("ÖRNEKTİR GEÇMEZ"; TCMB çoğaltma duyurusuna göre gerçek boyutta ≤ 72 dpi, kâğıtta ≈ 39,7 mm < %75), `TcmbBanknot` + `banknotAssets.ts` + `public/images/banknotlar/`, seçenek kartında kartın %88'i; `SematikBanknot` silindi; lisans envanterine TCMB satırı ve kırmızı denetimine TCMB raster istisnası geri geldi; Kaynaklar/veli paneli "TCMB örnek görselleri, kaynak: TCMB; izin başvurusu yapılmamıştır" | ✅ | `acilistaTemizle.spec.ts`, `bugununBahcesi.spec.ts`, `kirmiziYok.spec.ts`, `kaynaklarParaGorselleri.spec.ts`, `banknotVarliklari.spec.ts`, `paraGorseli.spec.ts` (≤ 72 dpi, kâğıtta < %75), e2e `bugunun-seti.spec.ts` (TCMB raster yüklenir, banknot kartı doldurur) |
| 30 | Rakam glifleri (KG-95, kullanıcı kararı; KG-42'nin yerine geçti): MEB TYMM 2024 resmî temel yazı fontu **TemelYazi** (HBY Tasarım). `scripts/rakam-glif-uret.py` → `src/ui/svg/rakamGlifYollari.ts` (TemelYazi-Bold, dolgulu path, 100×100), `rakamKilavuzYollari.ts` (MEB yazım yönü okları; yalnız geliştirme/form), `public/fonts/TemelYazi-Rakam.woff2` (0–9 `+ − = < >`, 3 552 B; `index.css` `'TemelYaziRakam'`, `--font-sans` ve `kagit.css` yığınında). Tek kaynak `RAKAM_GLIFLERI` (`yazimSirasi` MEB Kılavuz oklarından), DEV glif kartı (`?gelistirme=glif`), öğretmen formu `npm run glif:formu`; arşiv (165) ve etki formu PDF'leri yeniden basıldı. **KG-96 (17 Eki):** çocuğa dönük metnin harfleri de TemelYazi (`TemelYazi-Harf.woff2`, 19 328 B; `'TemelYazi'` 400 size-adjust %120, SVG için `'TemelYaziSvg'`), yetişkin yüzeyleri Andika (`src/design/yaziYuzeyi.ts`, `data-yazi`), arşiv/etki PDF'leri ve `kagit-2x3` tabanı yeniden üretildi. **KG-98 (20 Eki):** konu kartı etiketi kart boyunun 1/6'sı (tablet 20 px, tahta 30 px; `TEXT.kartEtiketi`), talimat balonu alt metni `KART_ETIKETI_YAZI`, `BigButton` `data-yetiskin`; fontta olmayan `· – — …` metin tarafında çözüldü (`kagitYazisi` görüntü çevirisi, `KisaCizgili`; kâğıt kodları, `?arsiv=` ve özetler değişmedi), çocuk yüzeyinde ve 165 arşiv PDF'inde Andika yok, kâğıt yönerge satır aralığı 1,32 | ✅ (MEB resmî fontu; öğretmen teyidi isteğe bağlı, yazılı kullanım izni kullanıcıda) | `rakamGlifleri.spec.ts` (10 glif, taban/yükseklik, bayraklı 1, çizgili 7, açık üstlü 4, kılavuz, CSS yığını, Visual tek kaynak + dolgu); `temelYaziHarf.spec.ts` (kapsam, yığınlar, yazı yüzeyi, App `data-yazi`, KG-98 karakter denetimi); e2e `yazi-tipi.spec.ts` (çocuk yüzeyinde Andika isteği yok, kart etiketleri ≥ 20/30 px ve kartın içinde, kâğıt kodu metni aynı) |
| 31 | Ses kliplerinin lisanslı kaynakla yeniden üretimi (ADR-0004 Kabul): `sesKaynagi.json` aktif = Google Cloud TTS Chirp 3 HD `tr-TR-Chirp3-HD-Puck` hız 0,9 (`bekleyen` silindi), 287 klip sıfırdan, `.hashes.json` `$kaynak` + `klipOzeti`, `SES_GECIS_MODU` kaldırıldı (K4 tam), Kaynaklar "Sesler" bölümü + LICENSES ses satırı (gönüllü ifşa), `generate-audio.ts` `--en-cok`, her klipten sonra atomik özet, istek/karakter sayacı; **ücretsiz katman koruması** (KG-109): `scripts/ses/ucretsizKatman.ts` aylık karakter defteri (depo dışında, `TTS_KULLANIM_DOSYASI`, Pacific ay), güvenli sınır 900.000/ay (`TTS_GUVENLI_SINIR` yalnız aşağı), çalışma başı tahmin + her istek (yeniden denemeler dahil) öncesi denetim, `--kuru`/`--dry-run`, tam yeniden üretim yalnız `--zorla` (`scripts/ses/uretimPlani.ts`); **aşama 2 (KG-110):** ertelenen 27 klip (`ui.bir-sorun-oldu`, `ui.hazirlaniyor`, `ui.set-basliyor`, `ui.set-bitti`, `ui.cikis-onayi`, `bahce.bugun`, `sinifturu.*` 12, `ev.*` 3, `kesif.*` 3, `tematuru.*` 2, `isinma.*` 2) üretildi ve akışlara bağlandı: `src/audio/girisSesi.ts` (SAF; giriş cümlesi ilk sorunun talimatının önüne, `ilkAraMs` 450 ms, `tekrarSes` özgün talimat), `speech.ts` dizide `ilkAraMs` + `tekrar` seçeneği ("Tekrar dinle"/talimat tekrarı `Prompt.tekrarSes`'i çalar), `appStore.duyuru` (tek seferlik duyuru: "Seti bitir" → ana ekranda "Bugünkü etkinlikleri bitirdik."), çıkış onayı sesli; yedek klipler (`ui.oturum-bitti` ev/Sınıf Turu/tema turu sonunda, `renk.*` sıra duyurusu, `yardim.k2-birlikte-sayalim` Sınıf Turu) kaldırıldı | 🔄 | 314/314 klip; aşama 1: 287 istek · 3.365 karakter, aşama 2: 27 istek · 674 karakter (defter 2026-10: 5.674 / 900.000); `public/audio/` 1.969.306 → 2.696.181 B (aşama 1; JS bütçesi etkilenmez); `girisSesi.spec.ts` (27 anahtar manifestte ve kodda, "yanlış" yok, ≤ 8 sözcük, yedek klip kalmadı, giriş/tekrar, Sınıf Turu başlıyor/son tur, ısınma, duyuru). Kalan: kulakla örneklem ve birleştirme dinlemesi (kullanıcı), `v0.2.0-pilot` etiketi (⛔ O5) |
| 34 | Bugünün seti (tahta/öğretmen): `src/ogretmen/{dugumKodlari,gunlukSet,tahtaSorusu}.ts` (kararlı 2 karakterlik düğüm kodları, saf set mantığı, `App.tsx`'ten taşınan saf soru üretimi), `SetHazirla` ekranı (≤4 düğüm, alt %65, ≥102 px), AnaEkran "Öğretmen" girişi, veli paneli "Öğretmen alanı", `appStore.aktifSet` (yalnız bellekte), validate düğüm kodu denetimi. Ses klipleri (`ui.set-basliyor`, `ui.set-bitti`) GCP anahtarı gelene kadar ertelendi (KG-43) | ✅ | `gunlukSet.spec.ts`, `tahtaSorusu.spec.ts` (39 şablon), `dugumKodlari.spec.ts`, e2e `bugunun-seti.spec.ts` |
| 35 | Yazdırılabilir çalışma kâğıdı + cevap anahtarı: `src/ogretmen/calismaKagidi/{yazdirmaUygunlugu,kagitMaddesi,kagitPlani,kagitYerlesimi,cevapAnahtari,sesMetni}.ts` (saf; aynı istek → aynı plan, cevap `validation` alanından), `CalismaKagidi` ekranı (tembel yüklenir) + `KagitSayfalari`/`kagit.css` (HTML+SVG, `@page` A4, 12 mm kenar, seçenek kutusu ≥ 26 mm, TCMB örnek banknotu ≈ 39,7 mm — KG-122; KG-123: kupürler gerçek birbirine göre boyutlarında, 200 TL ≈ 39,7 mm … 5 TL ≈ 32,2 mm), `SetHazirla`/`VeliPaneli` girişleri, validate yazdırma sınıfı denetimi (23 uygun · 14 uyarlanır · 2 uygun değil); ADR-0006 Kabul. KG-99: kâğıt yönergesi ayrı metin kaynağından (`kagitYonergesi.ts`: aynı ses anahtarları için kâğıt metni, ör. "Nesneleri parmağınla göstererek say."; cevap anahtarı telafileri de; `tr.json`/ses değişmedi, kara liste testi); KG-100: altbilgi 3,2 mm, harf aralığı normal. KG-102: cevap anahtarı sıkı düzen (aynı tanılı çeldiriciler tek cümle, telafi önerisi tanı başına bir kez) ve sayfaları kodda planlanır (`anahtarSayfalari.ts`, sabit A4 kutusu); altbilgideki "Sayfa n / N" = basılan PDF sayfa sayısı (MAT.1.3.4 kâğıtları 3 → 2 sayfa); küçük eylem satırı harf aralığı normal. İki öğretmen incelemesi ve elle siyah-beyaz baskı bekliyor | ✅ | `calismaKagidi.spec.ts` (determinizm, doğruluk, sınıflandırma, para, depolama/ağ yok), `kagitYonergesi.spec.ts` (ekran fiili kara listesi: 165 arşiv, etki A/B, çalışma kâğıdı planları), `anahtarSayfalari.spec.ts` (gruplama, sayfa planı, commitlenmiş 165 arşiv + etki A/B PDF sayfa sayısı = plan toplamı), e2e `calisma-kagidi.spec.ts` (PDF sayfa sayısı; tüm ekran seçeneklerinde PDF = altbilgi; yazdırma ortamı ölçüleri, görsel taban `kagit-2x3`), e2e `onizleme-kagit-sayfa-sayisi.spec.ts` (165 arşiv, etki A/B, 84 ekran seçeneği kodu: PDF = altbilgi, anahtar taşmıyor); arşiv/etki üretim betikleri uyuşmazlıkta durur |
| 36 | Sınıf Turu (ADR-0008 Kabul): `src/sinif/sinifTuru.ts` (SAF durum makinesi: 2–4 takım, döngüsel sıra, yıldız + yaprak, öğretmen bitirir) + `src/sinif/takim.ts` (renk + hayvan + renk sesi kimliği, ikinci yanlışta birlikte çözme, tur sonucu); `ExerciseScreen.onDone` `MaddeSonuc` taşır, `onYanlis` yanlış denemeleri bildirir; `SinifTuruKurulum`/`SinifTuruEkrani`/`SinifTuruSonu` + `SinifKavanozu`, ana ekranda tahta kartı, `appStore.sinifTuru` yalnız bellekte. Sesler (KG-110): "Sınıf turu başlıyor!", tam cümle sıra duyurusu "Sıra mor takımda.", "Bu son tur.", "Hep birlikte çözelim." (şerit de), "Kavanozu birlikte doldurduk!" / "Bugün birlikte çalıştık!"; ADR-0008 Kabul (KG-49), tablet deneme turu cihazda bekliyor | ✅ | `sinifTuru.spec.ts`, `sinifTuruAkis.spec.ts`, `exerciseScreenSonuc.spec.ts`; e2e `board-sinif-turu.spec.ts` (3 takım × 3 tur → kavanoz kutlaması, ikinci yanlışta "hep birlikte", her ekranda tahta geometrisi, ekranda puan/skor yok, depolama boş; öğretmen "Bitir" iki dokunuş) |
| 37 | Haftalık MEB planı: aşama 1 (SAF, KG-48) `src/content/okulTakvimi.ts` (2026–27: 37 öğretim haftası; ara tatiller 16–20 Kas, 8–12 Mar; yarıyıl 25 Oca–5 Şub; MEB genelgesi 13 Haz 2026), `src/ogretmen/haftalikPlan.ts` (ders saatlerinden haftaya kazanım + hazır düğüm; `buHafta`, `varsayilanHaftaIndeksi`, `haftaSetDugumleri`), `planDuzeltmeleri.json` + zod şeması, `planDisaAktar.ts` (CSV UTF-8 BOM `;`, yazdırılabilir HTML); validate: her hazır düğüm ≥1 haftada, hafta sayısı = takvim. Aşama 2 (KG-50): `HaftalikPlan.tsx` (tembel yüklenir; seçili hafta ayrıntısı, salt okunur yıl tablosu, önceki/bu/sonraki hafta, alt %65'te ≥102 px eylemler), `src/ogretmen/yillikPlan.ts` (veri bağlama, dinamik içe aktarım), `src/platform/dosyaIndir.ts` (Blob + `<a download>`, ağ yok), seçili haftadan tahtada set ve çalışma kâğıdı, `SetHazirla`'da "bu haftanın önerisi" (tek dokunuş, kendiliğinden seçmez), veli/öğretmen alanında "Haftalık plan". İki öğretmenin resmî yıllık planla karşılaştırması kullanıcıda | ✅ (öğretmen karşılaştırması bekliyor) | `haftalikPlan.spec.ts`, `planDisaAktar.spec.ts`, `haftalikPlanEkrani.spec.ts` (varsayılan hafta/tatil, öneri, Blob indirme casusu, ağ yok), e2e `haftalik-plan.spec.ts` (saat 13 Eki 2026'ya sabit: bu hafta vurgusu, gezinme, tahta geometrisi, CSV/HTML indirme ağ isteği üretmez, set ve kâğıt başlar, öneri; KG-118: 1080×810 tahtada başlık kırpılmaz, tablo görünür, alt eylemler son çare dikey kaydırmayla erişilir, 1920×1080'de kaydırma yok) |
| 38 | Öğretmen tanıtım sayfası: aşama 1 (KG-51) `scripts/tekil-soru-sayisi.ts` (`npm run tekil-soru`; temkinli içerik imzası, alt sınır **66.381**), `docs/tekil-soru-sayisi.json`, `docs/konumlandirma.md` (kaynaklı; sayfada marka anılmaz). Aşama 2 (KG-52): `scripts/ogretmen-sayfasi.ts` (`npm run ogretmen:sayfa [-- --kart]`; renkler `tokens.ts`'ten, sayılar `durum`/ölçümden) → `public/ogretmen/index.html` (statik, betiksiz, formsuz, yalnız aynı köken; 3 araç kartı, nasıl açılır, veri almıyoruz kutusu, ölçülmüş içerik hacmi, SSS, `pilot` etiketi, `<!-- durum:... -->` bloğu) + `kart.png` (1200×630); Workbox `navigateFallbackDenylist` (`/ogretmen`, `/gizlilik`, `/kagitlar`); README bağlantısı. Kullanıcıda: 30 sn video, içerik danışmanları, iletişim adresi, 3 öğretmenle 60 sn testi, canlı yayın (KG-34) | ✅ (video, danışmanlar, iletişim, öğretmen testi ve yayın kullanıcıda) | `tekilSoruSayisi.spec.ts`, `tanitimMetni.spec.ts` (sayfa üreticiyle aynı, sayılar kodla aynı, "kanıtlandı"/rakip markası yok, dış kaynak/betik/form yok), e2e `onizleme-tanitim.spec.ts` (üretim başlıkları, aynı köken, çerez yok, CSP temiz, font, uygulamaya bağlantı) |
| 39 | Gizlilik kanıt paketi: aşama 1 (KG-53) `scripts/gizlilik-sayfasi.ts` → `public/gizlilik/index.html` (ne toplanmaz, iki mod, cihazda kalan anahtar, ağ, CSP tam metni, 3 adımlı kendin doğrula, boş IndexedDB açıklaması) + `kvkk.html` (Seçenek A, **taslak**). Aşama 2 (KG-54): e2e `onizleme-gizlilik-ag` her akışta kanıt kaydı yazar (`kanitKaydet`), `scripts/gizlilik/kanitRaporu.ts` (SAF) + `scripts/gizlilik-raporu.ts` (`npm run gizlilik:rapor`) → `docs/gizlilik/kanit-raporu.md` (istekler türe göre, başka köken/gövde/soket/çerez/IndexedDB; ihlalde çıkış 1), CI `onizleme` işinde rapor + `gizlilik-kanit-raporu` artefaktı; `docs/gizlilik/rozet-yol-haritasi.md` (adaylar [doğrulanmadı — Adım 56'da]). Kullanıcıda: hukuki görüş (KVKK taslaktan çıkar), bir yönetici/velinin yardımsız 3 adım denemesi, yayın (KG-34) | ✅ (hukuki görüş, yönetici/veli denemesi ve yayın kullanıcıda) | `gizlilikSayfasi.spec.ts`, `gizlilikRaporu.spec.ts` (tür sınıflama, ihlal tespiti, rapor satırı), e2e `onizleme-tanitim.spec.ts`, `onizleme-gizlilik-ag.spec.ts` (kanıt kaydı) |
| 40 | Ders sonu özeti: aşama 1 (KG-55) `src/ogretmen/dersOzeti.ts` (SAF; en çok 3 beceri, düğüm başına ≥2 madde, baskın tanı, sınıf etkinliği, yarın için set; sayı/yüzde yok). Aşama 2 (KG-56) `DersSonuOzeti` ekranı, bellek içi `useDersOturumu`, "Dersi bitir" (ana ekran, Sınıf Turu sonu). Aşama 3 (KG-57) tanı/yardım kademesi taşıma: alt ekranlar `onYanlis(YanlisBilgisi)` bildirir (`yanlisSecimBilgisi`: sözleşmeli tanı, K2 gösterildiyse kademe 2), `ExerciseScreen` madde boyunca biriktirip `MaddeSonuc`'a koyar, `dersOlayiUret`; Sınıf Turu maddeleri de derse girer, `turSonucu` K2'yi düşürmez. Öğretmenlerin tanı açıklamalarını anlaşılır bulması Adım 41'de sorulur | ✅ (öğretmen görüşü Adım 41'de) | `dersOzeti.spec.ts`, `useDersOturumu.spec.ts`, `yanlisBilgisi.spec.ts`, e2e `board-ders-sonu.spec.ts` (6 soru → özet: zorlandı + baskın tanı + etkinlik, sayı/yüzde yok, depolama boş → yarın için set; yenileme olayları siler) |
| 42 | Eve link (ADR-0010 Kabul): aşama 1 (KG-58) `src/ogretmen/eveLink.ts` (SAF; `<kök>/#ev=1.<set kodu>`, veri yalnız hash'te, katı çözücü: fazla alan/sürüm/karakter → null, ≤40 karakter). Aşama 2 (KG-59) `src/platform/eveLinkAcilis.ts` (açılışta eve link girişimi `history.replaceState` ile adresten silinir, geçerliyse `appStore.evSeti` yalnız bellekte), `EvdeCalis` (ses kilidi → set tabanlı 8 soru → kutlama → Ev; sonuç tutulmaz). Aşama 3 (KG-60) `EveGonder` (tembel yüklenir; yerel QR `src/ogretmen/qrMatrisi.ts` + `qrcode-generator` MIT, K10 envanteri; kısa bağlantı, Kopyala/pano, Geri), `src/platform/kanonikKok.ts` (http(s) ise açılan kök, değilse kanonik yayın adresi), `SetHazirla` (tahta) ve `DersSonuOzeti` "Eve gönder", `/gizlilik` "Eve link" bölümü. `ev.okuldaki-konu`/`ev.bitti` klipleri Adım 31'de | ✅ (ses klipleri Adım 31'de) | `eveLink.spec.ts`, `eveLinkAcilis.spec.ts`, `eveGonder.spec.ts` (QR determinizmi/sürüm ≤5, kök, durum, lisans), e2e `eve-link.spec.ts` (8 soru, hash silinir, ağ isteklerinde set kodu yok, depolama boş; bozuk link olağan açılış), `eve-gonder.spec.ts` (set → QR + bağlantı, tahta geometrisi, pano, bağlantı ev çalışmasını açar) |
| 43 | Evde 10 dakika (kişisel mod): aşama 1 (KG-61) `src/content/evIpuclari.json` + `schema/evIpucu.ts` (7 tema × gözlem/soru/etkinlik, "yanlış" yok), `src/ogretmen/evdeOnDakika.ts` (SAF: bu hafta + 1 hatırlama, ≤4 düğüm), validate. Aşama 2 (KG-62): `src/ogretmen/evdeOnDakikaBaglama.ts` (tembel; plan düğümleri oynatılabilir düğümlere süzülür, tema → ipucu), `src/content/evIpuclari.ts`, veli paneli "Evde 10 dakika başlat", `EvdeCalis` sonunda yetişkine "İpucu kartı", `VeliIpucuKarti` (tembel), `appStore.evdeOnDakikaTema` (yalnız bellekte). `ev.yetiskine-ver` sesi Adım 31; iki öğretmen okuması kullanıcıda | ✅ | `evdeOnDakika.spec.ts`, `evIpuclari.spec.ts`, `evdeOnDakikaBaglama.spec.ts`, e2e `evde-10-dakika.spec.ts` |
| 44 | Keşif Masası: aşama 1 (KG-63) `src/kesif/kesifMasasi.ts` (SAF indirgeyici: onluk çerçeve 20 göz, nesne kümesi ≤20, sayı doğrusu 0–20, terazi kefe ≤10, ayır-birleştir toplam ≤20; geçersiz olay durumu değiştirmez; seslendirme yalnız mevcut `sayi.*`/`op.*`/`esit.*` klipleri). Aşama 2 (KG-64): `KesifMasasi` ekranı (tembel; üst bölge yalnız büyük rakam, araç + alt düğme sırası alt bölgede, ≥ `--size-tap-min`), `src/ui/kesif/{OnlukCerceveAraci,NesneKumesiAraci,SayiDogrusuAraci,ortak}.tsx` + `kesifEkrani.ts` (sayı doğrusu 11 noktalık pencere), AnaEkran girişi (tahtada 5 sütunlu ızgarada kart, kişiselde Başla yanında), `Ekran` += `kesifMasasi`; CSP düzeltmesi: zod kullanan her şema dosyası `zodAyari`'nı ilk içe aktarır (paylaşılan parça girişten önce çalışınca `jitless` geç kalıyordu; `zodAyari.spec.ts`). Aşama 3 (KG-65): `TeraziAraci` (kefe başına −1/+1, eğim yalnız `rotate`, ±16°; genel +1/−1 gizli), `AyirBirlestirAraci` (sayaca dokun = oradan ayır, ikinci parça başka renk; "Birleştir"), üst gösterim `gosterilenMetin` ("2 + 3", "1 = 1"), tanıtım sayfasına Keşif Masası kartı. `kesif.*` sesleri Adım 31. KG-120 (küçük tahta 1080×810): araç alanı genişliği ölçülür (`onlukTekMi`/`nesneTekOnlukMu`); iki onluk yan yana sığmazsa tek onluk + "İkinci onluk"/"Birinci onluk" geçiş düğmesi (diğer onluğun küçük önizlemesi; sessiz, yeni klip yok), nesneler 5'li iki sıra; değişen göz/son nesne kendi onluğunu açar; büyük rakam bölgeye sığar; 102 px ve üst %35 korunur. 1920×1080 tahtada ve 1080×810 tablette yerleşim piksel piksel aynı. KG-124 (küçük tahta sayı doğrusu): 11 nokta × `--size-tap-min` tek sıraya sığmıyorsa (`sayiDogrusuDuzeni`; 1080×810 tahtada 1314 px > 825 px) zikzak — 0–10 çizgisi ölçülen genişliğe ölçeklenir (adım 72,3 px), çiftler çizginin üstünde, tekler altında, her nokta yine 102 px kare ve TemelYazi seçenek etiketi boyunda; 1920×1080 tahtada ve tablette tek sıra, piksel piksel aynı. KG-125 (küçük tahta terazi): ekran yüksekliği 9 × `--size-tap-min` altındaysa (`teraziSikisikMi`; 1080×810 tahtada 810 < 918) terazi sıkı çizilir (kefe 2,4 × 1 tapMin, sayaç 0,4 tapMin, ayak 0,25 tapMin, kefeler arası 0,5 tapMin) ve büyük rakam ölçülen üst bölgeye sığar (önce bölge 56 px, 179 px rakam üstten kesik; şimdi bölge 160 px, rakam 120 px tam görünür; 10–0 eğiminde yükselen kefe rakama binmez); 1920×1080 tahtada ve tablette terazi aynı | ✅ | `kesifMasasi.spec.ts`, `kesifMasasiEkrani.spec.ts` (yerleşim ölçüleri; KG-124 sayı doğrusu düzeni), `zodAyari.spec.ts`, e2e `board-kesif-masasi.spec.ts` (KG-120: 1080×810 tahta testi, eski yerleşimde kırmızı; KG-124: 1080×810 sayı doğrusu — 11 nokta ekranda, ≥102 px, çakışmasız; KG-125: 1080×810 terazi — rakam bölgede ve ekranda, ≥80 px, 10–0'da kefe rakamın altında), `kesif-masasi.spec.ts` |
| 45 | Derin tema girişi: aşama 1 (KG-111) `src/content/temaGirisleri.json` + `schema/temaGirisi.ts` (7 tema × 4 adım: `ses` = `giris.t<tema>-<adım>` manifestte, `gorsel` VisualSpec, `eylem` izle/dokun, dokun adımında `hedefAssetId`, `enUzunBeklemeMs` 1–15 sn; ilk/son adım izle), `temaGirisleri.ts` yükleyici, derleme zamanı doğrulama (`icerikDogrulama`) + `validate`, 28 klip Puck (28 istek · 1.231 karakter). Aşama 2 (KG-112): `src/ui/temaGirisiAkisi.ts` (SAF durum makinesi: izle bekleme sonunda ilerler; dokun adımı dokunuşu bekler, dokunulmazsa anlatım bir kez tekrarlanır, sonra kendiliğinden ilerler; dokununca övgü), `DerinTemaGirisi` (tembel; üst %35 yalnız uyaran — maskot dokunulmaz, tema adı; dokun hedefi alt %65'te büyük kart; küçük yetişkin "Girişi geç"), `TemaGirisi` `kisa`/`derin`, `appStore.temaGirisiBicimi` + `derinGirisGosterildi` (kişiselde oturum başına bir derin giriş, yalnız bellek), `temaGirisiBaslat` + `KonuSecimi` ilk kart "Temaya giriş" (tahta; bitince konu seçimine döner), Geri kuralı `temaGirisi` → ana ekran / konu seçimi. İki öğretmen + 2 pilot çocuk izlemesi kullanıcıda | ✅ (izleme notu kullanıcıda) | `temaGirisi.spec.ts` (şema, 7 × 4, 28 anahtar manifestte, ton kuralları, bozuk girdi reddi, görseller çizilir), `temaGirisiAkisi.spec.ts` (akış, tekrar sınırı, 7 temada biter, store biçimi, tembel yükleme, depolama/ağ yok), e2e `board-tema-girisi.spec.ts` (tahta 4 adım + dokun hedefi geometrisi, tekrar, Girişi geç/Geri, kişisel ilk derin sonra kısa) |
| 46 | Tema sonu turu: aşama 1 (KG-66) `src/ogretmen/temaTuru.ts` (SAF: 8–10 madde; temanın hazır düğümleri ≤10 ise hepsi, fazlaysa öğretim sırasını eşit aralıkla örnekleyen 10 düğüm; set bellekte, kodlanmaz). Aşama 2 (KG-67): `temaTuruOzeti` (SAF; ders özeti eşikleri `duzeyVePuan`, tek madde yeterli, sayı/yüzde alanı yok), `src/ogretmen/temaTuruBaglama.ts` (oynatılabilir düğümler), `TemaTuru` ekranı (tembel; 8–10 soru, küçük "Turu bitir", kutlama → "Yetişkin: tur özetini aç" → nitel düzey listesi → Bitti), `KonuSecimi` son kart "Tema turu" (tahta), veli paneli "Tema turu" bölümü (kişisel; açık tema seçimi), `appStore.temaTuru` (yalnız bellekte), `Ekran` += `temaTuru`. `tematuru.*` sesleri bağlandı (KG-110). Adım 45 (derin tema girişi) Adım 31'in 28 klibine bağlı, atlandı | ✅ (ses klipleri Adım 31'de) | `temaTuru.spec.ts` (plan, özet, bağlama, store), e2e `tema-turu.spec.ts` (tahta + kişisel; ≥8 soru, nitel özet, puan/yüzde yok, ağ ve depolama temiz) |
| 47 | Isınma Keşfi (ADR-0007 Kabul, 2026-10-14, Seçenek 2): aşama 1 (KG-76, KG-77) `src/progress/seviyeTespiti.ts` (SAF: okul ayının açtığı temaların oynanabilir düğümleri ön koşul sırasına dizilip ≤15 işarete eşit aralıkla örneklenir; en kolay işaretten başlar, ilk denemede doğruda +2, yanlışta −1, ardışık 2 yanlışta ya da 8 maddede biter; `seviyeTahmini` geçilen işaretleri ve sert ön koşullarını oturum içi açık sayar, başlangıç hedef zorluğu varılan işaretinki), `scheduler.ts` isteğe bağlı `oturumIciAcikDugumler`/`hedefZorlukBaslangici` (yoksa davranış aynı), `session.oturumBaslat` isteğe bağlı tahmin (oturum nesnesine yazılmaz), `oturumRuntime.secilenSoruyuUret` hedefi ölçmeyen tohumda deterministik yedek tohum; PLAN §6.5 "Isınma Keşfi (isteğe bağlı)", §17 sabitleri. Aşama 2 (KG-78): `appStore.isinmaAcik` (varsayılan kapalı, yalnız bellek; mod seçimi kapatır), veli panelinde yalnız kişisel modda "Isınma" bölümü ("Oturuma kısa ısınmayla başla"), `useKisiselOturum`: anahtar açıksa açılış başına bir kez önce ısınma maddeleri (ustalık/olay/aktif oturum/özet yazımı yok; doğruluk = ilk deneme, `onYanlis` → `yanlisBildir`), bitince tahminle 8 soruluk plan; tahmin plandan sonra bellekten atılır; sessiz geçiş (yeni klip yok, KG-01); `data-isinma` kök özniteliği (görünmez). Aşama 3 (KG-79): e2e `isinma-kesfi.spec.ts`. 2 çocukla deneme notu (sınav algısı) ve `v0.5.0` etiketi kullanıcıda | ✅ (çocuk denemesi ve ısınma klipleri — Adım 31 — kullanıcıda) | `seviyeTespiti.spec.ts` (≤8 madde, kolaydan başlar, +2/−1, ardışık 2 yanlış, tahmin sert ön koşulları açar, SAF, depo casusu: hiçbir yazım yok), `scheduler.spec.ts` (yeni girdiler yokken 500 tohumda aynı plan), `oturumRuntime.spec.ts` (yedek tohum), `isinmaBaglama.spec.ts` (kapalıyken tahminsiz plan; açıkken ısınma boyunca kalıcılık yazımı ve depo erişimi yok, ilk deneme doğruluğu, ≤8 madde, açılışta bir kez, anahtar kapatılınca biter, tahtada yok), e2e `isinma-kesfi.spec.ts` (varsayılan kapalı; açınca ısınma, 2 yanlışta biter, ardından tam oturum; depo ihlali yok; yenilemede kapalı; kapalıyken ısınma yok; tahtada anahtar yok) |
| 48 | Çalışma kâğıdı arşivi + SEO: aşama 1 (KG-69) `src/ogretmen/calismaKagidi/arsivTohumlari.ts` (101, 202, 303; yalnız eklenir), `arsiv.ts` (SAF: kâğıda girebilen her hazır düğüm × 3 tohum, tek düğümlü 6 madde 2×3; yanıt biçimi daire içine al, olmazsa yazmalı; yol `kagitlar/<kazanım>/<düğüm kodu>-<tohum>.pdf`; `kagitMetinOzeti` determinizm). Aşama 2 (KG-70): `?arsiv=<kâğıt kodu>` görünümü (`src/ui/print/ArsivKagidi.tsx`, tembel; uygulama kabuğu açılmaz; arşivde kesikli çerçeve düz), `scripts/calisma-kagidi-arsivi.ts` (`npm run build && npm run arsiv`; vite preview + Chromium A4 PDF, tarih alanları sabit → aynı bayt; `--eksik`, `--yalniz-dizin`), 165 PDF + statik dizin sayfaları `public/kagitlar/` ve `public/sitemap.xml` commitlenir (Vercel derlemesinde Chromium yok), `robots.txt` `Sitemap:`, Workbox `globIgnores: kagitlar/**`, `/ogretmen` bağlantısı. Para: TCMB örnek banknotları (KG-122; mat-1-1-9/e1 ×3 yeniden basıldı, sayfa sayıları aynı; KG-123 oranlı boyutla yine yalnız bu 3 PDF, sayfa sayıları aynı). Adım 47 (Isınma Keşfi) ADR-0007 2026-10-14'te kabul edildi (KG-76). Dizin alt bilgisi "Sınıfınız için yazdırabilirsiniz." (KG-81, 2026-10-14; içerik lisansıyla uyumlu, PDF'ler değişmedi) | ✅ | `arsiv.spec.ts`, `arsivDizini.spec.ts` (dizin/sitemap tazeliği, her kaydın PDF'i, dış kaynak yok), e2e `onizleme-kagit-arsivi.spec.ts` (aynı köken, çerez yok, PDF iner, arşiv görünümü) |
| 49 | Okul ağı ve yerel dağıtım (KG-71): `scripts/okul-paketi.ts` (`npm run build && npm run okul-paketi` → `dist-okul.zip`: `okulumsun/` + OKUBENI + LICENSE/LICENSES.md + SURUM + SHA256SUMS; sıralı, sabit tarihli, deterministik), CI'da yalnız `main` push'unda artefakt (GitHub Release eki yok: kurum dağıtımı ADR-0013 gereği yazılı izin ister, izin metni kullanıcıda), `public/yerel-acilis.js` (klasik betik; `file://` açılışında boş ekran yerine yönerge), `docs/kurulum/okul-agi.md` (filtre listesi alan adı, okul sunucusu, alt dizin, MIME, USB/yerel sunucu, güncelleme). `file://` tam desteği (modülsüz tek dosya derleme + `<audio>` ses yolu) yapılmadı | ✅ (`file://` belgeli sınır; düz HTTP okul sunucusunda tam akış sınanmadı) | `okulPaketi.spec.ts` (zip içeriği, özetler, determinizm), e2e `onizleme-yerel.spec.ts` (alt dizinden tam akış, istekler yalnız alt dizinde, ses dâhil; `file://` uyarısı) |
| 53 | Etki çalışması: 53a belge taslakları (KG-90) `docs/research/etki-calismasi-on-kayit.md` (tek birincil hipotez, 20 maddelik kâğıt test Form A/B, Hedges g + %95 GA, karşılaştırma sınıfı varsa ön test ortak değişkenli ANCOVA, dışlama kuralları, karar kuralı), `etki-calismasi-protokol.md` (desen, takvim 15 Mar–16 Nis 2027, müdahale, sadakat kâğıt günlüğü — uygulama içi kayıt yok, etik, Ç-kodu, veri imha planı; Ek A: bugünkü kâğıt üreticisinden Form A/B taslak madde listesi), `izin/mem-basvurusu.md`, `formlar/etki-veli-onami.md`; hepsi TASLAK; analiz eki (g_av + bootstrap %95 GA), dışlama kuralları ve imha tarihleri kullanıcı onaylı (KG-92). 53b kod kısmı (KG-93): `src/ogretmen/calismaKagidi/etkiFormu.ts` (20 yuvalık desen; Form A/B sıra sıra aynı düğüm/şablon/zorluk düzeyi, ortak madde yok, tohum 53101/53201), `scripts/etki-formu-uret.ts` → `docs/research/olcme-araci/` (README: eşdeğerlik, madde listesi, cevap anahtarı, puanlama yönergesi; iki PDF), `?arsiv=ETKI-1-A\|B` (Ç-kodu satırı, anahtar basılmaz), `tests/unit/etkiFormu.spec.ts` | 🔄 kısmi — 53a taslakları ✅ (pilot bulguları Adım 32 bekliyor; OSF kaydı ve MEM başvurusu yapılmadı, ⛔ O6); 53b kod ✅; 53b içerik geçerliği (2 öğretmen + 1 uzman), ön deneme (3–5 çocuk), `surum/0.3-etki` + `v0.3.1-etki` (⛔ O5), saha ve 53c ⬜ | Ön kayıt veri toplanmadan önce damgalı; izin ve onamlar alındı; saha (≥%70 sadakat veya sapma raporlandı); rapor yayımlandı; olgunluk etiketi rapora göre |
| 54 | Maskot dünyası, aşama 1 (sessiz görsel kısımlar, KG-91): `docs/maskot/karakter-kitabi.md` (3 sıfat, konuşma tarzı, yapmadıkları §7.1, poz tablosu §7.5, tema dünyaları), `src/content/temaDunyalari.ts`, `src/ui/svg/temaSahneleri.tsx` + `src/design/sahnePaleti.ts` (7 programatik SVG arka plan, dokunulmaz, pastel ≥7:1), `src/content/maskotHikayeleri.json` + `schema/maskotHikayesi.ts` (7 × 3; derleme zamanı doğrulama), `maskotHikayeleri.ts` yükleyici (`siradakiSahne`), geliştirme önizlemesi `?gelistirme=hikaye`. **Maskot sesi (KG-114, K-12):** `tr-TR-Chirp3-HD-Achernar` hız 0,9, `sesKaynagi.json` `anahtarSesleri` (`maskot.*`, `hikaye.*`; diğerleri Puck), özet klibin ses adını içerir (Puck klipleri yeniden üretilmez). **Maskot adı (KG-115):** kullanıcı kararı, tek kaynak `src/content/maskot.json` (`MASKOT_ADI`; ses metinlerinde `{maskotAdi}` yer tutucusu, `scripts/ses/klipler.ts` doldurur; ad değişince yalnız `maskot.selam` yeniden üretilir). **Aşama 2 (KG-116):** 21 `hikaye.t*-*` + `maskot.selam` Achernar ile üretildi (22 istek · 1.186 karakter); derin tema girişi hikâye açılışıyla başlar (selam + 1. sahne, `HikayeSahnesi.tsx` dokunulmaz, tembel), kişisel oturum sonunda sıradaki sahne (`src/ui/hikayeAkisi.ts`, `appStore.temaOturumlari` yalnız bellekte); tahtada hikâye yalnız tema girişinde | 🔄 kod ✅ — kalan: 3 çocuk + 1 öğretmen izlemesi, metinlerin öğretmen okuması, kliplerin kulakla dinlenmesi | Karakter kitabı; 7 temada 3 sahne; 22 klip (`audio:audit`); `maskotHikayesi.spec.ts`, `hikayeAkisi.spec.ts`, `maskotAdi.spec.ts`, `anahtarSesi.spec.ts`; e2e `maskot-hikayesi.spec.ts`, `board-tema-girisi.spec.ts`; 3 çocuk + 1 öğretmen izledi (not) ⬜ |
| 55 | Kapsayıcılık ayarları: aşama 1 (KG-72) `src/design/kapsayicilik.ts` (SAF: yavaş tempo 0,85 × ses hızı ≥0,5; talimat tekrarı 8 sn; renk körlüğü dostu palet; sol el; büyük hedef; hareket azalt; `cssDegiskenleri`, `veriOznitelikleri`), `tokens.ts` `ACCENTS_RENK_KORLUGU` + `COLOR_RENK_KORLUGU` (≥4,5:1, renk körlüğü benzetiminde ΔE ≥10), `src/ogretmen/ayarKodu.ts` (`#ayar=1.<harfler>`, katı çözücü, yeni depolama anahtarı yok), `appStore.kapsayicilik` (yalnız bellekte). Aşama 2 (KG-73): büyük hedef yalnız temel değeri < 2 × `tapMin` olan hedefler (`tapMin`, `control`, `mascot`; kart/Onayla/kilit büyümez, alt %65 taşmaz), `applyProfile(profil, kök, ayarlar)` (CSS değişkenleri + `data-sol-el`/`data-hareket-azalt`/`data-palet`/`data-buyuk-hedef`), `speech.temelHizAyarla` (veli "Ses hızı" artık gerçekten uygulanır × tempo), `useScreenSpeech` talimatı işaretler → `useTalimatTekrari` (`GameShell`; 8 sn hareketsizlikte bir kez), `.alt-cubuk` sol elde aynalanır (kart sırası değişmez), `useHareketAzalt` (sistem VEYA ayar; bütün `useReducedMotion` çağrıları), `useVurgu` (paletli vurgu), `src/platform/ayarKoduAdres.ts` (açılışta `#ayar=` belleğe, hash adreste kalır; ayar değişince `replaceState`), veli/öğretmen alanı "Kapsayıcılık" bölümü, Maskot ve "Dersi bitir" `--size-tap-min` altına inmez; `docs/research/kapsayicilik-gorev-analizi.md` (protokol; oturum kullanıcıda). `v0.7.0` etiketi yayın kararıyla. KG-126: azaltılmış harekette (sistem veya `data-hareket-azalt`) `transition-duration: 0s` (önce 0,01 ms — `transition-property: all` ile her özellik değişimi bir karelik geçişe dönüp ilk karede eski yerleşimi çiziyordu; Keşif Masası 1080×810 e2e'sinin CI'daki ara sıra kırmızısının kök nedeni); Keşif Masası üst bölge yüksekliği sıkı düzene geçişte boyamadan önce okunur | ✅ (görev analizi oturumu ve etiket kullanıcıda) | `kapsayicilik.spec.ts`, `kapsayicilikBaglama.spec.ts` (CSS/öznitelik, adres çubuğu, depolama casusu, talimat tekrarı sahte saat, temel hız), e2e `board-kapsayicilik.spec.ts` (4 temsilci kombinasyon: geometri 118 px eşiği + taşma, sol el yönü, palet, hash kalır/ağa gitmez, depolama boş; bozuk kod silinir; öğretmen alanından aç/kapat → hash); KG-126: `board-kesif-masasi.spec.ts` 1080×810 testi açılışta her kareyi ölçer (eski kodda 3/3 kırmızı) |
| 56 | MEM Ar-Ge / EBA başvuru dosyaları ve gömülü mod: aşama 1 (KG-74) `src/gomulu.ts` (SAF: `gomuluBaglam(arama, ustPencereFarkli)` — `?gomulu=eba\|okul-portali` yalnız gerçekten iframe içindeyse; `gomuluKisitlari`: Eve gönder gizli, tam ekran iframe iznine bağlı, Sorun bildir ve Kaynaklar açık), `src/platform/gomuluAcilis.ts` (yalnız `window.self !== window.top`; kökte `data-gomulu`), `SetHazirla`/`DersSonuOzeti` Eve gönder ve veli paneli tam ekran koşullu, ses kilidi tam ekran denemesi iframe izni yoksa yapılmaz; K9'a `window.parent`/`opener` yasağı ve `window.top` sınırı; `docs/yayin.md` (yayın başlığı `frame-ancestors 'self'` kalır — EBA alan adı teyidi kullanıcıda). Aşama 2 (KG-75): `scripts/basvuru/uyumMatrisi.ts` (SAF) + `scripts/meb-uyum-matrisi.ts` (`npm run uyum-matrisi` → `docs/basvuru/meb-uyum-matrisi.md` + `.csv`, 19/19 kazanım × süreç bileşeni × hazır beceri × şablon × düğüm kodu; bayatlık ve 19/19 birim testte, CI'da), `docs/basvuru/` (README + başvuru kaydı tablosu, ürün özeti, teknik gereksinimler, erişilebilirlik, lisans envanteri, gizlilik, kanıt özeti — "saha kanıtı yok" açıkça), `docs/strateji/is-modeli.md` (ADR-0014 başvuru dili). Başvuruların yapılması (≥2, ⛔ O6), bağımsız inceleme başvurusu ve EBA alan adı teyidi kullanıcıda | ✅ (başvurular, inceleme başvurusu ve EBA teyidi kullanıcıda) | `gomulu.spec.ts`, `uyumMatrisi.spec.ts` (19/19, bayatlık, kapsam kuralı), `gizlilikTarama.spec.ts` (üst pencere kuralları), e2e `onizleme-gomulu.spec.ts` (aynı kökenli portal iframe'i, üretim başlıkları: tahta akışı + 3 soru, Eve gönder yok, aynı köken, `postMessage`/`message` 0, depolama boş; bağımsız sekmede parametre etkisiz) |
| 59 | Soru görsellerinin yeniden çizimi (kullanıcı isteği, KG-104): 10 nesne sprite'ı (`src/ui/svg/Sprite.tsx`) ve materyaller (`Visual.tsx`: şekil, onluk çerçeve, konum kutusu/sepeti, ölçme çubuğu/birim, terazi) çocuk kitabı düz illüstrasyonu olarak elle/kodla yazılmış SVG (temel + gölge + ışık + koyu kontur + zemin gölgesi, ışık sol üst, kontur 3,5/100); `Sprite` API'si aynı, tonlar `renkTonlari.ts` `nesneTonlari` ile türetilir; ortak `Govde.tsx`, `cizimYardimcilari.ts`; stil `docs/tasarim/nesne-cizim-rehberi.md`; DEV kataloğu `?gelistirme=nesneler` (`&gri=1`). Üçüncü taraf/emoji/YZ görseli yok, lisans envanteri değişmedi. Aşama 2: 165 arşiv + etki A/B PDF yeniden basıldı (nesneli 96 arşiv kâğıdı ve etki A/B değişti; kâğıt kodları, sayfa sayıları, metin özetleri aynı); gölge hilali maskesiz (`evenodd` + kırpma; `<mask>` Chromium PDF yazdırmayı düşürüyordu); konum düzeltmesi: kutu/sepet ön duvarı referans yüksekliğinin yarısına alçaltıldı (kutu %44→%50, sepet ağzı %36→%46), "içinde" hedefin üst yarısı görünür (yalnız konum kâğıtları MAT.1.3.1 a1 ×3 yeniden değişti; toplam yine 96 arşiv + etki A/B). Aşama 3 (kullanıcı isteği, KG-105): kâğıtta sayılacak nesneler 10–14 mm (eskiden ≈ 5–6 mm; gerekçe `docs/tasarim/nesne-cizim-rehberi.md` §4.1): `src/ui/svg/kumeYerlesimi.ts` (SAF; kâğıtta M-SAY ızgarası `sayYerlesimi.ts` ile ölçülen kutuya, ≤ 14 mm, hücrenin ≤ %88'i; aynı maddedeki kümeler ortak boy; ekranda konumlar kutunun içine eşlenir → kenarda kırpılma yok, tek nesne ortada), `Visual` `baski` ölçeği (nesne kümesi, işlem sahnesi, bileşik sahne), `KagitSayfalari`/`kagit.css` sahne kutusu kalan gerçek yeri doldurur (kap sorgusu; `kagitYerlesimi.ts` `sahneKutusu`, `maddeIcOlcusu`, `yonergeYuksekligi`), sığma kararı ve sayfa planı aynı; 138 arşiv + etki A/B PDF yeniden basıldı (sayfa sayıları, kâğıt kodları, metin özetleri aynı; A `4w8tun`, B `tjetsk`). Aşama 4 (kullanıcı kararı "sayfa sayısını artırmayacak şekilde", KG-106): KG-105'te 10 mm altında kalan maddeler boş yeri kullanır — karşılaştırma küme seçenekleri genişletilmiş eşit kutularda (`src/ui/print/secenekYerlesimi.ts`, üç aday düzen, ortak boy), "Eşit mi?" bileşik sahnesinde seçenekler sağda (`sahneYanSecenekli`), yalnız kümeli bileşik sahnede tam yükseklik ve kenar payı yok (`ikiliKumeKutulari` eşit kutular, `satirKumeKutulari` ihtiyaca göre genişlik), çetele beşli sıralar (`besliKumeYerlesimi`), işlem sahnesi genişlik paylaşımı; yeni yerleşimlerde nesneler arası ≥ 1,5 mm; sığma kararı, sayfa dağıtımı, altbilgi, kodlar, özetler aynı; 24 arşiv PDF'i yeniden basıldı (etki A/B bayt bayt aynı); **soru hoparlörü (KG-127):** soru yalnız sesten ibaretse (uyaran alanı boş: para/rakam tanıma, şekil adı, konum, işlem tahmini, "Hangisi çok/az?", sırala/eşleştir) üst alanda büyük hoparlör ("Soruyu tekrar dinle", kendi SVG, ↻ ile aynı düğme dili) ekranın sorusunu yeniden çalar; ↻ alt çubukta kalır (tahtada çocuğun eşi), hoparlör yedek hedef; 1080×810 tahtada seçenek kartları tek satır ve alt alana sığar. **KG-128:** MATCH_PAIRS (M-GEO-EŞLE 2–3 + 4–5, M-TERS-İŞLEM 3 + 3) ve SEQUENCE_ORDER (M-PARA-SIRALA 4–5, M-YÖNERGE 2–4) yerleşimi ölçüme bağlı (`src/ui/secenekKartBoyu.ts`: `eslestirmeDuzeni`, `useEtkilesimAlani`): eşleştirmede varsayılan iki sütun sığmıyorsa sütun/satır ölçülür, kart en büyük sığan boy (≥ tap-min, ≤ `--size-choice`) — tahta 1920 196 px, tahta 1080×810 108 px, tablet 166 px, hepsi satır (üstte sol, altta sağ grup); işlem kartı en/boy 2,8 (rakam ≥ 38 px); sıralamada KG-127 `sikisikKartBoyu` (1080×810 tahta 5 kart 160 px, tablet 5 kart 180 px; 1920 tahta değişmez); `ChoiceCard` `genislik`. **KG-129:** TAP_TO_PLACE parça kartları KG-127 `sikisikKartBoyu` ile sığmadığında tek satır (1080×810 tahta 2–3 kart 185 px, tablet M-VERİ-SIKLIK 5 kart 180 px; 1920 tahta değişmez); yuvanın dokunma alanı `max(56px, --size-tap-min / --scale)` — ekranda en az tap-min (tahta 102, tablet 64 px; önce 90/56). Yuvaların tahtada sahnede (üst %35) durması ayrı tasarım kararı. **KG-130:** M-SAY (`sayYerlesimi.ts` `ekranDuzeni`) varsayılan kartla nesneler tap-min hücreye sığmıyorsa (1080×810 elle seçilen tahta: alan 1004 × 409, kart 240 — sahne yüksekliği 0, nesne çizilmiyordu; kartlar ↻ ve Onayla'nın üstüne biniyordu) kart küçülür (`yan`/`dikey`, ≥ tap-min) ya da yeni `cubuk` düzeni: kartlar alt çubuğun iki yanında, sahne çubuğun üstünde tam genişlik; nesne hücresi en büyük aday seçilir. 1–8 nesne tam sığar; 9–20 nesne (zorluk 3'ün üstü, 4, 5) 1004 × 409'da tap-min hücreye sığmaz (onluk çerçeve en çok 97 px) — kullanıcı kararı. 1920 tahta ve tablet değişmez. **KG-131 (kullanıcı kararı 2026-10-30):** ölçülen yerleşim maddeyi taşıyamıyorsa (1080×810 sınıfı tahta) M-SAY zorluk 4–5 o soru için zorluk 3'te gösterilir (`src/ui/sayZorlukTavani.ts`, `TapCountScreen` ölçümden sonra; aynı tohum, sığmazsa tohumdan türetilen yedek tohum; şık sayısı ve nesne türü korunur; deterministik). Kâğıt/PDF, etki Form A/B, 1920 tahta ve tablet değişmez. Ustalık düğüm zorluğuna dayanır (madde zorluğuna değil); M-SAY düğümleri ≤ 3 olduğundan adaptif oturumda tavan devreye girmez, saklanan ilerlemenin anlamı aynı | ✅ (PR #85, #86, #87, KG-106; KG-127 PR #106); pilotta tanınırlık gözlemi Adım 32'de | `nesneCizimleri. **KG-132 (kullanıcı kararı 2026-10-30):** ekranda nesne kümesi parçasının kutusu sahnenin içine kaydırılır (M-VERİ-SIKLIK alt satır ve kenar sütunlar kesik değil; `Visual.tsx` `Sahne`, boy aynı; kâğıt ve şekilli GEO sahneleri değişmez); tüm kartları tek nesne olan yerleştirme sorusunda (M-VERİ-GRUPLA) nesne kartın ve sahne kutusunun %70'i (`tekBuyuk`, `EKRAN_TEK_NESNE_ORANI`; eskiden %22 → ≈ 10–20 px); onluk çerçeve kartı kartın gerçek boyunu CSS % ile doldurur (`ChoiceCard`, tek çerçeve kart genişliğinin ≈ %75'i, eskiden ≈ %40). Kâğıt/PDF ve etki Form A/B bayt bayt aynı (344 kâğıt + A/B işareti), sayfa sayıları aynı.spec.ts` (ton sırası 22 renk, dış kaynak/metin yok, kimlik tekilliği, onluk pul sayısı, "içinde" katman sırası), `kumeYerlesimi.spec.ts` (1–20 nesne × 4 düzen × 4 kutu: içeride, çakışmasız, ≤ 14 mm; dar hücrede ≥ 10 mm; ortak boy; sayma sırası; ekranda kırpılma yok), `kagitNesneYerlesimi.spec.ts` (KG-106: ≥ 1,5 mm boşluk, beşli sıra, eşit ikili kutular, grafik/işlem genişlik paylaşımı, arşivdeki karşılaştırma maddeleri ızgarası maddede, eşit boy, ≤ 10 nesnede ≥ 10 mm), e2e `nesne-katalogu.spec.ts` (10 × 8 örnek, gri görünüm, görsel taban), e2e `calisma-kagidi.spec.ts` (taşma, PDF = altbilgi, görsel taban `kagit-2x3`), KG-127: `soruHoparloru.spec.ts`, e2e `soru-hoparloru.spec.ts` (hoparlör görünür, dokununca soru klibi istenir, 1080×810 geometri); KG-128: `eslestirmeDuzeni.spec.ts`, e2e `eslestir-sirala-yerlesim.spec.ts` (tahta 1920 + 1080×810, tablet: kartlar pencerede, üst %35'in altında, ≥ tap-min, çakışmasız, Onayla görünür; eski kodda 7/8 kırmızı); KG-129: `eslestirmeDuzeni.spec.ts` TAP_TO_PLACE kart boyu, e2e `yerlestir-yerlesim.spec.ts` (M-RİTMİK, M-VERİ-SIKLIK, M-ÖRÜNTÜ-ŞEKİL × tahta 1920 + 1080×810 + tablet: düğmeler pencerede, kartlar tek satır ≥ tap-min ve üst %35'in altında, yuva ≥ tap-min ve merkezi yakalanır, çakışma yok, ↻/Onayla görünür, küçük tahtada yerleştirme çalışır; eski kodda 6/6 kırmızı); KG-130: `sayYerlesimi.spec.ts` (1080×810: 1–8 nesne hücre ≥ tap-min, kart/sahne/çubuk çakışmaz; 9–20 sahne boş değil; 1920/tablet kartı değişmez), e2e `say-yerlesimi.spec.ts` 1080×810 tahta 3/6 sıra, 8 gruplu, 8 dağınık (kartlar, ↻, Onayla, nesneler çakışmaz; eski kodda 4/4 kırmızı); KG-131: `sayZorlukTavani.spec.ts` (1080×810 tahta/kişisel × zorluk 4/5 × 40 tohum → zorluk 3, 6–10 nesne, sığar, şık/sprite korunur, deterministik; 1920 tahta/tablet ± büyük hedef ve zorluk ≤ 3 değişmez), e2e `say-yerlesimi.spec.ts` KG-131 (zorluk 4/5 × 3 tohum: 1080×810'da zorluk 3 ve çakışmasız/pencerede, 1920'de zorluk 4/5 sayıları); KG-132: `gorselBoyutu.spec.ts` (M-VERİ-SIKLIK her nesne sahnede, şekilli sahne eski konumda, tek nesne %70/%22, kart doldurma), e2e `gorsel-boyut.spec.ts` (3 görünüm: sahne nesneleri içeride, tek nesne kartın ≥ %35'i ve sahnede ≥ 48 px, tek onluk çerçeve kartın ≥ %60'ı; eski kodda 14/14 kırmızı) |
| 60 | **Okuma Yazma planı (KG-133, kullanıcı onayı 30 Eki 2026):** depo dışındaki `reports/okuma-yazma-ana-plan-v1.md` plan v2'ye Adım 60–78 olarak eklendi (Dalga A yazılış + kâğıt, pilot önizleme 8 Şub 2027; Dalga B destek etkinlikleri, pilot 19 Nis–28 May 2027; Dalga C tam yıl, genel yayın Eylül 2027 — 53c, TemelYazi yazılı izni ve veri bütçesinden sonra; pilot önizleme yayın değildir). Adım 60: `docs/mufredat-kisitlari-turkce.md` (MEB TYMM 2026 Türkçe programından alıntılı K-OY-01…20, doğrulayıcı kuralları D-01…D-24, hece kuralı, program sürümü), ADR-0016 Kabul (ders verisi JS dışında, `VITE_DERS_TUR` derleme bayrağı varsayılan kapalı, ayrı veri bütçesi), §0 kural 1'e Türkçe kısıt belgesi. Adım 61–78 tanımları plan v2 §10b'de | ✅ | `adrBicimi.spec`, `durum --denetle`, `belgeTutarliligi.spec` yeşil; kod değişikliği yok, JS boyutu aynı |
| 61 | Ders paketi altyapısı (ADR-0011, ADR-0016): `src/content/dersler/` (`DersKodu = 'mat' \| 'tur'`, `DERSLER` kayıt defteri, `acikDersler`; matematik mevcut yollarında — taşıma davranış kazancı getirmediği için ayrı işe bırakıldı), `VITE_DERS_TUR` derleme bayrağı (varsayılan kapalı; `main.tsx`'te tek bayrak korumalı dinamik `import()`, üretimde ölü kod), Türkçe paket girişi `src/content/dersler/tur/` (bugün kullanıcıya görünen bir şey yok; kökte görünmez işaret), JS dışı veri: `ders-verisi/tur/` (`public/` değil) → yalnız bayraklı derlemede `dist/tur/` (`scripts/yayin/dersVerisi.ts`; geliştirmede `/tur/`), precache dışı (`globIgnores` `tur/**`), aynı kökenden okuyucu `veriYukleyici.ts` (göreli yol doğrulaması; K9 `fetch` izni yalnız `turVeriYolu`), ayrı veri bütçesi `npm run boyut:ders` (`docs/ders-veri-butcesi.json`: çekirdek ≤ 1 MB, grup ≤ 6 MB, Türkçe tembel JS ≤ 120 KB; yayına kadar uyarı), `validate` ders döngüsü (kısıt belgesi + manifest program sürümü), CI: "Türkçe kod üretimde yok" (imleç `__okulumsunTUR__` + `dist/tur` yok) ve bayraklı ikinci derleme + veri bütçesi raporu | ✅ | `dersPaketi.spec.ts` (14), `gizlilikTarama.spec` (Türkçe yükleyici izni); üretim `dist/assets/*.js` önce/sonra SHA-256 aynı (833 090 B); bayraklı derlemede Türkçe parça ≈ 0,2 KB |
| 62 | Türkçe şema ve K-OY doğrulayıcısı (G0 kapısı; `docs/mufredat-kisitlari-turkce.md` §5): `src/content/dersler/tur/alfabe.ts` (29 harf, Şekil 1 grupları, tr-TR `trKucuk`/`trBuyuk` — i/İ, ı/I; ünlü/ünsüz, `yalnizUnsuzMu`; `PROGRAM_SURUMU`), `heceleme.ts` (hece ayırıcı: her hecede bir ünlü, ünlüler arasında tek ünsüz sonrakine, kümede son ünsüz sonrakine; `heceTuru` açık/kapalı/üç/dört), `ogretilenKume.ts` (resmî glif sırası a, A, n, N…; `girisNoktasi`, `resmiKume`, `dekodlanabilirMi`, `?tur=` kodu base36 bit maskesi, katı çözücü), `src/content/schema/turIcerik.ts` (zod, `strict`: harf, hece, sözcük, cümle, etkinlik; `programSurumu` zorunlu; renk alanı giremez), `dogrulayici.ts` (D-01 envanter, D-02 öğretilen harf + büyük/küçük biçim, D-03 hece n'den sonra ve kapalı → açık → üç/dört, D-04 hecede büyük harf yok, D-05 hece sözcüğe bağlı + anlamsız hece oranı uyarısı, D-06 renk alanı, D-07 rebus/görsel jetonu yok, D-08 cümle 2. gruptan, D-09 noktalama izin tablosu (ünlem 5. grup + ünlem sözcüğü), D-10 büyük harf yalnız cümle başı/özel ad, D-11 tek ünsüz klibi yok + harf/hece kartı cevaptan önce sessiz, D-12 okuma sorusunda yönerge hedef sözcüğü söylemez, D-13 süre/okuma hızı ölçümü yok, D-14 iki öğretmen teyidi (yayında hata), D-15 resimli seçenekler dekodlanabilir sözcüklerin, D-20, D-23 çeldiriciler öğretilmiş harflerden + tanı etiketi); `npm run validate` `ders-verisi/tur/icerik/*.json` üzerinde (`--yayin` ile D-14 hata). Görünür değişiklik yok | ✅ | `turHeceleme.spec.ts` (200+ sözcük TDK kuralıyla aynı), `turAlfabe.spec.ts` (tr-TR, Şekil 1, program örnekleri a…atlet doğru giriş harfi, `?tur=` gidiş-dönüş), `turDogrulayici.spec.ts` (geçerli dosya temiz; 35 tuzak, her otomatik kural kırmızı); üretim JS aynı |
| 63 | Yazılış hamle verisi (§2.4.9; KG-136): `ders-verisi/tur/hamleler.json` — 68 glif (29 küçük, 29 büyük harf, 10 rakam), 122 hamle (47/62/13), kendi orta çizgimiz 0–100 satır dizgesinde (üst 20, kılavuz 50, taban 80, kuyruk 100; 1 cm = 60 birim), örneklenmiş nokta dizisi; `scripts/tur/hamle-verisi.ts` (`npm run tur:hamle`; doğru, elips yayı, Bézier — font konturu okunmaz), şema `src/content/schema/turHamle.ts` (zod `strict`; tip dik/yatay/çapraz/daire/yay/karma/nokta/çengel/kısa yay, yön, `geriDonus`, `istisna`, `teyit`), `src/content/dersler/tur/hamleTablosu.ts` (öğretmen teyit tablosu taslağı sayıları + `hamleVerisiniDenetle`: sayı/sıra, dikey aşağı, yatay sağa, daire saat 2 hizasından saatin tersine, bildirilen yön = geometri, nokta/çengel/ğ yayı gövdeden sonra, kuyruk 88–100, i/İ noktalı ı/I noktasız). Kullanıcı kararı (31 Eki 2026): öğretmen teyidi gelmeden depoya girdi, her glif `teyit: bekliyor`; `npm run validate` uyarı, `--yayin` hata (yayın kapısı). Manifest çekirdeğinde (57 KB). Görünür değişiklik yok | ✅ (öğretmen teyidi bekliyor) | `turHamle.spec.ts` (JSON = üretici çıktısı, 68 glif, 47/62/13, glif başına tablo, dairelerin başlangıç açısı/dönüşü, işaret sırası, i/İ–ı/I, kuyruk, geri dönüşlü harfler, teyit kapısı, Kilavuz/KesikCizgi fontu yok; 8 tuzak kırmızı); üretim JS aynı |
| 64 | Tahta yazılış gösterimi (§2.4.9, ADR-0016; yalnız `VITE_DERS_TUR=1` derlemesinde, `?ders=tur`): `src/ui/tur/` — Okuma Yazma girişi, "Harf ve rakam yazılışı" seçimi (5 harf grubu küçük + büyük, rakamlar; 68 glif), gösterim ekranı `YazilisGlifi` (Adım 63 `hamleler.json` orta çizgileri, numaralı başlangıç okları, adım / oynat / hız / tekrar / kesikli kip; azaltılmış harekette yalnız adım kipi; sol el aynalamaz), satır dizgesi `SatirDizgesi` (üst, kesikli kılavuz, taban, kuyruk), veri `useHamleVerisi` (aynı köken `/tur/`), ekran durumu yalnız bellekte (`turEkrani.ts`), ortak gezinme kabuğu (Geri / Ana menü). Türkçe ekranlarda ses ve konuşma sentezi yok; öğrenci verisi yazılmaz. Bayraksız derlemede `?ders=tur` hiçbir şey açmaz | ✅ | `turYazilisCizim.spec.ts`, `dersPaketi.spec.ts` sözleşmesi, `temelYaziHarf.spec` (25 kabuk dalı, D-13/KG-98 taraması `ui/tur`); e2e `tur-yazilis.spec.ts` (bayraklı sunucu 5174: 1920×1080 + 1080×810 tahta ve tablet geometri, adım kipi, kesikli, sol el, gezinme, ses/ağ/depolama; bayraksız sunucuda hiçbir şey açılmaz), `onizleme-ders-bayragi.spec.ts` (üretim derlemesinde `?ders=tur` ekran ve `tur/` isteği yok); üretim JS SHA-256 aynı (833 090 B) |
| 65 | Kâğıt ailesi v1 (§2.4.10, ADR-0016; yalnız `VITE_DERS_TUR=1` derlemesinde) — **aşama 1 (#117):** `src/ui/tur/kagit/` — saf düzen `turKagidi.ts` (A4 210 × 297 mm, kenar 12 mm; satır dizgesi 1 cm: üst ve taban 0,35 mm, ortada 0,5 + 0,5 cm kesikli kılavuz 0,25 mm, dizge arası 10 mm; hamle verisi 1 cm = 60 birim) ve tek SVG sayfa `TurKagitSayfasi.tsx` (`viewBox` mm): (1) harf ve (2) rakam kâğıdı — üstte hamle hamle yazılış sırası (önceki hamleler gri, sıradaki siyah, başlangıç noktası, uçta yön oku, numara), 3 izleme (kesikli), 3 birleştirme (noktalı), 3 bağımsız satır, satır başında düz örnek; glifler Adım 63 `hamleler.json` orta çizgisinden (font konturu yok); (4) dikte sayfası (boş dizgeler); (5 + 6) gözlem listesi — yazılış ve ses hissettirme, **puansız** (Gözlendi / Destek kutusu + not; kendi tasarımımız, öğretmen teyidi); her sayfanın altında 10 × 10 mm kalibrasyon karesi + "Gerçek boyut (%100) yazdırın; kare 1 cm olmalı." Renk yok (gri baskıda aynı), SVG maskesi yok. `?arsiv=tur-harf-a`, `tur-harf-A`, `tur-rakam-4`, `tur-dikte`, `tur-gozlem` (`main.tsx`'te bayrak korumalı tembel dal; `@page` kenarsız). Matematik kâğıt koduna dokunulmadı. **Aşama 2:** (8) öğrenciye özel destek kâğıdı — öğretmen en çok 6 harf/rakam seçer (seçim sırasıyla, `tur-destek-a.N.4`), glif başına izleme + bağımsız satır, tek sayfa; Okuma Yazma girişinde "Kâğıtlar": menü (harf ve rakam, destek, dikte, gözlem) → glif seçimi → önizleme (sayfa alana sığar) + Yazdır (`window.print`, baskı kopyası `#root` dışında); seçim yalnız bellekte; adlı `@page tur` (aynı oturumdaki matematik kâğıdının `@page` kuralıyla çakışmaz) | ✅ | `turKagit.spec.ts` (68 glif + dikte + gözlem kod gidiş-dönüşü, i/İ–ı/I; ölçüler; her kâğıt 1 sayfa ve taşmasız; satır kipleri; gözlemde puan yok; SVG A4 mm, kalibrasyon, yalnız siyah/gri/beyaz, maske ve font yok; matematik kâğıt kodu içe aktarılmaz), `dersPaketi.spec` (main.tsx bayrak dalı), `turYazilisCizim.spec` (alt klasör dahil ses/depolama/maske yok); e2e `tur-kagit.spec.ts` (5 kâğıt: PDF tek sayfa A4 MediaBox, kalibrasyon karesi CSS'te 10 mm, baskıda yalnız kâğıt, ağ aynı köken, depolama boş; geçersiz kod; bayraksız sunucuda Türkçe kâğıt yok; aşama 2: destek kodu + Kâğıtlar akışı tahta 1920/1080×810 ve tablette geometri, Yazdır, seçim sınırı 6, Geri seçimi korur, depolama boş); `turKagit.spec` aşama 2: destek kodu sınırları, en geniş 6 glif taşmaz, satır başına kendi glifi, adlı `@page`; üretim JS SHA-256 main ile aynı (833 090 B) → 165 arşiv PDF'i ve etki A/B aynı üretim, dosyalara dokunulmadı |
| 68 | Sözcük görselleri v1 (§2.4.8, D-25, ADR-0016; yalnız `VITE_DERS_TUR=1` derlemesinde) — **aşama 1 (1. grup):** `ders-verisi/tur/gorseller/` — resimli sözcüklerin statik SVG'leri (`<id>.svg`, 100×100, ≤ 6 KB) + grup dizini `grup-<n>.json` (sözcük, taslak no, açıklama, tanınırlık riski `dusuk/orta/yuksek`, bayt, `teyit: bekliyor`; resimle karışıklıksız gösterilemeyen adaylar `resimsiz` + gerekçe); `manifest.json` → `gruplar` grup açılınca önbelleğe alınacak dosyalar. Üretici `scripts/tur/gorsel-uret.tsx` (`npm run tur:gorsel`; çizimler `scripts/tur/gorsel/grup<n>.tsx`, matematik nesneleriyle aynı `Govde`/`nesneTonlari` stili, palet `src/content/dersler/tur/gorselPaleti.ts`; deterministik küçültme). Denetim `gorselDenetimi.ts` + şema `turGorsel.ts` (zod, strict): her resimli sözcüğe tek görsel, öğretilmemiş harfli sözcüğe görsel yok (giriş grubu = dizin grubu), kimlik tek, dosya/bayt eşleşir, `<mask>`/metin/raster/dış adres/gradyan/filtre/stil yok, palet dışı renk yok, koyu kontur (gri baskı), id önekli; içerikteki `gorselId` aynı sözcüğün görseli; teyitsiz görsel `--yayin`'da hata. Okuma Yazma → **Görseller** kataloğu (grup + siyah-beyaz; `turGorselVerisi.ts` grup bazlı bellek). 1. grup: 15 görsel (nene, anneanne, alan resimsiz) | 🔄 (2. grup aşama 2'de; öğretmen teyidi ve 3 çocukla tanınırlık denemesi bekliyor) | `turGorsel.spec.ts` (üreticiyle bayt bayt aynı, palet Sprite.tsx ile aynı, manifest, 13 SVG tuzağı + dizin tuzakları), e2e `tur-gorsel.spec.ts` (her görsel yüklü, alt = sözcük, siyah-beyaz, grup geçişi, geometri, aynı köken, ses yok; bayraksız sunucuda yok) |

Adım 10, ilk tahmindeki "13 şablon / 6–7 gün"den **35 şablon / ~3 haftaya** büyüdü
(şablonların incelmesi §5.2). Toplam tahmin: **7–9 hafta / tek geliştirici.**
Sıra bilinçli: kalıcılık (9), şablon seline (10) girmeden ÖNCE gelir — 35 şablon
boyunca her oturum gerçek veri üretir ve motor gerçek koşulda pişer.

**Sonraya bırakılanlar:** Hayat Bilgisi dersi; Türkçe ilk okuma yazma artık Adım 60–78'de (KG-133, bayrak arkasında; genel yayın 53c sonrası), tanılayıcı test, çoklu profil, öğretmen/sınıf modu. Çok ders mimarisi ADR-0011 ve çok dilli ses ADR-0012 2026-10-14'te Seçenek 1 ile kabul edildi (KG-82, KG-83); kod değişikliği ikinci ders / ilk ek dil belli olunca.

---

## 15. Doğrulama

### Otomatik testler

```bash
npm test
```

| Ne | Nasıl | Neden kritik |
|---|---|---|
| Soru jeneratörleri | Vitest **property-based**, 10.000 tohum: cevap doğru mu, sonuç ≤20 mi, negatif var mı, çeldirici cevaba eşit mi, ritmik üçlü müfredat listesinde mi, aynı tohum → birebir aynı soru mu | Bir aritmetik hatası 6 yaşındaki çocuğa yanlış öğretir |
| Ustalık motoru | Senaryo testleri — **sekizi de ZORUNLU**: ① aynı gün 3 doğru → `mastered` DEĞİL (`distinctDays`) ② 2 farklı günde `q=1.00` beş doğru → `strength ≥ 0.85` ve `mastered` ③ tek yanlış `strength`in EN ÇOK %30'unu siler ④ 32 gün cevapsız box-5 düğüm → `rusty` (0.925 → 0.463) ⑤ aynı gün 10 doğru kutuyu EN ÇOK 1 yükseltir ⑥ `GOREV_ANLASILMADI` cevabı `strength`/`attempts`/`box`ı DEĞİŞTİRMEZ ⑦ yakınlık şablonunda `q` asla 0 olmaz ⑧ `mastered` düğüm ertesi gün HÂLÂ `mastered` (aşınma ustalığı geri almaz — `strength` ↔ `strengthEff` ayrımı) | Yanlış ölçüm = yanlış içerik = ürün amacını kaçırır |
| Oturum seçici | 1000 simüle oturum: kova oranları hedefe ±%5 (frontier %50, diğerleri %12.5 — §6.4); 5 sert kuralın her biri AYRI ihlal senaryosuyla test edilir (ör. 2 ardışık yanlış → 3. soru `warmup` MI; oturumun son sorusu `mastered` MI); boş kova devri oturumu 8'in altına düşürmüyor mu | Seçici hataları sessizce yanlış zorlukta soru gösterir |
| Migrasyon | `fixtures/progress-v1.json` → v2 → doğrula | Veri kaybı geri alınamaz |
| İçerik bütünlüğü | `validate-content.ts`: DAG'da çevrim, eksik `imageId`/`speechKey`, kazanım referansları | Projedeki en çok hata yakalayan araç |
| **Müfredat kapsamı** | 19 resmî kazanımın **her biri** en az bir şablona bağlı mı | Müfredat uyumu iddiasının tek kanıtı |
| Tahta geometrisi | Playwright, 1920×1080 `board`: üst %35'te interaktif öğe yok, hedefler ≥102px | Elle test edilemeyen kuralın tek koruması |

**CI (`.github/workflows/ci.yml`, §14 adım 2b).** Dosya bu içerikle kurulur — "CI'da
doğrulanır" diyen her kural ancak bu iş akışı yeşil olunca doğrulanmış sayılır:

```yaml
name: ci
on:
  push:
  pull_request:
jobs:
  dogrula:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run validate
      - run: npm run build
  e2e:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
```

Yalnız `chromium` indirilir (playwright.config.ts iki profilde de Chromium kullanır —
doğrulanan şey tarayıcı motoru değil yerleşim geometrisidir). **Tuzak testi zorunlu:**
CI kurulduktan sonra, üst %35'e kasten interaktif bir öğe koyan bir commit atılır ve
`e2e` işinin KIRMIZI yandığı görülür; sonra geri alınır. Testin gerçekten koruduğu
böyle kanıtlanır — yeşil CI, çalışan test demek değildir.

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
2. **ElevenLabs ücretsiz katmanı**nın üretilen sesi uygulamada dağıtma iznini veriyor mu — yayın öncesi şartlar okunmalı. Vermiyorsa Piper tek başına yeterli (lisansı net). *(Adım 15 notu: bu varsayım geçersiz — Türkçe Piper sesleri ticari dağıtım için uygun değil; ElevenLabs kullanılmaz. Bkz. `docs/ses/SES_KAYNAKLARI.md`.)* *(Adım 18: **kapandı → ADR-0004**, kaynak Google Cloud TTS.)*
3. **Piper kurulumu** Python 3.9 ile uyumlu mu; değilse `python3.11` veya `edge-tts` alternatifi. *(Adım 15 notu: Piper ve `edge-tts` üretim kaynağı olmaktan çıktı — `docs/ses/SES_KAYNAKLARI.md`; ses kaynağı ADR-0004'te kararlaştırılır.)* *(Adım 18: **kapandı → ADR-0004**.)*
4. **`MAT.1.1.9` banknot görselleri** — TCMB koruması nedeniyle stilize temsil çizilmeli. Projedeki tek gerçek varlık riski.
5. **`MAT.1.4.1` (veriye dayalı araştırma)** doğası gereği çok adımlı ve sınıf ortamına dönük — tek kişilik dijital alıştırmaya indirgenmesi programın ruhunu tam karşılamayabilir. Sadeleştirilmiş bir versiyon yapılıp sınırı açıkça kaydedilecek.
6. **Tarayıcı depolama tahliyesi.** `storage.persist()` + PWA kurulumu + yedek (§10) riski azaltır ama sıfırlamaz; özellikle kurulmamış iOS Safari'de 7 gün kuralı yılın verisini silebilir. Karşı önlem davranışsal: veli panelindeki yedek uyarısı ve "ana ekrana ekle" yönergesi.
7. **Hata görünürlüğü yok.** Tamamen çevrimdışı üründe telemetri yok; sınıfta çökerse kimse bilmez. İlk sürüm kararı: `window.onerror` → `events` store'una yerel kayıt + veli panelinde "sorun bildir" (hata özetini panoya kopyalar). Uzak toplama BİLİNÇLİ olarak yok (KVKK ve okul ağı kısıtları).
8. **Kişisel veri notu.** Uygulama ad/soyad, fotoğraf, konum, hesap İSTEMEZ; tüm veri cihazda kalır, hiçbir sunucuya gitmez. Bu, KVKK yükünü pratikte sıfıra indirir ama okula resmî sunumda yazılı olarak beyan edilmeli — "Kaynaklar" ekranına tek paragraf gizlilik beyanı eklenir (§14 adım 11).

---

## 17. Ek: Sayısal Sabitler Sözlüğü

Planın her yerine dağılmış sayılar burada tek tabloda. **Kodda çıplak sayı yazmayın** —
bu sabitler `src/progress/constants.ts` ve `src/design/tokens.ts` içinde adlandırılır.
Bir değeri değiştirmek istiyorsanız önce buradaki satırı ve gerekçesini değiştirin.

| Sabit | Değer | Bölüm |
|---|---|---|
| `OTURUM_SORU_SAYISI` | 8 | §6.4 |
| `KOVA_DAGILIMI` | warmup 1 · frontier 4 · new 1 · review 1 · kapanış 1 | §6.4 |
| `OTURUM_BASI_YENI_DUGUM` | en fazla 2 | §6.4 |
| `ISINMA_EN_FAZLA_MADDE` | 8 (Isınma Keşfi, isteğe bağlı) | §6.5 |
| `ISINMA_ISARET_SAYISI` | en çok 15 işaret (= 1 + 7 × 2; 8. maddede tepe) | §6.5 |
| `ISINMA_YUKARI_ADIM` / `ISINMA_ASAGI_ADIM` | doğruda +2 işaret / yanlışta −1 işaret | §6.5 |
| `ISINMA_ARDISIK_YANLIS_SINIRI` | ardışık 2 yanlışta ısınma biter | §6.5 |
| `REMEDIATION_TETIK` | son 6 maddede aynı etiket ≥ 2 | §6.6 |
| `REMEDIATION_SORU` | tetiklenince 2 (frontier'dan düşülür) | §6.4 |
| `STRENGTH_ARTIS_KATSAYISI` | 0.35 | §6.1 |
| `STRENGTH_AZALIS_KATSAYISI` | 0.30 | §6.1 |
| `ZORLUK_KATSAYILARI` | [0.8, 0.9, 1.0, 1.1, 1.2] | §6.1 |
| `HALF_LIFE` | [1, 2, 4, 8, 16, 32] gün | §6.1 |
| `USTALIK_ESIGI` | **strength** ≥ 0.85 · streak ≥ 3 · distinctDays ≥ 2 · strengthEff ≥ 0.55 (tazelik) | §6.1 |
| `RUSTY_ESIGI` | strengthEff < 0.55 | §6.1 |
| `STRUGGLING_ESIGI` | attempts ≥ 6 · son6 başarı < 0.45 | §6.1 |
| `BUYUME_ESIKLERI` (tohum/filiz/çiçek/meyve) | 0.25 / 0.55 / 0.85 / mastered | §6.1 |
| `YARDIM_GECIKMELERI` | 15 sn → +30 sn → +30 sn | §7.2 |
| `MASKOT_UYKULU_SURESI` | 60 sn | §7.5 |
| `ARDISIK_YANLIS_WARMUP` | 2 | §6.4 |
| `DUGUM_ASKI_SURESI` | 3 başarısızlıktan sonra 1 gün | §6.4 |
| `DOKUNMA_SOGUMASI` | 250 ms | §7.3 |
| `KUTLAMA_SURESI` | ≤ 2 sn (doğru geri bildirimi 400–600 ms) | §7.1, §7.4 |
| `KONFETI` | ≤ 40 parçacık, ≤ 1.5 sn, yalnız oturum sonu | §7.4, §9 |
| `SES_HIZI` | normalden %10 yavaş, cümle arası 400 ms | §4.4 |
| `SES_KUYRUK_UZUNLUGU` | 3 | §4.4 |
| `SECENEK_SAYISI` | yıl başı 2 → 3 → yıl sonu 4 (asla > 4) | §11 |
| `EVENTS_TAMPON` | 2000 kayıt | §10 |
| `SESSIONS_SAKLAMA` | 90 gün | §10 |
| `ACTIVE_SESSION_TAZELIK` | 24 saat | §10 |
| `ERISIM_BOLGESI` | dokunulabilir her şey alt %65'te | §3.2 |
| `HEDEF_BOYUTU` | tablet 64 px · board ×1.6 = 102 px · phone ×0.75 | §3.4 |
| `KONTRAST` | metin ≥ 7:1 · grafik ≥ 4.5:1 | §9 |
| `ISLEM_ARALIGI` | 0–20 (sonuç 20'yi aşamaz) | mufredat-kisitlari §2 |
| `RITMIK_UST_SINIR` | 100 (yalnız ileri 1/5/10) | mufredat-kisitlari §2 |

## 18. Ek: Planın Kendi Kendini Denetlemesi

Bu plan koda yaslanır ve kod değiştikçe **bayatlar**. Aşağıdaki iddialar
`npm run validate` tarafından makine olarak denetlenir; biri kırılırsa PLAN yanlıştır
ve kodla birlikte AYNI commit'te düzeltilir (§0 kural 1).

| # | İddia | Nerede denetlenir |
|---|---|---|
| 1 | `skills.json`'daki benzersiz şablon sayısı = **39** | `validate-content.ts` sayar ve rapor eder |
| 2 | 19 resmî kazanımın her biri en az bir şablona bağlı | müfredat kapsam denetimi |
| 3 | `misconceptions.json` etiketleri ↔ `distractors.ts` `HATA_ETIKETLERI` birebir (15) | etiket eşleşme denetimi |
| 4 | `durum: "hazir"` her düğümün şablonu kayıt defterinde var | §5.4 kuralı (adım 2c'de eklenir) |
| 5 | Her `speechKey` ses manifestinde var | `validate-content.ts` |
| 6 | Ön-koşul grafiğinde çevrim yok | `validate-content.ts` |
| 7 | Ritmik sayma üçlüleri yalnız `RITMIK_SAYMA_BICIMLERI` içinde | `types.ts` tip düzeyi + property testi |
| 8 | `PROGRESS.md` makine okunur bloğundaki `birim_dosya` = `tests/unit` dosya sayısı; LICENSES gizlilik paragrafı = `VERI_SAKLAMA_BILDIRIMI` (durum tablosu kanıtla yeniden açıldı — Adım 16, 12 Eki 2026) | `tests/unit/belgeTutarliligi.spec.ts` |
| 9 | PLAN §14 ve PROGRESS makine okunur bloklarındaki sayılar (kazanım, beceri, şablon, hata etiketi, ses, test dosyası, ADR) ve PLAN §12 üretilmiş ağacı kodla eşleşir — K8 (Adım 19) | `npm run durum -- --denetle` (CI), `tests/unit/durum.spec.ts` |

**Bayatlık kontrolü — her adımın sonunda 60 saniye:** `npm run validate` çıktısındaki
sayıları (kazanım · beceri · etiket · jeneratör) §5.2, §14 ve `PROGRESS.md` ile karşılaştır.
Uyuşmuyorsa belgeyi düzelt. Bu, geçmişte `PROGRESS.md`'nin dört commit boyunca yanlış
kalmasına yol açan hatanın tekrarını önler.
