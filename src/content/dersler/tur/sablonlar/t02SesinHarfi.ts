/**
 * T-02 — SESİN HARFİNİ BUL (T.D.1.2.a, T.D.1.3.b; plan §2.4.6). SAF, deterministik.
 *
 * 2–3 sözcük dinlenir; hepsinde ortak olan sesin harfi sessiz harf kartları arasından seçilir. Ses yalnız
 * SÖZCÜKTÜR: harf hiçbir zaman tek başına seslendirilmez (K-OY-03, D-11), kartlar cevaptan önce sessizdir.
 *
 * Zorluk: z1 iki sözcük, ses başta, 2 kart · z2 üç sözcük, ses başta, 3 kart · z3 üç sözcük, ses herhangi bir
 * yerde, 4 kart (karıştırılan çift öncelikli) · z4 en az ikisinde ses içeride, 5 kart · z5 hepsinde ses içeride,
 * 6 kart. Çeldirici harf sözcüklerin HEPSİNDE geçemez (tek doğru); z1–z2'de hiçbirinde geçmez.
 */
import { createRng } from '../../../../exercises/rng';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, sozcukKlibi, yonergeKlibi } from './klipler';
import { enYeniHarf, harfCeldiricileri, kartlariKaristir, kumeHarfleri, okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurSecimSorusu, type TurUretimGirdisi } from './turSoru';

const AYAR = {
  1: { n: 2, konum: 'bas', kart: 2 },
  2: { n: 3, konum: 'bas', kart: 3 },
  3: { n: 3, konum: 'her', kart: 4 },
  4: { n: 3, konum: 'ic2', kart: 5 },
  5: { n: 3, konum: 'ic', kart: 6 },
} as const;

export function uretT02(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-02|${g.zorluk}`);
  const okunur = okunabilirSozcukler(g.havuz, g.kume).map((s) => s.metin);
  const uygunMu = (w: string, h: string) =>
    ayar.konum === 'bas' ? w[0] === h : ayar.konum === 'ic' ? w.indexOf(h) > 0 : w.includes(h);
  const adaylar = (h: string) => okunur.filter((w) => uygunMu(w, h));
  const harfler = kumeHarfleri(g.kume).filter((h) => adaylar(h).length >= ayar.n);
  if (harfler.length === 0 || kumeHarfleri(g.kume).length < 2)
    throw new TurUretimHatasi('Bu harf kümesiyle "Sesin harfini bul" kurulamıyor: ortak sesli yeterli sözcük yok.');
  // Bugünkü ses (en son öğretilen uygun harf) yarı yarıya öncelikli; öğretmen kümesi sırayı belirler.
  const hedef = rng.bool(0.5) ? enYeniHarf(harfler) : rng.pick(harfler);
  for (let deneme = 0; deneme < 40; deneme++) {
    let sozcukler = rng.sample(adaylar(hedef), ayar.n);
    if (ayar.konum === 'ic2' && sozcukler.filter((w) => w.indexOf(hedef) > 0).length < 2 && deneme < 30) continue;
    sozcukler = rng.shuffle(sozcukler);
    const hepsinde = new Set([...sozcukler[0]].filter((c) => sozcukler.every((w) => w.includes(c))));
    const birinde = new Set(sozcukler.flatMap((w) => [...w]));
    const yasak = g.zorluk <= 2 && kumeHarfleri(g.kume).some((h) => !birinde.has(h)) ? birinde : hepsinde;
    const celd = harfCeldiricileri(rng, {
      hedef,
      kume: g.kume,
      adet: ayar.kart - 1,
      yasak,
      oncelikli: g.zorluk >= 3,
    });
    if (celd.length === 0) continue;
    const kartlar = kartlariKaristir(rng, [
      { metin: hedef, tur: 'harf' },
      ...celd.map((c) => ({ metin: c.harf, tur: 'harf' as const, ...(c.etiket ? { diagnosticTag: c.etiket } : {}) })),
    ]);
    const klipler = sozcukler.map(sozcukKlibi);
    return {
      kind: 'secim',
      itemId: turItemId('T-02', g.zorluk, g.tohum, kumeKodla(g.kume)),
      sablon: 'T-02',
      zorluk: g.zorluk,
      tohum: g.tohum,
      girisHarfi: soruGirisHarfi([...sozcukler, ...kartlar.map((k) => k.metin)]),
      yonerge: yonergeKlibi('t02'),
      soruKlipleri: klipler,
      uyaran: { tur: 'ses', adet: sozcukler.length },
      geriBildirim: [geriBildirimKlibi('dogru'), ...klipler],
      hedefMetin: hedef,
      sozcukler,
      kartlar,
      dogru: kartlar.findIndex((k) => k.metin === hedef),
    };
  }
  throw new TurUretimHatasi('Bu harf kümesiyle "Sesin harfini bul" için tek doğrulu soru kurulamadı.');
}
