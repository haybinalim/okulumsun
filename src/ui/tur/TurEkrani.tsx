/**
 * TÜRKÇE (OKUMA YAZMA) EKRANLARI — geliştirme önizlemesi, YALNIZ `VITE_DERS_TUR=1` derlemesinde (Adım 64, ADR-0016).
 *
 * `App.tsx` bu parçayı tembel yükler ve ortak kabukla (`kabuk()`: tahta aracı, yazı yüzeyi, ekran çerçevesi) çizer.
 * Giriş `?ders=tur`. Gezinme ortak `GezinmeCubugu` ile (yerel "Geri" yazılmaz, KG-103): Geri bir önceki Türkçe
 * ekrana, Ana menü uygulamaya döner. Ses yok (tek başına ünsüz sesi hiç yok, K-OY-03; gösterimde değerlendirme ve
 * ses yok, §2.4.9). Hiçbir şey saklanmaz; süre ölçülmez (D-13). Tahtada etkileşim alt bölgede (D-24).
 */
import { useState, type ReactNode } from 'react';
import type { DeviceProfile } from '../../design/tokens';
import { HARF_GRUPLARI } from '../../content/dersler/tur/alfabe';
import { GezinmeCubugu } from '../gezinme/GezinmeCubugu';
import { BigButton } from '../primitives/BigButton';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import type { TurHamleGlifi } from '../../content/schema/turHamle';
import { glifAdi, glifAnahtari, HIZ_ADI, HIZLAR, sekmeGlifleri, type Hiz } from './hamleCizim';
import { turEkraniAc, turEkraniKapat, type TurEkrani as TurEkraniDurumu } from './turEkrani';
import { useHamleVerisi } from './useHamleVerisi';
import { YazilisGlifi } from './YazilisGlifi';

export default function TurEkrani({ ekran, profil }: { ekran: TurEkraniDurumu; profil: DeviceProfile }) {
  const geri = () => {
    if (ekran.ekran === 'yazilis') turEkraniAc({ ekran: 'yazilisSecimi', sekme: ekran.sekme });
    else if (ekran.ekran === 'giris') turEkraniKapat();
    else turEkraniAc({ ekran: 'giris' });
  };
  return (
    <div data-tur-ekrani={ekran.ekran} style={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
      <GezinmeCubugu onGeri={geri} onAnaMenu={turEkraniKapat} yon="dikey" hizala={profil === 'board' ? 'son' : 'bas'} />
      <div style={{ flex: '1 1 auto', minWidth: 0, minHeight: 0, position: 'relative' }}>
        {ekran.ekran === 'giris' ? (
          <Giris />
        ) : ekran.ekran === 'kagitlar' ? (
          <Giris />
        ) : (
          <VeriIle>
            {(glifler) =>
              ekran.ekran === 'yazilis' ? (
                <YazilisGosterimi
                  key={ekran.anahtar}
                  glif={glifler.find((g) => glifAnahtari(g) === ekran.anahtar) ?? glifler[0]}
                />
              ) : (
                <YazilisSecimi glifler={glifler} sekme={ekran.sekme ?? 0} />
              )
            }
          </VeriIle>
        )}
      </div>
    </div>
  );
}

const ekranStili = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--size-gap)',
  padding: 'var(--size-edge)',
  paddingBottom: 'var(--size-edge-bottom)',
  boxSizing: 'border-box',
} as const;

function Baslik({ baslik, alt }: { baslik: string; alt?: string }) {
  return (
    <header data-yetiskin="" style={{ textAlign: 'center', flex: '0 0 auto' }}>
      <h1 style={{ margin: 0, fontSize: 'calc(var(--text-ui) * 1.1)' }}>{baslik}</h1>
      {alt && (
        <p style={{ margin: '0.3em 0 0', fontSize: 'var(--text-adult)', color: 'var(--color-ink-soft, #6B6B6B)' }}>
          {alt}
        </p>
      )}
    </header>
  );
}

function Giris() {
  return (
    <main aria-label="Okuma Yazma" style={{ ...ekranStili, justifyContent: 'space-between' }}>
      <Baslik baslik="Okuma Yazma" alt="Geliştirme önizlemesi. Yazılış verisi öğretmen teyidi bekliyor." />
      <div style={{ display: 'flex', gap: 'var(--size-gap)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <BigButton
          label="Harf ve rakam yazılışı"
          size="primary"
          onPress={() => turEkraniAc({ ekran: 'yazilisSecimi' })}
        >
          <span style={{ padding: '0 0.6em' }}>Harf ve rakam yazılışı</span>
        </BigButton>
      </div>
    </main>
  );
}

function VeriIle({ children }: { children: (glifler: readonly TurHamleGlifi[]) => ReactNode }) {
  const v = useHamleVerisi();
  if (v.durum === 'hazir') return <>{children(v.veri.glifler)}</>;
  return (
    <main
      aria-label="Okuma Yazma"
      aria-busy={v.durum === 'yukleniyor'}
      style={{ ...ekranStili, justifyContent: 'center' }}
    >
      <p data-yetiskin="">{v.durum === 'yukleniyor' ? 'Yükleniyor…' : `Yazılış verisi açılamadı: ${v.mesaj}`}</p>
    </main>
  );
}

const SEKME_SAYISI = HARF_GRUPLARI.length + 1;

function YazilisSecimi({ glifler, sekme }: { glifler: readonly TurHamleGlifi[]; sekme: number }) {
  const [secili, setSecili] = useState(Math.min(Math.max(sekme, 0), SEKME_SAYISI - 1));
  const liste = sekmeGlifleri(glifler, HARF_GRUPLARI, secili);
  return (
    <main aria-label="Harf ve rakam yazılışı" style={{ ...ekranStili, justifyContent: 'space-between' }}>
      <Baslik baslik="Harf ve rakam yazılışı" alt="Harf grubunu (1–5) ya da rakamları, sonra harfi seçin." />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--size-gap)',
          width: '100%',
        }}
      >
        <div
          role="group"
          aria-label="Gruplar"
          style={{ display: 'flex', gap: 'var(--size-gap-tight)', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {Array.from({ length: SEKME_SAYISI }, (_, i) => {
            const rakam = i === HARF_GRUPLARI.length;
            return (
              <BigButton
                key={i}
                label={rakam ? 'Rakamlar' : `${i + 1}. grup: ${HARF_GRUPLARI[i].join(' ')}`}
                ariaPressed={secili === i}
                variant={secili === i ? 'accent' : 'solid'}
                onPress={() => setSecili(i)}
              >
                <span aria-hidden="true">{rakam ? '0–9' : i + 1}</span>
              </BigButton>
            );
          })}
        </div>
        <div
          role="group"
          aria-label="Harfler ve rakamlar"
          style={{
            display: 'flex',
            gap: 'var(--size-gap-tight)',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: '100%',
          }}
        >
          {liste.map((g) => (
            <BigButton
              key={glifAnahtari(g)}
              label={glifAdi(g)}
              onPress={() => turEkraniAc({ ekran: 'yazilis', anahtar: glifAnahtari(g), sekme: secili })}
              style={{
                width: 'var(--size-tap-min)',
                height: 'var(--size-tap-min)',
                padding: 'calc(6px * var(--scale))',
              }}
            >
              <span aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block' }}>
                <YazilisGlifi glif={g} kip="tam" cizgiler={false} kenar={3} />
              </span>
            </BigButton>
          ))}
        </div>
      </div>
    </main>
  );
}

function YazilisGosterimi({ glif }: { glif: TurHamleGlifi }) {
  const hareketAzalt = useHareketAzalt();
  const n = glif.hamleler.length;
  // Azaltılmış harekette animasyon yok: adım kipi, ilk hamle tam çizili.
  const [kip, setKip] = useState<'oynat' | 'adim'>(hareketAzalt ? 'adim' : 'oynat');
  const [adim, setAdim] = useState(hareketAzalt ? 1 : n);
  const [hiz, setHiz] = useState<Hiz>('orta');
  const [anahtar, setAnahtar] = useState(0);
  const [kesikli, setKesikli] = useState(false);
  const etkinKip = hareketAzalt && kip === 'oynat' ? 'adim' : kip;

  const oynat = () => {
    setKesikli(false);
    setKip('oynat');
    setAdim(n);
    setAnahtar((a) => a + 1);
  };
  const adimaGit = (yeni: number) => {
    setKesikli(false);
    setKip('adim');
    setAdim(Math.min(Math.max(yeni, 1), n));
  };
  const aktif = etkinKip === 'adim' ? glif.hamleler[adim - 1] : null;
  const ad = glifAdi(glif);

  return (
    <main
      aria-label={`Yazılış: ${ad}`}
      data-yazilis-glif={glifAnahtari(glif)}
      data-hamle-sayisi={n}
      style={{ ...ekranStili, justifyContent: 'space-between' }}
    >
      <div style={{ flex: '1 1 auto', minHeight: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div data-yazilis-tahta="" style={{ height: '100%', width: '100%', maxWidth: '100%' }}>
          <YazilisGlifi
            glif={glif}
            kip={kesikli ? 'kesikli' : etkinKip}
            adim={adim}
            hiz={hiz}
            anahtar={anahtar}
            etiket={`${ad}, ${n} hamle`}
          />
        </div>
      </div>
      <p
        data-yetiskin=""
        aria-live="polite"
        style={{ margin: 0, fontSize: 'var(--text-adult)', textAlign: 'center', flex: '0 0 auto' }}
      >
        {aktif ? `${aktif.sira}. hamle / ${n}: ${aktif.aciklama}` : `${ad}: ${n} hamle.`}
      </p>
      <div
        className="alt-cubuk"
        role="group"
        aria-label="Gösterim denetimleri"
        style={{
          display: 'flex',
          gap: 'var(--size-gap-tight)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          flex: '0 0 auto',
        }}
      >
        <BigButton label="Önceki hamle" onPress={() => adimaGit(etkinKip === 'adim' ? adim - 1 : n - 1)}>
          <Simge yol="M15 5 L8 12 L15 19" /> <span>Önceki</span>
        </BigButton>
        {!hareketAzalt && (
          <BigButton label="Baştan oynat" variant="accent" onPress={oynat}>
            <Simge yol="M8 5 L19 12 L8 19 Z" dolu /> <span>Oynat</span>
          </BigButton>
        )}
        <BigButton label="Sonraki hamle" onPress={() => adimaGit(etkinKip === 'adim' ? adim + 1 : 1)}>
          <span>Sonraki</span> <Simge yol="M9 5 L16 12 L9 19" />
        </BigButton>
        {!hareketAzalt && (
          <BigButton
            label={`Hız: ${HIZ_ADI[hiz]}`}
            onPress={() => {
              setHiz((h) => HIZLAR[(HIZLAR.indexOf(h) + 1) % HIZLAR.length]);
              setKip('oynat');
              setKesikli(false);
              setAnahtar((a) => a + 1);
            }}
          >
            <span>{HIZ_ADI[hiz]}</span>
          </BigButton>
        )}
        <BigButton
          label="Kesik çizgili göster"
          ariaPressed={kesikli}
          variant={kesikli ? 'accent' : 'solid'}
          onPress={() => setKesikli((k) => !k)}
        >
          <span>Kesikli</span>
        </BigButton>
      </div>
    </main>
  );
}

function Simge({ yol, dolu = false }: { yol: string; dolu?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '1.1em', height: '1.1em' }}>
      <path
        d={yol}
        fill={dolu ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={dolu ? 0 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
