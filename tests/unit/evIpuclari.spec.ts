/** Plan v2 Adım 43: ev ipuçları verisi ve şeması. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EvIpuclariSchema } from '../../src/content/schema/evIpucu';

const ham = JSON.parse(readFileSync(path.resolve(__dirname, '../../src/content/evIpuclari.json'), 'utf8'));

describe('evIpuclari.json', () => {
  it('şemaya uyar; 7 temanın hepsi var', () => {
    const d = EvIpuclariSchema.parse(ham);
    expect(d.ipuclari.map((x) => x.tema).sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("'yanlış' sözcüğü geçmez", () => {
    expect(JSON.stringify(ham).toLowerCase()).not.toMatch(/yanl[ıi]ş/);
  });
  it('eksik tema ve yinelenen tema reddedilir', () => {
    expect(EvIpuclariSchema.safeParse({ ...ham, ipuclari: ham.ipuclari.slice(1) }).success).toBe(false);
    expect(EvIpuclariSchema.safeParse({ ...ham, ipuclari: [...ham.ipuclari, ham.ipuclari[0]] }).success).toBe(false);
  });
  it("'yanlış' içeren cümle reddedilir", () => {
    const k = structuredClone(ham);
    k.ipuclari[0].soru = 'Bu cevap yanlış değil mi, sence?';
    expect(EvIpuclariSchema.safeParse(k).success).toBe(false);
  });
});
