/**
 * NESNE SPRİTE'LARI — elle yazılmış, özgün programatik SVG (plan §8, plan v2 Adım 59, KG-104).
 *
 * NEDEN kodla çizilmiş SVG: plan §8 "YZ görsel üretimi reddedildi" der (7 nesne isteyip 6 almak ürünü
 * bozar); üçüncü taraf ikon/emoji seti de yok (§4.2). Her yol bu depoda yazıldı, lisans envanterine
 * kaynak girmez. Stil kuralları: `docs/tasarim/nesne-cizim-rehberi.md`.
 *
 * Stil: çocuk kitabı düz illüstrasyonu — nesne başına temel + gölge + ışık + koyu kontur (+ yumuşak
 * zemin gölgesi), ışık sol üstten, kontur 100 birimlik kutuda 3,5 (64 px'te ≈2,2 px). API değişmedi:
 * tek `fill` temel rengi verir (jeneratörün `renk` alanı ya da nesnenin doğal rengi); gölge, ışık ve
 * kontur `nesneTonlari` ile bu renkten türetilir. Gradyan yok (baskıda ve 64 px'te düz tonlar daha net).
 * Maske kimlikleri `useId` ile her örnekte tektir (aynı sahnede 20 elma çakışmaz).
 *
 * 100×100 viewBox; `size` piksel boyutudur. Yüzde boyut SVG'de döngüsel çözülür,
 * bu yüzden hesaplanmış px ile verilir (BigButton'daki örüntü).
 */
import { useId, type ReactNode } from 'react';
import type { NesneSprite } from '../../exercises/types';
import { nesneTonlari, type NesneTonlari } from './renkTonlari';
import { aynala, daire, guvenliKimlik, INCE, KONTUR } from './cizimYardimcilari';
import { Govde, Parca, Zemin } from './Govde';

/** Sprite başına doğal renk — çocuk accenti değil, nesnenin kendi rengi. */
const DOGAL_RENK: Record<NesneSprite, string> = {
  elma: '#D4334A',
  top: '#2563EB',
  balon: '#DB2777',
  araba: '#059669',
  kalem: '#CA8A04',
  kus: '#0EA5E9',
  cicek: '#EC4899',
  yildiz: '#EAB308',
  balik: '#EA580C',
  kelebek: '#7C3AED',
};

/** Nesnenin kendi parçalarının sabit renkleri (yaprak, sap, gaga…) — temel renkten bağımsız. */
const PARCA = {
  yaprak: '#4C9A3F',
  sap: '#7A4A26',
  krem: '#FFF6E2',
  cam: '#D5ECF6',
  lastik: '#3A3D44',
  jant: '#C9CFD8',
  far: '#FFD978',
  ahsap: '#F1C98E',
  grafit: '#3B3B3B',
  metal: '#BCC4CF',
  silgi: '#F2A0B6',
  gaga: '#F4A62A',
  gobek: '#F2B33D',
  govde: '#4A3426',
  murekkep: '#2B2B2B',
} as const;

export function Sprite({ name, fill, size }: { name: NesneSprite; fill?: string; size: number }) {
  const id = guvenliKimlik(useId());
  const t = nesneTonlari(fill ?? DOGAL_RENK[name]);
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      width={size}
      height={size}
      style={{ display: 'block', overflow: 'visible' }}
      data-sprite={name}
    >
      {CIZIMLER[name](t, id)}
    </svg>
  );
}

// ------------------------------------------------------------------ yıldız geometrisi (modül yüklenince bir kez)

const YILDIZ = (() => {
  const cx = 50;
  const cy = 52;
  const nok: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const r = i % 2 === 0 ? 45 : 20;
    nok.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10]);
  }
  const d = `M${nok.map((p) => p.join(' ')).join('L')}Z`;
  // Her yüzey (merkez + ardışık iki köşe) ışık yönüne (sol üst) göre ton alır.
  const isikYonu = (-135 * Math.PI) / 180;
  const yuzeyler = nok.map((p, i) => {
    const q = nok[(i + 1) % 10]!;
    const ortaAci = Math.atan2((p[1] + q[1]) / 2 - cy, (p[0] + q[0]) / 2 - cx);
    // Yıldız kolunun iki yüzü: kolun ışığa bakan yarısı açık, öbürü koyu.
    const kol = i % 2 === 0 ? 1 : -1;
    const deger = Math.cos(ortaAci - isikYonu) * 0.6 + kol * 0.5;
    return {
      d: `M${cx} ${cy}L${p.join(' ')}L${q.join(' ')}Z`,
      ton: deger > 0.45 ? 'isik' : deger < -0.35 ? 'golge' : 'temel',
    } as const;
  });
  return { d, yuzeyler };
})();

// ------------------------------------------------------------------ çizimler

type Cizim = (t: NesneTonlari, id: string) => ReactNode;

const ELMA_D =
  'M50 31C42 24 20 22 14 44C9 64 24 90 39 91C44 91 46 88 50 88C54 88 56 91 61 91C76 90 91 64 86 44C80 22 58 24 50 31Z';
const YAPRAK_D = 'M53 23C58 11 72 7 83 11C79 22 66 29 53 23Z';

const BALON_D = 'M50 6C72 6 86 24 86 42C86 62 70 76 55 80L45 80C30 76 14 62 14 42C14 24 28 6 50 6Z';

const ARABA_D =
  'M8 64C8 55 13 51 22 50L31 49L40 33C42 29 46 27 50 27L67 27C71 27 74 29 76 33L83 48L87 49C92 51 94 55 94 61L94 66C94 70 92 72 88 72L13 72C10 72 8 70 8 66Z';

const KUS_D = 'M20 60C20 40 36 27 55 27C73 27 85 40 85 56C85 74 69 86 51 86C32 86 20 76 20 60Z';
const KANAT_D = 'M28 58C33 45 51 45 57 56C53 69 37 72 28 58Z';

const PETAL_D = 'M50 40C40 32 37 14 50 7C63 14 60 32 50 40Z';

const BALIK_D = 'M24 50C34 30 60 24 78 35C84 39 89 44 92 50C89 56 84 61 78 65C60 76 34 70 24 50Z';
const KUYRUK_D = 'M30 50L9 31C14 44 14 56 9 69Z';
const SIRT_D = 'M42 32C48 19 62 18 70 33Z';

const UST_KANAT_D = 'M47 46C40 25 22 12 11 20C2 28 8 48 23 52C33 55 43 53 47 46Z';
const ALT_KANAT_D = 'M47 53C39 54 27 58 23 70C21 81 32 87 40 81C46 75 48 65 47 53Z';

const CIZIMLER: Record<NesneSprite, Cizim> = {
  elma: (t, id) => {
    const y = nesneTonlari(PARCA.yaprak);
    return (
      <g>
        <Zemin rx={30} />
        <Govde
          d={ELMA_D}
          t={t}
          k={`${id}a`}
          isik={
            <g fill={t.isik}>
              <path d="M24 47C24 38 31 32 39 32C34 37 30 44 30 53C27 53 24 51 24 47Z" />
              <circle cx="31" cy="60" r="2.6" />
            </g>
          }
        />
        <path d="M50 33C49 25 51 17 56 11" fill="none" stroke={PARCA.sap} strokeWidth="5" strokeLinecap="round" />
        <Govde d={YAPRAK_D} t={y} k={`${id}y`} ofset={3} sw={INCE} />
        <path d="M56 21C64 17 71 14 78 13" fill="none" stroke={y.kontur} strokeWidth="1.6" strokeLinecap="round" />
      </g>
    );
  },

  top: (t, id) => {
    const krem = nesneTonlari(PARCA.krem);
    return (
      <g>
        <Zemin rx={30} />
        <Govde
          d={daire(50, 51, 39)}
          t={t}
          k={`${id}t`}
          golgeOpak={0.9}
          ic={
            <g fill={krem.temel} stroke={t.kontur} strokeWidth={INCE} strokeLinejoin="round">
              <path d="M39 27C25 42 22 66 30 89L45 92C36 70 36 45 39 27Z" />
              <path d="M39 27C58 30 78 47 90 66L92 51C80 37 61 27 39 27Z" />
            </g>
          }
          isik={<path d="M20 44C22 32 30 22 40 18C33 26 28 36 27 47C24 48 21 47 20 44Z" fill="#fff" opacity="0.55" />}
        />
        <circle cx="39" cy="27" r="6" fill={krem.temel} stroke={t.kontur} strokeWidth={INCE} />
      </g>
    );
  },

  balon: (t, id) => (
    <g>
      <Zemin rx={16} silik />
      <path d="M50 87C45 91 55 93 50 97" fill="none" stroke={PARCA.murekkep} strokeWidth="2" strokeLinecap="round" />
      <Parca d="M43 87L50 79L57 87C54 89 46 89 43 87Z" fill={t.golge} kontur={t.kontur} />
      <Govde
        d={BALON_D}
        t={t}
        k={`${id}b`}
        isik={
          <g fill={t.isik}>
            <ellipse cx="32" cy="30" rx="6.5" ry="13" transform="rotate(28 32 30)" />
            <circle cx="40" cy="15" r="3" />
          </g>
        }
      />
    </g>
  ),

  araba: (t, id) => {
    const cam = nesneTonlari(PARCA.cam);
    return (
      <g>
        <Zemin rx={42} cy={86} />
        <Govde
          d={ARABA_D}
          t={t}
          k={`${id}r`}
          ofset={5}
          ic={
            <g>
              <path d="M8 60L94 60L94 74L8 74Z" fill={t.golge} opacity="0.55" />
              <path
                d="M57 50L57 68M62 55L67 55"
                fill="none"
                stroke={t.kontur}
                strokeWidth={INCE}
                strokeLinecap="round"
              />
            </g>
          }
          isik={
            <path d="M18 53C24 51 70 50 82 51" fill="none" stroke={t.isik} strokeWidth="3.5" strokeLinecap="round" />
          }
        />
        <Parca d="M42 47L48 35C49 33 50 32 52 32L56 32L56 47Z" fill={cam.temel} kontur={t.kontur} />
        <Parca d="M60 32L66 32C68 32 70 33 71 35L77 47L60 47Z" fill={cam.temel} kontur={t.kontur} />
        <path d="M47 43L51 36M64 43L67 37" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
        <Parca d="M87 54C91 54 93 56 93 59L87 59Z" fill={PARCA.far} kontur={t.kontur} />
        {[29, 73].map((x) => (
          <g key={x}>
            <circle cx={x} cy="72" r="12" fill={PARCA.lastik} stroke={PARCA.murekkep} strokeWidth={KONTUR} />
            <circle cx={x} cy="72" r="5.5" fill={PARCA.jant} />
            <circle cx={x - 1.5} cy="70.5" r="1.8" fill="#fff" opacity="0.8" />
          </g>
        ))}
      </g>
    );
  },

  kalem: (t, id) => {
    const ahsap = nesneTonlari(PARCA.ahsap);
    const silgi = nesneTonlari(PARCA.silgi);
    const metal = nesneTonlari(PARCA.metal);
    return (
      <g>
        <Zemin rx={34} cy={90} />
        <g transform="rotate(-38 50 50)">
          <Govde
            d="M12 37L21 37L21 63L12 63C8 63 5 60 5 56L5 44C5 40 8 37 12 37Z"
            t={silgi}
            k={`${id}s`}
            ofset={3}
            sw={INCE}
          />
          <path d="M27 37L70 37L70 63L27 63Z" fill={t.temel} />
          <path d="M27 37L70 37L70 45L27 45Z" fill={t.isik} />
          <path d="M27 55L70 55L70 63L27 63Z" fill={t.golge} />
          <path d="M27 45L70 45M27 55L70 55" stroke={t.kontur} strokeWidth="1.4" opacity="0.5" />
          <path
            d="M27 37L70 37L70 63L27 63Z"
            fill="none"
            stroke={t.kontur}
            strokeWidth={KONTUR}
            strokeLinejoin="round"
          />
          <Govde d="M20 36L28 36L28 64L20 64Z" t={metal} k={`${id}f`} ofset={2} sw={INCE} />
          <path d="M23 36.5L23 63.5M25.5 36.5L25.5 63.5" stroke={metal.golge} strokeWidth="1.3" />
          <Govde
            d="M70 37L93 50L70 63C73 59 73 54 70 50C73 46 73 41 70 37Z"
            t={ahsap}
            k={`${id}w`}
            ofset={3}
            sw={INCE}
          />
          <Parca d="M86 46L96 50L86 54C87 52.5 87 47.5 86 46Z" fill={PARCA.grafit} kontur={PARCA.murekkep} sw={1.6} />
        </g>
      </g>
    );
  },

  kus: (t, id) => {
    const gaga = nesneTonlari(PARCA.gaga);
    return (
      <g>
        <Zemin rx={22} silik />
        <path
          d="M44 85L42 94M57 85L59 94M38 94L46 94M55 94L63 94"
          stroke={gaga.golge}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Parca d="M26 56L8 46C9 54 10 62 13 68Z" fill={t.golge} kontur={t.kontur} sw={KONTUR * 0.8} />
        <Govde
          d={KUS_D}
          t={t}
          k={`${id}k`}
          ic={<ellipse cx="58" cy="68" rx="22" ry="16" fill={t.isik} />}
          isik={<path d="M33 43C38 35 46 31 54 31C46 35 40 41 37 48C35 48 33 46 33 43Z" fill="#fff" opacity="0.5" />}
        />
        <Govde d={KANAT_D} t={nesneTonlari(t.golge)} k={`${id}w`} ofset={3} sw={INCE} />
        <Parca d="M83 49L96 54L83 60C85 56 85 53 83 49Z" fill={gaga.temel} kontur={t.kontur} />
        <circle cx="69" cy="46" r="5.2" fill={PARCA.murekkep} />
        <circle cx="70.8" cy="44.2" r="1.8" fill="#fff" />
      </g>
    );
  },

  cicek: (t, id) => {
    const y = nesneTonlari(PARCA.yaprak);
    const g = nesneTonlari(PARCA.gobek);
    return (
      <g>
        <Zemin rx={18} />
        <path d="M50 50C50 64 48 80 50 93" fill="none" stroke={y.kontur} strokeWidth="7" strokeLinecap="round" />
        <path d="M50 50C50 64 48 80 50 93" fill="none" stroke={y.temel} strokeWidth="3.6" strokeLinecap="round" />
        <Govde d="M50 77C57 66 70 64 77 69C70 78 58 81 50 77Z" t={y} k={`${id}y`} ofset={3} sw={INCE} />
        <Govde d="M50 84C43 74 31 73 25 77C31 85 42 88 50 84Z" t={y} k={`${id}z`} ofset={3} sw={INCE} />
        {[0, 72, 144, 216, 288].map((a, i) => (
          <g key={a} transform={`rotate(${a} 50 40)`}>
            <Govde
              d={PETAL_D}
              t={t}
              k={`${id}p${i}`}
              ofset={4}
              isik={
                <path d="M47 30C45 24 45 17 50 12" fill="none" stroke={t.isik} strokeWidth="3" strokeLinecap="round" />
              }
            />
          </g>
        ))}
        <Govde
          d={daire(50, 40, 10)}
          t={g}
          k={`${id}g`}
          ofset={3}
          sw={INCE}
          isik={
            <g fill={g.golge}>
              <circle cx="47" cy="40" r="1.4" />
              <circle cx="53" cy="38" r="1.4" />
              <circle cx="51" cy="44" r="1.4" />
              <circle cx="45" cy="35" r="2.4" fill={g.isik} />
            </g>
          }
        />
      </g>
    );
  },

  yildiz: (t) => (
    <g>
      <Zemin rx={28} />
      {YILDIZ.yuzeyler.map((y, i) => (
        <path key={i} d={y.d} fill={t[y.ton]} stroke={t[y.ton]} strokeWidth="0.6" strokeLinejoin="round" />
      ))}
      <path d={YILDIZ.d} fill="none" stroke={t.kontur} strokeWidth={KONTUR} strokeLinejoin="round" />
      <circle cx="40" cy="38" r="2.6" fill="#fff" opacity="0.7" />
    </g>
  ),

  balik: (t, id) => {
    const koyu = nesneTonlari(t.golge);
    return (
      <g>
        <Zemin rx={30} cy={90} silik />
        <Govde d={KUYRUK_D} t={koyu} k={`${id}q`} ofset={3} />
        <Govde d={SIRT_D} t={koyu} k={`${id}s`} ofset={3} sw={INCE} />
        <Govde
          d={BALIK_D}
          t={t}
          k={`${id}b`}
          ic={
            <g>
              <ellipse cx="58" cy="66" rx="30" ry="10" fill={t.isik} />
              <path
                d="M40 44C43 48 43 52 40 56M50 41C53 46 53 54 50 59M60 40C63 46 63 54 60 60"
                fill="none"
                stroke={t.golge}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          }
          isik={<path d="M40 37C48 32 58 31 66 33C58 34 50 37 44 41C42 41 40 39 40 37Z" fill="#fff" opacity="0.5" />}
        />
        <path d="M71 38C65 45 65 55 71 62" fill="none" stroke={t.kontur} strokeWidth={INCE} strokeLinecap="round" />
        <Parca d="M58 56C62 64 68 66 72 64C68 60 64 57 58 56Z" fill={t.golge} kontur={t.kontur} sw={1.8} />
        <circle cx="80" cy="45" r="5" fill="#fff" stroke={t.kontur} strokeWidth="1.8" />
        <circle cx="81.2" cy="45" r="2.6" fill={PARCA.murekkep} />
        <path d="M89 53L85 54" stroke={t.kontur} strokeWidth="1.8" strokeLinecap="round" />
      </g>
    );
  },

  kelebek: (t, id) => {
    const kanat = (d: string, k: string, benekler: ReactNode) => (
      <Govde
        d={d}
        t={t}
        k={k}
        ofset={5}
        ic={<path d={d} fill="none" stroke={t.golge} strokeWidth="7" />}
        isik={benekler}
      />
    );
    return (
      <g>
        <Zemin rx={20} silik />
        {kanat(UST_KANAT_D, `${id}a`, <circle cx="24" cy="32" r="6.5" fill={t.isik} />)}
        {kanat(aynala(UST_KANAT_D), `${id}b`, <circle cx="76" cy="32" r="6.5" fill={t.isik} />)}
        {kanat(ALT_KANAT_D, `${id}c`, <circle cx="34" cy="71" r="4.2" fill={t.isik} />)}
        {kanat(aynala(ALT_KANAT_D), `${id}d`, <circle cx="66" cy="71" r="4.2" fill={t.isik} />)}
        <path
          d="M49 26C46 18 42 13 37 11M51 26C54 18 58 13 63 11"
          fill="none"
          stroke={PARCA.govde}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="37" cy="11" r="2.8" fill={PARCA.govde} />
        <circle cx="63" cy="11" r="2.8" fill={PARCA.govde} />
        <rect x="45.5" y="30" width="9" height="46" rx="4.5" fill={PARCA.govde} />
        <circle cx="50" cy="29" r="5.5" fill={PARCA.govde} />
        <path d="M47 40L53 40M47 48L53 48M47 56L53 56" stroke="#7A5C47" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    );
  },
};
