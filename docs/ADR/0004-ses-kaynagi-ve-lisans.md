# ADR-0004: Ses kaynağı ve lisans

- **Durum:** Kabul
- **Tarih:** 2026-10-28
- **Karar sahibi:** Kullanıcı · **Kullanıcı onayı:** Sağlayıcı seçildi 11 Eki 2026 (KG-01, sohbet kaydı); Adım 18'e başlama onayı 12 Eki 2026; ses adı seçildi 28 Eki 2026 10:35 (+03): "puck daha iyi" (KG-107, sohbet kaydı); maskot sesi seçildi 28 Eki 2026 18:29 (+03): Achernar, hız 0,9 (KG-114, K-12, sohbet kaydı)
- **İlgili:** PLAN §4, Adım 15, 18, 31, 32, 54, 58, `docs/ses/SES_KAYNAKLARI.md`, eksik G01

## Bağlam

Mevcut 287 klip `piper:` önekiyle üretildi; model kimliği özete girmemiş, kökeni bilinmiyor (KG-15). Türkçe Piper sesleri ticari dağıtıma uygun değil: `tr_TR-dfki` CC BY-NC-SA 4.0; `fahrettin` ve `fettah` katkı verenlerin isteğiyle kaldırıldı (rıza geri çekildi). Ürün ileride ücretli satılabilir (KG-06), bu yüzden ticari dağıtım izni ve çocuk ürününde kullanım izni şarttır.

**Eleme ölçütleri** (biri "hayır" ise seçenek elenir): ticari dağıtım izni · çocuk ürününde kullanım izni · rıza zinciri.

## Seçenekler

| Ölçüt | A. İnsan sesi (sözleşmeli yetişkin) | B. Ticari bulut TTS | C. Açık Türkçe model | D. ElevenLabs ücretli |
|---|---|---|---|---|
| Ticari dağıtım | Sözleşmeyle evet | Evet (Google: üretilen sesi uygulamalarda kullanma izni) | Hayır (Piper dfki CC BY-NC-SA, MMS-TTS CC BY-NC) | Doğrulanmadı |
| Çocuk ürünü | Sözleşmeye yazılır | Şartlara uyumla evet | — | Doğrulanmadı |
| Rıza zinciri | Doğrudan, imzalı | Sağlayıcıda (hazır sesler) | Kırık (fahrettin) | Sağlayıcıda |
| Süreklilik | Aynı kişiye bağlı | Yüksek, betikle anında | — | Ses kimliği değişebilir |
| Maliyet | En yüksek | Google: 1M karakter/ay ücretsiz, ihtiyaç ≈3.500 | Ücretsiz | Abonelik |
| Takvim (Adım 31) | 6 gg + randevu | 3 gg | — | 3 gg |
| Gizlilik | Çocuk verisi yok | Yalnız `tr.json` metni gider | — | Yalnız metin |

C elenir (ticari izin yok). D elenir (kullanıcı kararı: ElevenLabs kullanılmaz).

## Karar

**Kabul (28 Eki 2026, KG-107): B — Google Cloud TTS, Chirp 3 HD `tr-TR`, ses `tr-TR-Chirp3-HD-Puck`, konuşma hızı 0,9.**

| Alan | Değer |
|---|---|
| Sağlayıcı / model | Google Cloud Text-to-Speech · Chirp 3 HD (KG-01) |
| Ses adı | `tr-TR-Chirp3-HD-Puck` (kullanıcı seçimi; adaylar Kore, Aoede, Puck — KG-04, KG-25) |
| Konuşma hızı | `speakingRate` 0,9 (KG-25) · biçim LINEAR16 24 kHz → AAC m4a 24 kHz mono 40 kb/sn |
| Model kimliği (özete girer) | `google:tr-TR-Chirp3-HD-Puck@2026-10` |
| Üretim tarihi | 2026-10-28 (Adım 31; artımlı üretimde yeni klipler aynı model kimliğiyle) |
| Şart sürümü (KG-05) | Service Specific Terms "Last modified October 27, 2026"; Services Summary "Last modified October 21, 2026" (Text-to-Speech: AI/ML Services → Pre-Trained APIs); Quotas sayfası "Last updated 2026-10-26" — üçü 28 Eki 2026'da yeniden okundu |
| Çocuk ürünü | `kosullu` (aşağıdaki yaş kısıtı notu) |

Seçim süreci: üç aday sesle 10'ar örnek (yönerge, geri bildirim, sayı, "on yedi elma" birleştirmesi; hız 0,9) üretildi ve kullanıcı dinledi. KG-04'teki "bir çocuğa dinletme" adımı **yapılmadı**; çocukla anlaşılırlık Adım 32 dinleme testinde ölçülür (eşik altıysa KG-07 yedek yolu).

Sağlayıcı (KG-01) ayrıntıları: Google yalnız derleme anında, geliştirici makinesinde çağrılır; çalışma anında hiçbir ses servisine istek gitmez (KG-02). Maliyet koruması: ayrı GCP projesi, 1 USD bütçe uyarısı, yalnız Text-to-Speech API'ye kısıtlı anahtar; anahtar depoya, CI'ya ve sohbete girmez (KG-03). Yedek yol: Chatterbox Multilingual (MIT, yerel, rızalı referans ses), sonra insan sesi (KG-07).

**Hukuki dayanak (KG-05), birincil kaynaklardan, 12 Eki 2026'da okundu:**

- https://docs.cloud.google.com/text-to-speech/quotas (sayfa güncelleme tarihi 2026-10-09): *"You can use the audio data files you create using Cloud Text-to-Speech in your applications or media in compliance with the Google Cloud Platform Terms of Service including compliance with all applicable law."*
- https://cloud.google.com/text-to-speech/pricing: Chirp 3 HD için ayda 0–1 milyon karakter ücretsiz, sonrası 30 USD / 1 milyon karakter; faturalandırma hesabı açık olmalı (11 Eki 2026'da okundu, ihtiyaç ≈3.500 karakter).
- https://cloud.google.com/terms/service-terms: yapay zeka/ML kısıtları — çıktıyla benzer veya rakip bir ürün geliştirmek ve Google modeline benzer bir model eğitmek yasak. Bu proje çıktıyı yalnız uygulama içinde oynatır; ikisini de yapmaz.
- https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd (2026-10-09): `tr-TR` Chirp 3 HD'de destekli; ses adı biçimi `tr-TR-Chirp3-HD-<ad>`; hız denetimi (`speakingRate` 0,25–2) tüm dillerde, "Preview" aşamasında; kota 200 istek/dk/proje.

**Çocuk ürünü:** şartlarda 13 yaş altına yönelik uygulamada çıktı kullanımını yasaklayan bir madde bulunmadı, ama bunu açıkça izinli kılan bir cümle de okunmadı → `kosullu`. Ticari lansmandan önceki avukat incelemesinde (KG-06) teyit edilir; olumsuzsa yedek yol (KG-07).

**Yaş kısıtı notu (28 Eki 2026'da okundu, avukat incelemesine sorulacak):** Service Specific Terms §20(d) — *"Customer will not, and will not allow End Users to, use a Generative AI Service as part of a website, Customer Application, or other online service that is directed towards or is likely to be accessed by individuals under the age of 18."* Services Summary'de Text-to-Speech "Generative AI Services" başlığında değil, "AI/ML Services → Pre-Trained APIs" altında listelenir; ancak aynı belge "Generative AI Services also includes any generative AI features or functionality of a Service" der ve Chirp 3 HD'nin bu kapsama girip girmediği açık değildir. Okulumsun hizmeti uygulamanın parçası olarak **kullanmaz**: Google yalnız derleme anında geliştirici makinesinde çağrılır, uygulama yalnız önceden üretilmiş dosyaları çalar (KG-02). Bu yüzden durum `kosullu` kalır; avukat incelemesinde §20(d)'nin önceden üretilmiş çıktıya uygulanıp uygulanmadığı sorulur. Olumsuz görüşte yedek yol KG-07 (Chatterbox, sonra insan sesi); klipler tek komutla yeniden üretilir.

**İfşa:** Google atıf şartı koymuyor; proje gönüllü olarak Kaynaklar ekranına ve LICENSES'a aynı cümleyi yazar: "Sesler Google Cloud Text-to-Speech ile üretilmiştir." (Adım 31'de, aktif kaynak değişince).

**Teknik kayıt (Adım 18):** `src/content/sesKaynagi.json` içindeki `bekleyen` alanı bu kararı taşır (`saglayici: google`, `model: chirp3-hd`, `ses: tr-TR-Chirp3-HD-Puck` (KG-107), `ticariDagitimIzni: true`, `cocukUrunundeKullanim: kosullu`, şart URL'leri ve okunma tarihi). İstemci `scripts/ses/googleTts.ts`; örnek üretimi `npm run audio -- --ornek [--ses Kore,Aoede,Puck]` (çıktı `public/audio-prototip/ornek/`, gitignore). Konuşma hızı 0,9 (6 yaş için ~%10 yavaş). Ses adı, üretim ayı ve şart sürümü yukarıdaki tabloda (KG-107). Vekil modu: anahtarı aradaki vekil ekliyorsa `GOOGLE_TTS_API_KEY=proxy`, `GOOGLE_TTS_UC_NOKTA=<Google text:synthesize adresi>`, `NODE_USE_ENV_PROXY=1`; yer tutucu modunda anahtar başlığı gönderilmez. 429'da üstel geri çekilme (2–32 sn, `Retry-After`'a uyar; 5 denemeden sonra durur).

**Diğer sağlayıcıların durumu:** `say` yalnız `--prototip` (dağıtılmaz); `eleven` çağrılırsa hata; `piper` yalnız eski kliplerin tanınması için, üretimde kullanılmaz.

**Kullanılmayacak kaynaklar (KG-08):** Piper `tr_TR-dfki`, Piper `fahrettin`/`fettah`, macOS `say`/Yelda, `edge-tts` ve benzeri resmî olmayan araçlar, Meta MMS-TTS.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `src/content/sesKaynagi.json` (aktif kaynak ve model kimliği), `scripts/generate-audio.ts` (`google` sağlayıcısı, Adım 31), `public/audio/` (287 klip sıfırdan), Kaynaklar ekranı ve LICENSES ses satırı, PLAN §4.
- Test / kanıt: `audio:audit` köken ve lisans kapısı `SES_GECIS_MODU` olmadan yeşil; dinleme testi (Adım 32) eşiği.
- **Uygulandı (Adım 31, 28 Eki 2026):** aktif kaynak `google:tr-TR-Chirp3-HD-Puck@2026-10`; 287 klip sıfırdan üretildi (287 istek, 3.365 karakter); `SES_GECIS_MODU` CI'dan ve denetim betiğinden kaldırıldı, `audio:audit` istisnasız yeşil; ifşa cümlesi Kaynaklar ekranında ve LICENSES'ta. `public/audio/` 1,97 → 2,70 MB. Kalan: kulakla örneklem, Adım 32 dinleme testi, avukat incelemesi (§20(d)).
- **Maskot sesi ek kararı (KG-114, K-12, 28 Eki 2026):** Adım 54 alt görev 5'in (b) şıkkının sağlayıcı içi biçimi — aynı sağlayıcının (Google Cloud TTS Chirp 3 HD) **ayrı hazır sesi `tr-TR-Chirp3-HD-Achernar`, hız 0,9**; yalnız `maskot.*` ve `hikaye.*` anahtarları. Kullanıcı 22 aday arasından dinleyerek seçti; yönerge sesi Puck 0,9 değişmedi. Şartlar, ifşa cümlesi, ücretsiz katman koruması ve gizlilik etkisi aynı (yalnız içerik metni gider). Uygulama: `sesKaynagi.json` `anahtarSesleri`, özet klibin ses adını içerir (`docs/ses/SES_KAYNAKLARI.md` §13).

## Gizlilik etkisi

Sağlayıcıya yalnız `tr.json` yönerge metinleri gider; öğrenci verisi yoktur. Çalışma anına ağ isteği eklenmez (Sıfır Veri Sözleşmesi madde 3 ve 7).

## Lisans ve üçüncü taraf etkisi

Google Cloud Platform Hizmet Şartları ve Hizmete Özel Şartlar. Kaynaklar ekranına ve LICENSES'a "Sesler Google Cloud Text-to-Speech ile üretilmiştir" ifşası eklenir. Lisans envanteri (K10) ses kaynağını kaydeder.

## Geri dönüş maliyeti

Orta: klipler başka kaynakla yeniden üretilebilir (≈3 gün), ama dinleme testi tekrarlanır.

## Kabul koşulları

- [x] Sağlayıcı seçildi (KG-01).
- [x] GCP projesi ve anahtar kullanıcı tarafından kuruldu; anahtar Hark kasasında, depoya/CI'ya girmedi (28 Eki 2026). 1 USD bütçe uyarısı ve anahtarın yalnız Text-to-Speech API ile kısıtlandığı kullanıcı beyanıyla **doğrulanmadı** (KG-03; kullanıcıya hatırlatıldı).
- [x] Şartlar birincil kaynaktan, tarih ve URL ile alıntılandı (12 Eki 2026).
- [x] Örnek üretim hattı hazır (`npm run audio -- --ornek`).
- [x] 3 Chirp 3 HD sesiyle (Kore, Aoede, Puck) 10'ar örnek üretildi; ses adı kullanıcı tarafından seçildi: Puck (KG-04, KG-107). Çocuğa dinletme yapılmadı → Adım 32.
- [x] Ses adı, üretim tarihi ve şart sürümü bu ADR'ye yazıldı (Adım 18, KG-107).
