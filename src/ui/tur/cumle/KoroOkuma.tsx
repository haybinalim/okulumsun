/**
 * M-3 — KORO / YANKILAYICI OKUMA (T.O.1.1.c, T.O.1.1.h; plan §2.4.6, Adım 74). Tahta gösterimi, YALNIZ `VITE_DERS_TUR=1`.
 * Ayrı tembel parça (`KoroOkuma-*.js`, KG-156; `npm run boyut:ders` ek parça ≤ 40 KB).
 *
 * Öğretilen kümeyle okunabilen bir cümle büyük ve tek satırda (TemelYazi, sözcük bölünmez D-22) gösterilir. Öğretmen
 * "Sonraki sözcük"e dokundukça sözcük sözcük vurgulanır: vurgulu sözcüğün altı kalın çizgili ve zemini açık (renk tek
 * ipucu değil). Koro kipinde sınıf öğretmenle birlikte okur; yankı kipinde önce "Öğretmen okur", cümle bitince
 * "Sınıf tekrar eder" ve vurgu baştan yürür. Ses gerekmez (model okuma öğretmenin sesi); hiçbir şey saklanmaz,
 * süre ölçülmez (D-13). Tahtada denetimler alt bölgede (üst %35'te dokunulabilir öğe yok, D-24).
 */
import { useMemo, useState, type ComponentType, type CSSProperties } from 'react';
import { BigButton } from '../../primitives/BigButton';
import { dekodlanabilirMi } from '../../../content/dersler/tur/ogretilenKume';
import type { TurHavuzCumlesi } from '../../../content/dersler/tur/sablonlar/turSoru';
import type { CumleVerisiDurumu } from '../useCumleVerisi';

/**
 * Küme, cümle verisi, başlık ve ekran stili kabuktan (`TurEkrani`) gelir: bu parça `turKume`, `useCumleVerisi`,
 * `turOrtak` modüllerini içe aktarmaz; aksi hâlde paketleyici onları ortak parçalara böler ve Türkçe temel JS büyür
 * (KG-156 temel ≤ 120 KB).
 */
export interface KoroOkumaOzellikleri {
  readonly kume: ReadonlySet<string>;
  readonly cv: CumleVerisiDurumu;
  readonly ekranStili: CSSProperties;
  /** Başlık bileşeni (kabuktan; `turOrtak`). */
  readonly Baslik: ComponentType<{ baslik: string; alt?: string }>;
}

type Kip = 'koro' | 'yanki';

/** Kümeyle okunabilen cümleler (cümle parçasındaki süzgecin aynısı; bu parça onu içe aktarmaz). */
function okunabilir(cumleler: readonly TurHavuzCumlesi[], kume: ReadonlySet<string>): TurHavuzCumlesi[] {
  return cumleler.filter((c) => c.grup >= 2 && kume.has(c.girisHarfi) && dekodlanabilirMi(c.metin, kume));
}

export default function KoroOkuma({ kume, cv, ekranStili, Baslik }: KoroOkumaOzellikleri) {
  const liste = useMemo(() => {
    if (cv.durum !== 'hazir') return [];
    const l = okunabilir(cv.cumleler, kume);
    // En son açılan grubun cümleleri önce (bugünkü dersin cümleleri), sonra öncekiler.
    const enYeni = Math.max(0, ...l.map((c) => c.grup));
    return [...l.filter((c) => c.grup === enYeni), ...l.filter((c) => c.grup !== enYeni)];
  }, [cv, kume]);
  const [cumleSira, setCumleSira] = useState(0);
  const [sozcukSira, setSozcukSira] = useState(-1);
  const [kip, setKip] = useState<Kip>('koro');
  const [asama, setAsama] = useState<'ogretmen' | 'sinif'>('ogretmen');

  if (cv.durum !== 'hazir')
    return (
      <main data-yetiskin="" aria-label="Koro okuma" aria-busy={cv.durum === 'yukleniyor'} style={{ ...ekranStili, justifyContent: 'center' }}>
        <p>{cv.durum === 'hata' ? `Cümle verisi açılamadı: ${cv.mesaj}` : 'Yükleniyor'}</p>
      </main>
    );
  if (liste.length === 0)
    return (
      <main data-yetiskin="" aria-label="Koro okuma" data-koro-bos="" style={{ ...ekranStili, justifyContent: 'center' }}>
        <Baslik baslik="Koro ve yankılayıcı okuma" alt="Cümleler 2. harf grubundan itibaren (program). Öğretilen harfleri genişletin." />
      </main>
    );

  const cumle = liste[cumleSira % liste.length];
  const sozcukler = cumle.metin.split(' ');
  const son = sozcukler.length - 1;
  const bitti = sozcukSira >= son && (kip === 'koro' || asama === 'sinif');
  const cumleyeGit = (i: number) => {
    setCumleSira((i + liste.length) % liste.length);
    setSozcukSira(-1);
    setAsama('ogretmen');
  };
  const sonraki = () => {
    if (sozcukSira < son) setSozcukSira(sozcukSira + 1);
    else if (kip === 'yanki' && asama === 'ogretmen') {
      setAsama('sinif');
      setSozcukSira(0);
    }
  };
  const onceki = () => {
    if (sozcukSira > 0) setSozcukSira(sozcukSira - 1);
    else if (kip === 'yanki' && asama === 'sinif') {
      setAsama('ogretmen');
      setSozcukSira(son);
    } else setSozcukSira(-1);
  };
  const durum =
    kip === 'koro'
      ? 'Koro: hep birlikte okuyun.'
      : asama === 'ogretmen'
        ? 'Yankı: öğretmen okur.'
        : 'Yankı: sınıf tekrar eder.';
  const sozcukStili = (i: number): CSSProperties =>
    i === sozcukSira
      ? {
          background: 'var(--color-correct-soft)',
          boxShadow: 'inset 0 -0.09em 0 var(--color-ink)',
          borderRadius: '0.12em',
        }
      : {};
  return (
    <main
      aria-label="Koro okuma"
      data-koro-okuma={cumle.id}
      data-kip={kip}
      data-asama={kip === 'yanki' ? asama : undefined}
      data-vurgu={sozcukSira}
      style={{ ...ekranStili, justifyContent: 'space-between', gap: 'var(--size-gap-tight)' }}
    >
      <Baslik baslik="Koro ve yankılayıcı okuma" alt="Sözcük sözcük ilerleyin; ses gerekmez, model okumayı siz yaparsınız." />
      <div style={{ flex: '1 1 auto', minHeight: 0, width: '100%', containerType: 'size', display: 'grid', placeItems: 'center' }}>
        <p
          data-uyaran-metni="koro"
          aria-live="polite"
          style={{
            margin: 0,
            fontSize: `min(42cqh, calc(100cqw / ${Math.max(4, [...cumle.metin].length) * 0.62}))`,
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
          }}
        >
          {sozcukler.map((s, i) => (
            <span key={i}>
              <span data-koro-sozcuk={i} data-vurgulu={i === sozcukSira || undefined} style={{ padding: '0 0.06em', ...sozcukStili(i) }}>
                {s}
              </span>
              {i < son ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>
      <p data-yetiskin="" data-koro-durum="" style={{ margin: 0, fontSize: 'var(--text-adult)', textAlign: 'center', flex: '0 0 auto' }}>
        {durum} {bitti ? 'Cümle bitti.' : ''}
      </p>
      <div
        className="alt-cubuk"
        role="group"
        aria-label="Koro okuma denetimleri"
        data-yetiskin=""
        style={{ display: 'flex', gap: 'var(--size-gap-tight)', flexWrap: 'wrap', justifyContent: 'center', flex: '0 0 auto' }}
      >
        <BigButton label="Önceki cümle" data-yetiskin="" onPress={() => cumleyeGit(cumleSira - 1)}>
          <span>Önceki cümle</span>
        </BigButton>
        <BigButton label="Önceki sözcük" data-yetiskin="" disabled={sozcukSira < 0} onBlockedPress={() => undefined} onPress={onceki}>
          <span>Geri</span>
        </BigButton>
        <BigButton label="Sonraki sözcük" data-yetiskin="" variant="accent" disabled={bitti} onBlockedPress={() => undefined} onPress={sonraki}>
          <span>Sonraki sözcük</span>
        </BigButton>
        <BigButton
          label={kip === 'koro' ? 'Kip: koro' : 'Kip: yankı'}
          data-yetiskin=""
          onPress={() => {
            setKip(kip === 'koro' ? 'yanki' : 'koro');
            setSozcukSira(-1);
            setAsama('ogretmen');
          }}
        >
          <span>{kip === 'koro' ? 'Koro' : 'Yankı'}</span>
        </BigButton>
        <BigButton label="Sonraki cümle" data-yetiskin="" onPress={() => cumleyeGit(cumleSira + 1)}>
          <span>Sonraki cümle</span>
        </BigButton>
      </div>
    </main>
  );
}
