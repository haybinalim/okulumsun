/**
 * ETKİNLİK SEÇİMİ — öğretmen ekranı (Okuma Yazma Adım 69). YALNIZ `VITE_DERS_TUR=1` derlemesinde.
 *
 * Öğretilen küme seçici (plan §2.4.5): "Bugünkü ses" resmî sırayla o harfe kadar küçük harfleri seçer; harf
 * düğmeleriyle küme elle değiştirilir (farklı sırayla ilerleyen sınıf, destek grubu). Büyük biçim küçüğü olmadan
 * seçilemez (K-OY-11). Küme öğretmen düzeyidir, öğrenci verisi değildir; yalnız bellekte ve adreste (`?tur=`).
 * Ardından şablon ve zorluk (1–5); şablonlar beceriye göre gruplu (ses, harf, hece, sözcük, yazma; Adım 79); bu kümeyle
 * kurulamayan şablon yanında yazar. Sözcük havuzu öğretmen
 * teyidi bekler, Türkçe ses henüz yok (Adım 66, 67).
 */
import { useState } from 'react';
import { TUR_BECERILERI, TUR_SABLONLARI } from '../../content/dersler/tur/sablonlar';
import type { TurHamleGlifi } from '../../content/schema/turHamle';
import { useHamleVerisi } from './useHamleVerisi';
import {
  TUR_TUM_SABLON_KODLARI,
  TUR_ZORLUKLARI,
  TurUretimHatasi,
  type TurHavuzCumlesi,
  type TurHavuzSozcugu,
  type TurSablonKodu,
  type TurZorluk,
} from '../../content/dersler/tur/sablonlar/turSoru';
import { useCumleVerisi } from './useCumleVerisi';
import { BigButton } from '../primitives/BigButton';
import { turEkraniAc } from './turEkrani';
import { useTurKume } from './turKume';
import { KumeDuzenleyici } from './TurOgretmen';
import { kucukDugme } from './ogretmenOrtak';
import { useTurHavuzu } from './useTurHavuzu';
import { Baslik, ekranStili } from './turOrtak';

let sonSecim: { sablon: TurSablonKodu; zorluk: TurZorluk } = { sablon: 'T-02', zorluk: 1 };

/** Şablon bu kümeyle (ilk birkaç tohumda) kurulabiliyor mu. */
function kurulabilirMi(
  sablon: TurSablonKodu,
  havuz: readonly TurHavuzSozcugu[],
  kume: ReadonlySet<string>,
  zorluk: TurZorluk,
  hamleler: readonly TurHamleGlifi[] | undefined,
  cumleler: readonly TurHavuzCumlesi[] | undefined,
) {
  for (let tohum = 1; tohum <= 4; tohum++) {
    try {
      TUR_SABLONLARI[sablon].uret({ havuz, kume, zorluk, tohum, hamleler, cumleler });
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
  const hv = useHamleVerisi();
  const hamleler = hv.durum === 'hazir' ? hv.veri.glifler : undefined;
  // Katalog cümle şablonlarının bu kümeyle kurulup kurulamadığını gösterir: cümle parçası burada yüklenir (Adım 74).
  const cv = useCumleVerisi(true);
  const cumleler = cv.durum === 'hazir' ? cv.cumleler : undefined;
  const [secim, setSecim] = useState(sonSecim);
  const sec = (s: typeof secim) => {
    sonSecim = s;
    setSecim(s);
  };
  return (
    <main data-yetiskin="" aria-label="Etkinlikler" style={{ ...ekranStili, justifyContent: 'flex-start', gap: 'var(--size-gap-tight)' }}>
      <Baslik baslik="Etkinlikler" alt="Öğretilen harfleri, etkinliği ve zorluğu seçin. Sözcükler öğretmen teyidi bekliyor; ses henüz yok." />
      {/* Başlık ile zorluk/Başlat sabit; harf kümesi ve katalog arada kayar (Başlat kaydırmadan görünür). */}
      <div
        data-katalog-kaydir=""
        style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--size-gap)' }}
      >
        <KumeDuzenleyici />
        <div aria-label="Etkinlik" role="group" data-katalog="" style={{ display: 'flex', flexDirection: 'column', gap: '0.3em', alignItems: 'stretch' }}>
          {TUR_BECERILERI.map((b) => (
            <section
              key={b.kod}
              aria-label={b.ad}
              data-beceri={b.kod}
              style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ fontSize: 'var(--text-adult)', minWidth: '7.5em', textAlign: 'right', color: 'var(--color-ink-soft, #6B6B6B)' }}>{b.ad}</span>
              {TUR_TUM_SABLON_KODLARI.filter((kod) => TUR_SABLONLARI[kod].beceri === b.kod).map((kod) => {
                const t = TUR_SABLONLARI[kod];
                const olmaz =
                  h.durum === 'hazir' &&
                  hv.durum !== 'yukleniyor' &&
                  cv.durum !== 'yukleniyor' &&
                  !kurulabilirMi(kod, h.havuz, kume, secim.zorluk, hamleler, cumleler);
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
          ))}
        </div>
      </div>
      <section aria-label="Zorluk" role="group" style={{ display: 'flex', gap: '0.4em', alignItems: 'center', flexShrink: 0 }}>
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
