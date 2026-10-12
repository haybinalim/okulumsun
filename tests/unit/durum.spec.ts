import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { agacUret, blokOku, denetle, sayilariTopla } from '../../scripts/durum';

/** Bayatlık kapısı K8 (plan v2 Adım 19). */
const kok = resolve(__dirname, '../..');
const oku = (yol: string) => readFileSync(resolve(kok, yol), 'utf8');

describe('durum denetimi (K8)', () => {
  it('şablon defteri skills.json ile eşit (39) ve ses anahtarı = ses dosyası', async () => {
    const s = await sayilariTopla(kok);
    expect(s.sablonDefter).toBe(s.sablonSkills);
    expect(s.sablonDefter).toBe(39);
    expect(s.sesAnahtari).toBe(s.sesDosyasi);
  });

  it('blokOku bozuk blokta boş döner', () => {
    expect(blokOku('<!-- durum: -->')).toEqual({});
    expect(blokOku('durum:ses=287')).toEqual({});
    expect(blokOku('<!-- durum:ses=287 durum:kazanim=19 -->')).toEqual({ ses: '287', kazanim: '19' });
  });

  it("denetle eski '171 klip' bloğunu yakalar", async () => {
    const s = await sayilariTopla(kok);
    const sorunlar = denetle(s, { 'PROGRESS.md': '<!-- durum:ses=171 durum:birim_test=1 -->' });
    expect(sorunlar).toEqual([`PROGRESS.md: durum:ses beklenen ${s.sesDosyasi}, yazılan 171`]);
  });

  it('bilinmeyen anahtar ve eksik blok raporlanır; birim_test elle girilir, denetlenmez', async () => {
    const s = await sayilariTopla(kok);
    expect(denetle(s, { 'a.md': '<!-- durum:uydurma=1 -->' })).toEqual(['a.md: bilinmeyen anahtar durum:uydurma']);
    expect(denetle(s, { 'b.md': 'blok yok' })[0]).toMatch(/durum bloğu yok/);
    expect(denetle(s, { 'c.md': '<!-- durum:birim_test=99999 -->' })).toEqual([]);
  });

  it('depodaki PROGRESS ve PLAN blokları ile PLAN §12 ağacı güncel', async () => {
    const s = await sayilariTopla(kok);
    const belgeler = { 'docs/PROGRESS.md': oku('docs/PROGRESS.md'), 'docs/PLAN.md': oku('docs/PLAN.md') };
    expect(denetle(s, belgeler, agacUret(kok))).toEqual([]);
  });

  it('PLAN.md ağacı bayatsa yakalanır', async () => {
    const s = await sayilariTopla(kok);
    const asil = oku('docs/PLAN.md');
    const bas = asil.indexOf('<!-- agac:basla -->');
    // Yalnız üretilmiş bloktaki bir klasör adını boz (elle yazılmış hedef ağaç değil).
    const plan = asil.slice(0, bas) + asil.slice(bas).replace('│   └── ses/', '│   └── sesler/');
    expect(plan).not.toBe(asil);
    expect(denetle(s, { 'docs/PLAN.md': plan }, agacUret(kok))).toContain('docs/PLAN.md: §12 ağacı bayat (npm run durum -- --agac)');
  });
});
