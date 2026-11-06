/**
 * T-19 — AYNI SESLE BAŞLAYANLARI EŞLEŞTİR (T.D.1.1.a, T.D.1.2.a; Adım 79). SAF, deterministik. Dokun-eşleştir.
 *
 * İki sıra kart: üstte resimler, altta eşleri (z1–2 harf: resmin adının ilk sesinin harfi; z3–5 başka resim).
 * Resimler sessiz ve adsızdır ("Resim N"; T-01 gibi); soru sesi yok, yönerge hedefi söylemez. Bütün çiftler
 * bulununca resimlerin adları okunur (geri bildirim). Sözcükler yalnız görseli olan ve öğretilmiş harfli; her çiftin
 * sesi başka (tek doğru eşleşme): bir resmin anahtar sesi yalnız kendi eşininkiyle aynıdır.
 *
 * Zorluk: z1 2 çift resim–harf · z2 3 çift resim–harf · z3 3 çift resim–resim · z4 4 çift resim–resim (ilk ses) ·
 * z5 4 çift resim–resim, aynı sesle BİTEN (son ses). En çok 8 kart (tahta 1080×810 sınırı).
 */
import { createRng } from '../../../../exercises/rng';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, sozcukKlibi, yonergeKlibi } from './klipler';
import { okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurEslestirSorusu, type TurHavuzSozcugu, type TurKart, type TurUretimGirdisi } from './turSoru';

const AYAR = {
  1: { cift: 2, es: 'harf', ses: 'bas' },
  2: { cift: 3, es: 'harf', ses: 'bas' },
  3: { cift: 3, es: 'resim', ses: 'bas' },
  4: { cift: 4, es: 'resim', ses: 'bas' },
  5: { cift: 4, es: 'resim', ses: 'son' },
} as const;

export function uretT19(g: TurUretimGirdisi): TurEslestirSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-19|${g.zorluk}`);
  const anahtar = (w: string) => (ayar.ses === 'bas' ? w[0] : w[w.length - 1]);
  const resimli = okunabilirSozcukler(g.havuz, g.kume).filter((s) => s.gorselId);
  const gruplar = new Map<string, TurHavuzSozcugu[]>();
  for (const s of resimli) gruplar.set(anahtar(s.metin), [...(gruplar.get(anahtar(s.metin)) ?? []), s]);
  const gerek = ayar.es === 'harf' ? 1 : 2;
  const sesler = [...gruplar.keys()].filter((k) => gruplar.get(k)!.length >= gerek);
  if (sesler.length < ayar.cift)
    throw new TurUretimHatasi('Bu harf kümesiyle "Aynı sesle eşleştir" kurulamıyor: yeterli resimli sözcük yok.');
  const secilen = rng.sample(sesler, ayar.cift);
  const ciftler = secilen.map((k) => rng.sample(gruplar.get(k)!, gerek));
  const gorsel = (s: TurHavuzSozcugu): Omit<TurKart, 'id'> => ({ metin: s.metin, tur: 'gorsel', gorselId: s.gorselId });
  // Üst sıra: her çiftin resmi (karışık); alt sıra: eşleri (ayrı karışık).
  const ust = rng.shuffle(ciftler.map((c, i) => ({ k: gorsel(c[0]), i })));
  const alt = rng.shuffle(
    ciftler.map((c, i) => ({ k: ayar.es === 'harf' ? { metin: secilen[i], tur: 'harf' as const } : gorsel(c[1]), i })),
  );
  const kartlar: TurKart[] = [...ust, ...alt].map((x, j) => ({ ...x.k, id: `k${j}` }));
  const sozcukler = ciftler.flat().map((s) => s.metin);
  return {
    kind: 'eslestir',
    itemId: turItemId('T-19', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-19',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: soruGirisHarfi(sozcukler),
    yonerge: yonergeKlibi(ayar.es === 'harf' ? 't19-harf' : ayar.ses === 'son' ? 't19-son' : 't19'),
    soruKlipleri: [],
    uyaran: { tur: 'yok' },
    geriBildirim: [geriBildirimKlibi('dogru'), ...ust.map((x) => sozcukKlibi(x.k.metin))],
    hedefMetin: secilen.join(''),
    sozcukler,
    kartlar,
    ciftler: ust.map((x, j) => [j, ust.length + alt.findIndex((y) => y.i === x.i)] as const),
  };
}
