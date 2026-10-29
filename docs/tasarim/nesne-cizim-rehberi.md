# Nesne çizim rehberi (plan v2 Adım 59, KG-104)

Çocuğun sorularda ve çalışma kâğıtlarında gördüğü nesneler (`src/ui/svg/Sprite.tsx`) ve materyaller
(`src/ui/svg/Visual.tsx`: şekiller, onluk çerçeve, konum kutusu/sepeti, ölçme çubukları ve birimleri, terazi)
bu rehbere göre çizilir. Önizleme: `npm run dev` → `/?gelistirme=nesneler` (siyah-beyaz baskı görünümü
`&gri=1`; yalnız geliştirmede, üretim paketine girmez).

## 1. Kaynak kuralı (kesin)

- Her yol, gölge ve renk **bu depoda elle/kodla yazılmış SVG**dir. Üçüncü taraf ikon/görsel seti yok
  (plan §4.2: Lucide, Phosphor, OpenMoji yasak), emoji yok, dışarıdan indirilmiş varlık yok,
  **yapay zekâ ile üretilmiş raster görsel yok** (PLAN §8: "7 nesne isteyip 6 almak ürünün temel işlevini bozar").
- Bu yüzden lisans envanterine (`src/content/ucuncuTarafVarliklar.ts`) yeni satır girmez; `npm run lisans:denetle` değişmez.
- Banknot ekranda da, kâğıtta da TCMB'nin resmî "ÖRNEKTİR GEÇMEZ" örnek görselidir (`TcmbBanknot`, KG-122; ayrı kural).
  Bu rehber banknotu yeniden çizmez.

## 2. Stil

Sıcak, çocuk kitabı kalitesinde **düz illüstrasyon**. Gradyan yerine düz tonlar: 64 px'te ve gri tonlu baskıda daha net.

| Öğe | Kural |
|---|---|
| Tonlar | Nesne başına 3–5 ton: **temel** + **gölge** (sağ alt hilal) + **ışık** (sol üst parıltı) + **koyu kontur**; isteğe bağlı sabit parça rengi (yaprak, gaga, cam, lastik). |
| Işık yönü | Her zaman **sol üst**. Gölge hilali = gövde ∩ (her yer − gövdenin sol üste kaydırılmış kopyası): `evenodd` dolgulu tek yol, gövdeye kırpılır (`Govde`); böylece her biçimde hattı izler. **SVG `<mask>` kullanılmaz** — Chromium `printToPDF` büyük maske alanlarında yazdırmayı düşürüyordu; kırpma yolları PDF'te vektör kalır. Şekil döndürülürse kaydırma ters döndürülür (`golgeKaydirmasi`) — ekranda gölge yine sağ altta. |
| Kontur | 100 birimlik sprite kutusunda **3,5** (64 px'te ≈ 2,2 px, tahtada 102 px'te ≈ 3,6 px), ayrıntı çizgisi 2,4. Materyallerde kısa kenarın %2,2'si, en az 2 px (`materyalKonturu`). Kontur saf siyah değil, temel rengin çok koyusu. `stroke-linejoin: round`. |
| Hatlar | Yuvarlatılmış; sivri köşe yalnız biçimin kendisi gerektiriyorsa (yıldız ucu, üçgen — o da yuvarlak birleşimle). |
| Zemin gölgesi | Nesnenin altında yumuşak elips (`#2B2B2B`, %14); uçan nesnelerde (balon, kuş, balık, kelebek) daha küçük ve %8. Sayma sahnesinde nesneleri birbirinden ayırır. |
| Kompozisyon | Nesne 100×100 kutunun ≈ %84'ünü doldurur; zemin gölgesi kutunun içinde. Konturlar kutu kenarına taşmaz. |
| Ayrışma | Her nesnenin siluet olarak ayırt edilebilir olması gerekir (renk tek başına anlam taşımaz — PLAN §9): elma (çentikli gövde + sap + yaprak), top (yuvarlak + krem dilimler), balon (damla + düğüm + ip), araba (yandan, iki teker), kalem (çapraz, silgi + metal + ahşap uç), kuş (tombul gövde + gaga + kanat), çiçek (5 taç yaprak + sap), yıldız (5 köşe, yüzeyli), balık (gövde + kuyruk + yüzgeç), kelebek (4 kanat + gövde + anten). |

## 3. Renk

- Sprite API'si değişmez: `Sprite({ name, fill?, size })`. `fill` **temel rengi** verir (jeneratörün `renk` alanı
  `ACCENTS` hex'i ya da nesnenin doğal rengi `DOGAL_RENK`). Gölge, ışık ve kontur `nesneTonlari(fill)` ile HSL'de
  türetilir (`src/ui/svg/renkTonlari.ts`, saf, önbellekli). Böylece "mavi top" sorusu gerçekten mavi görünür, renk adı ve sesi aynı kalır.
- Hex olmayan dolgu (`var(--color-accent)`: renksiz şekil, onluk çerçeve pulu) türetilemez: gölge/ışık yarı saydam
  siyah/beyaz örtü, kontur mürekkep `#2B2B2B`.
- **Kırmızı yasağı geri bildirim içindir** (PLAN §9: "tekrar dene" kırmızı asla). Elmanın doğal kırmızısı bir nesne rengidir,
  geri bildirim anlamı taşımaz; geri bildirim renkleri (`COLOR.correct/retry`) nesnelerde kullanılmaz. Konum kutusu/sepeti sıcak nötr
  (karton `#DDB27A`, hasır `#B97A3C`), hedef nesnelerin renklerinden ayrışır.
- Renk körlüğü dostu palet (KG-72/73) vurgu kimliğini değiştirmez; koyu palet renklerinden de tonlar türetilebilir ve test edilir
  (konturla ayrım ≥ 1,4:1). Nesneler hiçbir yerde yalnız renkle ayırt edilmez.
- Test (`tests/unit/nesneCizimleri.spec.ts`): altı vurgu, altı renk körlüğü vurgusu ve on doğal renk için
  göreli parlaklık **ışık > temel > gölge > kontur**, kontur ≤ 0,06, temel–gölge ve ışık–temel ≥ 1,2:1, temel–kontur ≥ 1,8:1 (koyu renkte 1,4:1).

## 4. Baskı (siyah-beyaz)

Çalışma kâğıtları aynı bileşenleri kullanır; "Siyah-beyaz" seçeneği `filter: grayscale(1)`. Ayrı baskı varyantı gerekmedi:
koyu kontur her renkte koyu kalır, tonlar parlaklıkça sıralıdır (test), krem/cam/metal parçalar açık gri olur. 165 arşiv
PDF'i ve etki Form A/B renkli basılır (yeni çizimle yeniden basıldı: nesneli 96 arşiv kâğıdı + etki A/B; metin özetleri ve kâğıt kodları aynı); `?gelistirme=nesneler&gri=1` ile gri görünüm denetlenir.

### 4.1 Kâğıtta nesne boyu (KG-105)

**Hedef:** sayılacak nesne kâğıtta **10–14 mm** (yer varsa 14 mm'ye kadar büyür, sayma sahnelerinde 10 mm'nin altına
inmez). Eskiden çizim 500 × 350 birimlik ekran çerçevesinde 28 mm yüksekliğe ölçekleniyor, nesne kısa kenarın %22'si
olduğu için ≈ 5–6 mm kalıyordu.

**Gerekçe.**

- *Parmakla birebir eşleme.* Kâğıt yönergesi "Nesneleri parmağınla göstererek say." 5–8 yaş çocuklarda işaret parmağı
  genişliği ortalama 14,6 mm (SS 1,1; Johnson ve Blackstone 2007, CHILDATA verisiyle; PIP eklemi) — parmak ucunun kâğıda
  değen izi bundan dardır (≈ 10 mm, çıkarım). 6 mm'lik nesne parmağın altında kaybolur, komşusu da örtülür; 10 mm'den
  büyük nesne parmak ucu kadardır, tek dokunuş tek nesneye düşer. (Ekrandaki karşılığı M-SAY tahta hedefi `tapMin`, KG-86.)
- *Ayrışma (kalabalıklaşma).* Sayma hatalarının çoğu nesne atlama/iki kez sayma; nesneler arası boşluk hücrenin
  ≥ %12'si (düzenli) / sarsıntı payı düşülmüş serbest alanın %5'i (dağınık) — nesneler hiç değmez (birim test).
- *Kalemle daire içine alma.* 1. sınıf çocuğunun daire çizimi kaba; daire içine alınacak nesnenin kenarı ≥ 10 mm olunca
  daire komşu nesneye taşmadan çizilebilir (çıkarım; seçenek kutusu kuralı ≥ 26 mm ile aynı mantık).
- *Görme keskinliği sınır değildir:* 30–40 cm okuma uzaklığında 6 mm de görülür; sorun motor ve ayrışmadır. Siyah-beyaz
  baskıda koyu kontur ve parlaklık sıralı tonlar (bölüm 4) değişmedi.

**Uygulama** (`src/ui/svg/kumeYerlesimi.ts`, `KagitSayfalari.tsx`, `kagit.css`):

- Sahne kutusu (`.kg-sahne`) maddede kalan **gerçek** yeri doldurur (dar hücrede en az eski 28 mm; yatayda 75 mm sütun);
  çizim kendi oranıyla kutuya sığar (`--sahne-oran`, kap sorgusu). Sığma kararı (`maddeKaplama`) ve sayfa planı
  **değişmedi**: sayfa sayıları, kâğıt kodları, metin özetleri aynı.
- Geniş çerçeve: kümeli/ölçme/örüntü/sayı doğrusu/onluk çerçeve sahneleri kutunun tahmini mm ölçüsüyle (`sahneKutusu`,
  1 birim = 0,1 mm) çizilir. Konum sahnesi, yön kartı ve şekilli GEO sahneleri ekran oranında kalır, yalnız büyür.
- Nesne kümesi kâğıtta M-SAY tahta düzeniyle (`sayYerlesimi.ts`) ölçülen kutuya ızgara; sıra/gruplu/onluk yapısı ve sayma
  sırası korunur, dağınıkta bol hücreli ızgara ancak nesne ≥ 10 mm kalırsa seçilir. İşlem sahnesi üç küme kutusu.
- **Aynı maddedeki kümeler aynı boyda** (karşılaştırma seçenekleri, toplama/çetele/grafik parçaları): "az olanın nesnesi
  büyük" gibi miktarla ilişkili yeni bir algısal ipucu doğmaz (karsilastir.ts çelişki koşulları sprite boy sınıfıyla kurulur).
  Bileşik sahnede örtüşen küme parçalarının kutusu komşu parçaya taşmaz.
- Ekranda yerleşim aynı (nesne kutunun %22'si); yalnız konumlar kutunun **içine** eşlenir: kenardaki nesne artık kırpılmaz,
  tek nesne kutunun ortasında (eskiden sol üst köşede yarısı kesikti).

**Ölçülen** (165 arşiv + etki A/B, nesne kutusu kenarı; çizimin kendisi kutunun biraz içindedir): M-SAY 11,5–14,1 mm (eskiden ≈ 5 mm),
M-SIRA-SAYI 14,1, M-ÇIKAR-GÖRSEL 11,4–13,9, tek nesneli seçenekler 14,2; toplama sahnesi 7,2–13,2 (medyan 12,0).
KG-105'te 10 mm'nin altında kalanlar (karşılaştırma seçenekleri, bileşik sahneler, çetele, veri grafiği, işlem hikâyesi)
için → §4.2.

### 4.2 Sayfa sayısı artmadan büyütme (KG-106)

**Kullanıcı kararı** (28 Eki 2026): "sayfa sayısını artırmayacak şekilde büyümeleri ayarla". Sığma kararı
(`maddeKaplama`), sayfa dağıtımı (`sayfalaraDagit`, `anahtarSayfalari`), altbilgi N, kâğıt kodları, madde içerikleri ve
metin özetleri **değişmedi**; büyüme yalnız maddede zaten boş kalan yerden.

- *Nesneler arası boşluk:* komşu iki nesne kutusu arasında en az **1,5 mm** (`KAGIT_NESNE_BOSLUK_MM`; sprite çizimi kutunun
  biraz içinde olduğundan görünen boşluk ≈ 2 mm). Parmakla sayarken iki nesne aynı dokunuşa düşmez. Yalnız aşağıdaki yeni
  yerleşimlerde uygulanır (M-SAY vb. KG-105'teki gibi).
- *Karşılaştırma seçenekleri* (`src/ui/print/secenekYerlesimi.ts`): iki küme kutusu 26 mm'lik satır yerine maddenin boş
  alt yarısını kullanır. Üç aday düzen ölçülür, ortak nesne boyu en büyük olan seçilir: yan yana tam yükseklik (K K [eşit]),
  alt alta tam genişlik (K / K, "eşit" sağda) ya da kümeler üstte, "eşit" altta. **İki küme kutusu her zaman aynı ölçüde,
  nesneler aynı boyda** (karsilastir.ts: miktarla ilişkili boy/alan ipucu yok); serbest kenar aynı nesne boyunu koruyan en
  küçük ölçüye (≥ 26 mm) iner. "Eşit" kutusu 26 × 26 mm kalır. Harf rozeti iç alana 0–5,5 mm girer; nesneler rozet şeridinin
  dışında (ölçümle denetlendi).
- *"Eşit mi?" bileşik sahnesi* (iki küme + iki metin seçeneği): seçenekler sahnenin sağında alt alta, sahne hücrenin tüm
  kalan yüksekliğini alır (`sahneYanSecenekli`); kümeler alt alta da dizilebilir (birebir eşlemeye uygun).
- *Bileşik sahnede küme parçaları* (`kumeYerlesimi.ts`): sahnenin tüm yüksekliği kullanılır (eskiden parça kutusu %80
  yükseklik, genişliği komşuya uzaklık kadardı) ve yalnız kümelerden oluşan sahnede kenar payı yok. İki küme (toplama,
  "eşit mi") iki **eşit** kutuda, yan yana ya da (en az %10 büyük nesne verirse) alt alta; üç küme (veri grafiği) genişliği
  ihtiyaca göre paylaşır (ortak boy en büyük; kümeler arası 5 mm, sıra korunur).
- *Çetele:* aynı nesneden tek tek parçalar tek küme gibi **beşli sıralar** hâlinde (5'ten çoksa 5 sütun; sayma sırası satır
  satır, soldan sağa) — eskiden 10 nesne tek satırdaydı.
- *İşlem hikâyesi:* üç küme sabit %29/%24/%29 dilimler yerine genişliği ihtiyaca göre paylaşır; işaretler (+ − =) dar sabit
  yerlerde, tüm yükseklik.

**Ölçülen** (165 arşiv + etki A/B, nesne kutusu kenarı; önce → sonra, parantezde ≥ 10 mm madde oranı):

| Tür | KG-105 | KG-106 |
|---|---|---|
| Karşılaştırma seçenekleri | 3,9–9,6 (0/48) | 7,8–14,2, medyan 10,2 (40/48) |
| Karşılaştırma bileşik sahnesi ("Eşit mi?") | 6,6–13,2 (2/6) | 9,1–14,1 (4/6) |
| Çetele | 6,3 (0/18) | 14,1 (18/18) |
| Veri grafiği | 7,2–10,7 (1/18) | 8,5–12,3, medyan 11,3 (12/18) |
| İşlem hikâyesi | 5,5–11,1, medyan 8,1 (8/18) | 6,4–14,1, medyan 10,3 (11/18) |
| Toplama sahnesi | 7,2–13,2 (27/32) | 8,9–14,1 (31/32) |

**Hâlâ 10 mm'nin altında (geometri sınırı, sayfa sayısı artmadan yer yok):** karşılaştırmada 11–14 nesneli küme + "eşit"
kutusu (7,8–8,3 mm: 86,5 × 66 mm alanda iki eşit kutu + 26 mm "eşit" kutusu; 14 nesne 10 mm + 1,5 mm boşlukla en az
≈ 58 × 35 mm iç alan ister, ikisi sığmaz); "Eşit mi?"de onluk çerçeve + 13–14 nesne (9,1); veri grafiğinde
toplam 16–22 nesneli, en az iki sütunu ≥ 7 olan maddeler (8,5–9,5; sahne 86,5 × 40 mm, altında 26 mm'lik üç seçenek);
işlem hikâyesinde üç kümede toplam ≥ 20 nesne (6,4–8,5; ör. 9 + 1 = 10, 13 + 7 = 20 → 40 nesne aynı 86,5 × 40 mm
sahnede). Daha büyüğü 1x4 düzen ya da madde başına daha çok hücre ister
(sayfa sayısı artar).

Kaynak: Johnson PW, Blackstone JM. *Children and gender — differences in exposure and how anthropometric differences can be
incorporated into the design of computer input devices.* SJWEH Suppl 2007;(3):26–32, Tablo 1
(http://faculty.washington.edu/petej/Johnson,GenderKidsComputers,SJWEH2007.pdf).

## 5. Teknik

- Kırpma kimlikleri `useId` → `guvenliKimlik` ile **örnek başına tektir** (aynı sahnede 20 elma çakışmaz; test her
  `url(#…)` başvurusunun aynı belgede çözüldüğünü denetler).
- Yalnız `transform`/`opacity` hareketi olan üst bileşenler değişmedi; çizimlerde animasyon yok (hareket azalt kuralları etkilenmez).
- Boyut: geometri dizeleri modül düzeyinde sabit; yıldız yüzeyleri modül yüklenince bir kez hesaplanır. JS bütçesi `npm run boyut`.
- Konum sahneleri (`KonumSahnesi`): "içinde"de hedef arka duvar ile ön duvar arasına çizilir. Ön duvarın üst kenarı
  referans yüksekliğinin **yarısında** (kutu %50, sepet ağzı %46; ilk sürümde %44/%36 idi, hedefin çoğu örtülüyordu) —
  hedefin üst yarısı görünür, "arkasında"dan (arka duvar/sap hedefin önünde, hedef yukarıda) ayrışır.
- Yeni nesne eklerken: `NESNE_SPRITELARI` + ses kliği (`nesne.*`) + `DOGAL_RENK` + `CIZIMLER` dalı; `Govde` ile temel/gölge/ışık/kontur,
  ışık sol üst, kontur 3,5; katalogda 64 ve 102 px, gri görünümde bak.
