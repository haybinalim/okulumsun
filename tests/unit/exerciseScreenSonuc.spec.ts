import { describe, expect, it } from 'vitest';
import { basitMaddeSonucu } from '../../src/progress/basitMaddeSonucu';

describe('basitMaddeSonucu (ExerciseScreen onDone → MaddeSonuc)', () => {
  it('MaddeSonuc taşır: doğru, yardımsız, gecikme ve zaman', () => {
    expect(basitMaddeSonucu(true, 1000, 4500)).toEqual({
      dogru: true,
      kullanilanYardimKademesi: 0,
      latencyMs: 3500,
      tani: null,
      zamanMs: 4500,
    });
  });
  it('negatif gecikme 0 olur; yanlış cevap korunur', () => {
    const s = basitMaddeSonucu(false, 5000, 4000);
    expect(s.latencyMs).toBe(0);
    expect(s.dogru).toBe(false);
  });
  it('kişisel oturum sonuc.dogru ile aynı davranır', () => {
    expect(basitMaddeSonucu(true, 0, 1).dogru).toBe(true);
  });
});
