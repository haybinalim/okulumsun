/**
 * ISINMA KEŞFİ (seviye tespiti) — PLAN §6.5 "Isınma Keşfi (isteğe bağlı)", ADR-0007 Kabul (Seçenek 2).
 *
 * SAF VE SENKRONDUR: `Date.now()`, `Math.random()`, IndexedDB, tarayıcı deposu YOK; persistence
 * katmanı içe aktarılmaz. Sonuç yalnız çağıranın belleğinde, o oturumun başlangıç noktasını
 * belirlemek için yaşar ve hiçbir depoya yazılmaz (ADR-0002 B'de bile).
 *
 * Kural (ADR-0007): varsayılan kapalı; en çok 8 madde; en kolay işaretten başlar; ilk denemede
 * doğruda 2 işaret yukarı, yanlışta 1 işaret aşağı; ardışık 2 yanlışta biter. Puan/skor üretilmez.
 */

import type { SkillNode } from '../content/schema/skill';
import { acilanTemalar } from '../content/okulAyi';
import { REGISTRY } from '../exercises/registry';
import { createRng, hash32 } from '../exercises/rng';
import type { Difficulty, SkillId, TemplateId } from '../exercises/types';
import type { MaddeSonuc } from './itemLifecycle';
import type { SecilenSoru } from './scheduler';

// ---------------------------------------------------------------- sabitler (PLAN §17)

/** Isınmanın en çok madde sayısı. */
export const ISINMA_EN_FAZLA_MADDE = 8;
/** İlk denemede doğru cevapta yukarı çıkılan işaret sayısı. */
export const ISINMA_YUKARI_ADIM = 2;
/** Yanlış cevapta aşağı inilen işaret sayısı. */
export const ISINMA_ASAGI_ADIM = 1;
/** Bu kadar ardışık yanlışta ısınma biter. */
export const ISINMA_ARDISIK_YANLIS_SINIRI = 2;
/**
 * İşaret dizisinin en çok uzunluğu: hep doğru cevaplayan çocuk 8. maddede tepe işaretine varır
 * (1 + 7 × 2 = 15).
 */
export const ISINMA_ISARET_SAYISI = 1 + (ISINMA_EN_FAZLA_MADDE - 1) * ISINMA_YUKARI_ADIM;

// ---------------------------------------------------------------- tipler

export interface IsinmaDurumu {
  /** Kolaydan zora, ön koşul sırasına uygun işaret düğümleri. */
  readonly isaretler: readonly SkillId[];
  /** Sıradaki maddenin işaret indeksi. */
  readonly konum: number;
  /** İlk denemede doğru cevaplanan işaretler. */
  readonly gecilen: ReadonlySet<SkillId>;
  readonly maddeSayisi: number;
  readonly ardisikYanlis: number;
  readonly bitti: boolean;
}

export interface SeviyeTahmini {
  /** Bu oturum boyunca ön koşulu karşılanmış sayılan düğümler (yalnız bellek). */
  readonly oturumIciAcikDugumler: ReadonlySet<SkillId>;
  /** Planlayıcının ilk hedef zorluğu (yeterli cevap birikene dek). */
  readonly hedefZorlukBaslangici: Difficulty;
}

// ---------------------------------------------------------------- yardımcılar

function oynanabilirMi(d: SkillNode): boolean {
  return d.durum === 'hazir' && d.exerciseTemplates.some((t) => REGISTRY.has(t));
}

function sertOnKosullar(d: SkillNode): readonly SkillId[] {
  return d.prerequisites.filter((p) => p.type === 'hard').map((p) => p.id);
}

/**
 * Ön koşul sırasına uygun, kolaydan zora dizilim (öncelikli Kahn): her adımda ön koşulları
 * dizilmiş düğümler arasından en düşük zorluk, sonra tema, sonra özgün sıra seçilir.
 */
function onKosulSirasi(dugumler: readonly SkillNode[]): readonly SkillNode[] {
  const kume = new Set(dugumler.map((d) => d.id));
  const sira = new Map(dugumler.map((d, i) => [d.id, i]));
  const dizilen = new Set<SkillId>();
  const sonuc: SkillNode[] = [];
  const kalan = [...dugumler];
  while (kalan.length > 0) {
    const hazir = kalan.filter((d) => sertOnKosullar(d).every((p) => !kume.has(p) || dizilen.has(p)));
    // Döngü içerik doğrulamasında yasak; yine de sonsuz döngüye girmemek için kalanların hepsi aday olur.
    const adaylar = hazir.length > 0 ? hazir : kalan;
    adaylar.sort((a, b) => a.difficulty - b.difficulty || a.tema - b.tema || sira.get(a.id)! - sira.get(b.id)!);
    const secilen = adaylar[0]!;
    sonuc.push(secilen);
    dizilen.add(secilen.id);
    kalan.splice(kalan.indexOf(secilen), 1);
  }
  return sonuc;
}

/** Diziden ilk ve son dahil eşit aralıklı en çok `n` öğe. */
function esitAralikliOrnek<T>(dizi: readonly T[], n: number): readonly T[] {
  if (dizi.length <= n) return dizi;
  const sonuc: T[] = [];
  for (let i = 0; i < n; i++) sonuc.push(dizi[Math.round((i * (dizi.length - 1)) / (n - 1))]!);
  return sonuc;
}

// ---------------------------------------------------------------- API

/**
 * Isınma işaretleri: okul ayının açtığı temalardaki oynanabilir düğümler (yoksa verilen düzenin
 * tamamı), ön koşul sırasına dizilip en çok `ISINMA_ISARET_SAYISI` işarete eşit aralıkla örneklenir.
 */
export function isinmaIsaretleri(dugumler: readonly SkillNode[], okulAyiIndex: number): readonly SkillId[] {
  const oynanabilir = dugumler.filter(oynanabilirMi);
  const temalar = acilanTemalar(okulAyiIndex);
  const temada = oynanabilir.filter((d) => temalar.includes(d.tema));
  const havuz = temada.length > 0 ? temada : oynanabilir;
  return esitAralikliOrnek(onKosulSirasi(havuz), ISINMA_ISARET_SAYISI).map((d) => d.id);
}

export function isinmaBaslat(dugumler: readonly SkillNode[], okulAyiIndex: number): IsinmaDurumu {
  const isaretler = isinmaIsaretleri(dugumler, okulAyiIndex);
  return { isaretler, konum: 0, gecilen: new Set(), maddeSayisi: 0, ardisikYanlis: 0, bitti: isaretler.length === 0 };
}

export function isinmaSonrakiDugum(d: IsinmaDurumu): SkillId {
  const id = d.isaretler[d.konum];
  if (d.bitti || id === undefined) throw new Error('isinmaSonrakiDugum: ısınma bitti.');
  return id;
}

/**
 * Sıradaki ısınma maddesinin seçimi (şablon + tohum). Tohum çağıranın verdiği ısınma tohumundan
 * ve madde sırasından türetilir; saat okunmaz.
 */
export function isinmaMaddesi(d: IsinmaDurumu, dugumler: readonly SkillNode[], isinmaTohumu: number): SecilenSoru {
  const skillId = isinmaSonrakiDugum(d);
  const dugum = dugumler.find((x) => x.id === skillId);
  if (!dugum) throw new Error(`isinmaMaddesi: ${skillId} düğümü bulunamadı.`);
  const sablonlar = dugum.exerciseTemplates.filter((t) => REGISTRY.has(t)) as TemplateId[];
  const templateId = createRng(hash32(`${isinmaTohumu}:isinma-sablon:${d.maddeSayisi}`)).pick(sablonlar);
  const seed = hash32(`${isinmaTohumu}|isinma|${skillId}|${templateId}|${d.maddeSayisi}`);
  return { skillId, templateId, seed, kova: 'warmup' };
}

/**
 * Bir ısınma maddesinin sonucunu işler. `sonuc.dogru` İLK DENEMENİN doğruluğu olmalıdır
 * (bağlama katmanı yanlış denemeden sonra gelen doğruyu yanlış sayar).
 */
export function isinmaIlerlet(d: IsinmaDurumu, sonuc: MaddeSonuc): IsinmaDurumu {
  if (d.bitti) return d;
  const maddeSayisi = d.maddeSayisi + 1;
  const sonIndeks = d.isaretler.length - 1;
  if (sonuc.dogru) {
    const gecilen = new Set(d.gecilen);
    gecilen.add(d.isaretler[d.konum]!);
    const tepedeydi = d.konum >= sonIndeks;
    return {
      ...d,
      gecilen,
      konum: Math.min(d.konum + ISINMA_YUKARI_ADIM, sonIndeks),
      maddeSayisi,
      ardisikYanlis: 0,
      bitti: tepedeydi || maddeSayisi >= ISINMA_EN_FAZLA_MADDE,
    };
  }
  const ardisikYanlis = d.ardisikYanlis + 1;
  return {
    ...d,
    konum: Math.max(0, d.konum - ISINMA_ASAGI_ADIM),
    maddeSayisi,
    ardisikYanlis,
    bitti: ardisikYanlis >= ISINMA_ARDISIK_YANLIS_SINIRI || maddeSayisi >= ISINMA_EN_FAZLA_MADDE,
  };
}

/**
 * Oturum içi seviye tahmini: geçilen işaretler ve onların bütün sert ön koşulları "bilinir" sayılır;
 * bunlar ve sert ön koşullarının hepsi bilinen düğümler oturum içinde açık olur. Başlangıç hedef
 * zorluğu ısınmanın vardığı işaretin zorluğudur (hiç doğru yoksa en kolay işaret).
 */
export function seviyeTahmini(d: IsinmaDurumu, dugumler: readonly SkillNode[]): SeviyeTahmini {
  const harita = new Map(dugumler.map((x) => [x.id, x]));
  const bilinen = new Set<SkillId>();
  const yigin = [...d.gecilen];
  while (yigin.length > 0) {
    const id = yigin.pop()!;
    if (bilinen.has(id)) continue;
    bilinen.add(id);
    const dugum = harita.get(id);
    if (dugum) yigin.push(...sertOnKosullar(dugum));
  }
  const acik = new Set(bilinen);
  if (bilinen.size > 0) {
    for (const x of dugumler) {
      const sert = sertOnKosullar(x);
      if (oynanabilirMi(x) && sert.length > 0 && sert.every((p) => bilinen.has(p))) acik.add(x.id);
    }
  }
  const varilan = d.isaretler[Math.min(d.konum, Math.max(0, d.isaretler.length - 1))];
  const hedefZorlukBaslangici = (varilan ? harita.get(varilan)?.difficulty : undefined) ?? 1;
  return { oturumIciAcikDugumler: acik, hedefZorlukBaslangici };
}
