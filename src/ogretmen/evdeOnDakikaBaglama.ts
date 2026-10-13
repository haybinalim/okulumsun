/**
 * EVDE 10 DAKİKA — veri bağlama (plan v2 Adım 43 aşama 2, KG-62).
 *
 * Saf `evdeOnDakikaSeti`'ne yıllık planı ve ev ipuçlarını bağlar. Yalnız Veli Paneli'ndeki
 * "Evde 10 dakika başlat" düğmesinden DİNAMİK içe aktarılır (kazanimlar.json ana pakete girmesin).
 * Saat okumaz: "bugün" ve tohum çağıran UI'dan gelir. Hiçbir şey saklanmaz.
 */
import { temaIpucu } from '../content/evIpuclari';
import type { EvIpucu } from '../content/schema/evIpucu';
import { skillsData } from '../content/skillsData';
import { REGISTRY } from '../exercises/registry';
import { setlenebilirDugumler, type GunlukSet } from './gunlukSet';
import { buHafta, type PlanHaftasi } from './haftalikPlan';
import { evdeOnDakikaSeti } from './evdeOnDakika';
import { YILLIK_PLAN } from './yillikPlan';

export interface EvdeOnDakika {
  readonly set: GunlukSet;
  readonly tema: number;
  readonly ipucu: EvIpucu;
}

/**
 * Bu haftanın ev seti ve ipucu. Tatil/yıl dışı ya da oynatılabilir düğüm yoksa `null`.
 * Plan düğümleri önce kayıtlı şablonu olan HAZIR düğümlere süzülür (set her soruyu üretebilsin).
 */
export function buHaftaninEvdeOnDakikasi(
  bugun: string,
  tohum: number,
  plan: readonly PlanHaftasi[] = YILLIK_PLAN,
): EvdeOnDakika | null {
  const uygun = setlenebilirDugumler((t) => REGISTRY.has(t));
  const suzulmus = plan.map((p) => ({ ...p, dugumler: p.dugumler.filter((d) => uygun.has(d)) }));
  const set = evdeOnDakikaSeti(suzulmus, bugun, tohum);
  if (!set) return null;
  const tema = buHafta(suzulmus, bugun)?.temaNo ?? skillsData.find((d) => d.id === set.dugumler[0])?.tema ?? null;
  const ipucu = tema == null ? null : temaIpucu(tema);
  return ipucu && tema != null ? { set, tema, ipucu } : null;
}
