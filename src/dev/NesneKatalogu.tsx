/**
 * NESNE VE MATERYAL KATALOĞU — YALNIZ GELİŞTİRME (plan v2 Adım 59, KG-104).
 *
 * `vite dev` altında `?gelistirme=nesneler` çocuğun sorularda gördüğü bütün nesne sprite'larını (64 px tablet
 * ve 102 px tahta boyunda, altı vurgu renginde) ve materyalleri (şekiller, onluk çerçeve, konum sahneleri,
 * ölçme, terazi, işlem sahnesi, nesne kümeleri) tek sayfada gösterir. `&gri=1` siyah-beyaz baskı görünümü
 * (çalışma kâğıdının `filter: grayscale(1)` kuralıyla aynı). Görsel denetim ve e2e ekran görüntüsü içindir;
 * üretim derlemesinde `import.meta.env.DEV` `false` olduğundan bu modül paketlenmez. Hiçbir şey saklanmaz.
 */
import { KONUM_ILISKILERI, KONUM_REFERANSLARI, NESNE_SPRITELARI, SEKILLER, type VisualSpec } from '../exercises/types';
import { ACCENTS, COLOR } from '../design/tokens';
import { Sprite } from '../ui/svg/Sprite';
import { Visual } from '../ui/svg/Visual';

const MATERYALLER: readonly { ad: string; spec: VisualSpec; g?: number }[] = [
  ...SEKILLER.map((sekil, i) => ({
    ad: `sekil ${sekil}`,
    spec: { type: 'sekil', sekil, renk: ACCENTS[i]!.id, donusDerece: i === 2 ? 18 : 0 } as VisualSpec,
  })),
  { ad: 'sekil vurgu', spec: { type: 'sekil', sekil: 'ucgen', donusDerece: 30 } },
  { ad: 'onluk 10+3', spec: { type: 'onlukCerceve', gruplar: [10, 3] }, g: 360 },
  { ad: 'onluk 7', spec: { type: 'onlukCerceve', gruplar: [7] } },
  { ad: 'küme 7 elma', spec: { type: 'nesneKumesi', sprite: 'elma', adet: 7, layout: 'gruplu' }, g: 360 },
  {
    ad: 'küme 4 mavi kuş',
    spec: { type: 'nesneKumesi', sprite: 'kus', adet: 4, layout: 'sira', renk: 'mavi' },
    g: 360,
  },
  {
    ad: 'işlem 4 − 2',
    spec: { type: 'islemSahnesi', nesne: 'balon', ilkAdet: 4, degisimAdedi: 2, islem: '-' },
    g: 360,
  },
  {
    ad: 'ölçme birimlerle',
    spec: {
      type: 'olcumSahnesi',
      nesne: 'kalem',
      birim: 'yildiz',
      birimAdedi: 5,
      boyut: 'uzunluk',
      gorunum: 'birimlerleOlcum',
      renk: 'turuncu',
    },
    g: 300,
  },
  {
    ad: 'uzunluk karşılaştır',
    spec: {
      type: 'olcumKarsilastirma',
      boyut: 'uzunluk',
      sol: { nesne: 'kalem', renk: 'mor', deger: 6 },
      sag: { nesne: 'kalem', renk: 'yesil', deger: 4 },
    },
  },
  {
    ad: 'terazi',
    spec: {
      type: 'olcumKarsilastirma',
      boyut: 'kutle',
      sol: { nesne: 'elma', renk: 'pembe', deger: 3 },
      sag: { nesne: 'top', renk: 'mavi', deger: 1 },
    },
  },
];

const KONUMLAR: readonly { ad: string; spec: VisualSpec }[] = KONUM_REFERANSLARI.flatMap((referans, ri) =>
  KONUM_ILISKILERI.map((iliski, i) => ({
    ad: `${referans} ${iliski}`,
    spec: {
      type: 'konumSahnesi',
      iliski,
      referans,
      hedef: (['elma', 'top', 'balon', 'kus', 'cicek', 'yildiz'] as const)[(i + ri) % 6]!,
    } as VisualSpec,
  })),
);

const etiket = { font: '600 13px system-ui, sans-serif', color: COLOR.ink, margin: '4px 0 0' } as const;
const kart = {
  background: COLOR.surface,
  border: `2px solid ${COLOR.border}`,
  borderRadius: 16,
  padding: 8,
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
} as const;

export function NesneKatalogu() {
  const p = new URLSearchParams(location.search);
  const gri = p.get('gri') === '1';
  return (
    <main
      data-nesne-katalogu
      style={{ background: COLOR.bg, padding: 16, minHeight: '100vh', filter: gri ? 'grayscale(1)' : undefined }}
    >
      <section data-katalog="nesneler" style={{ display: 'grid', gap: 6 }}>
        {NESNE_SPRITELARI.map((n) => (
          <div key={n} data-nesne={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...etiket, width: 64 }}>{n}</span>
            <Sprite name={n} size={64} />
            <Sprite name={n} size={102} />
            {ACCENTS.map((a) => (
              <Sprite key={a.id} name={n} fill={a.hex} size={64} />
            ))}
          </div>
        ))}
      </section>
      <section data-katalog="materyaller" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {MATERYALLER.map((m) => (
          <figure key={m.ad} style={{ ...kart, margin: 0 }}>
            <Visual spec={m.spec} width={m.g ?? 200} height={200} />
            <figcaption style={etiket}>{m.ad}</figcaption>
          </figure>
        ))}
      </section>
      <section data-katalog="konum" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {KONUMLAR.map((m) => (
          <figure key={m.ad} style={{ ...kart, margin: 0 }}>
            <Visual spec={m.spec} width={160} height={160} />
            <figcaption style={etiket}>{m.ad}</figcaption>
          </figure>
        ))}
      </section>
    </main>
  );
}
