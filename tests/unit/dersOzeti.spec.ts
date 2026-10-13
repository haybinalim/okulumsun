import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { skillsData } from '../../src/content/skillsData';
import { dersOzetiHesapla, DERS_OZETI_EN_FAZLA, type DersOlayi } from '../../src/ogretmen/dersOzeti';

const dugumler = skillsData.filter((d) => d.durum === 'hazir').slice(0, 5);
const ol = (i: number, dogru: boolean, tani: DersOlayi['tani'] = null, y: DersOlayi['yardimKademesi'] = 0): DersOlayi => ({
  skillId: dugumler[i]!.id as DersOlayi['skillId'],
  ilkDenemeDogru: dogru,
  yardimKademesi: y,
  tani,
});

describe('dersOzetiHesapla', () => {
  it('en çok 3 beceri verir', () => {
    const olaylar = [0, 1, 2, 3, 4].flatMap((i) => [ol(i, false), ol(i, false)]);
    const o = dersOzetiHesapla(olaylar, dugumler, 7);
    expect(o.zorlanilanlar.length).toBe(DERS_OZETI_EN_FAZLA);
  });
  it('tek maddelik düğüm dışarıda kalır', () => {
    const o = dersOzetiHesapla([ol(0, false)], dugumler, 7);
    expect(o.zorlanilanlar).toEqual([]);
    expect(o.yarinIcinSet).toBeNull();
  });
  it('baskın tanı çoğunluktur ve rahat düğüm rahatlara girer', () => {
    const olaylar = [ol(0, false, 'FAZLA_SAYMA'), ol(0, false, 'FAZLA_SAYMA'), ol(0, false, 'EKSIK_SAYMA'), ol(1, true), ol(1, true)];
    const o = dersOzetiHesapla(olaylar, dugumler, 7);
    expect(o.zorlanilanlar[0]?.baskinTani?.etiket).toBe('FAZLA_SAYMA');
    expect(o.zorlanilanlar[0]?.duzey).toBe('zorlandi');
    expect(o.rahatlar.map((r) => r.skillId)).toEqual([dugumler[1]!.id]);
  });
  it('yarın seti zorlanılan düğümlerdendir; çıktıda sayı alanı yok', () => {
    const o = dersOzetiHesapla([ol(2, false), ol(2, false)], dugumler, 9);
    expect(o.yarinIcinSet?.dugumler).toEqual([dugumler[2]!.id]);
    expect(JSON.stringify(o.zorlanilanlar)).not.toMatch(/yuzde|oran|puan/i);
  });
  it('depolama kullanmaz', () => {
    const kaynak = readFileSync('src/ogretmen/dersOzeti.ts', 'utf8');
    expect(kaynak).not.toMatch(/localStorage|indexedDB|dexie|Date\.now|Math\.random/i);
  });
});
