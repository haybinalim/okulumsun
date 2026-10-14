# ADR-0015: IndexedDB katmanı (Dexie'yi küçültme veya değiştirme)

- **Durum:** Kabul
- **Tarih:** 2026-10-14
- **Karar sahibi:** Kullanıcı · **Kullanıcı onayı:** 14 Eki 2026, Seçenek 3 — plan v2 KG-89 (taslak: KG-88)
- **İlgili:** PLAN §10, Adım 26 (K5 boyut bütçesi), ADR-0002, `docs/boyut-analizi.md`, KG-87

## Bağlam

K5 bütçesi `dist/assets/*.js` **toplamını** ölçer: sınır 835 374 B (taban 759 431 B + %10). KG-87 sonrası
`main` 21e9453 ölçümü **833 147 B** (gzip −9 toplamı 262 063 B); pay ~2,2 KB. Kalan en büyük üçüncü taraf
parça Dexie 4.4.4'tür (~93 KB küçültülmüş, Apache-2.0).

Dexie'nin koddaki kullanımı (`grep -rn "dexie\|Dexie\|liveQuery" src`):

- Tek dosya `src/persistence/db.ts`: `class OkulumsunDB extends Dexie`, veritabanı adı `okulumsun`,
  **tek şema sürümü** `version(1)` (IndexedDB'de sürüm **10**; Dexie sürümü ×10 yazar — denemede doğrulandı),
  5 nesne deposu: `learner_mastery` (anahtar `skillId`, indeks `box`, `lastAnsweredAt`), `learner_profile`
  (`id`), `active_session` (`id`), `events` (`++seq` otomatik artan, indeks `ts`, `skillId`), `sessions`
  (`sessionId`, indeks `bitisTs`).
- **Göç yok** (`migrations/index.ts`: `MIGRASYON_ZINCIRI = [1]`). **`liveQuery`/`useLiveQuery` yok.**
  Açık **`transaction()` yok**; her çağrı tek depoda tek işlem.
- Kullanılan tablo yöntemleri (`repository.ts`, `backup.ts`): `get`, `put`, `add`, `delete`, `clear`, `count`,
  `toArray`, `bulkPut`, `bulkDelete`; sorgu olarak yalnız üçü: `events.orderBy('seq').limit(n)`,
  `sessions.where('bitisTs').above(t)` ve `.below(t)`.
- **Bugün veri yazılmıyor:** `OGRENCI_VERISI_SAKLANIR_MI = false` (ADR-0002 `Önerildi`), bütün okuma/yazma
  yolları erken döner. Çalışan tek yol `main.tsx → acilistaTemizle()`: her açılışta (tahta dahil) eski
  sürümlerden kalmış 5 deponun `clear()`'ı. `backup.ts` arayüzden çağrılmadığı için pakete girmez.
- Dexie yine de ilk yük parçasındadır (`index-*.js`), çünkü `main.tsx` ve `useKisiselOturum.ts` depoyu
  statik içe aktarır ve Dexie sınıfı ağaç sallamayla atılamaz.

## Seçenekler

Ölçüm: her seçenek geçici dalda (`deneme/dexie-olcum`, birleştirilmedi, silindi) uygulanıp `npm run build`
alındı. "Toplam" = `dist/assets/*.js` (K5'in ölçtüğü); "ilk yük" = `index.html`'deki giriş betiği +
`modulepreload` parçaları. gz = `gzip -9`, bilgi amaçlı (K5 ham baytı ölçer).

| Seçenek | Toplam (B) | Δ toplam | Toplam gz | İlk yük (B) | İlk yük gz | K5 payı (B) |
|---|---:|---:|---:|---:|---:|---:|
| 0 — bugün (`main` 21e9453) | 833 147 | — | 262 063 | 699 526 | 213 255 | 2 227 |
| 1 — Dexie kalır, tembel yüklenir | 833 830 | **+683** | 262 009 | 603 360 | 181 588 | 1 544 |
| 2 — `idb` 8.0.4 + ince depo katmanı | 742 331 | **−90 816** | 232 152 | 608 710 | 183 344 | 93 043 |
| 3 — doğrudan IndexedDB, kendi sarmalayıcımız | 739 457 | **−93 690** | 231 124 | 605 836 | 182 316 | 95 917 |

1. **Dexie kalır; tembel yükle / yalnız kişisel modda yükle.** `repository` dinamik `import()` arkasına
   alındı; Dexie ayrı parçaya (`repository-*.js`, 96 849 B / gz 31 506 B) taşındı. İlk yük −96 KB, ama
   **toplam +683 B** (parça başlığı + yükleme yardımcısı): K5 toplamı ölçtüğü için bütçe sorunu çözülmez,
   kötüleşir. Ayrıca `acilistaTemizle` her modda çalıştığından parça her açılışta yine indirilir; "yalnız
   kişisel mod" için açılış temizliği ya kaldırılmalı (eski kayıtların silinmesi garantisi zayıflar, Adım 29/E9)
   ya da Dexie'siz `indexedDB.deleteDatabase` ile yapılmalı. Göç riski yok, test etkisi yok, bakım yükü
   Dexie'de. Lisans değişmez (Apache-2.0).
   - **1b — K5 tanımını "ilk yük"e çevirmek.** Bugünkü tanımla ilk yük 699 526 B; yeni ölçütle yeni taban
     gerekir (12 Eki tabanı tek parçalı derlemeden alındı, karşılaştırılamaz). Kod değişmeden bütçe "geçer",
     ama tembel parçalar sınırsız büyüyebilir ve PWA önbelleği (`precache`) yine hepsini indirir; bütçenin
     amacını (çevrimdışı, eski tahta) gevşetir. `scripts/boyut-butcesi.ts`, `docs/boyut-butcesi.json`,
     plan §5.5 K5 değişir.
2. **`idb` (Jake Archibald) ile ince depo katmanı.** `openDB('okulumsun', 10, { upgrade })` + Dexie'nin
   kullandığımız alt kümesini taklit eden ~40 satırlık `Tablo` sınıfı (`get/put/add/delete/clear/count/
   toArray/bulkPut/bulkDelete` + `ilkN`, `ustu`, `alti`). Kazanç −90,8 KB (gz −29,9 KB). `idb` Promise
   sarmalayıcısıdır; işlem ömrü ve hata/`blocked` olayları kütüphanede. Lisans **ISC** (MIT değil; izin
   verici, atıf şartı var) — `node_modules/idb/LICENSE` ve
   https://github.com/jakearchibald/idb/blob/main/LICENSE ile doğrulandı. Yeni çalışma zamanı bağımlılığı:
   K10 envanteri, `LICENSES.md` ve Kaynaklar ekranı güncellenir. Not: `idb@7.1.1` zaten workbox üzerinden
   geliştirme ağacında var; 8.x ayrı sürüm olarak eklenir.
3. **Doğrudan IndexedDB üzerine kendi sarmalayıcımız.** Aynı `Tablo` arayüzü, `indexedDB.open('okulumsun', 10)`
   + `onupgradeneeded` (yalnız eksik depoyu aynı anahtar/indekslerle kurar) + `onversionchange`'de kapatma;
   ~80 satır. Kazanç −93,7 KB (gz −30,9 KB); seçenek 2'den 2 874 B küçük. Yeni bağımlılık yok. İşlem
   tamamlanma (`oncomplete`/`onabort`), `onblocked` ve tarayıcı farkları bizim sorumluluğumuzda.
   - **3b (ölçülmedi, not):** veri yazılmadığı sürece `acilistaTemizle` tek `indexedDB.deleteDatabase('okulumsun')`
     ile yapılabilir ve depo kodu tümden çıkarılabilir (tahmini ek ~2–3 KB). ADR-0002 Seçenek B kabul edilirse
     katman yeniden yazılacağı için önerilmez.

Seçenek 2 ve 3'ün ortak özellikleri:

- **Göç riski düşük.** Aynı veritabanı adı, aynı IndexedDB sürümü (10), aynı depo/anahtar/indeks adları;
  şema yeniden kurulmaz, veri taşınmaz. Geçici uyum testi (fake-indexeddb): Dexie ile `version(1)` yazılan
  profil, otomatik artan `events` ve `sessions` kayıtları sarmalayıcıyla okundu; yeni `add` `seq` 3'ü verdi;
  ardından Dexie aynı veritabanını yeniden açıp 3 kaydı saydı (geri dönüş mümkün). İki tuzak kabul koşuluna
  yazıldı: (a) sürüm **1** ile açmak `VersionError` verir — sabit 10 olmalı; ileride v2 şeması
  Dexie uyumu için 20 olarak yazılır; (b) bugün kullanıcıda okunacak veri yok (saklama kapalı, açılışta
  temizleniyor), bu yüzden gerçek risk ADR-0002 B kabul edildiğinde başlar.
- **Test etkisi küçük.** `persistence.spec.ts` ve `acilistaTemizle.spec.ts` iki sarmalayıcıyla da
  değişmeden geçti (7/7). Değişecekler: `persistence.spec.ts` test adı ("Dexie şeması…"),
  `lisansEnvanteri.spec.ts` örnek bağımlılığı (`dexie`), `gizlilikTarama.spec.ts` örnekleri ve
  `scripts/gizlilik/kurallar.ts` deseni (seçenek 2'de `openDB(` eklenmeli; `indexedDB.open` zaten yalnız
  `src/persistence/` için izinli). `repository.ts`'de 3 sorgu satırı (`orderBy/limit`, `where().above/below`)
  `ilkN/ustu/alti`'ya döner. Dexie ↔ sarmalayıcı uyum testi kalıcı eklenir; Dexie yalnız `devDependencies`'te
  kalır (pakete girmez).
- **Gizlilik taraması / e2e:** depo adları aynı kaldığı için `onizleme-gizlilik-ag` "IndexedDB depoları boş"
  kanıtı aynen çalışır.

| | Boyut (toplam) | Göç riski | Test etkisi | Bakım yükü | Lisans |
|---|---|---|---|---|---|
| 1 tembel | +683 B (K5 çözülmez) | yok | yok | Dexie'de | Apache-2.0 |
| 1b ölçüt değişikliği | 0 (ölçüt gevşer) | yok | boyut testi + taban | düşük | — |
| 2 `idb` | −90 816 B | düşük (aynı ad/sürüm 10) | küçük | düşük (~40 satır + bağımlılık güncellemesi) | ISC |
| 3 kendi | −93 690 B | düşük (aynı ad/sürüm 10) | küçük | orta (~80 satır, kenar durumlar bizde) | yok (kendi kodumuz) |

## Karar

**Seçenek 3** (kullanıcı kararı, 14 Eki 2026, plan v2 KG-89): doğrudan IndexedDB üzerinde kendi ince
sarmalayıcımız (`src/persistence/db.ts`, `Tablo` sınıfı), aynı ad (`okulumsun`), IndexedDB sürümü 10 ve aynı
depolarla; Dexie `devDependencies`'e iner ve yalnız uyum testinde kullanılır.
Gerekçe: en büyük kazanç (−93,7 KB, K5 payı ~2 KB → ~96 KB), yeni üçüncü taraf bağımlılık ve lisans kaydı yok,
kullanılan yüzey küçük (tek depolu işlemler, 3 basit sorgu, göç ve canlı sorgu yok) ve bugün yalnız açılış
temizliği çalışıyor. Seçenek 2 yakın ikinciydi (2,9 KB daha büyük, kenar durumları kütüphanede); Seçenek 1/1b
K5'i çözmediği veya ölçütü gevşettiği için seçilmedi.

Uygulama kuralları: sürüm sabit **10** (`IDB_SURUMU`); `onupgradeneeded` yalnız eksik depoyu kurar;
`onversionchange` ve `onclose`'da bağlantı bırakılır, sonraki çağrı yeniden açar; `onblocked` sonsuz beklemek
yerine `DbHatasi('engellendi')` ile reddeder (geç gelen bağlantı kapatılır); açılış hatası önbelleğe alınmaz;
her çağrı tek işlemdir ve sonuç `oncomplete`'te döner, istek hatası/iptal `DbHatasi('islem-iptal')` verir
(`bulkPut`/`bulkDelete` hepsi-ya-hiçbiri). Sorgu karşılıkları: `orderBy('seq').limit(n)` → `ilkN(n)`,
`where(i).above(x)` → `ustu(i, x)`, `where(i).below(x)` → `alti(i, x)`.

## Sonuçlar

- Değişen dosyalar (kabulde): `src/persistence/db.ts` (Dexie sınıfı → `Tablo` sarmalayıcı), `repository.ts`
  (3 sorgu), `package.json` (`dexie` → `devDependencies`), `src/content/ucuncuTarafVarliklar.ts`
  (`dagitimdaVar: false` veya kayıt çıkar), `LICENSES.md`, `scripts/gizlilik/kurallar.ts` (gerekirse),
  `docs/boyut-analizi.md`, PLAN §10 ("Dexie" ifadeleri: şema aynı, katman adı değişir).
- Test / kanıt: yeni `tests/unit/indexeddbUyum.spec.ts` (Dexie v1 ile yaz → sarmalayıcıyla oku/yaz → Dexie ile
  yeniden aç), mevcut `persistence.spec.ts`, `acilistaTemizle.spec.ts`, e2e `onizleme-gizlilik-ag`;
  `npm run boyut` toplamı ≤ 745 000 B.
- **Uygulandı (14 Eki 2026, KG-89):** toplam 833 147 → **740 264 B** (−92 883 B; K5 payı 95 110 B), ilk yük
  699 526 → 606 643 B. Ayrıntı `docs/boyut-analizi.md`.

## Gizlilik etkisi

Yok. Depolanan veri, depo adları ve "saklama kapalı" politikası (ADR-0002) aynen kalır; izin listesine ekleme
yok. Açılış temizliği aynı 5 depoyu boşaltmaya devam eder. K9 kuralı IndexedDB erişimini `src/persistence/`
ile sınırlamayı sürdürür.

## Lisans ve üçüncü taraf etkisi

Seçenek 3: dağıtımdan bir Apache-2.0 bağımlılık (Dexie) çıkar, yenisi girmez; K10 envanterinde `dexie`
`dagitimdaVar: false` olur. Seçenek 2 seçilirse `idb` (ISC, © 2016 Jake Archibald) envantere, `LICENSES.md`'ye
ve Kaynaklar ekranına eklenir; ISC atıf şartı LICENSES ile karşılanır. Tümü tescilli dağıtımla (ADR-0013)
uyumlu.

## Geri dönüş maliyeti

Düşük. Veritabanı biçimi değişmediği için Dexie'ye dönüş `db.ts` ve 3 sorgu satırının geri alınmasıdır;
denemede Dexie, sarmalayıcının yazdığı veritabanını aynı sürümde açtı. Geri dönüşü imkânsız kılan tek hata
IndexedDB sürümünü 10'un üstüne çıkarmak olur (Dexie `version(1)` daha yüksek sürümü açamaz) — kabul koşulu.

## Kabul koşulları

- [x] Kullanıcı seçeneği onayladı: Seçenek 3 (14 Eki 2026, KG-89).
- [x] IndexedDB sürümü sabit 10; ad ve depo/anahtar/indeks tanımları birebir (uyum testi `indexeddbUyum.spec.ts`).
- [x] Birim testler, e2e gizlilik kanıtı ve K5 (`npm run boyut`) yeşil; boyut düşüşü `docs/boyut-analizi.md`'ye işlendi.
- [x] K10 lisans envanteri ve `LICENSES.md` güncel (`dexie` geliştirme aracı, dağıtılmaz).
