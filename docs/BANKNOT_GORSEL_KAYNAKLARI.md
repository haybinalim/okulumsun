# Banknot Görsel Kaynakları

## Amaç ve kullanım sınırı

Para tanıma ile para sıralama etkinliklerinde, Türkiye Cumhuriyet Merkez Bankası’nın (TCMB) dolaşımdaki E9 5. tertip kupürler için yayımladığı **ön yüz örnek banknot görselleri** kullanılmaktadır. Uygulamadaki görseller, yalnızca ilk sınıf matematik öğretiminde banknot değerlerini ayırt etmeyi desteklemek amacıyla yerel PWA varlığı olarak paketlenmiştir.

> Her görsel, TCMB kaynağındaki kırmızı **`ORNEKTIR GECMEZ`** ibaresini korur. Görseller ödeme aracı olarak kullanılabilecek bir kopya üretmek veya gerçek banknotu taklit etmek amacıyla değiştirilmez.

| Kupür | Yerel varlık | Resmî TCMB kaynak sayfası | Doğrudan TCMB örnek görseli |
| --- | --- | --- | --- |
| 5 TL | `public/images/banknotlar/5-tl-on-yuz-resmi.webp` | [5 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/5+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/c0ca218c-193f-4338-8e6a-9fc03d6b8452/1/5+TL_E9_T5_onyuz_ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |
| 10 TL | `public/images/banknotlar/10-tl-on-yuz-resmi.webp` | [10 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/10+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/e73b1e6c-8209-4c4a-a4a7-8df33b707096/1/10TL_E9_T5_on+yuz_ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |
| 20 TL | `public/images/banknotlar/20-tl-on-yuz-resmi.webp` | [20 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/20+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/900a153a-21a8-4cf6-8c28-4c315bb3c4fb/1/20+TL_E9_T5_onyuz_ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |
| 50 TL | `public/images/banknotlar/50-tl-on-yuz-resmi.webp` | [50 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/50+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/a11cb59f-fbbe-4bbb-ad4b-d24d1258843a/1/E9_T5_50TL_onyuz_ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |
| 100 TL | `public/images/banknotlar/100-tl-on-yuz-resmi.webp` | [100 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/100+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/7e8e9644-7f77-4f49-9b3d-07dcc54c2a64/1/E9-T5-100TL-on+yuz-ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |
| 200 TL | `public/images/banknotlar/200-tl-on-yuz-resmi.webp` | [200 Türk Lirası](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Banknotlar/Dolasimdaki+Banknotlar/5.+Tertip+Banknotlar/200+Turk+Lirasi/) | [Ön yüz örneği](https://www.tcmb.gov.tr/wps/wcm/connect/5091beb6-1687-4904-a3ed-eae91c31c93b/1/200+TL_E9_T5_onyuz_ORNEKTIR+GECMEZ.jpg?MOD=AJPERES) |

## Teknik uygulama

Görseller, görünüm değiştirilmeden WebP biçimine dönüştürülmüştür. Bu dönüşüm yalnızca çevrimdışı PWA yükleme boyutunu düşürür; kupür, kompozisyon ve `ORNEKTIR GECMEZ` ibaresi korunur. `vite.config.ts` içindeki Workbox önbellek deseni WebP dosyalarını da içerir; bu nedenle etkinlikler ilk yüklemeden sonra ağ bağlantısı olmadan kullanılabilir.

## Kullanım koşulu

TCMB’nin [Kullanım Şartları](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/Kullanim+Sartlari) sayfasına göre içerik kaynak gösterilerek yayımlanabilir. Uygulamanın ticari olarak dağıtılması, tanıtımda kullanılması veya görsellerin bu eğitim bağlamının dışında yeniden kullanılması planlanırsa, dağıtımdan önce TCMB’den yazılı izin alınmalıdır.
