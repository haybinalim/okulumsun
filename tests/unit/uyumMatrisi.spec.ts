import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { matrisiUret } from '../../scripts/meb-uyum-matrisi';
import { uyumMatrisi, uyumOzeti } from '../../scripts/basvuru/uyumMatrisi';
import { sayilariTopla } from '../../scripts/durum';

/** Plan v2 Adım 56 aşama 2: MEB uyum matrisi (başvuru eki) — kapsam ve bayatlık. */
describe('MEB uyum matrisi', () => {
  const { md, csv, ozet } = matrisiUret();

  it('19/19 öğrenme çıktısı en az bir hazır beceri ve kayıtlı şablonla kapsanır (K8 kazanım sayısıyla aynı)', async () => {
    expect(ozet.kazanim).toBe(19);
    expect(ozet.kapsanan).toBe(19);
    expect(ozet.kazanim).toBe((await sayilariTopla(process.cwd())).kazanim);
  });

  it('depodaki Markdown ve CSV üretilmiş hâliyle aynı (npm run uyum-matrisi)', () => {
    expect(readFileSync('docs/basvuru/meb-uyum-matrisi.md', 'utf8')).toBe(md);
    expect(readFileSync('docs/basvuru/meb-uyum-matrisi.csv', 'utf8')).toBe(csv);
    expect(md).toContain(`durum:uyum_kazanim=19 durum:uyum_kapsanan=19`);
  });

  it('hazır olmayan beceri veya kayıtsız şablon kapsam saymaz; satırlar öğretim sırasıyla', () => {
    const k = (kod: string, sira: number) => ({
      kod,
      ogretimSirasi: sira,
      resmiMetin: 'x|y',
      tema: { no: 1, ad: 'T' },
      surecBilesenleri: [{ harf: 'a', metin: 'm' }],
    });
    const satirlar = uyumMatrisi(
      [k('MAT.1.1.2', 2), k('MAT.1.1.1', 1), k('MAT.1.1.3', 3)],
      [
        { id: 'b1', baslik: 'B1', mebOutcomes: ['MAT.1.1.1'], exerciseTemplates: ['T1'], durum: 'hazir' },
        { id: 'b2', baslik: 'B2', mebOutcomes: ['MAT.1.1.2'], exerciseTemplates: ['T2'], durum: 'taslak' },
        { id: 'b3', baslik: 'B3', mebOutcomes: ['MAT.1.1.3'], exerciseTemplates: ['YOK'], durum: 'hazir' },
      ],
      (t) => t !== 'YOK',
      (id) => (id === 'b1' ? 'b8' : null),
    );
    expect(satirlar.map((s) => [s.kod, s.kapsandi])).toEqual([
      ['MAT.1.1.1', true],
      ['MAT.1.1.2', false],
      ['MAT.1.1.3', false],
    ]);
    expect(satirlar[0]!.beceriler[0]!.dugumKodu).toBe('b8');
    expect(uyumOzeti(satirlar)).toEqual({ kazanim: 3, kapsanan: 1, beceri: 2, sablon: 2 });
  });
});
