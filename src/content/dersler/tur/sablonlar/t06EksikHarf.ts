/**
 * T-06 — EKSİK HARFİ TAMAMLA (T.Y.1.2.b; plan §2.4.6). SAF, deterministik. Dokun-yerleştir (1 yuva).
 *
 * Üst alanda bir harfi boş bırakılmış sözcük durur ("ka_e"); çocuk sessiz harf kartlarından eksik harfi koyar.
 * Sözcük klibi yalnız cevaptan sonra (okuma hedefli, D-12). Tek doğru: hiçbir çeldirici boşluğa konunca bilinen
 * bir sözcük kurmaz (ka_e: r → kare kullanılmaz).
 *
 * Zorluk: z1 2–3 harfli sözcük, boşluk ünlüde, 2 kart · z2 3–4 harfli, ünlüde, 3 kart · z3 3–5 harfli, ünsüzde,
 * 3 kart (karıştırılan çift öncelikli) · z4 4–6 harfli, herhangi yerde, 4 kart · z5 5–8 harfli, 4 kart.
 */
import { createRng } from '../../../../exercises/rng';
import { unluMu } from '../alfabe';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, sozcukKlibi, yonergeKlibi } from './klipler';
import { bilinenSozcukMu, harfCeldiricileri, kartlariKaristir, okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurUretimGirdisi, type TurYerlestirSorusu } from './turSoru';

const AYAR = {
  1: { min: 2, max: 3, yer: 'unlu', celd: 1 },
  2: { min: 3, max: 4, yer: 'unlu', celd: 2 },
  3: { min: 3, max: 5, yer: 'unsuz', celd: 2 },
  4: { min: 4, max: 6, yer: 'her', celd: 3 },
  5: { min: 5, max: 8, yer: 'her', celd: 3 },
} as const;

export function uretT06(g: TurUretimGirdisi): TurYerlestirSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-06|${g.zorluk}`);
  const okunur = okunabilirSozcukler(g.havuz, g.kume).map((s) => s.metin);
  let adaylar = okunur.filter((w) => w.length >= ayar.min && w.length <= ayar.max);
  if (adaylar.length === 0) adaylar = okunur.filter((w) => w.length >= 2 && w.length <= 8);
  if (adaylar.length === 0)
    throw new TurUretimHatasi('Bu harf kümesiyle "Eksik harfi tamamla" kurulamıyor: okunabilir sözcük yok.');
  for (let deneme = 0; deneme < 60; deneme++) {
    const sozcuk = rng.pick(adaylar);
    const harfler = [...sozcuk];
    const yerler = harfler
      .map((h, i) => ({ h, i }))
      .filter(({ h }) => ayar.yer === 'her' || (ayar.yer === 'unlu') === unluMu(h) || deneme >= 40)
      .map(({ i }) => i);
    if (yerler.length === 0) continue;
    const yer = rng.pick(yerler);
    const eksik = harfler[yer];
    const kur = (h: string) => [...harfler.slice(0, yer), h, ...harfler.slice(yer + 1)].join('');
    const celd = harfCeldiricileri(rng, {
      hedef: eksik,
      kume: g.kume,
      adet: ayar.celd,
      yasak: new Set([eksik]),
      oncelikli: g.zorluk >= 3,
      uygun: (h) => !bilinenSozcukMu(kur(h), g.havuz),
    });
    if (celd.length === 0) continue;
    const kartlar = kartlariKaristir(rng, [
      { metin: eksik, tur: 'harf' as const },
      ...celd.map((c) => ({ metin: c.harf, tur: 'harf' as const, ...(c.etiket ? { diagnosticTag: c.etiket } : {}) })),
    ]);
    return {
      kind: 'yerlestir',
      itemId: turItemId('T-06', g.zorluk, g.tohum, kumeKodla(g.kume)),
      sablon: 'T-06',
      zorluk: g.zorluk,
      tohum: g.tohum,
      girisHarfi: soruGirisHarfi([sozcuk, ...kartlar.map((k) => k.metin)]),
      yonerge: yonergeKlibi('t06'),
      soruKlipleri: [],
      uyaran: { tur: 'bosluklu', once: harfler.slice(0, yer).join(''), sonra: harfler.slice(yer + 1).join('') },
      geriBildirim: [geriBildirimKlibi('dogru'), sozcukKlibi(sozcuk)],
      hedefMetin: sozcuk,
      sozcukler: [sozcuk],
      kartlar,
      dogruDizi: [eksik],
    };
  }
  throw new TurUretimHatasi('Bu harf kümesiyle "Eksik harfi tamamla" için tek doğrulu soru kurulamadı.');
}
