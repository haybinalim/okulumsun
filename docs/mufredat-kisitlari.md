# Müfredat Kısıtları — MEB 2024, 1. Sınıf Matematik

Bu belge, uygulamanın üreteceği HİÇBİR sorunun aşamayacağı sınırları kaydeder.
Kaynak: `docs/meb-ilkokul-matematik-2024.pdf` (resmî program, 160 sayfa).
Çıkarılmış metin: `docs/meb-matematik-2024-metin.txt` (`===== SAYFA n =====` ile bölümlü).

Şüphede kalınca **kaynağa dön**. Buradaki her madde kaynaktan doğrulanmıştır ve
sayfa numarası verilmiştir.

---

## 1. Kapsam: 19 öğrenme çıktısı, 180 ders saati, 7 tema

Temalar **resmî öğretim sırasıyla** (yıl geometriyle başlar, sayılarla değil):

| # | Tema | Çıktı | Saat | Kazanımlar |
|---|---|---|---|---|
| 1 | Nesnelerin Geometrisi (1) | 2 | 15 | MAT.1.3.1, MAT.1.3.2 |
| 2 | Sayılar ve Nicelikler (1) | 7 | 57 | MAT.1.1.1 – MAT.1.1.7 |
| 3 | Sayılar ve Nicelikler (2) | 1 | 18 | MAT.1.1.8 |
| 4 | İşlemlerden Cebirsel Düşünmeye | 4 | 50 | MAT.1.2.1 – MAT.1.2.4 |
| 5 | Sayılar ve Nicelikler (3) | 1 | 7 | MAT.1.1.9 |
| 6 | Nesnelerin Geometrisi (2) | 3 | 15 | MAT.1.3.3 – MAT.1.3.5 |
| 7 | Veriye Dayalı Araştırma | 1 | 10 | MAT.1.4.1 |

Ayrıca 8 saat "okul temelli planlama" (172 + 8 = 180).

Kazanımların tam resmî metni ve süreç bileşenleri: `src/content/kazanimlar.json`.

---

## 2. Sayısal sınırlar — ihlal edilemez

### Ritmik sayma (MAT.1.1.5) — **program biçimleri TEK TEK sayıyor**

Resmî metin (SAYFA 23):

> "100'e kadar (100 dâhil) ileriye doğru **birer, beşer ve onar**; **20'ye kadar ileriye
> doğru ikişer** ve **20'den geriye doğru birer ve ikişer** ritmik sayma etkinlikleri yapılır."

Yani geçerli (yön, adım, sınır) üçlüleri **yalnızca** şunlar:

| Yön | Adım | Sınır |
|---|---|---|
| ileri | 1 | ≤ 100 |
| ileri | 5 | ≤ 100 |
| ileri | 10 | ≤ 100 |
| ileri | 2 | **≤ 20** |
| geri | 1 | **20'den** |
| geri | 2 | **20'den** |

**Kapsam dışı:** 100'e kadar ikişer · geriye beşer/onar · üçer, dörder ve diğer adımlar.

> Bu, kolayca gözden kaçan bir asimetri. "adım ∈ {1,2,5,10}, yön ∈ {ileri,geri}"
> biçiminde genel bir jeneratör müfredat dışı soru üretir.

### Toplama / çıkarma (MAT.1.2.1 – MAT.1.2.4)
- Sonuç **0–20** aralığında. Negatif sonuç yok.
- Program **"üzerine sayma"** stratejisini açıkça anıyor — jeneratör bunu desteklemeli
  (büyük sayıyı önce koy: 7+2, 2+7 değil).
- Vurgu işlem yapmakta değil **muhakemede**: tahmin, zihinden işlem (MAT.1.2.2),
  eşit işaretinin anlamı (MAT.1.2.3 — `7 = 3 + 4` de geçerli bir cümledir),
  toplama-çıkarma ters ilişkisi (MAT.1.2.4).

### Sayılar (MAT.1.1.1)
- Rakamlar ve **20'ye kadar** sayılar (20 dâhil).
- Ritmik saymada 100'e çıkılır (yukarı bkz.) ama nesne sayma ve işlem 20 sınırında.

### Karşılaştırma (MAT.1.1.4)
- **Terimlerle**: "çok", "daha çok", "az", "daha az", "eşit".
- **Sembol YOK.** `<`, `>`, `=` karşılaştırma sembolleri 1. sınıfta öğretilmiyor.

### Para (MAT.1.1.9)
- **Banknot**: 1, 5, 10, 20, 50, 100, 200 TL.
- Yalnızca **tanıma** ve değer büyüklüğü. Para toplama/üstü hesaplama **yok**.
- Madeni para ve kuruş bu kazanımda geçmiyor.

### Ölçme (MAT.1.1.8)
- **Uzunluk VE kütle**, standart olmayan birimlerle.
- Odak **tahmin** ve tahminin doğruluğunu değerlendirme.
- Standart birimler (cm, kg) 1. sınıfta yok.

### Geometri (MAT.1.3.3 – MAT.1.3.5)
- Önce **yuvarlak / köşeli** ayrımı (MAT.1.3.3).
- Şekiller: üçgen, kare, dikdörtgen, **çember**. ("daire" değil — program çember diyor.)
- Kenar ve köşe sayısıyla tanımlama.

---

## 3. Kapsam DIŞI — 1. sınıfta yok

| Konu | Nerede |
|---|---|
| **Saat okuma, zaman ölçü birimleri** | **2. sınıf.** 1. sınıfta hiç yok. |
| Standart ölçü birimleri (cm, m, kg) | Sonraki sınıflar |
| Karşılaştırma sembolleri `< > =` | Sonraki sınıflar |
| Çarpma, bölme, kesir | Sonraki sınıflar |
| 20'yi aşan işlem | Sonraki sınıflar |
| Üçer/dörder ritmik sayma | Sonraki sınıflar |

---

## 4. Ürün kısıtları (müfredattan bağımsız, aynı derecede bağlayıcı)

1. **Çocuk okuma yazma bilmiyor.** Her madde `readingLoad` taşır
   (0 = hiç okuma gerekmez; rakam serbest). Matematikte hedef **0**.
   Talimat metinle değil **sesle** verilir.
2. **Soru üretimi deterministik.** Tohumlu RNG; `Math.random()` yasak.
   Aynı tohum → birebir aynı soru. Yapay zeka soru üretmez.
   Gerekçe: %99 doğruluk yetersiz — bir aritmetik hatası çocuğa yanlış öğretir.
3. **Ceza yok.** Kırmızı, `X`, buzzer, "yanlış" kelimesi yasak.
4. **Çeldiriciler tanılayıcı.** Rastgele değil; her yanlış şık `diagnosticTag`
   taşır ve belirli bir yanlış zihinsel modeli temsil eder.
5. **Tek dokunma.** Sürükle-bırak yok (akıllı tahtalarda tek noktalı IR dokunma
   sürüklemeyi kaçırıyor). Yerine dokun-seç → dokun-yerleştir.
6. **Erişim bölgesi.** Akıllı tahtada dokunulabilir öğeler ekranın alt %65'inde.
7. Kod yorumları ve kullanıcıya görünen metin **Türkçe**.
