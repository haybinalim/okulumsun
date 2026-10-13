/**
 * ÇALIŞMA KÂĞIDI — yazdırılabilir A4 + cevap anahtarı (plan v2 Adım 35, ADR-0006, KG-44).
 *
 * Öğretmen alanı (veli kapısı arkası): bugünün seti `kagitSeti`nden madde sayısı, düzen, yanıt biçimi ve cevap anahtarı
 * ayarlanır; önizleme sağda, "Yazdır" tarayıcı yazdırma diyaloğunu açar ("PDF olarak kaydet" çevrimdışı çalışır).
 * Tüm dokunulabilir öğeler alt %65'te ve tahta hedef boyutundadır. Hiçbir şey saklanmaz; kâğıt koddan yeniden üretilir.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';
import {
  KAGIT_DUZENLERI,
  MADDE_SAYILARI,
  kagitPlaniUret,
  kagitaGirmeyenDugumler,
  type KagitDuzeni,
  type MaddeSayisi,
  type YanitTercihi,
} from '../../ogretmen/calismaKagidi/kagitPlani';
import { trDuzlestir } from '../../ogretmen/calismaKagidi/sesMetni';
import { skillsData } from '../../content/skillsData';
import { KagitSayfalari } from '../print/KagitSayfalari';

const A4_GENISLIK_PX = 794;

const DUZEN_ETIKETI: Readonly<Record<KagitDuzeni, string>> = { '2x3': '2 × 3', '1x4': '1 × 4' };
const DUZEN_AD: Readonly<Record<KagitDuzeni, string>> = { '2x3': '2 sütun × 3 sıra', '1x4': 'Tek sütun × 4 sıra' };
const YANIT_ETIKETI: Readonly<Record<YanitTercihi, string>> = {
  daireIcineAl: 'Daire içine al',
  yazmaliOlabilir: 'Yazmalı da olur',
};

function Secim<T extends string | number>({
  etiket,
  secenekler,
  deger,
  yaz,
  sec,
  ad = yaz,
}: {
  etiket: string;
  secenekler: readonly T[];
  deger: T;
  yaz: (v: T) => string;
  sec: (v: T) => void;
  /** Erişilebilir ad (görünen metin kısaysa uzun hâli). */
  ad?: (v: T) => string;
}) {
  return (
    <div role="group" aria-label={etiket} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--size-gap-tight)', alignItems: 'center' }}>
      <span style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, minWidth: 150, fontWeight: 700 }}>{etiket}</span>
      {secenekler.map((s) => (
        <BigButton
          key={s}
          label={`${etiket}: ${ad(s)}`}
          size="tapMin"
          ariaPressed={s === deger}
          onPress={() => sec(s)}
          style={{
            padding: '0 18px',
            fontSize: 'var(--text-adult)',
            fontWeight: 700,
            border: `3px solid ${s === deger ? COLOR.ink : 'transparent'}`,
            background: s === deger ? COLOR.surface : undefined,
          }}
        >
          {s === deger ? '✓ ' : ''}
          {yaz(s)}
        </BigButton>
      ))}
    </div>
  );
}

export function CalismaKagidi() {
  const ekranGit = useAppStore((s) => s.ekranGit);
  const kagitSeti = useAppStore((s) => s.kagitSeti);
  const oncekiEkran = useAppStore((s) => s.oncekiEkran);
  const [maddeSayisi, setMaddeSayisi] = useState<MaddeSayisi>(6);
  const [duzen, setDuzen] = useState<KagitDuzeni>('2x3');
  const [yanitTercihi, setYanitTercihi] = useState<YanitTercihi>('daireIcineAl');
  const [anahtarDahil, setAnahtarDahil] = useState(true);
  const [siyahBeyaz, setSiyahBeyaz] = useState(false);
  const [tr, setTr] = useState<Record<string, string> | null>(null);

  // tr.json ana pakete girmez: yalnız bu ekran açılınca yüklenir.
  useEffect(() => {
    let iptal = false;
    void import('../../content/tr.json').then((m) => {
      if (!iptal) setTr(trDuzlestir(m.default as unknown as Record<string, unknown>));
    });
    return () => {
      iptal = true;
    };
  }, []);

  const plan = useMemo(
    () => (tr && kagitSeti ? kagitPlaniUret({ set: kagitSeti, maddeSayisi, duzen, yanitTercihi }, tr) : null),
    [tr, kagitSeti, maddeSayisi, duzen, yanitTercihi],
  );
  const atlananlar = useMemo(
    () => (kagitSeti ? kagitaGirmeyenDugumler(kagitSeti, yanitTercihi) : []),
    [kagitSeti, yanitTercihi],
  );
  const etiket = (id: string): string => skillsData.find((d) => d.id === id)?.childLabel ?? id;

  // Yazdırma kopyası <body>'nin doğrudan çocuğu (kabuk gizlenir, yalnız bu basılır).
  const [baskiKabi, setBaskiKabi] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const kap = document.createElement('div');
    kap.id = 'kagit-baski';
    document.body.appendChild(kap);
    setBaskiKabi(kap);
    return () => {
      kap.remove();
      setBaskiKabi(null);
    };
  }, []);

  // Önizleme ölçeği: sağ sütuna sığacak kadar (en çok 1).
  const onizlemeRef = useRef<HTMLDivElement>(null);
  const [olcek, setOlcek] = useState(0.5);
  useLayoutEffect(() => {
    const el = onizlemeRef.current;
    if (!el) return;
    const olc = () => setOlcek(Math.min(1, Math.max(0.3, (el.clientWidth - 24) / A4_GENISLIK_PX)));
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const yazdir = () => window.print();

  return (
    <main
      aria-labelledby="kagit-baslik"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap-tight)',
        overflow: 'hidden',
      }}
    >
      {/* Üst %35: yalnız bilgi. */}
      <header style={{ flex: '0 0 26%', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        <h1 id="kagit-baslik" style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
          Çalışma kâğıdı
        </h1>
        <p style={{ fontSize: 'var(--text-adult)', color: COLOR.inkSoft, margin: 0 }}>
          Bugünün setinden A4 kâğıt ve cevap anahtarı. Yazdırırken “PDF olarak kaydet” de seçilebilir; internet gerekmez.
        </p>
        {kagitSeti && (
          <p style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
            Etkinlikler: {kagitSeti.dugumler.map(etiket).join(' · ')}
          </p>
        )}
        <p role="status" aria-live="polite" data-kagit-durum style={{ fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 }}>
          {plan ? `Kâğıt kodu: ${plan.kod}` : 'Kâğıt hazırlanıyor…'}
          {plan && plan.eksik > 0 ? ` · ${plan.eksik} madde kâğıda sığmadı ya da uygun değil` : ''}
          {atlananlar.length > 0 ? ` · Kâğıda girmeyen: ${atlananlar.map(etiket).join(', ')}` : ''}
        </p>
      </header>

      {/* Alt %65: ayarlar solda, önizleme sağda. */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 'var(--size-gap-tight)' }}>
        <section
          aria-label="Kâğıt ayarları"
          style={{ flex: '0 0 48%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--size-gap-tight)', overflow: 'auto' }}
        >
          <Secim etiket="Madde sayısı" secenekler={MADDE_SAYILARI} deger={maddeSayisi} yaz={String} sec={setMaddeSayisi} />
          <Secim etiket="Düzen" secenekler={KAGIT_DUZENLERI} deger={duzen} yaz={(d) => DUZEN_ETIKETI[d]} ad={(d) => DUZEN_AD[d]} sec={setDuzen} />
          <Secim
            etiket="Yanıt biçimi"
            secenekler={['daireIcineAl', 'yazmaliOlabilir'] as const}
            deger={yanitTercihi}
            yaz={(y) => YANIT_ETIKETI[y]}
            sec={setYanitTercihi}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--size-gap-tight)' }}>
            {([
              ['Cevap anahtarı dahil', anahtarDahil, () => setAnahtarDahil(!anahtarDahil)],
              ['Siyah-beyaz', siyahBeyaz, () => setSiyahBeyaz(!siyahBeyaz)],
            ] as const).map(([ad, acik, degistir]) => (
              <BigButton
                key={ad}
                label={ad}
                size="tapMin"
                ariaPressed={acik}
                onPress={degistir}
                style={{
                  padding: '0 18px',
                  fontSize: 'var(--text-adult)',
                  fontWeight: 700,
                  border: `3px solid ${acik ? COLOR.ink : 'transparent'}`,
                  background: acik ? COLOR.surface : undefined,
                }}
              >
                {acik ? '✓ ' : ''}
                {ad}
              </BigButton>
            ))}
          </div>
        </section>
        <section
          ref={onizlemeRef}
          aria-label="Kâğıt önizlemesi"
          data-kagit-onizleme
          style={{ flex: 1, minWidth: 0, overflow: 'auto', background: COLOR.surface, borderRadius: 16, padding: 12 }}
        >
          {plan && (
            <div style={{ zoom: olcek }}>
              <KagitSayfalari plan={plan} duzen={duzen} cevapAnahtariDahil={anahtarDahil} siyahBeyaz={siyahBeyaz} kopya="onizleme" />
            </div>
          )}
        </section>
      </div>

      <footer style={{ flex: '0 0 auto', display: 'flex', gap: 'var(--size-gap-tight)', alignItems: 'center' }}>
        <BigButton label="Geri" size="tapMin" variant="ghost" onPress={() => ekranGit(oncekiEkran === 'haftalikPlan' ? 'haftalikPlan' : 'setHazirla')} style={{ padding: '0 20px' }}>
          ← Geri
        </BigButton>
        <BigButton
          label="Yazdır"
          size="tapMin"
          variant="accent"
          disabled={!plan || plan.sayfalar.length === 0}
          onBlockedPress={() => undefined}
          onPress={yazdir}
          style={{ padding: '0 32px', fontWeight: 700 }}
        >
          Yazdır
        </BigButton>
      </footer>

      {baskiKabi && plan && createPortal(
        <KagitSayfalari plan={plan} duzen={duzen} cevapAnahtariDahil={anahtarDahil} siyahBeyaz={siyahBeyaz} kopya="baski" />,
        baskiKabi,
      )}
    </main>
  );
}

export default CalismaKagidi;
