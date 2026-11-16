import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cakismaOzeti, harfCakismalari } from '../../scripts/denetim/harfCakismasi';

/**
 * macOS (harfe duyarsız FS) ile Linux CI (duyarlı) arasındaki boşluk: yalnız harf büyüklüğüyle
 * ayrışan dosya/klasör adları Linux'ta sorunsuz, macOS'ta `tsc` TS1149 ile kırılır.
 * Kural ayrıntısı: scripts/denetim/harfCakismasi.ts
 */
const kok = resolve(__dirname, '../..');

describe('dosya adı harf çakışması: kural', () => {
  it('TurEkrani.tsx ile turEkrani.ts çakışır (uzantısız import hangisini çözer?)', () => {
    const c = harfCakismalari(['src/a/TurEkrani.tsx', 'src/a/turEkrani.ts']);
    expect(c).toHaveLength(1);
    expect(c[0].tur).toBe('modul');
    expect(c[0].yollar).toEqual(['src/a/TurEkrani.tsx', 'src/a/turEkrani.ts']);
  });

  it('farklı klasörlerdeki aynı ad (a/B.ts, b/B.ts) çakışma değildir', () => {
    expect(harfCakismalari(['a/B.ts', 'b/B.ts'])).toEqual([]);
  });

  it('klasör adının iki harf yazımı çakışır (src/UI, src/ui)', () => {
    const c = harfCakismalari(['src/UI/x.ts', 'src/ui/y.ts']);
    expect(c).toHaveLength(1);
    expect(c[0].tur).toBe('yol');
    expect(c[0].yollar).toEqual(['src/UI', 'src/ui']);
  });

  it('aynı tam yol yalnız harf farkıyla çakışır (modül olmayan dosya da)', () => {
    const c = harfCakismalari(['a/Logo.png', 'a/logo.png']);
    expect(c).toHaveLength(1);
    expect(c[0].tur).toBe('yol');
  });

  it('modül olmayan dosyalar aynı gövdeyle (a/Foo.png, a/foo.json) çakışmaz', () => {
    expect(harfCakismalari(['a/Foo.png', 'a/foo.json'])).toEqual([]);
  });

  it('gövdesi birebir aynı modüller (a.ts, a.tsx) harf sorunu sayılmaz', () => {
    expect(harfCakismalari(['src/a.ts', 'src/a.tsx', 'src/a.d.ts'])).toEqual([]);
  });

  it('Türkçe I/ı tuzağı: düz toLowerCase yerelden bağımsız: Iş/iş ve Is/is çakışır, ış/iş (ı ≠ i) çakışmaz', () => {
    expect(harfCakismalari(['a/Iş.ts', 'a/iş.ts'])).toHaveLength(1);
    expect(harfCakismalari(['a/Is.ts', 'a/is.ts'])).toHaveLength(1);
    expect(harfCakismalari(['a/ış.ts', 'a/iş.ts'])).toEqual([]);
  });

  it('çakışan klasörün altındaki dosyalar ayrıca modül çakışması olarak tekrar bildirilmez', () => {
    const c = harfCakismalari(['src/UI/x.ts', 'src/ui/x.ts']);
    expect(c.map((x) => x.tur)).toEqual(['yol']);
  });

  it('çakışmayan gerçekçi liste boş döner', () => {
    expect(harfCakismalari(['src/ui/tur/TurEkrani.tsx', 'src/ui/tur/turEkraniDurumu.ts', 'README.md'])).toEqual([]);
  });
});

describe('dosya adı harf çakışması: depo', () => {
  it('git ls-files çıktısında çakışma yok', () => {
    let cikti: string;
    try {
      cikti = execFileSync('git', ['ls-files', '-z'], { cwd: kok, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (e) {
      // git yoksa ya da depo değilse atlama: sessiz geçmek denetimi boşa çıkarır.
      throw new Error(`git ls-files çalışmadı; denetim yapılamadı: ${(e as Error).message}`, { cause: e });
    }
    const yollar = cikti.split('\0').filter(Boolean);
    // Boş/şüpheli çıktı "0 çakışma" diye geçmesin.
    expect(yollar.length, 'git ls-files boş döndü').toBeGreaterThan(100);
    expect(yollar, 'beklenen dosya listede yok').toContain('package.json');
    const c = harfCakismalari(yollar);
    expect(c, `harf çakışması:\n${cakismaOzeti(c)}`).toEqual([]);
  });
});
