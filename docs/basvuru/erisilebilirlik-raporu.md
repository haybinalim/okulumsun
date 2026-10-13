# Erişilebilirlik raporu

Ayrıntı ve güncel tablo: [`docs/TEST-PROTOKOLU.md`](../TEST-PROTOKOLU.md) §1. Bu özet o belgeye dayanır.

## Otomatik olarak kanıtlanan

- **Okuma gerektirmez:** her yönerge önceden üretilmiş sesle; "Tekrar dinle" her alıştırmada aynı yerde, arka arkaya
  basılınca yavaşlar.
- **Dokunma hedefi ve erişim bölgesi:** tahtada en küçük hedef 102 px, üst %35'te dokunulabilir öğe yok — her e2e
  akışında her ekranda denetlenir.
- **Hareket:** `prefers-reduced-motion` veya yetişkin ayarı "Hareketi azalt" → animasyon yok, geri bildirim ikon ve sesle sürer.
- **Renk tek başına anlam taşımaz;** kırmızı hiç kullanılmaz (statik denetim).
- **Ekran okuyucu etiketleri:** seçim kartları erişilebilir ad ve seçili durumu duyurur.

## Kapsayıcılık ayarları (plan v2 Adım 55)

Yetişkin/öğretmen alanında altı ayar, varsayılan kapalı, saklanmaz; tahtada adres çubuğuna eklenir: yavaş tempo,
talimat tekrarı (8 sn), renk körlüğü dostu renkler (zemine ve beyaza ≥4,5:1; renk körlüğü benzetiminde ayrışır),
sol el yerleşimi, büyük hedef (tahtada 118 px), hareketi azalt. Dört temsilci kombinasyonda geometri ve taşma e2e ile denetlenir.

## Açık maddeler

- Gerçek çocuklarla ve fiziksel akıllı tahtada deneme (Adım 32, 33, 41) yapılmadı.
- Özel eğitim öğretmeniyle görev analizi: protokol hazır (`docs/research/kapsayicilik-gorev-analizi.md`), oturum yapılmadı.
- Varsayılan "tekrar dene" rengi (amber) küçük metinde AA altında; yalnız büyük geri bildirimde kullanılır (TEST-PROTOKOLU §1.4).
