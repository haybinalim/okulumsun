import { describe, expect, it } from 'vitest';
import {
  EVE_LINK_EN_UZUN_HASH,
  eveLinkCoz,
  eveLinkGirisimiMi,
  eveLinkHash,
  eveLinkUret,
} from '../../src/ogretmen/eveLink';
import { setKodla, setlenebilirDugumler, type GunlukSet } from '../../src/ogretmen/gunlukSet';
import { REGISTRY } from '../../src/exercises/registry';
import type { SkillId } from '../../src/exercises/types';

/** Plan v2 Adım 42 aşama 1 (ADR-0010 Kabul): eve link biçimi. */
const GECERLI = setlenebilirDugumler((t) => REGISTRY.has(t));
const dugumler = [...GECERLI].slice(0, 4) as SkillId[];
const SET: GunlukSet = { surum: 1, dugumler: dugumler.slice(0, 2), tohum: 123456789 };
const KOK = 'https://okulumsun-tc.vercel.app';

describe('eveLinkUret / eveLinkCoz', () => {
  it('üret → çöz tersi (1–4 düğüm, uç tohumlar)', () => {
    for (const n of [1, 2, 3, 4]) {
      for (const tohum of [0, 1, 0xffffffff]) {
        const set: GunlukSet = { surum: 1, dugumler: dugumler.slice(0, n), tohum };
        const link = eveLinkUret(KOK, set);
        const hash = new URL(link).hash;
        expect(eveLinkCoz(hash, GECERLI)).toEqual(set);
        expect(hash.length).toBeLessThanOrEqual(EVE_LINK_EN_UZUN_HASH);
      }
    }
  });
  it('biçim: kök + /#ev=1.<set kodu>; sorgu dizesi yok', () => {
    const link = eveLinkUret(`${KOK}/`, SET);
    expect(link).toBe(`${KOK}/#ev=1.${setKodla(SET)}`);
    expect(new URL(link).search).toBe('');
    expect(link).not.toContain('?');
    expect(eveLinkHash(SET)).toBe(`#ev=1.${setKodla(SET)}`);
  });
  it('alt dizinli kök korunur', () => {
    expect(eveLinkUret('https://ornek.test/okul/', SET)).toBe(`https://ornek.test/okul/#ev=1.${setKodla(SET)}`);
  });
  it('başında # olmadan da çözer', () => {
    expect(eveLinkCoz(`ev=1.${setKodla(SET)}`, GECERLI)).toEqual(SET);
  });
  it('fazla alan → null (kişisel veri taşıma girişimi)', () => {
    const h = eveLinkHash(SET);
    for (const kotu of [
      `${h}&ad=ali`,
      `${h}.ali`,
      `${h}&sinif=1a`,
      `${h}/x`,
      `${h}%20`,
      `#ad=ali&ev=1.${setKodla(SET)}`,
      `${h.toUpperCase()}`,
    ]) {
      expect(eveLinkCoz(kotu, GECERLI), kotu).toBeNull();
    }
  });
  it('sürüm uyumsuz → null', () => {
    const kod = setKodla(SET);
    expect(eveLinkCoz(`#ev=2.${kod}`, GECERLI)).toBeNull();
    expect(eveLinkCoz(`#ev=01.${kod}`, GECERLI)).toBeNull();
    expect(eveLinkCoz(`#ev=1.${kod.replace(/^1\./, '9.')}`, GECERLI)).toBeNull();
  });
  it('geçersiz düğüm, boş veya çok uzun hash → null', () => {
    expect(eveLinkCoz('', GECERLI)).toBeNull();
    expect(eveLinkCoz('#', GECERLI)).toBeNull();
    expect(eveLinkCoz('#ev=1.1.zz.1', GECERLI)).toBeNull();
    expect(eveLinkCoz(eveLinkHash(SET), new Set<SkillId>())).toBeNull();
    expect(eveLinkCoz(`#ev=1.1.${'a1'.repeat(20)}.1`, GECERLI)).toBeNull();
  });
  it('geçersiz kök hata fırlatır', () => {
    expect(() => eveLinkUret('okulumsun', SET)).toThrow();
    expect(() => eveLinkUret('ftp://x.test', SET)).toThrow();
    expect(() => eveLinkUret(`${KOK}/?a=1`, SET)).toThrow();
    expect(() => eveLinkUret(`${KOK}/#x`, SET)).toThrow();
  });
  it('eveLinkGirisimiMi: yalnız ev= ile başlayan hash', () => {
    expect(eveLinkGirisimiMi('#ev=bozuk')).toBe(true);
    expect(eveLinkGirisimiMi('ev=1.')).toBe(true);
    expect(eveLinkGirisimiMi('#evet')).toBe(false);
    expect(eveLinkGirisimiMi('')).toBe(false);
  });
  it('çıktıda kişisel veri alanı yok: yalnız [a-z0-9.] ve sabit önek', () => {
    expect(eveLinkHash(SET)).toMatch(/^#ev=1\.[a-z0-9.]+$/);
  });
});
