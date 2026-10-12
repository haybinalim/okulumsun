# ADR-0006: Çalışma kâğıdı: HTML ve yazdırma

- **Durum:** Taslak
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici · **Kullanıcı onayı:** Gerekmez
- **İlgili:** Adım 35, 48

## Bağlam

Öğretmenler yazdırılabilir çalışma kâğıdı ve cevap anahtarı istiyor. Çalışma anında PDF kütüphanesi paket boyutunu büyütür ve yeni lisans getirir.

## Seçenekler

1. **HTML + yazdırma CSS'i (`window.print`)** — bağımlılık yok, tarayıcı PDF'e kaydedebilir.
2. **Çalışma anında PDF kütüphanesi (jsPDF, pdfmake)** — tam düzen kontrolü; paket büyür, lisans envanteri büyür.
3. **Derleme anında üretilmiş statik PDF'ler** — SEO için iyi (Adım 48), kişiselleştirme yok.

## Karar

Henüz karar verilmedi. Bu kayıt seçenekleri ve kabul koşullarını sabitler; bağlı adım başlamadan önce `Önerildi` durumuna getirilir. Eğilim: 1 (ekranda) + 3 (arşiv).

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: kâğıt ekranı, yazdırma CSS'i.
- Test / kanıt: yazdırma önizlemesi e2e görüntüsü.

## Gizlilik etkisi

Kâğıt tohum + içerik kodundan üretilir; öğrenci adı alanı boş bırakılır, uygulama ad istemez.

## Lisans ve üçüncü taraf etkisi

Seçenek 2 seçilirse yeni bağımlılık lisansı K10'a girer.

## Geri dönüş maliyeti

Düşük.

## Kabul koşulları

- [ ] Seçenek seçildi.
- [ ] Tahta ve A4 düzeni denendi.
