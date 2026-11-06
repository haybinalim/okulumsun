/**
 * T-18 — SESİN YERİ: BAŞTA / ORTADA / SONDA (T.D.1.1.a, T.D.1.2.a ses farkındalığı; Adım 79). SAF. Dokun-seç.
 *
 * Üstte sözcük resmi ve yanında hedef harf (dokunulmaz). Resmin adı soru sesidir (ses dosyası yokken öğretmen okur);
 * hedef ses tek başına seslendirilmez (K-OY-03). Kartlar üç kutulu şerit: dolu kutu sesin yeri (renk tek ipucu değil:
 * dolu / kesikli boş kutu); sıralı durur (başta solda), karıştırılmaz. Sözcük yalnız görseli olan ve öğretilmiş
 * harfli; hedef harf sözcükte TAM BİR KEZ geçer (tek doğru).
 *
 * Hedef: z1–4'te bugünkü ses (en son öğretilen harf) önceliklidir; z5 kümedeki herhangi bir harf.
 * Zorluk: z1 iki kart (başta/sonda), cevap başta ya da sonda · z2 üç kart, cevap başta ya da sonda · z3 üç kart,
 * herhangi · z4 üç kart, cevap ortada ya da sonda, en az 4 harf · z5 üç kart, herhangi, en az 4 harf.
 */
import { createRng } from '../../../../exercises/rng';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, sozcukKlibi, yonergeKlibi } from './klipler';
import { enYeniHarf, kumeHarfleri, okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurSecimSorusu, type TurUretimGirdisi } from './turSoru';

export type SesYeri = 'bas' | 'orta' | 'son';

const AYAR: Readonly<Record<1 | 2 | 3 | 4 | 5, { kartlar: readonly SesYeri[]; cevap: readonly SesYeri[]; min: number; bugun: boolean }>> = {
  1: { kartlar: ['bas', 'son'], cevap: ['bas', 'son'], min: 2, bugun: true },
  2: { kartlar: ['bas', 'orta', 'son'], cevap: ['bas', 'son'], min: 2, bugun: true },
  3: { kartlar: ['bas', 'orta', 'son'], cevap: ['bas', 'orta', 'son'], min: 3, bugun: true },
  4: { kartlar: ['bas', 'orta', 'son'], cevap: ['orta', 'son'], min: 4, bugun: true },
  5: { kartlar: ['bas', 'orta', 'son'], cevap: ['bas', 'orta', 'son'], min: 4, bugun: false },
};

/** Harfin sözcükteki yeri; harf tam bir kez geçmiyorsa `null`. */
export function sesYeri(sozcuk: string, harf: string): SesYeri | null {
  const h = [...sozcuk];
  const i = h.indexOf(harf);
  if (i < 0 || h.lastIndexOf(harf) !== i) return null;
  return i === 0 ? 'bas' : i === h.length - 1 ? 'son' : 'orta';
}

export function uretT18(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-18|${g.zorluk}`);
  const resimli = okunabilirSozcukler(g.havuz, g.kume).filter((s) => s.gorselId && [...s.metin].length >= ayar.min);
  const harfler = kumeHarfleri(g.kume);
  const uygun = (h: string) =>
    resimli.filter((s) => {
      const y = sesYeri(s.metin, h);
      return y !== null && ayar.cevap.includes(y);
    });
  const adaylar = harfler.filter((h) => uygun(h).length > 0);
  if (adaylar.length === 0)
    throw new TurUretimHatasi('Bu harf kümesiyle "Sesin yeri" kurulamıyor: uygun resimli sözcük yok.');
  const yeni = enYeniHarf(harfler);
  const hedef = ayar.bugun && adaylar.includes(yeni) && rng.bool(0.7) ? yeni : rng.pick(adaylar);
  // Önce yer, sonra sözcük: cevap hep aynı yer olmasın.
  const sozcukler = uygun(hedef);
  const yerler = ayar.cevap.filter((y) => sozcukler.some((s) => sesYeri(s.metin, hedef) === y));
  const yer = rng.pick(yerler);
  const s = rng.pick(sozcukler.filter((w) => sesYeri(w.metin, hedef) === yer));
  const kartlar = ayar.kartlar.map((y, i) => ({ id: `k${i}`, metin: y, tur: 'konum' as const }));
  return {
    kind: 'secim',
    itemId: turItemId('T-18', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-18',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: soruGirisHarfi([s.metin, hedef]),
    yonerge: yonergeKlibi(ayar.kartlar.length === 2 ? 't18-iki' : 't18'),
    soruKlipleri: [sozcukKlibi(s.metin)],
    uyaran: { tur: 'resim', gorselId: s.gorselId!, harf: hedef },
    geriBildirim: [geriBildirimKlibi('dogru'), sozcukKlibi(s.metin)],
    hedefMetin: s.metin,
    sozcukler: [s.metin],
    dinlenen: [s.metin],
    kartlar,
    dogru: ayar.kartlar.indexOf(yer),
  };
}
