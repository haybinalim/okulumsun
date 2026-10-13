/**
 * 2026–2027 YILLIK PLANI — veri bağlama (plan v2 Adım 37 aşama 2, KG-50).
 *
 * Saf `haftalikPlanUret`'e uygulamanın içerik dosyalarını (kazanimlar.json, planDuzeltmeleri.json, skillsData)
 * bağlar. Bu modül yalnız `HaftalikPlan` ekranı ve `SetHazirla` önerisi tarafından DİNAMİK içe aktarılır
 * (kazanimlar.json ana pakete girmesin). Saat okumaz: "bugün" çağıran UI'dan `YYYY-MM-DD` olarak gelir.
 */
import kazanimlarHam from '../content/kazanimlar.json';
import duzeltmelerHam from '../content/planDuzeltmeleri.json';
import { kazanimlariDogrula } from '../content/schema/kazanim';
import { PlanDuzeltmeleriSchema } from '../content/schema/haftalikPlan';
import { OGRETIM_HAFTALARI, OKUL_YILI } from '../content/okulTakvimi';
import { skillsData } from '../content/skillsData';
import { TEMALAR } from '../store/appStore';
import type { SkillId } from '../exercises/types';
import { buHafta, haftaSetDugumleri, haftalikPlanUret, varsayilanHaftaIndeksi, type PlanHaftasi } from './haftalikPlan';
import type { DisaAktarEtiketleri } from './planDisaAktar';
import { SET_EN_FAZLA_DUGUM } from './gunlukSet';

export const YILLIK_PLAN: readonly PlanHaftasi[] = haftalikPlanUret(
  kazanimlariDogrula(kazanimlarHam),
  OGRETIM_HAFTALARI,
  skillsData,
  PlanDuzeltmeleriSchema.parse(duzeltmelerHam),
);

export const PLAN_ETIKETLERI: DisaAktarEtiketleri = {
  tema: (no) => TEMALAR.find((t) => t.no === no)?.ad ?? `Tema ${no}`,
  dugum: (id) => skillsData.find((d) => d.id === id)?.childLabel ?? id,
};

export const PLAN_BASLIGI = `1. sınıf matematik haftalık plan ${OKUL_YILI}`;
export const PLAN_DOSYA_ADI = `okulumsun-haftalik-plan-${OKUL_YILI}`;

export { varsayilanHaftaIndeksi };

export interface HaftaOnerisi {
  readonly hafta: PlanHaftasi;
  readonly dugumler: readonly SkillId[];
  readonly kirpildi: boolean;
}

/** `SetHazirla` için bu haftanın önerisi; tatil/yıl dışı veya setlenebilir düğüm yoksa `null`. */
export function buHaftaninOnerisi(bugun: string, uygun: ReadonlySet<SkillId>): HaftaOnerisi | null {
  const p = buHafta(YILLIK_PLAN, bugun);
  if (!p) return null;
  const { dugumler, kirpildi } = haftaSetDugumleri(p, uygun, SET_EN_FAZLA_DUGUM);
  return dugumler.length === 0 ? null : { hafta: p, dugumler, kirpildi };
}
