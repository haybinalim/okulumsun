# ADR-0001: Karar kayıtları ve birleştirme yöntemi

- **Durum:** Kabul
- **Tarih:** 2026-10-12
- **Karar sahibi:** Geliştirici + kullanıcı · **Kullanıcı onayı:** Kullanıcı kararı 11 Eki 2026 (geliştirme planı v2 KG-14)
- **İlgili:** PLAN §0 kural 1, Adım 17, eksik G04/E14/E15

## Bağlam

Proje tek geliştiriciyle ve farklı yapay zeka oturumlarıyla ilerliyor; oturumlar arasında hafıza yok. Geri dönüş maliyeti olan kararlar (veri, yayın, ses, lisans, ticari model, mağaza) şimdiye kadar konuşmalarda ve depo dışındaki planda kaldı. PR'lar kararlara bağlanmıyordu ve birleştirme yöntemi yazılı değildi.

## Seçenekler

1. Kararları yalnız PLAN.md'de tutmak — tek dosya, ama gerekçe ve seçenekler kaybolur.
2. `docs/ADR/` altında numaralı karar kayıtları + PR şablonunda ADR alanı — izlenebilir, biraz ek yazı.
3. Kararları depo dışında (sohbet, plan raporu) tutmak — bugünkü durum; yeni oturum göremez.

Birleştirme yöntemi: (a) merge-commit · (b) squash · (c) rebase.

## Karar

Seçenek 2 ve birleştirme yöntemi (a) **merge-commit**. ADR'ler depoda oldukları için her oturum okuyabilir; merge-commit dal geçmişini ve deponun "Merge pull request #N" geleneğini korur (Kaynak: KG-14).

**ADR ne zaman zorunludur:** (1) geri dönüş maliyeti olan karar; (2) `depolamaIzinListesi.ts`'e anahtar ekleme; (3) PLAN'daki bir YASAK'a istisna; (4) yeni üçüncü taraf varlık, hizmet veya lisans. Bunların dışındaki küçük kararlar commit mesajında gerekçelendirilir (ADR enflasyonunu önlemek için).

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: `docs/ADR/`, `.github/pull_request_template.md`, PLAN §0 kural 1 (öncelik sırasına "Kabul edilmiş ADR'ler").
- Test / kanıt: `tests/unit/adrBicimi.spec.ts`; bağlı ADR'si `Kabul` olmayan PR birleştirilmez.

## Gizlilik etkisi

Yok. Bu kayıt süreç kararıdır; Sıfır Veri Sözleşmesi'ne dokunmaz.

## Lisans ve üçüncü taraf etkisi

Yok.

## Geri dönüş maliyeti

Düşük: belge revert'i.

## Kabul koşulları

- [x] Kullanıcı birleştirme yöntemini seçti (merge-commit, 11 Eki 2026).
- [x] `docs/ADR/README.md` dizini ve şablon depoda.
