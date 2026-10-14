// @vitest-environment happy-dom
/** Plan v2 Adım 47 aşama 1: Isınma Keşfi saf çekirdeği (PLAN §6.5, ADR-0007 Kabul — Seçenek 2). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { skillsData } from '../../src/content/skillsData';
import { acilanTemalar } from '../../src/content/okulAyi';
import type { SkillNode } from '../../src/content/schema/skill';
import { createRng, hash32 } from '../../src/exercises/rng';
import { REGISTRY } from '../../src/exercises/registry';
import type { SkillId } from '../../src/exercises/types';
import type { MaddeSonuc } from '../../src/progress/itemLifecycle';
import { oturumDuzenuSec, secilenSoruyuUret } from '../../src/progress/oturumRuntime';
import { oturumBaslat } from '../../src/progress/session';
import {
  ISINMA_ARDISIK_YANLIS_SINIRI,
  ISINMA_ASAGI_ADIM,
  ISINMA_EN_FAZLA_MADDE,
  ISINMA_ISARET_SAYISI,
  ISINMA_YUKARI_ADIM,
  isinmaBaslat,
  isinmaIlerlet,
  isinmaIsaretleri,
  isinmaMaddesi,
  isinmaSonrakiDugum,
  seviyeTahmini,
  type IsinmaDurumu,
} from '../../src/progress/seviyeTespiti';
import { depolamaCasusuKur } from './yardimci/depolamaCasusu';

const DUZEN = oturumDuzenuSec(skillsData, null);
const harita = new Map(skillsData.map((d) => [d.id, d]));
const sonuc = (dogru: boolean): MaddeSonuc => ({
  dogru,
  kullanilanYardimKademesi: 0,
  latencyMs: 1000,
  tani: null,
  zamanMs: 0,
});
const sert = (d: SkillNode) => d.prerequisites.filter((p) => p.type === 'hard').map((p) => p.id);

/** Cevap dizisini sonuna kadar (ya da ısınma bitene dek) oynatır. */
function oynat(d: IsinmaDurumu, cevaplar: readonly boolean[]): { son: IsinmaDurumu; sorulan: SkillId[] } {
  const sorulan: SkillId[] = [];
  let s = d;
  for (const c of cevaplar) {
    if (s.bitti) break;
    sorulan.push(isinmaSonrakiDugum(s));
    s = isinmaIlerlet(s, sonuc(c));
  }
  return { son: s, sorulan };
}

describe('sabitler (PLAN §17)', () => {
  it('8 madde, +2 / −1, ardışık 2 yanlış, 15 işaret', () => {
    expect([ISINMA_EN_FAZLA_MADDE, ISINMA_YUKARI_ADIM, ISINMA_ASAGI_ADIM, ISINMA_ARDISIK_YANLIS_SINIRI]).toEqual([
      8, 2, 1, 2,
    ]);
    expect(ISINMA_ISARET_SAYISI).toBe(15);
  });
});

describe('isinmaIsaretleri', () => {
  it('her okul ayında: yalnız açık temalardan, oynanabilir, ≤15, ön koşul sırasına uygun, ilk işaret en kolay', () => {
    for (let ay = 0; ay <= 9; ay++) {
      const isaretler = isinmaIsaretleri(DUZEN, ay);
      expect(isaretler.length, `ay ${ay}`).toBeGreaterThan(0);
      expect(isaretler.length).toBeLessThanOrEqual(ISINMA_ISARET_SAYISI);
      expect(new Set(isaretler).size).toBe(isaretler.length);
      const temalar = acilanTemalar(ay);
      const dugumler = isaretler.map((id) => harita.get(id)!);
      expect(dugumler.every((d) => temalar.includes(d.tema) && d.durum === 'hazir')).toBe(true);
      expect(dugumler.every((d) => d.exerciseTemplates.some((t) => REGISTRY.has(t)))).toBe(true);
      const havuz = DUZEN.filter((d) => temalar.includes(d.tema));
      expect(dugumler[0]!.difficulty).toBe(Math.min(...havuz.map((d) => d.difficulty)));
      // Bir işaretin işaretler arasındaki sert ön koşulu ondan önce gelir.
      isaretler.forEach((id, i) => {
        for (const p of sert(harita.get(id)!)) {
          const j = isaretler.indexOf(p);
          if (j >= 0) expect(j, `${id} ← ${p}`).toBeLessThan(i);
        }
      });
    }
  });

  it('Eylül yalnız tema 1; tümü açıkken 15 işarete örneklenir, en zor uç dahil', () => {
    expect(isinmaIsaretleri(DUZEN, 0).every((id) => harita.get(id)!.tema === 1)).toBe(true);
    const mayis = isinmaIsaretleri(DUZEN, 8);
    expect(mayis.length).toBe(ISINMA_ISARET_SAYISI);
    expect(new Set(mayis.map((id) => harita.get(id)!.tema)).size).toBeGreaterThanOrEqual(5);
  });

  it('açık temada oynanabilir düğüm yoksa verilen düzenin tamamına düşer; düzen boşsa ısınma hemen biter', () => {
    const tema4 = DUZEN.filter((d) => d.tema === 4);
    expect(isinmaIsaretleri(tema4, 0).length).toBeGreaterThan(0);
    expect(isinmaBaslat([], 0).bitti).toBe(true);
  });
});

describe('isinmaBaslat / isinmaIlerlet', () => {
  const baslangic = isinmaBaslat(DUZEN, 8);

  it('ilk madde en kolay işaret; başlangıç sayaçları sıfır', () => {
    expect(isinmaSonrakiDugum(baslangic)).toBe(baslangic.isaretler[0]);
    expect(baslangic).toMatchObject({ konum: 0, maddeSayisi: 0, ardisikYanlis: 0, bitti: false });
    expect(baslangic.gecilen.size).toBe(0);
  });

  it('doğruda 2 işaret yukarı, yanlışta 1 aşağı (0 altına inmez)', () => {
    const d1 = isinmaIlerlet(baslangic, sonuc(true));
    expect(d1.konum).toBe(2);
    expect([...d1.gecilen]).toEqual([baslangic.isaretler[0]]);
    const d2 = isinmaIlerlet(d1, sonuc(false));
    expect(d2).toMatchObject({ konum: 1, ardisikYanlis: 1, bitti: false });
    const d3 = isinmaIlerlet(d2, sonuc(true));
    expect(d3).toMatchObject({ konum: 3, ardisikYanlis: 0 });
    expect(isinmaIlerlet(baslangic, sonuc(false)).konum).toBe(0);
  });

  it('ardışık 2 yanlışta biter; araya doğru girerse sayaç sıfırlanır', () => {
    expect(oynat(baslangic, [false, false]).son).toMatchObject({ bitti: true, maddeSayisi: 2 });
    expect(oynat(baslangic, [true, false, false]).son).toMatchObject({ bitti: true, maddeSayisi: 3 });
    expect(oynat(baslangic, [false, true, false]).son.bitti).toBe(false);
  });

  it('en çok 8 madde (rastgele 500 cevap dizisi); bittikten sonra durum değişmez', () => {
    const rng = createRng(hash32('isinma-dizileri'));
    for (let i = 0; i < 500; i++) {
      const cevaplar = Array.from({ length: 20 }, () => rng.next() < 0.7);
      const { son, sorulan } = oynat(isinmaBaslat(DUZEN, i % 10), cevaplar);
      expect(son.bitti).toBe(true);
      expect(sorulan.length).toBeLessThanOrEqual(ISINMA_EN_FAZLA_MADDE);
      expect(son.maddeSayisi).toBe(sorulan.length);
      expect(isinmaIlerlet(son, sonuc(true))).toBe(son);
      expect(() => isinmaSonrakiDugum(son)).toThrow();
    }
  });

  it('hep doğru: tepe işaretine varır ve orada geçince biter', () => {
    const { son, sorulan } = oynat(baslangic, Array(8).fill(true));
    expect(son.bitti).toBe(true);
    expect(sorulan.at(-1)).toBe(baslangic.isaretler.at(-1));
    expect(sorulan.length).toBe(ISINMA_EN_FAZLA_MADDE);
  });
});

describe('isinmaMaddesi', () => {
  it('işaret düğümünün kayıtlı şablonuyla üretilebilir alıştırma; tohum deterministik', () => {
    let d = isinmaBaslat(DUZEN, 8);
    while (!d.bitti) {
      const m = isinmaMaddesi(d, DUZEN, 77);
      expect(m.skillId).toBe(isinmaSonrakiDugum(d));
      expect(REGISTRY.has(m.templateId)).toBe(true);
      expect(isinmaMaddesi(d, DUZEN, 77)).toEqual(m);
      expect(secilenSoruyuUret(m, DUZEN, 'kisisel').skillIds).toContain(m.skillId);
      d = isinmaIlerlet(d, sonuc(true));
    }
  });
});

describe('seviyeTahmini', () => {
  it('hiç doğru yoksa açık düğüm yok, hedef zorluk en kolay işaretinki', () => {
    const { son } = oynat(isinmaBaslat(DUZEN, 8), [false, false]);
    const t = seviyeTahmini(son, DUZEN);
    expect(t.oturumIciAcikDugumler.size).toBe(0);
    expect(t.hedefZorlukBaslangici).toBe(harita.get(son.isaretler[0]!)!.difficulty);
  });

  it('geçilen işaretin sert ön koşulları (geçişli) açılır; ön koşulları bilinen düğümler açılır', () => {
    const { son } = oynat(isinmaBaslat(DUZEN, 8), Array(8).fill(true));
    const t = seviyeTahmini(son, DUZEN);
    const bilinen = new Set<SkillId>();
    const yigin = [...son.gecilen];
    while (yigin.length) {
      const id = yigin.pop()!;
      if (bilinen.has(id)) continue;
      bilinen.add(id);
      yigin.push(...sert(harita.get(id)!));
    }
    for (const id of bilinen) expect(t.oturumIciAcikDugumler.has(id), id).toBe(true);
    for (const id of t.oturumIciAcikDugumler) {
      expect(bilinen.has(id) || sert(harita.get(id)!).every((p) => bilinen.has(p)), id).toBe(true);
    }
    // ör. sert ön koşul zinciri: kardinalite ← birebir-esleme
    expect(bilinen.size).toBeGreaterThan(son.gecilen.size);
    expect(t.hedefZorlukBaslangici).toBeGreaterThanOrEqual(3);
  });

  it('tahmin oturum planını değiştirir: kayıtsız çocukta giriş noktası olmayan açık düğümler planlanır', () => {
    const { son } = oynat(isinmaBaslat(DUZEN, 8), Array(8).fill(true));
    const t = seviyeTahmini(son, DUZEN);
    const plan = (tahmin: typeof t | null) =>
      oturumBaslat(DUZEN, new Map(), 0, 1_000, 42, 7, [], [], null, tahmin).secilenSorular;
    const tahminsiz = plan(null);
    const tahminli = plan(t);
    expect(tahminsiz.every((s) => harita.get(s.skillId)!.isEntryPoint)).toBe(true);
    expect(tahminli.some((s) => !harita.get(s.skillId)!.isEntryPoint)).toBe(true);
    expect(oturumBaslat(DUZEN, new Map(), 0, 1_000, 42, 7, [], [], null)).toEqual(
      oturumBaslat(DUZEN, new Map(), 0, 1_000, 42, 7, [], [], null, null),
    );
  });
});

describe('gizlilik ve saflık (ADR-0007: sonuç hiçbir depoya yazılmaz)', () => {
  let sok: (() => void) | null = null;
  afterEach(() => {
    sok?.();
    sok = null;
  });

  it('tam ısınma + tahmin + planlama boyunca hiçbir tarayıcı deposuna yazılmaz', () => {
    const casus = depolamaCasusuKur();
    sok = casus.sok;
    for (const cevaplar of [Array(8).fill(true), [true, false, true, false, false], [false, false]]) {
      let d = isinmaBaslat(DUZEN, 8);
      for (const c of cevaplar) {
        if (d.bitti) break;
        secilenSoruyuUret(isinmaMaddesi(d, DUZEN, 5), DUZEN, 'kisisel');
        d = isinmaIlerlet(d, sonuc(c));
      }
      oturumBaslat(DUZEN, new Map(), 0, 1_000, 42, 7, [], [], null, seviyeTahmini(d, DUZEN));
    }
    expect(casus.cagrilar()).toEqual([]);
  });

  it('modül saat, rastgelelik ve kalıcılık katmanına dokunmaz; tahmin oturum nesnesine girmez', () => {
    const kaynak = readFileSync(resolve(__dirname, '../../src/progress/seviyeTespiti.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const yasak of ['Date.now', 'new Date', 'Math.random', 'persistence', 'localStorage', 'indexedDB', 'dexie']) {
      expect(kaynak, yasak).not.toContain(yasak);
    }
    const { son } = oynat(isinmaBaslat(DUZEN, 8), Array(8).fill(true));
    const oturum = oturumBaslat(DUZEN, new Map(), 0, 1_000, 42, 7, [], [], null, seviyeTahmini(son, DUZEN));
    expect(Object.keys(oturum).sort()).toEqual(
      [
        'baslangicMs',
        'cevaplar',
        'durum',
        'guncelSoruIndeksi',
        'oturumTohumu',
        'profilTohumu',
        'secilenSorular',
      ].sort(),
    );
    expect(JSON.stringify(oturum)).not.toMatch(/isinma|oturumIciAcik|hedefZorluk/);
  });

  it('aynı girdi → aynı ısınma (deterministik)', () => {
    const a = oynat(isinmaBaslat(DUZEN, 5), [true, true, false, true, false, false]);
    const b = oynat(isinmaBaslat(DUZEN, 5), [true, true, false, true, false, false]);
    expect(a.sorulan).toEqual(b.sorulan);
    expect(seviyeTahmini(a.son, DUZEN)).toEqual(seviyeTahmini(b.son, DUZEN));
  });
});
