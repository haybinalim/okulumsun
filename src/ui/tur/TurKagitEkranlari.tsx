/**
 * Okuma Yazma "Kâğıtlar" ekranları (Adım 65 aşama 2) — YALNIZ `VITE_DERS_TUR=1` derlemesinde (`TurEkrani` üzerinden).
 *
 * Menü (harf ve rakam kâğıdı, destek kâğıdı, dikte, gözlem listesi) → glif seçimi → önizleme + Yazdır. Yazdırma
 * tarayıcının yazdırma penceresi (`window.print`); baskı kopyası `#root` dışında (`TurKagitlari`). Hiçbir şey saklanmaz:
 * destek seçimi yalnız bellekteki ekran durumunda, kâğıt kodu yalnız gliflerdir (öğrenci verisi yok). Ses yok.
 */
import type { TurHamleGlifi } from '../../content/schema/turHamle';
import { HARF_GRUPLARI } from '../../content/dersler/tur/alfabe';
import type { SetDuzeyi } from '../../content/dersler/tur/turSet';
import { BigButton } from '../primitives/BigButton';
import { bugunkuSes, sikDugme } from './ogretmenOrtak';
import { glifAdi, glifAnahtari, sekmeGlifleri } from './hamleCizim';
import { TurKagitlari } from './kagit/TurArsivKagidi';
import { DESTEK_EN_COK, turKagitKodu, type DestekGlifi, type TurKagitIstegi } from './kagit/turKagidi';
import { eveLinkKoku } from '../../platform/kanonikKok';
import { turEkraniAc, type TurEkrani } from './turEkraniDurumu';
import { turEveLink } from './turEveLink';
import { useTurKume } from './turKume';
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

/**
 * Set hazırla ekindeki kâğıt düğmeleri (Adım 81, E4): dikte sayfası ve bugünkü sesin harf kâğıdı, alt bilgisinde aynı
 * setin eve bağlantısının karekodu ile. Kâğıt kodu (`tur-dikte`, `tur-harf-<harf>`) değişmez.
 */
export function SetKagitDugmeleri({ duzey, tohum }: { duzey: SetDuzeyi; tohum: number }) {
  const ses = bugunkuSes(useTurKume());
  const ac = (istek: TurKagitIstegi) =>
    turEkraniAc({ ekran: 'kagit', istek, geri: { ekran: 'setHazirla' }, eve: { duzey, tohum } });
  return (
    <>
      <BigButton label="Dikte kâğıdı, eve karekodlu" data-yetiskin="" style={sikDugme} onPress={() => ac({ tur: 'dikte' })}>
        <span>Dikte kâğıdı</span>
      </BigButton>
      <BigButton
        label={`${ses} harf kâğıdı, eve karekodlu`}
        data-yetiskin=""
        style={sikDugme}
        onPress={() => ac({ tur: 'harf', bicim: 'kucuk', glif: ses })}
      >
        <span>{ses} harf kâğıdı</span>
      </BigButton>
    </>
  );
}

export function KagitOnizleme({ istek, eve }: { istek: TurKagitIstegi; eve?: { duzey: SetDuzeyi; tohum: number } }) {
  const kod = turKagitKodu(istek);
  const kume = useTurKume();
  // Adım 71'in tek bağlantı üreticisi (`turEveLink`); yalnız set bağlamından açılan kâğıtta.
  const eveBaglantisi = eve
    ? turEveLink(eveLinkKoku(window.location, import.meta.env.BASE_URL ?? '/'), eve.duzey, eve.tohum, kume)
    : undefined;
  return (
    <main
      aria-label="Kâğıt önizlemesi"
      data-kagit-onizleme={kod}
      data-kagit-eve={eve ? '' : undefined}
      style={{ ...ekranStili, justifyContent: 'space-between' }}
    >
      <div className="tk-uygulama" style={{ flex: '1 1 auto', minHeight: 0, width: '100%' }}>
        <TurKagitlari istek={istek} eveBaglantisi={eveBaglantisi} />
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
