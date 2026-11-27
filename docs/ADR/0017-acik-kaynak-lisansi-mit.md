# ADR-0017: Açık kaynak lisansı (MIT)

- **Durum:** Kabul
- **Tarih:** 2026-11-27
- **Karar sahibi:** Kullanıcı · **Kullanıcı onayı:** 27 Kas 2026, sohbette ("okulumsun u açık kaynak lisansa çevir ve öyle başvur o zaman" — Qoder Developer Pass başvurusu için)
- **İlgili:** Adım 20, ADR-0013, ADR-0014

## Bağlam

Okulumsun kodu 12 Eki 2026'da ADR-0013 ile "tüm hakları saklı" yapılmıştı (ticari niyet, KG-06). Qoder Developer Pass başvurusu (1 ay Ultra, 20.000 kredi) açık kaynak katkısı şartı arıyor; tescilli lisans başvuruyu engelliyordu. GitHub hesabı 3,5 yıllık ve repo son 90 günde aktif (441 commit), tek engel lisanstı.

## Seçenekler

1. **MIT (kod) + CONTENT-LICENSE (içerik)** — en serbest açık kaynak lisansı; GitHub'ın tanıdığı, Qoder'ın kabul ettiği biçim. Ticari rakipler kodu kopyalayabilir.
2. **AGPL-3.0 (kod)** — açık kaynak ama copyleft; kapalı ürünler kodu alamaz, Qoder başvurusu için de geçerli olurdu; MIT kadar yaygın değil.
3. **Tescilli kalmak** — Qoder başvurusu yapılamaz; 12 Eki kararı korunur.

## Karar

**Seçenek 1, MIT** (kullanıcı kararı, 27 Kas 2026). Kod `LICENSE` MIT olur; `package.json` `"license": "MIT"`; ders içeriği (`src/content/`, `ders-verisi/`) `CONTENT-LICENSE` altında tescilli kalır (banknot görselleri TCMB'ye, ses klipleri kaynağına, fontlar kendi lisanslarına tabidir — bunlar MIT kapsamına girmez).

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `LICENSE`, `package.json`, `package-lock.json`, README, LICENSES.md, ADR-0013 (Yerine geçti: 0017), ADR dizini, Kaynaklar ekranı, `okul-paketi.ts`, `lisans-denetimi.ts`, `lisans-envanteri.md`, `basvuru/README.md`, `okul-agi.md`, `is-modeli.md`, `yayin.md`, `belgeTutarliligi.spec.ts`, PLAN §14 + PROGRESS durum blokları (`durum:adr=17`), PLAN Adım 20 satırı.
- Test / kanıt: lisans envanteri (K10), belge tutarlılığı testi, durum kapısı (K8); CI yeşil olmalı.

## Gizlilik etkisi

Yok. Sıfır Veri Sözleşmesi değişmez; açık lisans, gizlilik iddiasının üçüncü taraflarca bağımsız denetimini kolaylaştırır.

## Lisans ve üçüncü taraf etkisi

MIT, bağımlılıkların izin verici lisanslarıyla uyumludur (K10 envanteri değişmez). İçerik ve üçüncü taraf varlıklar MIT kapsamı dışındadır; `CONTENT-LICENSE` ve `LICENSES.md` aynen kalır. Kurum/okul dağıtımı artık yazılı izin istemez; hizmet (kurulum, eğitim, destek) satışı sürer (ADR-0014'ün hizmet modeli etkilenmez).

## Geri dönüş maliyeti

Yüksek: verilen MIT lisansı geri alınamaz — MIT ile dağıtılmış kopyalar MIT kalır. Tescilli lisansa dönmek yalnızca gelecekteki dağıtımları etkiler, geçmiş kopyaları değil. ADR-0013'te bu uyarı vardı (12 Eki 2026); kullanıcı bilerek karar verdi.

## Kabul koşulları

- [x] Kullanıcı MIT lisansını seçti (27 Kas 2026, sohbet).
- [x] `LICENSE` MIT metniyle değiştirildi; `package.json` `MIT` oldu.
- [x] ADR-0013 `Yerine geçti: 0017` oldu; dizin ve durum blokları güncellendi.
