# Konumlandırma — kaynaklı iç belge (plan v2 Adım 38, KG-51)

> **İç belge.** Tanıtım sayfası (`public/ogretmen/`) rakip markası **anmaz**; sayfadaki her karşılaştırmalı
> cümlenin dayanağı buradadır. Kaynaklar **13 Ekim 2026**'da açılıp okundu. Yayından önce yeniden kontrol edilir
> (plan v2 Adım 38 "doğrulanmamış varsayımlar"): fiyat ve paket içerikleri değişebilir.

## 1. Sayfada kullanılacak ölçülü ifadeler

| # | Sayfadaki ifade (marka anılmaz) | Dayanak (bu belge) | Bizim tarafın kanıtı |
|---|---|---|---|
| K1 | "Çalışma kâğıtları dâhil her şey koşulsuz ücretsiz; hesap yok." | §2.1 | ADR-0014 (ilk 12 ay satış yok), Adım 35 çalışma kâğıdı, hesapsız kullanım |
| K2 | "Tek tahta yeter; öğrencinin cihazı gerekmez." | §2.2 | Tahta modu + Sınıf Turu (Adım 36): tek ekranda ortak oyun |
| K3 | "Çalışma anında yapay zekâ yok, öğrenci verisi yok." | §2.3 | `OGRENCI_VERISI_SAKLANIR_MI = false`, K9 gizlilik taraması, e2e `onizleme-gizlilik-ag` |
| K4 | "EBA'nın yanında açılan, ondan veri istemeyen bir ders aracı." | §2.3 | Hesap/oturum yok; EBA'ya bağlanmaz (G43 hazırlığı) |
| K5 | "Puan, sıralama ve kazanan yok." | §2.2 (karşıt örnek) | ADR-0008 Kabul (KG-49) |

**Yasak dil:** "kanıtlandı", "en iyi", "tek", "bilimsel olarak", rakip adı, rakibin fiyatı. Ölçülmemiş sayı yazılmaz
(içerik hacmi yalnız `docs/tekil-soru-sayisi.json` ve `npm run durum` çıktısından).

## 2. Kaynaklar ve okunan durum

### 2.1 Okulistik — çalışma kâğıtları ücretli kurumsal pakette

- Kaynak: Okulistik, "Öğretmen Üyelik Paketleri", https://www.okulistik.com/anasayfa/ogretmen-uyelik-paketleri.html
  (13 Eki 2026). Tabloda "Çalışma Kağıtları" satırı: Tanışma (Demo) ❌, E-İçerik Paketi ❌, **Kurumsal E-İçerik
  Pro Paket ✅**. Pro pakete geçiş koşulu (ilkokul sınıf öğretmeni): "Şubenizde 10 adet aktif Öğrenci E-İçerik Paketi
  olması".
- Aynı sitenin ana sayfasında kurumsal "İlkokul Pro Paket" fiyatla listeleniyor (https://www.okulistik.com/anasayfa/index.html).
  Fiyat sayfaya yazılmaz (değişken; marka anılmaz).
- Okulistik'in basılı "Çalışma Kâğıtları" ürünü ayrıca satılan yardımcı kaynaktır
  (https://www.okulistik.com/anasayfa/calisma-kagitlari.html).

### 2.2 Matific Play — her öğrenci kodla kendi cihazından katılır, puan tablosu var

- Kaynak: Matific, "Matific Play", https://www.matific.com/tr/tr/home/matific-play/ (13 Eki 2026): "Bir etkinlik seçin ·
  Kodu sınıfınızla paylaşın · Öğrencileriniz kodu girip başlasın"; "Tek bir oturuma 60 öğrenci katılabilir"; "Herkes
  katıldığında, etkinliğe başlayın ve **puan tablosunu** takip edin"; sıralama "zamana, puana veya her ikisine göre" ya
  da ilerleme panosu seçilebilir. Matific Play ücretsiz ve hesapsız.
- Çıkarım (bizim): oturum, katılan öğrenci sayısı kadar cihaz ister; tek tahtalı, cihazsız sınıfta kullanılamaz.
  Bizim fark K2 (tek tahta) ve K5 (puan/sıralama yok); "ücretsiz" farkı **değildir** (Matific Play de ücretsiz).

### 2.3 EBA — 2026–27'de yapay zekâ destekli kişiselleştirme ve öğrenme geçmişi takibi

- Kaynak: Türkiye Gazetesi, "Millî Eğitim'de dijital devrim! Yeni EBA'da yapay zekâ asistanı geliyor" (12 Eylül 2026),
  https://www.turkiyegazetesi.com.tr/egitim/milli-egitimde-dijital-devrim-yeni-ebada-yapay-zeka-asistani-geliyor-1815430 —
  "yapay zekâ destekli kişiselleştirme sistemi … öğrencinin sınıfını, derslerdeki ilerlemesini, ulaştığı öğrenme
  çıktılarını, kullandığı içerikleri ve zorlandığı konuları zaman içinde analiz edebilecek"; "öğrenme sürecine ilişkin
  veriler mezuniyete kadar takip edilebilecek"; "Learning Record Store (LRS) adı verilen öğrenme veri tabanı".
- EBA ana sayfası duyurusu: "EBA yenileniyor! Yapay zeka ile desteklenmiş …" (https://prod.eba.gov.tr/, 13 Eki 2026).
- Çıkarım (bizim): EBA kimlikli, veri tutan ve YZ kullanan bir platform; biz onun **yerine** değil **yanında** açılan,
  hesapsız ve veri tutmayan bir ders aracıyız (K3, K4). EBA'yı eleştiren ifade kullanılmaz.

## 3. YZ ilkesi (G49) — sayfadaki kısa metin

"Okulumsun çalışırken yapay zekâ kullanmaz ve çocuktan hiçbir veri almaz. Sorular, sesler ve görseller önceden
hazırlanır; geliştirme sırasında yapay zekâ ile taslak hazırlansa bile her içerik insan tarafından incelenmeden
uygulamaya girmez." (Ek 17.10 özeti; Y5.)

## 4. Açık kalanlar (kullanıcıda)

- İçerik danışmanları listesi (G34): izin veren öğretmen yok → sayfada bölüm **yok**.
- İletişim e-postası: yayımlanacak adres kullanıcı kararı → sayfada yer tutucu, yayından önce doldurulur.
- 30 sn video (Ek 17.7) ve 3 öğretmenle 60 sn testi: kayıt ve deneme kullanıcıda.
