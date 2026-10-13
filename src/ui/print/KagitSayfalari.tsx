/**
 * KÂĞIT SAYFALARI — çalışma kâğıdının HTML+SVG gövdesi (plan v2 Adım 35, ADR-0006).
 *
 * Çalışma anında PDF kütüphanesi yok: aynı bileşen hem ekran önizlemesinde hem yazdırma kopyasında
 * kullanılır; tarayıcının "PDF olarak kaydet"i çevrimdışı PDF üretir. Renk tek başına anlam taşımaz
 * (rakam/harf/desen de var); "Siyah-beyaz" seçeneği `filter: grayscale(1)` ile hem önizler hem basar.
 */
import type { CSSProperties } from 'react';
import { paraGorselStratejisi } from '../../content/paraGorseli';
import { TCMB_YAZILI_IZIN } from '../../content/paraGorseli';
import type { OptionDeger, VisualSpec } from '../../exercises/types';
import { celdiriciCumlesi, type CevapSatiri } from '../../ogretmen/calismaKagidi/cevapAnahtari';
import { EYLEM_METNI, type KagitMaddesi, type KagitSecenegi, type YonergeIkonu } from '../../ogretmen/calismaKagidi/kagitMaddesi';
import type { KagitDuzeni, KagitPlani } from '../../ogretmen/calismaKagidi/kagitPlani';
import { maddeKaplama } from '../../ogretmen/calismaKagidi/kagitYerlesimi';
import { SematikBanknot } from '../svg/SematikBanknot';
import { Visual } from '../svg/Visual';
import './kagit.css';

const TERIM_METNI: Readonly<Record<string, string>> = {
  cok: 'çok',
  'daha-cok': 'daha çok',
  az: 'az',
  'daha-az': 'daha az',
  esit: 'eşit',
};
const KATEGORI_METNI: Readonly<Record<string, string>> = { yuvarlak: 'yuvarlak', koseli: 'köşeli' };

export const KAGIT_ALT_YAZI = 'okulumsun · MEB 2024 1. sınıf matematik';

/** Aynı plan → aynı çıktı; testler ve e2e "SVG özeti"ni buradan alır. */
export interface KagitSayfalariProps {
  readonly plan: KagitPlani;
  readonly duzen: KagitDuzeni;
  readonly cevapAnahtariDahil: boolean;
  readonly siyahBeyaz: boolean;
  readonly kopya: 'onizleme' | 'baski';
}

function Ikon({ ikon }: { ikon: YonergeIkonu }) {
  const ortak = { fill: 'none', stroke: '#000', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg className="kg-ikon" viewBox="0 0 32 32" aria-hidden="true">
      {ikon === 'kalem' && <path {...ortak} d="M6 26l2-7L22 5l5 5L13 24z M19 8l5 5" />}
      {ikon === 'cizgi' && <path {...ortak} d="M5 9h6 M21 23h6 M11 9l10 14" />}
      {ikon === 'sira' && <path {...ortak} d="M6 8h4v6 M6 24h6l-6-5h6 M18 10h9 M18 22h9" />}
      {ikon === 'kulak' && <path {...ortak} d="M11 12a6 6 0 1 1 10 4c-2 2-3 3-3 6a3 3 0 0 1-6 0" />}
    </svg>
  );
}

/** Banknot: kâğıtta TCMB izni yoksa (KG-19) şematik banknot, izin varsa TCMB görseli. */
function BanknotGorseli({ deger, genislik }: { deger: 5 | 10 | 20 | 50 | 100 | 200; genislik: number }) {
  const strateji = paraGorselStratejisi({ ortam: 'kagit', tcmbYaziliIzin: TCMB_YAZILI_IZIN });
  if (strateji === 'sematik') return <SematikBanknot deger={deger} genislik={genislik} />;
  return <Visual spec={{ type: 'banknot', deger }} width={genislik} height={Math.round(genislik / 2)} />;
}

function SecenekIcerigi({ deger }: { deger: OptionDeger }) {
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
        <Visual spec={deger.gorsel} width={deger.gorsel.type === 'islemKarti' ? 220 : 140} height={140} />
      );
    case 'terim':
      return <span className="kg-yazi">{TERIM_METNI[deger.terim] ?? deger.terim}</span>;
    case 'sekilKategorisi':
      return <span className="kg-yazi">{KATEGORI_METNI[deger.kategori] ?? deger.kategori}</span>;
    case 'metin':
      return <span className="kg-yazi">{deger.metin}</span>;
  }
}

function Secenek({ s, harfRozeti, kutu }: { s: KagitSecenegi; harfRozeti: boolean; kutu: boolean }) {
  const genis =
    s.deger.tur === 'banknot' ||
    (s.deger.tur === 'gorsel' && (s.deger.gorsel.type === 'banknot' || s.deger.gorsel.type === 'islemKarti'));
  return (
    <div className="kg-secenek-sarma">
      <div className={`kg-secenek${genis ? ' kg-secenek--genis' : ''}`} data-secenek={s.etiket}>
        {harfRozeti && <span className="kg-rozet">{s.etiket}</span>}
        <SecenekIcerigi deger={s.deger} />
      </div>
      {kutu && <span className="kg-yaz-kutusu kg-yaz-kutusu--kucuk" aria-hidden="true" />}
    </div>
  );
}

/** Sahne çizimi ekrandakiyle aynı oranda; nesneler kenara taştığı için çevresine pay bırakılır. */
const SAHNE_W = 500;
const SAHNE_H = 350;
const SAHNE_PAY = 34;

function Sahne({ spec, m }: { spec: VisualSpec; m: KagitMaddesi }) {
  const toplamW = SAHNE_W + 2 * SAHNE_PAY;
  const toplamH = SAHNE_H + 2 * SAHNE_PAY;
  const yuzde = (v: number, boyut: number, toplam: number): string => `${((SAHNE_PAY + v * boyut) / toplam) * 100}%`;
  return (
    <div className="kg-sahne" style={{ aspectRatio: `${toplamW} / ${toplamH}` } as CSSProperties}>
      <svg viewBox={`${-SAHNE_PAY} ${-SAHNE_PAY} ${toplamW} ${toplamH}`} aria-hidden="true">
        <Visual spec={spec} width={SAHNE_W} height={SAHNE_H} />
      </svg>
      {m.isaretler.map((i) => {
        const x = Math.min(0.97, Math.max(0.03, i.x));
        const y = Math.min(0.97, Math.max(0.03, m.yanitBicimi === 'daireIcineAl' ? i.y + i.yaricap : i.y));
        return (
          <span key={i.etiket} className="kg-isaret" style={{ left: yuzde(x, SAHNE_W, toplamW), top: yuzde(y, SAHNE_H, toplamH) }}>
            {i.etiket}
          </span>
        );
      })}
    </div>
  );
}

function Madde({ m, duzen }: { m: KagitMaddesi; duzen: KagitDuzeni }) {
  const kaplama = maddeKaplama(m, duzen) ?? 1;
  const yatay = duzen === '1x4' || kaplama === 2;
  const sirali = m.yanitBicimi === 'siraNumarasiYaz';
  const sol = m.secenekler.filter((s) => s.taraf === 'sol');
  const sag = m.secenekler.filter((s) => s.taraf === 'sag');
  return (
    <article
      className={`kg-madde kg-madde--k${kaplama}${yatay ? ' kg-madde--yatay' : ''}`}
      data-madde={m.no}
      data-sablon={m.templateId}
      data-yanit={m.yanitBicimi}
    >
      <div className="kg-yonerge">
        <span className="kg-no">{m.no}</span>
        <Ikon ikon={m.yonergeIkonu} />
        <span className="kg-yonerge-metin">
          {m.yonergeMetni}
          <small>{EYLEM_METNI[m.yanitBicimi]}</small>
        </span>
      </div>
      {m.yanitBicimi === 'cizgiyleEsle' ? (
        <div className="kg-esle">
          <div className="kg-esle-satir">
            {sol.map((s) => (
              <Secenek key={s.id} s={s} harfRozeti kutu={false} />
            ))}
          </div>
          <div className="kg-esle-satir">
            {sag.map((s) => (
              <Secenek key={s.id} s={s} harfRozeti kutu={false} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="kg-govde">
            {m.sahne && <Sahne spec={m.sahne} m={m} />}
            {m.secenekler.length > 0 && (
              <div className="kg-secenekler">
                {m.secenekler.map((s) => (
                  <Secenek key={s.id} s={s} harfRozeti={m.harfRozeti} kutu={sirali} />
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

function Anahtar({ satirlar }: { satirlar: readonly CevapSatiri[] }) {
  return (
    <table className="kg-anahtar">
      <thead>
        <tr>
          <th>Soru</th>
          <th>Doğru cevap</th>
          <th>Çeldirici notları</th>
        </tr>
      </thead>
      <tbody>
        {satirlar.map((s) => (
          <tr key={s.no} data-anahtar={s.no}>
            <td>{s.no}</td>
            <td>
              <strong>{s.dogru}</strong>
            </td>
            <td>
              {s.celdiriciNotlari.length === 0 ? (
                <span>—</span>
              ) : (
                <ul>
                  {s.celdiriciNotlari.map((n, i) => (
                    <li key={`${n.secenek}-${i}`}>
                      {celdiriciCumlesi(n)} <em>{n.ipucu}</em>
                    </li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function KagitSayfalari({ plan, duzen, cevapAnahtariDahil, siyahBeyaz, kopya }: KagitSayfalariProps) {
  const toplam = plan.sayfalar.length + (cevapAnahtariDahil ? 1 : 0);
  return (
    <div
      className={`kg-kok kg-kok--${kopya}${siyahBeyaz ? ' kg-kok--gri' : ''}`}
      data-kagit-kodu={plan.kod}
      data-sayfa-sayisi={toplam}
      aria-hidden={kopya === 'baski' ? true : undefined}
    >
      {plan.sayfalar.map((maddeler, i) => {
        const kazanimlar = [...new Set(maddeler.flatMap((m) => m.kazanimKodlari))].sort().join(' · ');
        return (
          <section key={i} className="kg-sayfa" data-sayfa={i + 1} aria-label={`Çalışma kâğıdı, sayfa ${i + 1}`}>
            <header className="kg-ust">
              <span className="kg-ad">
                Adım: <span className="kg-cizgi" />
              </span>
            </header>
            <div className={`kg-izgara kg-izgara--${duzen}`}>
              {maddeler.map((m) => (
                <Madde key={m.no} m={m} duzen={duzen} />
              ))}
            </div>
            <footer className="kg-alt">
              <span>{plan.kod}</span>
              <span>{kazanimlar}</span>
              <span>{KAGIT_ALT_YAZI}</span>
              <span>
                Sayfa {i + 1} / {toplam}
              </span>
            </footer>
          </section>
        );
      })}
      {cevapAnahtariDahil && (
        <section
          className="kg-sayfa kg-sayfa--anahtar"
          data-sayfa={toplam}
          aria-label={`Cevap anahtarı, sayfa ${toplam}`}
        >
          <header className="kg-ust kg-ust--anahtar">
            <h2>Cevap anahtarı (öğretmen için)</h2>
          </header>
          <Anahtar satirlar={plan.cevapAnahtari} />
          <footer className="kg-alt">
            <span>{plan.kod}</span>
            <span>{plan.kazanimOzeti.join(' · ')}</span>
            <span>{KAGIT_ALT_YAZI}</span>
            <span>
              Sayfa {toplam} / {toplam}
            </span>
          </footer>
        </section>
      )}
    </div>
  );
}
