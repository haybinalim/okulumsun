# Ses kaynakları ve köken envanteri

> Adım 15 (F0.2) · 12 Ekim 2026 · Karar kaynakları: KG-01, KG-08, KG-15 (plan v2 §2.7). Kesin karar ADR-0004'te (Adım 18) verilecek.

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
- Google kaynağına geçiş (Adım 31): `sesKaynagi.json` → `{ "saglayici": "google", "modelKimligi": "google:tr-TR-Chirp3-HD-<ses>@<tarih>", "ticariDagitimIzni": true, ... }`, `npm run audio -- --force`, CI'dan `SES_GECIS_MODU` kaldırılır.
