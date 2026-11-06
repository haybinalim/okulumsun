/**
 * T-16 — HATALI YAZILMIŞ SÖZCÜĞÜ BUL (T.Y.1.4.a; plan §2.4.6; Adım 79). SAF, deterministik. Dokun-seç.
 *
 * Altta sessiz sözcük kartları: biri doğru yazılmış okunabilir bir havuz sözcüğünün tek harfi karıştırılan çiftiyle
 * değiştirilmiş biçimi (önce `TUR_BENZER_BICIM`, sonra katalogdaki öteki çiftler; YALNIZ kümedeki harflerle, D-23),
 * ötekiler doğru yazılmış okunabilir sözcükler. Okuma hedefli (D-12): soru sesi yok, yönerge sözcük söylemez. Doğru
 * cevaptan sonra sözcüğün doğru yazılışı üstte görünür ve okunur (geri bildirim klibi).
 *
 * Tek doğru: hatalı biçim bilinen bir sözcük DEĞİLDİR (havuz + belirsizlik listesi) ve başka bir kartla aynı değildir.
 *
 * Zorluk: z1 2 kart, 2–4 harf · z2 3 kart, 2–4 harf · z3 3 kart, 3–5 harf · z4 4 kart, 3–6 harf · z5 4 kart,
 * 4–7 harf, değişen harf ilk harf değil.
 */
import { createRng } from '../../../../exercises/rng';
import { kumeKodla } from '../ogretilenKume';
import { unluMu } from '../alfabe';
import { karistirilanlar } from './celdiriciler';
import { geriBildirimKlibi, sozcukKlibi, yonergeKlibi } from './klipler';
import { bilinenSozcukMu, kartlariKaristir, okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurSecimSorusu, type TurUretimGirdisi } from './turSoru';

const AYAR = {
  1: { kart: 2, min: 2, max: 4, ic: false },
  2: { kart: 3, min: 2, max: 4, ic: false },
  3: { kart: 3, min: 3, max: 5, ic: false },
  4: { kart: 4, min: 3, max: 6, ic: false },
  5: { kart: 4, min: 4, max: 7, ic: true },
} as const;

/**
 * `sozcuk`ün tek harfi değişmiş, bilinmeyen biçimleri. Öncelik: benzer biçim çifti ve aynı tür (ünlü yerine ünlü,
 * ünsüz yerine ünsüz: okunabilir kalır), sonra benzer biçim, sonra katalogdaki öteki çiftler; yalnız en öncelikliler.
 */
export function hataliBicimler(sozcuk: string, kume: ReadonlySet<string>, bilinen: (w: string) => boolean, ic: boolean): string[] {
  const h = [...sozcuk];
  const out: { w: string; o: number }[] = [];
  h.forEach((c, i) => {
    if (ic && i === 0) return;
    for (const k of karistirilanlar(c, kume)) {
      const w = [...h.slice(0, i), k.harf, ...h.slice(i + 1)].join('');
      const o = (k.etiket === 'TUR_BENZER_BICIM' ? 0 : 2) + (unluMu(k.harf) === unluMu(c) ? 0 : 1);
      if (!bilinen(w) && !out.some((x) => x.w === w)) out.push({ w, o });
    }
  });
  const en = Math.min(...out.map((x) => x.o));
  return out.filter((x) => x.o === en).map((x) => x.w);
}

export function uretT16(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-16|${g.zorluk}`);
  const okunur = okunabilirSozcukler(g.havuz, g.kume).map((s) => s.metin);
  const uygun = okunur.filter((w) => w.length >= ayar.min && w.length <= ayar.max);
  const bilinen = (w: string) => bilinenSozcukMu(w, g.havuz);
  const hedefler = rng.shuffle(uygun).filter((w) => hataliBicimler(w, g.kume, bilinen, ayar.ic).length > 0);
  if (hedefler.length === 0 || uygun.length < ayar.kart)
    throw new TurUretimHatasi('Bu harf kümesiyle "Hatalı sözcüğü bul" kurulamıyor: yeterli okunabilir sözcük yok.');
  const sozcuk = hedefler[0];
  const bicimler = hataliBicimler(sozcuk, g.kume, bilinen, ayar.ic);
  const hatali = rng.pick(bicimler);
  const digerleri = rng.sample(
    uygun.filter((w) => w !== sozcuk && w !== hatali),
    ayar.kart - 1,
  );
  const kartlar = kartlariKaristir(rng, [
    { metin: hatali, tur: 'sozcuk' as const },
    ...digerleri.map((w) => ({ metin: w, tur: 'sozcuk' as const })),
  ]);
  return {
    kind: 'secim',
    itemId: turItemId('T-16', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-16',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: soruGirisHarfi([sozcuk, ...kartlar.map((k) => k.metin)]),
    yonerge: yonergeKlibi('t16'),
    soruKlipleri: [],
    uyaran: { tur: 'yok' },
    geriBildirim: [geriBildirimKlibi('dogru'), sozcukKlibi(sozcuk)],
    hedefMetin: sozcuk,
    sozcukler: [sozcuk, ...digerleri],
    kartlar,
    dogru: kartlar.findIndex((k) => k.metin === hatali),
  };
}
