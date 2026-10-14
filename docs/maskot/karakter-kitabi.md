# Maskot karakter kitabı (plan v2 Adım 54)

> **Durum: aşama 1 (sessiz görsel kısımlar), 14 Ekim 2026.** İsim pilot sınıf oylamasını, ses maskot sesi kararını (K-12) ve
> Adım 31'i bekliyor. Hikâye sahneleri uygulamaya **bağlı değil** (KG-91); geliştirmede `?gelistirme=hikaye&tema=2&sahne=1`
> ile görülür. Bitti tanımındaki "3 çocuk + 1 öğretmen izledi" adımı yapılmadı.

Kaynaklar: PLAN §7.1 (yanlış cevap), §7.5 (maskot), §8 (görsel varlıklar), §9 (renk); `src/ui/feedback/maskotState.ts`, `src/design/sahnePaleti.ts`,
`src/ui/feedback/Maskot.tsx`, `src/content/maskotHikayeleri.json`, `src/ui/svg/temaSahneleri.tsx`.

## 1. Kim?

| Alan | Değer |
|---|---|
| **İsim** | **Pilot sınıf oylaması bekliyor.** Pilot okulunda sınıf, öğretmenin okuduğu 3 aday arasından el kaldırarak seçer (kimliksiz, sayım tahtada, kayıt yok). Adaylar öğretmenle birlikte belirlenir; ticari karakter adına benzememeli (PLAN §8), 1. sınıfın kolay söyleyeceği 2 heceli bir sözcük olmalı. Okul oylamaya izin vermezse kullanıcı seçer. İsim seçilene kadar metinlerde ad geçmez. |
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

## 6. Hikâye akışı (tasarım; bağlama sonra)

- **Tema girişi:** derin tema girişinin (Adım 45) ilk sahnesi = hikâyenin 1. sahnesi.
- **Oturum sonu (kişisel mod):** her tamamlanan oturumdan sonra bir sonraki sahne; 3. sahneden sonra 3'te kalır
  (`siradakiSahne(tema, tamamlananOturum)`). Sayaç yalnız bellekte (Seçenek A); ADR-0002 Seçenek B onaylanırsa kalıcı olabilir.
- **Tahta:** hikâye yalnız tema girişinde.
- **Ses:** 21 klip `hikaye.t1-1` … `hikaye.t7-3` + `maskot.selam`; anahtarlar ve klipler ses kaynağı (Adım 31) ve maskot sesi kararıyla
  (K-12: yönerge sesiyle aynı TTS sesi farklı ton / ayrı lisanslı ses / sözleşmeli insan sesi) gelir. O zamana kadar sahne sessiz
  bir metin anı olurdu; çocuk okumadığı için bağlanmadı (KG-91).

## 7. Açık işler

| İş | Kimde | Adım |
|---|---|---|
| İsim oylaması (pilot sınıf) | Kullanıcı + pilot okulu | 32/54 |
| Maskot sesi kararı (K-12) | Kullanıcı | 54 alt görev 5 |
| 22 klip | Ses kaynağı | 31/54 alt görev 8 |
| TemaGirisi / OturumSonu bağlantısı | Geliştirici (ses gelince) | 45/54 alt görev 4 |
| 3 çocuk + 1 öğretmen izlemesi, metinlerin öğretmen okuması | Kullanıcı | 54 Bitti tanımı |
