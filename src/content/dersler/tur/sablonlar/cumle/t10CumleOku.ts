/**
 * T-10 — CÜMLEYİ OKU, RESMİNİ BUL (T.O.1.1.c; plan §2.4.6, Adım 74). SAF, deterministik. Dokun-seç, seçenekler GÖRSEL.
 *
 * Uyaran yazılı cümledir (TemelYazi, tek satır, tek renk). Okuma hedeflidir (D-12): yönerge cümleyi SÖYLEMEZ, soru sesi
 * yoktur, ↻ yalnız yönergeyi çalar; cümle klibi yalnız doğru cevaptan sonra. Resimler cevaptan önce sessiz ve adsızdır.
 * Hedef resim cümlede adı geçen nesnedir (havuzda `gorselId`; rebus yok, resim yalnız seçenek alanında — D-07).
 * Çeldirici resimler öğretilmiş harfli, görselli sözcüklerdir (D-15) ve adları cümlede GEÇMEZ (tek doğru cevap).
 *
 * Zorluk: z1 2 sözcüklü cümle, 2 resim, çeldirici başka harfle başlar · z2 2–3 sözcük, 3 resim · z3 2–4 sözcük, 3 resim,
 * bir yazıca yakın çeldirici · z4 3–5 sözcük, 4 resim, yakın çeldiriciler · z5 3–5 sözcük, 4 resim, en yakınlar.
 */
import { createRng } from '../../../../../exercises/rng';
import { kumeKodla } from '../../ogretilenKume';
import { cumleKlibi, geriBildirimKlibi, yonergeKlibi } from '../klipler';
import { kartlariKaristir, okunabilirSozcukler } from '../ortak';
import { turItemId, TurUretimHatasi, type TurHavuzSozcugu, type TurSecimSorusu, type TurUretimGirdisi } from '../turSoru';
import { okunabilirCumleler } from './cumleHavuzu';
import { cumleGirisHarfi, cumleGovdeleri, cumleSozcukleri } from './ortakCumle';

const AYAR = {
  1: { min: 2, max: 2, resim: 2, yakin: 'uzak' },
  2: { min: 2, max: 3, resim: 3, yakin: 'serbest' },
  3: { min: 2, max: 4, resim: 3, yakin: 'yakin' },
  4: { min: 3, max: 5, resim: 4, yakin: 'yakin' },
  5: { min: 3, max: 5, resim: 4, yakin: 'yakin' },
} as const;

const AD = '"Cümleyi oku, resmini bul"';

function yakinlik(a: string, b: string): number {
  const ortak = [...new Set(a)].filter((c) => b.includes(c)).length;
  return (a[0] === b[0] ? 3 : 0) + ortak - Math.abs(a.length - b.length) * 0.5;
}

export function uretT10(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-10|${g.zorluk}`);
  const resimli = okunabilirSozcukler(g.havuz, g.kume).filter((s) => s.gorselId);
  const resmin = new Map(resimli.map((s) => [s.gorselId!, s]));
  const cumleler = okunabilirCumleler(g.cumleler ?? [], g.kume).filter((c) => c.gorselId && resmin.has(c.gorselId));
  if (cumleler.length === 0 || resimli.length < ayar.resim)
    throw new TurUretimHatasi(`Bu harf kümesiyle ${AD} kurulamıyor: resimli okunabilir cümle yok (cümleler 2. gruptan).`);
  const boyda = cumleler.filter((c) => {
    const n = cumleSozcukleri(c.metin).length;
    return n >= ayar.min && n <= ayar.max;
  });
  const adaylar = boyda.length > 0 ? boyda : cumleler;
  for (let deneme = 0; deneme < 40; deneme++) {
    const c = rng.pick(adaylar);
    const hedef = resmin.get(c.gorselId!)!;
    const govdeler = cumleGovdeleri(c.metin);
    // Adı cümlede geçen (ya da cümledeki bir sözcüğün başı olan) resim çeldirici olamaz: tek doğru cevap.
    let digerleri: TurHavuzSozcugu[] = resimli.filter(
      (s) => s.metin !== hedef.metin && !govdeler.some((w) => w.startsWith(s.metin) || s.metin.startsWith(w)),
    );
    if (ayar.yakin === 'uzak') {
      const uzak = digerleri.filter((s) => s.metin[0] !== hedef.metin[0]);
      if (uzak.length >= ayar.resim - 1) digerleri = uzak;
    }
    if (digerleri.length < ayar.resim - 1) continue;
    let celd: TurHavuzSozcugu[];
    if (ayar.yakin === 'yakin') {
      const sirali = rng
        .shuffle(digerleri)
        .map((s, i) => ({ s, i, y: yakinlik(hedef.metin, s.metin) }))
        .sort((a, b) => b.y - a.y || a.i - b.i)
        .map((x) => x.s);
      const yakinSayisi = g.zorluk === 3 ? 1 : ayar.resim - 1;
      celd = [...sirali.slice(0, yakinSayisi), ...rng.shuffle(sirali.slice(yakinSayisi))].slice(0, ayar.resim - 1);
    } else celd = rng.sample(digerleri, ayar.resim - 1);
    const kartlar = kartlariKaristir(rng, [
      { metin: hedef.metin, tur: 'gorsel' as const, gorselId: hedef.gorselId },
      ...celd.map((s) => ({ metin: s.metin, tur: 'gorsel' as const, gorselId: s.gorselId })),
    ]);
    return {
      kind: 'secim',
      itemId: turItemId('T-10', g.zorluk, g.tohum, kumeKodla(g.kume)),
      sablon: 'T-10',
      zorluk: g.zorluk,
      tohum: g.tohum,
      girisHarfi: cumleGirisHarfi(c, kartlar.map((k) => k.metin)),
      yonerge: yonergeKlibi('t10'),
      soruKlipleri: [],
      uyaran: { tur: 'yazi', metin: c.metin },
      geriBildirim: [geriBildirimKlibi('dogru'), cumleKlibi(c.id)],
      hedefMetin: c.metin,
      sozcukler: kartlar.map((k) => k.metin),
      kartlar,
      dogru: kartlar.findIndex((k) => k.metin === hedef.metin),
    };
  }
  throw new TurUretimHatasi(`Bu harf kümesiyle ${AD} kurulamadı: yeterli çeldirici resim yok.`);
}
