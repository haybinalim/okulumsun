/**
 * OKUMA YAZMA ÖĞRETMEN AKIŞI (Adım 71, plan §2.4.11) — YALNIZ `VITE_DERS_TUR=1` derlemesinde (`TurEkrani` üzerinden).
 *
 *  · Öğretmen ana ekranı: ders seçimi (Matematik / Okuma Yazma), "Bugünkü ses" (tek dokunuş), araçlar.
 *  · Öğretilen harfler: gelişmiş küme düzenleme (farklı sırayla ilerleyen sınıf, destek grubu, 2. dönem tekrarı).
 *  · Günün akışı: programın ses öğretimi basamakları; sıra öğretmence değişir, var olan ekranlara bağlanır.
 *
 * Yetişkin yüzeyi (Andika, `data-yetiskin`); ses yok. Kalıcı olan yalnız sınıf düzeyi ayardır (K-7, tek anahtar,
 * öğrenci verisi değil; ADR-0002 Ek 1): öğretilen küme kodu ve akış sırası.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import { HARF_GRUPLARI, OGRETIM_SIRASI, trBuyuk } from '../../content/dersler/tur/alfabe';
import { resmiKume } from '../../content/dersler/tur/ogretilenKume';
import {
  AKIS_BASAMAKLARI,
  akisSirasiCoz,
  akisSirasiKodla,
  basamakTasi,
  PROGRAM_SIRASI,
  type AkisBasamagi,
} from '../../content/dersler/tur/gununAkisi';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';
import { turEkraniAc, turEkraniKapat, type TurEkrani } from './turEkrani';
import type { TurKagitIstegi } from './kagit/turKagidi';
import { turKumeYaz, useTurKume } from './turKume';
import { sinifAyariGuncelle, sinifAyariOku } from './sinifAyariDepo';
import { Baslik, ekranStili } from './turOrtak';

export const kucukDugme: CSSProperties = {
  minWidth: 'calc(var(--size-tap-min) * 0.8)',
  minHeight: 'calc(var(--size-tap-min) * 0.8)',
  padding: '0 0.3em',
  fontSize: 'var(--text-adult)',
};

/** Yetişkin listelerinde sık düğme: tahtada ~61 px, tablette en az 44 px. */
export const sikDugme: CSSProperties = {
  minWidth: 'max(44px, calc(var(--size-tap-min) * 0.6))',
  minHeight: 'max(44px, calc(var(--size-tap-min) * 0.6))',
  padding: '0 0.35em',
  fontSize: 'var(--text-adult)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

/** Harf düğmesi (öğretilen harfler): bir grubun 12 glifi 1080 px tahtada tek satıra sığar. */
const harfDugmesi: CSSProperties = { ...sikDugme, minWidth: 'max(44px, calc(var(--size-tap-min) * 0.55))', padding: 0 };

const aracDugmesi: CSSProperties = {
  minHeight: 'max(44px, calc(var(--size-tap-min) * 0.8))',
  whiteSpace: 'nowrap',
  padding: '0 0.7em',
  fontSize: 'var(--text-adult)',
};

/** Kümedeki en yeni küçük harf (resmî sırada) = "bugünkü ses". */
export function bugunkuSes(kume: ReadonlySet<string>): string {
  return [...OGRETIM_SIRASI].reverse().find((x) => kume.has(x)) ?? 'a';
}

/** Ders seçimi (§2.4.11 madde 1). Matematik uygulamanın kendi ana ekranına döner. */
export function DersSecimi({ secili }: { secili: 'mat' | 'tur' }) {
  return (
    <div role="group" aria-label="Ders" data-ders-secimi="" style={{ display: 'flex', gap: '0.4em', justifyContent: 'center' }}>
      <BigButton
        label="Matematik"
        data-yetiskin=""
        ariaPressed={secili === 'mat'}
        variant={secili === 'mat' ? 'accent' : 'solid'}
        style={aracDugmesi}
        onPress={turEkraniKapat}
      >
        <span>Matematik</span>
      </BigButton>
      <BigButton
        label="Okuma Yazma"
        data-yetiskin=""
        ariaPressed={secili === 'tur'}
        variant={secili === 'tur' ? 'accent' : 'solid'}
        style={aracDugmesi}
        onPress={() => turEkraniAc({ ekran: 'giris' })}
      >
        <span>Okuma Yazma</span>
      </BigButton>
    </div>
  );
}

/**
 * Matematik ana ekranının (tahta) üstünde ders seçimi — `App.tsx` yalnız bayraklı derlemede çizer. Yetişkin girişi:
 * "Öğretmen" düğmesiyle aynı ölçek, üst ortada (çocuk erişim bölgesi dışında; e2e geometri `data-yetiskin`i muaf tutar).
 */
export function AnaEkranDersSecimi() {
  const dugme = (secili: boolean): CSSProperties => ({
    minHeight: 44,
    padding: '0 14px',
    borderRadius: 8,
    border: `2px solid ${secili ? COLOR.ink : COLOR.border}`,
    background: secili ? COLOR.surface : 'transparent',
    color: COLOR.ink,
    cursor: 'pointer',
    fontSize: 'var(--text-adult)',
  });
  return (
    <div
      role="group"
      aria-label="Ders"
      data-yetiskin=""
      data-ders-secimi=""
      style={{ position: 'absolute', top: 'var(--size-edge)', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}
    >
      <button type="button" aria-pressed="true" style={dugme(true)}>
        Matematik
      </button>
      <button type="button" aria-pressed="false" onClick={() => turEkraniAc({ ekran: 'giris' })} style={dugme(false)}>
        Okuma Yazma
      </button>
    </div>
  );
}

/** "Bugünkü ses": resmî sırada bir önceki/sonraki ses tek dokunuşla (§2.4.5: o harfe kadar küçükler). */
export function BugunkuSes() {
  const kume = useTurKume();
  const ses = bugunkuSes(kume);
  const i = OGRETIM_SIRASI.indexOf(ses as (typeof OGRETIM_SIRASI)[number]);
  const sec = (j: number) => turKumeYaz(resmiKume(OGRETIM_SIRASI[j], false));
  const onceki = i > 0 ? OGRETIM_SIRASI[i - 1] : null;
  const sonraki = i < OGRETIM_SIRASI.length - 1 ? OGRETIM_SIRASI[i + 1] : null;
  return (
    <section
      aria-label="Bugünkü ses"
      data-bugunku-ses={ses}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flexWrap: 'wrap', justifyContent: 'center' }}
    >
      <BigButton
        label={onceki ? `Önceki ses: ${onceki}` : 'Önceki ses yok'}
        data-yetiskin=""
        disabled={!onceki}
        onBlockedPress={() => undefined}
        style={aracDugmesi}
        onPress={() => sec(i - 1)}
      >
        <span>◀ {onceki ?? ''}</span>
      </BigButton>
      <p style={{ margin: 0, fontSize: 'var(--text-adult)', textAlign: 'center' }}>
        Bugünkü ses:{' '}
        <strong data-glif={ses} style={{ fontSize: 'calc(var(--text-adult) * 1.6)' }}>
          {ses}
        </strong>
      </p>
      <BigButton
        label={sonraki ? `Sonraki ses: ${sonraki}` : 'Sonraki ses yok'}
        data-yetiskin=""
        variant="accent"
        disabled={!sonraki}
        onBlockedPress={() => undefined}
        style={aracDugmesi}
        onPress={() => sec(i + 1)}
      >
        <span>{sonraki ?? ''} ▶</span>
      </BigButton>
      <BigButton label="Harfleri düzenle" data-yetiskin="" style={aracDugmesi} onPress={() => turEkraniAc({ ekran: 'harfler' })}>
        <span>Harfleri düzenle</span>
      </BigButton>
    </section>
  );
}

/** Öğretmen ana ekranı (Okuma Yazma). */
export function OgretmenGiris({ ekAraclar }: { ekAraclar?: ReactNode }) {
  return (
    <main data-yetiskin="" aria-label="Okuma Yazma" style={{ ...ekranStili, justifyContent: 'space-between' }}>
      <Baslik baslik="Okuma Yazma" alt="Geliştirme önizlemesi. Yazılış verisi ve sözcükler öğretmen teyidi bekliyor; ses henüz yok." />
      <DersSecimi secili="tur" />
      <BugunkuSes />
      <nav
        aria-label="Öğretmen araçları"
        style={{ display: 'flex', gap: 'var(--size-gap-tight)', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}
      >
        <Arac ad="Günün akışı" onPress={() => turEkraniAc({ ekran: 'akis' })} vurgu />
        {ekAraclar}
        <Arac ad="Etkinlikler" onPress={() => turEkraniAc({ ekran: 'etkinlikler' })} />
        <Arac ad="Harf ve rakam yazılışı" onPress={() => turEkraniAc({ ekran: 'yazilisSecimi' })} />
        <Arac ad="Kâğıtlar" onPress={() => turEkraniAc({ ekran: 'kagitlar' })} />
        <Arac ad="Görseller" onPress={() => turEkraniAc({ ekran: 'gorseller', grup: 1, gri: false })} />
      </nav>
    </main>
  );
}

export function Arac({ ad, onPress, vurgu = false }: { ad: string; onPress: () => void; vurgu?: boolean }) {
  return (
    <BigButton label={ad} data-yetiskin="" variant={vurgu ? 'accent' : 'solid'} style={aracDugmesi} onPress={onPress}>
      <span>{ad}</span>
    </BigButton>
  );
}

/** Öğretilen küme düzenleyici: "Bugünkü ses" seçimi + harf harf (büyük, küçüğü olmadan seçilemez; K-OY-11). */
export function KumeDuzenleyici() {
  const kume = useTurKume();
  const degistir = (glif: string, kucuk: string) => {
    const yeni = new Set(kume);
    if (yeni.has(glif)) {
      yeni.delete(glif);
      if (glif === kucuk) yeni.delete(trBuyuk(kucuk)); // küçüğü olmayan büyük kalmaz
    } else {
      yeni.add(glif);
      yeni.add(kucuk);
    }
    if ([...yeni].length > 0) turKumeYaz(yeni);
  };
  const enYeni = bugunkuSes(kume);
  const buyukler = [...kume].filter((g) => g !== g.toLocaleLowerCase('tr-TR')).length;
  return (
    <section aria-label="Öğretilen harfler" style={{ display: 'flex', flexDirection: 'column', gap: '0.4em', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '0.6em', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <label style={{ fontSize: 'var(--text-adult)' }}>
          Bugünkü ses:{' '}
          <select
            aria-label="Bugünkü ses"
            value={enYeni}
            onChange={(e) => turKumeYaz(resmiKume(e.target.value, false))}
            style={{ fontSize: 'var(--text-adult)', minHeight: 'max(44px, calc(var(--size-tap-min) * 0.6))', minWidth: '3.2em' }}
          >
            {OGRETIM_SIRASI.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <BigButton
          label="Büyük harflere geçtik"
          data-yetiskin=""
          style={sikDugme}
          onPress={() => turKumeYaz(resmiKume(enYeni, true))}
        >
          <span>Büyük harflere geçtik</span>
        </BigButton>
        <span style={{ fontSize: 'var(--text-adult)' }} aria-live="polite">
          {kume.size - buyukler} küçük, {buyukler} büyük
        </span>
      </div>
      {HARF_GRUPLARI.map((grup, gi) => (
        <div key={gi} role="group" aria-label={`${gi + 1}. grup`} style={{ display: 'flex', gap: '0.2em', flexWrap: 'wrap', justifyContent: 'center' }}>
          {grup.flatMap((x) =>
            [x, trBuyuk(x)].map((glif) => (
              <BigButton
                key={glif}
                label={`${glif} ${kume.has(glif) ? 'öğretildi' : 'öğretilmedi'}`}
                data-yetiskin=""
                ariaPressed={kume.has(glif)}
                variant={kume.has(glif) ? 'accent' : 'solid'}
                style={harfDugmesi}
                onPress={() => degistir(glif, x)}
              >
                <span data-glif={glif}>{glif}</span>
              </BigButton>
            )),
          )}
        </div>
      ))}
    </section>
  );
}

export function HarfDuzenleme() {
  return (
    <main data-yetiskin="" aria-label="Öğretilen harfler" style={{ ...ekranStili, justifyContent: 'flex-start', gap: 'var(--size-gap-tight)' }}>
      <Baslik
        baslik="Öğretilen harfler"
        alt="Etkinlikler yalnız bu harflerle kurulur. Seçim bu cihazda sınıf ayarıdır; öğrenci bilgisi yok."
      />
      <KumeDuzenleyici />
    </main>
  );
}

let bellekteSira: string | null = null;

function akisSirasiOku(): readonly AkisBasamagi[] {
  return akisSirasiCoz(bellekteSira ?? sinifAyariOku().akis ?? PROGRAM_SIRASI) ?? AKIS_BASAMAKLARI;
}

/** Basamağın açtığı ekranlar (düğme adı + ekran); öğretmen etkinliği ve Dalga C basamağında boş. */
function basamakEylemleri(b: AkisBasamagi, ses: string): { ad: string; ekran: TurEkrani }[] {
  const geri: TurEkrani = { ekran: 'akis' };
  const h = b.hedef;
  if (h.tur === 'etkinlik')
    return h.sablonlar.map((s) => ({
      ad: h.sablonlar.length > 1 ? s : 'Aç',
      ekran: { ekran: 'etkinlik', sablon: s, zorluk: 1, tohum: 1, geri },
    }));
  if (h.tur === 'yazilis') return [{ ad: `Aç (${ses})`, ekran: { ekran: 'yazilis', anahtar: `kucuk:${ses}`, sekme: 0, geri } }];
  if (h.tur === 'kagit')
    return h.kagitlar.map((k) => ({
      ad: k === 'harf' ? `Kâğıt (${ses})` : k === 'dikte' ? 'Dikte' : 'Gözlem',
      ekran: {
        ekran: 'kagit',
        istek: (k === 'harf' ? { tur: 'harf', bicim: 'kucuk', glif: ses } : k === 'dikte' ? { tur: 'dikte' } : { tur: 'gozlem' }) as TurKagitIstegi,
        geri,
      },
    }));
  return [];
}

export function GununAkisi() {
  const kume = useTurKume();
  const ses = bugunkuSes(kume);
  const [sira, setSira] = useState(akisSirasiOku);
  const kaydet = (yeni: readonly AkisBasamagi[]) => {
    bellekteSira = akisSirasiKodla(yeni);
    sinifAyariGuncelle({ akis: bellekteSira });
    setSira(yeni);
  };
  const programda = akisSirasiKodla(sira) === PROGRAM_SIRASI;
  return (
    <main data-yetiskin="" aria-label="Günün akışı" style={{ ...ekranStili, justifyContent: 'flex-start', gap: 'var(--size-gap-tight)' }}>
      <Baslik baslik={`Günün akışı: ${ses}`} alt="Programın basamakları; sırayı oklarla değiştirin." />
      <ol
        aria-label="Basamaklar"
        data-akis-sirasi={akisSirasiKodla(sira)}
        style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25em', width: '100%', maxWidth: '64em' }}
      >
        {sira.map((b, i) => {
          const eylemler = basamakEylemleri(b, ses);
          return (
            <li
              key={b.kod}
              data-basamak={b.kod}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4em', fontSize: 'var(--text-adult)', minWidth: 0 }}
            >
              <span style={{ flex: '0 0 1.6em', textAlign: 'right' }}>{i + 1}.</span>
              <span
                title={b.aciklama}
                style={{ flex: '1 1 auto', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                <strong>{b.ad}</strong> <span style={{ color: 'var(--color-ink-soft, #6B6B6B)' }}>· {b.aciklama}</span>
              </span>
              {b.hedef.tur === 'dalgaC' && (
                <span data-dalga-c="" style={{ padding: '0.1em 0.5em', border: '2px dashed currentColor', borderRadius: 8, whiteSpace: 'nowrap' }}>
                  Dalga C
                </span>
              )}
              {eylemler.map((e) => (
                <BigButton
                  key={e.ad}
                  label={`${b.ad}: ${e.ad}`}
                  data-yetiskin=""
                  style={sikDugme}
                  onPress={() => turEkraniAc(e.ekran)}
                >
                  <span>{e.ad}</span>
                </BigButton>
              ))}
              <BigButton
                label={`${b.ad}: yukarı taşı`}
                data-yetiskin=""
                disabled={i === 0}
                onBlockedPress={() => undefined}
                style={sikDugme}
                onPress={() => kaydet(basamakTasi(sira, i, -1))}
              >
                <span aria-hidden="true">▲</span>
              </BigButton>
              <BigButton
                label={`${b.ad}: aşağı taşı`}
                data-yetiskin=""
                disabled={i === sira.length - 1}
                onBlockedPress={() => undefined}
                style={sikDugme}
                onPress={() => kaydet(basamakTasi(sira, i, 1))}
              >
                <span aria-hidden="true">▼</span>
              </BigButton>
            </li>
          );
        })}
      </ol>
      {!programda && (
        <BigButton
          label="Programdaki sıraya dön"
          data-yetiskin=""
          style={sikDugme}
          onPress={() => kaydet(akisSirasiCoz(PROGRAM_SIRASI)!)}
        >
          <span>Programdaki sıraya dön</span>
        </BigButton>
      )}
    </main>
  );
}
