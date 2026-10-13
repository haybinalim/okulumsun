/**
 * Plan v2 Adım 38 (G41, KG-51): tanıtımda yazılacak içerik hacmi ölçülmüş olmalı.
 * `docs/tekil-soru-sayisi.json` kodla aynı kalmalı (bayatlık kapısı); imza tohum/yerleşim/sıra farkını saymaz.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../../src/exercises/registry';
import { olc, soruImzasi, type TekilSoruOlcumu } from '../../scripts/tekil-soru-sayisi';

const kayit = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../docs/tekil-soru-sayisi.json'), 'utf8'),
) as TekilSoruOlcumu;

describe('tekil soru sayısı', () => {
  it('imza: kimlik, tohum, yerleşim, renk ve dizi sırası farkı yeni soru sayılmaz', () => {
    const a = {
      itemId: 'M-X#1',
      seed: 1,
      prompt: { gorsel: { parcalar: [{ sekil: 'kare', renk: 'mor', konum: { x: 0.1 } }, { sekil: 'ucgen' }] } },
      options: [
        { id: 's-0', deger: 3 },
        { id: 's-1', deger: 4 },
      ],
    };
    const b = {
      itemId: 'M-X#2',
      seed: 2,
      prompt: { gorsel: { parcalar: [{ sekil: 'ucgen' }, { sekil: 'kare', renk: 'mavi', konum: { x: 0.7 } }] } },
      options: [
        { id: 's-1', deger: 4 },
        { id: 's-0', deger: 3 },
      ],
    };
    expect(soruImzasi(a)).toBe(soruImzasi(b));
    expect(soruImzasi(a)).not.toBe(
      soruImzasi({
        ...b,
        options: [
          { id: 's-0', deger: 5 },
          { id: 's-1', deger: 4 },
        ],
      }),
    );
  });

  it('kayıt tüm şablonları kapsar; toplam = şablonların toplamı', () => {
    expect(Object.keys(kayit.sablonlar).sort()).toEqual([...REGISTRY.keys()].sort());
    expect(kayit.toplam).toBe(Object.values(kayit.sablonlar).reduce((x, y) => x + y, 0));
    expect(kayit.tohumSayisi).toBe(10_000);
  });

  it('bayatlık: docs/tekil-soru-sayisi.json kodla aynı (npm run tekil-soru -- --yaz)', () => {
    expect(olc()).toEqual(kayit);
  }, 120_000);
});
