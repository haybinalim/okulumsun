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
- Banknot ekranda TCMB'nin resmî "ÖRNEKTİR GEÇMEZ" görselidir (K5, ayrı kural); kâğıtta `SematikBanknot`.
  Bu rehber banknotu yeniden çizmez.

## 2. Stil

Sıcak, çocuk kitabı kalitesinde **düz illüstrasyon**. Gradyan yerine düz tonlar: 64 px'te ve gri tonlu baskıda daha net.

| Öğe | Kural |
|---|---|
| Tonlar | Nesne başına 3–5 ton: **temel** + **gölge** (sağ alt hilal) + **ışık** (sol üst parıltı) + **koyu kontur**; isteğe bağlı sabit parça rengi (yaprak, gaga, cam, lastik). |
| Işık yönü | Her zaman **sol üst**. Gölge hilali, gövdenin sol üste kaydırılmış kopyasının maskeyle çıkarılmasıyla çizilir (`Govde`), böylece her biçimde hattı izler. Şekil döndürülürse kaydırma ters döndürülür (`golgeKaydirmasi`) — ekranda gölge yine sağ altta. |
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
PDF'i ve etki Form A/B renkli basılır; `?gelistirme=nesneler&gri=1` ile gri görünüm denetlenir.

## 5. Teknik

- Maske ve kırpma kimlikleri `useId` → `guvenliKimlik` ile **örnek başına tektir** (aynı sahnede 20 elma çakışmaz; test her
  `url(#…)` başvurusunun aynı belgede çözüldüğünü denetler).
- Yalnız `transform`/`opacity` hareketi olan üst bileşenler değişmedi; çizimlerde animasyon yok (hareket azalt kuralları etkilenmez).
- Boyut: geometri dizeleri modül düzeyinde sabit; yıldız yüzeyleri modül yüklenince bir kez hesaplanır. JS bütçesi `npm run boyut`.
- Yeni nesne eklerken: `NESNE_SPRITELARI` + ses kliği (`nesne.*`) + `DOGAL_RENK` + `CIZIMLER` dalı; `Govde` ile temel/gölge/ışık/kontur,
  ışık sol üst, kontur 3,5; katalogda 64 ve 102 px, gri görünümde bak.
