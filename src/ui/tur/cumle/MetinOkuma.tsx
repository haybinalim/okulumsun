/**
 * "METNİ OKU" — MODEL OKUMA (E2; Okuma Yazma Adım 80). Tahta gösterimi, YALNIZ `VITE_DERS_TUR=1` derlemesinde.
 * Ayrı tembel parça (`MetinOkuma-*.js`; `npm run boyut:ders` ek parça ≤ 40 KB). Koro okuma bileşenini yeniden kullanır:
 * sözcük sözcük vurgu `KoroOkuma.SozcukSatiri` ile aynıdır (alt çizgi + açık zemin, renk tek ipucu değil).
 *
 * Öğretilen kümeyle okunabilen kısa bir metin (cümle başına bir satır, TemelYazi, sözcük bölünmez D-22) büyük gösterilir.
 * Öğretmen "Sonraki sözcük"e dokundukça metin baştan sona sözcük sözcük vurgulanır. "Dinle" metnin cümle kliplerini
 * sırayla çalar (`tur.cumle.<metin>s<no>`); klip dosyası yoksa ya da alınamazsa "Ses yok" yazılır ve model okumayı
 * öğretmen yapar (hiçbir şey sessizce "çalındı" sayılmaz). Hiçbir şey saklanmaz, süre ölçülmez (D-13: okuma hızı yok).
 * Tahtada denetimler alt bölgede (üst %35'te dokunulabilir öğe yok, D-24).
 *
 * Parça `turKume`, `useMetinVerisi`, `turOrtak`, `turSes` modüllerini içe aktarmaz (küme, metin verisi, başlık ve ses
 * kabuktan özellik olarak gelir); aksi hâlde paketleyici onları ortak parçalara böler ve Türkçe temel JS büyür (KG-156).
 * Okunabilirlik süzgeci metin parçasıyla AYNI işlevdir (`okunabilirMetinler`): kural kopyası yok.
 */
import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import { BigButton } from '../../primitives/BigButton';
import { metinCumleKlibi } from '../../../content/dersler/tur/sablonlar/klipler';
import { okunabilirMetinler } from '../../../content/dersler/tur/sablonlar/metin/metinHavuzu';
import type { MetinVerisiDurumu } from '../useMetinVerisi';
import { SozcukSatiri } from './KoroOkuma';

export interface MetinOkumaOzellikleri {
  readonly kume: ReadonlySet<string>;
  readonly mv: MetinVerisiDurumu;
  readonly ekranStili: CSSProperties;
  readonly Baslik: ComponentType<{ baslik: string; alt?: string }>;
  /** Klipleri sırayla çalar (kabuktan `turKlipleriniIste`); `true`: hepsi çalındı, `false`: en az biri sessiz kaldı. */
  readonly sesIste: (klipler: readonly string[], secenekler?: { signal?: AbortSignal }) => Promise<boolean>;
  /** Çalan konuşmayı keser (kabuktan `turSesiniDurdur`). */
  readonly sesiDurdur: () => void;
}

export default function MetinOkuma({ kume, mv, ekranStili, Baslik, sesIste, sesiDurdur }: MetinOkumaOzellikleri) {
  const liste = useMemo(() => {
    if (mv.durum !== 'hazir') return [];
    const l = okunabilirMetinler(mv.metinler, kume);
    // En son açılan grubun metinleri önce (bugünkü dersin metinleri), sonra öncekiler.
    const enYeni = Math.max(0, ...l.map((m) => m.grup));
    return [...l.filter((m) => m.grup === enYeni), ...l.filter((m) => m.grup !== enYeni)];
  }, [mv, kume]);
  const [metinSira, setMetinSira] = useState(0);
  const [sozcukSira, setSozcukSira] = useState(-1);
  const [sesYok, setSesYok] = useState(false);
  const istek = useRef(0);
  const iptal = useRef<AbortController | null>(null);

  // Ekrandan ayrılırken çalan konuşma kesilir.
  useEffect(
    () => () => {
      iptal.current?.abort();
      sesiDurdur();
    },
    [sesiDurdur],
  );

  if (mv.durum !== 'hazir')
    return (
      <main data-yetiskin="" aria-label="Metni oku" aria-busy={mv.durum === 'yukleniyor'} style={{ ...ekranStili, justifyContent: 'center' }}>
        <p role={mv.durum === 'hata' ? 'alert' : undefined}>{mv.durum === 'hata' ? `Metin verisi açılamadı: ${mv.mesaj}` : 'Yükleniyor'}</p>
      </main>
    );
  if (liste.length === 0)
    return (
      <main data-yetiskin="" aria-label="Metni oku" data-metin-bos="" style={{ ...ekranStili, justifyContent: 'center' }}>
        <Baslik baslik="Metni oku" alt="Metinler 2. harf grubundan itibaren (program). Öğretilen harfleri genişletin." />
      </main>
    );

  const metin = liste[metinSira % liste.length];
  const sozcukSayilari = metin.cumleler.map((c) => c.split(' ').length);
  const toplam = sozcukSayilari.reduce((t, n) => t + n, 0);
  const son = toplam - 1;
  const bitti = sozcukSira >= son;
  const enUzun = Math.max(...metin.cumleler.map((c) => [...c].length));
  const yazi = `min(${(90 / (metin.cumleler.length * 1.25)).toFixed(2)}cqh, calc(100cqw / ${(enUzun * 0.66).toFixed(2)}))`;
  const durdur = () => {
    iptal.current?.abort();
    iptal.current = null;
    sesiDurdur();
  };
  const metineGit = (i: number) => {
    durdur();
    istek.current++;
    setSesYok(false);
    setMetinSira((i + liste.length) % liste.length);
    setSozcukSira(-1);
  };
  const dinle = () => {
    durdur();
    const kontrol = new AbortController();
    iptal.current = kontrol;
    const no = ++istek.current;
    void sesIste(
      metin.cumleler.map((_, i) => metinCumleKlibi(metin.id, i + 1)),
      { signal: kontrol.signal },
    ).then((calindi) => {
      if (no === istek.current) setSesYok(!calindi);
    });
  };
  let kalan = sozcukSira;
  return (
    <main
      aria-label="Metni oku"
      data-metin-okuma={metin.id}
      data-vurgu={sozcukSira}
      style={{ ...ekranStili, justifyContent: 'space-between', gap: 'var(--size-gap-tight)' }}
    >
      <Baslik baslik="Metni oku" alt="Sözcük sözcük ilerleyin ya da Dinle'ye dokunun; ses yoksa model okumayı siz yaparsınız." />
      <div style={{ flex: '1 1 auto', minHeight: 0, width: '100%', containerType: 'size', display: 'grid', placeItems: 'center' }}>
        <div data-metin-satirlari={metin.cumleler.length} style={{ fontSize: yazi, lineHeight: 1.25, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {metin.cumleler.map((c, i) => {
            const yerel = kalan >= 0 && kalan < sozcukSayilari[i] ? kalan : -1;
            kalan -= sozcukSayilari[i];
            return <SozcukSatiri key={i} metin={c} vurgu={yerel} veri="metin" canli={yerel >= 0} stil={{ fontSize: 'inherit' }} />;
          })}
        </div>
      </div>
      <p data-yetiskin="" data-metin-durum="" style={{ margin: 0, fontSize: 'var(--text-adult)', textAlign: 'center', flex: '0 0 auto' }}>
        {bitti ? 'Metin bitti. ' : ''}
        {sesYok && (
          <span data-ses-yok="" role="status" style={{ background: 'var(--color-retry-soft)', borderRadius: '0.4em', padding: '0.1em 0.5em' }}>
            Ses yok: model okumayı siz yapın.
          </span>
        )}
      </p>
      <div
        className="alt-cubuk"
        role="group"
        aria-label="Metin okuma denetimleri"
        data-yetiskin=""
        style={{ display: 'flex', gap: 'var(--size-gap-tight)', flexWrap: 'wrap', justifyContent: 'center', flex: '0 0 auto' }}
      >
        <BigButton label="Önceki metin" data-yetiskin="" onPress={() => metineGit(metinSira - 1)}>
          <span>Önceki metin</span>
        </BigButton>
        <BigButton
          label="Önceki sözcük"
          data-yetiskin=""
          disabled={sozcukSira < 0}
          onBlockedPress={() => undefined}
          onPress={() => setSozcukSira(sozcukSira - 1)}
        >
          <span>Geri</span>
        </BigButton>
        <BigButton
          label="Sonraki sözcük"
          data-yetiskin=""
          variant="accent"
          disabled={bitti}
          onBlockedPress={() => undefined}
          onPress={() => setSozcukSira(sozcukSira + 1)}
        >
          <span>Sonraki sözcük</span>
        </BigButton>
        <BigButton label="Dinle" data-yetiskin="" onPress={dinle}>
          <span>Dinle</span>
        </BigButton>
        <BigButton label="Sonraki metin" data-yetiskin="" onPress={() => metineGit(metinSira + 1)}>
          <span>Sonraki metin</span>
        </BigButton>
      </div>
    </main>
  );
}
