/**
 * T-05 — HECELERİ BİRLEŞTİR, SÖZCÜK KUR (T.O.1.1.b; plan §2.4.6). SAF, deterministik. Dokun-yerleştir.
 *
 * Sessiz hece kartları (tek renk, D-06) yuvalara sırayla konur. z1'de model sözcük üstte durur; z2'den itibaren
 * model yoktur: çocuk heceleri okuyup birleştirerek ANLAMLI sözcüğü bulur. Sözcük klibi yalnız cevaptan sonra
 * (D-12). Tek doğru: kartların başka bir dizilişi bilinen bir sözcük kurmaz (havuz + belirsizlik listesi).
 *
 * Zorluk: z1 iki heceli, model var · z2 iki heceli · z3 iki-üç heceli + 1 çeldirici hece · z4 üç heceli + 1 ·
 * z5 üç-dört heceli + 2. Kümede uzun sözcük yoksa iki heceliye düşülür. Çeldirici heceler de okunabilir
 * sözcüklerin heceleridir (bağlamsız hece yok, D-05).
 */
import { createRng } from '../../../../exercises/rng';
import { hecele } from '../heceleme';
import { kumeKodla } from '../ogretilenKume';
import { geriBildirimKlibi, sozcukKlibi, yonergeKlibi } from './klipler';
import { bilinenSozcukMu, kartlariKaristir, okunabilirSozcukler, soruGirisHarfi } from './ortak';
import { okunabilirHeceler } from './t04HeceKur';
import { turItemId, TurUretimHatasi, type TurUretimGirdisi, type TurYerlestirSorusu } from './turSoru';

const AYAR = {
  1: { min: 2, max: 2, celd: 0, model: true },
  2: { min: 2, max: 2, celd: 0, model: false },
  3: { min: 2, max: 3, celd: 1, model: false },
  4: { min: 3, max: 3, celd: 1, model: false },
  5: { min: 3, max: 4, celd: 2, model: false },
} as const;

/** `kartlar`dan `n` tanesinin her sıralı dizilişi (çoklu küme; indeksle). */
function dizilisler(kartlar: readonly string[], n: number): string[] {
  const sonuc: string[] = [];
  const kullanildi = kartlar.map(() => false);
  const yuru = (yol: string[]) => {
    if (yol.length === n) {
      sonuc.push(yol.join(''));
      return;
    }
    kartlar.forEach((k, i) => {
      if (kullanildi[i]) return;
      kullanildi[i] = true;
      yuru([...yol, k]);
      kullanildi[i] = false;
    });
  };
  yuru([]);
  return sonuc;
}

export function uretT05(g: TurUretimGirdisi): TurYerlestirSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-05|${g.zorluk}`);
  const okunur = okunabilirSozcukler(g.havuz, g.kume).map((s) => s.metin);
  const heceliler = (min: number, max: number) =>
    okunur.filter((w) => hecele(w).length >= min && hecele(w).length <= max);
  let adaylar = heceliler(ayar.min, ayar.max);
  if (adaylar.length === 0) adaylar = heceliler(2, ayar.max);
  if (adaylar.length === 0) adaylar = heceliler(2, 4);
  if (adaylar.length === 0)
    throw new TurUretimHatasi('Bu harf kümesiyle "Heceleri birleştir" kurulamıyor: iki heceli okunabilir sözcük yok.');
  const tumHeceler = [...okunabilirHeceler(g).keys()];
  for (let deneme = 0; deneme < 40; deneme++) {
    const sozcuk = rng.pick(adaylar);
    const heceler = hecele(sozcuk);
    const celdAdaylari = rng.shuffle(tumHeceler.filter((h) => !heceler.includes(h)));
    const celd: string[] = [];
    for (const h of celdAdaylari) {
      if (celd.length >= ayar.celd) break;
      const deneme2 = [...heceler, ...celd, h];
      if (dizilisler(deneme2, heceler.length).every((d) => d === sozcuk || !bilinenSozcukMu(d, g.havuz))) celd.push(h);
    }
    const metinler = [...heceler, ...celd];
    if (!dizilisler(metinler, heceler.length).every((d) => d === sozcuk || !bilinenSozcukMu(d, g.havuz))) continue;
    const kartlar = kartlariKaristir(rng, metinler.map((m) => ({ metin: m, tur: 'hece' as const })));
    return {
      kind: 'yerlestir',
      itemId: turItemId('T-05', g.zorluk, g.tohum, kumeKodla(g.kume)),
      sablon: 'T-05',
      zorluk: g.zorluk,
      tohum: g.tohum,
      girisHarfi: soruGirisHarfi([sozcuk, ...metinler]),
      yonerge: yonergeKlibi(ayar.model ? 't05-model' : 't05'),
      soruKlipleri: [],
      uyaran: ayar.model ? { tur: 'yazi', metin: sozcuk } : { tur: 'yok' },
      geriBildirim: [geriBildirimKlibi('dogru'), sozcukKlibi(sozcuk)],
      hedefMetin: sozcuk,
      sozcukler: [sozcuk],
      kartlar,
      dogruDizi: heceler,
    };
  }
  throw new TurUretimHatasi('Bu harf kümesiyle "Heceleri birleştir" için tek doğrulu soru kurulamadı.');
}
