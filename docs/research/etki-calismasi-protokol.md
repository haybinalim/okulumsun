# Etki çalışması — protokol (plan v2 Adım 53a)

> **TASLAK — pilot bulguları (Adım 32) ve kullanıcı onayı bekliyor.**
> Hiçbir okula, MEM'e ya da veliye gönderilmedi (⛔ O6). Hipotez, ölçütler ve analiz planı
> [ön kayıt taslağındadır](etki-calismasi-on-kayit.md); bu belge sahada **nasıl** yürüneceğini yazar.
> §9 imha tarihleri kullanıcı onaylı (KG-92); Ek A ölçme aracı Adım 53b üreticisiyle (KG-93), içerik geçerliği onayı bekliyor.

## 1. Desen

**Yarı deneysel, ön test / son test.** Aynı okulda bir **karşılaştırma sınıfı** aranır (aynı sınıf düzeyi, olağan öğretim,
aynı haftalarda aynı testler). Bulunamazsa desen **tek gruplu** olur ve bu sınır raporda açıkça yazılır (tek gruplu desende
olgunlaşma ve test etkisi uygulamanın etkisinden ayrılamaz).

Rastgele atama yapılmaz (sınıflar hazır gruplardır). Aynı öğretmen fiziksel tahta denemesinde de (Adım 33/41) yer aldıysa bu
durum raporda yazılır; deneme oturumları ön testten en az bir hafta önce biter.

## 2. Örneklem

- 1 uygulama sınıfı (1. sınıf; uygun olursa 2 sınıf), varsa 1 karşılaştırma sınıfı.
- Sınıftaki her çocuk uygulamaya katılabilir; **ölçüme** yalnız veli onamı olan ve sözlü onay veren çocuk girer.
- Tanı, etiket, not, başarı düzeyi istenmez; okul ve öğretmen raporda adla anılmaz (kullanıcı ve okul aksini yazılı istemedikçe).
- Fiziksel transfer görevi için alt örneklem: her sınıftan onamlı çocuklar arasından Ç-kodu sırasıyla her üçüncü çocuk
  (en çok 8); seçim kuralı sonuçtan bağımsızdır.

## 3. Takvim

| Dilim | Tarih |
|---|---|
| MEM araştırma izni başvurusu | 11–14 Aralık 2026 (53a); onay en geç **12 Mart 2027** |
| Ölçme aracı + `v0.3.1-etki` dondurma | 1–2 Şubat 2027 (53b) |
| **Ön test** (Form A) | **15–19 Mart 2027** — her sınıfta müdahalenin ilk oturumundan **önce** |
| **Müdahale** | **15 Mart – 9 Nisan 2027** (öğretim haftaları 23–26) |
| **Son test** (Form B) | **12–16 Nisan 2027** |
| Hariç | 8–12 Mart 2027 ara tatili; 23 Nisan 2027 |
| Puanlama, analiz, rapor | 29 Nisan – 5 Mayıs 2027 (53c) |

İzin 12 Mart 2027'ye kadar gelmezse saha 2027 güz dönemine kayar (R2); bu belge yeni tarihlerle yeniden damgalanır.

## 4. Müdahale

- **Doz:** haftada 3 × 15 dakika, tahtada.
- **İçerik:** öğretmenin o haftaki planına göre **bugünün seti** (Adım 34) veya **Sınıf Turu** (Adım 36); haftalık plan
  görünümü (Adım 37) öneriyi verir, öğretmen seçer.
- **İsteğe bağlı:** aynı haftanın çalışma kâğıdı (Adım 35), sınıfta.
- **Müdahaleye girmeyenler:** eve link ve evde 10 dakika `v0.3.1-etki`'de bulunmadığı için müdahalenin parçası değildir.
  Kişisel mod isteğe bağlıdır ve kayıt dışıdır.
- **Sürüm:** `v0.3.1-etki` dondurulmuş sürüm, ayrı ve saha boyunca değişmeyen önizleme adresinden. Kritik düzeltme yalnız
  `v0.3.x-etki` olarak ve öğretmene bildirilerek. Yeni ses klibi yok.
- **Karşılaştırma sınıfı:** olağan öğretim; uygulama kullanılmaz; aynı testler aynı haftalarda.

## 5. Ölçme

| Ölçüm | Ne zaman | Kim uygular | Süre |
|---|---|---|---|
| 20 maddelik kâğıt test, Form A | Ön test haftası | Sınıf öğretmeni, yönergeyi sesli okuyarak | ≈ 25 dk (iki oturuma bölünebilir) |
| 20 maddelik kâğıt test, Form B | Son test haftası | Aynı | Aynı |
| Fiziksel transfer görevi (3 madde) | Ön ve son test haftası, alt örneklem | Araştırmacı, birebir, masada nesnelerle | ≈ 5 dk |
| Gülen yüz tutum ölçeği (3 madde) | Ön ve son test haftası | Sınıf öğretmeni | ≈ 3 dk |
| Öğretmen yükü/fayda anketi (5 madde) | Son test haftası | Öğretmen kendisi | ≈ 5 dk |

Test sırasında çocuğa yardım edilmez, yönerge en çok bir kez yinelenir; süre sınırı yoktur. Test bir not ya da sınav gibi
sunulmaz ("Bugün birlikte birkaç bilmece çözeceğiz").

## 6. Sadakat

- **Öğretmenin kâğıt günlüğü** (haftalık tek sayfa): tarih, oturum yapıldı mı, süre, set mi Sınıf Turu mu, aksayan bir şey.
- **Uygulama içinde kayıt yok** — uygulama hiçbir şey kaydetmez ve göndermez; sadakat yalnız kâğıttan hesaplanır.
- Hedef: planlanan 12 oturumun ≥ %70'i (≥ 9 oturum). Altında kalırsa sapma raporlanır.
- Araştırmacı her hafta bir kez kısa görüşme (çocuk verisi değil, uygulama sorunu) yapar; not kâğıda, adsız.

## 7. Etik

- **Veli onamı** (yazılı, kâğıt): [taslak form](formlar/etki-veli-onami.md). İmzalı formlar okulda kalır, depoya girmez.
- **Çocuğun sözlü onayı** her ölçümden önce: "Sana birkaç bilmece göstereceğim. İstemezsen yapmayabilirsin, istediğin an
  bırakabilirsin. Başlayalım mı?" İstemeyen çocuk dışarıda kalır; bunun hiçbir sonucu yoktur.
- **Ad yok, Ç-kodu.** Test kâğıdına yalnız Ç-kodu yazılır (Ç01, Ç02… sınıf başına). Ad–kod listesi tek kâğıttır, okulda
  öğretmende durur; araştırmacıya ve depoya girmez.
- **Fotoğraf, video, ses kaydı yok.**
- Uygulama veri toplamaz; araştırma verisi yalnız kâğıttır. Depoya yalnız toplulaştırılmış tablo girer.
- Öğretmen her an çalışmadan çekilebilir; veli onamı her an geri alınabilir (o çocuğun kâğıtları imha edilir).

## 8. Veri akışı

1. Kâğıt testler Ç-kodlu olarak okulda toplanır.
2. İki puanlayıcı kâğıtları okulda puanlar; puanlar Ç-kodlu tek bir tabloya (kâğıt veya çevrimdışı tablo dosyası) yazılır.
3. Analize yalnız Ç-kodu, sınıf (U/K), ön test puanı, son test puanı, madde puanları girer. Ad, doğum tarihi, cinsiyet ve
   okul numarası **toplanmaz**.
4. Ham Ç-kodlu tablo **depoya girmez**; depoya yalnız toplulaştırılmış tablo (ortalama, SS, n, etki büyüklüğü, GA) ve analiz
   betiği girer.

## 9. Veri imha planı (kullanıcı onaylı (KG-92) — MEM izni farklı bir süre öngörürse o uygulanır)

| Ne | Nerede | Ne zaman imha |
|---|---|---|
| Ad–Ç-kodu listesi | Okulda, öğretmende (kâğıt) | Son test puanlaması bitince, en geç **16 Nisan 2027 + 14 gün = 30 Nisan 2027** |
| Test kâğıtları (Form A/B), transfer ve tutum formları | Okulda | Rapor yayımlanınca, en geç **4 Haziran 2027** (rapor + 30 gün) |
| Ç-kodlu puan tablosu | Araştırmacının çevrimdışı cihazında | Aynı tarih, en geç **4 Haziran 2027** |
| Öğretmen günlüğü ve anket | Okulda | Aynı tarih |
| İmzalı veli onamları | Okulda | MEM izninin öngördüğü saklama süresi sonunda |

İmha öğretmen ve araştırmacı birlikteyken yapılır (kâğıt öğütücü); imha tarihi rapora ve PROGRESS "Saha" bölümüne yazılır.

## 10. Raporlama

`docs/research/etki-raporu-2027.md`: tek sayfa özet + teknik ek (desen, örneklem, sadakat, birincil sonuç, ikincil sonuçlar,
sınırlar, sapmalar). Sonuç ne olursa olsun yayımlanır; düzeltme yalnız tarihli ekle yapılır.

## 11. Açık sorular (kullanıcıda)

1. Pilot okulu ve karşılaştırma sınıfı (Adım 32 sonrası).
2. OSF benzeri herkese açık kayıt yapılsın mı (⛔ O6)?
3. Araştırmacı/puanlayıcılar kimler (iki kişi), alan uzmanı kim?
4. Ön testin iki oturuma bölünmesi gerekiyor mu (pilot gözlemi)?

---

## Ek A — Form A ve Form B (ölçme aracı, Adım 53b)

> Formlar `scripts/etki-formu-uret.ts` ile koddan üretilir (KG-93; çekirdek `src/ogretmen/calismaKagidi/etkiFormu.ts`).
> Tam madde listesi, cevap anahtarı ve puanlama yönergesi: [ölçme aracı](olcme-araci/README.md). **İçerik geçerliği onayı
> (2 öğretmen + 1 alan uzmanı) ve çalışma dışı 3–5 çocukla ön deneme bekliyor;** değişiklik gerekirse desen/tohum değişir ve
> ön kayıt damgasından önce kesinleşir. KG-90'daki eski öneri (bugünkü üreticiden iki ayrı arşiv kâğıdı) bunun yerine geçti.

**Yazdırma:** uygulamada `?arsiv=ETKI-1-A` (ön test) ve `?arsiv=ETKI-1-B` (son test); A4, 2×3 düzen. Kâğıtta ad yerine
**Ç-kodu** satırı; cevap anahtarı forma basılmaz. Bölüm 2 yeni sayfadan başlar (ön test iki oturuma bölünecekse buradan).

**Üretim kuralı.** Çalışma kâğıdı altyapısı (Adım 35) aynen kullanılır; tek fark seçimdir. 20 yuvalık sabit bir desen her yuvaya
düğüm + şablon + **zorluk düzeyi** atar ve iki form bu deseni sırayla doldurur:

| Bölüm | Etkinlik (düğüm kodu) — çıktı | Madde | Zorluk düzeyleri (her iki formda) |
|---|---|---|---|
| 1 | Üstüne say (d3) — MAT.1.2.2 | 3 | 1 · 1 · 1 |
| 1 | Ona tamamla (d4) — MAT.1.2.2 | 3 | 1 · 1 · 1 |
| 1 | Geriye sayarak çıkar (d8) — MAT.1.2.2 | 3 | 1 · 2 · 3 |
| 1 | Onu geçen toplama (d5) — MAT.1.2.2 | 3 | 2 · 3 · 3 |
| 2 | İki taraf eşit (db) — MAT.1.2.3 | 2 | 1 · 2 |
| 2 | Eşitliği değiştir (dc) — MAT.1.2.3 | 2 | 1 · 3 |
| 2 | Kaç tane eksik? (dd) — MAT.1.2.4, 1.2.3 | 2 | 2 · 3 |
| 2 | Tersini yap (de) — MAT.1.2.4 | 2 | 2 · 3 |

- **Zorluk düzeyi** maddedeki toplama gerçeğinden (x + y = z; çıkarma z − y = x): 1 = 10 içinde; 2 = 20 içinde, onluk geçmeden;
  3 = onluk geçen. Eşlemede kartların en zoru. Toplam 9 · 5 · 6 (her iki form). Üstüne say ve ona tamamla şablonları yalnız 10
  içinde üretir; bu yüzden onluk geçen maddeler d5, d8 ve bölüm 2'dedir.
- **Ortak madde yok:** Form B, Form A'da geçen her işlem ifadesini (ve işlem kartını) dışlar; form içinde de ifade yinelenmez.
- **Determinizm:** tohumlar 53101 (A) ve 53201 (B); aynı kod → aynı form. `tests/unit/etkiFormu.spec.ts` 20 maddeyi, sıra sıra
  şablon/zorluk eşitliğini, kazanım kapsamını, cevap anahtarını, ortak madde yokluğunu, determinizmi ve belge tazeliğini denetler.
- "Zihinden bul" (d6) dışarıda: kâğıtta tahmin ile hesaplama ayrılamaz.

**Form A (yönerge özü → cevap):** 1. 6 + 2 → 8 · 2. 8 + ? = 10 → B · 3. 9 − 7 → 2 · 4. 13 + 3 → 16 · 5. 8 + 1 → 9 ·
6. 4 + ? = 10 → C · 7. 16 − 1 → 15 · 8. 7 + 9 → 16 · 9. 6 + 3 → 9 · 10. 5 + ? = 10 → A · 11. 12 − 5 → 7 · 12. 5 + 8 → 13 ·
13. 3 + ? = 10 → A · 14. 14 + ? = 16 → C · 15. 2 + ? = 10 → C · 16. tersini yap (eşleme) → 2–A, 1–C, 3–B · 17. 2 + ? = 12 → C ·
18. 7 + ? = 15 → B · 19. 2 + ? = 11 → C · 20. tersini yap (eşleme) → 3–A, 1–C, 2–B.

**Form B (yönerge özü → cevap):** 1. 8 + 2 → 10 · 2. 7 + ? = 10 → A · 3. 10 − 6 → 4 · 4. 12 + 3 → 15 · 5. 5 + 1 → 6 ·
6. 6 + ? = 10 → C · 7. 15 − 5 → 10 · 8. 7 + 4 → 11 · 9. 7 + 1 → 8 · 10. 9 + ? = 10 → A · 11. 13 − 7 → 6 · 12. 8 + 9 → 17 ·
13. 3 + ? = 4 → C · 14. 1 + ? = 18 → A · 15. 1 + ? = 6 → A · 16. tersini yap (eşleme) → 2–B, 3–A, 1–C · 17. 10 + ? = 12 → B ·
18. 5 + ? = 14 → C · 19. 9 + ? = 13 → A · 20. tersini yap (eşleme) → 1–C, 2–A, 3–B.

Harfli cevaplar kâğıttaki seçenek harfidir (bölüm 2 ve ona tamamla maddelerinde seçenekler kart olarak basılır).

**İçerik geçerliği incelemesine sunulacaklar:**
- "Ona tamamla" yönergesi her formda üç kez aynıdır (şablon tek yönergeli); Form A'da 13 ve 15 de 10'a tamamlama biçimindedir.
- Form B'de 14. madde (1 + ? = 18) ve 13. madde (3 + ? = 4) uç değerlerdedir; zorluk düzeyleri desene uyar ama öğretmen görüşüyle
  değiştirilebilir (tohum veya desen değişir, iki form birlikte yeniden üretilir).
- Eşitlik maddelerinde kâğıt yalnız iki sayı ve kutu gösterir; tahtadaki terazi görseli kâğıtta sadeleşir — anlaşılırlık ön denemede
  bakılmalı. Taban/tavan etkisi (1, 5, 9 numaralı kolay maddeler) ön denemede bakılmalı.
