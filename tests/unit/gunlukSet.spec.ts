// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { skillsData } from '../../src/content/skillsData';
import { REGISTRY } from '../../src/exercises/registry';
import { createRng } from '../../src/exercises/rng';
import type { SkillId } from '../../src/exercises/types';
import {
  SET_EN_FAZLA_DUGUM,
  SET_SURUMU,
  setCoz,
  setKodla,
  setSorusu,
  setlenebilirDugumler,
  type GunlukSet,
} from '../../src/ogretmen/gunlukSet';
import { setSorusuUret } from '../../src/ogretmen/tahtaSorusu';
import { depolamaCasusuKur } from './yardimci/depolamaCasusu';

const kayitli = (t: string): boolean => REGISTRY.has(t);
const gecerli = setlenebilirDugumler(kayitli);
const hazirlar = [...gecerli];

function rastgeleSet(rng: ReturnType<typeof createRng>): GunlukSet {
  const adet = 1 + rng.int(0, SET_EN_FAZLA_DUGUM - 1);
  return { surum: SET_SURUMU, dugumler: rng.sample(hazirlar, adet), tohum: rng.int(0, 0xffffffff) >>> 0 };
}

describe('gunlukSet', () => {
  it('kodla/çöz ters: 1000 rastgele set', () => {
    const rng = createRng(2026);
    for (let i = 0; i < 1000; i++) {
      const set = rastgeleSet(rng);
      const kod = setKodla(set);
      expect(kod).toMatch(/^1\.[a-z0-9]{2,8}\.[a-z0-9]{1,7}$/);
      expect(setCoz(kod, gecerli)).toEqual(set);
    }
  });

  it('örnek biçim 1.<kodlar>.<tohum base36>', () => {
    const set: GunlukSet = { surum: 1, dugumler: ['mat.uzam.konum-ifadeleri'], tohum: 123456 };
    expect(setKodla(set)).toBe(`1.a1.${(123456).toString(36)}`);
  });

  it('hazır olmayan / bilinmeyen / bozuk kod → null', () => {
    const [a] = hazirlar;
    const set: GunlukSet = { surum: 1, dugumler: [a], tohum: 5 };
    const kod = setKodla(set);
    expect(setCoz(kod, new Set<SkillId>())).toBeNull(); // düğüm geçerli değil
    for (const bozuk of ['', 'x', '1..', '2.a1.5', '1.zz.5', '1.a.5', '1.a1a1.5', '1.a1.', '1.A1.5', '1.a1.zzzzzzzz', '1.a1.5.6']) {
      expect(setCoz(bozuk, gecerli), bozuk).toBeNull();
    }
  });

  it('>4 veya 0 düğüm kodlanamaz ve çözülemez', () => {
    const bes = hazirlar.slice(0, 5);
    expect(() => setKodla({ surum: 1, dugumler: bes, tohum: 1 })).toThrow();
    expect(() => setKodla({ surum: 1, dugumler: [], tohum: 1 })).toThrow();
    expect(() => setKodla({ surum: 1, dugumler: [hazirlar[0], hazirlar[0]], tohum: 1 })).toThrow();
    const dort = setKodla({ surum: 1, dugumler: hazirlar.slice(0, 4), tohum: 1 });
    const besli = dort.replace(/\.([a-z0-9]+)\./, (_m, k: string) => `.${k}${setKodla({ surum: 1, dugumler: [hazirlar[4]], tohum: 1 }).split('.')[1]}.`);
    expect(setCoz(besli, gecerli)).toBeNull();
  });

  it('setSorusu deterministik; yalnız defterdeki şablonlar; düğümler setten', () => {
    const rng = createRng(7);
    for (let i = 0; i < 50; i++) {
      const set = rastgeleSet(rng);
      for (let sira = 0; sira < 40; sira++) {
        const s = setSorusu(set, sira, kayitli);
        expect(setSorusu(set, sira, kayitli)).toEqual(s);
        expect(set.dugumler).toContain(s.skillId);
        expect(kayitli(s.templateId)).toBe(true);
        expect(skillsData.find((d) => d.id === s.skillId)!.exerciseTemplates).toContain(s.templateId);
      }
    }
  });

  it('turlarda her düğüm eşit sıklıkta gelir', () => {
    const set: GunlukSet = { surum: 1, dugumler: hazirlar.slice(0, 3), tohum: 99 };
    const sayac = new Map<string, number>();
    for (let sira = 0; sira < 300; sira++) {
      const id = setSorusu(set, sira, kayitli).skillId;
      sayac.set(id, (sayac.get(id) ?? 0) + 1);
    }
    expect([...sayac.values()]).toEqual([100, 100, 100]);
  });

  it('aynı düğüm üst üste en çok 2 kez (10.000 sıra, 2–4 düğüm)', () => {
    const rng = createRng(31);
    for (const n of [2, 3, 4]) {
      for (let k = 0; k < 5; k++) {
        const set: GunlukSet = { surum: 1, dugumler: rng.sample(hazirlar, n), tohum: rng.int(0, 0xffffffff) >>> 0 };
        let uzunluk = 0;
        let onceki = '';
        let enUzun = 0;
        for (let sira = 0; sira < 10_000 / 5; sira++) {
          const id = setSorusu(set, sira, kayitli).skillId;
          uzunluk = id === onceki ? uzunluk + 1 : 1;
          onceki = id;
          enUzun = Math.max(enUzun, uzunluk);
        }
        expect(enUzun, `n=${n}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('setSorusuUret her sırada soru üretir ve aynı sıra aynı madde', () => {
    const set: GunlukSet = { surum: 1, dugumler: hazirlar.slice(0, 4), tohum: 4242 };
    for (let sira = 0; sira < 60; sira++) {
      const s = setSorusu(set, sira, kayitli);
      const a = setSorusuUret(s);
      expect(a.itemId).toBe(setSorusuUret(s).itemId);
      expect(a.skillIds).toContain(s.skillId);
    }
  });

  it('depoya hiçbir şey yazmaz', () => {
    const casus = depolamaCasusuKur();
    const set: GunlukSet = { surum: 1, dugumler: hazirlar.slice(0, 2), tohum: 5 };
    setCoz(setKodla(set), gecerli);
    for (let sira = 0; sira < 20; sira++) setSorusuUret(setSorusu(set, sira, kayitli));
    expect(casus.cagrilar()).toHaveLength(0);
    casus.sok();
  });
});
