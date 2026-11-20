# Ses içerik doğrulaması (STT) — `npm run audio:stt`

`audio:audit` klibin var olduğuna, boyutuna, süresine ve köken özetine bakar; klibin DOĞRU METNİ söyleyip söylemediğine
bakmaz (örnek: `m307s2` "Mine süt alır." hatası kulakla bulundu). `audio:stt` her klibi yerel whisper.cpp ile yazıya
çevirir ve beklenen metinle karşılaştırır. Ücretsiz, çevrimdışı; CI'da ÇALIŞMAZ (`npm test` whisper istemez).

## Kurulum (bir kez)

```
brew install whisper-cpp ffmpeg
mkdir -p ~/.cache/okulumsun-stt
curl -L -o ~/.cache/okulumsun-stt/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
```

Model (~470 MB) depoya girmez. Yerini değiştirmek: `OKULUMSUN_STT_DIZIN` (model + önbellek dizini) ya da
`OKULUMSUN_STT_MODEL` (tam model yolu). İkililer: `WHISPER_CLI`, `FFMPEG`. Araç ya da model yoksa betik açık hata
verir ve çıkış kodu 2 döner; "geçti" denmez.

## Kullanım

```
npm run audio:stt                              # tüm klipler (matematik + Türkçe)
npm run audio:stt -- --yalniz 'tur.hece.*'     # süzgeç (alt dize ya da * jokeri; birden çok kez verilebilir)
npm run audio:stt -- --esik 0.9 --model base   # eşik / model
```

Seçenekler: `--yalniz`, `--esik <0..1>` (varsayılan 0.85), `--model <ad>` (varsayılan `small`), `--ipucu <metin>` /
`--ipucu-yok`, `--kisa-hepsi-kulak`, `--onbellek-yok`, `--rapor <yol>`, `--es-zamanli <n>` (varsayılan 3).

Beklenen metin üretimle aynı kaynaktan gelir: `klipleriTopla` (`src/content/tr.json`, yer tutucular doldurulmuş) ve
Türkçe klipler için `turKlipleriniAyir` (yalnız manifestte `durum: var` ve `reddedilen.json`'da olmayanlar).
Telaffuz/SSML girdisi KULLANILMAZ: klibin `text`i beklenendir.

## Karar kuralı

1. Normalleştirme: tr-TR küçük harf; noktalama atılır; kesme işareti silinir; rakam yazıya çevrilir
   (`turkishNumber`, 0-100 ve 200; ötesi yerel). ç ğ ı ö ş ü ayrı harf sayılır.
2. Whisper rakamı farklı yazabildiği için duyulan metnin adayları denenir ve en iyisi alınır: olduğu gibi,
   "1 6" → "16", "4." → "dördüncü" (sıra sayısı).
3. Benzerlik = 1 - Levenshtein / uzun olanın uzunluğu (boşluksuz harf dizisi üzerinde).
4. Durum:
   - `kulak`: beklenen metinde en çok 4 harf (tek harf/hece/çok kısa sözcük) VE STT tam eşleşmedi. Kısa klipte STT
     uydurma çıktı verir ("mor" → "Ne?"); bu BAŞARISIZ sayılmaz, insan dinler. Kısa klipte harfi harfine eşleşme
     `gecti` sayılır (`--kisa-hepsi-kulak` bunu kapatır).
   - `gecti`: benzerlik >= eşik.
   - `supheli`: benzerlik < eşik ya da boş transkript. Çıkış kodu 1. Şüpheli = "kulakla bak"; STT hatası da olabilir.
5. Çıkış: 0 şüpheli ve eksik dosya yok · 1 şüpheli ya da eksik dosya var · 2 araç/model/çalışma hatası.

## Çıktı ve önbellek

- Rapor: `test-results/ses-icerik-raporu.json` (git'e girmez): `anahtar, beklenen, duyulan, benzerlik, durum, neden, onbellek`.
- Önbellek: `<OKULUMSUN_STT_DIZIN>/onbellek-<model>.json`. Anahtar = klip anahtarı + ses dosyasının sha256'sı + model
  + ipucu. Üretim hattı klibi yeniden üretince (bayt değişir) o klip otomatik yeniden çözülür. Yalnız DUYULAN metin
  saklanır; eşik/beklenen değişince karar yeniden verilir. Boş sonuç önbelleğe girmez.

## Model seçimi ve ölçüm (828 klip, Apple Silicon, 3 eşzamanlı)

| model | süre | geçti | şüpheli | kulak |
|---|---|---|---|---|
| base + ipucu | 197 sn | 523 | 81 | 224 |
| small + ipucu | 515 sn | 567 | 37 | 224 |

(kulak, "kısa-tam-eşleşme geçer" kuralından ÖNCEKİ sayıdır; kural sonrası small: geçti 723, şüpheli 37, kulak 68.)
`small` seçildi: şüpheli sayısı yarıdan az, yani daha az yanlış alarm. İpucu (`--prompt "Türkçe kısa cümle."`)
small'un şüphelilerinden 18/101'ini düzeltti; seyrek olarak ipucunu geri yazar (`tur.cumle.c202`) ve bu şüpheli çıkar.

## Sınırlar

- STT hata yapar: şüpheli listesi "kulakla bak" listesidir, kesin hata listesi değil. Gerçek hata örneği
  (`soru.eksik-sayi` "-6 sayıyı bul.") ile STT hatası (`sekil.yuvarlak` "You are luck.") ayrımını kulak yapar.
- Tek harf farkı uzun cümlede eşiğin altına inmeyebilir (11 harflik "Mine/Mina" 0.91): hassasiyet için `--esik 0.95`.
- Whisper ünlü uzatma, fazladan ses, yanlış vurgu ya da kötü tonlamayı yakalamaz; yalnız ne söylendiğine bakar.
- Şüpheli klipleri bu araç düzeltmez ya da yeniden üretmez; yalnız listeler.
