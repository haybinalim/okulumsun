import { describe, expect, it } from 'vitest';
import { gorselErisimEtiketi, secenekErisimEtiketi } from '../../src/ui/primitives/choiceErisim';

describe('seçenek erişim etiketleri', () => {
  it('nesne kümesini adet, renk ve nesne adıyla açıklar', () => {
    expect(
      secenekErisimEtiketi({
        tur: 'gorsel',
        gorsel: { type: 'nesneKumesi', sprite: 'elma', adet: 3, layout: 'sira', renk: 'yesil' },
      }),
    ).toBe('Seçenek: 3 yeşil elma');
  });

  it('banknotu belirsiz örnek görsel yerine kupürüyle açıklar', () => {
    expect(secenekErisimEtiketi({ tur: 'banknot', deger: 20 })).toBe('Seçenek: 20 Türk lirası banknotu');
  });

  it('konum görselinde hedef ve ilişkiyi açıklar', () => {
    expect(
      gorselErisimEtiketi({
        type: 'konumSahnesi',
        hedef: 'top',
        referans: 'kutu',
        iliski: 'icinde',
      }),
    ).toBe('top kutunun içinde');
  });

  it('seçenek etiketinde hiçbir genel görsel ifade bırakmaz', () => {
    const etiket = secenekErisimEtiketi({
      tur: 'gorsel',
      gorsel: { type: 'sekil', sekil: 'ucgen', renk: 'sari' },
    });

    expect(etiket).toBe('Seçenek: sarı üçgen');
    expect(etiket).not.toContain('görsel seçenek');
  });
});
