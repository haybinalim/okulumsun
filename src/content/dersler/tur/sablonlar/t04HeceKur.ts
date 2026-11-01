/**
 * T-04 — HECE KUR (T.O.1.1.a; plan §2.4.6). SAF, deterministik. Dokun-yerleştir (TAP_TO_PLACE).
 *
 * Üst alanda model hece durur; çocuk sessiz harf kartlarını sırayla yuvalara koyar. Hece klibi YALNIZ hece
 * tamamlandıktan sonra çalar (soru sırasında hece söylenmez: okuma hedefli, D-12). Heceler yalnız havuzdaki
 * okunabilir sözcüklerden gelir (bağlamsız hece yok, D-05); kapalı → açık sırası zorlukla izlenir (K-OY-04, D-03).
 *
 * Zorluk: z1 kapalı hece (an, at), çeldiricisiz · z2 kapalı + 1 çeldirici · z3 açık hece (na, ta) + 1 çeldirici ·
 * z4 iki harfli herhangi hece + 2 çeldirici (karıştırılan çift öncelikli) · z5 üç harfli hece + 2 çeldirici.
 * Kümede istenen türde hece yoksa iki harfli herhangi bir heceye düşülür.
 */
import { createRng } from '../../../../exercises/rng';
import { hecele, heceTuru } from '../heceleme';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, heceKlibi, yonergeKlibi } from './klipler';
import { harfCeldiricileri, kartlariKaristir, okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { turItemId, TurUretimHatasi, type TurUretimGirdisi, type TurYerlestirSorusu } from './turSoru';

const AYAR = {
  1: { tur: 'kapali', celd: 0 },
  2: { tur: 'kapali', celd: 1 },
  3: { tur: 'acik', celd: 1 },
  4: { tur: 'iki', celd: 2 },
  5: { tur: 'uc', celd: 2 },
} as const;

/** Okunabilir sözcüklerin heceleri (≥ 2 harf) → ilk geçtiği sözcük. */
export function okunabilirHeceler(g: Pick<TurUretimGirdisi, 'havuz' | 'kume'>): Map<string, string> {
  const m = new Map<string, string>();
  for (const s of okunabilirSozcukler(g.havuz, g.kume))
    for (const h of hecele(s.metin)) if ([...h].length >= 2 && !m.has(h)) m.set(h, s.metin);
  return m;
}

export function uretT04(g: TurUretimGirdisi): TurYerlestirSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-04|${g.zorluk}`);
  const heceler = okunabilirHeceler(g);
  const tumu = [...heceler.keys()];
  const uyan = tumu.filter((h) => {
    const t = heceTuru(h);
    return ayar.tur === 'iki' ? h.length === 2 : ayar.tur === 'uc' ? t === 'uc' : t === ayar.tur;
  });
  const liste = uyan.length > 0 ? uyan : tumu.filter((h) => h.length === 2);
  if (liste.length === 0) throw new TurUretimHatasi('Bu harf kümesiyle "Hece kur" kurulamıyor: okunabilir hece yok.');
  const hece = rng.pick(liste);
  const harfler = [...hece];
  const celd = harfCeldiricileri(rng, {
    hedef: rng.pick(harfler),
    kume: g.kume,
    adet: ayar.celd,
    yasak: new Set(harfler),
    oncelikli: g.zorluk >= 4,
  });
  const kartlar = kartlariKaristir(rng, [
    ...harfler.map((h) => ({ metin: h, tur: 'harf' as const })),
    ...celd.map((c) => ({ metin: c.harf, tur: 'harf' as const, ...(c.etiket ? { diagnosticTag: c.etiket } : {}) })),
  ]);
  const sozcuk = heceler.get(hece)!;
  return {
    kind: 'yerlestir',
    itemId: turItemId('T-04', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-04',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: soruGirisHarfi([hece, ...kartlar.map((k) => k.metin)]),
    yonerge: yonergeKlibi('t04'),
    soruKlipleri: [],
    uyaran: { tur: 'yazi', metin: hece },
    geriBildirim: [geriBildirimKlibi('dogru'), heceKlibi(hece)],
    hedefMetin: hece,
    sozcukler: [sozcuk],
    kartlar,
    dogruDizi: harfler,
  };
}
