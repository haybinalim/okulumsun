# Okulumsun Geliştirme Araştırma Raporu

> **Amaç.** Bu belge, Okulumsun’un mevcut 1. sınıf matematik PWA’sını, büyük ölçekli ilkokul matematik ürünlerinden alınan doğrulanabilir dersler ve eğitim araştırmaları doğrultusunda geliştirmek için hazırlanmış normatif yol haritasıdır. Sonraki geliştirme oturumlarında bir yapay zekâ ajanı veya geliştirici bu belgeyi, `docs/PLAN.md` ile birlikte karar kaynağı olarak kullanmalıdır.
>
> **Kapsam sınırı.** Bu rapor yalnızca MEB 2024 1. sınıf matematik kapsamı, çevrimdışı-öncelikli PWA mimarisi, hesap/giriş olmadan yerel veri ilkesi ve akıllı tahta–tablet–telefon cihaz önceliği içinde öneri verir. Bu sınırlar değiştirilmeden yeni özellik eklenemez. [1]

## 1. Yönetici Kararı

Okulumsun’un güçlü tarafı, genel amaçlı bir oyun uygulaması olmak yerine **MEB kapsamı, çevrimdışı çalışma, sesli yönerge, akıllı tahta geometrisi ve soru semantiği** üzerinde disiplinli bir temel kurmuş olmasıdır. Mevcut plan 19 öğrenme çıktısını ve 39 şablonu kapsadığını; oturum, yardım, kalıcılık ve PWA katmanlarının uygulandığını belirtir. [1] Ancak ürünün “tamamlanmış kod” seviyesinden **sınıfta öğrenmeye yardımcı, doğrulanmış ürün** seviyesine geçmesi için öncelik artık daha fazla soru veya daha fazla oyun mekaniği değildir. Öncelik; gerçek çocuk gözlemi, hata türünü açıklayan geri bildirim, basit ve denetlenebilir uyarlama, fiziksel-dijital transfer ve öğretmene eyleme dönük görünürlük olmalıdır.

Araştırılan ürünlerin ortak paydası şudur: başarıyı yalnız soru sayısı ya da puanla değil, **doğru kazanımın doğru temsil ile, doğru anda desteklenmesi** ile kurarlar. Khan Academy Kids görev seviyelerini ve öğretmen araçlarını; Zearn sınıf rutini ile müdahale raporlarını; ST Math görsel eylem–sonuç ilişkisini; DreamBox açıklanabilir biçimlendirici sinyalleri; Matific somut/görsel matematik etkinliklerini; Prodigy ise öğretmen kumanda yüzünü öne çıkarır. [3] [6] [8] [12] [15] [20]

> **Ana karar:** Okulumsun’un bir sonraki sürümü “daha çok içerik” sürümü değil, **kanıta dayalı öğrenme döngüsü** sürümü olmalıdır: `kısa tanı → temsil ile deneme → hata türüne göre destek → açıklayıcı geri bildirim → aralıklı geri çağırma → öğretmen/veli için az ama eyleme dönük özet`.

| Karar alanı | Kesin yön | İlk kanıt |
|---|---|---|
| Öğretim | Her yeni kavramda somut/görsel/sembolik bağ ve transfer görevi | ST Math, CRA ve oyun-temelli öğrenme bulguları [8] [23] [25] |
| Uyarlama | Kara kutu değil, kurala dayalı ve açıklanabilir destek seçimi | DreamBox’taki sürekli biçimlendirici sinyal ilkesi [15] [16] |
| Geri bildirim | “Doğru/yanlış” yerine seçimin sonucu ve bir sonraki küçük adım | ST Math görsel geri bildirim modeli [8] [20] |
| Oyunlaştırma | Kısa kutlama, ilerleme ve keşif; para/satın alma/zaman baskısı yok | Zearn ve Prodigy karşılaştırması [6] [12] |
| Ölçme | Pilotla gözlenen öğrenme, hata tipi ve erişilebilirlik; rozet veya oturum süresi değil | Zearn/ST Math kanıt sınırlılıkları [7] [10] [11] |
| Veri | Yerel varsayılan; çocuk verisi minimizasyonu; izleyici, reklam ve sohbet botu yok | ICO, FTC ve UNICEF ilkeleri [31] [32] [34] |

## 2. İncelenen Büyük Ölçekli Ürünlerden Çıkan Dersler

| Ürün / kaynak | Üründe görülen güçlü desen | Okulumsun’a taşınacak ilke | Taşınmayacak yön |
|---|---|---|---|
| **Khan Academy Kids** | Aynı beceri için farklı zorluk katmanları, öğretmen atama ve ilerleme görünümü bulunur. [3] [4] | `Temel → Ana → Pekiştirme → Zenginleştirme` içerik varyantları ve küçük grup düzeyinde özet. | Geniş içerik kataloğu ve çok sayıda etkinlik türü, 1. sınıf matematik çekirdeğini dağıtmamalıdır. |
| **Zearn Math** | Dijital pratik, sınıf öğretimiyle bağlı kısa rutin ve müdahale raporları içinde kullanılır. [6] [7] | Öğretmenin cevaplayacağı üç soru: “Kim başlamadı?”, “Kim hangi hatada takıldı?”, “Kim sonraki temsil için hazır?” | “Haftada şu kadar dakika” hedefi başarı metriği olarak kopyalanmamalıdır; yerel pilotla sınanmalıdır. |
| **ST Math** | Öğrenci eyleminin sonucunu sahnede gösteren görsel problem çözme ve sembole geçiş kullanır. [8] [20] | Önce eylem/temsil, sonra matematik sembolü; yanlış seçimde açıklayıcı sahne değişimi. | Tam başarı kapısı çocuğu kilitleyen ilerleme duvarına dönüştürülmemelidir. |
| **DreamBox Math** | Etkileşimlerden biçimlendirici sinyal çıkarır ve destek düzeyini değiştirir. [15] [16] | Hata türü, deneme, yardım, temsil ve bırakma sinyallerinden açıklanabilir kural seti. | Açıklanamayan tahmin motoru veya bulut tabanlı kişisel profil çıkarımı. |
| **Matific** | Matematik nesneleri ve etkinlikleri ile somut/görsel temsil öne çıkar; öğretmen görünümü eşlik eder. [18] [19] | Dokun-seç/dokun-yerleştir ile manipülatif hissi; her etkinlikte temsilin matematiksel anlamı. | Serbest sürükle-bırak zorunluluğu; bu, akıllı tahta kısıtlarıyla çelişir. [1] |
| **Prodigy Math** | Öğretim denetimi oyun dünyasından ayrıdır; öğrenci gizliliğine özel politika sunar. [12] [13] [14] | Oyun yüzünden bağımsız sade öğretmen/veli özeti; reklam ve öğrenci yüklemesi yok. | Satın alma, kozmetik ekonomi, yağma kutusu veya sürekli ödül döngüsü. |
| **MEB dijital matematik yaklaşımı** | Günlük hayat, etkileşimli materyal ve konu açıklamaları vurgulanır. [29] | Her dijital sorudan sonra günlük nesne veya sınıf içi eyleme bağlanan mikro-transfer. | 1. sınıf ekranını video/kaynak deposuna dönüştürmek. |

Araştırma kanıtı oyunlaştırmayı doğrudan reddetmez; fakat dijital oyun etkilerinin bağlama, tasarıma ve uygulama sadakatine bağlı olduğunu gösterir. 2024 sistematik taraması 45 çalışmayı derlerken, ayrı bir çalışma dijital ve fiziksel oyunların transfer gücünün farklılaşabildiğini vurgular. [21] [23] Bu nedenle “eğlenceli” görünmek, öğrenme etkisinin kanıtı değildir. Her oyun öğesi, hangi matematiksel eylemi görünür kıldığıyla gerekçelendirilmelidir.

## 3. Kesinlikle Yapılması Gerekenler

Aşağıdaki maddeler **öncelik sırasıyla zorunludur**. Bir sonraki maddeye geçmeden önce öncekinin kabul ölçütleri kayda geçirilmelidir. Yeni bir konu, yeni ders veya büyük görsel yenileme bu sıralamayı geçemez.

### 3.1 Zorunlu 0 — Mevcut durumun tek doğru kaynağını düzeltin

`docs/PLAN.md`, `docs/PROGRESS.md` ve güncel kod birbirleriyle yeniden uzlaştırılmalıdır. İlerleme raporunda eski ses envanteri, eski test sayıları ve geçmiş CI notları bulunurken, güncel dalda 283 ses klibi ve daha geniş test kapsamı vardır. Bu çelişki, sonraki ajanların yanlış öncelik seçmesine neden olur. [1] [2]

| Yapılacak iş | Uygulama ayrıntısı | Kabul ölçütü |
|---|---|---|
| Durum uzlaştırması | `PLAN`, `PROGRESS`, ses manifestosu, CI ve test sonuçlarını aynı commit’te güncelleyin. | Dokümanlarda geçen şablon, ses, test ve CI sayıları `npm` komutlarının çıktısıyla eşleşir. |
| Karar kaydı | Her yeni ürün kararını `docs/ADR/NNN-kisa-ad.md` biçiminde tutun. | Her karar; bağlam, seçenekler, seçilen yön, neden, geri dönüş maliyeti içerir. |
| Sürüm etiketi | “Araştırma/deneysel”, “pilot”, “sınıfça doğrulandı” durumlarını ayrıştırın. | Uygulamanın hiçbir ekranı fiziksel test yapılmadan “kanıtlandı” demeyecek. |

### 3.2 Zorunlu 1 — 5 çocukluk tablet pilotunu gerçek ürün kapısı yapın

Plan, fiziksel tablet ve akıllı tahta testini zaten öngörür; araştırma, bunu sonraya bırakılacak UX işi değil, ürünün ana doğrulama mekanizması olarak güçlendirir. [1] [27] İlk pilotta başarı oranını tek başına izlemek yanıltıcıdır. Çocuğun ses yönergesini başlatması, hangi görseli yanlış anlamlandırdığı, yardım düğmesini fark edip etmediği, yanlış sonrası tekrar denemesi ve gerçek nesneyle transferi birlikte gözlenmelidir.

| Pilot unsuru | Zorunlu yöntem | Başarı eşiği |
|---|---|---|
| Katılımcı | Farklı okuma, dikkat ve matematik başlangıç düzeyinde **en az 5** 1. sınıf öğrencisi; veli/okul izni ile. | Her biri 20–25 dakikayı aşmayan oturum tamamlar. |
| Görev seti | Konum, sayma, karşılaştırma, ölçme, işlem, para ve veri temalarından 1’er temsilci görev. | Her görevin ses, görsel, cevap ve geri bildirim anlaşılabilirliği not edilir. |
| Gözlem | `bağımsız başladı`, `ses kullandı`, `yanlış tipi`, `yardım aldı`, `terk etti`, `yetişkin müdahalesi` alanları. | Gözlem formu her çocuk için eksiksizdir; sözlü yorum değil davranış kaydı esastır. |
| Transfer | Her oturumda en az iki dijital olmayan mikro görev: örneğin sınıftaki kalemleri eşleme veya gerçek banknot örneğini tanıma. | Dijital doğru cevabın fiziksel görevde yeniden görülüp görülmediği ayrı kaydedilir. |
| Çıktı | Önceliklendirilmiş sorun listesi ve her sorun için kayıt/ekran bağlantısı. | Bir sonraki sürümde yalnız yüksek etkili ilk 3 sorun düzeltilir; rastgele kozmetik değişiklik yapılmaz. |

### 3.3 Zorunlu 2 — Her şablonu “öğretimsel döngü” sözleşmesine yükseltin

Mevcut soru metni–görsel–cevap tutarlılığı korunmalıdır; ancak buna dört alan eklenmelidir: `konkretEylem`, `gorselModel`, `sembolikIfade`, `baglantiAciklamasi`. Somut–temsili–soyut geçişte temsil ile hedef matematiğin bağlantısı açık kurulmazsa görsel yalnız dekor olur. [24] [25]

```ts
// Yeni şablon sözleşmesi — kavramsal hedef, zorunlu alanlar.
type OgretimselAdim = {
  konkretEylem: 'dokun-sec' | 'dokun-yerlestir' | 'sayarak-isaretle' | 'sinifta-bul';
  gorselModel: Visual;
  sembolikIfade?: string;
  baglantiAciklamasi: SpeechKey;
  transferGorevi?: SpeechKey;
};
```

Bu alanlar ilk aşamada tüm şablonlarda aynı yoğunlukta görünmek zorunda değildir. Ancak yeni veya yenilenen her şablon; doğru cevaptan sonra “neden?”i, yanlış cevaptan sonra da güvenli ve kısa bir sonraki adımı taşımak zorundadır. ST Math’in değerli dersi, animasyonun puanın süsü değil, öğrencinin eyleminin sonucu olmasıdır. [8] [20]

### 3.4 Zorunlu 3 — Açıklanabilir hata ve destek motorunu kurun

Uyarlama sistemi ilk aşamada makine öğrenmesi değildir. Her destek kararı bir öğretmen veya geliştirici tarafından şu biçimde açıklanabilmelidir: “Öğrenci son iki görevde `BIRER_BIRER_SAYMA` hatası yaptığı için önce nesne grubu ve sesli eşleme gösterildi.” DreamBox’ın biçimlendirici değerlendirme ilkesi bu davranışı destekler; ancak ürünün kapalı algoritması kopyalanmamalıdır. [15] [16]

| Sinyal | Önerilen yerel kayıt | Kural örneği | Sonraki öğrenci deneyimi |
|---|---|---|---|
| Hata türü | `diagnosticTag` | Aynı etiket iki kez görülürse | Aynı sayısal hedef, daha somut temsil ile gelir. |
| Deneme sayısı | `attemptNo` | Üçüncü deneme öncesi | Kısa K2/K3 yardım, cevap verilmeden önce açılır. |
| Yardım kullanımı | `helpLevel` | K3 kullanıldıysa | Sonraki oturumda kısa hatırlama turu planlanır. |
| Temsil tercihi | `representation` | Görsel modelde başarılı, sembolde zorlanıyor | Görsel → sembol köprüsü içeren varyant gelir. |
| Bırakma / süre | `abandonment` veya anlamlı duraklama | Aynı şablonda iki terk | Görev daha kısa parçaya bölünür; süre puanlanmaz. |

Bu kayıtlar buluta gönderilmemelidir. Kişisel modda Dexie’de, tahta modunda ise yalnız geçici oturum belleğinde tutulmalıdır. [1] Sonraki öneri, “hatırlama turu” gibi çocuk için anlaşılır etiket taşımalıdır; tekrar, ceza veya silinen ilerleme gibi görünmemelidir. Aralıklı geri çağırma ve tekrar, öğrenmeyi destekleyen ancak bağlama uyarlanması gereken yaklaşımlardır. [26]

### 3.5 Zorunlu 4 — Öğretmen/veli için az fakat eyleme dönük özet hazırlayın

Sınıf paneli, öğrencinin ekran süresini ve rozet sayısını sıralayan bir analitik ekran olmamalıdır. Zearn ve ST Math’ten alınacak doğru desen, yüz yüze müdahaleyi mümkün kılan sade uyarıdır. [6] [20] Sunucusuz mimaride ilk sürümün gerçekçi biçimi, tek cihazda gösterilen veya şifreli/yerel dışa aktarımla taşınan özet olabilir; çoklu sınıf, merkezi hesap ve uzaktan takip bu aşamada yapılmamalıdır.

| Panelde yalnız bulunması gerekenler | Gösterim kuralı |
|---|---|
| Bugün destek gerektiren beceriler | En fazla üç madde; her biri hata tipi ve önerilen fiziksel etkinlik içerir. |
| Hazır olunan sonraki adım | “3 öğrenci onluk çerçevede başarılı; sayı sembolü köprüsüne hazır” gibi eylem cümlesi. |
| Hata örüntüsü | “Eşit işaretini sonuç yönü gibi okuyor” gibi teşhis etiketi, ham tıklama sayısı değil. |
| Erişilebilirlik sinyali | Ses kapalı, yardım sık kullanıldı veya dokunma hedefi kaçırıldı gibi ürün sorunu sinyali. |
| Veri denetimi | “Bu cihazda saklanır”, silme ve dışa aktarma kontrolü görünür olmalıdır. |

### 3.6 Zorunlu 5 — Erişilebilirlik ve ses kalite kapılarını gerçek kullanıma bağlayın

W3C, bilişsel/öğrenme farklılıkları için tanıdık örüntü, açık ve kısa içerik, hatayı önleyen düzen, bellek gerektirmeyen akış ve gerçek kullanıcı testi önerir. [35] WCAG 2.2 ise mobil dahil test edilebilir erişilebilirlik ölçütleri sunar. [36] Mevcut büyük hedef ilkeleri korunmalı; aşağıdaki denetimler otomatik ve manuel olarak eklenmelidir.

| Denetim | Zorunlu kural | Ölçüm biçimi |
|---|---|---|
| Dokunma | 1. sınıf için ürün hedefi **en az 44×44 CSS px**, tercihen mevcut 64px tablet standardı; şıklar arası boşluk korunur. W3C asgari ölçüsü 24×24 CSS px’tir. [37] | Playwright geometri testi + gerçek tablet gözlemi. |
| Ses | Ses kullanıcı eylemi ile başlamalı; otomatik uzun ses başlatılmamalı; tekrar/durdur/ses kontrolü görünür olmalı. [38] | E2E senaryosu + ekran okuyucu/telefon denetimi. |
| Metin | Metin, ses veya görselin yerine değil ikinci kanalıdır. | Her şablonda `speechKeys` ve alternatif açıklama denetlenir. |
| Hareket | Kutlama kısa, atlanabilir ve reduced-motion ile azaltılmış olmalı. | Görsel regresyon + tercih testi. |
| Kontrast | Renk, tek başına kategoriyi veya doğru/yanlış anlamını taşımamalı. | Tasarım token testi ve manuel denetim. |

### 3.7 Zorunlu 6 — İçerik üretiminde “kaliteyi ölçekleyen” araçları yazın

Yeni şablon sayısını artırmak yalnızca generator dosyası eklemek olmamalıdır. Mevcut sözleşme, içerik şeması, ses manifestosu ve semantik testler iyi başlangıçtır. Bunu “şablon kalite pasaportu” ile tamamlayın.

| Pasaport alanı | Denetim |
|---|---|
| Müfredat sınırı | Hedef kazanım, sayı aralığı ve yasak kavramlar doğrulanır. |
| Semantik kanıt | Soru, görsel ve tek doğru seçeneğin aynı kavramı ölçtüğü property testi ile kanıtlanır. |
| Hata amacı | Her çeldirici bir `diagnosticTag` taşır; rastgele yanlış cevap üretilmez. |
| Öğretimsel yol | Temel/ana/pekiştirme/zenginleştirme varyantı ve gerekli destek seviyesi açıklanır. |
| Ses ve erişilebilirlik | Her yönerge, seçenek, geri bildirim ve görsel alternatifinin kapsama testi vardır. |
| Transfer | En az bir fiziksel/günlük yaşam mikro görevi veya öğretmen önerisi vardır. |
| Gerileme güvencesi | Determinizm, tek doğru cevap, gösterim sözleşmesi ve ekran görüntüsü/akış denetimi geçer. |

## 4. Kesinlikle Yapılmaması Gerekenler

| Yapılmaması gereken | Neden | Yerine uygulanacak sınır |
|---|---|---|
| **Çalışma anında serbest metinli yapay zekâ sohbet botu eklemek** | Çocuklar için yanlış bilgi, zararlı içerik, aşırı insansı ilişki ve gelişimsel etki riskleri taşır; kanıt ve denetim açığı vardır. [34] | Yerel, denetlenmiş şablon geri bildirimleri ve kural motoru kullanın. |
| **Gizli davranışsal profil, reklam SDK’sı veya üçüncü taraf izleyici eklemek** | Çocuk odaklı tasarımda veri minimizasyonu, yüksek gizlilik varsayılanı ve gereksiz paylaşmama esastır. [31] | Cihaz içi takma ad/profil; açık silme ve dışa aktarma. |
| **Puan, rozet veya süreyi ana başarı metriği yapmak** | Katılım sinyali öğrenmeyi kanıtlamaz; ürün etkisi uygulama bağlamına bağlıdır. [7] [21] | Hata tipi, bağımsız çözüm, transfer ve yardım ihtiyacını izleyin. |
| **Dijital pratiği fiziksel matematiğin yerine koymak** | Dijital oyundan günlük yaşama transfer otomatik değildir. [22] [23] | Her kritik kazanımda sınıf/ev nesnesiyle mikro-transfer önerin. |
| **Yeni dersleri veya çok sayıda konuyu hemen eklemek** | 1. sınıf matematik çekirdeğinin gerçek kullanım kanıtı henüz tamamlanmadan kapsam büyür. [1] | Önce mevcut 7 temanın pilot verisiyle yüksek etkili sorunlarını düzeltin. |
| **Akıllı tahtada sürükle-bırak veya küçük hedef zorunluluğu getirmek** | Tek noktalı IR dokunma ve fiziksel erişim kısıtları bu etkileşimi güvenilmez kılar. [1] | `dokun-seç → dokun-yerleştir` modelini koruyun. |
| **Eğitim çekirdeğine satın alma, kozmetik ekonomi, yağma kutusu veya zaman baskısı eklemek** | Öğrenme amacını ödül ekonomisine iter ve çocuk ürününde etik/odak riski yaratır. [12] [14] | Kısa kutlama, keşif ve kazanım temelli ilerleme kullanın. |
| **“Ustalık” durumunu mutlak bilme olarak sunmak** | Ustalık ve hatırlama zamanla değişir; ölçüm hatası mümkündür. [26] | “Hazır”, “hatırlama turu” ve “destekle dene” gibi gelişim dili kullanın. |
| **Fiziksel çocuk/tahta testi olmadan tasarımı kesin kabul etmek** | Otomatik geometri testi gerçek dokunma isabetini ve uzaktan okunurluğu kanıtlamaz. [1] | Test protokolünü ürün kapısı kabul edin; bulguyu dokümante etmeden özellik kapatmayın. |

## 5. Kullanıcının Söylemeyi Unutmuş Olabileceği Ancak Araştırılması Zorunlu Alanlar

Bu bölüm yeni özellik önerisi değildir. Her biri, ürünün güvenle büyümesinden önce cevaplanması gereken açık araştırma sorusudur.

| Araştırma başlığı | Neden şimdi gerekli | Çıktı / karar kapısı |
|---|---|---|
| **Türkiye’de çocuk verisi ve okul kullanımı** | Uygulama bugün yerel veri kullansa da öğretmen özeti, bulut yedekleme veya sınıf modu gündeme geldiğinde KVKK ve okul izinleri kritikleşir. Uluslararası ilkeler veri minimizasyonu ve açık amaç sınırını destekler. [31] [32] | KVKK uzmanı/kurum hukukçusuyla veri envanteri, saklama-silme matrisi ve veli bilgilendirme metni. Bu olmadan hesap veya bulut özelliği yok. |
| **Özel gereksinim ve Türkçe öğrenme farklılıkları** | W3C genel ilkeler verir; Türkiye’de görme, işitme, motor, dikkat ve öğrenme farklılıkları için alan uzmanı gözlemi gerekir. [35] | En az bir özel eğitim öğretmeni ve bir sınıf öğretmeniyle 60 dakikalık görev analizi; erişilebilirlik backlog’u. |
| **Ölçme geçerliği** | “Öğrenci bu beceriyi biliyor” çıkarımı, çok kısa dijital performansa dayanamaz. | Her kazanım için gözlenebilir kanıt tablosu: doğru eylem, olası hata, transfer görevi, öğretmen doğrulaması. |
| **Sesin çocuk tarafından anlaşılabilirliği** | Teknik ses denetimi klibin varlığını ölçer, çocuğun tempoyu ve telaffuzu anladığını değil. | 10 temel yönerge için çocuk dinleme testi; anlaşılmayan klip yeniden kaydedilir/iyileştirilir. |
| **Düşük donanımlı Android ve okul ağı** | PWA teorik olarak çevrimdışıdır; ancak gerçek okul WebView, depolama sınırı ve ses davranışı farklılaşır. [1] | En az üç hedef cihazda yükleme, ikinci açılış, uçak modu, ses ve güncelleme senaryosu. |
| **Akıllı tahta saha denemesi** | Planın açıkça kaydettiği fiziksel erişim ve kalibrasyon riski duruyor. [1] | IR dokunma, ekran yüksekliği, sınıf arkasından okunurluk, tam ekran/Wake Lock ve eski tarayıcı matrisi. |
| **Etkililik pilotu** | Büyük ürünlerin bağımsız kanıtı dahi bağlama duyarlıdır. [7] [10] [11] | Önce-sonra veya eşleştirilmiş küçük pilot; başarı, hata, transfer, öz-yeterlik ve öğretmen yükü raporu. |

## 6. Uygulama Sırası: Ajanlar İçin Kesin Çalışma Protokolü

Aşağıdaki sıra bağlayıcıdır. Bir ajan, önceki aşamanın “bitti tanımı” kayda geçirilmeden sonraki aşamanın kodunu yazmamalıdır.

### Aşama A — Araştırma ve gerçek kullanım doğrulaması

1. `docs/PROGRESS.md` içindeki sayıları güncel test/CI çıktılarıyla uzlaştırın.
2. `docs/TEST-PROTOKOLU.md` üzerinden 5 çocukluk tablet pilotunu yürütün ve ham gözlemleri kimliksiz biçimde `docs/research/pilot-YYYY-MM.md` dosyasına kaydedin.
3. Sorunları **öğrenme etkisi × yaygınlık × erişilebilirlik riski** ile puanlayın. İlk üç sorunu seçin; aynı sürümde beşten fazla problem çözmeye çalışmayın.
4. Fiziksel tahta mevcut olduğunda, planın §13 listesini uygulayın. Token/ölçek değişikliği gerekirse yalnız `src/design/tokens.ts` ve ilgili geometri testini birlikte güncelleyin. [1]

**Aşama A bitti tanımı:** En az 5 çocuk için anonim gözlem, en az 2 transfer görevi, öncelik matrisi, seçilen ilk üç sorun ve kabul ölçütleri repoda kayıtlıdır.

### Aşama B — Öğretimsel sözleşme ve hata motoru

1. `src/exercises/types.ts` ve Zod şemasına öğretimsel adım alanlarını geriye uyumlu biçimde ekleyin.
2. Önce yalnız üç temsilci şablonda uygulayın: sayma, eşitlik/işlem ve ölçme.
3. Her şablon için yanlış seçenek → `diagnosticTag` → K1/K2/K3 destek zincirini testle doğrulayın.
4. `src/progress/` içinde yalnız saf fonksiyonlarla, açıklanabilir kural tablosunu uygulayın. `Date.now`, ağ çağrısı ve rastlantı motorun içine girmemelidir. [1]

**Aşama B bitti tanımı:** Üç şablonda görsel/sembolik köprü, yanlış sonrası açıklama ve gün aralıklı hatırlama görünür; birim ve E2E testleri yeni kararları kapsar.

### Aşama C — Öğretmen/veli için eylem özeti

1. Sunucu, hesap veya sınıf senkronu eklemeyin.
2. Var olan yerel ilerleme kayıtlarından en çok üç eylem cümlesi üretin.
3. Her cümleyi bir “sınıfta yap” önerisine bağlayın.
4. Veli/öğretmen kapısı, verinin bu cihazda tutulduğunu ve silinebileceğini açıkça göstermelidir.

**Aşama C bitti tanımı:** Özet; “puan” veya “süre” olmadan beceri, hata ve öneri gösterir; ekran okuyucu/dokunma testinden geçer; dışarıya veri göndermediği testle kanıtlanır.

### Aşama D — İçerik üretim sistemi ve ölçümlü pilot

1. Şablon kalite pasaportu denetimini `scripts/validate-content.ts` içine ekleyin.
2. En sık görülen üç hata için temel/ana/pekiştirme varyantı üretin.
3. Her varyantı yalnız sayı değiştirerek değil, temsil değiştirerek farklılaştırın.
4. Pilot öncesi/sonrası verileri isimsiz ve toplulaştırılmış değerlendirin; pazarlama iddiası üretmeyin.

**Aşama D bitti tanımı:** Yeni/yenilenen her şablon kalite pasaportundan geçer; pilot raporu hem olumlu hem olumsuz bulguları ve bir sonraki kararını içerir.

## 7. Teknik Koruma Kılavuzu

| Değişiklik türü | Önce okunacak dosyalar | Zorunlu denetimler |
|---|---|---|
| Yeni/yenilenen soru şablonu | `docs/mufredat-kisitlari.md`, `src/content/skills.json`, `src/exercises/types.ts`, `docs/SORU_TASARIM_DENETIMI.md` | `lint`, `test`, `validate`, `audio:audit`, `build`, gerekli E2E ve yeni semantik test. |
| Adaptasyon veya oturum seçimi | `src/progress/*`, PLAN ustalık/scheduler bölümü | Deterministik birim test, en az bir “aynı hata → destek” ve bir “ustalık → hatırlama” senaryosu. |
| Ses/görsel | Ses manifestosu, `Visual.tsx`, lisans notları | Manifest kapsamı, dosya varlığı, erişilebilir etiket, cihazda yükleme ve lisans/kaynak kaydı. |
| Öğretmen/veli görünümü | Gizlilik ilkeleri, persistence katmanı, erişilebilirlik denetimi | Ağ isteği yok, anonim/yerel varsayılan, silme/dışa aktarma, klavye/dokunma/ekran okuyucu kontrolü. |
| PWA veya cihaz davranışı | `vite.config.ts`, Workbox ayarı, cihaz profili | Çevrimdışı ikinci açılış, depolama, telefon/tablet/board ekran görüntüsü ve gerçek cihaz testi. |

> **Ajan için durdurma kuralı:** Müfredat sınırı, soru semantiği, ses kapsamı, çocuk verisi veya cihaz erişilebilirliği belirsizse kod yazmayı durdurun. Önce bu belgede gerekçeli karar, test ve kabul ölçütü ekleyin; sonra uygulayın.

## 8. Başarı Ölçümü

Ürün başarısı tek metrikle ölçülmemelidir. Aşağıdaki göstergeler, pilot düzeyinde yorumlanmalı; küçük örneklemde nedensellik veya genellenebilir etki iddiası yapılmamalıdır.

| Boyut | Birincil gösterge | Uyarı göstergesi |
|---|---|---|
| Anlama | Aynı kazanımda destek gereksinimi azalırken transfer görevinde bağımsız çözüm görülmesi | Yalnız dijital doğru, fiziksel görevde başarısızlık. |
| Hata kalitesi | Aynı `diagnosticTag` tekrarının azalması | Çeldiriciye rastgele geçiş, artan yardım ve terk. |
| Erişilebilirlik | Sesin bağımsız başlatılması, hedef kaçırma olmaması, görevde kalma | Yetişkinin tekrar eden müdahalesi veya ses düğmesinin bulunamaması. |
| Öğretmen faydası | Özetin tek bir sonraki sınıf etkinliğine dönüştürülebilmesi | Sadece tablo/puan görünen ancak eylem doğurmayan veri. |
| Teknik dayanıklılık | Uçak modunda tam oturum, ikinci açılış, ses ve yerel kayıt | PWA kurulduktan sonra varlık/ses eksikliği veya veri kaybı. |

## 9. Sonuç

Okulumsun’un geliştirme yönü, küresel ürünleri yüzeysel olarak taklit etmek değildir. Bu ürünlerden alınması gereken; **temsil temelli öğretim, küçük ve açıklanabilir uyarlama, öğretmene eylem üreten ölçüm, çocuk verisine saygı ve gerçek kullanıcıyla iterasyon** disiplinidir. Alınmaması gereken ise kapsam şişmesi, oyun ekonomisi, gizli analitik, serbest yapay zekâ sohbeti ve saha testi olmadan “tamamlandı” ilanıdır.

Bu raporun ilk icrası, yeni özellik geliştirmek değil; **durum uzlaştırması ve 5 çocukluk tablet pilotu** olmalıdır. Pilot sonucu hangi alanın gerçekten engel oluşturduğunu gösterecek; ancak o zaman sonraki kod değişikliği ölçülmüş bir ihtiyaca dayanacaktır.

---

## Kaynakça

[1]: PLAN.md — *okulumsun: 1. Sınıf Matematik Öğrenme Uygulaması* (proje içi normatif plan). `docs/PLAN.md`
[2]: PROGRESS.md — *okulumsun İlerleme Raporu* (proje içi durum raporu). `docs/PROGRESS.md`
[3]: [Khan Academy Kids](https://www.khanacademy.org/kids) — ürün kapsamı ve kişiselleştirilmiş öğrenme yaklaşımı.
[4]: [Khan Academy Kids Teacher Tools](https://khankids.zendesk.com/hc/en-us/articles/360041862972-All-about-Teacher-Tools-in-Khan-Academy-Kids) — görev atama ve ilerleme araçları.
[5]: [Khan Academy Accessibility Statement](https://www.khanacademy.org/about/accessibility-statement) — erişilebilirlik yaklaşımı.
[6]: [Zearn — Using Zearn for Impact](https://about.zearn.org/using-zearn-for-impact) — sınıf kullanım rutini ve uygulama çerçevesi.
[7]: [Zearn reporting suite](https://help.zearn.org/hc/en-us/articles/29008224450967-Zearn-reporting-suite) ve [iki yıllık randomize çalışma](https://edworkingpapers.com/ai25-1211) — raporlama ve etki kanıtı sınırları.
[8]: [ST Math program overview](https://www.mindeducation.org/programs/st-math/) — görsel problem çözme yaklaşımı.
[9]: [What is ST Math?](https://help.stmath.com/hc/en-us/articles/31147884758935-What-is-ST-Math) — içerik ve uygulama açıklaması.
[10]: [ST Math — Evidence for ESSA](https://www.evidenceforessa.org/program/st-math-spatial-temporal-math/) — etki büyüklüğü ve çalışma özeti.
[11]: [IES — ST Math scale-up study](https://ies.ed.gov/use-work/awards/spatial-temporal-mathematics-scale-innovative-and-fully-developed-paradigm-boost-math-achievement) — uygulama sadakati ve alt grup araştırması.
[12]: [Prodigy for Teachers](https://www.prodigygame.com/main-en/teachers) — öğretmen araçları ve görev yapısı.
[13]: [Prodigy for Administrators](https://www.prodigygame.com/main-en/administrators) — sınıf/okul görünümü.
[14]: [Prodigy Student Privacy Policy](https://www.prodigygame.com/main-en/privacy-policy-for-students) — öğrenci verisi yaklaşımı.
[15]: [DreamBox for Educators](https://www.dreambox.com/educators) — öğretmen ve uyarlanabilir öğrenme modeli.
[16]: [DreamBox continuous assessment and adaptivity](https://dreamboxlearning.zendesk.com/hc/en-us/articles/27281596241043-DreamBox-Math-Continuous-Assessment-Adaptivity) — biçimlendirici sinyaller.
[17]: [What Works Clearinghouse — DreamBox snapshot](https://ies.ed.gov/ncee/wwc/EvidenceSnapshot/627) — kanıt düzeyi özeti.
[18]: [Matific](https://www.matific.com/us/en-us/home/) — etkinlik ve öğretmen desteği.
[19]: [Matific Teacher Resources](https://www.matific.com/us/en-us/teachers/) — sınıf kullanım materyalleri.
[20]: [ST Math: Teaching Math Visually](https://www.youtube.com/watch?v=qBRwOTcU73c) — ürün tanıtım demosu, 2022.
[21]: [Dan et al. (2024), Digital game-based learning in mathematics education at primary school level](https://doi.org/10.29333/ejmste/14377) — sistematik literatür taraması.
[22]: [Alotaibi (2024), Game-based learning in early childhood education](https://doi.org/10.3389/fpsyg.2024.1307881) — sistematik derleme ve meta-analiz.
[23]: [Debrenti (2024), Game-Based Learning experiences in primary mathematics education](https://doi.org/10.3389/feduc.2024.1331312) — dijital/fiziksel oyun ve transfer tartışması.
[24]: [Mathematics Hub — Concrete, Representational, Abstract](https://www.mathematicshub.edu.au/plan-teach-and-assess/teaching/teaching-strategies/concrete-representational-abstract-cra/) — CRA öğretim yaklaşımı.
[25]: [ST Math research overview](https://www.mindeducation.org/research/) — görsel öğrenme ve araştırma çerçevesi.
[26]: [Australian Education Research Organisation — Spacing and Retrieval Practice Guide](https://www.edresearch.edu.au/guides-resources/practice-guides/spacing-and-retrieval-practice-guide-full-publication) — aralıklı geri çağırma uygulama rehberi.
[27]: [W3C — Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/) — kullanıcı araştırması ve bilişsel erişilebilirlik ilkeleri.
[28]: [MEBİ — Bireysel Öğrenme Platformu](https://mebi.eba.gov.tr/) — kişiselleştirme ve raporlama bağlamı.
[29]: [MEB Matematik Dijital Eğitim Platformu](https://ogm.meb.gov.tr/www/matematik-seferberligi-calismalari-kapsaminda-hazirlanan-quotmatematik-dijital-egitim-platformuquot-hizmete-acildi/icerik/1592) — resmî dijital matematik platformu duyurusu.
[30]: [MEBİ tanıtım faaliyetleri](https://ogm.meb.gov.tr/www/mebi-bireysel-ogrenme-platformu-tanitim-faaliyetlerine-7300-rehber-ogretmen-katildi/icerik/2276) — öğretmen destek yaklaşımı.
[31]: [ICO — Age Appropriate Design Code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/) — çocuk yararı, veri minimizasyonu ve varsayılan gizlilik.
[32]: [FTC — COPPA Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa) — çocuk çevrim içi gizlilik çerçevesi.
[33]: [FTC — COPPA guidance for ed-tech and schools](https://www.ftc.gov/business-guidance/blog/2020/04/coppa-guidance-ed-tech-companies-schools-during-coronavirus) — eğitim teknolojisi veri soruları.
[34]: [UNICEF — AI for children](https://www.unicef.org/innocenti/projects/ai-for-children) — çocuk hakları merkezli yapay zekâ rehberi.
[35]: [W3C COGA guidance](https://www.w3.org/TR/coga-usable/) — bilişsel erişilebilirlik amaçları.
[36]: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) — erişilebilirlik standardı.
[37]: [W3C — Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — dokunma hedefi ölçütü.
[38]: [W3C — Audio Control](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html) — kullanıcı kontrollü ses ilkesi.
