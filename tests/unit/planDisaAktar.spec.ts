/**
 * Plan v2 Adım 37 aşama 1 (KG-48): haftalık planın CSV/HTML dışa aktarımı (SAF metin).
 */
import { describe, expect, it } from 'vitest';
import { CSV_BASLIKLARI, CSV_BOM, planCsv, planHtml } from '../../src/ogretmen/planDisaAktar';
import type { PlanHaftasi } from '../../src/ogretmen/haftalikPlan';

const plan: PlanHaftasi[] = [
  {
    hafta: { no: 1, pazartesi: '2026-09-14' },
    temaNo: 1,
    kazanimKodlari: ['MAT.1.3.1'],
    dugumler: ['mat.uzam.konum-ifadeleri'],
  },
  {
    hafta: { no: 7, pazartesi: '2026-10-26', not: '29 Ekim; "Cumhuriyet"' },
    temaNo: null,
    kazanimKodlari: [],
    dugumler: [],
    duzeltme: 'okul <planı>',
  },
];
const e = { tema: (no: number) => `Tema ${no}`, dugum: (id: string) => (id.endsWith('ifadeleri') ? 'Nerede?' : id) };

describe('planCsv', () => {
  const csv = planCsv(plan, e);
  it('UTF-8 BOM ile başlar, başlıklar doğru, CRLF', () => {
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    const satirlar = csv.slice(1).split('\r\n');
    expect(satirlar[0]).toBe(CSV_BASLIKLARI.join(';'));
    expect(satirlar[0]).toBe('Hafta;Pazartesi;Tema;Kazanımlar;Etkinlikler;Not');
    expect(satirlar).toHaveLength(plan.length + 2); // başlık + satırlar + sondaki boş
  });
  it('Türkçe tarih, etiketler, kaçış', () => {
    const satirlar = csv.slice(1).split('\r\n');
    expect(satirlar[1]).toBe('1;14.09.2026;Tema 1;MAT.1.3.1;Nerede?;');
    expect(satirlar[2]).toContain('Okul temelli planlama / tekrar');
    expect(satirlar[2]).toContain('"29 Ekim; ""Cumhuriyet"" · Düzeltme: okul <planı>"');
  });
});

describe('planHtml', () => {
  const html = planHtml(plan, e, 'Haftalık plan 2026–2027');
  it('tek dosya, dış kaynak yok, HTML kaçışı', () => {
    expect(html).toContain('<html lang="tr">');
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/<script|<link/);
    expect(html).toContain('okul &lt;planı&gt;');
    expect(html.match(/<tr>/g)).toHaveLength(plan.length + 1);
  });
});
