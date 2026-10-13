// @vitest-environment happy-dom
/**
 * Plan v2 Adım 37 aşama 2 (KG-50): yıllık plan veri bağlama, varsayılan hafta, set düğümleri, yerel indirme.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OGRETIM_HAFTALARI } from '../../src/content/okulTakvimi';
import { REGISTRY } from '../../src/exercises/registry';
import { SET_EN_FAZLA_DUGUM, setlenebilirDugumler } from '../../src/ogretmen/gunlukSet';
import { haftaSetDugumleri, varsayilanHaftaIndeksi, type PlanHaftasi } from '../../src/ogretmen/haftalikPlan';
import { CSV_BOM, planCsv, planHtml } from '../../src/ogretmen/planDisaAktar';
import { PLAN_BASLIGI, PLAN_ETIKETLERI, YILLIK_PLAN, buHaftaninOnerisi } from '../../src/ogretmen/yillikPlan';
import { dosyaIndir, yerelGun } from '../../src/platform/dosyaIndir';
import type { SkillId } from '../../src/exercises/types';

const uygun = setlenebilirDugumler((t) => REGISTRY.has(t));

describe('yıllık plan (uygulama verisiyle)', () => {
  it('takvimin her haftasına bir satır; her satırın düğümleri hazır', () => {
    expect(YILLIK_PLAN).toHaveLength(OGRETIM_HAFTALARI.length);
    expect(YILLIK_PLAN[0].hafta.no).toBe(1);
  });
  it('program haftalarının hepsinde setlenebilir en az bir etkinlik var', () => {
    for (const p of YILLIK_PLAN.filter((x) => x.temaNo != null)) {
      expect(haftaSetDugumleri(p, uygun, SET_EN_FAZLA_DUGUM).dugumler.length, `hafta ${p.hafta.no}`).toBeGreaterThan(0);
    }
  });
  it('etiketler: tema adı ve çocuk etiketi', () => {
    expect(PLAN_ETIKETLERI.tema(1)).toBe('Yön ve Yerler');
    expect(PLAN_ETIKETLERI.tema(99)).toBe('Tema 99');
    const ilk = YILLIK_PLAN[0].dugumler[0];
    expect(PLAN_ETIKETLERI.dugum(ilk)).not.toBe(ilk);
  });
  it('dışa aktarım uygulama verisiyle: 37 satır + başlık, BOM, HTML başlığı', () => {
    const csv = planCsv(YILLIK_PLAN, PLAN_ETIKETLERI);
    expect(csv.startsWith(CSV_BOM + 'Hafta;Pazartesi;Tema')).toBe(true);
    expect(csv.trimEnd().split('\r\n')).toHaveLength(YILLIK_PLAN.length + 1);
    expect(planHtml(YILLIK_PLAN, PLAN_ETIKETLERI, PLAN_BASLIGI)).toContain(
      '<title>1. sınıf matematik haftalık plan 2026-2027</title>',
    );
  });
});

describe('varsayılan hafta', () => {
  it('öğretim haftasında o hafta; pazar günü aynı hafta', () => {
    expect(YILLIK_PLAN[varsayilanHaftaIndeksi(YILLIK_PLAN, '2026-10-13')].hafta.pazartesi).toBe('2026-10-12');
    expect(YILLIK_PLAN[varsayilanHaftaIndeksi(YILLIK_PLAN, '2026-10-18')].hafta.pazartesi).toBe('2026-10-12');
  });
  it('tatil haftasında sıradaki öğretim haftası', () => {
    expect(YILLIK_PLAN[varsayilanHaftaIndeksi(YILLIK_PLAN, '2026-11-18')].hafta.pazartesi).toBe('2026-11-23');
    expect(YILLIK_PLAN[varsayilanHaftaIndeksi(YILLIK_PLAN, '2027-01-28')].hafta.pazartesi).toBe('2027-02-08');
  });
  it('yıl başlamadan ilk, bittikten sonra son hafta; bozuk tarih ilk; boş plan -1', () => {
    expect(varsayilanHaftaIndeksi(YILLIK_PLAN, '2026-08-01')).toBe(0);
    expect(varsayilanHaftaIndeksi(YILLIK_PLAN, '2027-08-01')).toBe(YILLIK_PLAN.length - 1);
    expect(varsayilanHaftaIndeksi(YILLIK_PLAN, 'yarın')).toBe(0);
    expect(varsayilanHaftaIndeksi([], '2026-10-13')).toBe(-1);
  });
});

describe('haftanın set düğümleri ve öneri', () => {
  const sahte = (dugumler: string[]): PlanHaftasi => ({
    hafta: OGRETIM_HAFTALARI[0],
    temaNo: 1,
    kazanimKodlari: [],
    dugumler: dugumler as SkillId[],
  });
  it('setlenemeyenler atlanır, sıra korunur, en çok N', () => {
    const u = new Set(['a', 'b', 'c', 'd', 'e'] as SkillId[]);
    expect(haftaSetDugumleri(sahte(['x', 'a', 'b']), u, 4)).toEqual({ dugumler: ['a', 'b'], kirpildi: false });
    expect(haftaSetDugumleri(sahte(['a', 'b', 'c', 'd', 'e']), u, 4)).toEqual({
      dugumler: ['a', 'b', 'c', 'd'],
      kirpildi: true,
    });
  });
  it('bu haftanın önerisi: öğretim haftasında 1–4 düğüm, tatilde null', () => {
    const o = buHaftaninOnerisi('2026-10-13', uygun);
    expect(o?.hafta.hafta.no).toBe(5);
    expect(o!.dugumler.length).toBeGreaterThan(0);
    expect(o!.dugumler.length).toBeLessThanOrEqual(SET_EN_FAZLA_DUGUM);
    for (const d of o!.dugumler) expect(uygun.has(d)).toBe(true);
    expect(buHaftaninOnerisi('2026-11-18', uygun)).toBeNull();
    expect(buHaftaninOnerisi('2027-07-01', uygun)).toBeNull();
  });
});

describe('yerel indirme', () => {
  afterEach(() => vi.restoreAllMocks());
  it('yerelGun yerel takvim gününü verir', () => {
    expect(yerelGun(new Date(2026, 9, 13, 23, 59))).toBe('2026-10-13');
    expect(yerelGun(new Date(2027, 0, 5, 0, 1))).toBe('2027-01-05');
  });
  it("Blob URL + <a download>; bağlantı DOM'da kalmaz; ağ çağrısı yok", () => {
    vi.useFakeTimers();
    const olustur = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:yerel/1');
    const birak = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const fetchCasus = vi.fn();
    vi.stubGlobal('fetch', fetchCasus);
    let tiklanan: HTMLAnchorElement | null = null;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      tiklanan = this;
    });
    dosyaIndir('plan.csv', `${CSV_BOM}a;b`, 'text/csv;charset=utf-8');
    expect(olustur).toHaveBeenCalledTimes(1);
    expect((olustur.mock.calls[0][0] as Blob).type).toBe('text/csv;charset=utf-8');
    expect(tiklanan!.download).toBe('plan.csv');
    expect(tiklanan!.getAttribute('href')).toBe('blob:yerel/1');
    expect(document.querySelectorAll('a').length).toBe(0);
    expect(birak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10_000);
    expect(birak).toHaveBeenCalledWith('blob:yerel/1');
    expect(fetchCasus).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
