import { describe, expect, it } from 'vitest';
import { skillsData } from '../../src/content/skillsData';
import { REGISTRY } from '../../src/exercises/registry';
import type { SkillId } from '../../src/exercises/types';
import {
  oturumDuzenuSec,
  secilenSoruyuUret,
} from '../../src/progress/oturumRuntime';
import type { SecilenSoru } from '../../src/progress/scheduler';

const URETILEBILIR_DUGUM = skillsData.find((dugum) =>
  dugum.durum === 'hazir' && dugum.exerciseTemplates.some((id) => REGISTRY.has(id)),
);

if (!URETILEBILIR_DUGUM) {
  throw new Error('Test için üretilebilir beceri düğümü bulunamadı.');
}

const TEMPLATE_ID = URETILEBILIR_DUGUM.exerciseTemplates.find((id) => REGISTRY.has(id));
if (!TEMPLATE_ID) {
  throw new Error('Test için kayıt defterinde bulunan şablon seçilemedi.');
}

describe('oturum çalışma zamanı köprüsü', () => {
  it('tema içinde giriş düğümü varsa yalnız o temanın hazır düğümlerini kullanır', () => {
    const digerTemaDugumu = {
      ...URETILEBILIR_DUGUM,
      id: 'mat.test.diger-tema' as SkillId,
      tema: URETILEBILIR_DUGUM.tema === 7 ? 6 : 7,
      isEntryPoint: false,
    };

    const sonuc = oturumDuzenuSec([URETILEBILIR_DUGUM, digerTemaDugumu], URETILEBILIR_DUGUM.tema);

    expect(sonuc).toEqual([URETILEBILIR_DUGUM]);
  });

  it('planlayıcının seçtiği soruyu doğru kayıt defteri jeneratörüyle üretir', () => {
    const secilen: SecilenSoru = {
      skillId: URETILEBILIR_DUGUM.id,
      templateId: TEMPLATE_ID,
      seed: 20260812,
      kova: 'frontier',
    };

    const exercise = secilenSoruyuUret(secilen, [URETILEBILIR_DUGUM], 'kisisel');

    expect(exercise.templateId).toBe(TEMPLATE_ID);
    expect(exercise.skillIds).toContain(URETILEBILIR_DUGUM.id);
    expect(exercise.itemId).toContain(TEMPLATE_ID);
  });

  it('her kayıtlı şablonu onu ölçen hazır bir beceri için gerçek soruya dönüştürür', () => {
    const eksikEslesmeler: string[] = [];

    for (const [templateId] of REGISTRY) {
      const dugum = skillsData.find((aday) =>
        aday.durum === 'hazir' && aday.exerciseTemplates.includes(templateId),
      );
      if (!dugum) {
        eksikEslesmeler.push(templateId);
        continue;
      }

      const exercise = secilenSoruyuUret(
        {
          skillId: dugum.id,
          templateId,
          seed: 20260812 + eksikEslesmeler.length + templateId.length,
          kova: 'frontier',
        },
        skillsData,
        'kisisel',
      );

      expect(exercise.templateId).toBe(templateId);
      expect(exercise.skillIds).toContain(dugum.id);
    }

    expect(eksikEslesmeler).toEqual([]);
  });
});
