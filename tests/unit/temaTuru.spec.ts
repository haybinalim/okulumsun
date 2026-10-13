/** Plan v2 Adım 46 aşama 1: tema sonu turu planı (SAF). */
import { describe, expect, it } from 'vitest';
import { skillsData } from '../../src/content/skillsData';
import { REGISTRY } from '../../src/exercises/registry';
import { setSorusu, setlenebilirDugumler } from '../../src/ogretmen/gunlukSet';
import { TEMA_TURU_MADDE, esitAralikliIndeksler, temaTuruPlani, type TemaNo } from '../../src/ogretmen/temaTuru';

const kayitli = (t: string): boolean => REGISTRY.has(t);
const uygun = setlenebilirDugumler(kayitli);
const adaylar = skillsData.filter((d) => uygun.has(d.id));
const TEMALAR: TemaNo[] = [1, 2, 3, 4, 5, 6, 7];

describe('esitAralikliIndeksler', () => {
  it('n ≤ k ise hepsi; değilse ilk ve son dâhil, artan, yinelenmez', () => {
    expect(esitAralikliIndeksler(3, 10)).toEqual([0, 1, 2]);
    const x = esitAralikliIndeksler(24, 10);
    expect(x).toHaveLength(10);
    expect(x[0]).toBe(0);
    expect(x[9]).toBe(23);
    expect(new Set(x).size).toBe(10);
    expect([...x].sort((a, b) => a - b)).toEqual(x);
  });
});

describe('temaTuruPlani', () => {
  it('7 temanın hepsinde plan var; 8–10 madde; düğümler temanın ve yinelenmez', () => {
    for (const t of TEMALAR) {
      const p = temaTuruPlani(t, adaylar, 77)!;
      expect(p, `tema ${t}`).not.toBeNull();
      expect(p.maddeSayisi).toBeGreaterThanOrEqual(TEMA_TURU_MADDE.enAz);
      expect(p.maddeSayisi).toBeLessThanOrEqual(TEMA_TURU_MADDE.enFazla);
      expect(new Set(p.dugumler).size).toBe(p.dugumler.length);
      expect(p.dugumler.every((id) => skillsData.find((d) => d.id === id)?.tema === t)).toBe(true);
    }
  });
  it('turdaki maddeler seçilen her düğümü en az bir kez sorar', () => {
    for (const t of TEMALAR) {
      const p = temaTuruPlani(t, adaylar, 5)!;
      const sorulan = new Set(Array.from({ length: p.maddeSayisi }, (_, i) => setSorusu(p, i, kayitli).skillId));
      expect(sorulan, `tema ${t}`).toEqual(new Set(p.dugumler));
    }
  });
  it('düğüm sayısı ≤10 olan temada temanın bütün hazır düğümleri turda', () => {
    for (const t of TEMALAR) {
      const temanin = adaylar.filter((d) => d.tema === t).map((d) => d.id);
      if (temanin.length > TEMA_TURU_MADDE.enFazla) continue;
      expect(temaTuruPlani(t, adaylar, 1)!.dugumler).toEqual(temanin);
    }
  });
  it('kalabalık temada (Tema 2) ilk ve son düğüm turda; 10 düğüm', () => {
    const temanin = adaylar.filter((d) => d.tema === 2).map((d) => d.id);
    const p = temaTuruPlani(2, adaylar, 1)!;
    expect(p.dugumler).toHaveLength(10);
    expect(p.dugumler[0]).toBe(temanin[0]);
    expect(p.dugumler[9]).toBe(temanin[temanin.length - 1]);
  });
  it('deterministik; tohum yalnız soru sırasını değiştirir; düğümü olmayan aday listesinde null', () => {
    expect(temaTuruPlani(4, adaylar, 9)).toEqual(temaTuruPlani(4, adaylar, 9));
    expect(temaTuruPlani(4, adaylar, 9)!.dugumler).toEqual(temaTuruPlani(4, adaylar, 10)!.dugumler);
    expect(temaTuruPlani(3, [], 1)).toBeNull();
  });
});
