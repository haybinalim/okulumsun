/**
 * KÂĞIT PLANI — SAF (plan v2 Adım 35, KG-44). Aynı istek (`set` + madde sayısı + düzen + yanıt tercihi) her çalıştırmada
 * birebir aynı planı verir: soru akışı `setSorusu`/`setSorusuUret` (Adım 34), cevap `validation` alanından.
 * Kâğıt saklanmaz; koddan yeniden üretilir.
 */
import type { SpeakSource } from '../../audio/speech';
import { REGISTRY } from '../../exercises/registry';
import type { SkillId } from '../../exercises/types';
import { skillsData } from '../../content/skillsData';
import { setCoz, setKodla, setSorusu, type GunlukSet } from '../gunlukSet';
import { setSorusuUret } from '../tahtaSorusu';
import { cevapSatiriYap, type CevapSatiri } from './cevapAnahtari';
import { kagitMaddesiYap, type KagitMaddesi } from './kagitMaddesi';
import { maddeKaplama, sayfalaraDagit } from './kagitYerlesimi';
import { sesMetni } from './sesMetni';
import { kagitSozlugu } from './kagitYonergesi';
import { yazdirmaSinifi } from './yazdirmaUygunlugu';

export type KagitDuzeni = '2x3' | '1x4';
export type MaddeSayisi = 4 | 6 | 8 | 12;
export type YanitTercihi = 'daireIcineAl' | 'yazmaliOlabilir';

export const MADDE_SAYILARI: readonly MaddeSayisi[] = [4, 6, 8, 12];
export const KAGIT_DUZENLERI: readonly KagitDuzeni[] = ['2x3', '1x4'];

export interface KagitIstegi {
  readonly set: GunlukSet;
  readonly maddeSayisi: MaddeSayisi;
  readonly duzen: KagitDuzeni;
  readonly yanitTercihi: YanitTercihi;
}

export interface KagitPlani {
  /** `OK-<setKodu>-<maddeSayisi>-<düzen>-<d|y>`; örn. `OK-1.a1b7.k3f9q-6-2x3-d`. */
  readonly kod: string;
  readonly sayfalar: readonly (readonly KagitMaddesi[])[];
  readonly cevapAnahtari: readonly CevapSatiri[];
  readonly kazanimOzeti: readonly string[];
  /** İstenenden az madde üretilebildiyse eksik sayı (ör. seçilen konuların tüm şablonları kâğıda uygun değil). */
  readonly eksik: number;
}

const YANIT_HARFI: Readonly<Record<YanitTercihi, 'd' | 'y'>> = { daireIcineAl: 'd', yazmaliOlabilir: 'y' };

function sablonKagidaGirer(templateId: string, tercih: YanitTercihi): boolean {
  const s = yazdirmaSinifi(templateId);
  return s === 'uygun' || (s === 'uyarlanir' && tercih === 'yazmaliOlabilir');
}

export function kagitKodu(istek: KagitIstegi): string {
  return `OK-${setKodla(istek.set)}-${istek.maddeSayisi}-${istek.duzen}-${YANIT_HARFI[istek.yanitTercihi]}`;
}

/** `kagitKodu` çıktısını çözer; geçersizse `null`. */
export function kagitKoduCoz(kod: string, gecerli: ReadonlySet<SkillId>): KagitIstegi | null {
  const e = /^OK-([a-z0-9.]+)-(4|6|8|12)-(2x3|1x4)-(d|y)$/.exec(kod.trim());
  if (!e) return null;
  const set = setCoz(e[1], gecerli);
  if (!set) return null;
  return {
    set,
    maddeSayisi: Number(e[2]) as MaddeSayisi,
    duzen: e[3] as KagitDuzeni,
    yanitTercihi: e[4] === 'd' ? 'daireIcineAl' : 'yazmaliOlabilir',
  };
}

/** Verilen tercihle kâğıda hiç soru veremeyecek düğümler (arayüz uyarısı için). */
export function kagitaGirmeyenDugumler(
  set: GunlukSet,
  tercih: YanitTercihi,
  kayitli: (t: string) => boolean = (t) => REGISTRY.has(t),
): readonly SkillId[] {
  return set.dugumler.filter((id) => {
    const dugum = skillsData.find((d) => d.id === id);
    return !(dugum?.exerciseTemplates ?? []).some((t) => kayitli(t) && sablonKagidaGirer(t, tercih));
  });
}

/** Her madde için en çok bu kadar soru ilerlenir (uygun olmayanlar atlanır); sonsuz döngü koruması. */
const ILERLEME_SINIRI = 40;

export function kagitPlaniUret(
  istek: KagitIstegi,
  tr: Readonly<Record<string, string>>,
  kayitli: (t: string) => boolean = (t) => REGISTRY.has(t),
): KagitPlani {
  // Kâğıt yönergesi kâğıda özgü metin kaynağından (KG-99): ekran fiilleri ('dokun', 'dinle') yok.
  const kagitTr = kagitSozlugu(tr);
  const metin = (s: SpeakSource): string => sesMetni(s, kagitTr);
  const maddeler: KagitMaddesi[] = [];
  const gorulen = new Set<string>();
  const sinir = istek.maddeSayisi * ILERLEME_SINIRI;
  for (let sira = 0; sira < sinir && maddeler.length < istek.maddeSayisi; sira++) {
    const soru = setSorusu(istek.set, sira, kayitli);
    if (!sablonKagidaGirer(soru.templateId, istek.yanitTercihi)) continue;
    const ex = setSorusuUret(soru);
    if (gorulen.has(ex.itemId)) continue;
    const madde = kagitMaddesiYap(ex, maddeler.length + 1, metin);
    if (!madde || maddeKaplama(madde, istek.duzen) === null) continue;
    gorulen.add(ex.itemId);
    maddeler.push(madde);
  }

  const sayfalar = sayfalaraDagit(maddeler, istek.duzen);

  return {
    kod: kagitKodu(istek),
    sayfalar,
    cevapAnahtari: maddeler.map(cevapSatiriYap),
    kazanimOzeti: [...new Set(maddeler.flatMap((m) => m.kazanimKodlari))].sort(),
    eksik: istek.maddeSayisi - maddeler.length,
  };
}
