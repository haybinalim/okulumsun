# okulumsun — Dünya Standardında Eğitim Uygulamasına Dönüşüm: Geliştirme ve Bitirme Raporu

> **Hedef okuyucu:** Bu rapor, projeyi *vibe coding* ile geliştirecek yapay zekâ ajanları
> (v0, Cursor, Claude Code, Codex vb.) tarafından okunup **doğrudan uygulanmak** için yazıldı.
> İnsan okuyucu için yönetici özeti §0'da; ajanlar için çalışma protokolü §1'de, iş paketleri §6'dadır.
>
> **Tarih:** 2 Eylül 2026 · **Temel alınan kaynaklar:** kod tabanı taraması, `docs/PLAN.md`,
> `docs/PROGRESS.md`, `docs/OKULUMSUN_GELISTIRME_ARASTIRMA_RAPORU.md`, doğrulama zinciri çıktıları,
> tarayıcıda gerçek ekran incelemesi, Türkiye ve dünya pazarı web araştırması.
>
> **Karar sahibinden alınan yönlendirmeler (bağlayıcı):**
> 1. Kapsam: **çoklu sınıf (1-4) + çoklu ders** (matematik çekirdek; Türkçe ilk okuma-yazma ve Hayat Bilgisi aşamalı).
> 2. Mimari: sunucusuz başlangıç; **hibrit/sunuculu model gerekçeleriyle değerlendirilecek** (→ §4).
> 3. Çalışma anında yapay zekâ: **YASAK sürer.** AI yalnız geliştirme ve içerik üretimi aşamasında.
> 4. Öncelikli hedef kitle: **okul / öğretmen — sınıf içi kullanım** (akıllı tahta birinci, tablet ikinci).

---

## 0. Yönetici özeti

**Mevcut durum (ölçüldü):** okulumsun, MEB 2024 1. sınıf matematik programına birebir eşlenmiş,
çevrimdışı çalışan, hesapsız, sesli yönlendirmeli bir PWA'dır. Kod tabanı sağlıklıdır:

| Doğrulama | Sonuç (2 Eyl 2026) |
|---|---|
| `npm run lint` (oxlint) | 0 hata |
| `npm test` (vitest) | 17 dosya · **189/189** geçti |
| `npm run validate` | 19 kazanım · 7 tema · 57 beceri · **39/39 şablon** · 15/15 hata etiketi · sorun yok |
| `npm run build` | başarılı · tek JS parçası **735 kB (216 kB gzip)** · PWA precache 305 dosya / **5.9 MB** |
| `npm run audio:audit` | sandbox'ta `ffprobe` yok → **sonuçsuz** (CI'da ffmpeg kurulu, oradaki sonuç geçerli) |
| Playwright e2e | `board` (1920×1080, dokunmatik) + `tablet` projeleri mevcut; yalnız PR'da koşuyor |

Planın §14 yol haritasında **Adım 12/13** noktasındadır: kod bitmiş sayılır, fiziksel tahta
doğrulaması yapılmamıştır.

**Dünya standardıyla fark:** Ürün *pedagojik motor* olarak dünya sınıfında bir çekirdeğe sahip
(jeneratör tabanlı sonsuz soru, hata taksonomisi, ustalık modeli, 3 kademeli yardım, ses-öncelikli
UI). Fakat şu altı alanda standart altında:

1. **Kapsam:** tek sınıf, tek ders (ANTON: tüm ilkokul + 6 ders; Happy Numbers: PK-5; MEB EBA/MEBİ: tüm sınıflar).
2. **Öğretmen katmanı yok:** sınıf yok, öğrenci listesi yok, sınıf-çapında ilerleme yok, ödev/atama yok. Tahta modu veriyi hiç saklamaz. Bu, "okul/öğretmen" hedef kitlesi için **en kritik boşluktur**.
3. **Kanıt yok:** ESSA-tipi etkililik kanıtı, öğrenme ölçümü, pilot verisi yok. Dünya standardı ürünlerin hepsi "kanıta dayalı" iddiası taşır.
4. **Uyumluluk belgeleri yok:** WCAG 2.2 AA denetim raporu (VPAT/ACR benzeri), KVKK/GDPR veri işleme envanteri, çocuk gizliliği (COPPA/GDPR-K) beyanı, güvenlik başlıkları.
5. **Üretim olgunluğu:** tek 735 kB parça (kod bölme yok), hata izleme yok, sürüm/rollout stratejisi yok, içerik-kod ayrımı var ama içerik **sürümleme/yayın hattı** yok.
6. **Öğrenci-cihazı senaryosu eksik:** sınıf içinde tahta + N tablet birlikte çalışma modeli (Gynzy/Kahoot-tipi "katıl" akışı) yok.

**Ana karar (§4):** **Local-first hibrit** mimariye geçilmelidir. Çocuk deneyimi çevrimdışı ve hesapsız
kalır; öğretmen için **opsiyonel, takma-adlı, KVKK-minimal** bir bulut katmanı eklenir. Gerekçeler §4'te.

**Yol:** 7 faz, 31 iş paketi (§6). Her paketin *kabul kriteri* komutlarla doğrulanabilir; ajan her
paketi tek PR olarak bitirir, `PROGRESS.md`'yi aynı commit'te günceller.

---

## 1. Ajan çalışma protokolü (vibe coding sözleşmesi)

Bu bölüm, raporu uygulayan her AI ajanı için **bağlayıcı kurallardır**. İhlal eden PR kabul edilmez.

### 1.1 Başlamadan önce (her oturum)
1. Şunları oku: `docs/PLAN.md` (§1-§3 ve ilgili bölüm), `docs/PROGRESS.md`, bu rapor §1 + üzerinde çalışılan iş paketi.
2. `npm ci && npm run lint && npm test && npm run validate && npm run build` çalıştır. **Kırmızı bir zincir üstüne iş başlatma.**
3. Çalıştığın iş paketini (İP-xx) `docs/PROGRESS.md`'de "devam ediyor" olarak işaretle (aynı PR içinde).

### 1.2 Değişmez sabitler (PLAN §17 + bu rapor)
- **Çalışma anında AI çağrısı YOK.** Hiçbir LLM/TTS/STT API'si üretim kodundan çağrılmaz. AI yalnız: kod yazımı, içerik üretimi, ses üretimi (offline dosya olarak commit'lenir), test üretimi.
- **Çocuk hesabı YOK.** Çocuk kimlik bilgisi, e-posta, fotoğraf, isim toplanmaz. Öğrenci = **takma ad + avatar + sınıf içi yerel numara**.
- **Çevrimdışı çekirdek.** Alıştırma akışı ağ olmadan %100 çalışır. Bulut = artış (senkron, rapor), asla ön koşul.
- **Reklam, satın alma, üçüncü taraf izleyici YOK.** Analitik varsa birinci taraf, toplu, takma adlı.
- **İçerik kod değildir.** Kazanım/beceri/şablon/hata etiketi JSON'dadır; `npm run validate` şemayı zorlar. Yeni ders/sınıf eklemek = JSON + jeneratör; ekran koduna dokunulmaz.
- **Türkçe kod dili.** Alan adları, dosya adları, yorumlar Türkçe (mevcut konvansiyon: `veriSaklamaPolitikasi.ts`, `KonuSecimi.tsx`). Kütüphane API'leri hariç.
- **Erişim bölgesi ve hedef boyutu** kuralları (PLAN §7) tahta e2e testiyle korunur; gevşetilmez.

### 1.3 PR disiplini
- Bir PR = bir iş paketi (İP) ya da bir İP'nin açıkça numaralanmış alt adımı.
- PR başlığı: `İP-07: Sınıf yönetimi — öğrenci listesi ve takma ad`.
- PR açıklamasında **kabul kriterlerinin her satırı** ✅/❌ ile işaretlenir; ❌ varsa PR taslak kalır.
- Yeni bir kütüphane eklemeden önce: (a) mevcut bağımlılıklarda çözüm var mı? (b) çevrimdışı çalışır mı? (c) lisansı `LICENSES.md`'ye eklendi mi?
- Test yazmadan mantık yazma: saf fonksiyonlar (jeneratör, ustalık, zamanlayıcı) property-based test ister (`fast-check` zaten var).
- Ekran değişikliği → `agent-browser`/Playwright ile 1920×1080 dokunmatik ve tablet görüntüsü alınır, PR'a eklenir.

### 1.4 Bitirme
- `docs/PROGRESS.md` güncellenir (durum tablosu + teknik doğrulama sayıları).
- Kullanılan ses/görsel varlıklar için `LICENSES.md` ve `docs/*_KAYNAKLARI.md` güncellenir.
- Bu raporun §6'sındaki İP satırı `⬜ → ✅` yapılır.

---

## 2. Mevcut projenin nesnel taraması

### 2.1 Teknoloji ve yapı
- **Yığın:** Vite 7 + React 19 + TypeScript (strict), Zustand (uygulama durumu), Dexie/IndexedDB (kalıcılık), `vite-plugin-pwa` (Workbox precache), oxlint, vitest + fast-check, Playwright.
- **Dizin:** `src/content/` (JSON içerik), `src/exercises/` (tipler, kayıt defteri, 39 jeneratör), `src/progress/` (ustalık, zamanlayıcı, oturum), `src/persistence/` (db, repository, yedekleme, saklama politikası), `src/audio/` (SpeechService, ses kilidi), `src/store/appStore.ts`, `src/ui/screens/` (10+ ekran), `src/ui/primitives/`, `src/dev/BoardHarness.tsx`, `scripts/` (validate, audio audit), `tests/unit`, `tests/e2e`.
- **Varlıklar:** `public/audio/` 2.5 MB m4a (171+ klip), SVG manipülatifler ve maskot (kod içi).
- **CI:** GitHub Actions — lint, test, validate, audio:audit, build; e2e yalnız PR'da.

### 2.2 Güçlü yanlar (korunacak, üzerine inşa edilecek)
- MEB 2024 programına **kazanım düzeyinde** eşleme (`kazanimlar.json` ↔ `skills.json` ↔ jeneratör), doğrulama komutuyla zorlanıyor. Türkiye'deki ticari rakiplerin çoğu bu kadar sıkı bir eşleme *göstermez*.
- **Jeneratör tabanlı içerik**: 39 şablon sonsuz varyant üretir; hazır soru bankası bağımlılığı yok. Bu, çoklu sınıf/ders ölçeklemesinin teknik temelidir.
- **Hata taksonomisi** (15 etiket) + 3 kademeli yardım + ustalık modeli: dünya sınıfı ürünlerde (Happy Numbers, DreamBox) bulunan "yanıtın *nedenine* göre tepki" yaklaşımı mevcut.
- **Ses-öncelikli, okuma-öncesi UI**: 1. sınıf başında okuma bilmeyen çocuk için doğru tasarım; ses kilidi (tarayıcı autoplay) çözülmüş.
- **Cihaz profili**: tahta (parmak, uzak mesafe, alt erişim bölgesi) ve tablet ayrı geometri; e2e ile kilitli.
- **Veri minimizasyonu** kodda: tahta modunda repository no-op; tabletde yerel; dışa/içe aktarım var.
- Belgeler olgun: `PLAN.md` (1360 satır), test protokolü, soru tasarım denetimi, müfredat kısıtları.

### 2.3 Zayıflıklar ve teknik borç (kod düzeyinde tespit)
| # | Bulgu | Kanıt | Etki |
|---|---|---|---|
| Z1 | Tek JS parçası 735 kB; kod bölme yok | build uyarısı | Düşük donanımlı tahtada (FATİH Android WebView) ilk açılış yavaş |
| Z2 | Precache 305 dosya / 5.9 MB; tüm ses peşinen indiriliyor | PWA çıktısı | İlk kurulum ağır; ders/sınıf eklenince katlanır |
| Z3 | Tahta modunda **hiç veri saklanmıyor** | `repository.ts` no-op | Öğretmen sınıfta ne yapıldığını göremez; "sınıf kullanımı" hedefiyle çelişir |
| Z4 | Veli paneli var, **öğretmen paneli yok** | `VeliPaneli.tsx` tek yönetim ekranı | Ana hedef kitle için yönetim yüzeyi yok |
| Z5 | Rakam glifleri MEB yazı formuna göre doğrulanmamış | PROGRESS Adım 3 notu | Öğretmenler için güvenilirlik sorunu |
| Z6 | Bazı şablonların ses klipleri üretilmemiş | PROGRESS "bilinen sapmalar" | Sesli yönlendirme kesintili → okuma-öncesi çocuk tıkanır |
| Z7 | Fiziksel tahta testi yapılmadı | PROGRESS Adım 13 ⬜ | Dokunma gecikmesi, parlaklık, ses çıkışı bilinmiyor |
| Z8 | Hata izleme (Sentry vb.) ve çökme raporu yok | `package.json` | Sahada hata görünmez |
| Z9 | İçerik sürümlemesi yok (`skills.json` versiyon alanı yok, göç stratejisi iskelet) | `migrations/` iskelet | İçerik güncellemesi eski ilerlemeyi bozabilir |
| Z10 | Güvenlik başlıkları / CSP yok | `vite.config.ts`, dağıtım | Kamu ihalesi ve denetim için eksik |
| Z11 | Ekran okuyucu yolu test edilmedi; erişilebilirlik denetimi kendi kontrol listesiyle yapıldı | TEST-PROTOKOLU | WCAG 2.2 AA iddiası belgelenemez |
| Z12 | Çoklu sınıf/ders için veri modeli tek sınıfa gömülü (`kazanimlar.json` 1. sınıf) | içerik yapısı | Genişleme öncesi şema değişikliği şart |
| Z13 | e2e yalnız PR'da; ana dala push'ta koşmuyor | `ci.yml` | Regresyon ana dala sızabilir |
| Z14 | `audio:audit` ffmpeg'e bağımlı; yerel geliştirme ortamında sessiz başarısız | sandbox çıktısı | Yanlış güven |

### 2.4 Ekran incelemesi (tarayıcıda, 1920×1080 dokunmatik)
Akış: Ses kilidi → Mod seçimi (Tahta/Tablet) → Ana ekran (tema kartları) → Konu seçimi → Alıştırma.
Gözlemler: Hedefler büyük ve alt bölgede; renk kontrastı yeterli; maskot ve ses ipuçları var.
Eksikler: (a) tahtada "kim çalışıyor?" kavramı yok, (b) öğretmen için "sınıfa göster / öğrenciyi çağır" gibi
sınıf-içi araçlar yok, (c) ilerleme göstergesi çocuğa dönük ama öğretmene dönük değil, (d) sayfa dili/`lang`
ve başlık meta'ları var ama açık erişilebilirlik bildirimi (`aria-live` duyuru bölgesi) yok.

---

## 3. Kıyaslama: Türkiye ve dünya

### 3.1 Türkiye
| Ürün | Güçlü | okulumsun'un farkı / boşluğu |
|---|---|---|
| **EBA / MEBİ (MEB)** | Tüm sınıf ve dersler, öğretmen-öğrenci hesapları, MEBBİS/e-Okul bağı, devlet güvencesi | Devlet platformu; okulumsun'un buna *rakip değil tamamlayıcı* konumlanması gerekir. Boşluk: EBA içerik-ağırlıklı (video/test), 1. sınıf için jeneratör tabanlı, sesli, tahta-optimize alıştırma zayıf. |
| **Morpa Kampüs** | Öğretmen paneli, sınıf düzeyinde ödev/test atama, öğrenci raporları, başarı asistanı | okulumsun'da öğretmen paneli ve atama yok. Morpa online ve hesaplı; okulumsun çevrimdışı ve hesapsız — bu avantaj korunmalı. |
| **Vitamin İlkokul** | 5E modeli, öğretmen takibi, ders zenginleştirme | Pedagojik model açıkça belgelenmiş. okulumsun'un ustalık/yardım modeli PLAN'da var ama *öğretmene dönük dil* ile anlatılmamış. |
| **Okulistik** | Yönetici + öğretmen izleme, ders süreç yönetimi | Okul yöneticisi rolü okulumsun'da yok. |

**Türkiye'ye özgü zorunluluklar:** KVKK (çocuk verisi: veli açık rızası; okul veri sorumlusu), MEB'in 2025-26
genelgeleri (kapalı devre, şifre korumalı uygulama; kamuya açık paylaşım yasağı), AI kullanılıyorsa YAZEK
bildirimi (bizde çalışma anında AI yok → avantaj), FATİH etkileşimli tahta parkı (Android tabanlı, eski
WebView, ses çıkışı değişken).

### 3.2 Dünya
| Ürün | Neyi standart yaptı | Bize dersi |
|---|---|---|
| **ANTON** (Almanya) | Tüm ilkokul, 6+ ders, ücretsiz, çevrimdışı çalışabilir, öğretmen grupları (sınıf kodu ile öğrenci ekleme, **öğrenci hesabı yok — takma ad + kod**), müfredat eşlemesi eyalet düzeyinde | Sınıf kodu + takma ad modeli tam bizim kısıtlarımıza uyar. Çoklu ders şeması. |
| **Happy Numbers** (ABD) | PK-5 matematik, manipülatif-tabanlı, **yanıtın nedenine göre geri bildirim**, öğretmen panosunda beceri ısı haritası, küçük grup önerisi | Hata taksonomimiz bunun altyapısı; öğretmene "kimi hangi beceride çağırayım" görünümü eksik. |
| **Gynzy** (Hollanda) | Akıllı tahta odaklı; ders akışı, sınıf yönetimi araçları (rastgele öğrenci seç, zamanlayıcı, gürültü ölçer), öğrenci cihazına "gönder" | Tahta ürünü sadece alıştırma değil, **sınıf yönetim araç kutusu** olmalı. |
| **onebillion / onecourse, Kitkit School** (XPRIZE) | Tamamen çevrimdışı tablet, okuma-öncesi çocuk, sesli yönlendirme, **RCT ile kanıt**, uyarlanabilir hız | Kanıt üretimi ürünün parçası olmalı: pilot tasarımı, ölçüm araçları (erken sayı hissi taraması). |
| **Khan Academy Kids / Duolingo ABC** | Sıfır-okuma UI, karakter, kısa oturum | Maskot ve kutlama var; oturum uzunluğu ve "günlük yol" tasarımı ölçülmeli. |

**Standart ve belgeler (dünya):** WCAG 2.1/2.2 AA + erişilebilirlik uygunluk raporu (VPAT/ACR), 1EdTech
TrustEd Apps (gizlilik + birlikte çalışabilirlik), LTI 1.3 / OneRoster 1.2 (okul sistemleriyle roster
ve not aktarımı), xAPI/Caliper (öğrenme analitiği olay standardı), ESSA kanıt kademeleri (Tier I-IV).
Türkiye pazarı için LTI/OneRoster zorunlu değil; **xAPI-benzeri olay şeması** ise iç analitik ve ileride
EBA/MEBİ entegrasyonu için ucuz bir yatırım.

### 3.3 Fark analizi özeti (öncelik sırasıyla)
1. Öğretmen/sınıf katmanı (Z3, Z4) — **kritik**
2. Çoklu sınıf + çoklu ders şeması ve içerik hattı (Z12) — **kritik**
3. Kanıt ve ölçüm (pilot, tarama aracı, analitik olay şeması) — **yüksek**
4. Uyumluluk belgeleri (KVKK envanteri, WCAG ACR, gizlilik, güvenlik başlıkları) (Z10, Z11) — **yüksek**
5. Üretim olgunluğu (kod bölme, ses lazy-load, hata izleme, içerik sürümleme) (Z1, Z2, Z8, Z9) — **yüksek**
6. Sınıf-içi araç kutusu (tahta araçları, öğrenci cihazına gönder) — **orta**
7. Fiziksel tahta doğrulaması ve ses tamamlama (Z5, Z6, Z7) — **hemen, düşük maliyet**

---

## 4. Mimari karar: sunucusuz mu, hibrit mi?

### 4.1 Kısa cevap
**Hibrit (local-first) modeli öneriyorum; tam sunucusuz modelde kalmayı önermiyorum.** Ama hibritin
tanımı önemli: *çocuk için sunucusuz, öğretmen için opsiyonel bulut.*

### 4.2 Neden tam sunucusuz "okul/öğretmen" hedefiyle çelişir
1. **Tahta modunda veri yoktur.** Şu an bilinçli olarak `repository` no-op. Sınıfta 25 çocuk sırayla tahtaya çıkıyor; öğretmen "bugün kim neyi yapamadı"yı göremez. Sunucusuz kalarak bunu çözmenin tek yolu tahtaya yerel öğrenci listesi + yerel kayıt eklemektir — bu da zaten "veri cihazda" ilkesini ihlal etmez ama **öğretmen kendi tabletinden/evinden bakamaz**, tahta değişirse veri kaybolur, okul tahtayı sıfırlarsa yıl uçar.
2. **Tablet senaryosu cihaza kilitli.** Çocuk A, tablet 3'te ilerledi; ertesi gün tablet 7'yi aldı → ilerleme yok. Sınıf tablet setleri paylaşımlıdır. Sunucusuz çözüm (QR ile dışa/içe aktarma) 1. sınıf öğretmeni için günlük iş yükü demektir.
3. **Öğretmen, sınıf-çapı görünüm ister.** Morpa/Vitamin/ANTON/Happy Numbers hepsinde var. Bu, bir ürünün "araç" olmaktan "ders sistemi" olmaya geçtiği eşiktir.
4. **Kanıt üretilemez.** Pilot okulda etkililik ölçmek için toplu, takma-adlı veri gerekir. Cihazlarda dağınık veriden çalışma yapılmaz.
5. **İçerik güncellemesi ve hata düzeltme**: PWA zaten "sunucudan indirilir"; yani zaten bir dağıtım sunucusu vardır. Soru "sunucu var mı" değil, "sunucu **kişisel veri** tutuyor mu"dur.

### 4.3 Neden "tam bulut platform" da önerilmiyor
- Çocuk hesabı ve merkezi kimlik → KVKK'da en ağır yükümlülük (veli açık rızası, VERBİS, veri ihlali bildirimi, saklama süreleri), MEB genelgelerinin en hassas noktası.
- Sınıflarda internet güvenilmez; bulut ön koşulu dersi durdurur.
- Bağımsız/küçük ekip için 7/24 operasyon yükü.
- Projenin en büyük farklılaştırıcısı — **"çocuk verisi çocukta kalır"** — kaybolur.

### 4.4 Önerilen hibrit modelin tanımı
| Katman | Ne | Nerede | Kişisel veri? |
|---|---|---|---|
| **Çocuk deneyimi** | Alıştırma, ustalık, bahçe, maskot | Cihazda (IndexedDB), çevrimdışı | Hayır (takma ad + avatar) |
| **Sınıf defteri (yerel)** | Öğretmen tahtada/tabletde sınıf listesi (takma ad, avatar, yerel no), oturum kayıtları | Cihazda | Takma ad — öğretmen kendi kâğıt listesiyle eşler; uygulama gerçek ad tutmaz |
| **Öğretmen hesabı (opsiyonel)** | E-posta + parola (Better Auth), öğretmen **yetişkin** olduğu için sorun yok | Bulut (Neon Postgres) | Evet — yalnız öğretmenin kendi verisi |
| **Sınıf senkronu (opsiyonel)** | Sınıf kodu (6 hane) ile cihazlar sınıfa bağlanır; olay günlüğü (xAPI-benzeri, takma adlı) sunucuya **itilir**; öğretmen panosu çeker | Bulut | Takma adlı öğrenme verisi. Okul = veri sorumlusu; ürün = veri işleyen. Veli bilgilendirmesi şablonu ürünle verilir |
| **İçerik dağıtımı** | JSON + ses paketleri, sürümlü | CDN (statik) | Hayır |

**Kırmızı çizgiler:** çocuk için hesap yok; gerçek ad/fotoğraf/iletişim alanı yok (şemada dahi yok);
senkron kapalıysa ürün %100 çalışır; sunucudaki veri okul/öğretmen tarafından tek tıkla silinir;
saklama süresi varsayılan 1 eğitim yılı + 3 ay.

**Neden Neon (Postgres) + Better Auth:** projenin v0/Vercel ekosisteminde önerilen varsayılan yığın;
sunucusuz ölçekleme (kullanılmadığında sıfır maliyet), parametreli sorgular, öğretmen başına
`teacherId` ile satır kapsamı. Alternatif olarak Supabase (RLS) da kabul edilebilir; **ajan tek bir
tanesini seçer ve `PLAN.md`'ye yazar**.

### 4.5 Faz kararı
- **Faz 0-2** tamamen sunucusuz kalır (yerel sınıf defteri dahil). Ürün bu noktada bile "okul kullanımı" için yeterli olur.
- **Faz 3**'te opsiyonel öğretmen hesabı + senkron gelir. Faz 3 başlamadan **KVKK veri işleme envanteri ve veli bilgilendirme şablonu** (İP-19) bitmiş olmalı.

---

## 5. Hedef ürün tanımı ("dünya standardı" ne demek — ölçülebilir)

| Boyut | Ölçüt (Definition of World-Class) |
|---|---|
| Kapsam | 1-4. sınıf matematik %100 kazanım; 1. sınıf Türkçe ilk okuma-yazma (ses grupları, hece, kelime, cümle) ve Hayat Bilgisi 1. sınıf üniteleri; her kazanım ≥1 jeneratör |
| Pedagoji | Her şablon: hata taksonomisi etiketi, 3 kademe yardım, manipülatif; ustalık modeli sınıf-bağımsız; sınıf-içi "erken sayı hissi" taraması (5 dk) |
| Öğretmen | Yerel sınıf defteri; beceri × öğrenci ısı haritası; "bugün kimi çağırmalıyım" önerisi; tahta araç kutusu; PDF/CSV rapor; opsiyonel bulut senkron |
| Erişilebilirlik | WCAG 2.2 AA denetimi (axe + elle), ekran okuyucu yolu, `prefers-reduced-motion`, kontrast ≥4.5:1, hedef ≥44 px (tahtada ≥96 px) |
| Gizlilik/güvenlik | KVKK envanteri + veli bilgilendirme şablonu; gizlilik beyanı; güvenlik başlıkları (CSP, HSTS, nosniff, Referrer-Policy, X-Frame-Options); bağımlılık taraması CI'da |
| Performans | Tahta (Android WebView) ilk anlamlı boyama < 3 s; JS ilk parça < 250 kB gzip; ses paketleri ders bazında lazy; CLS < 0.1 |
| Kanıt | Pilot: ≥3 okul, ≥6 hafta, ön/son test; sonuçlar `docs/KANIT.md`; analitik olay şeması belgelenmiş |
| Operasyon | Hata izleme; sürümlü içerik paketleri; göç testleri; sürüm notları; ana dalda tam CI (e2e dahil) |
| Uluslararasılaşma hazırlığı | UI metinleri ve ses anahtarları i18n sözlüğünde; müfredat eşlemesi "standart kimliği" alanı taşır (MEB-2024, sonra CCSS vb.) — çeviri Faz 6, mimari Faz 1'de |

---

## 6. İş paketleri (İP) — ajanlar için uygulama planı

Notasyon: **Bağımlılık** = önce bitmesi gereken İP'ler. **Kabul** = PR'da işaretlenecek doğrulanabilir
maddeler. **Dosyalar** = beklenen ana değişiklik yerleri (yol gösterici, bağlayıcı değil).
Süre tahmini bilinçli olarak verilmez; sıra ve bağımlılık verilir.

### Faz 0 — Sağlamlaştırma (hemen, düşük risk)

**İP-01 · Ses tamamlama ve ses denetiminin güvenilir hâle getirilmesi**
- Amaç: Z6, Z14. Eksik klipleri üret (TTS ile üretim *geliştirme aşamasında* serbest; çıktı m4a dosyası commit'lenir), `audio:audit` ffprobe yoksa **açık hata** versin.
- Kabul: `npm run audio:audit` her şablon için klip bulur; ffprobe yoksa çıkış kodu ≠ 0 ve anlaşılır mesaj; PLAN §4.5 envanteri güncel; `LICENSES.md` ses kaynağını belirtir.
- Dosyalar: `public/audio/**`, `scripts/audio-audit.ts`, `src/audio/`.

**İP-02 · Rakam glifleri MEB yazı formu doğrulaması**
- Amaç: Z5. MEB ilk okuma-yazma rakam yazım formlarıyla SVG glifleri karşılaştır; farklıysa düzelt; yazım yönü animasyonu (ok/başlangıç noktası) ekle.
- Kabul: `docs/RAKAM_GLIF_DOGRULAMA.md` (kaynak + karşılaştırma görselleri); glif snapshot testleri.

**İP-03 · Kod bölme ve ses lazy-load**
- Amaç: Z1, Z2. Şablon jeneratörleri ve ekranlar `React.lazy`/dinamik `import()`; ses klipleri tema bazında runtime cache (Workbox `runtimeCaching`, precache yalnız çekirdek UI sesleri).
- Kabul: ilk JS parçası < 250 kB gzip; precache < 2 MB; çevrimdışı senaryo e2e: bir tema bir kez açıldıysa ağsız çalışır; Lighthouse PWA "installable".
- Dosyalar: `vite.config.ts`, `src/App.tsx`, `src/exercises/registry.ts`, `src/audio/`.

**İP-04 · CI sıkılaştırma + güvenlik başlıkları + bağımlılık taraması**
- Amaç: Z10, Z13. e2e ana dala push'ta da koşar; `npm audit --audit-level=high` CI'da; dağıtım katmanında (`vercel.json` ya da eşdeğeri) başlıklar: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Content-Security-Policy-Report-Only` başlangıç politikası.
- Kabul: CI yeşil; `curl -I` ile başlıklar görünür; `docs/GUVENLIK.md` yazıldı.

**İP-05 · Hata izleme (birinci taraf, kişisel verisiz)**
- Amaç: Z8. Global `window.onerror`/`unhandledrejection` + React error boundary → yerel halka tampon; kullanıcı (öğretmen) "hata raporu dışa aktar" ile JSON alır. Faz 3'te opsiyonel sunucuya gönderim. Üçüncü taraf SDK **yok**.
- Kabul: hata boundary ekranı çocuk-dostu (maskot + ses + "tekrar dene"); rapor JSON'unda kişisel alan yok (test).

**İP-06 · Fiziksel akıllı tahta doğrulama turu**
- Amaç: Z7. `docs/TEST-PROTOKOLU.md`'deki tahta protokolü en az 2 farklı FATİH tahtasında (Android WebView sürümü kaydedilir) uygulanır: dokunma gecikmesi, çoklu dokunma, ses çıkışı, parlaklık/kontrast, ekran koruyucu kesintisi, PWA kurulumu.
- Kabul: `docs/TAHTA_DOGRULAMA_RAPORU.md`; bulunan her sorun için ayrı issue; PROGRESS Adım 13 ✅. *(İnsan katılımı gerekir; ajan protokolü ve kayıt şablonunu hazırlar.)*

### Faz 1 — Çoklu sınıf / çoklu ders içerik mimarisi

**İP-07 · İçerik şeması v2: ders × sınıf × standart**
- Amaç: Z12. `kazanimlar.json` → `content/<ders>/<sinif>/kazanimlar.json`; her kazanım `standart: "MEB-2024"`, `ders: "MAT"|"TUR"|"HAY"`, `sinif: 1..4`, `surum` alanları taşır. `skills.json` beceri kimliği `MAT.1.SAY.001` biçiminde. Şablon kimlikleri ders öneki alır (`M-` matematik korunur; `T-` Türkçe, `H-` Hayat Bilgisi).
- Kabul: `npm run validate` çoklu ders ağacını doğrular; mevcut 1. sınıf matematik **birebir** göç eder (snapshot testi: göç öncesi/sonrası beceri grafı eş); ustalık kayıtları `migrations/v2` ile taşınır ve testlenir.
- Dosyalar: `src/content/**`, `scripts/validate-content.ts`, `src/exercises/types.ts`, `src/persistence/migrations/`.

**İP-08 · İçerik sürümleme ve yayın hattı**
- Amaç: Z9. Her içerik paketi `manifest.json` (sürüm, hash, ses paketi listesi). Uygulama, içerik sürümünü ilerleme kaydına yazar; yeni sürümde beceri kimliği değişirse eşleme tablosu zorunlu (validate ile).
- Kabul: `npm run content:pack` paketi üretir; e2e: eski ilerleme + yeni içerik → veri kaybı yok.

**İP-09 · Matematik 2. sınıf (MEB 2024) içerik + jeneratörler**
- Bağımlılık: İP-07. Kazanımlar `docs/meb-matematik-2024-metin.txt`'den çıkarılır; her kazanım ≥1 şablon; yeni hata etiketleri taksonomiye eklenir (`misconceptions.json`); 100'e kadar sayılar, onluk-birlik, toplama/çıkarma eldeli, çarpmaya giriş, ölçme, geometri, veri.
- Kabul: validate 0 bekliyor; her jeneratör property-based test (geçerli aralık, tek doğru cevap, çeldirici ≠ doğru); `docs/SORU_TASARIM_DENETIMI.md` her yeni şablon için satır; ses klipleri (İP-01 yöntemiyle).

**İP-10 · Matematik 3. sınıf** — İP-09 ile aynı kalıp. **İP-11 · Matematik 4. sınıf** — aynı kalıp.
- Not: Ajan, her sınıfı ayrı PR serisi hâlinde, tema tema ilerletir (PLAN §14'teki 39 şablon serisi örnek alınır).

**İP-12 · Türkçe 1. sınıf: ilk okuma-yazma motoru**
- Bağımlılık: İP-07. MEB 2024 Türkçe programındaki ses grupları sırası (`docs/`'a program metni eklenir); şablonlar: ses tanıma (işitsel → harf), harf-ses eşleme, hece birleştirme, hece ayırma, kelime kurma (sürükle), görsel-kelime eşleme, kısa cümle sıralama, dikte (dokunmatik klavye yerine harf kartları). Yazım yönü animasyonu (İP-02 altyapısı).
- Kabul: `TUR.1.*` kazanımları eşlendi; ses paketi (harf/hece/kelime seslendirmeleri) ayrı lazy paket; okuma-öncesi çocuk için tüm yönergeler sesli.
- Risk: hece ve kelime listeleri için **telif içermeyen** kaynak; sözlük JSON `LICENSES.md`'de.

**İP-13 · Hayat Bilgisi 1. sınıf**
- Bağımlılık: İP-07. Üniteler (okulumuzda hayat, evimizde hayat, sağlıklı hayat, güvenli hayat, ülkemizde hayat, doğada hayat). Şablonlar: görsel sınıflama, sıralama (günlük rutin), doğru-yanlış (sesli), eşleştirme, senaryo seçimi. Görseller `GenerateImage`/lisanslı SVG; `docs/GORSEL_KAYNAKLARI.md`.
- Kabul: `HAY.1.*` kazanımları eşlendi; her ünite ≥3 şablon; içerik doğruluğu için öğretmen incelemesi kaydı.

**İP-14 · Ders/sınıf seçimi UI ve çocuk yolculuğu**
- Bağımlılık: İP-07. Ana ekrana ders sekmeleri (ikon + ses); sınıf seçimi öğretmen/veli kapısında (çocuk seçmez); "Bahçem" ödülleri ders-bağımsız.
- Kabul: tahta e2e geometri testleri yeni ekranları kapsar; ekran görüntüleri PR'da.

### Faz 2 — Öğretmen katmanı (yerel, sunucusuz)

**İP-15 · Yerel sınıf defteri**
- Amaç: Z3, Z4. Öğretmen kapısı (mevcut veli kapısı genelleştirilir: rol = veli | öğretmen). Sınıf oluştur (ad, sınıf düzeyi), öğrenci ekle (**takma ad + avatar + yerel no**; gerçek ad alanı şemada **yok**). Tahtada "sıradaki öğrenci" seçimi → oturum o öğrenciye yazılır (repository artık tahtada da yazar, ama yalnız sınıf defteri açıksa).
- Kabul: Dexie şema v2 + göç testi; veri saklama politikası güncellendi (`veriSaklamaPolitikasi.ts`); "sınıfı sil" tek tık ve geri alınamaz uyarı sesli/görsel; tahtada öğrenci seçim ekranı ≤ 2 dokunuş.

**İP-16 · Öğretmen panosu: beceri × öğrenci ısı haritası + "kimi çağırmalıyım"**
- Bağımlılık: İP-15. Ustalık modelinden beceri × öğrenci matrisi; hata etiketi sıklığı; öneri motoru (saf fonksiyon, test edilir): "X becerisinde 4 öğrenci aynı hata etiketinde → küçük grup öner".
- Kabul: 30 öğrenci × 60 beceri matrisinde render < 100 ms; renkler token'lı ve renk körü dostu (şekil/desen ile çift kodlama); ekran okuyucu tablosu.

**İP-17 · Rapor dışa aktarma (PDF/CSV) ve sınıf yedeği**
- Bağımlılık: İP-15. Öğrenci bazlı gelişim raporu (veli toplantısı için; takma adlıdır, öğretmen adı elle yazar), sınıf CSV, sınıf yedeği (`.okulumsun` şifreli JSON, parola ile) → başka cihaza içe aktarma.
- Kabul: yedek dosyası AES-GCM ile şifreli (WebCrypto); yanlış parola testi; PDF çevrimdışı üretilir (üçüncü taraf servis yok).

**İP-18 · Tahta araç kutusu**
- Gynzy tipi araçlar: rastgele öğrenci seç (takma ad + avatar), süre sayacı, sayı doğrusu/onluk çerçeve/abaküs serbest manipülatif, "sınıfa göster" büyük soru modu, 1 dk "hızlı yoklama" (herkes elini kaldırır → öğretmen sayar; cihaz gerekmez).
- Kabul: her araç tek dokunuşla açılır; erişim bölgesi kuralları e2e ile korunur; araçlar alıştırma akışını bozmaz.

### Faz 3 — Uyumluluk, kanıt ve opsiyonel bulut

**İP-19 · KVKK veri işleme envanteri + veli bilgilendirme şablonu + gizlilik beyanı v2**
- Bağımlılık: İP-15 (yerel), İP-21 öncesi zorunlu. Envanter: hangi veri, nerede, ne kadar süre, hukuki dayanak, silme yolu. Okul için "veri sorumlusu" ve ürün için "veri işleyen" rol açıklaması; veli bilgilendirme metni (MEB genelgeleriyle uyumlu: kapalı devre, kamuya açık paylaşım yok, çocuk verisi minimizasyonu). Uygulama içi gizlilik ekranı sade dille.
- Kabul: `docs/KVKK_ENVANTERI.md`, `docs/VELI_BILGILENDIRME_SABLONU.md`, `public/gizlilik.html`; şemada kişisel veri alanı olmadığını doğrulayan test (`schema.test.ts`: yasaklı alan adları `ad`, `soyad`, `tc`, `telefon`, `eposta`, `foto`).

**İP-20 · WCAG 2.2 AA denetimi ve erişilebilirlik uygunluk raporu**
- Amaç: Z11. `axe-core` Playwright'a eklenir (her ekran, her cihaz profili); ekran okuyucu senaryoları (NVDA/TalkBack) elle; `aria-live` duyuru bölgesi; klavye ile tüm akış; odak görünürlüğü; `docs/ERISILEBILIRLIK_UYGUNLUK_RAPORU.md` (VPAT/ACR yapısında, her WCAG kriteri: destekleniyor / kısmen / desteklenmiyor + not).
- Kabul: axe "critical/serious" 0; rapor yayınlanır; CI'da axe koşar.

**İP-21 · Opsiyonel öğretmen hesabı ve sınıf senkronu (bulut)**
- Bağımlılık: İP-15, İP-16, İP-19. Yığın: Neon Postgres + Drizzle + Better Auth (e-posta + parola; **yalnız öğretmen**). Sınıf kodu (6 hane, süreli). Cihaz → sunucu: takma adlı olay günlüğü (İP-23 şeması). Sunucu → öğretmen panosu: toplu görünüm. Çakışma: olaylar ekleme-tek (append-only), CRDT gerekmez; ustalık sunucuda yeniden hesaplanır (aynı saf fonksiyon).
- Kırmızı çizgiler: çocuk hesabı yok; şemada kişisel alan yok (İP-19 testi sunucu şemasına da uygulanır); tüm sorgular `teacherId` kapsamlı; senkron kapalıyken uygulama %100 aynı; "sınıfı buluttan sil" tek tık.
- Kabul: `GetOrRequestIntegration` ile entegrasyon bağlanmış; `BETTER_AUTH_SECRET` mevcut; göç dosyaları repo'da; senkron e2e (iki tarayıcı bağlamı: tahta + öğretmen tableti); çevrimdışı kuyruk ve tekrar deneme testi; sunucu tarafı hız sınırı ve giriş doğrulama.

**İP-22 · Erken sayı hissi tarama aracı (5 dk) + pilot çalışma tasarımı**
- Sınıf başında/sonunda: sayma, sayı tanıma, subitizing (şipşak), büyüklük karşılaştırma, eksik sayı — mevcut şablonlardan zamanlı kısa form. Skorlama saf fonksiyon; norm yok, sınıf-içi sıralama ve risk bayrağı (öğretmene, çocuğa gösterilmez).
- Pilot tasarımı `docs/PILOT_TASARIMI.md`: ≥3 okul, ön/son test, kontrol sınıfı varsa belirt, veli bilgilendirme (İP-19), analiz planı; sonuçlar `docs/KANIT.md`.
- Kabul: tarama akışı ≤ 5 dk (e2e zamanlar); rapor şablonu; etik notu (etiketleme riskine karşı çocuğa sonuç gösterilmez).

**İP-23 · Öğrenme analitiği olay şeması (xAPI-benzeri)**
- Her etkileşim: `{aktör: takmaAdHash, fiil, nesne: beceriId/şablonId, sonuç: doğru/yanlış/yardımKademesi/süre/hataEtiketi, bağlam: cihazProfili, içerikSürümü, zaman}`. Yerelde tutulur; İP-21 ile isteğe bağlı itilir. Şema JSON Schema ile belgelenir; ileride EBA/MEBİ ya da xAPI LRS'e dönüştürücü yazmayı mümkün kılar.
- Kabul: `docs/ANALITIK_OLAY_SEMASI.md`; şema doğrulama testi; kişisel alan yasağı testi.

### Faz 4 — Sınıf-içi çoklu cihaz

**İP-24 · "Sınıfa katıl": tahta + öğrenci tabletleri**
- Bağımlılık: İP-15; bulutsuz sürüm için yerel ağ gerekmez: tahta QR/kod gösterir, tablet kodu girer → aynı sınıf defterini (takma ad listesi) alır (kod içinde sıkıştırılmış liste; kişisel veri yok). Bulutlu sürümde (İP-21) kod sınıfa bağlar ve olaylar senkron olur.
- Kabul: tabletde öğrenci seçim ekranı takma ad + avatar; 30 öğrenciye kadar; e2e iki bağlam.

**İP-25 · Öğretmen "gönder" ve canlı görünüm (bulutlu)**
- Bağımlılık: İP-21, İP-24. Öğretmen bir beceriyi tüm tabletlere gönderir; pano canlı doğru/yanlış dağılımı gösterir (polling ya da SSE; WebSocket zorunlu değil).
- Kabul: 30 cihaz simülasyonu (test) altında gecikme < 3 s; ağ kesilirse tablet çevrimdışı devam eder ve sonra iter.

### Faz 5 — Ürünleşme ve dağıtım

**İP-26 · Sürüm ve dağıtım stratejisi**
- Semver; `CHANGELOG.md`; içerik ve uygulama sürümü ayrı; PWA güncelleme bildirimi öğretmene (çocuğa değil); geri alma planı.
- Kabul: release iş akışı (GitHub Actions) etiketten dağıtır; `docs/DAGITIM.md`.

**İP-27 · Kurulum kılavuzları (okul BT + öğretmen) ve destek**
- FATİH tahtasına PWA kurulumu adım adım (ekran görüntülü), tablet kurulumu, çevrimdışı hazırlık ("dersten önce tüm temaları bir kez aç"), sorun giderme.
- Kabul: `docs/KURULUM_OKUL.md`, `docs/KURULUM_OGRETMEN.md`; uygulama içi "Yardım" ekranı.

**İP-28 · Performans bütçesi ve düşük donanım doğrulaması**
- Lighthouse CI bütçesi (JS < 250 kB gzip ilk parça, LCP < 3 s 4x CPU yavaşlatma, CLS < 0.1); Android WebView 90-ish eski sürüm uyumluluğu (Browserslist güncelle, polyfill kararı).
- Kabul: `lighthouserc` CI'da; `agent-browser vitals` raporu PR'a eklenir.

**İP-29 · Öğretmen ve okul yöneticisi rol modeli**
- Yönetici: okuldaki sınıfların toplu görünümü (yalnız bulutlu). Yetkiler tabloda; öğretmen kendi sınıfı dışını göremez.
- Kabul: yetki testleri (her rol × her uç nokta); `docs/ROLLER.md`.

### Faz 6 — Uluslararasılaşma hazırlığı (mimari şimdi, çeviri sonra)

**İP-30 · i18n altyapısı**
- Bağımlılık: İP-07. UI metinleri `src/i18n/tr.json`; ses anahtarları dil-önekli (`tr/soru-veri/...`); sayı/para/ölçü biçimleri `Intl`; RTL hazır olmayan yerler işaretlenir. Türkçe tek dil olarak kalır; çeviri ürün kararına bırakılır.
- Kabul: kodda sabit Türkçe UI dizgesi 0 (lint kuralı ile); ses yolu çözümlemesi dil-farkında.

**İP-31 · Müfredat standart eşleme katmanı**
- Bağımlılık: İP-07. Her beceri `standartlar: [{sistem: "MEB-2024", kod: "M.1.1.1.1"}]` dizisi; ileride `CCSS`, `UK-NC` eklenebilir. Ekranlarda standart kodu öğretmene gösterilir (güvenilirlik).
- Kabul: validate çoklu standart dizisini doğrular; öğretmen panosunda kazanım kodu görünür.

---

## 7. Sıralama ve bağımlılık haritası

```
Faz 0: İP-01 İP-02 İP-03 İP-04 İP-05 (paralel) → İP-06 (insan + tahta)
Faz 1: İP-07 → İP-08 → {İP-09 → İP-10 → İP-11} ∥ İP-12 ∥ İP-13 → İP-14
Faz 2: İP-15 → İP-16 → İP-17 ; İP-18 (İP-15 sonrası paralel)
Faz 3: İP-19 → İP-20 ∥ İP-23 → İP-21 → İP-22 (pilot İP-15+İP-22 ile bulutsuz da yapılabilir)
Faz 4: İP-24 → İP-25
Faz 5: İP-26 İP-27 İP-28 İP-29
Faz 6: İP-30 İP-31 (İP-07 ile birlikte tasarlanır, sonra tamamlanır)
```

**Ajan için öncelik kuralı:** Bir faz içinde blokajsız en küçük İP'yi al. Faz 0 bitmeden Faz 1'e
geçme (Faz 0, sonraki her şeyin hızını belirler). İP-19 bitmeden İP-21'e **başlama**.

---

## 8. Bitirme tanımı (proje ne zaman "bitti")

Proje **v1.0 "Sınıf Sürümü"** şu koşullarda bitmiş sayılır:
1. Faz 0-2 tamamen ✅; Faz 3'ten İP-19, İP-20, İP-23 ✅ (bulut opsiyonel: İP-21 olmadan da v1.0).
2. 1-4 matematik + 1. sınıf Türkçe + 1. sınıf Hayat Bilgisi kazanımlarının %100'ü ≥1 şablonla eşlenmiş; validate 0 bekliyor.
3. En az 2 fiziksel tahta ve 1 tablet modelinde doğrulama raporu.
4. Erişilebilirlik uygunluk raporu ve KVKK envanteri yayınlanmış.
5. CI ana dalda lint + test + validate + audio:audit + build + e2e + axe + Lighthouse bütçesi yeşil.
6. Pilot tasarımı yazılmış; en az 1 okulda 6 haftalık pilot başlamış ve ilk ara raporu `docs/KANIT.md`'de.

**v2.0 "Okul Sürümü"**: İP-21, İP-24, İP-25, İP-29 ✅ ve ≥3 okul pilot sonucu.

---

## 9. Riskler ve karşı önlemler

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| İçerik hacmi (3 yeni sınıf + 2 ders) ajan kapasitesini aşar, kalite düşer | Yüksek | Yüksek | Tema-tema PR; her şablon için `SORU_TASARIM_DENETIMI` satırı zorunlu; öğretmen incelemesi kaydı; property-based testler |
| Türkçe ilk okuma-yazma pedagojisi hatalı (ses sırası, hece kuralları) | Orta | Yüksek | MEB program metni repo'da; sınıf öğretmeni inceleme kapısı; ses klipleri fonetik doğrulama listesi |
| FATİH tahtalarında eski WebView | Yüksek | Yüksek | İP-28 Browserslist + polyfill; İP-06 erken saha testi; kod bölme |
| KVKK yorum farkları (okul-il MEM) | Orta | Yüksek | İP-19 belgeleri; "bulut kapalı" varsayılan; okul veri sorumlusu; silme tek tık |
| Bulut katmanı çekirdeği kirletir (bulut ön koşul olur) | Orta | Yüksek | e2e "ağ yok" testi her PR'da; senkron modülü ayrı paket, çekirdek ona bağımlı olamaz (lint import kuralı) |
| Telifli görsel/ses/kelime listesi sızması | Orta | Orta | `LICENSES.md` zorunlu PR kontrol maddesi; üretilen varlıklar tercih |
| Ajanlar PLAN ile bu raporu çelişik uygular | Orta | Orta | Bu rapor PLAN'ı **genişletir**; çelişkide bu rapor §1.2 ve §4 kazanır; ajan çelişkiyi PLAN'a not eder |

---

## 10. Hemen yapılacak ilk 5 adım (ajan için başlangıç listesi)

1. **İP-01** — eksik ses kliplerini üret ve `audio:audit`'i ffprobe yokken hata verecek hâle getir.
2. **İP-03** — kod bölme ve ses lazy-load; ilk parçayı < 250 kB gzip'e indir.
3. **İP-04** — CI'ya e2e (push) + `npm audit` + güvenlik başlıkları.
4. **İP-07** — içerik şeması v2 tasarımını `docs/PLAN.md`'ye ekle (yeni §5.5), göç testini yaz, 1. sınıf matematiği birebir taşı.
5. **İP-15** — yerel sınıf defteri (öğretmen kapısı + takma adlı öğrenci listesi + tahtada öğrenci seçimi).

Bu beşi bittiğinde ürün, mevcut Türkiye ticari rakiplerinin sınıf içi kullanım açısından
temel özelliklerini karşılar; ardından Faz 1 içerik genişlemesi ve Faz 3 uyumluluk/kanıt ile
"dünya standardı" eşiğine ulaşır.

---

*Bu rapor `docs/PLAN.md`'nin yerine geçmez; onu genişletir. PLAN'ın §14 yol haritası "Adım 13" ile
biter; bu raporun İP-01…İP-31'i PLAN §14'e "Adım 14+" olarak eklenmelidir (İP-07 kapsamında).*
