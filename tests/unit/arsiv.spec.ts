/** Plan v2 Adım 48 aşama 1 (KG-69): çalışma kâğıdı arşivi — kayıtlar, dosya adı şeması, determinizm (SAF). */
import { describe, expect, it } from 'vitest';
import tr from '../../src/content/tr.json';
import { skillsData } from '../../src/content/skillsData';
import { REGISTRY } from '../../src/exercises/registry';
import { DUGUM_KODLARI } from '../../src/ogretmen/dugumKodlari';
import {
  ARSIV_MADDE_SAYISI,
  arsivIstegi,
  arsivKayitlari,
  arsivYolu,
  kagitMetinOzeti,
  kazanimDizini,
} from '../../src/ogretmen/calismaKagidi/arsiv';
import { ARSIV_TOHUMLARI } from '../../src/ogretmen/calismaKagidi/arsivTohumlari';
import { kagitKoduCoz, kagitPlaniUret } from '../../src/ogretmen/calismaKagidi/kagitPlani';
import { trDuzlestir } from '../../src/ogretmen/calismaKagidi/sesMetni';
import { setlenebilirDugumler } from '../../src/ogretmen/gunlukSet';

const kayitli = (t: string): boolean => REGISTRY.has(t);
const TR = trDuzlestir(tr as unknown as Record<string, unknown>);
const kayitlar = arsivKayitlari(skillsData);

describe('dosya adı şeması', () => {
  it('kazanım dizini küçük harf, adres güvenli; yol kagitlar/<kazanım>/<kod>-<tohum>.pdf', () => {
    expect(kazanimDizini('MAT.1.3.1')).toBe('mat-1-3-1');
    expect(arsivYolu('MAT.1.3.1', 'a1', 101)).toBe('kagitlar/mat-1-3-1/a1-101.pdf');
    for (const k of kayitlar) expect(k.yol).toMatch(/^kagitlar\/mat-1-\d+-\d+\/[a-z0-9]{2}-\d+\.pdf$/);
  });
  it('tohumlar sabit (URL kalıcılığı)', () => {
    expect(ARSIV_TOHUMLARI).toEqual([101, 202, 303]);
  });
  it('yollar ve kâğıt kodları yinelenmez', () => {
    expect(new Set(kayitlar.map((k) => k.yol)).size).toBe(kayitlar.length);
    expect(new Set(kayitlar.map((k) => k.kagitKodu)).size).toBe(kayitlar.length);
  });
});

describe('kapsam', () => {
  it('kâğıda girebilen her hazır düğüm × 3 tohum; düğüm kodu ve kazanım düğümden', () => {
    const uygun = setlenebilirDugumler(kayitli);
    const dugumler = [...new Set(kayitlar.map((k) => k.skillId))];
    for (const id of dugumler) {
      expect(uygun.has(id)).toBe(true);
      expect(kayitlar.filter((k) => k.skillId === id).map((k) => k.tohum)).toEqual([...ARSIV_TOHUMLARI]);
      const d = skillsData.find((x) => x.id === id)!;
      const k = kayitlar.find((x) => x.skillId === id)!;
      expect(k.dugumKodu).toBe(DUGUM_KODLARI[id]);
      expect(k.kazanim).toBe(d.mebOutcomes[0]);
    }
    // Hazır düğümlerin büyük çoğunluğu arşivde (kâğıda giremeyenler yalnız ekrana özgü şablonlu düğümler).
    expect(dugumler.length).toBeGreaterThanOrEqual(Math.floor(uygun.size * 0.8));
  });
  it('kâğıt kodu çözülür ve aynı isteği verir', () => {
    const gecerli = new Set(skillsData.map((d) => d.id));
    for (const k of kayitlar.slice(0, 12)) expect(kagitKoduCoz(k.kagitKodu, gecerli)).toEqual(arsivIstegi(k));
  });
});

describe('determinizm', () => {
  it('aynı kayıt → aynı plan ve aynı metin özeti; farklı tohum → farklı özet', () => {
    for (const k of kayitlar.filter((x) => x.tohum === 101).slice(0, 10)) {
      const a = kagitPlaniUret(arsivIstegi(k), TR, kayitli);
      const b = kagitPlaniUret(arsivIstegi(k), TR, kayitli);
      expect(kagitMetinOzeti(a)).toBe(kagitMetinOzeti(b));
      expect(a.sayfalar.flat().length).toBeGreaterThan(0);
      expect(a.sayfalar.flat().length).toBeLessThanOrEqual(ARSIV_MADDE_SAYISI);
    }
    const [k1, k2] = kayitlar;
    expect(k1.skillId).toBe(k2.skillId);
    expect(kagitMetinOzeti(kagitPlaniUret(arsivIstegi(k1), TR, kayitli))).not.toBe(
      kagitMetinOzeti(kagitPlaniUret(arsivIstegi(k2), TR, kayitli)),
    );
  });
});
