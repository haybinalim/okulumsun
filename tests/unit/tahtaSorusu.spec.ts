import { describe, expect, it } from 'vitest';
import { skillsData } from '../../src/content/skillsData';
import { REGISTRY } from '../../src/exercises/registry';
import { createRng } from '../../src/exercises/rng';
import type { Exercise } from '../../src/exercises/types';
import { setSorusuUret, tahtaSorusuUret } from '../../src/ogretmen/tahtaSorusu';

/** Adım 34'ten ÖNCE App.tsx'te duran mantığın birebir kopyası (referans). */
function eskiYol(secilenDugumId: string | null, tahtaTohumu: number, sablon?: string): Exercise {
  const hedefDugum =
    skillsData.find((d) => d.id === secilenDugumId) ?? skillsData.find((d) => d.durum === 'hazir') ?? skillsData[0];
  const templateId = sablon ?? hedefDugum.exerciseTemplates.find((t) => REGISTRY.has(t)) ?? 'M-SAY';
  const generator = REGISTRY.get(templateId);
  if (!generator) {
    const yedek = REGISTRY.values().next().value!;
    return yedek.uret({ seed: tahtaTohumu, difficulty: hedefDugum.difficulty, mod: 'tahta' }, createRng(tahtaTohumu));
  }
  const hedefParametreleri =
    templateId === 'M-ORUNTU-SAYI'
      ? {
          yon:
            hedefDugum.id === 'mat.oruntu.artan-sayi'
              ? ('artan' as const)
              : hedefDugum.id === 'mat.oruntu.azalan-sayi'
                ? ('azalan' as const)
                : undefined,
        }
      : templateId === 'M-CIKAR-GORSEL' &&
          (hedefDugum.id === 'mat.cikarma.ayirma' || hedefDugum.id === 'mat.cikarma.geriye-sayarak')
        ? { hedefSkillId: hedefDugum.id }
        : templateId === 'M-CIKAR-SEMBOL' &&
            (hedefDugum.id === 'mat.cikarma.fark-bulma' || hedefDugum.id === 'mat.cikarma.onluk-bozmadan-20')
          ? { hedefSkillId: hedefDugum.id }
          : {};
  return generator.uret(
    { seed: tahtaTohumu, difficulty: hedefDugum.difficulty, mod: 'tahta', ...hedefParametreleri },
    createRng(tahtaTohumu),
  );
}

describe('tahtaSorusuUret', () => {
  it('her düğümde eski yolla aynı itemId (tüm şablonlar kapsanır)', () => {
    const gorulen = new Set<string>();
    for (const d of skillsData) {
      if (d.durum !== 'hazir') continue;
      for (const tohum of [7, 8, 1234]) {
        expect(tahtaSorusuUret(d.id, tohum).itemId, `${d.id} tohum=${tohum}`).toBe(eskiYol(d.id, tohum).itemId);
      }
      const t = d.exerciseTemplates.find((x) => REGISTRY.has(x));
      if (t) gorulen.add(t);
    }
    expect(gorulen.size).toBeGreaterThan(0);
  });
  it('set yolu: her (düğüm, şablon) çiftinde eski yolla aynı itemId; 39 şablonun hepsi kapsanır', () => {
    const gorulen = new Set<string>();
    for (const d of skillsData) {
      for (const t of d.exerciseTemplates.filter((x) => REGISTRY.has(x))) {
        for (const seed of [7, 99]) {
          const yeni = setSorusuUret({ sira: 0, skillId: d.id, templateId: t, seed });
          expect(yeni.itemId, `${d.id} ${t} seed=${seed}`).toBe(eskiYol(d.id, seed, t).itemId);
        }
        gorulen.add(t);
      }
    }
    expect(gorulen.size).toBe(39);
  });
  it('seçim yoksa ilk hazır konu; bilinmeyen id de aynı', () => {
    expect(tahtaSorusuUret(null, 7).itemId).toBe(eskiYol(null, 7).itemId);
    expect(tahtaSorusuUret('mat.yok.yok', 7).itemId).toBe(eskiYol('mat.yok.yok', 7).itemId);
  });
});
