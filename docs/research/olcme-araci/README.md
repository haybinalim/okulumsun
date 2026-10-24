# Etki çalışması — ölçme aracı (Form A / Form B)

> **TASLAK — içerik geçerliği onayı (2 sınıf öğretmeni + 1 alan uzmanı) ve çalışma dışı 3–5 çocukla ön deneme bekliyor.**
> Bu belge `npx tsx scripts/etki-formu-uret.ts` ile koddan üretilir; elle düzenlenmez (`tests/unit/etkiFormu.spec.ts`
> bayatlığı denetler). Plan v2 Adım 53b, KG-93. Hiçbir okula, MEM'e ya da veliye gönderilmedi.

## Formlar

| Form | Ne zaman | Kâğıt kodu | Tohum | Sayfa | Metin özeti |
|---|---|---|---|---|---|
| A | Ön test, 15–19 Mart 2027 | `ETKI-1-A` | 53101 | 5 | `4w8tun` |
| B | Son test, 12–16 Nisan 2027 | `ETKI-1-B` | 53201 | 5 | `tjetsk` |

- **Yazdırma:** uygulamada `?arsiv=ETKI-1-A` / `?arsiv=ETKI-1-B` adresi formu çizer (tarayıcıdan yazdır, A4, 2×3 düzen) veya
  `npx tsx scripts/etki-formu-uret.ts --pdf` iki PDF'yi bu dizine basar. Kâğıtta ad satırı yerine **Ç-kodu** satırı vardır;
  cevap anahtarı forma basılmaz (aşağıda).
- **Bölümler:** 1. bölüm (1–12, MAT.1.2.2) ve 2. bölüm (13–20, MAT.1.2.3–1.2.4) ayrı sayfadan başlar; ön test iki oturuma
  bölünecekse bölüm sınırından bölünür (protokol §5).
- Öğrenci verisi yoktur: form koddan yeniden üretilir, uygulama puan tutmaz; puanlama kâğıt üzerinde yapılır.

## Eşdeğerlik (Form A / Form B)

Zorluk düzeyi maddedeki toplama gerçeğinden (x + y = z; çıkarma z − y = x) hesaplanır: **1** = 10 içinde (z ≤ 10),
**2** = 20 içinde, onluk geçmeden (z > 10, bir terim ≥ 10), **3** = onluk geçen (iki terim < 10, z > 10). İşlem kartlı
eşleme maddesinde kartların en zoru. Şablonun kendi zorluk alanı düğüme bağlı sabit olduğundan madde zorluğunu ayırmaz.

Her iki form aynı 20 yuvalık deseni sırayla doldurur: **her sıra numarasında düğüm, şablon ve zorluk düzeyi iki formda aynıdır.**

| Ölçüt | Form A | Form B |
|---|---|---|
| Madde | 20 | 20 |
| Zorluk 1 · 2 · 3 | 9 · 5 · 6 | 9 · 5 · 6 |
| MAT.1.2.2 · MAT.1.2.3 · MAT.1.2.4 (madde) | 12 · 6 · 4 | 12 · 6 · 4 |
| Ortak madde (işlem imzası) | — | 0 |
| Maddede görünen en büyük sayı, ortalama (betimsel) | 10,8 | 10,9 |

| Şablon | Form A | Form B | Zorluk düzeyine göre (A/B) |
|---|---|---|---|
| M-TOPLA-GORSEL | 3 | 3 | 1: 3/3 · 2: 0/0 · 3: 0/0 |
| M-TOPLA-ONA-TUMLE | 3 | 3 | 1: 3/3 · 2: 0/0 · 3: 0/0 |
| M-CIKAR-GORSEL | 3 | 3 | 1: 1/1 · 2: 1/1 · 3: 1/1 |
| M-TOPLA-SEMBOL | 3 | 3 | 1: 0/0 · 2: 1/1 · 3: 2/2 |
| M-ESIT-DENGE | 4 | 4 | 1: 2/2 · 2: 1/1 · 3: 1/1 |
| M-EKSIK-TOPLANAN | 2 | 2 | 1: 0/0 · 2: 1/1 · 3: 1/1 |
| M-TERS-ISLEM | 2 | 2 | 1: 0/0 · 2: 1/1 · 3: 1/1 |

Maddelerin bir kısmı ek olarak MAT.1.2.1'i de taşır (şablon beyanı); hiçbir madde müdahale haftalarının çıktıları dışında
kalmaz. "Zihinden bul" (MAT.1.2.2, M-TAHMIN-ISLEM) kâğıtta tahmin ile hesaplamayı ayıramadığı için forma girmez.
**Sınır:** eşdeğerlik yapısaldır (şablon + zorluk + sıra); ampirik eşdeğerlik (madde güçlüğü, KR-20) ön deneme ve
saha verisiyle raporlanır (ön kayıt §6).

## Form A — madde listesi (ön test)

| No | Bölüm | Etkinlik | Şablon | Zorluk | Öğretmenin okuyacağı yönerge | İşlem imzası | Yanıt | Cevap |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Üstüne say | M-TOPLA-GORSEL | 1 | 6 + 2 kaç eder? | 2+6 | daire içine al | 8 |
| 2 | 1 | Ona tamamla | M-TOPLA-ONA-TUMLE | 1 | 10'a tamamlamak için kaç gerekir? | 8+?=10 | kutuya yaz | B |
| 3 | 1 | Geriye sayarak çıkar | M-CIKAR-GORSEL | 1 | 9 − 7 kaç eder? | 9-7 | daire içine al | 2 |
| 4 | 1 | Onu geçen toplama | M-TOPLA-SEMBOL | 2 | 13 + 3 kaç eder? | 3+13 | daire içine al | 16 |
| 5 | 1 | Üstüne say | M-TOPLA-GORSEL | 1 | 8 + 1 kaç eder? | 1+8 | daire içine al | 9 |
| 6 | 1 | Ona tamamla | M-TOPLA-ONA-TUMLE | 1 | 10'a tamamlamak için kaç gerekir? | 4+?=10 | kutuya yaz | C |
| 7 | 1 | Geriye sayarak çıkar | M-CIKAR-GORSEL | 2 | 16 − 1 kaç eder? | 16-1 | daire içine al | 15 |
| 8 | 1 | Onu geçen toplama | M-TOPLA-SEMBOL | 3 | 7 + 9 kaç eder? | 7+9 | daire içine al | 16 |
| 9 | 1 | Üstüne say | M-TOPLA-GORSEL | 1 | 6 + 3 kaç eder? | 3+6 | daire içine al | 9 |
| 10 | 1 | Ona tamamla | M-TOPLA-ONA-TUMLE | 1 | 10'a tamamlamak için kaç gerekir? | 5+?=10 | kutuya yaz | A |
| 11 | 1 | Geriye sayarak çıkar | M-CIKAR-GORSEL | 3 | 12 − 5 kaç eder? | 12-5 | daire içine al | 7 |
| 12 | 1 | Onu geçen toplama | M-TOPLA-SEMBOL | 3 | 5 + 8 kaç eder? | 5+8 | daire içine al | 13 |
| 13 | 2 | İki taraf eşit | M-ESIT-DENGE | 1 | Eksik sayıyı bul. | 3+?=10 | kutuya yaz | A |
| 14 | 2 | Kaç tane eksik? | M-EKSIK-TOPLANAN | 2 | Eksik sayıyı bul. | 14+?=16 | kutuya yaz | C |
| 15 | 2 | Eşitliği değiştir | M-ESIT-DENGE | 1 | Eksik sayıyı bul. | 2+?=10 | kutuya yaz | C |
| 16 | 2 | Tersini yap | M-TERS-ISLEM | 2 | Ters işlemi bul. | 12+1=13 · 4+1=5 · 1+4=5 · 5-1=4 · 5-4=1 · 13-1=12 | çizgiyle eşle | 2–A, 1–C, 3–B |
| 17 | 2 | İki taraf eşit | M-ESIT-DENGE | 2 | Eksik sayıyı bul. | 2+?=12 | kutuya yaz | C |
| 18 | 2 | Kaç tane eksik? | M-EKSIK-TOPLANAN | 3 | Eksik sayıyı bul. | 7+?=15 | kutuya yaz | B |
| 19 | 2 | Eşitliği değiştir | M-ESIT-DENGE | 3 | Eksik sayıyı bul. | 2+?=11 | kutuya yaz | C |
| 20 | 2 | Tersini yap | M-TERS-ISLEM | 3 | Ters işlemi bul. | 8-3=5 · 3-1=2 · 13-4=9 · 9+4=13 · 2+1=3 · 5+3=8 | çizgiyle eşle | 3–A, 1–C, 2–B |

## Form B — madde listesi (son test)

| No | Bölüm | Etkinlik | Şablon | Zorluk | Öğretmenin okuyacağı yönerge | İşlem imzası | Yanıt | Cevap |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Üstüne say | M-TOPLA-GORSEL | 1 | 8 + 2 kaç eder? | 2+8 | daire içine al | 10 |
| 2 | 1 | Ona tamamla | M-TOPLA-ONA-TUMLE | 1 | 10'a tamamlamak için kaç gerekir? | 7+?=10 | kutuya yaz | A |
| 3 | 1 | Geriye sayarak çıkar | M-CIKAR-GORSEL | 1 | 10 − 6 kaç eder? | 10-6 | daire içine al | 4 |
| 4 | 1 | Onu geçen toplama | M-TOPLA-SEMBOL | 2 | 12 + 3 kaç eder? | 3+12 | daire içine al | 15 |
| 5 | 1 | Üstüne say | M-TOPLA-GORSEL | 1 | 5 + 1 kaç eder? | 1+5 | daire içine al | 6 |
| 6 | 1 | Ona tamamla | M-TOPLA-ONA-TUMLE | 1 | 10'a tamamlamak için kaç gerekir? | 6+?=10 | kutuya yaz | C |
| 7 | 1 | Geriye sayarak çıkar | M-CIKAR-GORSEL | 2 | 15 − 5 kaç eder? | 15-5 | daire içine al | 10 |
| 8 | 1 | Onu geçen toplama | M-TOPLA-SEMBOL | 3 | 7 + 4 kaç eder? | 4+7 | daire içine al | 11 |
| 9 | 1 | Üstüne say | M-TOPLA-GORSEL | 1 | 7 + 1 kaç eder? | 1+7 | daire içine al | 8 |
| 10 | 1 | Ona tamamla | M-TOPLA-ONA-TUMLE | 1 | 10'a tamamlamak için kaç gerekir? | 9+?=10 | kutuya yaz | A |
| 11 | 1 | Geriye sayarak çıkar | M-CIKAR-GORSEL | 3 | 13 − 7 kaç eder? | 13-7 | daire içine al | 6 |
| 12 | 1 | Onu geçen toplama | M-TOPLA-SEMBOL | 3 | 8 + 9 kaç eder? | 8+9 | daire içine al | 17 |
| 13 | 2 | İki taraf eşit | M-ESIT-DENGE | 1 | Eksik sayıyı bul. | 3+?=4 | kutuya yaz | C |
| 14 | 2 | Kaç tane eksik? | M-EKSIK-TOPLANAN | 2 | Eksik sayıyı bul. | 1+?=18 | kutuya yaz | A |
| 15 | 2 | Eşitliği değiştir | M-ESIT-DENGE | 1 | Eksik sayıyı bul. | 1+?=6 | kutuya yaz | A |
| 16 | 2 | Tersini yap | M-TERS-ISLEM | 2 | Ters işlemi bul. | 1+14=15 · 2+5=7 · 2+14=16 · 16-14=2 · 7-5=2 · 15-14=1 | çizgiyle eşle | 2–B, 3–A, 1–C |
| 17 | 2 | İki taraf eşit | M-ESIT-DENGE | 2 | Eksik sayıyı bul. | 10+?=12 | kutuya yaz | B |
| 18 | 2 | Kaç tane eksik? | M-EKSIK-TOPLANAN | 3 | Eksik sayıyı bul. | 5+?=14 | kutuya yaz | C |
| 19 | 2 | Eşitliği değiştir | M-ESIT-DENGE | 3 | Eksik sayıyı bul. | 9+?=13 | kutuya yaz | A |
| 20 | 2 | Tersini yap | M-TERS-ISLEM | 3 | Ters işlemi bul. | 8-2=6 · 17-9=8 · 19-10=9 · 8+9=17 · 9+10=19 · 6+2=8 | çizgiyle eşle | 1–C, 2–A, 3–B |

Harfli cevaplar kâğıttaki seçenek harfidir; eşlemede "1–B" = soldaki 1. kart sağdaki B kartıyla.

## Puanlama yönergesi

1. Puan = doğru madde sayısı (0–20). Her madde 1 puan; kısmi puan yok.
2. **Eşleme maddesi** (tersini yap) yalnız üç eşin üçü de doğruysa 1 puan.
3. Boş, birden çok seçenek işaretlenmiş veya okunamayan yanıt 0.
4. Kutuya yazılan sayı ters yazılmışsa (ör. "Ɛ") ama hangi rakam olduğu açıksa doğru sayılır; açık değilse iki puanlayıcı
   ayrı karar verir ve ayrılık üçüncü bakışla çözülür.
5. Test 10 maddeden azı yanıtlanmış hâlde bırakıldıysa o test **eksik** sayılır (ön kayıt §7 kural 3).
6. Puanlama iki kişiyle bağımsız; madde düzeyinde uyuşma oranı raporlanır. Puanlar yalnız Ç-kodlu tabloya yazılır (protokol §8).
7. Uygulama sırasında yardım edilmez; öğretmen her yönergeyi bir kez okur, en çok bir kez yineler; süre sınırı yoktur.

## İçerik geçerliği ve ön deneme (kullanıcıda)

| Kim | Ne | Tarih | Sonuç |
|---|---|---|---|
| Sınıf öğretmeni 1 | Madde–çıktı uyumu, dil, görsel | — | — |
| Sınıf öğretmeni 2 | Aynı | — | — |
| Alan uzmanı | Aynı + zorluk düzeyi tanımı | — | — |
| Ön deneme (çalışma dışı 3–5 çocuk, Ç-kodsuz, yalnız toplu not) | Anlaşılırlık, süre, taban/tavan etkisi | — | — |

Değişiklik gerekirse `ETKI_DESENI` veya tohumlar değişir, belge yeniden üretilir ve ön kayıt damgasından **önce** kesinleşir.
