import { describe, expect, it } from 'vitest';
import { ExerciseSchema } from '../../src/content/schema/exercise';
import { hataDestekKarari } from '../../src/exercises/hataDestek';
import { createRng } from '../../src/exercises/rng';
import { uretSay } from '../../src/exercises/templates/say';
import { olcBirimUret } from '../../src/exercises/templates/olcBirim';
import { uretToplaGorsel } from '../../src/exercises/templates/toplaGorsel';
import { alistirmaIhlalleri, type Exercise } from '../../src/exercises/types';

const PILOT_URETICILER = [
  (seed: number) => uretSay({ seed, difficulty: 2, responseMode: 'pickOnly' }, createRng(seed)),
  (seed: number) => uretToplaGorsel({ seed, difficulty: 2 }, createRng(seed)),
  (seed: number) => olcBirimUret({ seed, difficulty: 2 }, createRng(seed)),
] as const;

describe('öğretimsel temsil sözleşmesi — pilot', () => {
  it('üç pilot şablonda görsel kanıt, çocuk eylemi ve hata desteği bildirimi vardır', () => {
    for (let seed = 1; seed <= 24; seed += 1) {
      for (const uret of PILOT_URETICILER) {
        const exercise = uret(seed);
        const sozlesme = exercise.ogretimselSozlesme;

        expect(sozlesme).toBeDefined();
        expect(exercise.prompt.gorsel).toBeDefined();
        expect(sozlesme?.hedefBeceri).toBeDefined();
        expect(exercise.skillIds).toContain(sozlesme?.hedefBeceri);
        expect(sozlesme?.hataDestekEtiketleri.length).toBeGreaterThan(0);
        expect(alistirmaIhlalleri(exercise)).toEqual([]);
        expect(ExerciseSchema.safeParse(exercise).success).toBe(true);
      }
    }
  });

  it('yanlış şık, hedef hata etiketiyle K2 yöntem desteğine dönüşür; doğru şık dönüşmez', () => {
    const exercise = uretToplaGorsel({ seed: 31, difficulty: 3 }, createRng(31));
    const yanlis = exercise.options.find((option) => option.correct !== true);
    const dogru = exercise.options.find((option) => option.correct === true);
    if (yanlis == null || dogru == null) throw new Error('Pilot soru beklenen şıkları üretmedi.');

    const karar = hataDestekKarari(exercise, yanlis.id);
    expect(karar).not.toBeNull();
    expect(exercise.ogretimselSozlesme?.hataDestekEtiketleri).toContain(karar?.hataEtiketi);
    expect(karar?.hedefBeceri).toBe(exercise.ogretimselSozlesme?.hedefBeceri);
    expect(karar?.destek.kademe).toBe(2);
    expect(karar?.destek.cevabiGoster).not.toBe(true);
    expect(karar?.solukOptionIds).toEqual(exercise.hints[1].eleOptionIds ?? []);
    expect(hataDestekKarari(exercise, dogru.id)).toBeNull();
  });

  it('sözleşme hedef beceriyi ya da görülen hata desteğini atladığında doğrulama başarısız olur', () => {
    const exercise = olcBirimUret({ seed: 7, difficulty: 2 }, createRng(7));
    const sozlesme = exercise.ogretimselSozlesme;
    if (sozlesme == null) throw new Error('Ölçme pilotunda sözleşme bekleniyordu.');

    const bozukHedef: Exercise = {
      ...exercise,
      ogretimselSozlesme: { ...sozlesme, hedefBeceri: 'mat.sayma.kardinalite' },
    };
    expect(alistirmaIhlalleri(bozukHedef)).toContain(
      'Öğretimsel sözleşmedeki hedef beceri skillIds içinde yok.',
    );
    expect(ExerciseSchema.safeParse(bozukHedef).success).toBe(false);

    const bozukDestek: Exercise = {
      ...exercise,
      ogretimselSozlesme: { ...sozlesme, hataDestekEtiketleri: [] },
    };
    expect(alistirmaIhlalleri(bozukDestek)).toContain(
      'Öğretimsel sözleşmede hata-destek etiketi yok.',
    );
    expect(ExerciseSchema.safeParse(bozukDestek).success).toBe(false);
  });
});
