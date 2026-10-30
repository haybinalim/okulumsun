# Müfredat Kısıtları — MEB TYMM 2026, 1. Sınıf Türkçe (İlk Okuma Yazma)

Bu belge, Türkçe ders paketinin üreteceği HİÇBİR içeriğin aşamayacağı sınırları kaydeder. Matematikteki
[`mufredat-kisitlari.md`](mufredat-kisitlari.md) disipliniyle aynıdır: her madde resmî programdan alıntılanır ve
mümkün olan her madde CI'da otomatik denetlenir (Okuma Yazma planı Adım 62, doğrulayıcı kuralları D-01…D-24).

- **Kaynak:** MEB Türkiye Yüzyılı Maarif Modeli, İlkokul Türkçe Dersi Öğretim Programı (2026 baskısı),
  https://tymm.meb.gov.tr/assets/pdf/ilkokul-turkce-dersi_20260902_111433_940.pdf
- **Program sürümü (içerik dosyalarındaki `programSurumu` alanı):** `tymm-turkce-2026-09-02`
- **İlgili bölümler:** §1.2.1 Ses Esaslı İlk Okuma Yazma Öğretimi (a ses öğretimi, b harfi okuma ve yazma, c harflerden
  heceler…), Şekil 1 (harf grupları ve süreler), Şekil 2 (harflerin yazılışı), Şekil 3 (satır dizgesi), Tablo 3, Ek 1, Ek 2.
- **Karar kaydı:** plan v2 KG-133 (Okuma Yazma planının kullanıcı onayı, 30 Ekim 2026); ADR-0016 (ders verisi JS dışında,
  derleme bayrağı `VITE_DERS_TUR`).
- **Durum:** Türkçe kod üretim derlemesine girmez (bayrak varsayılan kapalı). Bu belge kuralların tek kaynağıdır; program
  yeniden güncellenirse önce burası ve `programSurumu` değişir (risk R11).

Şüphede kalınca **kaynağa dön**. Program bir yıl içinde iki baskı gördü (2025 → 2026); eski harf sırası (e-l-a-k-i-n…)
geçersizdir.

---

## 1. Kapsam

- 1. sınıfta **17 öğrenme çıktısı, 100 süreç bileşeni** (Ek 1: T.D 4, T.K 4, T.O 5, T.Y 4). "99" tema satırlarının toplamıdır,
  çıktı sayısı değildir.
- 360 ders saati (Tablo 3); hazırlık 1 hafta (uyumdan sonra, 10 saat).
- Yöntem: "Ses Esaslı İlk Okuma Yazma Öğretimi"; yazı **tırnaksız dik temel harf** (MEB TemelYazi).

## 2. Harf grupları (Şekil 1)

| Grup | Harfler (öğretim sırası) | Süre |
|---|---|---|
| 1 | a n e t i l | 6 hafta |
| 2 | o k u r ı m | 4 hafta |
| 3 | ü s ö y d z | 2 hafta |
| 4 | ç b g c ş | 2 hafta |
| 5 | p h v ğ f j | 2 hafta |

29 harf; 8 ünlü (a e ı i o ö u ü), 21 ünsüz. Her harfte **önce küçük, sonra büyük** yazılış öğretilir.

## 3. Kısıtlar (K-OY-01…20) ve programdaki dayanakları

| Kod | Kısıt | Program dayanağı (alıntı) | Denetim |
|---|---|---|---|
| K-OY-01 | Harf sırası ve grupları §2'deki gibidir | Şekil 1 | D-01, birim test |
| K-OY-02 | Her etkinlik, sözcük ve cümle **yalnız o ana dek öğretilmiş harflerden** oluşur | "okunuşu ve yazılışı öğretilmemiş harflerin geçtiği sözcüklerin yerine görseller kullanılmamalıdır" | D-02, D-15, D-23 |
| K-OY-03 | Ünsüz tek başına seslendirilmez (yazım aşamasında öğretmen seslendirir); ünlü tek başına seslendirilebilir | "Ses hissettirme aşamasında ünlü harfler tek başına sesletilebilir. Ünsüz harflerde harfin yazım aşaması dışında tek başına sesletilmemesine azami özen gösterilmelidir." | D-11 |
| K-OY-04 | Hece öğretimi "n"den sonra başlar; her yeni harfte önce kapalı, sonra açık hece; ardından üç ve dört harfli heceler | "İlk harf grubunun ikinci harfi olan "n" öğretiminden sonra hece öğretimine geçilmelidir." · "Yeni harfler verildikçe her zaman önce kapalı hecelere, sonra açık hecelere ulaşılmalıdır." | D-03 |
| K-OY-05 | Hecede büyük harf yoktur; hece tek başına ve küçük harfle gösterilir | "Hece öğretimi sırasında harfin büyük yazılışı kullanılmamalıdır. Hece tek başına değerlendirilmeli ve harfin küçük yazılışıyla gösterilmelidir." | D-04 |
| K-OY-06 | Hece tablosu yok; anlamsız hecelerle sık tekrar yok; hızla sözcüğe ulaşılır | "Öğrenciyi ezbere yönelten hece tablosu vb. araç gereçler kullanılmamalıdır." · "anlamsız hecelerle sık tekrarlar yapılmamalıdır. Hızlı bir şekilde sözcüklere ulaşmak amaçlanmalıdır." | D-05 |
| K-OY-07 | Hece ve sözcük parçaları farklı renkte gösterilmez | "öğrencinin heceleyerek okumasına neden olduğu için hece ve sözcükler farklı renkle yazılmamalıdır." | D-06 |
| K-OY-08 | Öğretilmemiş harfli sözcük yerine resim (rebus) kullanılmaz | "Rana kayısı al." örneği: "kayısı" sözcüğünün yerine görseli kullanılarak cümle yazdırılmamalıdır | D-07 |
| K-OY-09 | Sözcükler çocuğun anlamını bildiği, görselle desteklenebilir sözcüklerdir | "Anlamını bilemeyeceği türden sözcüklere yer verilmemelidir." · "görsellerle desteklenebilecek … sözcüklere öncelik verilmelidir." | D-14 (iki öğretmen teyidi), insan |
| K-OY-10 | 1. grupta yalnız ses, hece, sözcük; cümle ve metin 2. gruptan itibaren | "İlk harf grubunda ses, hece ve sözcük çalışmaları yapılmalıdır. İkinci harf grubu itibarıyla … cümle ve metin çalışmalarına geçilmelidir." | D-08 |
| K-OY-11 | Önce küçük, sonra büyük harf; büyük harf yalnız cümle başı, özel ad ve başlıkta | "Harfin yazımı aşamasında harfin önce küçük sonra da büyük yazılışı …" · "Harfin büyük yazılışının kullanımı cümle başlarında, özel isimlerde ve başlıklarda vurgulanmalıdır." | D-02 (biçim farkındalıklı), D-10 |
| K-OY-12 | Nokta ilk cümleden; virgül yalnız sıralı sözcüklerde; soru işareti 2. gruptan; ünlem 5. grupta ve örnekteki **kullanım biçimiyle** (ünlem sözcüğüyle başlayan duygu cümlesi: "Ah, elim acıdı!") | "Soru işareti ikinci harf grubu itibarıyla kullanılmalıdır." · "Ünlem işareti son harf grubunda gösterilmelidir. Örnekte belirtilen kullanımı dışına çıkılmamalıdır." | D-09 |
| K-OY-13 | Kısa çizgi yalnız satır sonu hece bölmede (içerikte yok; ekranda ve kâğıtta sözcük bölünmez); kesme işareti yalnız özel ad + ek | Noktalama bölümü | D-09, D-22 |
| K-OY-14 | Anlamsız cümlelerden metin olmaz (tekerleme, bilmece, sayışma, mani, ninni istisna) | "anlaşılabilir, somutlaştırılabilir, bilgi ve mantık hatasına yol açmayacak cümleler" | D-16 (insan) |
| K-OY-15 | Hızlı okutma, süreli okuma, okuma hızı ölçümü yok | "metni hızlı okutmaya dönük etkinlikler önerilmemektedir." | D-13 |
| K-OY-16 | Çocuk yüzeyinde ve kâğıtta tırnaksız dik temel harf (TemelYazi) | §1.2.1; TTKB duyurusu (12.06.2024) | Mevcut `yaziYuzeyi.ts` kuralı |
| K-OY-17 | Satır dizgesi 1 cm, ortada kesikli kılavuz (0,5 + 0,5 cm), dizgeler arası 1 cm; serbest yazıda kılavuz kullanılmayabilir | "satır aralıkları; 1 cm genişliğinde olmalı, … kılavuz çizgisi ile tam ortadan ayrılmalı, … İki satır dizgesi arasında 1 cm boşluk bırakılmalıdır." | D-17 (PDF ölçümü) |
| K-OY-18 | Sözcük arası boşluk küçük yazımda "e", büyük yazımda "E" genişliği | "Sözcükler arasında harfin küçük yazımında "e", harfin büyük yazımında "E" kadar boşluk bırakmaları sağlanmalıdır." | D-18 |
| K-OY-19 | Sol el zorlanmaz; sol el ayarı arayüzü aynalar, harf ve hamle yönünü **aynalamaz** | "Sol elini kullanan öğrenci sağ ele zorlanmaz" | D-19 |
| K-OY-20 | Yeni sese geçişi öğretmen yönetir; takvim yalnız öneridir (öğretilen harf kümesi öğretmenin seçimi) | Esaslar; Şekil 1 süreleri | Öğretilen küme modeli |

## 4. Plan kararlarıyla eklenen kurallar (programın doğal sonucu)

| Kod | Kural | Gerekçe |
|---|---|---|
| D-11 (ek) | Harf ve hece **seçenek kartı cevaptan önce sessizdir** | Kart dokununca adını söylerse ünsüz tek başına seslendirilmiş (K-OY-03) ve cevap deneme yanılmayla bulunmuş olur |
| D-12 | Okuma hedefli soruda (uyaran yazılı metin) sesli yönerge, ↻ ve hoparlör **hedef sözcüğü söylemez** | Söylerse okuma değil dinleme ölçülür |
| D-20 | Her içerik dosyasında `programSurumu` alanı | Program güncellemelerini izlemek (R11) |
| D-21 | Her içerik öğesinin klibi var ve metni eşit (`audio:audit` ders döngüsü) | Matematikteki K4 ile aynı |
| D-23 | Çeldiriciler de öğretilmiş harflerden; karıştırılan çift çeldiricisi `diagnosticTag` taşır | K-OY-02; Türkçede c/ç, s/ş, g/ğ, o/ö, u/ü, ı/i, b/d, n/u |
| D-24 | Tahtada üst %35'te etkileşim yok | PLAN §3 (mevcut geometri e2e) |

## 5. Doğrulayıcı kural tablosu (D-01…D-24)

Kod karşılığı Adım 62'de; "Otomatik" sütunu ✓ olanlar `npm run validate` içinde koşar ve ihlal CI'ı kırmızı yapar.

| Kod | Kural | K-OY | Otomatik | Şiddet |
|---|---|---|---|---|
| D-01 | Harf envanteri 29 harf; grup ve sıra Şekil 1 ile aynı | 01 | ✓ | Hata |
| D-02 | Dekodlanabilirlik: öğe, `girisHarfi` noktasında öğretilmiş (harf, biçim) çiftlerinden oluşur; büyük harf ayrıca öğretilmiş olmalı; dönüşümler tr-TR (İ/i, I/ı) | 02, 11 | ✓ | Hata |
| D-03 | Hece öğretimi "n"den sonra; her yeni harfte ilk hece kapalı, sonra açık | 04 | ✓ | Hata |
| D-04 | Hece öğesinde büyük harf yok | 05 | ✓ | Hata |
| D-05 | Her hece en az bir sözcüğe bağlı; harf başına anlamsız hece oranı ≤ %30 | 06 | ✓ | Hata / uyarı |
| D-06 | Hece ve sözcük parçalarına ayrı renk verilemez (şemada renk alanı yok) | 07 | ✓ | Hata |
| D-07 | Rebus yok: cümle metninde görsel jetonu yok | 08 | ✓ | Hata |
| D-08 | Cümle ve metin yalnız grup ≥ 2 | 10 | ✓ | Hata |
| D-09 | Noktalama izin tablosu (`.` ilk cümleden; `,` sıralı sözcük; `?` grup ≥ 2; `!` grup 5 + ünlem sözcüğü; `'` özel ad + ek; `-` içerikte yok) | 12, 13 | ✓ | Hata |
| D-10 | Büyük harf yalnız cümle başında, `ozelAd` sözcükte ve başlıkta | 11 | ✓ | Hata |
| D-11 | Tek ünsüzlü klip yok; harf ve hece seçenek kartı cevaptan önce sessiz | 03 | ✓ | Hata |
| D-12 | Okuma hedefli öğede yönerge hedef metni içermez | — | ✓ | Hata |
| D-13 | Türkçe kodda süre ölçen skor veya okuma hızı yok | 15 | ✓ (kod taraması) | Hata |
| D-14 | Yayına giren sözcükte iki öğretmen `anlamTeyidi` | 09 | ✓ (yayın kipinde hata, geliştirmede uyarı) | Hata |
| D-15 | "Sesi duy, resmi seç" yalnız görselli sözcüklerle; seçenekler de dekodlanabilir | 02, 09 | ✓ | Hata |
| D-16 | Metin anlamlılığı | 14 | İnsan | — |
| D-17 | Kâğıtta satır dizgesi ölçüleri | 17 | Adım 65 (PDF testi) | Hata |
| D-18 | Sözcük arası boşluk = "e"/"E" ilerleme genişliği | 18 | Adım 64–65 | Hata |
| D-19 | Sol el aynalaması hamle ve harf yönünü değiştirmez | 19 | Adım 63–64 | Hata |
| D-20 | `programSurumu` her içerik dosyasında | — | ✓ | Hata |
| D-21 | Her öğenin klibi var, metni eşit | — | Adım 67 | Hata |
| D-22 | Ekranda ve kâğıtta sözcük satır sonunda bölünmez | 13 | Adım 69 (e2e) | Hata |
| D-23 | Çeldiriciler öğretilmiş harflerden | 02 | ✓ | Hata |
| D-24 | Tahtada üst %35'te etkileşim yok | — | Mevcut e2e | Hata |

## 6. Hece kuralı (hece ayırıcı)

Türkçe hece yapısı: her hecede **tam bir ünlü** vardır. İki ünlü arasında:

- ünsüz yoksa ünlüler ayrı hecededir (sa-at),
- tek ünsüz varsa sonraki heceye geçer (a-na, ne-ne),
- iki ya da daha çok ünsüz varsa **yalnız sonuncusu** sonraki heceye geçer (an-ne, at-let, Türk-çe, kont-rol).

Sözcük başındaki ünsüz kümesi ilk heceye aittir (tren, spor). Hece tipleri (programın "kolaydan zora" sırası): açık (ünlüyle
biten: a, na), kapalı (ünsüzle biten: an, at), üç harfli (nal, alt), dört harfli (Türk, kent). Program örnekleri: a, an, en, at,
et, alt, ana, ata, nal, anne, nene, alet, atlet.

## 7. Yapılmayacaklar (programla gerekçeli)

Mikrofon/konuşma tanıma/okuma kaydı; okuma hızı ve süreli okuma; tek başına ünsüz klibi; hece tablosu, anlamsız hece ezberi,
renkli hece; rebus; büyük harfle hece; bitişik eğik yazı; eski harf sırası; MEB kitap metinleri, TEGM ses ve tekerlemeleri,
EBA içerikleri (yalnız referans); TDK veri tabanından toplu çekim; sıklık listelerinin (CC BY-SA vb.) depoya girmesi;
çalışma anında YZ ile metin veya görsel; öğrenci ilerlemesini saklama (ADR-0002). Ayrıntı: Okuma Yazma planı §2.2.
