import { beforeEach, describe, expect, it } from 'vitest';
import { eveLinkiAcilistaOku, type AdresCubugu } from '../../src/platform/eveLinkAcilis';
import { eveLinkHash } from '../../src/ogretmen/eveLink';
import { setlenebilirDugumler, type GunlukSet } from '../../src/ogretmen/gunlukSet';
import { REGISTRY } from '../../src/exercises/registry';
import { useAppStore } from '../../src/store/appStore';
import type { SkillId } from '../../src/exercises/types';
import { setKodla } from '../../src/ogretmen/gunlukSet';
import { EVE_LINK_ORNEGI } from '../e2e/yardimci/eveLinkOrnegi';

/** Plan v2 Adım 42 aşama 2: açılışta hash okunur ve adresten silinir; set yalnız bellekte. */
const dugumler = [...setlenebilirDugumler((t) => REGISTRY.has(t))].slice(0, 2) as SkillId[];
const SET: GunlukSet = { surum: 1, dugumler, tohum: 99 };

function adres(hash: string): AdresCubugu & { yazilan: string[] } {
  const yazilan: string[] = [];
  return { hash, pathname: '/okul/', search: '?device=tablet', replaceState: (u) => yazilan.push(u), yazilan };
}

describe('eveLinkiAcilistaOku', () => {
  it('geçerli link: set döner, hash adresten silinir (yol ve sorgu korunur)', () => {
    const a = adres(eveLinkHash(SET));
    expect(eveLinkiAcilistaOku(a)).toEqual(SET);
    expect(a.yazilan).toEqual(['/okul/?device=tablet']);
  });
  it('geçersiz eve link girişimi: null, ama hash yine silinir', () => {
    const a = adres(`${eveLinkHash(SET)}&ad=ali`);
    expect(eveLinkiAcilistaOku(a)).toBeNull();
    expect(a.yazilan).toHaveLength(1);
  });
  it('eve link olmayan hash: dokunulmaz', () => {
    for (const h of ['', '#', '#bolum']) {
      const a = adres(h);
      expect(eveLinkiAcilistaOku(a)).toBeNull();
      expect(a.yazilan).toHaveLength(0);
    }
  });
});

describe('appStore ev seti', () => {
  beforeEach(() => useAppStore.getState().sifirla());
  it('evSetiAyarla bellekte tutar; evCalismasiniBitir siler ve mod seçimine döner', () => {
    useAppStore.getState().evSetiAyarla(SET);
    expect(useAppStore.getState().evSeti).toEqual(SET);
    useAppStore.getState().ekranGit('evdeCalis');
    useAppStore.getState().evCalismasiniBitir();
    expect(useAppStore.getState().evSeti).toBeNull();
    expect(useAppStore.getState().ekran).toBe('modSecimi');
  });
  it('başlangıçta ev seti yok', () => {
    expect(useAppStore.getState().evSeti).toBeNull();
  });
});

describe('e2e eve link örneği', () => {
  it('sabit hash ve set kodu üreticiyle aynı', () => {
    const set: GunlukSet = {
      surum: 1,
      dugumler: [...EVE_LINK_ORNEGI.dugumler] as SkillId[],
      tohum: EVE_LINK_ORNEGI.tohum,
    };
    expect(eveLinkHash(set)).toBe(EVE_LINK_ORNEGI.hash);
    expect(setKodla(set)).toBe(EVE_LINK_ORNEGI.setKodu);
  });
});
