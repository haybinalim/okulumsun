# Etki çalışması — ön kayıt (plan v2 Adım 53a)

> **TASLAK — pilot bulguları (Adım 32) ve kullanıcı onayı bekliyor.**
> Bu belge henüz **kayıt değildir**. Herkese açık bir kayıt (OSF veya benzeri) **yapılmadı**; hiçbir kuruma, okula ya da veliye
> bir şey gönderilmedi (⛔ O6). Pilot bulguları gelince ölçme aracı ve takvim gözden geçirilir; kullanıcı onaylayınca belge
> **veri toplanmadan önce** damgalanır (aşağıdaki "Damga" bölümü) ve o andan sonra yalnız tarihli değişiklik ekiyle değişir.
> Kullanıcı 2026-10-14'te üç eki onayladı (KG-92): tek gruplu desende g_av + bootstrap %95 GA (§6), dışlama kuralları (§7),
> imha tarihleri (protokol §9). Belge yine **taslaktır**: pilot bulguları, OSF kararı ve MEM başvurusu kullanıcıda.

## Damga

| Alan | Değer |
|---|---|
| Belge sürümü | 0.2-taslak (2026-10-14; §6–7 kullanıcı onaylı, KG-92) |
| Depo damgası (commit) | Kullanıcı onayından sonra bu satıra onaylı commit SHA'sı yazılır |
| Herkese açık kayıt | Yok. Kullanıcı onaylarsa OSF benzeri bir kayıt; bağlantı buraya (⛔ O6) |
| Veri toplama başlangıcı | Ön test 15 Mart 2027 Pazartesi — damga bu tarihten **önce** olmalı |
| Dondurulmuş uygulama | `v0.3.1-etki` (Adım 53b; saha boyunca değişmez, yalnız kritik düzeltme `v0.3.x-etki`) |

## 1. Araştırma sorusu

1. sınıfta 4 öğretim haftası boyunca okulumsun'un tahtada kullanılması (haftada 3 × 15 dakika, bugünün seti veya Sınıf Turu,
haftalık plana göre), o haftalarda çalışılan öğrenme çıktılarında öğrenmeye katkı sağlıyor mu?

Bu çalışma "sınıfça doğrulandı" olgunluk etiketinin tek yoludur (plan v2 Adım 53, karar kuralı §7). Sonuç ne olursa olsun
yayımlanır.

## 2. Tek birincil hipotez

**H1.** Çalışılan öğrenme çıktılarında **Form B (son test) − Form A (ön test)** kazancı uygulama sınıf(lar)ında sıfırdan
büyüktür; aynı okulda bir karşılaştırma sınıfı bulunursa uygulama sınıf(lar)ının kazancı karşılaştırma sınıfınınkinden büyüktür.

İkincil ölçütler keşif amaçlıdır; birincil hipotezin yerine geçmez ve olumlu iddiaya dayanak yapılmaz.

## 3. Çalışılan öğrenme çıktıları

Müdahale haftaları (2026–27 öğretim takvimi, uygulamanın haftalık planı `src/ogretmen/yillikPlan.ts`, 14 Ekim 2026 hâli):

| Öğretim haftası | Pazartesi | Tema | Öğrenme çıktıları |
|---|---|---|---|
| 23 | 15 Mar 2027 | 4 — İşlemlerden Cebirsel Düşünmeye | MAT.1.2.2 |
| 24 | 22 Mar 2027 | 4 | MAT.1.2.3 |
| 25 | 29 Mar 2027 | 4 | MAT.1.2.3 |
| 26 | 5 Nis 2027 | 4 | MAT.1.2.3, MAT.1.2.4 |

- MAT.1.2.2 — Toplama ve çıkarma işlemlerinin sonuçlarını tahminde bulunarak ve zihinden işlem yaparak muhakeme edebilme.
- MAT.1.2.3 — Eşit işaretinin anlamını toplama ve çıkarma işlemi bağlamında yorumlayabilme.
- MAT.1.2.4 — Toplama ve çıkarma işlemlerinin ilişkisini yorumlayabilme.

**Doğrulanmamış varsayım:** okulun ünite planının bu haftalarda aynı çıktılara denk geldiği. Öğretmenin planı farklıysa ölçme
aracı veri toplanmadan önce o haftaların çıktılarına göre yeniden üretilir ve bu tablo damgadan önce güncellenir.

## 4. Birincil ölçüt

**20 maddelik kâğıt test**, iki paralel form:

- **Form A** ön test (15–19 Mart 2027), **Form B** son test (12–16 Nisan 2027).
- İki form uygulamanın çalışma kâğıdı üreticisinden (Adım 35) **sabit ve farklı tohumlarla**, aynı şablon ve zorluk dağılımıyla
  üretilir (Adım 53b, `scripts/etki-formu-uret.ts`, KG-93); yalnız müdahale haftalarının çıktılarını kapsar. İki form aynı
  20 yuvalık deseni doldurur: her sıra numarasında düğüm, şablon ve zorluk düzeyi (10 içinde / onluk geçmeden / onluk geçen)
  aynıdır; iki form arasında ortak madde yoktur.
- Öğretmen yönergeyi sesli okur (çocuktan okuma beklenmez); yanıt daire içine alma, kutuya yazma veya çizgiyle eşleme.
- Puan = doğru madde sayısı (0–20). Eşleme maddesi yalnız bütün eşler doğruysa 1 puan. Boş madde 0.
- Puanlama iki kişiyle bağımsız yapılır; madde düzeyinde uyuşma oranı raporlanır, ayrılıklar üçüncü bakışla çözülür.
- İçerik geçerliği: 2 sınıf öğretmeni + 1 alan uzmanı onayı; çalışma dışı 3–5 çocukla ön deneme (Adım 53b).

Madde listesi, cevap anahtarı ve puanlama yönergesi: [ölçme aracı](olcme-araci/README.md) (koddan üretilir; içerik geçerliği
onayı bekliyor); özet: [protokol, Ek A](etki-calismasi-protokol.md#ek-a--form-a-ve-form-b-ölçme-aracı-adım-53b).

## 5. İkincil ölçütler (keşif)

1. **Fiziksel transfer görevi** (alt örneklem): 3 maddelik masa görevi (nesnelerle), ön ve son testte.
2. **Öğretmen yükü/fayda anketi**: 5 madde, saha sonunda.
3. **Çocuk tutum ölçeği**: 3 maddelik gülen yüz ölçeği, ön ve son testte.
4. **Uygulama sadakati**: yapılan / planlanan oturum oranı (öğretmenin kâğıt günlüğünden; uygulama içinde kayıt **yok**).

## 6. Analiz planı

**Etki büyüklüğü: Hedges g, %95 güven aralığıyla.**

- **Tek gruplu desen** (karşılaştırma sınıfı bulunamazsa; kullanıcı onaylı (KG-92)): g = (son test ortalaması − ön test ortalaması) / ön ve son test
  standart sapmalarının ortalaması (g_av), küçük örneklem düzeltmesi J = 1 − 3 / (4(n − 1) − 1) ile. %95 GA, eşleştirilmiş
  kazançlar üzerinde 10 000 tekrarlı yüzdelik bootstrap (sabit tohum, betikte yazılı). Ek olarak eşleştirilmiş t testi raporlanır.
- **Karşılaştırma sınıfı varsa**: ön test ortak değişkenli **ANCOVA** — son test ~ ön test + grup. Grup katsayısı ve %95 GA'sı
  birincil sonuçtur; Hedges g, düzeltilmiş ortalama farkının birleşik son test standart sapmasına oranı (J düzeltmeli). Eğimlerin
  eşitliği (ön test × grup) denetlenir; ihlal edilirse etkileşimli model de raporlanır.
- **Kümelenme sınırı:** müdahale sınıf düzeyindedir, sınıf sayısı 1–2'dir; çok düzeyli model kurulamaz. Güven aralıkları
  öğrenci düzeyindedir ve sınıf etkisinden ayrılamaz. Bu sınır raporda açıkça yazılır.
- **Yan yana raporlananlar:** madde güçlüğü (Form A/B), iç tutarlılık (KR-20), iki puanlayıcı uyuşması, sadakat oranı, eksik veri.
- **Eksik veri:** birincil analiz iki testi de olan çocuklarla (tamamlayan analizi). Eksiklerin sayısı ve nedeni (katılmadı, onam
  geri çekildi, nakil) raporlanır; doldurma (imputation) yapılmaz.
- **Araç:** `docs/research/analiz/` altında Python veya R betiği (Adım 53c); girdi yalnız Ç-kodlu puan tablosu.

## 7. Dışlama kuralları (kullanıcı onaylı (KG-92))

1. Veli onamı olmayan veya çocuğun sözlü onay vermediği/istemediği her ölçüm alınmaz (dışarıda kalan çocuk sınıftaki
   uygulamaya katılabilir; yalnız ölçüme girmez).
2. Ön testi veya son testi olmayan çocuk birincil analizden çıkar (sayısı raporlanır).
3. Test sırasında görevi bırakan çocukta yanıtlanan maddeler puanlanır, yanıtlanmayanlar 0 sayılır; test 10 maddeden azı
   yanıtlanmış hâlde bırakıldıysa o test eksik sayılır.
4. Sınıf düzeyinde: planlanan oturumların %50'sinden azı yapıldıysa sonuç "uygulanamadı" diye raporlanır (etki büyüklüğü yine
   verilir, yorumlanmaz).
5. Sonuca bakılarak başka dışlama eklenmez.

## 8. Karar kuralı

- Sonuç ne olursa olsun yayımlanır (`docs/research/etki-raporu-2027.md`; tek sayfa + teknik ek; sınırlar açıkça).
- **"Sınıfça doğrulandı"** etiketi üç koşulla verilir: planlanan oturumların **≥ %70**'i yapıldı + ciddi kullanılabilirlik sorunu
  yok + birincil ölçütte etki büyüklüğü ve GA raporlandı. Etiket yönü ne olursa olsun "ölçüldü" anlamı taşır.
- **Olumlu iddia** yalnız birincil sonucun %95 GA'sı sıfırı dışlarsa yapılır.

## 9. Takvim (plan v2 Adım 53)

| Dilim | Tarih |
|---|---|
| 53a — ön kayıt, protokol, MEM izin başvurusu | 11–14 Aralık 2026 |
| MEM araştırma izni onayı (en geç) | 12 Mart 2027 — gecikirse saha 2027 güzüne kayar (R2) |
| 53b — ölçme aracı ve `v0.3.1-etki` dondurma | 1–2 Şubat 2027 |
| Ön test (Form A) | 15–19 Mart 2027 — her sınıfta müdahalenin ilk oturumundan önce (KG-94) |
| Müdahale | 15 Mart – 9 Nisan 2027 (4 öğretim haftası) |
| Son test (Form B) | 12–16 Nisan 2027 |
| Hariç | 8–12 Mart 2027 ara tatili; 23 Nisan 2027 |
| 53c — analiz ve rapor | 29 Nisan – 5 Mayıs 2027 |

## 10. Gizlilik ve etik özeti

Uygulama hiçbir veri toplamaz; müdahale tahtada yürür, kişisel mod isteğe bağlı ve kayıt dışıdır. Araştırma verisi yalnız
kâğıttır: çocuk adı yerine Ç-kodu (Ç01, Ç02…), ad–kod listesi yalnız okulda öğretmende kâğıt olarak durur ve depoya girmez.
Depoya yalnız toplulaştırılmış tablo girer. Ayrıntı ve imha planı: [protokol §8–9](etki-calismasi-protokol.md).

## Değişiklik kaydı

| Tarih | Değişiklik |
|---|---|
| 2026-10-14 | İlk taslak (KG-90). Kayıt yapılmadı. |
| 2026-10-14 | Kullanıcı onayı (KG-92): §6 tek gruplu desen analizi (g_av, J düzeltmesi, 10 000 tekrarlı bootstrap %95 GA), §7 dışlama kuralları, protokol §9 imha tarihleri. §4 ölçme aracı Adım 53b üreticisine bağlandı (KG-93). Kayıt yapılmadı. |
