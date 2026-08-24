import { describe, expect, it } from 'vitest';
import type { SkillNode } from '../../src/content/schema/skill';
import type { SkillId } from '../../src/exercises/types';
import {
  ilerlemeOzetiniHesapla,
  OZET_EYLEM_SINIRI,
} from '../../src/progress/ilerlemeOzeti';
import type { MasteryRecord } from '../../src/progress/mastery';

const SIMDI = 1_800_000_000_000;

function dugum(
  id: string,
  overrides: Partial<SkillNode> = {},
): SkillNode {
  return {
    id: id as SkillId,
    mebOutcomes: ['MAT.1.1.1'],
    tema: 2,
    baslik: `Beceri ${id}`,
    childLabel: `Beceri ${id}`,
    prerequisites: [],
    difficulty: 2,
    readingLoadCeiling: 0,
    exerciseTemplates: ['say'],
    misconceptions: [],
    estimatedItemsToMastery: 8,
    durum: 'hazir',
    ...overrides,
  };
}

function kayit(
  skillId: string,
  overrides: Partial<MasteryRecord> = {},
): MasteryRecord {
  return {
    skillId: skillId as SkillId,
    strength: 0.4,
    enYuksekStrength: 0.4,
    box: 0,
    streak: 0,
    attempts: 6,
    distinctDays: 1,
    lastAnsweredAt: SIMDI - 1_000,
    son6: [false, false, true, false, false, false],
    askidaBitis: null,
    ...overrides,
  };
}

describe('ilerlemeOzetiniHesapla', () => {
  it('boş veri için nötr, puansız bir özet döndürür', () => {
    const ozet = ilerlemeOzetiniHesapla([], [], SIMDI);

    expect(ozet.destekGerektiren).toEqual([]);
    expect(ozet.hazirOlanlar).toEqual([]);
    expect(ozet.toplamCalisma).toEqual({ gun: 0, oturum: 0 });
    expect(ozet.sonCalisma).toBeNull();
  });

  it('struggling durumundaki beceriyi somut öneriyle destek listesine alır', () => {
    const ozet = ilerlemeOzetiniHesapla(
      [kayit('mat.test.zor')],
      [dugum('mat.test.zor', { baslik: 'Nesneleri sayma' })],
      SIMDI,
    );

    expect(ozet.destekGerektiren).toHaveLength(1);
    expect(ozet.destekGerektiren[0]).toMatchObject({
      skillId: 'mat.test.zor',
      baslik: 'Nesneleri sayma',
      durum: 'struggling',
    });
    expect(ozet.destekGerektiren[0]?.hataEtiketi).toContain('zorlanma');
    expect(ozet.destekGerektiren[0]?.onerilenEylem).toContain('Onluk çerçeve');
  });

  it('mastered beceriyi hazır olunacak yeni adım olarak göstermez', () => {
    const tamamlanan = kayit('mat.test.tamam', {
      strength: 0.95,
      enYuksekStrength: 0.95,
      box: 2,
      streak: 5,
      attempts: 5,
      distinctDays: 2,
      son6: [true, true, true, true, true],
    });
    const ozet = ilerlemeOzetiniHesapla(
      [tamamlanan],
      [dugum('mat.test.tamam')],
      SIMDI,
    );

    expect(ozet.hazirOlanlar.map((beceri) => beceri.skillId)).not.toContain('mat.test.tamam');
  });

  it(`destek listesini en fazla ${OZET_EYLEM_SINIRI} maddeyle sınırlar`, () => {
    const kayitlar = Array.from({ length: 5 }, (_, index) => kayit(`mat.test.zor.${index}`));
    const dugumler = Array.from({ length: 5 }, (_, index) => dugum(`mat.test.zor.${index}`));

    const ozet = ilerlemeOzetiniHesapla(kayitlar, dugumler, SIMDI);

    expect(ozet.destekGerektiren).toHaveLength(OZET_EYLEM_SINIRI);
  });
});
