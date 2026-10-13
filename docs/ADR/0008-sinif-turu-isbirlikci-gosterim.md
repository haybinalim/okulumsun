# ADR-0008: Sınıf Turu: iş birlikçi gösterim

- **Durum:** Kabul (2026-10-13, kullanıcı onayı)
- **Tarih:** 2026-10-13
- **Karar sahibi:** Geliştirici + kullanıcı · **Kullanıcı onayı:** Verildi (2026-10-13)
- **İlgili:** Adım 36, PLAN §7

## Bağlam

Tahtada grup oyunu istendi. Takım skorları ve sıralama, PLAN §7.1'in "cezalandırıcı değil" ilkesine ve 1. sınıf sınıf iklimine ters düşebilir.

## Seçenekler

1. **Ortak kavanoz**: her doğru cevap sınıfın ortak kavanozuna bir nesne ekler; sayısal skor ve kazanan yok. Emsal: Matific Play'in sınıf "tamamlama panosu" (rekabet yerine ortak ilerleme).
2. **Takım skoru ve sıralama** — motive edici olabilir; kaybeden takım, utanç riski.
3. **Grup oyunu yok**.

## Karar

Kabul edildi: **1 — ortak kavanoz** (plan v2 Adım 36, KG-45–47 ile uygulandı; kullanıcı 2026-10-13'te onayladı, KG-49). İkinci yanlışta doğru cevap ekranda otomatik gösterilmez; sınıf "Hep birlikte sayalım." ile birlikte çözer; puan, skor ve kazanan yoktur.

- Tamamlanan her tur (ilk denemede doğru, yanlıştan sonra doğru ya da birlikte çözülmüş) kavanoza bir
  yaprak, sıradaki takıma bir yıldız ekler. Doğru sayısı, hız ve süre ölçülmez/gösterilmez; kazanan,
  sıralama ve sayısal skor yoktur (PLAN §7.4). Yıldızlar simge olarak çizilir, sayı yazılmaz.
- Yanlışta aynı takım tekrar dener; ikinci yanlışta maskot "Hep birlikte sayalım." der, sınıf soruyu
  birlikte çözer ve tur tamamlanmış sayılır (öğretmen "Birlikte çözdük" ile de kapatabilir).
- Takım kimliği renk + hayvan ikonu + renk sesi; takım adı ve öğrenci adı girişi yoktur.
- Öğretmen her an "Bitir" (ikinci dokunuşta onay). Durum yalnız bellekte; ekrandan çıkınca silinir.
- Emsal: Matific Play'in rekabetsiz sınıf "tamamlama panosu".

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `src/sinif/{sinifTuru,takim}.ts`, `SinifTuruKurulum/Ekrani/Sonu.tsx`,
  `SinifKavanozu.tsx`, `appStore` (`sinifTuru`), PLAN §7.4 notu, §11 [4d].
- Test / kanıt: `sinifTuru.spec.ts`, `sinifTuruAkis.spec.ts`; e2e `board-sinif-turu.spec.ts` (3 takım × 3 tur,
  her ekranda tahta geometrisi, ekranda `\d+ puan|skor` yok, depolama boş).

## Gizlilik etkisi

Tahta modudur: takım adı ve tur bilgisi hiçbir yere yazılmaz (Sıfır Veri Sözleşmesi madde 1).

## Lisans ve üçüncü taraf etkisi

Yok.

## Geri dönüş maliyeti

Düşük.

## Kabul koşulları

- [x] Seçenek seçildi (1, önerildi; kullanıcı onayı bekliyor).
- [ ] Tahta denemesinde (Adım 41) tur süreleri ölçüldü.
