/**
 * Türkçe hece ayırıcı (Okuma Yazma planı Adım 62; `docs/mufredat-kisitlari-turkce.md` §6). SAF.
 *
 * Kural: her hecede tam bir ünlü vardır. İki ünlü arasında ünsüz yoksa ayrılır (sa-at), tek ünsüz sonraki
 * heceye geçer (a-na), iki ya da daha çok ünsüz varsa yalnız sonuncusu sonraki heceye geçer (an-ne, Türk-çe,
 * kont-rol). Sözcük başındaki ünsüz kümesi ilk heceye, sondaki küme son heceye aittir (tren, Türk).
 * Girdi tek sözcüktür (yalnız harf; büyük/küçük korunur); boşluk, noktalama veya ünlüsüz sözcük hatadır.
 */
import { harfMi, trKucuk, unluMu } from './alfabe';

const SAPKALI = new Set(['â', 'î', 'û']);
const sozcukHarfiMi = (ch: string) => harfMi(ch) || SAPKALI.has(trKucuk(ch));

export function hecele(sozcuk: string): string[] {
  const k = [...sozcuk];
  if (k.length === 0 || !k.every(sozcukHarfiMi)) throw new Error(`Hecelenemez (yalnız harf olmalı): "${sozcuk}"`);
  const unluler = k.flatMap((c, i) => (unluMu(c) ? [i] : []));
  if (unluler.length === 0) throw new Error(`Hecelenemez (ünlü yok): "${sozcuk}"`);
  const sinirlar: number[] = [];
  for (let n = 0; n < unluler.length - 1; n++) {
    const arada = unluler[n + 1] - unluler[n] - 1;
    sinirlar.push(arada === 0 ? unluler[n + 1] : unluler[n + 1] - 1);
  }
  const heceler: string[] = [];
  let bas = 0;
  for (const s of sinirlar) {
    heceler.push(k.slice(bas, s).join(''));
    bas = s;
  }
  heceler.push(k.slice(bas).join(''));
  return heceler;
}

export type HeceTuru = 'acik' | 'kapali' | 'uc' | 'dort';

/**
 * Programın "kolaydan zora" hece türleri: açık (ünlüyle biten, en çok 2 harf: a, na), kapalı (ünsüzle biten
 * 2 harf: an, at), üç harfli (nal, alt), dört ve daha çok harfli (kent, Türk).
 */
export function heceTuru(hece: string): HeceTuru {
  const k = [...hece];
  if (k.length >= 4) return 'dort';
  if (k.length === 3) return 'uc';
  return unluMu(k[k.length - 1]) ? 'acik' : 'kapali';
}
