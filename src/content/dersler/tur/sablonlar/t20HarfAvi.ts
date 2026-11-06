/**
 * T-20 — HARF AVI (KB2.7 harfi ayırt etme; T.O.1.1.a; Adım 79). SAF, deterministik. Çoklu seçim + Onayla.
 *
 * Üstte model harf (dokunulmaz). Altta harf (z1–3) ya da hece (z4–5) kartları; çocuk hedef harfin HEPSİNİ (hecede:
 * hedef harfin geçtiği heceleri) işaretler ve onaylar. Okuma hedefli (D-12): soru sesi yok, yönerge harfi söylemez.
 * Kartlar sessiz; hece kartları yalnız okunabilir sözcüklerden gelen hecelerdir (D-05). Çeldiriciler öğretilen
 * kümeden; z3 ve z5'te karıştırılan çift önce (tanı etiketli, D-23). Tek doğru küme: hedefi taşıyan her kart
 * doğrudur, taşımayan hiçbiri değildir.
 *
 * Zorluk: z1 4 harf kartı, 2 hedef · z2 6 kart, 2–3 hedef · z3 8 kart, 3 hedef, karıştırılan çift önde ·
 * z4 6 hece kartı, 2–3 hedefli · z5 8 hece kartı, 3 hedefli, karıştırılan harfli heceler önde.
 */
import { createRng } from '../../../../exercises/rng';
import { kumeKodla } from '../ogretilenKume';
import { karistirilanlar } from './celdiriciler';
import { geriBildirimKlibi, yonergeKlibi } from './klipler';
import { enYeniHarf, harfCeldiricileri, kartlariKaristir, kumeHarfleri, soruGirisHarfi } from './ortak';
import { okunabilirHeceler } from './t04HeceKur';
import { turItemId, TurUretimHatasi, type TurCokluSorusu, type TurKart, type TurUretimGirdisi } from './turSoru';

const AYAR = {
  1: { kart: 4, hedef: [2, 2], hece: false, oncelik: false },
  2: { kart: 6, hedef: [2, 3], hece: false, oncelik: false },
  3: { kart: 8, hedef: [3, 3], hece: false, oncelik: true },
  4: { kart: 6, hedef: [2, 3], hece: true, oncelik: false },
  5: { kart: 8, hedef: [3, 3], hece: true, oncelik: true },
} as const;

export function uretT20(g: TurUretimGirdisi): TurCokluSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-20|${g.zorluk}`);
  const harfler = kumeHarfleri(g.kume);
  const heceler = ayar.hece ? [...okunabilirHeceler(g).keys()] : [];
  const uygun = harfler.filter((h) =>
    ayar.hece
      ? heceler.filter((x) => x.includes(h)).length >= ayar.hedef[0] && heceler.filter((x) => !x.includes(h)).length >= ayar.kart - ayar.hedef[0]
      : harfler.length > 1,
  );
  if (uygun.length === 0)
    throw new TurUretimHatasi('Bu harf kümesiyle "Harf avı" kurulamıyor: yeterli öğretilmiş harf ya da hece yok.');
  const yeni = enYeniHarf(harfler);
  const hedef = uygun.includes(yeni) && rng.bool(0.6) ? yeni : rng.pick(uygun);
  let kartlar: Omit<TurKart, 'id'>[];
  if (ayar.hece) {
    const icinde = heceler.filter((x) => x.includes(hedef));
    const n = Math.min(icinde.length, rng.int(ayar.hedef[0], ayar.hedef[1]));
    const yakin = new Set(ayar.oncelik ? karistirilanlar(hedef, g.kume).map((k) => k.harf) : []);
    const etiket = (x: string) => karistirilanlar(hedef, g.kume).find((k) => x.includes(k.harf))?.etiket;
    const disinda = rng
      .shuffle(heceler.filter((x) => !x.includes(hedef)))
      .sort((a, b) => Number([...b].some((c) => yakin.has(c))) - Number([...a].some((c) => yakin.has(c))));
    kartlar = [
      ...rng.sample(icinde, n).map((x) => ({ metin: x, tur: 'hece' as const })),
      ...disinda.slice(0, ayar.kart - n).map((x) => {
        const e = ayar.oncelik && [...x].some((c) => yakin.has(c)) ? etiket(x) : undefined;
        return { metin: x, tur: 'hece' as const, ...(e ? { diagnosticTag: e } : {}) };
      }),
    ];
  } else {
    const n = rng.int(ayar.hedef[0], ayar.hedef[1]);
    const celd = harfCeldiricileri(rng, { hedef, kume: g.kume, adet: ayar.kart - n, yasak: new Set([hedef]), oncelikli: ayar.oncelik });
    // Küme küçükse çeldirici harfler yinelenir (yalnız öğretilmiş harfler).
    const doldur = Array.from({ length: ayar.kart - n }, (_, i) => celd[i % celd.length]);
    kartlar = [
      ...Array.from({ length: n }, () => ({ metin: hedef, tur: 'harf' as const })),
      ...doldur.map((c) => ({ metin: c.harf, tur: 'harf' as const, ...(c.etiket ? { diagnosticTag: c.etiket } : {}) })),
    ];
  }
  const karisik = kartlariKaristir(rng, kartlar);
  return {
    kind: 'coklu',
    itemId: turItemId('T-20', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-20',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: soruGirisHarfi([hedef, ...karisik.map((k) => k.metin)]),
    yonerge: yonergeKlibi(ayar.hece ? 't20-hece' : 't20'),
    soruKlipleri: [],
    uyaran: { tur: 'yazi', metin: hedef },
    geriBildirim: [geriBildirimKlibi('dogru')],
    hedefMetin: hedef,
    sozcukler: [],
    kartlar: karisik,
    dogrular: karisik.flatMap((k, i) => (k.metin.includes(hedef) ? [i] : [])),
  };
}
