/**
 * T-01 — SESİ DUY, RESMİ SEÇ (T.D.1.1.a; plan §2.4.6, Adım 70). SAF, deterministik. Dokun-seç, seçenekler GÖRSEL.
 *
 * Ses yalnız SÖZCÜKTÜR (K-OY-03, D-11): hedef ses tek başına seslendirilmez; çocuk onu 1–3 model sözcükte duyar
 * (z1–3 sözcüklerin ilk sesi, z4–5 hepsinde geçen ses) ve adında o ses olan resmi seçer. Resimler cevaptan önce
 * sessizdir, adları yazılmaz; doğru cevaptan sonra doğru resmin adı (sözcük klibi) okunur.
 *
 * Seçenekler yalnız görseli olan ve harfleri öğretilmiş sözcüklerdir (D-15, D-25); görseli olmayan sözcük seçenek
 * olamaz. Model sözcükler havuzdaki okunabilir sözcüklerdir (resimleri gerekmez, seçeneklerden biri olamaz).
 *
 * Tek doğru: z1–2 çeldirici resmin adında hedef ses HİÇ geçmez; z3 çeldirici o sesle başlamaz (içinde geçebilir —
 * ilk sesi ayırt etme); z4–5 çeldirici resmin adında model sözcüklerin HEPSİNDE ortak olan hiçbir ses geçmez.
 *
 * Zorluk: z1 1 model sözcük, 2 resim · z2 2 model, 3 resim · z3 2 model, 3 resim (ilk ses) · z4 2 model, ses
 * herhangi yerde, 3 resim · z5 3 model, ses içeride, 4 resim.
 */
import { createRng } from '../../../../exercises/rng';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, sozcukKlibi, yonergeKlibi } from './klipler';
import { enYeniHarf, kartlariKaristir, kumeHarfleri, okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurSecimSorusu, type TurUretimGirdisi } from './turSoru';

const AYAR = {
  1: { model: 1, konum: 'bas', resim: 2, celd: 'yok' },
  2: { model: 2, konum: 'bas', resim: 3, celd: 'yok' },
  3: { model: 2, konum: 'bas', resim: 3, celd: 'basta-degil' },
  4: { model: 2, konum: 'her', resim: 3, celd: 'ortak-yok' },
  5: { model: 3, konum: 'ic', resim: 4, celd: 'ortak-yok' },
} as const;

export function uretT01(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-01|${g.zorluk}`);
  const okunur = okunabilirSozcukler(g.havuz, g.kume);
  const resimli = okunur.filter((s) => s.gorselId);
  const sesVar = (w: string, h: string) =>
    ayar.konum === 'bas' ? w[0] === h : ayar.konum === 'ic' ? w.indexOf(h, 1) > 0 : w.includes(h);
  const dogruOlur = (w: string, h: string) => (ayar.konum === 'bas' ? w[0] === h : w.includes(h));
  const modeller = (h: string) => okunur.filter((s) => sesVar(s.metin, h)).map((s) => s.metin);
  const harfler = kumeHarfleri(g.kume).filter(
    (h) => resimli.some((s) => dogruOlur(s.metin, h)) && modeller(h).length >= ayar.model + 1,
  );
  if (resimli.length < ayar.resim || harfler.length === 0)
    throw new TurUretimHatasi('Bu harf kümesiyle "Sesi duy, resmi seç" kurulamıyor: yeterli resimli sözcük yok.');
  const hedefSirasi = rng.shuffle(harfler);
  // Bugünkü ses (en son öğretilen uygun harf) yarı yarıya öncelikli.
  if (rng.bool(0.5)) hedefSirasi.unshift(enYeniHarf(harfler));
  for (let deneme = 0; deneme < 60; deneme++) {
    const hedef = hedefSirasi[deneme % hedefSirasi.length];
    const dogrular = resimli.filter((s) => dogruOlur(s.metin, hedef));
    const dogru = rng.pick(dogrular);
    const adaylar = modeller(hedef).filter((w) => w !== dogru.metin);
    if (adaylar.length < ayar.model) continue;
    const model = rng.shuffle(rng.sample(adaylar, ayar.model));
    const ortak = new Set([...model[0]].filter((c) => model.every((w) => w.includes(c))));
    const celdiriciMi = (w: string) =>
      ayar.celd === 'yok' ? !w.includes(hedef) : ayar.celd === 'basta-degil' ? w[0] !== hedef : ![...ortak].some((c) => w.includes(c));
    const celdHavuzu = resimli.filter((s) => s.metin !== dogru.metin && !model.includes(s.metin) && celdiriciMi(s.metin));
    if (celdHavuzu.length < ayar.resim - 1) continue;
    const celd = rng.sample(celdHavuzu, ayar.resim - 1);
    const kartlar = kartlariKaristir(rng, [
      { metin: dogru.metin, tur: 'gorsel' as const, gorselId: dogru.gorselId },
      ...celd.map((s) => ({ metin: s.metin, tur: 'gorsel' as const, gorselId: s.gorselId })),
    ]);
    const klipler = model.map(sozcukKlibi);
    const resimSozcukleri = kartlar.map((k) => k.metin);
    return {
      kind: 'secim',
      itemId: turItemId('T-01', g.zorluk, g.tohum, kumeKodla(g.kume)),
      sablon: 'T-01',
      zorluk: g.zorluk,
      tohum: g.tohum,
      girisHarfi: soruGirisHarfi([...model, ...resimSozcukleri]),
      yonerge: yonergeKlibi(ayar.konum === 'bas' ? (ayar.model === 1 ? 't01-bas1' : 't01-bas') : 't01-her'),
      soruKlipleri: klipler,
      uyaran: { tur: 'ses', adet: model.length },
      geriBildirim: [geriBildirimKlibi('dogru'), sozcukKlibi(dogru.metin)],
      hedefMetin: dogru.metin,
      sozcukler: [...model, ...resimSozcukleri],
      dinlenen: model,
      kartlar,
      dogru: kartlar.findIndex((k) => k.metin === dogru.metin),
    };
  }
  throw new TurUretimHatasi('Bu harf kümesiyle "Sesi duy, resmi seç" için tek doğrulu soru kurulamadı.');
}
