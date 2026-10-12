# Karar kayıtları (ADR)

Geri dönüş maliyeti olan her karar burada numaralı bir kayıtla tutulur. Kural ve birleştirme yöntemi
[ADR-0001](0001-karar-kayitlari.md)'dedir. Bağlı ADR'si `Kabul` olmayan bir PR birleştirilmez.

## Dizin

| No | Başlık | Durum | Bağlı adım |
|---|---|---|---|
| [0000](0000-sablon.md) | Şablon | Şablon | 17 |
| [0001](0001-karar-kayitlari.md) | Karar kayıtları ve birleştirme yöntemi | Kabul | 17 |
| [0002](0002-ogrenci-verisi-saklama.md) | Öğrenci verisi saklama | Önerildi | 39, 52 |
| [0003](0003-yayin-tek-kaynak.md) | Tek yayın kaynağı ve güvenlik başlıkları | Önerildi | 22 |
| [0004](0004-ses-kaynagi-ve-lisans.md) | Ses kaynağı ve lisans | Önerildi | 15, 18, 31, 54, 58 |
| [0005](0005-yerel-hata-gunlugu.md) | Yerel hata günlüğü | Önerildi | 23 |
| [0006](0006-calisma-kagidi-pdf.md) | Çalışma kâğıdı: HTML ve yazdırma | Taslak | 35, 48 |
| [0007](0007-isinma-kesfi-plan-6-5.md) | Isınma Keşfi ve PLAN §6.5 | Taslak | 47 |
| [0008](0008-sinif-turu-isbirlikci-gosterim.md) | Sınıf Turu: iş birlikçi gösterim | Taslak | 36 |
| [0009](0009-magaza-varligi.md) | Mağaza varlığı | Taslak | 50, 51 |
| [0010](0010-eve-link-url-sozlesmesi.md) | Eve link URL sözleşmesi | Taslak | 42 |
| [0011](0011-cok-ders-mimarisi.md) | Çok ders mimarisi | Taslak | 57 |
| [0012](0012-cok-dilli-ses.md) | Çok dilli ses | Taslak | 58 |
| [0013](0013-uygulama-lisansi.md) | Uygulama lisansı | Kabul | 20 |
| [0014](0014-ticari-model-ve-ucuncu-taraf-varliklar.md) | Ticari model ve üçüncü taraf varlık izinleri | Kabul | 21, 29, 35, 48, 56 |

## Durum sözlüğü

| Durum | Anlamı |
|---|---|
| `Taslak` | Seçenekler yazıldı, karar yok. Bağlı adım başlamadan `Önerildi` olur. |
| `Önerildi` | Önerilen karar ve kabul koşulları yazıldı; karar sahibinin onayını bekliyor. Kod davranışı değişmez. |
| `Kabul` | Karar geçerli; bağlı PR'lar birleştirilebilir. |
| `Reddedildi` | Önerilen karar uygulanmayacak; kayıt gerekçesiyle kalır. |
| `Yerine geçti: NNNN` | Yeni bir ADR bu kararın yerini aldı; eski kayıt silinmez. |

Akış: `Taslak` → `Önerildi` → `Kabul` / `Reddedildi` → `Yerine geçti: NNNN`.

## ADR ne zaman zorunludur

1. Geri dönüş maliyeti olan karar (veri, yayın, ses, lisans, ticari model, mağaza).
2. `src/persistence/depolamaIzinListesi.ts` izin listesine anahtar ekleme.
3. PLAN'daki bir YASAK'a istisna.
4. Yeni üçüncü taraf varlık, hizmet veya lisans.

Bunların dışındaki küçük kararlar commit mesajında gerekçelendirilir.

## Yeni ADR

[`0000-sablon.md`](0000-sablon.md)'yi kopyalayın, sıradaki numarayı verin, bu tabloya satır ekleyin.
`tests/unit/adrBicimi.spec.ts` başlıkları, numara sırasını ve bu tabloyu denetler.
