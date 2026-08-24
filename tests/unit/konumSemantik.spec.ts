import { expect, test } from 'vitest';
import { createRng } from '../../src/exercises/rng';
import { KONUM_ILISKILERI, type Difficulty, type VisualSpec } from '../../src/exercises/types';
import { VisualSpecSchema } from '../../src/content/schema/exercise';
import { konumUret } from '../../src/exercises/templates/konum';

const ZORLUKLAR: readonly Difficulty[] = [1, 2, 3, 4, 5];

type KonumSahnesi = Extract<VisualSpec, { type: 'konumSahnesi' }>;

function konumSahnesiAl(spec: VisualSpec): KonumSahnesi {
  expect(spec.type, 'Konum sorusu genel sahne birleşimi değil, anlam taşıyan konum sahnesi üretmelidir.').toBe('konumSahnesi');
  if (spec.type !== 'konumSahnesi') {
    throw new Error(`Beklenen konumSahnesi, gelen: ${spec.type}`);
  }
  return spec;
}

test('M-KONUM: talimat, doğru şık ve çeldiriciler aynı nesne/referans ilişkisini görünür kılar', () => {
  const gorulenIliskiler = new Set<string>();

  for (let seed = 0; seed < 500; seed++) {
    for (const difficulty of ZORLUKLAR) {
      const exercise = konumUret({ seed, difficulty }, createRng(seed));
      const sahneler = exercise.options.map((option) => {
        expect(option.deger.tur).toBe('gorsel');
        if (option.deger.tur !== 'gorsel') throw new Error('M-KONUM şıkkı görsel olmalıdır.');

        const parse = VisualSpecSchema.safeParse(option.deger.gorsel);
        expect(parse.success, `Şema dışı konum görseli: seed=${seed}, zorluk=${difficulty}`).toBe(true);
        return { option, sahne: konumSahnesiAl(option.deger.gorsel) };
      });

      const correct = sahneler.find(({ option }) => option.correct === true);
      expect(correct, `Doğru konum şıkkı yok: seed=${seed}, zorluk=${difficulty}`).toBeDefined();
      if (!correct) continue;

      gorulenIliskiler.add(correct.sahne.iliski);
      const iliskiler = sahneler.map(({ sahne }) => sahne.iliski);
      expect(new Set(iliskiler).size, `Aynı ilişki iki şıkta görünüyor: seed=${seed}, zorluk=${difficulty}`).toBe(iliskiler.length);

      for (const { option, sahne } of sahneler) {
        // Çocuk aynı hedefi ve aynı kutu/sepeti görür; fark yalnızca ölçülen ilişkidir.
        expect(sahne.hedef).toBe(correct.sahne.hedef);
        expect(sahne.referans).toBe(correct.sahne.referans);
        if (option.correct !== true) {
          expect(sahne.iliski, `Çeldirici doğru ilişkiyi tekrar ediyor: seed=${seed}, zorluk=${difficulty}`).not.toBe(correct.sahne.iliski);
        }
      }
    }
  }

  // Deterministik üretim alanı, ses envanterindeki sekiz konum ifadesinin tümünü kapsar.
  expect([...gorulenIliskiler].sort()).toEqual([...KONUM_ILISKILERI].sort());
});
