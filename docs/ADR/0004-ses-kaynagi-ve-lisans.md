# ADR-0004: Ses kaynağı ve lisans

- **Durum:** Önerildi
- **Tarih:** 2026-10-12
- **Karar sahibi:** Kullanıcı · **Kullanıcı onayı:** Sağlayıcı seçildi 11 Eki 2026 (KG-01, sohbet kaydı); Adım 18'e başlama onayı 12 Eki 2026; ses adı seçimi bekliyor (KG-04, son tarih 6 Kas 2026)
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

Önerilen (kullanıcının seçtiği sağlayıcı, KG-01): **B — Google Cloud TTS, Chirp 3 HD `tr-TR`**. Google yalnız derleme anında, geliştirici makinesinde çağrılır; çalışma anında hiçbir ses servisine istek gitmez (KG-02). Maliyet koruması: ayrı GCP projesi, 1 USD bütçe uyarısı, yalnız Text-to-Speech API'ye kısıtlı anahtar; anahtar depoya, CI'ya ve sohbete girmez (KG-03). Yedek yol: Chatterbox Multilingual (MIT, yerel, rızalı referans ses), sonra insan sesi (KG-07).

**Hukuki dayanak (KG-05), birincil kaynaklardan, 12 Eki 2026'da okundu:**

- https://docs.cloud.google.com/text-to-speech/quotas (sayfa güncelleme tarihi 2026-10-09): *"You can use the audio data files you create using Cloud Text-to-Speech in your applications or media in compliance with the Google Cloud Platform Terms of Service including compliance with all applicable law."*
- https://cloud.google.com/text-to-speech/pricing: Chirp 3 HD için ayda 0–1 milyon karakter ücretsiz, sonrası 30 USD / 1 milyon karakter; faturalandırma hesabı açık olmalı (11 Eki 2026'da okundu, ihtiyaç ≈3.500 karakter).
- https://cloud.google.com/terms/service-terms: yapay zeka/ML kısıtları — çıktıyla benzer veya rakip bir ürün geliştirmek ve Google modeline benzer bir model eğitmek yasak. Bu proje çıktıyı yalnız uygulama içinde oynatır; ikisini de yapmaz.
- https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd (2026-10-09): `tr-TR` Chirp 3 HD'de destekli; ses adı biçimi `tr-TR-Chirp3-HD-<ad>`; hız denetimi (`speakingRate` 0,25–2) tüm dillerde, "Preview" aşamasında; kota 200 istek/dk/proje.

**Çocuk ürünü:** şartlarda 13 yaş altına yönelik uygulamada çıktı kullanımını yasaklayan bir madde bulunmadı, ama bunu açıkça izinli kılan bir cümle de okunmadı → `kosullu`. Ticari lansmandan önceki avukat incelemesinde (KG-06) teyit edilir; olumsuzsa yedek yol (KG-07).

**İfşa:** Google atıf şartı koymuyor; proje gönüllü olarak Kaynaklar ekranına ve LICENSES'a aynı cümleyi yazar: "Sesler Google Cloud Text-to-Speech ile üretilmiştir." (Adım 31'de, aktif kaynak değişince).

**Teknik kayıt (Adım 18):** `src/content/sesKaynagi.json` içindeki `bekleyen` alanı bu kararı taşır (`saglayici: google`, `model: chirp3-hd`, `ses: null`, `ticariDagitimIzni: true`, `cocukUrunundeKullanim: kosullu`, şart URL'leri ve okunma tarihi). İstemci `scripts/ses/googleTts.ts`; örnek üretimi `npm run audio -- --ornek [--ses Kore,Aoede,Puck]` (çıktı `public/audio-prototip/ornek/`, gitignore). Konuşma hızı 0,9 (6 yaş için ~%10 yavaş). Kabulde ses adı, üretim ayı (`google:tr-TR-Chirp3-HD-<ad>@YYYY-AA`) ve şart okuma tarihi buraya yazılır.

**Diğer sağlayıcıların durumu:** `say` yalnız `--prototip` (dağıtılmaz); `eleven` çağrılırsa hata; `piper` yalnız eski kliplerin tanınması için, üretimde kullanılmaz.

**Kullanılmayacak kaynaklar (KG-08):** Piper `tr_TR-dfki`, Piper `fahrettin`/`fettah`, macOS `say`/Yelda, `edge-tts` ve benzeri resmî olmayan araçlar, Meta MMS-TTS.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `src/content/sesKaynagi.json` (aktif kaynak ve model kimliği), `scripts/generate-audio.ts` (`google` sağlayıcısı, Adım 31), `public/audio/` (287 klip sıfırdan), Kaynaklar ekranı ve LICENSES ses satırı, PLAN §4.
- Test / kanıt: `audio:audit` köken ve lisans kapısı `SES_GECIS_MODU` olmadan yeşil; dinleme testi (Adım 32) eşiği.

## Gizlilik etkisi

Sağlayıcıya yalnız `tr.json` yönerge metinleri gider; öğrenci verisi yoktur. Çalışma anına ağ isteği eklenmez (Sıfır Veri Sözleşmesi madde 3 ve 7).

## Lisans ve üçüncü taraf etkisi

Google Cloud Platform Hizmet Şartları ve Hizmete Özel Şartlar. Kaynaklar ekranına ve LICENSES'a "Sesler Google Cloud Text-to-Speech ile üretilmiştir" ifşası eklenir. Lisans envanteri (K10) ses kaynağını kaydeder.

## Geri dönüş maliyeti

Orta: klipler başka kaynakla yeniden üretilebilir (≈3 gün), ama dinleme testi tekrarlanır.

## Kabul koşulları

- [x] Sağlayıcı seçildi (KG-01).
- [ ] GCP projesi, bütçe uyarısı ve kısıtlı anahtar kullanıcı tarafından kuruldu (KG-20, 20 Eki 2026'ya kadar).
- [x] Şartlar birincil kaynaktan, tarih ve URL ile alıntılandı (12 Eki 2026).
- [x] Örnek üretim hattı hazır (`npm run audio -- --ornek`).
- [ ] 2–3 Chirp 3 HD sesiyle 10'ar örnek üretildi; ses adı kullanıcı tarafından seçildi (KG-04).
- [ ] Ses adı, üretim tarihi ve şart sürümü bu ADR'ye yazıldı (Adım 18).
