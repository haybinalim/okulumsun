/**
 * Plan v2 Adım 37 aşama 1 (KG-48): 2026–2027 öğretim takvimi ve haftalık MEB planı (SAF).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { kazanimlariDogrula } from '../../src/content/schema/kazanim';
import { PlanDuzeltmeleriSchema } from '../../src/content/schema/haftalikPlan';
import { OGRETIM_HAFTALARI, TATIL_HAFTALARI, haftaninPazartesisi } from '../../src/content/okulTakvimi';
import { acilanTemalar } from '../../src/content/okulAyi';
import { skillsData } from '../../src/content/skillsData';
import { buHafta, haftalikPlanUret, okulAyiIndeksi } from '../../src/ogretmen/haftalikPlan';

const oku = (rel: string): unknown => JSON.parse(readFileSync(path.resolve(__dirname, '../..', rel), 'utf8'));
const kazanimlar = kazanimlariDogrula(oku('src/content/kazanimlar.json'));
const duzeltmeler = PlanDuzeltmeleriSchema.parse(oku('src/content/planDuzeltmeleri.json'));
const plan = haftalikPlanUret(kazanimlar, OGRETIM_HAFTALARI, skillsData, duzeltmeler);

describe('okul takvimi 2026–2027', () => {
  it('14 Eylül 2026 – 21 Haziran 2027 pazartesileri, tatil haftaları hariç: 37 hafta', () => {
    expect(OGRETIM_HAFTALARI[0]).toMatchObject({ no: 1, pazartesi: '2026-09-14' });
    expect(OGRETIM_HAFTALARI.at(-1)?.pazartesi).toBe('2027-06-21');
    expect(OGRETIM_HAFTALARI).toHaveLength(37);
    expect(OGRETIM_HAFTALARI.map((h) => h.no)).toEqual(OGRETIM_HAFTALARI.map((_, i) => i + 1));
  });
  it('tatil haftası yok; her pazartesi gerçekten pazartesi', () => {
    for (const h of OGRETIM_HAFTALARI) {
      expect(TATIL_HAFTALARI[h.pazartesi]).toBeUndefined();
      expect(new Date(`${h.pazartesi}T00:00:00Z`).getUTCDay()).toBe(1);
    }
    expect(Object.keys(TATIL_HAFTALARI)).toEqual(['2026-11-16', '2027-01-25', '2027-02-01', '2027-03-08']);
  });
  it('haftanın pazartesisi', () => {
    expect(haftaninPazartesisi('2026-10-18')).toBe('2026-10-12'); // pazar
    expect(haftaninPazartesisi('2026-10-13')).toBe('2026-10-12');
    expect(haftaninPazartesisi('2026-10-12')).toBe('2026-10-12');
  });
});

describe('haftalık plan', () => {
  it('her takvim haftasına bir satır', () => {
    expect(plan).toHaveLength(OGRETIM_HAFTALARI.length);
  });
  it('19 kazanımın hepsi plana dağılır ve öğretim sırası korunur', () => {
    const ilkHafta = new Map<string, number>();
    for (const p of plan) for (const k of p.kazanimKodlari) if (!ilkHafta.has(k)) ilkHafta.set(k, p.hafta.no);
    expect(ilkHafta.size).toBe(kazanimlar.kazanimlar.length);
    const sirali = [...kazanimlar.kazanimlar].sort((a, b) => a.ogretimSirasi - b.ogretimSirasi);
    for (let i = 1; i < sirali.length; i++) {
      expect(ilkHafta.get(sirali[i].kod)!).toBeGreaterThanOrEqual(ilkHafta.get(sirali[i - 1].kod)!);
    }
  });
  it('tema saatleri haftalara orantılı: tema 1 (15 saat) ilk 3 hafta', () => {
    expect(plan.slice(0, 3).every((p) => p.temaNo === 1)).toBe(true);
    expect(plan[3].temaNo).toBe(2);
  });
  it('program saatleri (172) bittikten sonraki haftalar okul temelli / tekrar', () => {
    const programHaftasi = Math.ceil(172 / kazanimlar.haftalikDersSaati);
    expect(plan.slice(programHaftasi).every((p) => p.temaNo === null && p.kazanimKodlari.length === 0)).toBe(true);
    expect(plan[programHaftasi - 1].temaNo).not.toBeNull();
  });
  it('her hazır düğüm en az bir haftada', () => {
    const plandaki = new Set(plan.flatMap((p) => p.dugumler));
    for (const d of skillsData.filter((x) => x.durum === 'hazir')) expect(plandaki.has(d.id), d.id).toBe(true);
  });
  it('okulAyi.ts ile çelişmez: haftanın teması o ay açık', () => {
    for (const p of plan) {
      if (p.temaNo == null) continue;
      expect(acilanTemalar(okulAyiIndeksi(p.hafta.pazartesi)), `${p.hafta.pazartesi} tema ${p.temaNo}`).toContain(
        p.temaNo,
      );
    }
  });
  it('buHafta sınırları: pazartesi, pazar, tatil, yıl dışı', () => {
    expect(buHafta(plan, '2026-09-14')?.hafta.no).toBe(1);
    expect(buHafta(plan, '2026-09-20')?.hafta.no).toBe(1);
    expect(buHafta(plan, '2026-09-21')?.hafta.no).toBe(2);
    expect(buHafta(plan, '2026-11-18')).toBeNull();
    expect(buHafta(plan, '2027-01-28')).toBeNull();
    expect(buHafta(plan, '2027-07-01')).toBeNull();
    expect(buHafta(plan, '2026-09-13')).toBeNull();
    expect(buHafta(plan, 'dün')).toBeNull();
  });
  it('determinizm: aynı girdi → aynı plan', () => {
    expect(haftalikPlanUret(kazanimlar, OGRETIM_HAFTALARI, skillsData, duzeltmeler)).toEqual(plan);
  });
  it('elle düzeltme haftanın kazanımlarını ve gerekçesini değiştirir', () => {
    const d = PlanDuzeltmeleriSchema.parse({
      $aciklama: 'test',
      okulYili: '2026-2027',
      duzeltmeler: [{ hafta: 2, kazanimKodlari: ['MAT.1.1.1'], gerekce: 'Okul planı sayılarla başlıyor' }],
    });
    const p = haftalikPlanUret(kazanimlar, OGRETIM_HAFTALARI, skillsData, d)[1];
    expect(p.kazanimKodlari).toEqual(['MAT.1.1.1']);
    expect(p.temaNo).toBe(2);
    expect(p.duzeltme).toBe('Okul planı sayılarla başlıyor');
  });
  it('düzeltme şeması: aynı hafta iki kez ve bozuk kod reddedilir', () => {
    const ham = { $aciklama: 'x', okulYili: '2026-2027' };
    const kayit = { hafta: 1, kazanimKodlari: ['MAT.1.1.1'], gerekce: 'neden' };
    expect(PlanDuzeltmeleriSchema.safeParse({ ...ham, duzeltmeler: [kayit, kayit] }).success).toBe(false);
    expect(
      PlanDuzeltmeleriSchema.safeParse({ ...ham, duzeltmeler: [{ ...kayit, kazanimKodlari: ['MAT.9.1'] }] }).success,
    ).toBe(false);
  });
});
