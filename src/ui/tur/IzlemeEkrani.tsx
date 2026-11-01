/**
 * PARMAKLA İZLEME (Okuma Yazma planı §2.4.9 M-4, Adım 70; K-6 varsayılanı: hoşgörülü, puansız, P2) — YALNIZ
 * `VITE_DERS_TUR=1` derlemesinde. Yazılış gösteriminden "Parmakla izle" ile açılır (`?ders=tur&izle=kucuk:a`).
 *
 * Çocuk harfi hamle hamle, numaralı başlangıç noktasından ve oka göre parmağıyla izler (Pointer Events). Değerlendirme
 * `izleme.ts`: başlangıç, ortalama sapma, yön (+ en az yarı uzunluk); tahtada eşikler %50 geniş. Geçen hamle düz
 * çizilir, sıradakine geçilir; olmayan denemede çizim silinir ve aynı hamle yeniden istenir; üç denemeden sonra hamle
 * gösterilir ve geçilir. PUAN, YILDIZ, SÜRE YOK; ses yok (tek başına harf sesi hiç yok, K-OY-03).
 *
 * Çizim YALNIZ BELLEKTE (bileşen durumu): hiçbir yere yazılmaz; ekran değişince (Geri, Ana menü, başka harf)
 * bileşenle birlikte silinir. Tahtada çizim alanı alt bölgededir (üst %35'te dokunma yok, D-24); üstte örnek
 * (dokunulmaz) sıradaki hamleyi oklu gösterir. Sol el ayarı yönü aynalamaz (D-19).
 */
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { DeviceProfile } from '../../design/tokens';
import type { TurHamleGlifi } from '../../content/schema/turHamle';
import { BigButton } from '../primitives/BigButton';
import { SatirDizgesi } from './SatirDizgesi';
import { YazilisGlifi } from './YazilisGlifi';
import { cerceve, glifAdi, glifAnahtari, KALEM, KESIK_DIZISI, SATIR, yolVerisi, yonOku, type Nokta } from './hamleCizim';
import { hamleyiDegerlendir, IZLEME_BASI, IZLEME_ESIKLERI, izlemeIlerle, type IzlemeDurumu } from './izleme';
import { ekranStili } from './turOrtak';

const MUREKKEP = '#2B2B2B';
const COCUK = '#1D4ED8';
const GOSTERILDI = '#8A8578';
const OK = '#1D4ED8';

export function IzlemeEkrani({ glif, profil }: { glif: TurHamleGlifi; profil: DeviceProfile }) {
  const esik = IZLEME_ESIKLERI[profil === 'board' ? 'board' : 'tablet'];
  const c = cerceve(glif);
  // İzleme alanı dikeyde glife sıkı kırpılır (satır dizgesi + kuyruk/nokta + numara payı): harf olabildiğince büyük.
  const ys = glif.hamleler.flatMap((h) => h.noktalar.map((p) => p[1]));
  const y0 = Math.min(SATIR.ust, ...ys) - 9;
  const y1 = Math.max(SATIR.taban, ...ys) + 7;
  const kutu = `0 ${y0} ${c.genislik} ${y1 - y0}`;
  const n = glif.hamleler.length;
  const [durum, setDurum] = useState<IzlemeDurumu>(IZLEME_BASI);
  // Çocuğun geçen çizimleri (hamle başına) ve şu anki çizim — yalnız bellek.
  const [cizimler, setCizimler] = useState<readonly (readonly Nokta[])[]>([]);
  const [cizim, setCizim] = useState<readonly Nokta[] | null>(null);
  const [tekrar, setTekrar] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const isaretci = useRef<number | null>(null);
  // Şu anki çizimin kesin kopyası (işaretçi bırakılınca son hareketin işlenmemiş olma ihtimaline karşı).
  const anlik = useRef<Nokta[] | null>(null);
  const bitti = durum.hamle >= n;
  const aktif = bitti ? null : glif.hamleler[durum.hamle];

  const noktaAl = (e: ReactPointerEvent): Nokta | null => {
    const m = svg.current?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [+(p.x - c.dx).toFixed(2), +p.y.toFixed(2)];
  };
  const basla = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (bitti || !e.isPrimary || isaretci.current !== null) return;
    const p = noktaAl(e);
    if (!p) return;
    isaretci.current = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setTekrar(false);
    anlik.current = [p];
    setCizim([p]);
  };
  const surdur = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (isaretci.current !== e.pointerId) return;
    const p = noktaAl(e);
    if (!p) return;
    const cz = anlik.current;
    if (!cz) return;
    const son = cz[cz.length - 1];
    if (Math.hypot(p[0] - son[0], p[1] - son[1]) < 0.8) return;
    anlik.current = [...cz, p];
    setCizim(anlik.current);
  };
  const bitir = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (isaretci.current !== e.pointerId) return;
    isaretci.current = null;
    const cz = anlik.current;
    anlik.current = null;
    setCizim(null);
    if (!cz || !aktif) return;
    const sonuc = hamleyiDegerlendir(cz, aktif.noktalar, esik);
    const yeni = izlemeIlerle(durum, sonuc.gecti, n);
    if (sonuc.gecti) setCizimler([...cizimler, cz]);
    else if (yeni.hamle > durum.hamle) setCizimler([...cizimler, []]); // gösterildi: çocuğun çizimi yok
    setTekrar(!sonuc.gecti && yeni.hamle === durum.hamle);
    setDurum(yeni);
  };
  const bastan = () => {
    isaretci.current = null;
    anlik.current = null;
    setCizim(null);
    setCizimler([]);
    setTekrar(false);
    setDurum(IZLEME_BASI);
  };

  const ortak = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  const ok = aktif ? yonOku(aktif.noktalar) : null;
  const ad = glifAdi(glif);
  const cocukCizgisi = [...cizimler.filter((z) => z.length > 0), ...(cizim ? [cizim] : [])];

  return (
    <main
      aria-label={`Parmakla izle: ${ad}`}
      data-izleme-glif={glifAnahtari(glif)}
      data-izleme-hamle={bitti ? n : durum.hamle + 1}
      data-izleme-deneme={durum.deneme}
      data-izleme-bitti={bitti || undefined}
      data-izleme-biten={durum.biten.join(',')}
      data-cizim-sayisi={cocukCizgisi.length}
      style={{ ...ekranStili, justifyContent: 'space-between' }}
    >
      {/* Üst %35: örnek (dokunulmaz); sıradaki hamle oklu, adım kipinde. */}
      <section
        aria-label="Örnek"
        data-izleme-ornek=""
        style={{ flex: '0 0 35%', minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div style={{ flex: '1 1 auto', minHeight: 0, width: '100%', pointerEvents: 'none' }}>
          <YazilisGlifi glif={glif} kip={bitti ? 'tam' : 'adim'} adim={durum.hamle + 1} etiket={`${ad}, örnek`} />
        </div>
        <p data-yetiskin="" aria-live="polite" style={{ margin: 0, fontSize: 'var(--text-adult)', textAlign: 'center' }}>
          {bitti
            ? `${ad}: bitti.`
            : `${durum.hamle + 1}. hamle / ${n}: ${aktif?.aciklama ?? ''}${tekrar ? '. Bir daha deneyelim.' : ''}`}
        </p>
      </section>
      <section
        aria-label="İzleme alanı"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: 'var(--size-gap)',
        }}
      >
        <svg
          ref={svg}
          viewBox={kutu}
          preserveAspectRatio="xMidYMid meet"
          data-izleme-alani=""
          aria-label={`${ad} izleme alanı`}
          role="img"
          onPointerDown={basla}
          onPointerMove={surdur}
          onPointerUp={bitir}
          onPointerCancel={bitir}
          style={{
            height: '100%',
            maxWidth: '100%',
            aspectRatio: `${c.genislik} / ${y1 - y0}`,
            display: 'block',
            touchAction: 'none',
            userSelect: 'none',
            background: 'var(--color-surface)',
            borderRadius: 'calc(16px * var(--scale))',
            overflow: 'visible',
          }}
        >
          <SatirDizgesi genislik={c.genislik} />
          <g transform={`translate(${c.dx} 0)`}>
            {glif.hamleler.map((h, i) => (
              <path
                key={i}
                d={yolVerisi(h.noktalar)}
                data-izleme-yol={h.sira}
                stroke={i < durum.hamle ? (durum.biten[i] === 'gosterildi' ? GOSTERILDI : MUREKKEP) : MUREKKEP}
                strokeWidth={i < durum.hamle ? KALEM : 1.4}
                strokeDasharray={i < durum.hamle ? undefined : KESIK_DIZISI}
                {...ortak}
              />
            ))}
            {cocukCizgisi.map((z, i) => (
              <path key={`c${i}`} data-cocuk-cizimi="" d={yolVerisi(z)} stroke={COCUK} strokeWidth={KALEM * 0.8} opacity={0.75} {...ortak} />
            ))}
            {aktif && ok && (
              <g data-izleme-baslangic={aktif.sira} pointerEvents="none">
                <line x1={ok.govde[0][0]} y1={ok.govde[0][1]} x2={ok.govde[1][0]} y2={ok.govde[1][1]} stroke={OK} strokeWidth={1.3} strokeLinecap="round" />
                <polygon points={ok.uc.map((p) => p.join(',')).join(' ')} fill={OK} />
                <circle cx={aktif.noktalar[0][0]} cy={aktif.noktalar[0][1]} r={3.2} fill={OK} />
                <circle cx={ok.numara[0]} cy={ok.numara[1]} r={3.6} fill="#FFFFFF" stroke={OK} strokeWidth={1} />
                <text
                  x={ok.numara[0]}
                  y={ok.numara[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={4.6}
                  fontWeight={700}
                  fill={OK}
                  style={{ fontFamily: 'TemelYaziRakam, TemelYazi, sans-serif' }}
                >
                  {aktif.sira}
                </text>
              </g>
            )}
          </g>
        </svg>
        {/* Denetim alanın yanında (alttaki şerit dikey yer yemesin; harf büyük kalsın). */}
        <div
          className="alt-cubuk"
          role="group"
          aria-label="İzleme denetimleri"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: '0 0 auto' }}
        >
          <BigButton label="Baştan" variant={bitti ? 'accent' : 'solid'} onPress={bastan}>
            <span>Baştan</span>
          </BigButton>
        </div>
      </section>
    </main>
  );
}
