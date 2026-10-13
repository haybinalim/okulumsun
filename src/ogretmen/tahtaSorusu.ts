/**
 * TAHTA SORUSU ÜRETİMİ — SAF (plan v2 Adım 34).
 *
 * `App.tsx`'te duran "düğüm → şablon → hedef parametreleri → soru" mantığı buraya taşındı;
 * davranış birebir aynıdır (tests/unit/tahtaSorusu.spec.ts eski yolu referans alıp 39 şablonda
 * aynı `itemId`'yi doğrular). Hem tek konu seçimi (`tahtaSorusuUret`) hem bugünün seti
 * (`setSorusuUret`) aynı çekirdeği kullanır.
 */
import { skillsData } from '../content/skillsData';
import type { SkillNode } from '../content/schema/skill';
import { REGISTRY } from '../exercises/registry';
import { createRng } from '../exercises/rng';
import type { Exercise } from '../exercises/types';
import type { SetSorusu } from './gunlukSet';

/** Şablona özgü hedef parametreleri (düğüm kimliğine göre). */
function hedefParametreleri(dugum: SkillNode, templateId: string): Record<string, unknown> {
  if (templateId === 'M-ORUNTU-SAYI') {
    return {
      yon:
        dugum.id === 'mat.oruntu.artan-sayi'
          ? ('artan' as const)
          : dugum.id === 'mat.oruntu.azalan-sayi'
            ? ('azalan' as const)
            : undefined,
    };
  }
  if (
    templateId === 'M-CIKAR-GORSEL' &&
    (dugum.id === 'mat.cikarma.ayirma' || dugum.id === 'mat.cikarma.geriye-sayarak')
  ) {
    return { hedefSkillId: dugum.id };
  }
  if (
    templateId === 'M-CIKAR-SEMBOL' &&
    (dugum.id === 'mat.cikarma.fark-bulma' || dugum.id === 'mat.cikarma.onluk-bozmadan-20')
  ) {
    return { hedefSkillId: dugum.id };
  }
  return {};
}

function dugumdenSoru(dugum: SkillNode, templateId: string, tohum: number): Exercise {
  const generator = REGISTRY.get(templateId);
  if (!generator) {
    const yedek = REGISTRY.values().next().value!;
    return yedek.uret({ seed: tohum, difficulty: dugum.difficulty, mod: 'tahta' }, createRng(tohum));
  }
  return generator.uret(
    { seed: tohum, difficulty: dugum.difficulty, mod: 'tahta', ...hedefParametreleri(dugum, templateId) },
    createRng(tohum),
  );
}

/** Seçilen konudan (veya seçim yoksa ilk hazır konudan) tahta sorusu. */
export function tahtaSorusuUret(dugumId: string | null, tohum: number): Exercise {
  const hedef =
    skillsData.find((d) => d.id === dugumId) ??
    skillsData.find((d) => d.durum === 'hazir') ??
    skillsData[0];
  const templateId = hedef.exerciseTemplates.find((t) => REGISTRY.has(t)) ?? 'M-SAY';
  return dugumdenSoru(hedef, templateId, tohum);
}

/** Bugünün setinden sıradaki soru. */
export function setSorusuUret(s: SetSorusu): Exercise {
  const dugum = skillsData.find((d) => d.id === s.skillId) ?? skillsData[0];
  return dugumdenSoru(dugum, s.templateId, s.seed);
}
