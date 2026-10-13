/**
 * EVDE 10 DAKİKA — SAF (plan v2 Adım 43).
 *
 * Bu haftanın düğümleri + bir önceki haftadan 1 hatırlama düğümü ile en çok 4 düğümlü bir set.
 * Saat ve rastgelelik yok; "bugün" ve tohum parametredir.
 */
import type { SkillId } from '../exercises/types';
import { SET_EN_FAZLA_DUGUM, SET_SURUMU, type GunlukSet } from './gunlukSet';
import { buHafta, type PlanHaftasi } from './haftalikPlan';
import { createRng } from '../exercises/rng';

export function evdeOnDakikaSeti(plan: readonly PlanHaftasi[], bugun: string, tohum: number): GunlukSet | null {
  const bu = buHafta(plan, bugun);
  if (!bu || bu.dugumler.length === 0) return null;
  const i = plan.indexOf(bu);
  let onceki: SkillId | null = null;
  for (let j = i - 1; j >= 0 && onceki === null; j--) {
    const aday = plan[j].dugumler.filter((d) => !bu.dugumler.includes(d));
    if (aday.length > 0) onceki = aday[createRng(tohum >>> 0).int(0, aday.length - 1)];
  }
  const buDugumler = bu.dugumler.slice(0, onceki ? SET_EN_FAZLA_DUGUM - 1 : SET_EN_FAZLA_DUGUM);
  const dugumler = onceki ? [...buDugumler, onceki] : buDugumler;
  return { surum: SET_SURUMU, dugumler, tohum: tohum >>> 0 };
}
