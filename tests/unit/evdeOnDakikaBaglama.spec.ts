/** Plan v2 Adım 43 aşama 2: Evde 10 dakika veri bağlaması ve akış durumu (yalnız bellek). */
import { beforeEach, describe, expect, it } from 'vitest';
import { buHaftaninEvdeOnDakikasi } from '../../src/ogretmen/evdeOnDakikaBaglama';
import { temaIpucu } from '../../src/content/evIpuclari';
import { OGRETIM_HAFTALARI } from '../../src/content/okulTakvimi';
import { REGISTRY } from '../../src/exercises/registry';
import { setKodla, setlenebilirDugumler, setSorusu } from '../../src/ogretmen/gunlukSet';
import { setSorusuUret } from '../../src/ogretmen/tahtaSorusu';
import { YILLIK_PLAN } from '../../src/ogretmen/yillikPlan';
import { buHafta } from '../../src/ogretmen/haftalikPlan';
import { useAppStore } from '../../src/store/appStore';

const kayitli = (t: string): boolean => REGISTRY.has(t);

describe('temaIpucu', () => {
  it('7 temanın hepsinde 3 cümle; bilinmeyen tema null', () => {
    for (let t = 1; t <= 7; t++) {
      const i = temaIpucu(t)!;
      expect([i.gozlem, i.soru, i.etkinlik].every((c) => c.length >= 10)).toBe(true);
    }
    expect(temaIpucu(8)).toBeNull();
  });
});

describe('buHaftaninEvdeOnDakikasi', () => {
  it('yıl dışında null', () => {
    expect(buHaftaninEvdeOnDakikasi('2026-07-01', 1)).toBeNull();
  });
  it('her ders haftasında: oynatılabilir düğümler, 8 soru üretilir, ipucu haftanın temasından', () => {
    const uygun = setlenebilirDugumler(kayitli);
    let sayac = 0;
    for (const h of OGRETIM_HAFTALARI) {
      const r = buHaftaninEvdeOnDakikasi(h.pazartesi, 4242);
      if (!r) continue;
      sayac++;
      expect(r.set.dugumler.every((d) => uygun.has(d))).toBe(true);
      expect(() => setKodla(r.set)).not.toThrow();
      for (let s = 0; s < 8; s++) expect(() => setSorusuUret(setSorusu(r.set, s, kayitli))).not.toThrow();
      const p = buHafta(YILLIK_PLAN, h.pazartesi)!;
      if (p.temaNo != null) expect(r.tema).toBe(p.temaNo);
      expect(r.ipucu).toEqual(temaIpucu(r.tema));
    }
    expect(sayac).toBeGreaterThan(20);
  });
});

describe('appStore Evde 10 dakika akışı', () => {
  beforeEach(() => useAppStore.getState().sifirla());
  it('başlat → ipucu kartı → bitir; set ve tema bellekten silinir', () => {
    const set = buHaftaninEvdeOnDakikasi('2026-10-14', 1)!;
    useAppStore.getState().evdeOnDakikaBaslat(set.set, set.tema);
    expect(useAppStore.getState()).toMatchObject({ ekran: 'evdeCalis', evSeti: set.set, evdeOnDakikaTema: set.tema });
    useAppStore.getState().evIpucunaGec();
    expect(useAppStore.getState()).toMatchObject({ ekran: 'veliIpucuKarti', evSeti: null, evdeOnDakikaTema: set.tema });
    useAppStore.getState().evdeOnDakikaBitir();
    expect(useAppStore.getState()).toMatchObject({ ekran: 'anaEkran', evSeti: null, evdeOnDakikaTema: null });
  });
  it('eve link akışı (öğretmen bağlantısı) ipucu temasını taşımaz', () => {
    const set = buHaftaninEvdeOnDakikasi('2026-10-14', 1)!;
    useAppStore.getState().evSetiAyarla(set.set);
    expect(useAppStore.getState().evdeOnDakikaTema).toBeNull();
    useAppStore.getState().evCalismasiniBitir();
    expect(useAppStore.getState()).toMatchObject({ ekran: 'modSecimi', evSeti: null, evdeOnDakikaTema: null });
  });
});
