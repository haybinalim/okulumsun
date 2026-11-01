/**
 * T-08 — SÖZCÜĞÜ OKU, RESMİNİ BUL (T.O.1.1.b; plan §2.4.6, Adım 70). SAF, deterministik. Dokun-seç, seçenekler GÖRSEL.
 *
 * Uyaran yazılı sözcüktür (TemelYazi, tek renk). Okuma hedeflidir (D-12): yönerge sözcüğü SÖYLEMEZ, soru sesi yoktur,
 * ↻ yalnız yönergeyi çalar; sözcük klibi yalnız doğru cevaptan sonra. Resimler cevaptan önce sessizdir.
 *
 * Seçenekler yalnız görseli olan ve harfleri öğretilmiş sözcüklerdir (D-15, D-25). Zorluk arttıkça çeldirici
 * resimlerin adları hedefe yazıca yakınlaşır (aynı harfle başlar, ortak harfi çok), böylece tahmin değil okuma gerekir.
 *
 * Zorluk: z1 2–3 harfli sözcük, 2 resim, çeldirici başka harfle başlar · z2 2–4 harf, 3 resim · z3 3–5 harf, 3 resim,
 * yazıca yakın çeldirici önde · z4 3–6 harf, 4 resim, yakın çeldiriciler · z5 4–8 harf, 4 resim, en yakınlar.
 */
import { createRng } from '../../../../exercises/rng';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, sozcukKlibi, yonergeKlibi } from './klipler';
import { kartlariKaristir, okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurHavuzSozcugu, type TurSecimSorusu, type TurUretimGirdisi } from './turSoru';

const AYAR = {
  1: { min: 2, max: 3, resim: 2, yakin: 'uzak' },
  2: { min: 2, max: 4, resim: 3, yakin: 'serbest' },
  3: { min: 3, max: 5, resim: 3, yakin: 'yakin' },
  4: { min: 3, max: 6, resim: 4, yakin: 'yakin' },
  5: { min: 4, max: 8, resim: 4, yakin: 'yakin' },
} as const;

/** Yazıca yakınlık: aynı ilk harf + ortak harf sayısı + benzer uzunluk (yüksek = yakın). */
function yakinlik(a: string, b: string): number {
  const ortak = [...new Set(a)].filter((c) => b.includes(c)).length;
  return (a[0] === b[0] ? 3 : 0) + ortak - Math.abs(a.length - b.length) * 0.5;
}

export function uretT08(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-08|${g.zorluk}`);
  const resimli = okunabilirSozcukler(g.havuz, g.kume).filter((s) => s.gorselId);
  if (resimli.length < ayar.resim)
    throw new TurUretimHatasi('Bu harf kümesiyle "Sözcüğü oku, resmini bul" kurulamıyor: yeterli resimli sözcük yok.');
  const boyda = resimli.filter((s) => s.metin.length >= ayar.min && s.metin.length <= ayar.max);
  const adaylar = boyda.length > 0 ? boyda : resimli;
  for (let deneme = 0; deneme < 40; deneme++) {
    const hedef = rng.pick(adaylar);
    let digerleri: TurHavuzSozcugu[] = resimli.filter((s) => s.metin !== hedef.metin);
    if (ayar.yakin === 'uzak') {
      const uzak = digerleri.filter((s) => s.metin[0] !== hedef.metin[0]);
      if (uzak.length >= ayar.resim - 1) digerleri = uzak;
    }
    if (digerleri.length < ayar.resim - 1) continue;
    let celd: TurHavuzSozcugu[];
    if (ayar.yakin === 'yakin') {
      // En yakın adaylardan (karıştırılmış, kararlı sıralı) — z3'te bir yakın + rastgele, z4–5 hepsi yakın.
      const sirali = rng
        .shuffle(digerleri)
        .map((s, i) => ({ s, i, y: yakinlik(hedef.metin, s.metin) }))
        .sort((a, b) => b.y - a.y || a.i - b.i)
        .map((x) => x.s);
      const yakinSayisi = g.zorluk === 3 ? 1 : ayar.resim - 1;
      const secilen = sirali.slice(0, yakinSayisi);
      const kalan = rng.shuffle(sirali.slice(yakinSayisi));
      celd = [...secilen, ...kalan].slice(0, ayar.resim - 1);
    } else celd = rng.sample(digerleri, ayar.resim - 1);
    const kartlar = kartlariKaristir(rng, [
      { metin: hedef.metin, tur: 'gorsel' as const, gorselId: hedef.gorselId },
      ...celd.map((s) => ({ metin: s.metin, tur: 'gorsel' as const, gorselId: s.gorselId })),
    ]);
    return {
      kind: 'secim',
      itemId: turItemId('T-08', g.zorluk, g.tohum, kumeKodla(g.kume)),
      sablon: 'T-08',
      zorluk: g.zorluk,
      tohum: g.tohum,
      girisHarfi: soruGirisHarfi(kartlar.map((k) => k.metin)),
      yonerge: yonergeKlibi('t08'),
      soruKlipleri: [],
      uyaran: { tur: 'yazi', metin: hedef.metin },
      geriBildirim: [geriBildirimKlibi('dogru'), sozcukKlibi(hedef.metin)],
      hedefMetin: hedef.metin,
      sozcukler: kartlar.map((k) => k.metin),
      kartlar,
      dogru: kartlar.findIndex((k) => k.metin === hedef.metin),
    };
  }
  throw new TurUretimHatasi('Bu harf kümesiyle "Sözcüğü oku, resmini bul" kurulamadı.');
}
