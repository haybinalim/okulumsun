/**
 * EVE LİNK, VELİ KARTI ve KAYNAKLAR (Okuma Yazma Adım 71 aşama 3; §2.4.11 madde 6–7). YALNIZ `VITE_DERS_TUR=1` derlemesinde.
 *
 *  · Eve gönder (öğretmen): set → bağlantı `?ders=tur&ev=<düzey+tohum>&tur=<küme kodu>` + yerel QR + veli kartı (yazdırılır).
 *    Bağlantıda ad, sınıf, okul, cevap yok; sunucuya bir şey gitmez (ADR-0010 sözleşmesi gibi; küme base36 kodu).
 *  · Ev açılışı (veli/çocuk): veli kartı + "Başla" → aynı set; set ekranlarının Geri ve Ana menüsü ev açılışına döner
 *    (öğretmen ekranlarına çıkılmaz). Bu cihazda sınıf ayarı okunmaz ve yazılmaz (K-7).
 *  · Kaynaklar: program sürümü ve adresi, TemelYazi, özgün içerik beyanı, ses kaynağı (Türkçe ses henüz yok).
 * Veli kartı metni taslaktır (`teyit: bekliyor`): öğretmen onayına kadar ekranda "Taslak" yazar.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './veliKarti.css';
import { kumeCoz, kumeKodla } from '../../content/dersler/tur/ogretilenKume';
import { PROGRAM_SURUMU } from '../../content/dersler/tur/alfabe';
import { setKodu, setKoduCoz, turSetiKur, DUZEY_ADI, type SetDuzeyi } from '../../content/dersler/tur/turSet';
import { VELI_KARTI_DOSYASI, veliKartiAyristir, type VeliKarti } from '../../content/dersler/tur/veliKarti';
import { turVerisiniOku } from '../../content/dersler/tur/veriYukleyici';
import { TUR_SABLONLARI } from '../../content/dersler/tur/sablonlar';
import { qrMatrisi, qrSvgYolu } from '../../ogretmen/qrMatrisi';
import { eveLinkKoku } from '../../platform/kanonikKok';
import { UCUNCU_TARAF_VARLIKLAR } from '../../content/ucuncuTarafVarliklar';
import { BigButton } from '../primitives/BigButton';
import { turEkraniAc } from './turEkrani';
import { useTurKume } from './turKume';
import { useTurHavuzu } from './useTurHavuzu';
import { Baslik, ekranStili } from './turOrtak';
import { sikDugme } from './ogretmenOrtak';

/** Program kaynağı (docs/mufredat-kisitlari-turkce.md). */
export const PROGRAM_ADRESI = 'https://tymm.meb.gov.tr/assets/pdf/ilkokul-turkce-dersi_20260902_111433_940.pdf';

let kartBellegi: Promise<VeliKarti> | null = null;
function veliKartiniYukle(): Promise<VeliKarti> {
  kartBellegi ??= turVerisiniOku(VELI_KARTI_DOSYASI).then(veliKartiAyristir);
  kartBellegi.catch(() => {
    kartBellegi = null;
  });
  return kartBellegi;
}

function useVeliKarti(): VeliKarti | { hata: string } | null {
  const [k, setK] = useState<VeliKarti | { hata: string } | null>(null);
  useEffect(() => {
    let iptal = false;
    veliKartiniYukle().then(
      (v) => !iptal && setK(v),
      (e: unknown) => !iptal && setK({ hata: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      iptal = true;
    };
  }, []);
  return k;
}

/** Veli kartı (yetişkin). `kucuk`: eve link ekranında yanda, sıkı. */
export function VeliKartiGovdesi({ kucuk = false }: { kucuk?: boolean }) {
  const k = useVeliKarti();
  if (!k) return <p style={{ fontSize: 'var(--text-adult)' }}>Yükleniyor</p>;
  if ('hata' in k) return <p role="status" style={{ fontSize: 'var(--text-adult)' }}>Veli kartı açılamadı: {k.hata}</p>;
  return (
    <article
      aria-label="Veli kartı"
      data-veli-karti={k.teyit.durum}
      style={{ fontSize: kucuk ? 'calc(var(--text-adult) * 0.85)' : 'var(--text-adult)', lineHeight: 1.35, maxWidth: '40em' }}
    >
      <h2 style={{ margin: '0 0 0.3em', fontSize: '1.15em' }}>{k.baslik}</h2>
      {k.teyit.durum === 'bekliyor' && (
        <p data-teyit-bekliyor="" style={{ margin: '0 0 0.4em', padding: '0.2em 0.5em', border: '2px dashed currentColor', borderRadius: 8, display: 'inline-block' }}>
          Taslak: öğretmen onayı bekliyor
        </p>
      )}
      <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
        {k.maddeler.map((m) => (
          <li key={m.kod} data-madde={m.kod} style={{ marginBottom: '0.25em' }}>
            <strong>{m.baslik}.</strong> {m.metin}
          </li>
        ))}
      </ul>
      <p style={{ margin: '0.4em 0 0', color: 'var(--color-ink-soft, #6B6B6B)' }}>{k.gizlilik}</p>
    </article>
  );
}

/** Baskı kopyası `#root` dışında: yazdırmada yalnız veli kartı çıkar (veliKarti.css). */
function VeliKartiBaskisi() {
  const [kap, setKap] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'tur-veli-baski';
    el.className = 'vk-baski';
    document.body.appendChild(el);
    setKap(el);
    return () => el.remove();
  }, []);
  return kap ? createPortal(<VeliKartiGovdesi />, kap) : null;
}

export function turEveLink(kok: string, duzey: SetDuzeyi, tohum: number, kume: ReadonlySet<string>): string {
  const u = new URL(kok);
  u.search = new URLSearchParams({ ders: 'tur', ev: setKodu(duzey, tohum), tur: kumeKodla(kume) }).toString();
  return u.toString();
}

export function TurEveGonder({ duzey, tohum }: { duzey: SetDuzeyi; tohum: number }) {
  const kume = useTurKume();
  const link = useMemo(() => turEveLink(eveLinkKoku(window.location, import.meta.env.BASE_URL ?? '/'), duzey, tohum, kume), [duzey, tohum, kume]);
  const qr = useMemo(() => qrSvgYolu(qrMatrisi(link)), [link]);
  const [kopya, setKopya] = useState<'bos' | 'kopyalandi' | 'elle'>('bos');
  const linkRef = useRef<HTMLParagraphElement>(null);
  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setKopya('kopyalandi');
    } catch {
      const el = linkRef.current;
      if (el) window.getSelection()?.selectAllChildren(el);
      setKopya('elle');
    }
  };
  return (
    <main data-yetiskin="" aria-label="Eve gönder" style={{ ...ekranStili, flexDirection: 'row', alignItems: 'stretch', gap: 'var(--size-gap)' }}>
      <section style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '0.5em', alignItems: 'center', justifyContent: 'center', maxWidth: '50%' }}>
        <h1 style={{ margin: 0, fontSize: 'calc(var(--text-ui) * 1.1)' }}>Eve gönder</h1>
        <svg
          role="img"
          aria-label="Eve link QR kodu"
          data-testid="tur-eve-qr"
          viewBox={`0 0 ${qr.boyut} ${qr.boyut}`}
          shapeRendering="crispEdges"
          style={{ width: 'min(26vw, 28vh, 420px)', aspectRatio: '1', flexShrink: 0, background: '#FFFFFF' }}
        >
          <path d={qr.yol} fill="#000000" />
        </svg>
        <p
          ref={linkRef}
          data-testid="tur-eve-link"
          style={{ margin: 0, fontSize: 'calc(var(--text-adult) * 0.8)', fontFamily: 'monospace', wordBreak: 'break-all', userSelect: 'all', maxWidth: '100%' }}
        >
          {link}
        </p>
        <p style={{ margin: 0, fontSize: 'var(--text-adult)' }}>
          {DUZEY_ADI[duzey]} seti, öğretilen harflerle. Bağlantıda ad, sınıf ya da cevap yok.
        </p>
        <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap', justifyContent: 'center' }}>
          <BigButton label="Kopyala" data-yetiskin="" variant="accent" style={sikDugme} onPress={() => void kopyala()}>
            <span>Kopyala</span>
          </BigButton>
          <BigButton label="Veli kartını yazdır" data-yetiskin="" style={sikDugme} onPress={() => window.print()}>
            <span>Veli kartını yazdır</span>
          </BigButton>
        </div>
        <p role="status" aria-live="polite" style={{ margin: 0, fontSize: 'var(--text-adult)', minHeight: '1.3em' }}>
          {kopya === 'kopyalandi' ? 'Bağlantı kopyalandı.' : kopya === 'elle' ? 'Kopyalanamadı: bağlantı seçili, elle kopyalayın.' : ''}
        </p>
      </section>
      <section data-veli-karti-baski="" style={{ flex: '1 1 auto', minWidth: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Kart kısa ise ortada, uzunsa üstten kayar (ortalama üstü kırpmasın). */}
        <div style={{ margin: 'auto 0' }}>
          <VeliKartiGovdesi kucuk />
        </div>
      </section>
      <VeliKartiBaskisi />
    </main>
  );
}

/** Eve link açılışı (veli/çocuk). Kurulamayan ya da bozuk bağlantıda açıklama; öğretmen ekranına yol yok. */
export function EvAcilisi({ kod }: { kod: string }) {
  const sc = setKoduCoz(kod);
  const kumeKodu = new URLSearchParams(window.location.search).get('tur');
  if (!sc || !kumeKodu || !kumeCoz(kumeKodu)) return <EvBaglantiHatasi />;
  return <EvSeti duzey={sc.duzey} tohum={sc.tohum} kod={kod} />;
}

function EvSeti({ duzey, tohum, kod }: { duzey: SetDuzeyi; tohum: number; kod: string }) {
  const kume = useTurKume();
  const h = useTurHavuzu();
  const set = useMemo(() => (h.durum === 'hazir' ? turSetiKur({ havuz: h.havuz, kume, duzey, tohum }) : null), [h, kume, duzey, tohum]);
  return (
    <main aria-label="Evde okuma yazma" data-ev-acilisi="" style={{ ...ekranStili, justifyContent: 'space-between' }}>
      <div data-yetiskin="" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4em', minHeight: 0, overflowY: 'auto', width: '100%' }}>
        <Baslik baslik="Evde okuma yazma" alt={set ? `${set.adimlar.length} etkinlik: ${[...new Set(set.adimlar.map((a) => TUR_SABLONLARI[a.sablon].ad))].join(', ')}.` : undefined} />
        <VeliKartiGovdesi kucuk />
      </div>
      <BigButton
        label="Başla"
        size="primary"
        variant="accent"
        disabled={!set || set.adimlar.length === 0}
        onBlockedPress={() => undefined}
        onPress={() => set && turEkraniAc({ ekran: 'set', adimlar: set.adimlar, sira: 0, geri: { ekran: 'ev', kod } })}
      >
        <span style={{ padding: '0 0.8em' }}>Başla</span>
      </BigButton>
    </main>
  );
}

export function EvBaglantiHatasi() {
  return (
    <main data-yetiskin="" aria-label="Bağlantı açılamadı" data-ev-hata="" style={{ ...ekranStili, justifyContent: 'center' }}>
      <Baslik baslik="Bağlantı açılamadı" alt="Bağlantı eksik ya da bozuk. Öğretmeninizden bağlantıyı yeniden isteyin." />
    </main>
  );
}

const TEMELYAZI = UCUNCU_TARAF_VARLIKLAR.find((v) => v.ad === 'TemelYazi');

export function TurKaynaklar() {
  return (
    <main data-yetiskin="" aria-label="Kaynaklar (Okuma Yazma)" style={{ ...ekranStili, alignItems: 'stretch' }}>
      <Baslik baslik="Kaynaklar: Okuma Yazma" />
      {/* Başlık sabit, metin kayar. */}
      <div data-kaynaklar-govde="" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
        <div style={{ fontSize: 'var(--text-adult)', lineHeight: 1.45, maxWidth: '44em', margin: '0 auto' }}>
        <section aria-label="Program" data-kaynak="program">
          <h2 style={{ fontSize: '1.1em', margin: '0.4em 0 0.2em' }}>Öğretim programı</h2>
          <p style={{ margin: 0 }}>
            MEB Türkiye Yüzyılı Maarif Modeli İlkokul Türkçe Dersi Öğretim Programı (2 Eylül 2026 baskısı; sürüm{' '}
            <code>{PROGRAM_SURUMU}</code>). Harf grupları, süreler ve ilk okuma yazma kuralları bu programdan alınmıştır.
          </p>
          <p style={{ margin: '0.2em 0 0', wordBreak: 'break-all' }} data-program-adresi="">
            {PROGRAM_ADRESI}
          </p>
        </section>
        <section aria-label="Yazı tipi" data-kaynak="temelyazi">
          <h2 style={{ fontSize: '1.1em', margin: '0.6em 0 0.2em' }}>Yazı tipi</h2>
          <p style={{ margin: 0 }}>
            Çocuğa dönük yazılar ve kâğıtlar MEB TemelYazi (dik temel harf) ile yazılır.
            {TEMELYAZI ? ` Sahibi: ${TEMELYAZI.sahip}; lisans: ${TEMELYAZI.lisans}.` : ''} Yalnız gereken harf alt kümesi pakettedir; tam
            yazı tipi dağıtılmaz. Yazılış hamleleri (orta çizgi) uygulamanın kendi çizimidir.
          </p>
        </section>
        <section aria-label="Özgün içerik" data-kaynak="ozgun">
          <h2 style={{ fontSize: '1.1em', margin: '0.6em 0 0.2em' }}>Özgün içerik</h2>
          <p style={{ margin: 0 }}>
            Sözcük listesi, görseller, yazılış hamleleri, etkinlikler, kâğıtlar ve veli kartı bu uygulamanın özgün
            içeriğidir. Ders kitabı metni ve görseli kullanılmamıştır; çalışırken yapay zekâ kullanılmaz. Sözcük listesi,
            görseller ve veli kartı öğretmen teyidi bekliyor.
          </p>
        </section>
        <section aria-label="Sesler" data-kaynak="ses">
          <h2 style={{ fontSize: '1.1em', margin: '0.6em 0 0.2em' }}>Sesler</h2>
          <p style={{ margin: 0 }}>
            Türkçe sesler henüz üretilmedi; etkinlikler sessiz çalışır ve öğretmen sözcükleri kendisi söyler. Sesler
            üretildiğinde kaynağı burada yazacak; uygulama çalışırken hiçbir ses servisine bağlanmaz.
          </p>
        </section>
        </div>
      </div>
    </main>
  );
}
