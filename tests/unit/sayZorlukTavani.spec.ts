import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/exercises/rng';
import { uretSay } from '../../src/exercises/templates/say';
import type { Difficulty, TapCountExercise } from '../../src/exercises/types';
import { SAY_KUCUK_EKRAN_TAVANI, saySigarMi, sayZorlukTavani } from '../../src/ui/sayZorlukTavani';

/** Plan v2 KG-131 (kullanıcı kararı 2026-10-30): küçük tahtada sığmayan M-SAY zorluk 4–5 → zorluk 3. */

const KUCUK_TAHTA = { w: 1004, h: 409, kart: 240, bosluk: 51, darBosluk: 38, cubukW: 416, cubukH: 224, tapMin: 102 };
const BUYUKLER = {
  'tahta 1920': { w: 1844, h: 585, kart: 240, bosluk: 51, darBosluk: 38, cubukW: 416, cubukH: 224, tapMin: 102 },
  'tahta 1920 büyük hedef': { w: 1844, h: 585, kart: 240, bosluk: 51, darBosluk: 38, cubukW: 439, cubukH: 224, tapMin: 118 },
  tablet: { w: 1032, h: 453, kart: 150, bosluk: 32, darBosluk: 24, cubukW: 260, cubukH: 140, tapMin: 64 },
  'tablet büyük hedef': { w: 1032, h: 453, kart: 150, bosluk: 32, darBosluk: 24, cubukW: 274, cubukH: 140, tapMin: 74 },
};

const madde = (seed: number, difficulty: Difficulty, mod: 'tahta' | 'kisisel') =>
  uretSay({ seed, difficulty, mod }, createRng(seed)) as TapCountExercise;
const adet = (ex: TapCountExercise) => ex.validation.hedefIds.length;
const TOHUMLAR = Array.from({ length: 40 }, (_, i) => i + 1);

describe('KG-131 sayZorlukTavani', () => {
  for (const mod of ['tahta', 'kisisel'] as const)
    for (const d of [4, 5] as const)
      it(`1080×810 tahta, ${mod}, zorluk ${d}: madde zorluk 3'e iner, nesneler sığar, şık/sprite korunur`, () => {
        for (const seed of TOHUMLAR) {
          const ex = madde(seed, d, mod);
          expect(saySigarMi(ex, KUCUK_TAHTA)).toBe(false);
          const t = sayZorlukTavani(ex, KUCUK_TAHTA);
          expect(t.difficulty).toBe(SAY_KUCUK_EKRAN_TAVANI);
          expect(t.kind).toBe('TAP_COUNT');
          expect(adet(t)).toBeGreaterThanOrEqual(6);
          expect(adet(t)).toBeLessThanOrEqual(10);
          expect(saySigarMi(t, KUCUK_TAHTA)).toBe(true);
          expect(t.options).toHaveLength(ex.options.length);
          const s = (e: TapCountExercise) => (e.prompt.gorsel?.type === 'nesneKumesi' ? e.prompt.gorsel.sprite : null);
          expect(s(t)).toBe(s(ex));
          // Deterministik: aynı madde + ölçü → birebir aynı tavanlı madde.
          expect(JSON.stringify(sayZorlukTavani(madde(seed, d, mod), KUCUK_TAHTA))).toBe(JSON.stringify(t));
        }
      });

  for (const [ad, o] of Object.entries(BUYUKLER))
    it(`${ad}: zorluk 4–5 maddeleri değişmez`, () => {
      for (const seed of TOHUMLAR)
        for (const d of [4, 5] as const) {
          const ex = madde(seed, d, ad.startsWith('tahta') ? 'tahta' : 'kisisel');
          expect(sayZorlukTavani(ex, o)).toBe(ex);
        }
    });

  it('zorluk ≤ 3 maddeleri küçük tahtada da değişmez (tavan yalnız 4–5 için)', () => {
    for (const seed of TOHUMLAR)
      for (const d of [1, 2, 3] as const) {
        const ex = madde(seed, d, 'tahta');
        expect(sayZorlukTavani(ex, KUCUK_TAHTA)).toBe(ex);
      }
  });
});
