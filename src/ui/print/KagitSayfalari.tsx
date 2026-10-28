/**
 * KÂĞIT SAYFALARI — çalışma kâğıdının HTML+SVG gövdesi (plan v2 Adım 35, ADR-0006).
 *
 * Çalışma anında PDF kütüphanesi yok: aynı bileşen hem ekran önizlemesinde hem yazdırma kopyasında
 * kullanılır; tarayıcının "PDF olarak kaydet"i çevrimdışı PDF üretir. Renk tek başına anlam taşımaz
 * (rakam/harf/desen de var); "Siyah-beyaz" seçeneği `filter: grayscale(1)` ile hem önizler hem basar.
 */
import type { CSSProperties } from 'react';
import type { OptionDeger, VisualSpec } from '../../exercises/types';
import { anahtarSayfalari, grupCumlesi, type AnahtarSayfasi } from '../../ogretmen/calismaKagidi/anahtarSayfalari';
import {
  EYLEM_METNI,
  type KagitMaddesi,
  type KagitSecenegi,
  type YonergeIkonu,
} from '../../ogretmen/calismaKagidi/kagitMaddesi';
import type { KagitDuzeni, KagitPlani } from '../../ogretmen/calismaKagidi/kagitPlani';
import { maddeKaplama, sahneKutusu, sahneYanSecenekli } from '../../ogretmen/calismaKagidi/kagitYerlesimi';
import { SematikBanknot } from '../svg/SematikBanknot';
import { ortakKumeBoyutu, type KumeTarifi } from '../svg/kumeYerlesimi';
import { KAGIT_NESNE_EN_AZ_MM, KAGIT_NESNE_EN_BUYUK_MM, Visual, type BaskiOlcegi } from '../svg/Visual';
import './kagit.css';
import {
  ROZET_SERIDI_MM,
  SECENEK_BOSLUK,
  SECENEK_MM_BIRIM,
  YERLESIK_DOLGU_MM,
  kumeSecenekYerlesimi,
  type SecenekYerlesimi,
} from './secenekYerlesimi';
import { KAGIT_ALT_YAZI, KAGIT_AYRAC, kagitYazisi } from './kagitYazisi';

const TERIM_METNI: Readonly<Record<string, string>> = {
  cok: 'çok',
  'daha-cok': 'daha çok',
  az: 'az',
  'daha-az': 'daha az',
  esit: 'eşit',
};
const KATEGORI_METNI: Readonly<Record<string, string>> = { yuvarlak: 'yuvarlak', koseli: 'köşeli' };

/**
 * Kısa çizgili metin (KG-98): kâğıt kodu ve "Ç-kodu:" etiketi. Metin aynen kalır ("ETKI-1-A"; kopyala-yapıştır
 * ve `?arsiv=` aynı), yalnız görüntüde '-' daraltılır: TemelYazi'nin '-' glifi MEB işlem çizgisidir (eksi ile
 * aynı, 0,6 em), kodun içinde "ETKI–1–A" gibi uzun görünüyordu.
 */
export function KisaCizgili({ metin }: { readonly metin: string }) {
  return (
    <span className="kg-kod">
      {metin.split('-').map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="kg-kod-ayrac">-</span>}
          {p}
        </span>
      ))}
    </span>
  );
}

/** Aynı plan → aynı çıktı; testler ve e2e "SVG özeti"ni buradan alır. */
export interface KagitSayfalariProps {
  readonly plan: KagitPlani;
  readonly duzen: KagitDuzeni;
  readonly cevapAnahtariDahil: boolean;
  readonly siyahBeyaz: boolean;
  readonly kopya: 'onizleme' | 'baski';
  /** Üst bilgideki yazma satırının etiketi; varsayılan "Adım:" (etki formunda "Ç-kodu:", KG-93). */
  readonly adEtiketi?: string;
}

function Ikon({ ikon }: { ikon: YonergeIkonu }) {
  const ortak = {
    fill: 'none',
    stroke: '#000',
    strokeWidth: 3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  return (
    <svg className="kg-ikon" viewBox="0 0 32 32" aria-hidden="true">
      {ikon === 'kalem' && <path {...ortak} d="M6 26l2-7L22 5l5 5L13 24z M19 8l5 5" />}
      {ikon === 'cizgi' && <path {...ortak} d="M5 9h6 M21 23h6 M11 9l10 14" />}
      {ikon === 'sira' && <path {...ortak} d="M6 8h4v6 M6 24h6l-6-5h6 M18 10h9 M18 22h9" />}
      {ikon === 'kulak' && <path {...ortak} d="M11 12a6 6 0 1 1 10 4c-2 2-3 3-3 6a3 3 0 0 1-6 0" />}
    </svg>
  );
}

/** Banknot: kâğıtta (ekran ve arşivle aynı) şematik "oyun parası" (KG-19, KG-121). */
function BanknotGorseli({ deger, genislik }: { deger: 5 | 10 | 20 | 50 | 100 | 200; genislik: number }) {
  return <SematikBanknot deger={deger} genislik={genislik} />;
}

/**
 * Seçenek kutusundaki görselin çizim genişliği (birim) ve basılı mm karşılığı: kutu 26 mm − 2 × 1,2 mm kontur
 * − 2 × 1 mm dolgu = 21,6 mm (KG-105; kümeler bu ölçekle büyür).
 */
const SECENEK_GORSEL_BIRIM = 140;
const SECENEK_BASKISI: BaskiOlcegi = { mmBirim: 21.6 / SECENEK_GORSEL_BIRIM };

function SecenekIcerigi({
  deger,
  kumeBoyutu,
  yerlesik,
}: {
  deger: OptionDeger;
  kumeBoyutu?: number;
  yerlesik?: SecenekYerlesimi;
}) {
  // KG-106: genişletilmiş küme kutusunda çizim iç alanın mm ölçüsüyle (1 birim = 0,1 mm).
  if (yerlesik && deger.tur === 'gorsel' && deger.gorsel.type === 'nesneKumesi')
    return (
      <Visual
        spec={deger.gorsel}
        width={Math.round(yerlesik.ic.w / SECENEK_MM_BIRIM)}
        height={Math.round(yerlesik.ic.h / SECENEK_MM_BIRIM)}
        baski={{ mmBirim: SECENEK_MM_BIRIM, kumeBoyutu: yerlesik.boyut, bosluk: SECENEK_BOSLUK }}
      />
    );
  switch (deger.tur) {
    case 'sayi':
      return <Visual spec={{ type: 'rakam', sayi: deger.sayi }} width={120} height={120} />;
    case 'sekil':
      return <Visual spec={{ type: 'sekil', sekil: deger.sekil }} width={140} height={140} />;
    case 'banknot':
      return <BanknotGorseli deger={deger.deger} genislik={150} />;
    case 'gorsel':
      return deger.gorsel.type === 'banknot' ? (
        <BanknotGorseli deger={deger.gorsel.deger} genislik={150} />
      ) : (
        <Visual
          spec={deger.gorsel}
          width={deger.gorsel.type === 'islemKarti' ? 220 : SECENEK_GORSEL_BIRIM}
          height={SECENEK_GORSEL_BIRIM}
          baski={{ ...SECENEK_BASKISI, kumeBoyutu }}
        />
      );
    case 'terim':
      return <span className="kg-yazi">{TERIM_METNI[deger.terim] ?? deger.terim}</span>;
    case 'sekilKategorisi':
      return <span className="kg-yazi">{KATEGORI_METNI[deger.kategori] ?? deger.kategori}</span>;
    case 'metin':
      return <span className="kg-yazi">{kagitYazisi(deger.metin)}</span>;
  }
}

function Secenek({
  s,
  harfRozeti,
  kutu,
  kumeBoyutu,
  yerlesik,
  yer,
}: {
  s: KagitSecenegi;
  harfRozeti: boolean;
  kutu: boolean;
  kumeBoyutu?: number;
  yerlesik?: SecenekYerlesimi;
  yer?: SecenekYerlesimi['yerler'][number];
}) {
  const genis =
    s.deger.tur === 'banknot' ||
    (s.deger.tur === 'gorsel' && (s.deger.gorsel.type === 'banknot' || s.deger.gorsel.type === 'islemKarti'));
  const kume = yerlesik && s.deger.tur === 'gorsel' && s.deger.gorsel.type === 'nesneKumesi';
  const sarmaStili: CSSProperties | undefined = yer
    ? { gridRow: `${yer.satir} / ${yer.satirBitis}`, gridColumn: `${yer.sutun} / ${yer.sutunBitis}` }
    : undefined;
  const kutuStili: CSSProperties | undefined =
    kume && yerlesik
      ? {
          width: `${yerlesik.kume.w}mm`,
          height: `${yerlesik.kume.h}mm`,
          padding: `${YERLESIK_DOLGU_MM}mm`,
          [yerlesik.serit === 'sol' ? 'paddingLeft' : 'paddingTop']: `${YERLESIK_DOLGU_MM + ROZET_SERIDI_MM}mm`,
        }
      : undefined;
  return (
    <div className={`kg-secenek-sarma${yer ? ' kg-secenek-sarma--yerlesik' : ''}`} style={sarmaStili}>
      <div
        className={`kg-secenek${genis ? ' kg-secenek--genis' : ''}${kume ? ' kg-secenek--yerlesik' : ''}`}
        data-secenek={s.etiket}
        style={kutuStili}
      >
        {harfRozeti && <span className="kg-rozet">{s.etiket}</span>}
        <SecenekIcerigi deger={s.deger} kumeBoyutu={kumeBoyutu} yerlesik={kume ? yerlesik : undefined} />
      </div>
      {kutu && <span className="kg-yaz-kutusu kg-yaz-kutusu--kucuk" aria-hidden="true" />}
    </div>
  );
}

/**
 * Sahne (KG-105). Kutu (`.kg-sahne`) maddede kalan gerçek yeri doldurur; çizim (`.kg-sahne-ic`) kendi en-boy
 * oranıyla bu kutuya sığar, işaretler çizime göre yüzdeyle konur.
 *  · Geniş çerçeve (nesne kümesi, işlem sahnesi, bileşik sahne, onluk çerçeve, örüntü, sayı doğrusu, ölçme…):
 *    çizim kutunun tahmini mm ölçüsüyle (`sahneKutusu`, 1 birim = 0,1 mm) yapılır; kümeler ızgarayla ve
 *    ≤ 14 mm nesneyle dizilir. Eskiden 500 × 350'lik çizim 28 mm yüksekliğe ölçekleniyor, nesneler ~5 mm kalıyordu.
 *    İşaretler (hotspot, boş yuva) normalize konumludur; bu çizimlerde normalize geometri en-boy oranından
 *    bağımsız olduğundan geniş çerçevede de yerini bulur.
 *  · Sabit oran (konum sahnesi, yön kartı, banknot, işlem kartı, şekilli GEO sahneleri): ekrandaki 500 × 350 oranı ve kenar payı; yalnız
 *    kutu büyüdükçe ölçeklenir.
 */
const SAHNE_W = 500;
const SAHNE_H = 350;
const SAHNE_PAY = 34;
const MM_BIRIM = 10;
const SABIT_ORANLI = new Set<VisualSpec['type']>(['konumSahnesi', 'yonKarti', 'banknot', 'islemKarti']);
/** Nesneleri kutunun içinde kalan çizimler: kenar payı gerekmez. */
const PAYSIZ = new Set<VisualSpec['type']>(['nesneKumesi', 'islemSahnesi']);

function Sahne({ spec, m, duzen }: { spec: VisualSpec; m: KagitMaddesi; duzen: KagitDuzeni }) {
  // GEO sahneleri (örtüşen şekiller + işaretler) ekrandaki oranında kalır: geniş çerçevede şekiller hücreden taşıyordu.
  const genis =
    !SABIT_ORANLI.has(spec.type) && !(spec.type === 'sahne' && spec.parcalar.some((p) => p.gorsel.type === 'sekil'));
  const kutu = sahneKutusu(m, duzen);
  const w = genis ? Math.round(kutu.w * MM_BIRIM) : SAHNE_W;
  const h = genis ? Math.round(kutu.h * MM_BIRIM) : SAHNE_H;
  // KG-106: yalnız nesne kümelerinden oluşan bileşik sahne de kutunun içinde kalır (kenar payı nesneye verilir).
  const payliYok =
    PAYSIZ.has(spec.type) || (spec.type === 'sahne' && spec.parcalar.every((p) => p.gorsel.type === 'nesneKumesi'));
  const pay = !genis ? SAHNE_PAY : payliYok ? 0 : Math.round(h * 0.04);
  const toplamW = w + 2 * pay;
  const toplamH = h + 2 * pay;
  const yuzde = (v: number, boyut: number, toplam: number): string => `${((pay + v * boyut) / toplam) * 100}%`;
  return (
    <div className="kg-sahne" data-sahne-turu={genis ? 'genis' : 'sabit'}>
      <div className="kg-sahne-ic" style={{ '--sahne-oran': toplamW / toplamH } as CSSProperties}>
        <svg viewBox={`${-pay} ${-pay} ${toplamW} ${toplamH}`} aria-hidden="true">
          <Visual spec={spec} width={w} height={h} baski={genis ? { mmBirim: 1 / MM_BIRIM } : undefined} />
        </svg>
        {m.isaretler.map((i) => {
          const x = Math.min(0.97, Math.max(0.03, i.x));
          const y = Math.min(0.97, Math.max(0.03, m.yanitBicimi === 'daireIcineAl' ? i.y + i.yaricap : i.y));
          return (
            <span
              key={i.etiket}
              className="kg-isaret"
              style={{ left: yuzde(x, w, toplamW), top: yuzde(y, h, toplamH) }}
            >
              {i.etiket}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Aynı maddedeki küme seçeneklerinin ortak nesne boyu (KG-105; karşılaştırmada boy miktarla değişmez). */
function secenekKumeBoyutu(m: KagitMaddesi): number | undefined {
  const kumeler = m.secenekler.flatMap((s) =>
    s.deger.tur === 'gorsel' && s.deger.gorsel.type === 'nesneKumesi'
      ? [{ spec: s.deger.gorsel as KumeTarifi, w: SECENEK_GORSEL_BIRIM, h: SECENEK_GORSEL_BIRIM }]
      : [],
  );
  return ortakKumeBoyutu(
    kumeler,
    KAGIT_NESNE_EN_BUYUK_MM / SECENEK_BASKISI.mmBirim,
    KAGIT_NESNE_EN_AZ_MM / SECENEK_BASKISI.mmBirim,
  );
}

function Madde({ m, duzen }: { m: KagitMaddesi; duzen: KagitDuzeni }) {
  const kaplama = maddeKaplama(m, duzen) ?? 1;
  const yatay = duzen === '1x4' || kaplama === 2;
  const sirali = m.yanitBicimi === 'siraNumarasiYaz';
  const sol = m.secenekler.filter((s) => s.taraf === 'sol');
  const sag = m.secenekler.filter((s) => s.taraf === 'sag');
  const kumeBoyutu = secenekKumeBoyutu(m);
  // KG-106: karşılaştırma maddesinde küme kutuları maddedeki boş yeri kullanır (sayfa planı aynı).
  const yerlesik = kumeSecenekYerlesimi(m, duzen) ?? undefined;
  return (
    <article
      className={`kg-madde kg-madde--k${kaplama}${yatay ? ' kg-madde--yatay' : ''}${
        sahneYanSecenekli(m, duzen) ? ' kg-madde--yan-secenek' : ''
      }`}
      data-madde={m.no}
      data-sablon={m.templateId}
      data-yanit={m.yanitBicimi}
    >
      <div className="kg-yonerge">
        <span className="kg-no">{m.no}</span>
        <Ikon ikon={m.yonergeIkonu} />
        <span className="kg-yonerge-metin">
          {kagitYazisi(m.yonergeMetni)}
          <small>{kagitYazisi(EYLEM_METNI[m.yanitBicimi])}</small>
        </span>
      </div>
      {m.yanitBicimi === 'cizgiyleEsle' ? (
        <div className="kg-esle">
          <div className="kg-esle-satir">
            {sol.map((s) => (
              <Secenek key={s.id} s={s} harfRozeti kutu={false} kumeBoyutu={kumeBoyutu} />
            ))}
          </div>
          <div className="kg-esle-satir">
            {sag.map((s) => (
              <Secenek key={s.id} s={s} harfRozeti kutu={false} kumeBoyutu={kumeBoyutu} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="kg-govde">
            {m.sahne && <Sahne spec={m.sahne} m={m} duzen={duzen} />}
            {m.secenekler.length > 0 && !yerlesik && (
              <div className="kg-secenekler">
                {m.secenekler.map((s) => (
                  <Secenek key={s.id} s={s} harfRozeti={m.harfRozeti} kutu={sirali} kumeBoyutu={kumeBoyutu} />
                ))}
              </div>
            )}
            {yerlesik && (
              <div
                className="kg-secenekler kg-secenekler--yerlesik"
                data-secenek-duzeni={yerlesik.duzen}
                style={{
                  gridTemplateColumns: yerlesik.sutunlar.map((x) => `${x}mm`).join(' '),
                  gridTemplateRows: yerlesik.satirlar.map((x) => `${x}mm`).join(' '),
                }}
              >
                {m.secenekler.map((s, i) => (
                  <Secenek
                    key={s.id}
                    s={s}
                    harfRozeti={m.harfRozeti}
                    kutu={false}
                    yerlesik={yerlesik}
                    yer={yerlesik.yerler[i]}
                  />
                ))}
              </div>
            )}
          </div>
          {m.kutular.length > 0 && !sirali && (
            <div className="kg-kutular">
              {m.kutular.map((k, i) => (
                <span key={`${k}-${i}`} className="kg-kutu-grup">
                  {k !== '' && <b>{k}:</b>}
                  <span className="kg-yaz-kutusu" aria-hidden="true" />
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  );
}

function Anahtar({ sayfa }: { sayfa: AnahtarSayfasi }) {
  return (
    <div className="kg-anahtar-govde">
      {sayfa.satirlar.length > 0 && (
        <table className="kg-anahtar">
          <colgroup>
            <col className="kg-anahtar-no" />
            <col className="kg-anahtar-dogru" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>Soru</th>
              <th>Doğru cevap</th>
              <th>Çeldirici notları</th>
            </tr>
          </thead>
          <tbody>
            {sayfa.satirlar.map((s) => (
              <tr key={s.no} data-anahtar={s.no}>
                <td>{s.no}</td>
                <td>
                  <strong>{kagitYazisi(s.dogru)}</strong>
                </td>
                <td>
                  {s.gruplar.length === 0 ? (
                    <span>-</span>
                  ) : (
                    s.gruplar.map((g) => (
                      <span key={g.tani} className="kg-anahtar-not">
                        {kagitYazisi(grupCumlesi(g))}
                      </span>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {sayfa.telafi.length > 0 && (
        <section className="kg-telafi" aria-label="Telafi önerileri">
          {sayfa.telafiBasligi && <h3>Telafi önerileri</h3>}
          <ul>
            {sayfa.telafi.map((t) => (
              <li key={t.tani}>
                <strong>{kagitYazisi(t.tani)}:</strong> {kagitYazisi(t.ipucu)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function KagitSayfalari({
  plan,
  duzen,
  cevapAnahtariDahil,
  siyahBeyaz,
  kopya,
  adEtiketi = 'Adım:',
}: KagitSayfalariProps) {
  // KG-102: anahtar sayfaları kodda planlanır; altbilgideki N = basılan gerçek sayfa sayısı.
  const anahtar = cevapAnahtariDahil ? anahtarSayfalari(plan.cevapAnahtari) : [];
  const toplam = plan.sayfalar.length + anahtar.length;
  return (
    <div
      className={`kg-kok kg-kok--${kopya}${siyahBeyaz ? ' kg-kok--gri' : ''}`}
      data-kagit-kodu={plan.kod}
      data-sayfa-sayisi={toplam}
      aria-hidden={kopya === 'baski' ? true : undefined}
    >
      {plan.sayfalar.map((maddeler, i) => {
        const kazanimlar = [...new Set(maddeler.flatMap((m) => m.kazanimKodlari))].sort().join(KAGIT_AYRAC);
        return (
          <section key={i} className="kg-sayfa" data-sayfa={i + 1} aria-label={`Çalışma kâğıdı, sayfa ${i + 1}`}>
            <header className="kg-ust">
              <span className="kg-ad">
                <KisaCizgili metin={adEtiketi} /> <span className="kg-cizgi" />
              </span>
            </header>
            <div className={`kg-izgara kg-izgara--${duzen}`}>
              {maddeler.map((m) => (
                <Madde key={m.no} m={m} duzen={duzen} />
              ))}
            </div>
            <footer className="kg-alt">
              <KisaCizgili metin={plan.kod} />
              <span>{kazanimlar}</span>
              <span>{KAGIT_ALT_YAZI}</span>
              <span>
                Sayfa {i + 1} / {toplam}
              </span>
            </footer>
          </section>
        );
      })}
      {anahtar.map((sayfa, j) => {
        const no = plan.sayfalar.length + j + 1;
        return (
          <section
            key={`anahtar-${j}`}
            className="kg-sayfa kg-sayfa--anahtar"
            data-sayfa={no}
            aria-label={`Cevap anahtarı, sayfa ${no}`}
          >
            <header className="kg-ust kg-ust--anahtar">
              <h2>{j === 0 ? 'Cevap anahtarı (öğretmen için)' : 'Cevap anahtarı (devam)'}</h2>
            </header>
            <Anahtar sayfa={sayfa} />
            <footer className="kg-alt">
              <KisaCizgili metin={plan.kod} />
              <span>{plan.kazanimOzeti.join(KAGIT_AYRAC)}</span>
              <span>{KAGIT_ALT_YAZI}</span>
              <span>
                Sayfa {no} / {toplam}
              </span>
            </footer>
          </section>
        );
      })}
    </div>
  );
}
