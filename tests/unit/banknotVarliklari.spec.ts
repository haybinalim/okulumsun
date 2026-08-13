import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { paraSiralaUret } from '../../src/exercises/templates/paraSirala';
import { paraTaniUret } from '../../src/exercises/templates/paraTani';
import { createRng } from '../../src/exercises/rng';
import { RESMI_BANKNOT_GORSELLERI } from '../../src/ui/svg/banknotAssets';

const RESMI_KUPURLER = [5, 10, 20, 50, 100, 200] as const;

function banknotDegerleri(exercise: ReturnType<typeof paraTaniUret> | ReturnType<typeof paraSiralaUret>) {
  return exercise.options.map((option) => {
    expect(option.deger.tur).toBe('gorsel');
    if (option.deger.tur !== 'gorsel' || option.deger.gorsel.type !== 'banknot') {
      throw new Error(`Banknot etkinliğinde banknot olmayan seçenek üretildi: ${option.id}`);
    }
    return option.deger.gorsel.deger;
  });
}

describe('resmî banknot varlıkları', () => {
  it('her dolaşımdaki banknot kupürü için yerel TCMB örnek görseli içerir', () => {
    for (const kupur of RESMI_KUPURLER) {
      const yol = RESMI_BANKNOT_GORSELLERI[kupur];
      expect(yol).toMatch(/^(?:\.\/|\/)images\/banknotlar\/\d+-tl-on-yuz-resmi\.webp$/);
      const goreliYol = yol?.replace(/^\.?\//, '');
      expect(existsSync(resolve(process.cwd(), 'public', goreliYol ?? ''))).toBe(true);
    }
    expect(RESMI_BANKNOT_GORSELLERI[1]).toBeUndefined();
  });

  it('para tanıma ve sıralama şablonlarında 1 TL kartı üretmez', () => {
    for (let seed = 0; seed < 128; seed++) {
      const taniDegerleri = banknotDegerleri(
        paraTaniUret({ seed, difficulty: 5 }, createRng(seed)),
      );
      const siralamaDegerleri = banknotDegerleri(
        paraSiralaUret({ seed, difficulty: 5 }, createRng(seed)),
      );

      for (const deger of [...taniDegerleri, ...siralamaDegerleri]) {
        expect(RESMI_KUPURLER).toContain(deger as (typeof RESMI_KUPURLER)[number]);
      }
    }
  });
});
