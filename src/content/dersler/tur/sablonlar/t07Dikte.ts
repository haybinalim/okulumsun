/**
 * T-07 — SÖYLENENİ HARF KARTLARIYLA YAZ (DİKTE; T.Y.1.1.e; plan §2.4.6). SAF, deterministik. Dokun-yerleştir.
 *
 * Sözcük klibi (soru) dinlenir; çocuk sessiz harf kartlarını sırayla yuvalara koyar. Ses yalnız SÖZCÜKTÜR, kartlar
 * cevaptan önce ve sonra sessizdir (tek ünsüz sesi yok, D-11). Ses dosyası yoksa arayüz "ses yok" gösterir ve
 * öğretmen sözcüğü söyler (yetişkin "Sözcüğü göster").
 *
 * Zorluk: z1 iki harfli · z2 üç harfli · z3 3–4 harfli + 1 çeldirici · z4 4–5 harfli + 2 (karıştırılan çift
 * öncelikli) · z5 5–8 harfli + 2. Toplam kart en çok 8 (tahta 1080×810 sınırı, plan §2.4.6).
 */
import { createRng } from '../../../../exercises/rng';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, sozcukKlibi, yonergeKlibi } from './klipler';
import { harfCeldiricileri, kartlariKaristir, okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { turItemId, TUR_EN_COK_KART, TurUretimHatasi, type TurUretimGirdisi, type TurYerlestirSorusu } from './turSoru';

const AYAR = {
  1: { min: 2, max: 2, celd: 0 },
  2: { min: 3, max: 3, celd: 0 },
  3: { min: 3, max: 4, celd: 1 },
  4: { min: 4, max: 5, celd: 2 },
  5: { min: 5, max: 8, celd: 2 },
} as const;

export function uretT07(g: TurUretimGirdisi): TurYerlestirSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-07|${g.zorluk}`);
  const okunur = okunabilirSozcukler(g.havuz, g.kume).map((s) => s.metin);
  let adaylar = okunur.filter((w) => w.length >= ayar.min && w.length <= ayar.max);
  if (adaylar.length === 0) adaylar = okunur.filter((w) => w.length >= 2 && w.length <= ayar.max);
  if (adaylar.length === 0) adaylar = okunur.filter((w) => w.length >= 2 && w.length <= TUR_EN_COK_KART);
  if (adaylar.length === 0) throw new TurUretimHatasi('Bu harf kümesiyle "Dikte" kurulamıyor: okunabilir sözcük yok.');
  const sozcuk = rng.pick(adaylar);
  const harfler = [...sozcuk];
  const celd = harfCeldiricileri(rng, {
    hedef: rng.pick(harfler),
    kume: g.kume,
    adet: Math.min(ayar.celd, TUR_EN_COK_KART - harfler.length),
    yasak: new Set(harfler),
    oncelikli: g.zorluk >= 4,
  });
  const kartlar = kartlariKaristir(rng, [
    ...harfler.map((h) => ({ metin: h, tur: 'harf' as const })),
    ...celd.map((c) => ({ metin: c.harf, tur: 'harf' as const, ...(c.etiket ? { diagnosticTag: c.etiket } : {}) })),
  ]);
  const klip = sozcukKlibi(sozcuk);
  return {
    kind: 'yerlestir',
    itemId: turItemId('T-07', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-07',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: soruGirisHarfi([sozcuk, ...kartlar.map((k) => k.metin)]),
    yonerge: yonergeKlibi('t07'),
    soruKlipleri: [klip],
    uyaran: { tur: 'ses', adet: 1 },
    geriBildirim: [geriBildirimKlibi('dogru'), klip],
    hedefMetin: sozcuk,
    sozcukler: [sozcuk],
    kartlar,
    dogruDizi: harfler,
  };
}
