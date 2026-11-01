/**
 * TÜRKÇE ETKİNLİK EKRANI (Okuma Yazma Adım 69: T-02…T-07, görselsiz) — YALNIZ `VITE_DERS_TUR=1` derlemesinde.
 *
 * Çocuk yüzeyi (TemelYazi). İki bölge, akıllı tahta erişim kuralı (D-24, matematik `GameShell` ile aynı oran):
 *   · ÜST %35 — uyaran: model harf/hece/sözcük, boşluklu sözcük, dinleme simgeleri ve yerleştirme YUVALARI. Burada
 *     dokunulabilir öğe YOK (yuvalar yalnız gösterir; son harfi geri almak alt çubuktaki "Sil" ile).
 *   · ALT — sessiz kartlar ve alt çubuk (↻ Tekrar dinle, Sil, Onayla; doğru cevaptan sonra Sonraki).
 *
 * Ses: kartlar hiçbir zaman ses istemez (D-11). Açılışta ve ↻'de yönerge + soru sesi (dinleme sorusunda sözcükler)
 * istenir; okuma hedefli soruda yalnız yönerge (D-12). Doğru cevapta bütün sözcük/hece vurgulanır ve geri bildirim
 * klipleri istenir. Türkçe ses dosyaları henüz yok (Adım 67): ekran sessiz çalışır ve "Ses yok" gösterir; dinleme
 * sorusunda öğretmen sözcükleri "Öğretmen: sözcükler" altında görür ve kendisi söyler. Hiçbir şey saklanmaz, süre
 * ölçülmez (D-13).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { BigButton } from '../primitives/BigButton';
import { turSoruUret } from '../../content/dersler/tur/sablonlar';
import {
  TurUretimHatasi,
  type TurSablonKodu,
  type TurSoru,
  type TurZorluk,
} from '../../content/dersler/tur/sablonlar/turSoru';
import { geriBildirimKlibi } from '../../content/dersler/tur/sablonlar/klipler';
import { turEkraniAc } from './turEkrani';
import { useTurKume } from './turKume';
import { useTurHavuzu } from './useTurHavuzu';
import { turKlipleriniIste } from './turSes';
import { E2E_KANCASI_ACIK } from '../../dev/e2eKanca';
import { kartDuzeni, type KartDuzeni } from './etkinlikDuzeni';
import { ekranStili } from './turOrtak';

export function TurEtkinlikEkrani({ sablon, zorluk, tohum }: { sablon: TurSablonKodu; zorluk: TurZorluk; tohum: number }) {
  const h = useTurHavuzu();
  const kume = useTurKume();
  const havuz = h.durum === 'hazir' ? h.havuz : null;
  const sonuc = useMemo((): { soru: TurSoru } | { hata: string } | null => {
    if (!havuz) return null;
    try {
      return { soru: turSoruUret(sablon, { havuz, kume, zorluk, tohum }) };
    } catch (e) {
      if (e instanceof TurUretimHatasi) return { hata: e.message };
      throw e;
    }
  }, [havuz, kume, sablon, zorluk, tohum]);
  if (h.durum !== 'hazir' || !sonuc)
    return (
      <main aria-label="Etkinlik" aria-busy={h.durum === 'yukleniyor'} style={{ ...ekranStili, justifyContent: 'center' }}>
        <p data-yetiskin="">{h.durum === 'hata' ? `Sözcük havuzu açılamadı: ${h.mesaj}` : 'Yükleniyor'}</p>
      </main>
    );
  if ('hata' in sonuc)
    return (
      <main aria-label="Etkinlik kurulamadı" data-etkinlik-kurulamadi={sablon} style={{ ...ekranStili, justifyContent: 'center' }}>
        <p data-yetiskin="" role="status" style={{ fontSize: 'var(--text-adult)', textAlign: 'center' }}>
          {sonuc.hata} Öğretilen harfleri genişletin ya da başka bir etkinlik seçin.
        </p>
        <BigButton label="Etkinlik seçimi" data-yetiskin="" onPress={() => turEkraniAc({ ekran: 'etkinlikler' })}>
          <span style={{ padding: '0 0.6em' }}>Etkinlik seçimi</span>
        </BigButton>
      </main>
    );
  return (
    <EtkinlikGovdesi
      key={sonuc.soru.itemId}
      soru={sonuc.soru}
      onSonraki={() => turEkraniAc({ ekran: 'etkinlik', sablon, zorluk, tohum: tohum + 1 })}
    />
  );
}

type Durum = 'bos' | 'dogru' | 'tekrar';

const ust: CSSProperties = {
  flex: '0 0 35%',
  minHeight: 0,
  position: 'relative',
  containerType: 'size',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'calc(8px * var(--scale))',
};

function EtkinlikGovdesi({ soru, onSonraki }: { soru: TurSoru; onSonraki: () => void }) {
  const [durum, setDurum] = useState<Durum>('bos');
  const [yanlislar, setYanlislar] = useState<ReadonlySet<number>>(new Set());
  const [yerlesim, setYerlesim] = useState<readonly number[]>([]);
  const [sesYok, setSesYok] = useState(false);
  const zamanlayici = useRef<number | undefined>(undefined);

  const iste = (klipler: readonly string[]) => setSesYok(!turKlipleriniIste(klipler));
  const soruSesi = () => iste([soru.yonerge, ...soru.soruKlipleri]);
  // Açılışta bir kez (soru `useMemo` ile sabit; soru değişince bileşen `key` ile yeniden kurulur).
  useEffect(() => {
    setSesYok(!turKlipleriniIste([soru.yonerge, ...soru.soruKlipleri]));
    return () => window.clearTimeout(zamanlayici.current);
  }, [soru]);

  const dogruOldu = () => {
    setDurum('dogru');
    iste(soru.geriBildirim);
  };

  const kartaDokun = (i: number) => {
    if (durum !== 'bos') return;
    if (soru.kind === 'secim') {
      if (yanlislar.has(i)) return;
      if (i === soru.dogru) dogruOldu();
      else {
        setYanlislar(new Set([...yanlislar, i]));
        iste([geriBildirimKlibi('tekrar')]);
      }
      return;
    }
    if (yerlesim.includes(i) || yerlesim.length >= soru.dogruDizi.length) return;
    setYerlesim([...yerlesim, i]);
  };

  const onayla = () => {
    if (soru.kind !== 'yerlestir' || durum !== 'bos' || yerlesim.length < soru.dogruDizi.length) return;
    const dogru = yerlesim.every((k, i) => soru.kartlar[k].metin === soru.dogruDizi[i]);
    if (dogru) {
      dogruOldu();
      return;
    }
    setDurum('tekrar');
    iste([geriBildirimKlibi('tekrar')]);
    zamanlayici.current = window.setTimeout(() => {
      setYerlesim([]);
      setDurum('bos');
    }, 1200);
  };

  const alt = useRef<HTMLElement>(null);
  const duzen = useKartDuzeni(alt, soru);
  const yerlestir = soru.kind === 'yerlestir';
  const yuvalar = yerlestir ? soru.dogruDizi.map((_, i) => (yerlesim[i] === undefined ? null : soru.kartlar[yerlesim[i]].metin)) : [];
  // Yalnız geliştirme / e2e kancalı test derlemesinde: testin cevabı bulması için (üretimde atılır).
  const cevap = E2E_KANCASI_ACIK
    ? soru.kind === 'secim'
      ? soru.kartlar[soru.dogru].id
      : soru.dogruDizi.join('|')
    : undefined;

  return (
    <main
      aria-label={`Etkinlik ${soru.sablon}`}
      data-tur-etkinlik={soru.sablon}
      data-zorluk={soru.zorluk}
      data-item-id={soru.itemId}
      data-durum={durum}
      data-cevap={cevap}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <section aria-label="Soru" data-uyaran={soru.uyaran.tur} style={ust}>
        {sesYok && <SesYok soru={soru} />}
        <Uyaran soru={soru} durum={durum} yuvalar={yuvalar} />
      </section>
      <section
        ref={alt}
        aria-label="Cevap"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--size-gap-tight)',
        }}
      >
        <div style={{ flex: '1 1 auto', minHeight: 0, display: 'grid', placeItems: 'center', width: '100%' }}>
          <div
            role="group"
            aria-label="Kartlar"
            data-kartlar=""
            data-satir={duzen?.satir}
            style={{
              display: 'grid',
              gridTemplateColumns: duzen ? `repeat(${duzen.sutun}, auto)` : undefined,
              gap: 'var(--size-gap-tight)',
              justifyContent: 'center',
              visibility: duzen ? 'visible' : 'hidden',
            }}
          >
            {soru.kartlar.map((k, i) => (
              <Kart
                key={k.id}
                id={k.id}
                metin={k.metin}
                hece={k.tur === 'hece'}
                boy={duzen?.kart ?? 0}
                kullanildi={yerlesim.includes(i)}
                yanlis={yanlislar.has(i)}
                dogru={durum === 'dogru' && soru.kind === 'secim' && i === soru.dogru}
                onPress={() => kartaDokun(i)}
              />
            ))}
          </div>
        </div>
        <div
          className="alt-cubuk"
          role="group"
          aria-label="Denetimler"
          style={{ display: 'flex', gap: 'var(--size-gap-tight)', alignItems: 'center', flex: '0 0 auto' }}
        >
          <CubukDugmesi boy={duzen?.cubuk} label="Tekrar dinle" onPress={soruSesi}>
            <Simge yol="M4 12 a8 8 0 1 0 2.3 -5.7 M4 4 v4.5 h4.5" />
          </CubukDugmesi>
          {yerlestir && durum !== 'dogru' && (
            <CubukDugmesi
              boy={duzen?.cubuk}
              label="Sil"
              disabled={yerlesim.length === 0 || durum !== 'bos'}
              onPress={() => setYerlesim(yerlesim.slice(0, -1))}
            >
              <Simge yol="M20 6 H9 L3 12 L9 18 H20 Z M12 9.5 L16.5 14.5 M16.5 9.5 L12 14.5" />
            </CubukDugmesi>
          )}
          {yerlestir && durum !== 'dogru' && (
            <CubukDugmesi
              boy={duzen?.cubuk}
              label="Onayla"
              accent
              disabled={yerlesim.length < soru.dogruDizi.length || durum !== 'bos'}
              onPress={onayla}
            >
              <Simge yol="M5 12.5 L10 17.5 L19 7" />
            </CubukDugmesi>
          )}
          {durum === 'dogru' && (
            <CubukDugmesi boy={duzen?.cubuk} label="Sonraki" accent onPress={onSonraki}>
              <Simge yol="M9 5 L16 12 L9 19" />
            </CubukDugmesi>
          )}
        </div>
      </section>
    </main>
  );
}

/** Alt bölüm ölçülür; kart boyu ve satır sayısı `kartDuzeni` ile (ilk ölçüme dek kartlar gizli). */
function useKartDuzeni(alan: RefObject<HTMLElement | null>, soru: TurSoru): KartDuzeni | null {
  const [duzen, setDuzen] = useState<KartDuzeni | null>(null);
  const hece = soru.kartlar.some((k) => k.tur === 'hece');
  const adet = soru.kartlar.length;
  useLayoutEffect(() => {
    const el = alan.current;
    if (!el) return;
    const olc = () => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(document.documentElement);
      const px = (ad: string) => parseFloat(cs.getPropertyValue(ad)) || 0;
      setDuzen(
        kartDuzeni({
          alanGenislik: r.width,
          alanYukseklik: r.height,
          adet,
          enBoy: hece ? 1.6 : 1,
          enBuyuk: px('--size-choice') * 0.75,
          tapMin: px('--size-tap-min'),
          aralik: px('--size-gap-tight'),
          kontrol: px('--size-control'),
        }),
      );
    };
    olc();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(olc);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [alan, adet, hece]);
  return duzen;
}

function Kart({
  id,
  metin,
  hece,
  boy,
  kullanildi,
  yanlis,
  dogru,
  onPress,
}: {
  id: string;
  metin: string;
  hece: boolean;
  boy: number;
  kullanildi: boolean;
  yanlis: boolean;
  dogru: boolean;
  onPress: () => void;
}) {
  const genislik = Math.round(boy * (hece ? 1.6 : 1));
  const pasif = kullanildi || yanlis;
  return (
    <button
      type="button"
      aria-label={metin}
      aria-disabled={pasif || undefined}
      data-kart={id}
      data-kart-metin={metin}
      data-kullanildi={kullanildi || undefined}
      data-yanlis={yanlis || undefined}
      onClick={onPress}
      style={{
        width: genislik,
        height: boy,
        display: 'grid',
        placeItems: 'center',
        border: 'none',
        borderRadius: 'calc(20px * var(--scale))',
        background: dogru ? 'var(--color-correct-soft)' : yanlis ? 'var(--color-retry-soft)' : 'var(--color-surface)',
        boxShadow: `0 calc(4px * var(--scale)) 0 ${dogru ? 'var(--color-correct)' : 'var(--color-border)'}`,
        color: 'var(--color-ink)',
        fontFamily: 'inherit',
        fontSize: Math.round(boy * (hece ? 0.5 : 0.62)),
        lineHeight: 1,
        whiteSpace: 'nowrap',
        opacity: pasif ? 0.35 : 1,
        cursor: pasif ? 'default' : 'pointer',
        touchAction: 'manipulation',
        padding: 0,
      }}
    >
      {metin}
    </button>
  );
}

function CubukDugmesi({
  boy,
  label,
  onPress,
  disabled,
  accent,
  children,
}: {
  boy: number | undefined;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accent?: boolean;
  children: ReactNode;
}) {
  const b = boy ? `${boy}px` : 'var(--size-control)';
  return (
    <BigButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      variant={accent ? 'accent' : 'solid'}
      style={{ minWidth: b, minHeight: b, width: b, height: b, padding: 0 }}
    >
      {children}
    </BigButton>
  );
}

function Simge({ yol }: { yol: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '55%', height: '55%' }}>
      <path d={yol} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Görünür "ses yok" (yetişkin bilgisi; dokunulmaz rozet) + dinleme sorusunda öğretmenin söyleyeceği sözcükler. */
function SesYok({ soru }: { soru: TurSoru }) {
  return (
    <div
      data-yetiskin=""
      data-ses-yok=""
      role="status"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        display: 'flex',
        gap: '0.6em',
        alignItems: 'flex-start',
        fontSize: 'var(--text-adult)',
        color: 'var(--color-ink-soft)',
        zIndex: 1,
      }}
    >
      <span style={{ background: 'var(--color-retry-soft)', borderRadius: '0.4em', padding: '0.1em 0.5em' }}>Ses yok</span>
      {soru.uyaran.tur === 'ses' && (
        <details data-yetiskin="" style={{ background: 'var(--color-surface)', borderRadius: '0.4em', padding: '0.1em 0.5em' }}>
          <summary>Öğretmen: {soru.sozcukler.length > 1 ? 'sözcükler' : 'sözcük'}</summary>
          <span data-ogretmen-sozcukleri="">{soru.sozcukler.join(', ')}</span>
        </details>
      )}
    </div>
  );
}

function Uyaran({ soru, durum, yuvalar }: { soru: TurSoru; durum: Durum; yuvalar: readonly (string | null)[] }) {
  const dogru = durum === 'dogru';
  const u = soru.uyaran;
  const yuvaVar = soru.kind === 'yerlestir' && u.tur !== 'bosluklu';
  const satir = yuvaVar && u.tur === 'yazi' ? 42 : 66; // cqh
  const vurgu: CSSProperties = dogru
    ? { background: 'var(--color-correct-soft)', boxShadow: '0 0 0 calc(4px * var(--scale)) var(--color-correct)' }
    : {};
  return (
    <>
      {u.tur === 'ses' && (
        <div aria-label="Dinle" data-dinle={u.adet} style={{ display: 'flex', gap: '6cqh', height: `${Math.min(satir, 40)}cqh` }}>
          {Array.from({ length: u.adet }, (_, i) => (
            <svg key={i} viewBox="0 0 24 24" aria-hidden="true" style={{ height: '100%', aspectRatio: '1 / 1' }}>
              <path
                d="M4 9 h4 l5 -4 v14 l-5 -4 h-4 Z M16 9 q2 3 0 6 M18.5 6.5 q4.5 5.5 0 11"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ))}
        </div>
      )}
      {u.tur === 'yazi' && (
        <Metin metin={u.metin} yukseklik={satir} stil={!yuvaVar ? vurgu : undefined} veri="model" />
      )}
      {u.tur === 'bosluklu' && (
        <div
          data-sozcuk-bosluklu=""
          style={{
            display: 'flex',
            alignItems: 'center',
            height: `${satir}cqh`,
            fontSize: `min(${satir * 0.8}cqh, calc(100cqw / ${(u.once.length + u.sonra.length + 1) * 0.75}))`,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            borderRadius: 'calc(16px * var(--scale))',
            padding: '0 0.15em',
            ...vurgu,
          }}
        >
          <span>{u.once}</span>
          <Yuva metin={yuvalar[0] ?? null} bosluklu />
          <span>{u.sonra}</span>
        </div>
      )}
      {yuvaVar && (
        <div
          data-yuvalar={yuvalar.length}
          data-durum={durum}
          style={{
            display: 'flex',
            gap: '1.5cqw',
            height: `${u.tur === 'yazi' ? 42 : satir}cqh`,
            maxWidth: '100%',
            borderRadius: 'calc(16px * var(--scale))',
            padding: '0.5cqh 1cqw',
            ...vurgu,
          }}
        >
          {yuvalar.map((m, i) => (
            <Yuva key={i} metin={m} adet={yuvalar.length} hece={soru.kartlar.some((k) => k.tur === 'hece')} />
          ))}
        </div>
      )}
    </>
  );
}

function Metin({ metin, yukseklik, stil, veri }: { metin: string; yukseklik: number; stil?: CSSProperties; veri: string }) {
  return (
    <div
      data-uyaran-metni={veri}
      style={{
        height: `${yukseklik}cqh`,
        display: 'flex',
        alignItems: 'center',
        fontSize: `min(${yukseklik * 0.8}cqh, calc(100cqw / ${Math.max(1, [...metin].length) * 0.75}))`,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        borderRadius: 'calc(16px * var(--scale))',
        padding: '0 0.2em',
        ...stil,
      }}
    >
      {metin}
    </div>
  );
}

/** Yerleştirme yuvası — yalnız gösterir (dokunulmaz; üst %35, D-24). */
function Yuva({ metin, adet = 1, hece = false, bosluklu = false }: { metin: string | null; adet?: number; hece?: boolean; bosluklu?: boolean }) {
  const en = hece ? 1.6 : 1;
  return (
    <span
      data-yuva=""
      data-dolu={metin ? '' : undefined}
      style={
        bosluklu
          ? {
              display: 'inline-grid',
              placeItems: 'center',
              width: '0.8em',
              height: '1em',
              margin: '0 0.06em',
              borderBottom: 'calc(5px * var(--scale)) solid var(--color-ink-soft)',
            }
          : {
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              aspectRatio: `${en} / 1`,
              maxWidth: `calc((100cqw - ${adet - 1} * 1.5cqw - 2cqw) / ${adet})`,
              boxSizing: 'border-box',
              border: 'calc(3px * var(--scale)) dashed var(--color-ink-soft)',
              borderStyle: metin ? 'solid' : 'dashed',
              borderRadius: 'calc(14px * var(--scale))',
              background: 'var(--color-surface)',
              fontSize: hece ? 'min(26cqh, 7cqw)' : 'min(30cqh, 9cqw)',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }
      }
    >
      {metin ?? ''}
    </span>
  );
}
