import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { paraSiralaUret } from '../../src/exercises/templates/paraSirala';
import { paraTaniUret } from '../../src/exercises/templates/paraTani';
import { createRng } from '../../src/exercises/rng';
import { BANKNOTLAR } from '../../src/exercises/types';
import { Visual } from '../../src/ui/svg/Visual';

const KUPURLER = [5, 10, 20, 50, 100, 200] as const;

function banknotDegerleri(exercise: ReturnType<typeof paraTaniUret> | ReturnType<typeof paraSiralaUret>) {
  return exercise.options.map((option) => {
    expect(option.deger.tur).toBe('gorsel');
    if (option.deger.tur !== 'gorsel' || option.deger.gorsel.type !== 'banknot') {
      throw new Error(`Banknot etkinliğinde banknot olmayan seçenek üretildi: ${option.id}`);
    }
    return option.deger.gorsel.deger;
  });
}

/** KG-121: ekranda da şematik banknot; TCMB raster dosyaları depodan kalktı (KG-19). */
describe('banknot görselleri (ekran)', () => {
  it.each(KUPURLER)('%i TL ekranda şematik "OYUN PARASI" çizer; raster/TCMB yok', (deger) => {
    const svg = renderToStaticMarkup(createElement(Visual, { spec: { type: 'banknot', deger }, width: 300, height: 200 }));
    expect(svg).toContain(`data-sematik-banknot="${deger}"`);
    expect(svg).toContain('OYUN PARASI');
    expect(svg).toContain(`>${deger} TL<`);
    expect(svg).not.toMatch(/<image|\.webp|Merkez Bankası|TCMB|ÖRNEKTİR|ORNEKTIR/i);
  });

  it('şematik banknot kutuya sığar ve kupür oranını korur', () => {
    for (const [w, h] of [
      [300, 200],
      [120, 120],
      [400, 100],
    ] as const) {
      const svg = renderToStaticMarkup(createElement(Visual, { spec: { type: 'banknot', deger: 200 }, width: w, height: h }));
      const ic = /<svg[^>]*data-sematik-banknot="200"[^>]*>/.exec(svg)?.[0] ?? '';
      const gm = / width="([\d.]+)"/.exec(ic);
      const ym = / height="([\d.]+)"/.exec(ic);
      expect(gm && ym).toBeTruthy();
      expect(Number(gm![1])).toBeLessThanOrEqual(w);
      expect(Number(ym![1])).toBeLessThanOrEqual(h);
    }
  });

  it('TCMB raster dosyaları ve eşlemesi depoda yok; kaynakta raster banknot yolu geçmez', () => {
    expect(existsSync(resolve(process.cwd(), 'public/images/banknotlar'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/ui/svg/banknotAssets.ts'))).toBe(false);
    const svgKlasoru = resolve(process.cwd(), 'src/ui/svg');
    for (const ad of readdirSync(svgKlasoru)) {
      expect(readFileSync(resolve(svgKlasoru, ad), 'utf8'), ad).not.toMatch(/images\/banknotlar|RESMI_BANKNOT/);
    }
  });

  it('para tanıma ve sıralama şablonlarında yalnız gerçek banknot kupürleri üretir', () => {
    expect([...BANKNOTLAR]).toEqual([...KUPURLER]);
    for (let seed = 0; seed < 128; seed++) {
      const taniDegerleri = banknotDegerleri(paraTaniUret({ seed, difficulty: 5 }, createRng(seed)));
      const siralamaDegerleri = banknotDegerleri(paraSiralaUret({ seed, difficulty: 5 }, createRng(seed)));
      for (const deger of [...taniDegerleri, ...siralamaDegerleri]) {
        expect(KUPURLER).toContain(deger as (typeof KUPURLER)[number]);
      }
    }
  });
});
