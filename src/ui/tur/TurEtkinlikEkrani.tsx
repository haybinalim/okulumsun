/**
 * TÜRKÇE ETKİNLİK EKRANI (Okuma Yazma Adım 69–70: T-01…T-08) — YALNIZ `VITE_DERS_TUR=1` derlemesinde.
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
 *
 * Görselli şablonlarda (T-01, T-08; Adım 70) kartlar sözcük görselleridir (`ders-verisi/tur/gorseller/`, aynı köken).
 * Görsel kart da sessizdir ve cevaptan önce adı ne yazılır ne erişilebilir adına girer ("Resim 1"); doğru cevaptan
 * sonra doğru resmin adı okunur (geri bildirim klibi) ve T-01'de resmin altında yazılır.
 *
 * Adım 79: T-09 parça kartları (hamle orta çizgisi, kendi glif çerçevesinde; üstte model harf + parçaların oturduğu
 * çerçeve), T-16 sözcük kartları (genişlik en uzun sözcüğe göre; doğru cevaptan sonra doğru yazılış üstte), T-17
 * hece sayısı kartları (rakam + nokta), T-18 sesin yeri kartları (üç kutu, dolu kutu yer). Resim uyaranı (T-17, T-18)
 * dokunulmaz; adı soru sesidir, ses yokken öğretmen "Öğretmen: sözcük"ten okur; doğru cevaptan sonra altında yazılır.
 *
 * Adım 74: cümle şablonları (T-10, T-11, T-12) cümle parçasını ve cümle havuzunu bekler (`useCumleVerisi`, ayrı tembel
 * JS, KG-156). T-10 üstte yazılı cümle (tek satır, sözcük bölünmez D-22) + resim kartları; T-11 bitiş işaretsiz cümle +
 * boş yuva, kartlar . ? ! (sabit sıra; erişilebilir ad "Nokta", "Soru işareti", "Ünlem işareti"); doğru cevaptan sonra
 * cümle işaretiyle üstte.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { BigButton } from '../primitives/BigButton';
import { turSoruUret } from '../../content/dersler/tur/sablonlar';
import { sonrakiTohum } from '../../content/dersler/tur/sonrakiTohum';
import {
  TurUretimHatasi,
  type TurSablonKodu,
  type TurSoru,
  type TurZorluk,
} from '../../content/dersler/tur/sablonlar/turSoru';
import { geriBildirimKlibi } from '../../content/dersler/tur/sablonlar/klipler';
import { turEkraniAc, type TurEkrani } from './turEkrani';
import { useTurKume } from './turKume';
import { useTurHavuzu } from './useTurHavuzu';
import { turKlipleriniIste } from './turSes';
import { E2E_KANCASI_ACIK } from '../../dev/e2eKanca';
import { kartDuzeni, type KartDuzeni } from './etkinlikDuzeni';
import { ekranStili } from './turOrtak';
import { TUR_VERI_KOKU } from '../../content/dersler/tur/veriYukleyici';
import { useHamleVerisi } from './useHamleVerisi';
import { useCumleVerisi } from './useCumleVerisi';
import { TUR_CUMLE_SABLON_KODLARI } from '../../content/dersler/tur/sablonlar/turSoru';
import { KALEM, SATIR, yolVerisi } from './hamleCizim';
import type { TurKart, TurParca } from '../../content/dersler/tur/sablonlar/turSoru';
import { hecele } from '../../content/dersler/tur/heceleme';
import { useHareketAzalt } from '../../design/useHareketAzalt';
import './tur.css';

export function TurEtkinlikEkrani({
  sablon,
  zorluk,
  tohum,
  geri,
  onSonraki,
}: {
  sablon: TurSablonKodu;
  zorluk: TurZorluk;
  tohum: number;
  /** Etkinliği açan ekran (günün akışı, set); yoksa etkinlik seçimi. */
  geri?: TurEkrani;
  /** Verilirse "Sonraki" bunu çağırır (set akışı); yoksa aynı şablonun sonraki tohumu. */
  onSonraki?: () => void;
}) {
  const h = useTurHavuzu();
  const kume = useTurKume();
  // Hamle verisi yalnız T-09 (harfi parçalardan kur) için okunur.
  const hamleGerekli = sablon === 'T-09';
  const hv = useHamleVerisi(hamleGerekli);
  const hamleler = hv.durum === 'hazir' ? hv.veri.glifler : undefined;
  // Cümle parçası ve havuzu yalnız cümle şablonlarında (T-10, T-11, T-12) yüklenir.
  const cumleGerekli = (TUR_CUMLE_SABLON_KODLARI as readonly string[]).includes(sablon);
  const cv = useCumleVerisi(cumleGerekli);
  const cumleler = cv.durum === 'hazir' ? cv.cumleler : undefined;
  const havuz = h.durum === 'hazir' && (!hamleGerekli || hamleler) && (!cumleGerekli || cumleler) ? h.havuz : null;
  const sonuc = useMemo((): { soru: TurSoru } | { hata: string } | null => {
    if (!havuz) return null;
    try {
      return { soru: turSoruUret(sablon, { havuz, kume, zorluk, tohum, hamleler, cumleler }) };
    } catch (e) {
      if (e instanceof TurUretimHatasi) return { hata: e.message };
      throw e;
    }
  }, [havuz, kume, sablon, zorluk, tohum, hamleler, cumleler]);
  if (cv.durum === 'hata')
    return (
      <main aria-label="Etkinlik" style={{ ...ekranStili, justifyContent: 'center' }}>
        <p data-yetiskin="">{`Cümle verisi açılamadı: ${cv.mesaj}`}</p>
      </main>
    );
  if (hamleGerekli && hv.durum === 'hata')
    return (
      <main aria-label="Etkinlik" style={{ ...ekranStili, justifyContent: 'center' }}>
        <p data-yetiskin="">{`Harf yazılış verisi açılamadı: ${hv.mesaj}`}</p>
      </main>
    );
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
        <BigButton label={geri ? 'Geri dön' : 'Etkinlik seçimi'} data-yetiskin="" onPress={() => turEkraniAc(geri ?? { ekran: 'etkinlikler' })}>
          <span style={{ padding: '0 0.6em' }}>{geri ? 'Geri dön' : 'Etkinlik seçimi'}</span>
        </BigButton>
      </main>
    );
  return (
    <EtkinlikGovdesi
      key={sonuc.soru.itemId}
      soru={sonuc.soru}
      onSonraki={
        onSonraki ??
        (() =>
          turEkraniAc({
            ekran: 'etkinlik',
            sablon,
            zorluk,
            tohum: sonrakiTohum(sablon, { havuz: havuz!, kume, zorluk, tohum, hamleler, cumleler }, sonuc.soru.hedefMetin),
            ...(geri ? { geri } : {}),
          }))
      }
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
  const hareketAzalt = useHareketAzalt();
  const [durum, setDurum] = useState<Durum>('bos');
  const [yanlislar, setYanlislar] = useState<ReadonlySet<number>>(new Set());
  /** Yerleştirmede konan kartlar (sırayla); çoklu seçimde işaretli kartlar; eşleştirmede bulunan çiftler (düz). */
  const [yerlesim, setYerlesim] = useState<readonly number[]>([]);
  /** Eşleştirmede seçili (eşi aranan) kart. */
  const [acik, setAcik] = useState<number | null>(null);
  const [sesYok, setSesYok] = useState(false);
  const zamanlayici = useRef<number | undefined>(undefined);

  const iste = (klipler: readonly string[]) => setSesYok(!turKlipleriniIste(klipler));
  const soruSesi = () => iste([soru.yonerge, ...soru.soruKlipleri]);
  // Açılışta bir kez (soru `useMemo` ile sabit; soru değişince bileşen `key` ile yeniden kurulur). Geliştirmede
  // StrictMode etkiyi iki kez çalıştırır; aynı soru için yönerge ikinci kez istenmesin diye ref ile korunur.
  const duyurulan = useRef<TurSoru | null>(null);
  useEffect(() => {
    if (duyurulan.current !== soru) {
      duyurulan.current = soru;
      setSesYok(!turKlipleriniIste([soru.yonerge, ...soru.soruKlipleri]));
    }
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
    if (soru.kind === 'coklu') {
      setYerlesim(yerlesim.includes(i) ? yerlesim.filter((k) => k !== i) : [...yerlesim, i]);
      return;
    }
    if (soru.kind === 'eslestir') {
      if (yerlesim.includes(i)) return;
      const yari = soru.kartlar.length / 2;
      if (acik === null || acik === i || acik < yari === i < yari) {
        setAcik(acik === i ? null : i);
        return;
      }
      const cift = soru.ciftler.find(([a, b]) => (a === acik && b === i) || (a === i && b === acik));
      setAcik(null);
      if (!cift) {
        // Yanlış eş: iki kart kısa süre işaretlenir, sonra yeniden seçilebilir.
        setYanlislar(new Set([acik, i]));
        iste([geriBildirimKlibi('tekrar')]);
        window.clearTimeout(zamanlayici.current);
        zamanlayici.current = window.setTimeout(() => setYanlislar(new Set()), 800);
        return;
      }
      const yeni = [...yerlesim, cift[0], cift[1]];
      setYerlesim(yeni);
      if (yeni.length === soru.kartlar.length) dogruOldu();
      return;
    }
    if (yerlesim.includes(i) || yerlesim.length >= soru.dogruDizi.length) return;
    setYerlesim([...yerlesim, i]);
  };

  const onayla = () => {
    if (durum !== 'bos' || !onaylanabilir) return;
    const konan = yerlesim.map((k) => soru.kartlar[k].metin);
    const dogru =
      soru.kind === 'coklu'
        ? [...yerlesim].sort((a, b) => a - b).join() === soru.dogrular.join()
        : soru.kind === 'yerlestir' &&
          (soru.sirasiz
            ? [...konan].sort().join('|') === [...soru.dogruDizi].sort().join('|')
            : konan.every((m, i) => m === soru.dogruDizi[i]));
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
  const onayVar = yerlestir || soru.kind === 'coklu';
  const onaylanabilir = soru.kind === 'coklu' ? yerlesim.length > 0 : yerlestir && yerlesim.length >= soru.dogruDizi.length;
  const yuvalar = yerlestir ? soru.dogruDizi.map((_, i) => (yerlesim[i] === undefined ? null : soru.kartlar[yerlesim[i]].metin)) : [];
  const konanParcalar = yerlesim.map((k) => soru.kartlar[k].parca).filter((p): p is TurParca => Boolean(p));
  // Yalnız geliştirme / e2e kancalı test derlemesinde: testin cevabı bulması için (üretimde atılır).
  const id = (i: number) => soru.kartlar[i].id;
  const cevap = E2E_KANCASI_ACIK
    ? soru.kind === 'secim'
      ? id(soru.dogru)
      : soru.kind === 'eslestir'
        ? soru.ciftler.map(([a, b]) => `${id(a)}-${id(b)}`).join('|')
        : soru.kind === 'coklu'
          ? soru.dogrular.map(id).join('|')
          : soru.dogruDizi.join('|')
    : undefined;
  // Eşleşen çiftin numarası (rozet; renk tek ipucu değil).
  const ciftNo = (i: number) => {
    const j = yerlesim.indexOf(i);
    return soru.kind === 'eslestir' && j >= 0 ? String(Math.floor(j / 2) + 1) : undefined;
  };

  return (
    <main
      aria-label={`Etkinlik ${soru.sablon}`}
      data-tur-etkinlik={soru.sablon}
      data-tur-kind={soru.kind}
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
        <Uyaran soru={soru} durum={durum} yuvalar={yuvalar} parcalar={konanParcalar} />
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
                kart={k}
                sira={i}
                altYazi={soru.sablon === 'T-01'}
                enBoy={duzen?.enBoy ?? 1}
                boy={duzen?.kart ?? 0}
                kullanildi={yerlestir && yerlesim.includes(i)}
                secili={(soru.kind === 'coklu' && yerlesim.includes(i)) || acik === i}
                rozet={ciftNo(i) ?? (soru.kind === 'coklu' && yerlesim.includes(i) ? 'tik' : undefined)}
                yanlis={yanlislar.has(i)}
                dogru={durum === 'dogru' && soru.kind === 'secim' && i === soru.dogru}
                hareket={!hareketAzalt}
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
          {onayVar && durum !== 'dogru' && (
            <CubukDugmesi boy={duzen?.cubuk} label="Onayla" accent disabled={!onaylanabilir || durum !== 'bos'} onPress={onayla}>
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
/** Kart en/boy oranı: hece 1,6; sözcük en uzun sözcüğe göre; öteki kartlar kare. */
export function kartEnBoy(kartlar: readonly TurKart[]): number {
  if (kartlar.some((k) => k.tur === 'hece' || k.tur === 'konum')) return 1.6;
  // Cümle kartı (T-12): en uzun cümleye göre geniş, tek satır (sözcük bölünmez, D-22).
  const cumle = kartlar.filter((k) => k.tur === 'cumle');
  if (cumle.length) return Math.max(2, 0.24 * Math.max(...cumle.map((k) => [...k.metin].length)) + 0.8);
  const sozcuk = kartlar.filter((k) => k.tur === 'sozcuk');
  if (sozcuk.length) return Math.max(1.3, 0.3 * Math.max(...sozcuk.map((k) => [...k.metin].length)) + 0.5);
  return 1;
}

function useKartDuzeni(alan: RefObject<HTMLElement | null>, soru: TurSoru): (KartDuzeni & { enBoy: number }) | null {
  const [duzen, setDuzen] = useState<(KartDuzeni & { enBoy: number }) | null>(null);
  const enBoy = kartEnBoy(soru.kartlar);
  const gorsel = soru.kartlar.some((k) => k.tur === 'gorsel');
  const adet = soru.kartlar.length;
  const satir = soru.kind === 'eslestir' ? 2 : undefined;
  useLayoutEffect(() => {
    const el = alan.current;
    if (!el) return;
    const olc = () => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(document.documentElement);
      const px = (ad: string) => parseFloat(cs.getPropertyValue(ad)) || 0;
      setDuzen({
        enBoy,
        ...kartDuzeni({
          alanGenislik: r.width,
          alanYukseklik: r.height,
          adet,
          enBoy,
          // Resim kartı harf kartından büyük: resim tanınır boyda kalsın.
          enBuyuk: px('--size-choice') * (gorsel ? 1.15 : 0.75),
          tapMin: px('--size-tap-min'),
          aralik: px('--size-gap-tight'),
          kontrol: px('--size-control'),
          satir,
        }),
      });
    };
    olc();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(olc);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [alan, adet, enBoy, gorsel, satir]);
  return duzen;
}

function Kart({
  kart,
  sira,
  altYazi,
  enBoy,
  boy,
  kullanildi,
  secili,
  rozet,
  yanlis,
  dogru,
  hareket,
  onPress,
}: {
  kart: TurKart;
  secili: boolean;
  /** Köşe rozeti: eşleşen çiftin numarası ya da çoklu seçimde işaret (`tik`). */
  rozet?: string;
  sira: number;
  altYazi: boolean;
  enBoy: number;
  boy: number;
  kullanildi: boolean;
  yanlis: boolean;
  dogru: boolean;
  /** Yumuşak geri bildirim hareketi (doğru: hafif büyüme, yanlış: hafif sallanma); hareket azaltmada verilmez. */
  hareket: boolean;
  onPress: () => void;
}) {
  const { id, metin, gorselId } = kart;
  const genislik = Math.round(boy * enBoy);
  const pasif = kullanildi || yanlis;
  // Görsel kart: cevaptan önce adı yok (okuma/dinleme ele verilmez); doğru cevaptan sonra sözcük. Parça kartı
  // harfi ele vermez ("Parça N").
  const ad = gorselId
    ? dogru
      ? metin
      : `Resim ${sira + 1}`
    : kart.parca
      ? `Parça ${sira + 1}`
      : kart.tur === 'konum'
        ? KONUM_ADI[metin]
        : kart.tur === 'noktalama'
          ? (NOKTALAMA_ADI[metin] ?? metin)
          : metin;
  const yazi = kart.tur === 'cumle' ? 0.4 : kart.tur === 'sozcuk' ? 0.5 : kart.tur === 'hece' ? 0.5 : kart.tur === 'noktalama' ? 0.7 : 0.62;
  return (
    <button
      type="button"
      aria-label={ad}
      data-kart-gorsel={gorselId}
      aria-disabled={pasif || (rozet !== undefined && rozet !== 'tik') || undefined}
      aria-pressed={secili || undefined}
      data-kart={id}
      data-kart-metin={metin}
      data-kullanildi={kullanildi || undefined}
      data-yanlis={yanlis || undefined}
      data-dogru={dogru || undefined}
      data-rozet={rozet ?? (dogru ? 'tik' : undefined)}
      className={hareket ? (dogru ? 'tur-kart-dogru' : yanlis ? 'tur-kart-yanlis' : undefined) : undefined}
      onClick={onPress}
      style={{
        width: genislik,
        height: boy,
        display: 'grid',
        placeItems: 'center',
        border: 'none',
        borderRadius: 'calc(20px * var(--scale))',
        background: dogru ? 'var(--color-correct-soft)' : yanlis ? 'var(--color-retry-soft)' : 'var(--color-surface)',
        // Seçili kart: kalın koyu çerçeve (renk tek ipucu değil; çoklu seçimde ayrıca işaret rozeti).
        boxShadow: secili
          ? 'inset 0 0 0 calc(6px * var(--scale)) var(--color-ink)'
          : `0 calc(4px * var(--scale)) 0 ${dogru ? 'var(--color-correct)' : 'var(--color-border)'}`,
        color: 'var(--color-ink)',
        fontFamily: 'inherit',
        fontSize: Math.round(boy * yazi),
        lineHeight: 1,
        whiteSpace: 'nowrap',
        opacity: pasif ? 0.35 : 1,
        cursor: pasif ? 'default' : 'pointer',
        touchAction: 'manipulation',
        padding: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Doğru kartta işaret rozeti (renk tek ipucu değil). */}
      {(rozet ?? (dogru ? 'tik' : undefined)) && <Rozet metin={rozet ?? 'tik'} boy={boy} />}
      {gorselId ? (
        <>
          <img
            src={`${TUR_VERI_KOKU}gorseller/${gorselId}.svg`}
            alt=""
            draggable={false}
            style={{ width: '86%', height: '86%', pointerEvents: 'none', display: 'block' }}
          />
          {dogru && altYazi && (
            <span
              data-resim-adi=""
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: '3%',
                fontSize: Math.round(boy * 0.17),
                background: 'var(--color-surface)',
                lineHeight: 1.1,
              }}
            >
              {metin}
            </span>
          )}
        </>
      ) : kart.parca ? (
        <ParcaCizimi parcalar={[kart.parca]} merkez={kart.parca.genislik / 2} />
      ) : kart.tur === 'konum' ? (
        <KonumSeridi yer={metin} />
      ) : kart.tur === 'sayi' ? (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.08em', fontSize: Math.round(boy * 0.46) }}>
          {metin}
          <Noktalar adet={Number(metin)} />
        </span>
      ) : (
        metin
      )}
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
      {soru.soruKlipleri.length > 0 && (
        <details data-yetiskin="" style={{ background: 'var(--color-surface)', borderRadius: '0.4em', padding: '0.1em 0.5em' }}>
          <summary style={{ minHeight: 'max(44px, 1.6em)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>Öğretmen: {(soru.dinlenen ?? soru.sozcukler).length > 1 ? 'sözcükler' : 'sözcük'}</summary>
          <span data-ogretmen-sozcukleri="">{(soru.dinlenen ?? soru.sozcukler).join(', ')}</span>
        </details>
      )}
    </div>
  );
}

function Uyaran({
  soru,
  durum,
  yuvalar,
  parcalar,
}: {
  soru: TurSoru;
  durum: Durum;
  yuvalar: readonly (string | null)[];
  parcalar: readonly TurParca[];
}) {
  const dogru = durum === 'dogru';
  const u = soru.uyaran;
  const yuvaVar = soru.kind === 'yerlestir' && u.tur !== 'bosluklu' && u.tur !== 'parca';
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
                d="M4 9 H8 L13 5 V19 L8 15 H4 Z M16 9 Q18 12 16 15 M18.5 6.5 Q23 12 18.5 17.5"
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
      {u.tur === 'yok' && dogru && <Metin metin={soru.hedefMetin} yukseklik={60} stil={vurgu} veri="dogru-yazilis" />}
      {u.tur === 'noktalama' &&
        (dogru ? (
          <Metin metin={soru.hedefMetin} yukseklik={60} stil={vurgu} veri="dogru-yazilis" />
        ) : (
          <div
            data-uyaran-metni="model"
            data-noktalama-yuvasi=""
            style={{
              height: '60cqh',
              display: 'flex',
              alignItems: 'center',
              fontSize: `min(48cqh, calc(100cqw / ${([...u.metin].length + 2) * 0.75}))`,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              padding: '0 0.2em',
            }}
          >
            <span>{u.metin}</span>
            {/* Boş yuva: dokunulmaz (üst %35, D-24); kesikli çerçeve, renk tek ipucu değil. */}
            <span
              data-yuva=""
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: '0.7em',
                height: '1em',
                marginLeft: '0.08em',
                boxSizing: 'border-box',
                border: 'calc(3px * var(--scale)) dashed var(--color-ink-soft)',
                borderRadius: 'calc(10px * var(--scale))',
              }}
            />
          </div>
        ))}
      {u.tur === 'resim' && (
        <div data-uyaran-resim={u.gorselId} style={{ display: 'flex', alignItems: 'center', gap: '6cqw', height: '94cqh' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2cqh' }}>
            <img
              src={`${TUR_VERI_KOKU}gorseller/${u.gorselId}.svg`}
              alt=""
              draggable={false}
              style={{ flex: '1 1 0', minHeight: 0, aspectRatio: '1 / 1', pointerEvents: 'none', display: 'block' }}
            />
            {(u.metin || dogru) && (
              <Metin
                metin={dogru && soru.sablon === 'T-17' ? hecele(soru.hedefMetin).join(' ') : soru.hedefMetin}
                yukseklik={26}
                stil={dogru ? vurgu : undefined}
                veri={dogru ? 'dogru-yazilis' : 'resim-adi'}
              />
            )}
          </div>
          {u.harf && <Metin metin={u.harf} yukseklik={70} veri="model" />}
        </div>
      )}
      {u.tur === 'parca' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6cqw', height: '84cqh' }}>
          <Metin metin={u.glif} yukseklik={84} veri="model" />
          <div
            data-parca-tuval={parcalar.length}
            style={{
              height: '100%',
              aspectRatio: '1 / 1',
              boxSizing: 'border-box',
              border: 'calc(3px * var(--scale)) dashed var(--color-ink-soft)',
              borderRadius: 'calc(14px * var(--scale))',
              background: 'var(--color-surface)',
              ...vurgu,
            }}
          >
            <ParcaCizimi parcalar={parcalar} merkez={u.genislik / 2} cizgiler />
          </div>
        </div>
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
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
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

/**
 * Hamle parçaları, `merkez` (glif genişliğinin yarısı) çevresinde kare çerçevede (hamle verisi birimi; satır 20–100).
 * Başka genişlikteki glifin parçası ortası hizalanarak çizilir. `cizgiler`: kılavuz ve taban çizgisi (ince, kesikli).
 */
function ParcaCizimi({ parcalar, merkez, cizgiler = false }: { parcalar: readonly TurParca[]; merkez: number; cizgiler?: boolean }) {
  const x0 = merkez - 44;
  return (
    <svg viewBox={`${x0} 14 88 88`} aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}>
      {cizgiler &&
        [SATIR.kilavuz, SATIR.taban].map((y) => (
          <line key={y} x1={x0 + 4} x2={x0 + 84} y1={y} y2={y} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3 3" />
        ))}
      {parcalar.map((p, i) => (
        <path
          key={i}
          d={yolVerisi(p.noktalar, merkez - p.genislik / 2)}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={KALEM}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

const KONUM_ADI: Readonly<Record<string, string>> = { bas: 'Başta', orta: 'Ortada', son: 'Sonda' };
/** Noktalama kartının erişilebilir adı (T-11; işaret görünür, ad yalnız ekran okuyucuya). */
const NOKTALAMA_ADI: Readonly<Record<string, string>> = { '.': 'Nokta', '?': 'Soru işareti', '!': 'Ünlem işareti' };

/** Sesin yeri: üç kutulu şerit; yerin kutusu dolu, ötekiler kesikli boş (renk tek ipucu değil). */
function KonumSeridi({ yer }: { yer: string }) {
  return (
    <svg viewBox="0 0 96 40" aria-hidden="true" style={{ width: '82%', height: '62%', display: 'block', pointerEvents: 'none' }}>
      {['bas', 'orta', 'son'].map((y, i) => (
        <rect
          key={y}
          x={3 + i * 31}
          y={5}
          width={28}
          height={30}
          rx={5}
          fill={y === yer ? 'var(--color-ink)' : 'none'}
          stroke={y === yer ? 'var(--color-ink)' : 'var(--color-ink-soft)'}
          strokeWidth={2.5}
          strokeDasharray={y === yer ? undefined : '4 3'}
        />
      ))}
    </svg>
  );
}

/** Rakamın altında o kadar nokta (alkış sayısı); en çok 4. */
function Noktalar({ adet }: { adet: number }) {
  return (
    <svg viewBox={`0 0 ${adet * 10} 10`} aria-hidden="true" style={{ height: '0.32em', display: 'block' }}>
      {Array.from({ length: adet }, (_, i) => (
        <circle key={i} cx={5 + i * 10} cy={5} r={3.6} fill="var(--color-ink)" />
      ))}
    </svg>
  );
}

/** Kart köşesindeki rozet: çift numarası ya da işaret (dokunulmaz, kartın içinde). */
function Rozet({ metin, boy }: { metin: string; boy: number }) {
  const r = Math.round(boy * 0.3);
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '4%',
        right: '4%',
        width: r,
        height: r,
        borderRadius: '50%',
        background: 'var(--color-ink)',
        color: 'var(--color-surface)',
        display: 'grid',
        placeItems: 'center',
        fontSize: Math.round(r * 0.7),
        lineHeight: 1,
        zIndex: 1,
      }}
    >
      {metin === 'tik' ? (
        <svg viewBox="0 0 24 24" style={{ width: '70%', height: '70%' }}>
          <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        metin
      )}
    </span>
  );
}
