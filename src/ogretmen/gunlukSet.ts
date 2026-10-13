/**
 * BUGÜNÜN SETİ — SAF (plan v2 Adım 34).
 *
 * Öğretmen 1–4 hazır beceri düğümü seçer; tahta bu düğümlerden araya-girmeli, sonsuz bir soru
 * akışı üretir. Set YALNIZ bellekte yaşar (`appStore.aktifSet`); kalıcılık isteyen öğretmen
 * `setKodla` çıktısını yer imine ekler. Bu modül saftır: saat, rastgelelik ve depolama yok;
 * tohumu UI katmanı verir (`hash32(String(performance.now()) + kod)`).
 *
 * Kod biçimi: `<sürüm>.<düğüm kodları>.<tohum base36>` → `1.a1b7.k3f9q`.
 */
import { skillsData } from '../content/skillsData';
import type { SkillId } from '../exercises/types';
import { createRng, hash32 } from '../exercises/rng';
import { DUGUM_KODLARI, kodaGoreDugum } from './dugumKodlari';

export const SET_EN_FAZLA_DUGUM = 4;
export const SET_SURUMU = 1 as const;

export interface GunlukSet {
  readonly surum: typeof SET_SURUMU;
  readonly dugumler: readonly SkillId[];
  /** İşaretsiz 32 bit tam sayı. */
  readonly tohum: number;
}

export interface SetSorusu {
  readonly sira: number;
  readonly skillId: SkillId;
  readonly templateId: string;
  readonly seed: number;
}

/** Set kodu; geçersiz set (0 veya >4 düğüm, yinelenen düğüm) hata fırlatır. */
export function setKodla(set: GunlukSet): string {
  const { dugumler } = set;
  if (dugumler.length < 1 || dugumler.length > SET_EN_FAZLA_DUGUM) {
    throw new Error(`setKodla: 1–${SET_EN_FAZLA_DUGUM} düğüm gerekli (${dugumler.length} verildi).`);
  }
  if (new Set(dugumler).size !== dugumler.length) throw new Error('setKodla: düğümler yinelenemez.');
  const kodlar = dugumler.map((id) => {
    const kod = DUGUM_KODLARI[id];
    if (!kod) throw new Error(`setKodla: '${id}' için düğüm kodu yok.`);
    return kod;
  });
  return `${set.surum}.${kodlar.join('')}.${(set.tohum >>> 0).toString(36)}`;
}

/** Kodu çözer; biçim, sürüm, bilinmeyen/yinelenen düğüm veya `gecerli` dışı düğümde `null`. */
export function setCoz(kod: string, gecerli: ReadonlySet<SkillId>): GunlukSet | null {
  const parcalar = kod.trim().split('.');
  if (parcalar.length !== 3) return null;
  const [surum, dugumMetni, tohumMetni] = parcalar;
  if (surum !== String(SET_SURUMU)) return null;
  if (!/^[a-z0-9]+$/.test(dugumMetni) || dugumMetni.length % 2 !== 0) return null;
  if (!/^[a-z0-9]{1,7}$/.test(tohumMetni)) return null;
  const adet = dugumMetni.length / 2;
  if (adet < 1 || adet > SET_EN_FAZLA_DUGUM) return null;
  const dugumler: SkillId[] = [];
  for (let i = 0; i < adet; i++) {
    const id = kodaGoreDugum(dugumMetni.slice(i * 2, i * 2 + 2));
    if (!id || !gecerli.has(id) || dugumler.includes(id)) return null;
    dugumler.push(id);
  }
  const tohum = parseInt(tohumMetni, 36);
  if (!Number.isSafeInteger(tohum) || tohum > 0xffffffff) return null;
  return { surum: SET_SURUMU, dugumler, tohum };
}

/** Sete konabilecek düğümler: hazır ve en az bir şablonu kayıtlı. */
export function setlenebilirDugumler(kayitli: (t: string) => boolean): ReadonlySet<SkillId> {
  return new Set(skillsData.filter((d) => d.durum === 'hazir' && d.exerciseTemplates.some(kayitli)).map((d) => d.id));
}

/**
 * `sira`. soru (0'dan). Düğümler turlar hâlinde dağıtılır: her turda hepsi bir kez, tur sırası
 * tohumla karışır → aynı düğüm üst üste en çok 2 kez gelir. Şablon yalnız `kayitli` olanlardan seçilir.
 */
export function setSorusu(set: GunlukSet, sira: number, kayitli: (t: string) => boolean): SetSorusu {
  if (!Number.isInteger(sira) || sira < 0) throw new Error(`setSorusu: geçersiz sıra (${sira}).`);
  const n = set.dugumler.length;
  if (n < 1) throw new Error('setSorusu: boş set.');
  const tur = Math.floor(sira / n);
  const turSirasi = createRng(hash32(`set:${set.tohum}:tur:${tur}`)).shuffle([...set.dugumler]);
  const skillId = turSirasi[sira % n];
  const dugum = skillsData.find((d) => d.id === skillId);
  const sablonlar = dugum?.exerciseTemplates.filter(kayitli) ?? [];
  if (sablonlar.length === 0) throw new Error(`setSorusu: '${skillId}' için kayıtlı şablon yok.`);
  const templateId = sablonlar[hash32(`set:${set.tohum}:sablon:${sira}`) % sablonlar.length];
  const seed = hash32(`set:${set.tohum}:soru:${sira}`);
  return { sira, skillId, templateId, seed };
}
