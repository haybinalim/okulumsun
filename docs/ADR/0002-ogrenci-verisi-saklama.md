# ADR-0002: Öğrenci verisi saklama

- **Durum:** Önerildi
- **Tarih:** 2026-10-12
- **Karar sahibi:** Kullanıcı + hukuki görüş · **Kullanıcı onayı:** Bekliyor (hukuki görüş: §16 K-9)
- **İlgili:** PLAN §10, Adım 39, 52, `src/persistence/veriSaklamaPolitikasi.ts`, KG-11

## Bağlam

Bugünkü politika (Seçenek A): geliştirme sürümünde öğrenci veya veli verisi saklanmaz; Dexie kalıcılık katmanı kodda var ama `OGRENCI_VERISI_SAKLANIR_MI = false` ile kapalı. Kişisel modda ilerleme, zorlanılan konular ve yedekleme özellikleri bu yüzden kapalı (PLAN §14 Adım 8 ve 9 kısmi). Uygulama 6–7 yaş çocuklara yönelik; KVKK ve veli onayı ağır basar.

## Seçenekler

1. **A — Sıfır veri her modda** (bugünkü durum): risk yok, ama kişisel modda kaldığı yerden devam ve veli ilerleme görünümü yok.
2. **B — Tahta sıfır veri; kişisel modda yalnız cihazda, anonim, veli onaylı kayıt**: veli değeri artar; hukuki görüş ve onay akışı gerekir.
3. **C — Sunucuda hesap ve senkron**: çok cihaz; KVKK yükü, veri sorumlusu kaydı ve güvenlik işi çok büyük. Kapsam dışı.

## Karar

Önerilen: **tahta = A (değişmez)**; **kişisel = B yalnız kabul koşulları sağlandığında**. Bu ADR `Önerildi` durumundayken hiçbir kod davranışı değişmez; kişisel mod da sıfır veridir.

## Sonuçlar

- Değişen dosyalar / PLAN bölümleri: kabulde `veriSaklamaPolitikasi.ts`, `depolamaIzinListesi.ts`, veli onay ekranı, PLAN §10.
- Test / kanıt: depolama casusu birim testleri ve `onizleme-gizlilik-ag` e2e (Adım 26); tahta modunda sıfır yazım testi.

## Gizlilik etkisi

Projenin gizlilik anayasasıdır. Sıfır Veri Sözleşmesi madde 1 (tahta her koşulda sıfır veri) bu ADR kabul edilse de değişmez. Madde 2 yalnız bu ADR `Kabul` + hukuki görüş + Adım 52 ile gevşer. Her yeni yerel anahtar izin listesine ADR ile eklenir.

## Lisans ve üçüncü taraf etkisi

Yeni bağımlılık yok (Dexie zaten var). Hukuki görüş dış hizmettir.

## Geri dönüş maliyeti

Orta: kabul sonrası saklanan verinin silinmesi için göç ve veli bildirimi gerekir.

## Kabul koşulları

- [ ] Avukattan KVKK görüşü (yazılı).
- [ ] Veli onay akışı maketi pilotta denendi (gözlem formu V1–V3).
- [ ] Tahta modunda sıfır yazım e2e ile kanıtlı.
- [ ] Kullanıcı onayı.
