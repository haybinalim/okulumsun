# Maskot karakter kitabı (plan v2 Adım 54)

> **Durum: aşama 2, 28 Ekim 2026.** İsim **Lokum** (kullanıcı kararı, KG-115), maskot sesi Chirp 3 HD Achernar hız 0,9 (KG-114, K-12).
> Hikâyeler uygulamada (KG-116): derin tema girişi maskotun selamı + 1. sahneyle açılır, kişisel oturum sonunda sıradaki sahne.
> Geliştirmede tek sahne `?gelistirme=hikaye&tema=2&sahne=1` ile görülür. Bitti tanımındaki "3 çocuk + 1 öğretmen izledi" adımı yapılmadı.

Kaynaklar: PLAN §7.1 (yanlış cevap), §7.5 (maskot), §8 (görsel varlıklar), §9 (renk); `src/ui/feedback/maskotState.ts`, `src/design/sahnePaleti.ts`,
`src/ui/feedback/Maskot.tsx`, `src/content/maskotHikayeleri.json`, `src/ui/svg/temaSahneleri.tsx`.

## 1. Kim?

| Alan | Değer |
|---|---|
| **İsim** | **Lokum** — kullanıcı kararı, 28 Ekim 2026 (KG-115); pilot sınıf oylaması yerine kullanıcı seçti, **gerekirse sonradan değiştirilebilir**. Ad TEK KAYNAKTAN gelir: `src/content/maskot.json` (`ad`). Ses metinleri `{maskotAdi}` yer tutucusu kullanır (`maskot.selam`: "Merhaba! Ben {maskotAdi}."), ekranlar `MASKOT_ADI` (`src/content/maskot.ts`); adın başka bir dosyada düz yazılması testle engellenir. Değiştirmek: `maskot.json` → `npm run audio` (yalnız adın geçtiği klip yeniden üretilir). Hikâye metinlerinde ad geçmez. |
| **Ne** | İnsan değil, türü belirsiz; yuvarlak, tüylü, iki yuvarlak kulak. Sabit sıcak turuncu (`COLOR.mascot`). Silüeti asla değişmez, yalnız yüz ve kol (PLAN §7.5). 16 px'te bile tanınır. |
| **Görevi** | **Sesin sahibi olmak.** Bütün sesli yönerge ondan gelir; "kim konuşuyor?" sorusunu çözer, yardım istemeyi doğallaştırır (dokununca yardım). |

### Üç sıfat

1. **Meraklı** — her temada bir şeyi birlikte keşfetmeye çağırır ("Birlikte bakalım").
2. **Sabırlı** — beklemekten rahatsız olmaz; sessiz kalabilir, acele ettirmez.
3. **Sıcak** — çocuğun yaptığını fark eder, ama abartmaz ve karşılaştırmaz.

## 2. Konuşma tarzı

- **Kısa:** sahne başına en çok iki cümle, cümle başına ≈ 8 sözcük. Şema 140 karakter ve iki cümleyle sınırlar.
- **"Biz" dili:** "Birlikte sayalım", "Rafa bakalım". Emir yerine davet; soru yerine çoğunlukla söz ("Bana yardım eder misin?" türü
  davet sorusu olabilir, çocuktan sözlü yanıt beklenmez).
- **Somut:** gördüğü şeyi söyler (çiçek, ördek, kavanoz); soyut övgü yok ("harikasın" yerine "Ev bitti! Penceresi de çember oldu").
- **Doğru matematik dili:** müfredat sözcükleri (çember, eşit, uzun/kısa); sahnedeki sayı görseldeki adetle aynı ("tam on elma" →
  10 elma).
- **Sessiz kalabilir:** çocuk düşünürken konuşmaz (PLAN §7.5 `sakin`).

## 3. Yapmadıkları (PLAN §7.1, §7.4, §7.5)

- **Üzülmez, ağlamaz, kızmaz, suçlamaz** — yanlış cevapta bile; o anda `cesaretlendiriyor` pozundadır.
- **Yarıştırmaz:** kazanan, sıralama, puan, süre yok; "en hızlı", "kim önce" demez.
- **"Yanlış" demez;** kırmızı, X, can/kalp, seri kırılması yok.
- **Acele ettirmez, bekletmez;** gereksiz konuşmaz.
- **Ödülü doğru sayısına bağlamaz:** sevinci tamamlamaya ve çabaya.
- **Kişisel bilgi sormaz:** ad, yaş, okul, aile sorusu yok.

Şema bunların dilini denetler: `yanlış`, `yarış`, `kazan`, `kaybet`, `üzül/üzgün`, `ağla`, `acele`, `hızlı` geçen metin derlemeyi kırar
(`src/content/schema/maskotHikayesi.ts`).

## 4. Poz tablosu (PLAN §7.5 — tam liste)

| Durum | Ne zaman | Yüz / kol | Hikâyede |
|---|---|---|---|
| `sakin` | Varsayılan, çocuk düşünürken | Nötr gülümseme, kollar aşağıda; hareketsiz | Kullanılabilir |
| `konusuyor` | Talimat veya ipucu çalarken | Ağız senkron, bir kol işaret eder | Sahne 1 (hikâyeyi açar) |
| `dinliyor` | Çocuk seçim yaparken (seç → onayla) | Hafif öne eğik, baş yönelmiş | Sahne 2 (birlikte bakma) |
| `sevinmis` | Doğru cevap | Kollar yukarı, gözler kısık gülüş; ≤ 2 sn | Sahne 3 (hikâye iyi biter) |
| `cesaretlendiriyor` | Yanlış cevap ve K1/K2/K3 | Nötr-sıcak, bir kol "devam"; **asla üzgün değil** | **Kullanılmaz** (olaya bağlı) |
| `uykulu` | 60 sn tam hareketsizlik | Gözler yarı kapalı, esneme | **Kullanılmaz** (olaya bağlı) |

Geçişler yalnız bu tablodaki olaylarla tetiklenir; ara durum yok. `prefers-reduced-motion` veya "Hareketi azalt" açıkken poz değişir,
animasyon olmaz. Hikâye sahnesi olay pozlarını taklit etmez; şema `cesaretlendiriyor` ve `uykulu`yu hikâyede reddeder.

## 5. Tema dünyaları

Her temanın hikâyesi bir yerde geçer. Arka planlar programatik SVG'dir (`src/ui/svg/temaSahneleri.tsx`; PLAN §8 K1/K3, üçüncü
taraf varlık ve yapay zekâ görseli yok).

| Tema | Dünya | Hikâye (3 sahne) | Sahne görselleri |
|---|---|---|---|
| 1 Yön ve Yerler | Park (kaydırak, bank, yol) | Parkta kayıp top: top kaçar → altında mı arkasında mı → kaydırağın yanında | top; konum: altında/kutu; yanında/sepet |
| 2 Sayılar | Bahçe (çit, çiçekler) | Bahçede sayı: çiçekler → kelebekler → on elma | 3 çiçek; 5 kelebek; 10 elma (onluk çerçeve) |
| 3 Ölçme | Mutfak (raf, kavanozlar, terazi) | Kurabiye: kaplar → uzun/kısa kalem → teraziyle tartma | dikdörtgen; uzunluk karşılaştırma; kütle karşılaştırma |
| 4 Toplama ve Çıkarma | Göl (iskele, ördekler) | Ördekler gelir gider → 3 + 2 → akşam 5 − 3 | 3 kuş; işlem sahnesi +; işlem sahnesi − |
| 5 Paralarımız | Pazar (tezgâhlar, kasalar) | Alışveriş: kese → hangi parayla → elmalar alındı | 5 TL; 10 TL; 3 elma |
| 6 Şekiller | Atölye (şekil panosu, bloklar) | Blok ev: duvar kare → çatı üçgen → pencere çember | kare; üçgen; çember |
| 7 Sayalım ve Gösterelim | Çiftlik (ahır, çetele panosu) | Sayım: hayvanlar → her birine bir çizgi → pano doldu | 4 kuş; 3 kuş; 5 yıldız |

### Sahne kuralları

- **Dokunulmaz arka plan:** `aria-hidden`, olay almaz, odaklanamaz; içinde metin, düğme, bağlantı yok (testle).
- **Etkileşim alt %65 kuralı değişmez:** sahne hedef taşımaz. Zemin çizgisi ekranın %65'inde; ortadaki geniş alan maskot ve sahne
  görseline boş bırakılır.
- **Alıştırmanın arkasında kullanılmaz:** yalnız tema girişi ve oturum sonu hikâye anında.
- **Renk anlam taşımaz:** nesneler biçimle ayrışır. Palet açık pastel; her renk metin rengine ≥ 7:1, kırmızı ton yok. Renk körlüğü
  dostu palet açıkken de aynı sahne (anlam renge bağlı olmadığı için ayrı palet gerekmez). Doğru/tekrar dene renkleriyle aynı ekranda
  yarışmaz, çünkü sahne alıştırmanın arkasına konmaz.
- **Hareket yok:** sahne sabittir.

## 6. Hikâye akışı (KG-116, uygulamada)

- **Tema girişi:** derin tema girişi (Adım 45) önce **hikâye açılışını** gösterir: tema dünyası + 1. sahnenin pozundaki maskot + sahne
  görseli; maskot `maskot.selam` ("Merhaba! Ben {maskotAdi}.") ve hikâyenin 1. sahnesini söyler, anlatım bitince ≈1,2 sn sonra girişin
  4 adımı başlar. "Girişi geç" burada da tüm girişi atlar. Kişiselde oturum başına bir derin giriş (KG-112); tahtada öğretmen "Temaya
  giriş" kartıyla.
- **Oturum sonu (kişisel mod):** her tamamlanan tema oturumunun sonunda arka planda bir sonraki sahne (1. oturum → 2. sahne, 2. ve sonrası →
  3. sahne); maskot "oturum bitti" cümlesinin ardından sahneyi söyler, bahçeye geçiş anlatım bitince. Sayaç yalnız bellekte
  (`appStore.temaOturumlari`, Seçenek A); uygulama kapanınca sıfırlanır. Set, ev ve tahta oturumunda hikâye yok.
- **Tahta:** hikâye yalnız tema girişinde.
- **Dokunma:** sahne ve sahnedeki maskot dokunulmaz (`HikayeSahnesi.tsx`, `aria-hidden`, olay almaz); etkileşim alt %65 kuralı değişmez.
  Metin ekranda yazılmaz.
- **Ses:** 21 klip `hikaye.t1-1` … `hikaye.t7-3` + `maskot.selam`, maskot sesi `tr-TR-Chirp3-HD-Achernar` hız 0,9 (KG-114; yönergeler Puck).
  Hikâye metni `tr.json` `hikaye` ad alanındadır; `maskotHikayeleri.json` `metin` onunla birebir aynı olmalı (test). Giriş anlatımıyla
  aynı açılış cümlesi yinelenmesin diye üç 1. sahne metni kısaltıldı (t1-1, t5-1, t7-1).

## 7. Açık işler

| İş | Kimde | Adım |
|---|---|---|
| Yeni maskot kliplerinin kulakla dinlenmesi | Kullanıcı | 54 |
| 3 çocuk + 1 öğretmen izlemesi, metinlerin öğretmen okuması | Kullanıcı | 54 Bitti tanımı |
