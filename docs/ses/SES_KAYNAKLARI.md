# Ses kaynakları ve köken envanteri

> Adım 15 (F0.2) · 12 Ekim 2026 · Karar kaynakları: KG-01, KG-08, KG-15 (plan v2 §2.7). Kesin karar ADR-0004'te (Kabul, 28 Ekim 2026, KG-107).
>
> **Güncel durum (Adım 31, 28 Ekim 2026):** aktif kaynak **Google Cloud TTS Chirp 3 HD `tr-TR-Chirp3-HD-Puck`, hız 0,9** (`google:tr-TR-Chirp3-HD-Puck@2026-10`). 287 klibin tamamı bu kaynakla sıfırdan üretildi; `audio:audit` geçiş istisnası olmadan yeşil (K4). §1–§7 eski kliplerin geçmişidir; yeni durum §9.

## 1. Özet

- `public/audio/` altındaki **287 klibin** tamamı, özet dosyasına göre `piper:` önekiyle üretildi.
- Hangi Piper modeliyle (ve hangi makinede) üretildikleri **bilinmiyor** (KG-15).
- Türkçe Piper seslerinin hiçbiri bugün ticari bir çocuk ürününde dağıtım için güvenli değil (bkz. §3).
- Bu yüzden mevcut klipler **üretimde kullanılmayacak**; tümü Google Cloud TTS **Chirp 3 HD `tr-TR`** ile sıfırdan üretilecek (KG-01, Adım 31).
- Geçiş süresince `npm run audio:audit` köken denetimi yapar ve aktif kaynağın ticari izni olmadığı için **kırmızı** verir; CI'da `SES_GECIS_MODU=1` açık istisnasıyla çalışır (Adım 31 kaldırır).

## 2. `.hashes.json` analizi (yeniden üretilebilir)

Eski üretici her klip için `sha256('<sağlayıcı>:' + metin).slice(0, 16)` yazıyordu. Kontrol (12 Ekim 2026):

| Hipotez | Eşleşen |
|---|---|
| `sha256('piper:' + metin)` | **287 / 287** |
| `sha256('say:' + metin)` | 0 / 287 |

Komut: `npx vitest run tests/unit/sesKokeni.spec.ts` ("gerçek .hashes.json'daki 287 özet eskiOzet('piper', metin) ile eşleşir").

Not: önek yalnız `TTS_PROVIDER=piper` ile üretildiğini kanıtlar; model dosyası (`PIPER_MODEL`) özete girmediği için **hangi Türkçe sesin** kullanıldığı özetten çıkarılamaz. Eski betiğin varsayılan modeli `.tools/piper/tr_TR-dfki-medium.onnx` idi; PLAN.md ve Kaynaklar ekranı ise `tr_TR-fahrettin-medium` diyordu.

## 3. Dış gerçekler (12 Ekim 2026'da okundu)

| Kaynak | Bulgu | URL |
|---|---|---|
| `tr_TR-dfki-medium` model kartı | Veri kümesi lisansı **CC BY-NC-SA 4.0** (ticari değil, ShareAlike) | https://huggingface.co/rhasspy/piper-voices/blob/main/tr/tr_TR/dfki/medium/MODEL_CARD |
| `rhasspy/piper-voices` commit `b145f2a` (30 Ara 2025) | "Remove fahrettin and fettah voices at request of contributors" — iki Türkçe ses katkı verenlerin isteğiyle kaldırıldı. Silinen model kartında veri kümesi lisansı CC0 yazıyordu, ancak ses sahiplerinin rızası geri çekildi | https://huggingface.co/rhasspy/piper-voices/commit/b145f2a |
| `rhasspy/piper` | Arşivlendi (6 Eki 2025); geliştirme `OHF-Voice/piper1-gpl` (GPL-3.0) altında sürüyor. *Ayrıntılı rakip raporundan; bu adımda yeniden açılmadı* | https://github.com/OHF-Voice/piper1-gpl |

Piper aracının kendi lisansı (GPL-3.0) yalnız geliştirme makinesinde çalıştığı için uygulamaya geçmez; sorun **ses modelinin** eğitim verisi ve ses sahibinin rızasıdır.

## 4. Sonuç

Mevcut klipler ya rızası geri çekilmiş bir sesle (`fahrettin`) ya da ticari olmayan veriyle eğitilmiş bir modelle (`dfki`) üretildi; iki durumda da **ticari dağıtım ve okullara resmî sunum için uygun değil.**

## 5. Kullanıcı köken cevabı

Kullanıcı 11 Ekim 2026'da kliplerin hangi makinede/modelle üretildiğini bilmediğini belirtti → **köken: bilinmiyor** (KG-15).

## 6. Kullanılmayacak kaynaklar (KG-08)

Piper `tr_TR-dfki` (CC BY-NC-SA) · Piper `fahrettin`/`fettah` (kaldırıldı) · macOS `say`/Yelda (Apple lisansı; yalnız `--prototip`, dağıtılmaz) · `edge-tts` vb. resmî olmayan araçlar · Meta MMS-TTS (CC BY-NC).

## 7. Teknik sözleşme

- Aktif kaynak: `src/content/sesKaynagi.json` (şimdilik `piper:bilinmiyor`, `ticariDagitimIzni: false`).
- Sözleşme ve özet: `scripts/ses/sesKaynagi.ts` — `klipOzeti = sha256('<sağlayıcı>:<modelKimligi>:<metin>').slice(0,16)`.
- Klip kümesi: `scripts/ses/klipler.ts` (üretici ve denetim aynı modülü kullanır).
- `.hashes.json` yeni biçimi `{ "$kaynak": SesKaynagi, "<anahtar>": "<özet>" }`; eski düz biçim geriye uyumlu okunur.
- Google kaynağına geçiş (Adım 31): `sesKaynagi.json` → `{ "saglayici": "google", "modelKimligi": "google:tr-TR-Chirp3-HD-<ses>@<tarih>", "ticariDagitimIzni": true, ... }`, `npm run audio -- --zorla` (eski `--force`), CI'dan `SES_GECIS_MODU` kaldırılır.

## 8. Karar (Adım 18, ADR-0004)

- Sağlayıcı: **Google Cloud TTS, Chirp 3 HD `tr-TR`** (KG-01). Durum: ADR-0004 `Kabul` (28 Eki 2026). Ses: **`tr-TR-Chirp3-HD-Puck`**, hız 0,9 — kullanıcı Kore/Aoede/Puck örneklerinden seçti (KG-107).
- `sesKaynagi.json` → `bekleyen`: karar kaydı; `aktif` Adım 31'e kadar `piper:bilinmiyor` kalır, `audio:audit` köken denetimini aktif kaynağa göre yapar.
- Anahtar: `GOOGLE_TTS_API_KEY`, yalnız ortam değişkeni veya `.env.local` (`*.local` gitignore'da). Depoya, CI'ya, günlüğe girmez (KG-03). Vekil modu (anahtarı aradaki vekil ekler): `GOOGLE_TTS_API_KEY=proxy GOOGLE_TTS_UC_NOKTA=https://texttospeech.clients6.google.com/v1/text:synthesize NODE_USE_ENV_PROXY=1 npm run audio` — yer tutucu modunda anahtar başlığı gönderilmez.
- Ses seçimi (KG-04): `npm run audio -- --ornek` → Kore, Aoede, Puck (veya `--ses A,B,C`) için 10'ar örnek + `birlesim-on-yedi-elma.m4a` (PLAN §4.3 tını kontrolü). Çıktı `public/audio-prototip/ornek/<ses>/`, dağıtılmaz.
- Şartlar ve alıntılar: ADR-0004 "Karar" bölümü.

## 9. Adım 31 — yeniden üretim (28 Ekim 2026)

- Komut (vekil modu; anahtar kasada, depoya girmez): `GOOGLE_TTS_API_KEY=proxy GOOGLE_TTS_UC_NOKTA=https://texttospeech.clients6.google.com/v1/text:synthesize NODE_USE_ENV_PROXY=1 npm run audio -- --en-cok 80` (sandbox süre sınırı yüzünden parça parça; özetler her klipten sonra atomik yazılır, kesilen çalışma kaldığı yerden sürer).
- Sonuç: **287 / 287 klip**, sağlayıcıya **287 istek · 3.365 karakter** (yalnız `tr.json` metinleri ve üretilen sayı adları; içerik günlüğe yazılmadı). Aylık 1 milyon ücretsiz kotanın ~%0,3'ü. 429 alınmadı.
- Biçim değişmedi: LINEAR16 24 kHz → `ffmpeg` AAC m4a 24 kHz mono 40 kb/sn (eski kliplerle aynı ayar; sessizlik kırpma/normalleştirme eklenmedi — Puck çıktısında baş sessizliği ≈0, son ≈0,14 sn; ortalama ses düzeyi eskiyle aynı bantta, −19…−21 dB).
- Boyut: `public/audio/` 1.969.306 B → **2.696.181 B** (+726.875 B, %37); tümü PWA precache'te (`globPatterns` m4a, dosya başı sınır 5 MB). JS bütçesi (K5) etkilenmez — ses dosyaları JS değil.
- `.hashes.json`: `{ "$kaynak": <aktif kaynak>, "<anahtar>": sha256('google:google:tr-TR-Chirp3-HD-Puck@2026-10:<metin>').slice(0,16) }`; eski `piper:` özeti 0.
- CI: `SES_GECIS_MODU` `ci.yml`, `vercel-kontrol.yml` ve `scripts/audit-audio.ts`'ten kaldırıldı; ticari izinsiz kaynak artık her zaman kırmızı.
- Tarayıcı uyumu: m4a (AAC) Safari/iOS, Chrome, Edge, Firefox'ta çalar; Playwright'ın Chromium derlemesinde AAC çözücü yok — e2e testleri çözme adımını sınamaz (`onizleme-csp`, `sorun-bildir` notları), yalnız dosyanın sunulduğunu sınar.
- Kulakla örneklem (alt görev 9) ve birleştirme dinlemesi (alt görev 2) **kullanıcıda**: her ad alanından 2 klip (56 klip) ve "on yedi elma", "yedi artı beş kaç eder", "kırk iki lira" birleştirmeleri ayrı dinleme dosyasında verildi. Çocukla dinleme Adım 32.

## 10. Ücretsiz katman koruması (KG-109, 28 Ekim 2026)

Kullanıcı kuralı (28 Eki 2026): "yaptığımız çalışmaların API'de ücretsiz katmanın sınırlarını aşmamasına dikkat et." Chirp 3 HD ücretsiz katmanı **ayda 1.000.000 karakter**, aşımda 30 $ / 1M karakter (https://cloud.google.com/text-to-speech/pricing, 28 Eki 2026'da okundu).

- **Defter:** `scripts/ses/ucretsizKatman.ts`. Aylık karakter defteri depo DIŞINDA: `TTS_KULLANIM_DOSYASI`, yoksa deponun yanındaki `../work/tts-kullanim.json`, o da yoksa `~/.okulumsun/tts-kullanim.json`. Biçim `{ "2026-10": { "karakter", "istek", "guncelleme" } }`; ay anahtarı **Pacific** saatine göre (Google Cloud faturalama ayı). Defter yoksa gerçek istek atılmaz (kullanım bilinmiyor); bozuk defter sessizce sıfırlanmaz.
- **Sınır:** güvenli sınır varsayılan **900.000** (%10 pay). `TTS_GUVENLI_SINIR` yalnız aşağı çekilir; daha yüksek değer (1.000.000 dahil) hata verir.
- **Denetim:** çalışma başında üretilecek kliplerin toplam karakteri kalan bütçeyi aşarsa hiç başlanmaz; ayrıca her istekten (429/5xx yeniden denemeleri dahil) önce `kullanılan + istek > sınır` ise istek gönderilmez ve betik açık hatayla durur. `googleSentezle` korumasız çağrılamaz.
- **Sayım:** Google kuralı — girdi metnindeki tüm karakterler, boşluk dahil (UTF-16 birimi; kod noktası sayısına eşit ya da büyük, temkinli). Gönderilen her deneme sonucu ne olursa olsun karakteriyle deftere **atomik** yazılır (geçici dosya + rename).
- **Artımlı üretim:** yalnız özeti değişen veya dosyası eksik klipler (`scripts/ses/uretimPlani.ts`); tam yeniden üretim yalnız açık `--zorla` (eşanlamlı `--force`) ile.
- **Kuru çalışma:** `npm run audio -- --kuru` (veya `--dry-run`): hiç istek atmadan, hiçbir dosya yazmadan üretilecek klip sayısı, karakter toplamı ve defter durumunu yazdırır. `--ornek` için de geçerli.
- **Başlangıç değeri:** 2026-10 için 5.000 karakter (temkinli tahmin: KG-04 örnekleri ≈1.000 + Adım 31 üretimi 3.365 + test istekleri).

## 11. Ertelenen klipler (Adım 31 aşama 2, KG-110, 28 Ekim 2026)

27 klip aynı kaynakla (`google:tr-TR-Chirp3-HD-Puck@2026-10`, hız 0,9) artımlı üretildi: 27 istek · 674 karakter (defter 2026-10: 5.674 / 900.000; `--zorla` kullanılmadı). Anahtarlar: `ui.bir-sorun-oldu`, `ui.hazirlaniyor`, `ui.set-basliyor`, `ui.set-bitti`, `ui.cikis-onayi`, `bahce.bugun`, `sinifturu.{basliyor, sira-mor|turuncu|yesil|mavi|pembe|sari, hep-birlikte, son-tur, kavanoz-doldu, birlikte-calistik}`, `ev.{okuldaki-konu, bitti, yetiskine-ver}`, `kesif.{hosgeldin, dengede, ayir}`, `tematuru.{basliyor, bitti}`, `isinma.{basliyor, bitti}`. Toplam 314 klip.

- Giriş cümleleri ayrı ekran değildir: `src/audio/girisSesi.ts` onları ilk sorunun talimatının önüne ekler (`ilkAraMs` 450 ms); "Tekrar dinle" girişi yinelemez (`Prompt.tekrarSes`).
- Sıra duyurusu tam cümle klip ("Sıra mor takımda."); renk klibinden birleştirilmez (PLAN §4.3). Bahçem'de yalnız sayı + "çiçek ekledin." birleştirilir.

## 12. Derin tema girişi klipleri (Adım 45 aşama 1, KG-111, 28 Ekim 2026)

28 klip `giris.t1-1` … `giris.t7-4` (`public/audio/giris/`) aynı kaynakla artımlı üretildi: 28 istek · 1.231 karakter (defter 2026-10: 6.905 / 900.000). Yönerge sesi Puck; maskota özgü ses değil (maskot sesi kararı K-12 ayrı, Adım 54). Toplam 342 klip; giriş anlatımı tema başına ≈ 13–19 sn (28 klip toplam 113 sn).
