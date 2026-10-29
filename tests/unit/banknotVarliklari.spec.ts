import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { paraSiralaUret } from '../../src/exercises/templates/paraSirala';
import { paraTaniUret } from '../../src/exercises/templates/paraTani';
import { createRng } from '../../src/exercises/rng';
import { BANKNOTLAR } from '../../src/exercises/types';
import { RESMI_BANKNOT_GORSELLERI } from '../../src/ui/svg/banknotAssets';
import { TcmbBanknot } from '../../src/ui/svg/TcmbBanknot';
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

/** KG-122: ekran, kâğıt ve arşivde TCMB E9 5. tertip ön yüz örnek görselleri ("ÖRNEKTİR GEÇMEZ"). */
describe('banknot görselleri (TCMB örnekleri)', () => {
  it('her dolaşımdaki kupür için yerel TCMB örnek görseli var; eşleme tam', () => {
    for (const kupur of KUPURLER) {
      const yol = RESMI_BANKNOT_GORSELLERI[kupur];
      expect(yol).toMatch(/^(?:\.\/|\/)images\/banknotlar\/\d+-tl-on-yuz-resmi\.webp$/);
      expect(existsSync(resolve(process.cwd(), 'public', yol.replace(/^\.?\//, '')))).toBe(true);
    }
    expect(
      Object.keys(RESMI_BANKNOT_GORSELLERI)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([...KUPURLER]);
    expect(readdirSync(resolve(process.cwd(), 'public/images/banknotlar')).sort()).toEqual(
      KUPURLER.map((k) => `${k}-tl-on-yuz-resmi.webp`).sort(),
    );
  });

  it.each(KUPURLER)('%i TL: TcmbBanknot <img> ve Visual <image> aynı dosyayı gösterir', (deger) => {
    const img = renderToStaticMarkup(createElement(TcmbBanknot, { deger }));
    expect(img).toContain(`src="${RESMI_BANKNOT_GORSELLERI[deger]}"`);
    expect(img).toContain('alt=""');
    expect(img).toContain(`data-banknot="${deger}"`);
    const svg = renderToStaticMarkup(
      createElement(Visual, {
        spec: { type: 'banknot', deger },
        width: 300,
        height: 200,
      }),
    );
    expect(svg).toContain(`href="${RESMI_BANKNOT_GORSELLERI[deger]}"`);
  });

  it('Visual banknotu kutuya sığar ve gerçek oranı korur', () => {
    for (const [w, h] of [
      [300, 200],
      [120, 120],
      [400, 100],
    ] as const) {
      const svg = renderToStaticMarkup(
        createElement(Visual, {
          spec: { type: 'banknot', deger: 200 },
          width: w,
          height: h,
        }),
      );
      const im = /<image[^>]*>/.exec(svg)?.[0] ?? '';
      const gw = Number(/ width="([\d.]+)"/.exec(im)?.[1]);
      const gh = Number(/ height="([\d.]+)"/.exec(im)?.[1]);
      expect(gw).toBeLessThanOrEqual(w);
      expect(gh).toBeLessThanOrEqual(h);
      expect(gw / gh).toBeCloseTo(160 / 72, 3);
    }
  });

  it('şematik banknot bileşeni ve "OYUN PARASI" kaynakta yok', () => {
    expect(existsSync(resolve(process.cwd(), 'src/ui/svg/SematikBanknot.tsx'))).toBe(false);
    const svgKlasoru = resolve(process.cwd(), 'src/ui/svg');
    for (const ad of readdirSync(svgKlasoru)) {
      expect(readFileSync(resolve(svgKlasoru, ad), 'utf8'), ad).not.toMatch(/SematikBanknot|OYUN PARASI/);
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
