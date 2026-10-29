# Banknot Görsel Kaynakları

> **Durum (29 Ekim 2026, KG-122 — kullanıcı kararı):** Banknotlar ekranda, basılı çalışma kâğıtlarında ve
> kâğıt arşivinde TCMB'nin E9 5. tertip **ön yüz örnek görselleridir** ("ÖRNEKTİR GEÇMEZ"). Gerekçe
> (kullanıcı): "çocuklar gerçek para öğrenimi ve çağrışım yapma oluşturmalıyız. şematikte okuma bilmek
> zorunda ayrıca bu gerçek para değil izlenimi veriyor". KG-121'in (her yerde şematik) ve KG-19 şematik
> kuralının yerine geçer; `SematikBanknot` silindi. Ekran `TcmbBanknot` / `Visual` → `Banknot`, kâğıt
> `KagitSayfalari` → `BanknotGorseli` (aynı dosyalar, `src/ui/svg/banknotAssets.ts`).

## Amaç ve kullanım sınırı

Para tanıma ile para sıralama etkinliklerinde, Türkiye Cumhuriyet Merkez Bankası’nın (TCMB) dolaşımdaki E9 5. tertip kupürler için yayımladığı ön yüz örnek banknot görselleri kullanılır. Görseller yalnızca ilk sınıf matematik öğretiminde banknot değerlerini ayırt etmeyi desteklemek amacıyla yerel PWA varlığı olarak paketlenir.

> Her görsel, TCMB kaynağındaki kırmızı **`ÖRNEKTİR GEÇMEZ`** ibaresini korur. Görseller ödeme aracı olarak kullanılabilecek bir kopya üretmek veya gerçek banknotu taklit etmek amacıyla değiştirilmez.

## TCMB çoğaltma koşulları ve uyum

Birincil kaynak: TCMB, [Banknotların Çoğaltılması](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Banknotlarla+ilgili+Genel+Bilgiler/Banknotlarin+Cogaltilmasi) —
"Banknotların Resim ve Görüntülerinin Çoğaltılması ve Yayınlanması ile İlgili Duyuru" (Resmî Gazete 24.02.2004/25383, s. 86–89;
madde 5 değişik 13.10.2004/25612). Duyuruya göre (alıntı) banknotların:

> **1.** En ve boyunun %125'inden daha büyük veya %75'inden daha küçük bir şekilde tek taraflı olarak çoğaltılması veya,
> **2.** En ve boyunun %200'ünden daha büyük veya %50'sinden daha küçük bir şekilde çift taraflı olarak çoğaltılması veya,
> **3.** Kağıttan farklı bir malzeme üzerine (örneğin metal üzerine) basılması durumunda, orijinal banknot boyutunda veya farklı boyutlarda çoğaltılması veya,
> **4.** Orijinal banknotların boyutunda çözünürlüğünün 72 dpi […] geçmemesi koşuluyla elektronik ortamda çoğaltılması ve
> **5.** Elektronik ortamda yapılan çoğaltmalarda, çoğaltmaların üzerine “ÖRNEKTİR GEÇMEZ” veya “SPECIMEN” ibaresinin; uzunluğu yapılan çoğaltmanın uzunluğunun en az %75'i, yüksekliği ise yapılan çoğaltmanın genişliğinin en az %15'i olacak şekilde, şeffaf olmayan (mat) ve banknotun hakim rengine zıtlık oluşturan bir renkte, çaprazlama olarak Arial veya Arial tarzına yakın bir yazı tipinde, çift taraflı çoğaltmalarda çoğaltmaların her iki yüzünde de yer alacak şekilde basılması,
>
> uygundur.

Duyuru izin başvurusu istemez; kâğıda basmayı yasaklamaz. Uygulama:

| Koşul | Nasıl sağlanıyor | Koruma |
| --- | --- | --- |
| Madde 4 (elektronik, ≤ 72 dpi) | Dosyalar gerçek ölçüde 72 dpi'ın altına yeniden örneklendi (ör. 5 TL 130 mm → 368 px). Ekranda kart büyüklüğüne göre ölçeklenir; dosya çözünürlüğü sınırı aşmaz | `tests/unit/paraGorseli.spec.ts` (WebP başlığından piksel ≤ `tcmbEnBuyukPiksel`) |
| Madde 5 (ibare) | TCMB'nin kendi örnek görselindeki kırmızı, çapraz "ÖRNEKTİR GEÇMEZ" değiştirilmeden korunur. Ölçütü TCMB'nin yayımladığı görselin karşıladığı kabul edilir (ayrıca ölçülmedi) | görsel inceleme |
| Madde 1 (kâğıt, tek taraflı, < %75) | Yalnız ön yüz, kâğıdın tek yüzünde; genişlik 150 CSS px ≈ 39,7 mm (5 TL'de %30,5, 200 TL'de %24,8) | `paraGorseli.spec.ts` (her kupürde en ve boy < %75) |

Arşiv PDF'leri hem basılı hem elektronik çoğaltma sayılabileceği için aynı ≤ 72 dpi dosyalar kullanılır (39,7 mm'de etkin ≈ 235–290 dpi).

## Kullanım şartı (site)

TCMB [Kullanım Şartları](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/Kullanim+Sartlari): "Sitede yer alan bilgiler, kaynak gösterilmek suretiyle yayımlanabilir; ancak bu bilgilerin ticari amaçlarla kullanımı TCMB’nin yazılı iznine tabidir." Kaynak Kaynaklar ekranında, veli panelinde, LICENSES.md'de ve bu belgede gösterilir. İlk 12 ay satış yoktur (ADR-0014); okul/kurum lisansı satışından önce TCMB'den yazılı izin alınmalı veya karar yeniden değerlendirilmelidir. **TCMB'ye başvuru yapılmadı** (KG-19); metinler izin/onay iddia etmez.

## Teknik uygulama

TCMB'nin yüksek çözünürlüklü JPEG örnekleri (29 Ekim 2026'ya kadar depoda ~1 500–1 900 px WebP olarak duruyordu, git geçmişi `de15337^`) Lanczos ile yukarıdaki piksel ölçülerine indirildi ve WebP (kalite 90) olarak kaydedildi (her biri 24–37 KB). 5 TL kaynağının alt kenarındaki 18 piksellik yeşil şerit (kaynak dosyada banknota ait olmayan bir kenar artığı) kırpıldı; başka değişiklik yok. Görseller JS paketine gömülmez; `vite.config.ts` Workbox deseni WebP'yi içerir, etkinlikler ilk yüklemeden sonra çevrimdışı çalışır.

## Kupürler

| Kupür | Yerel varlık (piksel, gerçek boyutta ≈ 71,9 dpi) | Resmî TCMB kaynak sayfası | Doğrudan TCMB örnek görseli |
| --- | --- | --- | --- |
| 5 TL | `public/images/banknotlar/5-tl-on-yuz-resmi.webp` (368×181) | [5 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/5+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/c0ca218c-193f-4338-8e6a-9fc03d6b8452/1/5+TL_E9_T5_onyuz_ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |
| 10 TL | `public/images/banknotlar/10-tl-on-yuz-resmi.webp` (385×181) | [10 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/10+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/e73b1e6c-8209-4c4a-a4a7-8df33b707096/1/10TL_E9_T5_on+yuz_ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |
| 20 TL | `public/images/banknotlar/20-tl-on-yuz-resmi.webp` (402×192) | [20 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/20+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/900a153a-21a8-4cf6-8c28-4c315bb3c4fb/1/20+TL_E9_T5_onyuz_ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |
| 50 TL | `public/images/banknotlar/50-tl-on-yuz-resmi.webp` (419×192) | [50 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/50+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/a11cb59f-fbbe-4bbb-ad4b-d24d1258843a/1/E9_T5_50TL_onyuz_ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |
| 100 TL | `public/images/banknotlar/100-tl-on-yuz-resmi.webp` (436×204) | [100 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/100+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/7e8e9644-7f77-4f49-9b3d-07dcc54c2a64/1/E9-T5-100TL-on+yuz-ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |
| 200 TL | `public/images/banknotlar/200-tl-on-yuz-resmi.webp` (453×204) | [200 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/200+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/5091beb6-1687-4904-a3ed-eae91c31c93b/1/200+TL_E9_T5_onyuz_ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |

