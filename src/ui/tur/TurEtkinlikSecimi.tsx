/**
 * ETKİNLİK SEÇİMİ — öğretmen ekranı (Okuma Yazma Adım 69). YALNIZ `VITE_DERS_TUR=1` derlemesinde.
 *
 * Öğretilen küme seçici (plan §2.4.5): "Bugünkü ses" resmî sırayla o harfe kadar küçük harfleri seçer; harf
 * düğmeleriyle küme elle değiştirilir (farklı sırayla ilerleyen sınıf, destek grubu). Büyük biçim küçüğü olmadan
 * seçilemez (K-OY-11). Küme öğretmen düzeyidir, öğrenci verisi değildir; yalnız bellekte ve adreste (`?tur=`).
 * Ardından şablon (T-01…T-08) ve zorluk (1–5); bu kümeyle kurulamayan şablon yanında yazar. Sözcük havuzu öğretmen
 * teyidi bekler, Türkçe ses henüz yok (Adım 66, 67).
 */
import { useState } from 'react';
import { TUR_SABLONLARI } from '../../content/dersler/tur/sablonlar';
import {
  TUR_SABLON_KODLARI,
  TUR_ZORLUKLARI,
  TurUretimHatasi,
  type TurHavuzSozcugu,
  type TurSablonKodu,
  type TurZorluk,
} from '../../content/dersler/tur/sablonlar/turSoru';
import { BigButton } from '../primitives/BigButton';
import { turEkraniAc } from './turEkrani';
import { useTurKume } from './turKume';
import { KumeDuzenleyici, kucukDugme } from './TurOgretmen';
import { useTurHavuzu } from './useTurHavuzu';
import { Baslik, ekranStili } from './turOrtak';

let sonSecim: { sablon: TurSablonKodu; zorluk: TurZorluk } = { sablon: 'T-02', zorluk: 1 };

/** Şablon bu kümeyle (ilk birkaç tohumda) kurulabiliyor mu. */
function kurulabilirMi(sablon: TurSablonKodu, havuz: readonly TurHavuzSozcugu[], kume: ReadonlySet<string>, zorluk: TurZorluk) {
  for (let tohum = 1; tohum <= 4; tohum++) {
    try {
      TUR_SABLONLARI[sablon].uret({ havuz, kume, zorluk, tohum });
      return true;
    } catch (e) {
      if (!(e instanceof TurUretimHatasi)) throw e;
    }
  }
  return false;
}


export function EtkinlikSecimi() {
  const kume = useTurKume();
  const h = useTurHavuzu();
  const [secim, setSecim] = useState(sonSecim);
  const sec = (s: typeof secim) => {
    sonSecim = s;
    setSecim(s);
  };
  return (
    <main data-yetiskin="" aria-label="Etkinlikler" style={{ ...ekranStili, justifyContent: 'flex-start', overflowY: 'auto' }}>
      <Baslik baslik="Etkinlikler" alt="Öğretilen harfleri, etkinliği ve zorluğu seçin. Sözcükler öğretmen teyidi bekliyor; ses henüz yok." />
      <KumeDuzenleyici />
      <section aria-label="Etkinlik" role="group" style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap', justifyContent: 'center' }}>
        {TUR_SABLON_KODLARI.map((kod) => {
          const t = TUR_SABLONLARI[kod];
          const olmaz = h.durum === 'hazir' && !kurulabilirMi(kod, h.havuz, kume, secim.zorluk);
          return (
            <BigButton
              key={kod}
              label={`${kod} ${t.ad}${olmaz ? ' (bu harflerle kurulamıyor)' : ''}`}
              data-yetiskin=""
              ariaPressed={secim.sablon === kod}
              variant={secim.sablon === kod ? 'accent' : 'solid'}
              style={{ ...kucukDugme, opacity: olmaz ? 0.5 : 1 }}
              onPress={() => sec({ ...secim, sablon: kod })}
            >
              <span>
                {kod} {t.ad}
              </span>
            </BigButton>
          );
        })}
      </section>
      <section aria-label="Zorluk" role="group" style={{ display: 'flex', gap: '0.4em', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-adult)' }}>Zorluk:</span>
        {TUR_ZORLUKLARI.map((z) => (
          <BigButton
            key={z}
            label={`Zorluk ${z}`}
            data-yetiskin=""
            ariaPressed={secim.zorluk === z}
            variant={secim.zorluk === z ? 'accent' : 'solid'}
            style={kucukDugme}
            onPress={() => sec({ ...secim, zorluk: z })}
          >
            <span>{z}</span>
          </BigButton>
        ))}
        <BigButton
          label="Başlat"
          data-yetiskin=""
          variant="accent"
          onPress={() => turEkraniAc({ ekran: 'etkinlik', sablon: secim.sablon, zorluk: secim.zorluk, tohum: 1 })}
        >
          <span style={{ padding: '0 0.6em' }}>Başlat</span>
        </BigButton>
      </section>
    </main>
  );
}
