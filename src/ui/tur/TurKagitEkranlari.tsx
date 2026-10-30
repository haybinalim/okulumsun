/**
 * Okuma Yazma "Kâğıtlar" ekranları (Adım 65 aşama 2) — YALNIZ `VITE_DERS_TUR=1` derlemesinde (`TurEkrani` üzerinden).
 *
 * Menü (harf ve rakam kâğıdı, destek kâğıdı, dikte, gözlem listesi) → glif seçimi → önizleme + Yazdır. Yazdırma
 * tarayıcının yazdırma penceresi (`window.print`); baskı kopyası `#root` dışında (`TurKagitlari`). Hiçbir şey saklanmaz:
 * destek seçimi yalnız bellekteki ekran durumunda, kâğıt kodu yalnız gliflerdir (öğrenci verisi yok). Ses yok.
 */
import type { TurHamleGlifi } from '../../content/schema/turHamle';
import { HARF_GRUPLARI } from '../../content/dersler/tur/alfabe';
import { BigButton } from '../primitives/BigButton';
import { glifAdi, glifAnahtari, sekmeGlifleri } from './hamleCizim';
import { TurKagitlari } from './kagit/TurArsivKagidi';
import { DESTEK_EN_COK, turKagitKodu, type DestekGlifi, type TurKagitIstegi } from './kagit/turKagidi';
import { turEkraniAc, type TurEkrani } from './turEkrani';
import { Baslik, ekranStili, SEKME_SAYISI } from './turOrtak';
import { YazilisGlifi } from './YazilisGlifi';

const satirStili = {
  display: 'flex',
  gap: 'var(--size-gap-tight)',
  flexWrap: 'wrap',
  justifyContent: 'center',
  maxWidth: '100%',
} as const;

export function KagitMenusu() {
  const ac = (istek: TurKagitIstegi) => turEkraniAc({ ekran: 'kagit', istek, geri: { ekran: 'kagitlar' } });
  return (
    <main aria-label="Kâğıtlar" style={{ ...ekranStili, justifyContent: 'space-between' }}>
      <Baslik baslik="Kâğıtlar" alt="Yazdırılacak kâğıdı seçin. Uygulama hiçbir kâğıdı ya da seçimi saklamaz." />
      <div role="group" aria-label="Kâğıt türleri" style={{ ...satirStili, gap: 'var(--size-gap)' }}>
        <BigButton label="Harf ve rakam kâğıdı" onPress={() => turEkraniAc({ ekran: 'kagitSecimi', tur: 'harf' })}>
          <span style={{ padding: '0 0.4em' }}>Harf ve rakam</span>
        </BigButton>
        <BigButton label="Destek kâğıdı" onPress={() => turEkraniAc({ ekran: 'kagitSecimi', tur: 'destek' })}>
          <span style={{ padding: '0 0.4em' }}>Destek</span>
        </BigButton>
        <BigButton label="Dikte sayfası" onPress={() => ac({ tur: 'dikte' })}>
          <span style={{ padding: '0 0.4em' }}>Dikte</span>
        </BigButton>
        <BigButton label="Gözlem listesi" onPress={() => ac({ tur: 'gozlem' })}>
          <span style={{ padding: '0 0.4em' }}>Gözlem</span>
        </BigButton>
      </div>
    </main>
  );
}

type SecimDurumu = Extract<TurEkrani, { ekran: 'kagitSecimi' }>;

/** Glif anahtarı (`kucuk:a`) → destek glifi. */
function destekGlifi(anahtar: string): DestekGlifi {
  const [bicim, glif] = anahtar.split(':') as [DestekGlifi['bicim'], string];
  return { bicim, glif };
}

export function destekIstegi(secim: readonly string[]): TurKagitIstegi {
  return { tur: 'destek', glifler: secim.map(destekGlifi) };
}

export function KagitSecimi({ glifler, durum }: { glifler: readonly TurHamleGlifi[]; durum: SecimDurumu }) {
  const sekme = Math.min(Math.max(durum.sekme ?? 0, 0), SEKME_SAYISI - 1);
  const secim = durum.secim ?? [];
  const destek = durum.tur === 'destek';
  const liste = sekmeGlifleri(glifler, HARF_GRUPLARI, sekme);
  const guncelle = (d: Partial<SecimDurumu>) => turEkraniAc({ ...durum, ...d });
  const glifSec = (g: TurHamleGlifi) => {
    const a = glifAnahtari(g);
    if (!destek) {
      const istek: TurKagitIstegi =
        g.bicim === 'rakam'
          ? { tur: 'rakam', bicim: 'rakam', glif: g.glif }
          : { tur: 'harf', bicim: g.bicim, glif: g.glif };
      turEkraniAc({ ekran: 'kagit', istek, geri: { ...durum, sekme } });
      return;
    }
    if (secim.includes(a)) guncelle({ secim: secim.filter((x) => x !== a), sekme });
    else if (secim.length < DESTEK_EN_COK) guncelle({ secim: [...secim, a], sekme });
  };
  const baslik = destek ? 'Destek kâğıdı' : 'Harf ve rakam kâğıdı';
  const alt = destek
    ? `En çok ${DESTEK_EN_COK} harf ya da rakam seçin, sonra önizleyin. Seçim saklanmaz.`
    : 'Harf grubunu ya da rakamları, sonra harfi seçin.';
  return (
    <main aria-label={baslik} style={{ ...ekranStili, justifyContent: 'space-between' }}>
      <Baslik baslik={baslik} alt={alt} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--size-gap)',
          width: '100%',
        }}
      >
        <div role="group" aria-label="Gruplar" style={satirStili}>
          {Array.from({ length: SEKME_SAYISI }, (_, i) => {
            const rakam = i === HARF_GRUPLARI.length;
            return (
              <BigButton
                key={i}
                label={rakam ? 'Rakamlar' : `${i + 1}. grup: ${HARF_GRUPLARI[i].join(' ')}`}
                ariaPressed={sekme === i}
                variant={sekme === i ? 'accent' : 'solid'}
                onPress={() => guncelle({ sekme: i })}
              >
                <span aria-hidden="true">{rakam ? '0-9' : i + 1}</span>
              </BigButton>
            );
          })}
          {destek && (
            <BigButton
              label={`Önizle, ${secim.length} seçili`}
              variant="accent"
              disabled={secim.length === 0}
              onPress={() => turEkraniAc({ ekran: 'kagit', istek: destekIstegi(secim), geri: { ...durum, sekme } })}
            >
              <span>Önizle ({secim.length})</span>
            </BigButton>
          )}
        </div>
        <div role="group" aria-label="Harfler ve rakamlar" style={satirStili}>
          {liste.map((g) => {
            const a = glifAnahtari(g);
            const secili = destek && secim.includes(a);
            return (
              <BigButton
                key={a}
                label={glifAdi(g)}
                ariaPressed={destek ? secili : undefined}
                variant={secili ? 'accent' : 'solid'}
                onPress={() => glifSec(g)}
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
            );
          })}
        </div>
      </div>
    </main>
  );
}

export function KagitOnizleme({ istek }: { istek: TurKagitIstegi }) {
  const kod = turKagitKodu(istek);
  return (
    <main
      aria-label="Kâğıt önizlemesi"
      data-kagit-onizleme={kod}
      style={{ ...ekranStili, justifyContent: 'space-between' }}
    >
      <div className="tk-uygulama" style={{ flex: '1 1 auto', minHeight: 0, width: '100%' }}>
        <TurKagitlari istek={istek} />
      </div>
      <div
        className="alt-cubuk"
        role="group"
        aria-label="Kâğıt denetimleri"
        style={{ ...satirStili, flex: '0 0 auto' }}
      >
        <BigButton label="Yazdır" variant="accent" onPress={() => window.print()}>
          <span style={{ padding: '0 0.4em' }}>Yazdır</span>
        </BigButton>
      </div>
    </main>
  );
}
