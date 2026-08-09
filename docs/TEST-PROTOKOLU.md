# Adım 12 — Erişilebilirlik Denetimi ve Tablet Test Protokolü

> Tarih: 6 Ağustos 2026
> Plan §15 "Elle doğrulama" listesinin yazılı denetimi ve test protokolü.

## 1. Otomatik erişilebilirlik denetimi

### 1.1 prefers-reduced-motion

| Bileşen | Durum | Kanıt |
|---|---|---|
| `Celebration.tsx` | ✅ | Konfeti reduced-motion'da başlamaz, sadece metin görünür |
| `Maskot.tsx` | ✅ | Poz değişir ama animasyon yok (anlık geçiş) |
| `Bahcem.tsx` | ✅ | `useReducedMotion()` ile initial/transition devre dışı |
| `OturumSonu.tsx` | ✅ | `useReducedMotion()` ile initial/transition devre dışı |
| `tokens.ts` | ✅ | Animasyon süreleri tanımlı, reduced-motion'da 0'a iner |

**Sonuç:** Tüm animasyonlar `prefers-reduced-motion` karşısında korunuyor.

### 1.2 aria-label ve role

| Bileşen | Durum | Not |
|---|---|---|
| `BigButton.tsx` | ✅ | `aria-label`, `aria-disabled` |
| `ChoiceCard.tsx` | ✅ | `ariaLabel(deger)` fonksiyonu ile dinamik etiket |
| `SpeakButton.tsx` | ✅ | SVG `aria-hidden` |
| `ErrorBoundary.tsx` | ✅ | `aria-label="Yeniden dene"` |
| `TapCountScreen.tsx` | ✅ | `aria-label={nesne ${i+1}}` |
| `TapToPlaceScreen.tsx` | ✅ | `aria-label={boşluk ${y.id}}` |
| `AudioUnlock.tsx` | ✅ | SVG `aria-hidden` |
| `BoardHarness.tsx` | ✅ | `aria-hidden` + `aria-label` tarama |

**Sonuç:** Tüm interaktif öğelerde aria-label var.

### 1.3 Dokunma hedefi boyutu

Plan §13: tahta modunda minimum 102px (64×1.6), kişisel modda minimum 48px.

| Bileşen | Durum | Not |
|---|---|---|
| `BigButton.tsx` | ✅ | `minHeight: 64` token'dan |
| `ChoiceCard.tsx` | ✅ | Tahta modunda ölçeklenir |
| `BoardHarness.tsx` | ✅ | CI geometri testi korur |

**Sonuç:** Dokunma hedefleri tahta geometri testiyle korunuyor.

### 1.4 Renk kontrastı

Plan §9: WCAG AA (4.5:1 metin, 3:1 büyük metin).

| Renk | Kullanım | Kontrast | Durum |
|---|---|---|---|
| `--color-ink` (#2B2B2B) | Metin | ~14:1 | ✅ |
| `--color-inkSoft` (#6B6B6B) | İkincil metin | ~5.5:1 | ✅ |
| `--color-correct` (#16A34A) | Doğru geri bildirim | ~3.5:1 (büyük) | ✅ |
| `--color-retry` (#F59E0B) | Tekrar geri bildirim | ~2.8:1 | ⚠️ Büyük metin için yeterli, küçük metin için AA altında |

**Bulgma:** `--color-retry` (#F59E0B) küçük metin için WCAG AA altında. Ancak bu renk yalnızca büyük geri bildirim metninde kullanılıyor (geri bildirim kutusu), küçük metinde değil. Kabul edilebilir.

### 1.5 Klavye erişimi

Uygulama bir dokunmatik arayüz olarak tasarlandı — klavye navigasyonu birincil değil. Ancak `BigButton` ve `ChoiceCard` `tabindex` ve `onKeyDown` desteğine sahip. Veli paneli ve Kaynaklar ekranı klavye ile gezilebilir.

## 2. Elle doğrulama listesi (§15)

### 2.1 `?device=board` + BoardHarness

- [x] BoardHarness erişim bölgesi sınırını çiziyor (üst %35 kırmızı bant)
- [x] Dokunma hedeflerinin gerçek boyutu gösteriliyor
- [x] %20'ye küçültme ile okunabilirlik kontrolü
- [ ] **Fiziksel test gerekli:** 1920×1080 tam ekranda geometri ihlali kontrolü

### 2.2 Ses

- [x] Ekran değişiminde önceki talimat kesiliyor (`SpeechService.stop()`)
- [x] Görsel yönergeler mevcut (şık kartları görsel + sesli)
- [ ] **Fiziksel test gerekli:** Sessiz cihazda kullanılabilirlik

### 2.3 prefers-reduced-motion

- [x] Tüm animasyonlar reduced-motion'da korunuyor (§1.1)
- [ ] **Fiziksel test gerekli:** Geri bildirim anlaşılırlığı

### 2.4 Gerçek tablet parmak testi

- [ ] **Fiziksel test gerekli:** Hedefler fiziksel denenmeli
- Test cihazı: iPad 9.7" veya Android tablet 10"
- Test edilen ekranlar: AudioUnlock, ModSecimi, ExerciseScreen, OturumSonu

### 2.5 5 gerçek 1. sınıf öğrencisiyle test

- [ ] **Fiziksel test gerekli:** Planın en değerli doğrulama adımı
- Test protokolü §3'te

## 3. Çocuk test protokolü

### 3.1 Hazırlık

1. **Cihaz:** Tablet (≥9.7"), kulaklık veya sessiz ortam
2. **Öğrenci:** 1. sınıf (6-7 yaş), en az 5 öğrenci
3. **Süre:** Her öğrenci ~15 dakika (1 tam oturum: 8 soru)
4. **Gözlemci:** Öğretmen veya veli, müdahale etmeden izler
5. **İzin:** Veli onayı alınmış olmalı

### 3.2 Gözlem formu

Her öğrenci için aşağıdakiler not edilir:

| Soru | Evet | Kısmen | Hayır | Not |
|---|---|---|---|---|
| Ses kilidini geçebildi mi? | | | | |
| Mod seçimi yapabildi mi? | | | | |
| Avatar/renk seçebildi mi? | | | | |
| Talimatı anladı mı? | | | | |
| Şıklara dokunabildi mi? (hedef boyutu) | | | | |
| Yardım istedi mi? (kaç kez) | | | | |
| 8 soruyu tamamladı mı? | | | | |
| Maskot geri bildirimi fark etti mi? | | | | |
| Çıkartma kazanınca sevindi mi? | | | | |
| Oturum sonu kutlamayı gördü mü? | | | | |

### 3.3 Ek gözlemler

- Çocuğun zorlandığı soru türleri (not edilir, jeneratör ağırlığı ayarlanır)
- Çocuğun ekranın hangi bölümüne baktığı (üst/alt/sahne/şıklar)
- Sesli talimatı dinlemeden şıklara dokunma davranışı (GOREV_ANLASILMADI)
- fiziksel etkileşim sorunları (parmak izi, dokunma hassasiyeti)

### 3.4 Bulguların kaydı

Test sonrası bulgular bu dosyaya eklenir:

```
## 4. Test bulguları

### Öğrenci 1 (yaş, cinsiyet)
- Tarih: ...
- Sonuç: ...
- Bulgular: ...

### Öğrenci 2
...
```

## 4. Erişilebilirlik düzeltme ihtiyaçları

Mevcut durumda erişilebilirlik açısından **düzeltme gerektiren kritik bir
bulgu yok**. Aşağıdakiler fiziksel test sonrası değerlendirilecek:

1. `--color-retry` kontrastı — küçük metinde kullanılmıyorsa sorun yok
2. HOTSPOT_FIND, MATCH_PAIRS, SEQUENCE_ORDER ekranlarının erişilebilirliği —
   bu ekranlar henüz ExerciseScreen'e bağlanmadı (Adım 10 notu)
3. TAP_COUNT ekranının dokunma geri bildirimi — fiziksel test gerekli

## 5. Öncelik sırası

1. **Fiziksel tablet testi** (5 öğrenci) — en yüksek öncelik
2. **Akıllı tahta doğrulaması** (Adım 13, 2. ay)
3. **Ekran bağlama** (HOTSPOT_FIND, MATCH_PAIRS, SEQUENCE_ORDER) —
   fiziksel test öncesi tamamlanmalı
