# ADR-0002: Öğrenci verisi saklama

- **Durum:** Önerildi
- **Tarih:** 2026-10-12
- **Karar sahibi:** Kullanıcı + hukuki görüş · **Kullanıcı onayı:** Bekliyor (hukuki görüş: §16 K-9)
- **İlgili:** PLAN §10, Adım 39, 52, `src/persistence/veriSaklamaPolitikasi.ts`, KG-11

## Bağlam

Bugünkü politika (Seçenek A): geliştirme sürümünde öğrenci veya veli verisi saklanmaz; Dexie kalıcılık katmanı kodda var ama `OGRENCI_VERISI_SAKLANIR_MI = false` ile kapalı. Kişisel modda ilerleme, zorlanılan konular ve yedekleme özellikleri bu yüzden kapalı (PLAN §14 Adım 8 ve 9 kısmi). Uygulama 6–7 yaş çocuklara yönelik; KVKK ve veli onayı ağır basar.

## Seçenekler

1. **A — Sıfır veri her modda** (bugünkü durum): risk yok, ama kişisel modda kaldığı yerden devam ve veli ilerleme görünümü yok.
2. **B — Tahta sıfır veri; kişisel modda yalnız cihazda, anonim, veli onaylı kayıt**: veli değeri artar; hukuki görüş ve onay akışı gerekir.
3. **C — Sunucuda hesap ve senkron**: çok cihaz; KVKK yükü, veri sorumlusu kaydı ve güvenlik işi çok büyük. Kapsam dışı.

## Karar

Önerilen: **tahta = A (değişmez)**; **kişisel = B yalnız kabul koşulları sağlandığında**. Bu ADR `Önerildi` durumundayken hiçbir kod davranışı değişmez; kişisel mod da sıfır veridir.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: kabulde `veriSaklamaPolitikasi.ts`, `depolamaIzinListesi.ts`, veli onay ekranı, PLAN §10.
- Test / kanıt: depolama casusu birim testleri ve `onizleme-gizlilik-ag` e2e (Adım 26); tahta modunda sıfır yazım testi.

## Gizlilik etkisi

Projenin gizlilik anayasasıdır. Sıfır Veri Sözleşmesi madde 1 (tahta her koşulda sıfır veri) bu ADR kabul edilse de değişmez. Madde 2 yalnız bu ADR `Kabul` + hukuki görüş + Adım 52 ile gevşer. Her yeni yerel anahtar izin listesine ADR ile eklenir.

## Lisans ve üçüncü taraf etkisi

Yeni bağımlılık yok (Dexie zaten var). Hukuki görüş dış hizmettir.

## Geri dönüş maliyeti

Orta: kabul sonrası saklanan verinin silinmesi için göç ve veli bildirimi gerekir.

## Kabul koşulları

- [ ] Avukattan KVKK görüşü (yazılı).
- [ ] Veli onay akışı maketi pilotta denendi (gözlem formu V1–V3).
- [ ] Tahta modunda sıfır yazım e2e ile kanıtlı.
- [ ] Kullanıcı onayı.

## Ek 1 — Okuma Yazma sınıf düzeyi ayarı (K-7, 2026-11-01)

- **Durum:** Kabul (Okuma Yazma Ana Plan v1 K-7; kullanıcı onayı 2026-10-30 "onaylıyorum başla"). Bu ek Seçenek A'yı
  gevşetmez: öğrenci verisi her modda sıfır kalır.
- **Ne:** Tek `localStorage` anahtarı `okulumsun.tur.sinif` (`DERS_TUR_SINIF_ANAHTARI`). Değer küçük, katı biçimli bir
  JSON'dur: `{"v":1,"kume":"<öğretilen harf kümesi kodu>","akis":"<günün akışı sırası>"}`. Küme kodu, eve link ve öğretmen
  bağlantısındaki `?tur=` koduyla aynıdır (base36 bit maskesi; ADR-0010 gibi). Ad, cevap, ilerleme, süre, "kaldığı harf"
  veya cihaz kimliği yoktur; bozuk ya da fazladan alanlı değer yok sayılır.
- **Neden:** Öğretmen iş yükü (plan Z19, R10): her derste "bugünkü ses"i ve akış sırasını yeniden seçmek zahmetli. Değer
  sınıfın öğretim durumudur; bir çocuğa bağlanamaz (aynı tahtayı kullanan bütün sınıf için aynıdır).
- **Sınırlar:**
  - Yalnız `VITE_DERS_TUR=1` derlemesinde vardır. Üretim derlemesinde yazan kod yoktur; bu yüzden üretim izin listesine
    (`IZINLI_ANAHTARLAR`, `/gizlilik` sayfası) girmez, ayrı `BAYRAKLI_IZINLI_ANAHTARLAR` listesindedir. Okuma Yazma genel
    yayına çıkarken `/gizlilik` sayfasına eklenir.
  - Yalnız öğretmen bir ayarı değiştirince yazılır; açılışta okunur. Adresteki `?tur=` önce gelir.
  - Eve link (`?ev=`) ile açılan cihazda (veli/çocuk) ne okunur ne yazılır.
  - `npm run gizlilik:tara` anahtarın yalnız `src/ui/tur/sinifAyariDepo.ts` içinde yazılmasına izin verir; e2e
    (`tur-ogretmen.spec.ts`) tarayıcıda yalnız izinli anahtarların kaldığını ve değerin yalnız `v` + `kume` (+ `akis`)
    taşıdığını denetler.
- **Geri dönüş:** Anahtar silinince varsayılana (1. grup) dönülür; göç gerekmez.
