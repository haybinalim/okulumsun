/** Plan v2 Adım 43: Evde 10 dakika seti (SAF). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { kazanimlariDogrula } from '../../src/content/schema/kazanim';
import { PlanDuzeltmeleriSchema } from '../../src/content/schema/haftalikPlan';
import { OGRETIM_HAFTALARI } from '../../src/content/okulTakvimi';
import { skillsData } from '../../src/content/skillsData';
import { haftalikPlanUret, buHafta } from '../../src/ogretmen/haftalikPlan';
import { evdeOnDakikaSeti } from '../../src/ogretmen/evdeOnDakika';
import { setKodla } from '../../src/ogretmen/gunlukSet';

const oku = (rel: string): unknown => JSON.parse(readFileSync(path.resolve(__dirname, '../..', rel), 'utf8'));
const plan = haftalikPlanUret(
  kazanimlariDogrula(oku('src/content/kazanimlar.json')),
  OGRETIM_HAFTALARI,
  skillsData,
  PlanDuzeltmeleriSchema.parse(oku('src/content/planDuzeltmeleri.json')),
);

describe('evdeOnDakikaSeti', () => {
  it('ders yılı dışında null', () => {
    expect(evdeOnDakikaSeti(plan, '2026-07-01', 1)).toBeNull();
    expect(evdeOnDakikaSeti(plan, 'bozuk', 1)).toBeNull();
  });
  it('ilk haftada hatırlama yok; düğümler bu haftanındır', () => {
    const s = evdeOnDakikaSeti(plan, '2026-09-15', 7);
    expect(s).not.toBeNull();
    const bu = buHafta(plan, '2026-09-15')!;
    expect(s!.dugumler.every((d) => bu.dugumler.includes(d))).toBe(true);
  });
  it('sonraki haftalarda geçerli set kodu üretir, 1–4 düğüm, yinelenmez, deterministik', () => {
    for (const h of OGRETIM_HAFTALARI) {
      const s = evdeOnDakikaSeti(plan, h.pazartesi, 12345);
      if (!s) continue;
      expect(s.dugumler.length).toBeGreaterThanOrEqual(1);
      expect(s.dugumler.length).toBeLessThanOrEqual(4);
      expect(new Set(s.dugumler).size).toBe(s.dugumler.length);
      expect(() => setKodla(s)).not.toThrow();
      expect(evdeOnDakikaSeti(plan, h.pazartesi, 12345)).toEqual(s);
    }
  });
  it('bir önceki haftadan en çok 1 hatırlama düğümü içerir', () => {
    const i = plan.findIndex((p, k) => k > 3 && p.dugumler.length > 0);
    const bu = plan[i];
    const s = evdeOnDakikaSeti(plan, bu.hafta.pazartesi, 9)!;
    expect(s.dugumler.filter((d) => !bu.dugumler.includes(d)).length).toBeLessThanOrEqual(1);
  });
});
