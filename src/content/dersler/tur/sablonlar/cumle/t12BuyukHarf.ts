/**
 * T-12 — BÜYÜK HARF YERİNDE Mİ (T.Y.1.3.d, T.Y.1.3.ı; plan §2.4.6, Adım 74). SAF, deterministik. Dokun-seç.
 *
 * Aynı cümlenin 2–3 yazılışı kart olarak verilir; çocuk büyük harfi doğru yerde olanı (cümle başı ve özel ad, K-OY-11,
 * D-10) seçer. Yanlış yazılışlar: cümle başı küçük; özel ad küçük; cümle içinde (özel ad olmayan) bir sözcük büyük
 * harfle — bu son tür yalnız o harfin BÜYÜĞÜ öğretilmişse (kartta öğretilmemiş glif yok, D-23). Okuma hedeflidir
 * (D-12): soru sesi yok, kartlar sessiz; doğru cevaptan sonra doğru yazılış üstte ve cümle klibi.
 *
 * Zorluk: z1 2 kart, en çok 3 sözcük, yanlışı cümle başı küçük · z2 2 kart, yanlışı cümle içinde büyük harf ·
 * z3 2 kart, özel adlı cümle öncelikli (yanlışı özel ad küçük) · z4 3 kart (cümle başı + bir başka yanlış) ·
 * z5 3 kart, özel adlı cümle öncelikli, iki ayrı yanlış türü. 3 kartta cümle en çok 15 karakter (1080×810 tahtada iki sütun parmak boyunda sığar; 20 karakterde taşıyordu).
 */
import { createRng } from '../../../../../exercises/rng';
import { trBuyuk, trKucuk } from '../../alfabe';
import { kumeKodla } from '../../ogretilenKume';
import { cumleKlibi, geriBildirimKlibi, yonergeKlibi } from '../klipler';
import { kartlariKaristir } from '../ortak';
import { turItemId, TurUretimHatasi, type TurHavuzCumlesi, type TurSecimSorusu, type TurUretimGirdisi } from '../turSoru';
import { okunabilirCumleler } from './cumleHavuzu';
import { cumleGirisHarfi } from './ortakCumle';

type Yanlis = 'basKucuk' | 'ozelKucuk' | 'icBuyuk';

const AYAR: Readonly<Record<1 | 2 | 3 | 4 | 5, { kart: 2 | 3; max: number; tercih: readonly Yanlis[]; ozelOnce: boolean }>> = {
  1: { kart: 2, max: 3, tercih: ['basKucuk'], ozelOnce: false },
  2: { kart: 2, max: 4, tercih: ['icBuyuk', 'basKucuk'], ozelOnce: false },
  3: { kart: 2, max: 5, tercih: ['ozelKucuk', 'icBuyuk', 'basKucuk'], ozelOnce: true },
  4: { kart: 3, max: 5, tercih: ['basKucuk', 'icBuyuk', 'ozelKucuk'], ozelOnce: false },
  5: { kart: 3, max: 5, tercih: ['ozelKucuk', 'icBuyuk', 'basKucuk'], ozelOnce: true },
};

/** 3 kartlı soruda cümle en çok bu kadar karakter (tahta 1080×810'da üç cümle kartı sığsın). */
export const T12_UC_KART_EN_COK = 15;

const harfMi = (c: string) => trKucuk(c) !== trBuyuk(c);

/** Sözcüklerin metindeki başlangıç indeksleri. */
function sozcukBaslari(metin: string): number[] {
  const b: number[] = [];
  for (let i = 0; i < metin.length; i++) if (harfMi(metin[i]) && (i === 0 || metin[i - 1] === ' ')) b.push(i);
  return b;
}

const degistir = (metin: string, i: number, c: string) => metin.slice(0, i) + c + metin.slice(i + 1);

/** Cümlenin yanlış yazılışları, türüne göre (öğretilen kümedeki gliflerle). */
export function yanlisYazilislar(c: TurHavuzCumlesi, kume: ReadonlySet<string>): Readonly<Record<Yanlis, string[]>> {
  const baslar = sozcukBaslari(c.metin);
  const ozelBaslar = new Set<number>();
  for (const o of c.ozelAdlar)
    for (const i of baslar) if (c.metin.startsWith(o, i) && !harfMi(c.metin[i + o.length] ?? ' ')) ozelBaslar.add(i);
  const basKucuk = [degistir(c.metin, 0, trKucuk(c.metin[0]))];
  const ozelKucuk = [...ozelBaslar].filter((i) => i > 0).map((i) => degistir(c.metin, i, trKucuk(c.metin[i])));
  const icBuyuk = baslar
    .filter((i) => i > 0 && !ozelBaslar.has(i) && kume.has(trBuyuk(c.metin[i])))
    .map((i) => degistir(c.metin, i, trBuyuk(c.metin[i])));
  return { basKucuk, ozelKucuk, icBuyuk };
}

export function uretT12(g: TurUretimGirdisi): TurSecimSorusu {
  const ayar = AYAR[g.zorluk];
  const rng = createRng(g.tohum).fork(`T-12|${g.zorluk}`);
  const uygun = okunabilirCumleler(g.cumleler ?? [], g.kume).filter(
    (c) => c.metin.split(' ').length <= ayar.max && (ayar.kart === 2 || [...c.metin].length <= T12_UC_KART_EN_COK),
  );
  const kurulur = uygun.filter((c) => {
    const y = yanlisYazilislar(c, g.kume);
    return new Set(Object.values(y).flat()).size >= ayar.kart - 1;
  });
  if (kurulur.length === 0)
    throw new TurUretimHatasi('Bu harf kümesiyle "Büyük harf yerinde mi" kurulamıyor: okunabilir cümle yok (cümleler 2. gruptan).');
  const ozelli = kurulur.filter((c) => yanlisYazilislar(c, g.kume).ozelKucuk.length > 0);
  const liste = ayar.ozelOnce && ozelli.length > 0 && rng.int(0, 2) > 0 ? ozelli : kurulur;
  const c = rng.pick(liste);
  const y = yanlisYazilislar(c, g.kume);
  // Tercih sırasıyla, her türden en çok bir yanlış; yetmezse kalanlardan.
  const secilen: string[] = [];
  for (const t of ayar.tercih) if (secilen.length < ayar.kart - 1 && y[t].length > 0) secilen.push(rng.pick(y[t]));
  for (const v of rng.shuffle([...new Set(Object.values(y).flat())]))
    if (secilen.length < ayar.kart - 1 && !secilen.includes(v)) secilen.push(v);
  const kartlar = kartlariKaristir(rng, [
    { metin: c.metin, tur: 'cumle' as const },
    ...secilen.map((m) => ({ metin: m, tur: 'cumle' as const })),
  ]);
  return {
    kind: 'secim',
    itemId: turItemId('T-12', g.zorluk, g.tohum, kumeKodla(g.kume)),
    sablon: 'T-12',
    zorluk: g.zorluk,
    tohum: g.tohum,
    girisHarfi: cumleGirisHarfi(c, kartlar.map((k) => k.metin)),
    yonerge: yonergeKlibi(c.ozelAdlar.length > 0 ? 't12-ozel' : 't12'),
    soruKlipleri: [],
    uyaran: { tur: 'yok' },
    geriBildirim: [geriBildirimKlibi('dogru'), cumleKlibi(c.id)],
    hedefMetin: c.metin,
    sozcukler: kartlar.map((k) => k.metin),
    kartlar,
    dogru: kartlar.findIndex((k) => k.metin === c.metin),
  };
}
