import { describe, expect, it } from 'vitest';
import { OVGU_SAYISI, TEKRAR_SAYISI, randomPraise, randomRetry, type SpeakSource } from '../../src/audio/speech';
import { AUDIO_MANIFEST } from '../../src/audio/audioManifest.generated';

const anahtar = (s: SpeakSource): string => {
  if (s.kind !== 'key') throw new Error('anahtar bekleniyordu');
  return s.key;
};

describe('deterministik geri bildirim sesi (Adım 24)', () => {
  it('aynı tohum → aynı klip', () => {
    expect(anahtar(randomPraise('madde-1'))).toBe(anahtar(randomPraise('madde-1')));
    expect(anahtar(randomRetry('madde-1', 2))).toBe(anahtar(randomRetry('madde-1', 2)));
  });

  it('1000 farklı tohumda 6 övgünün her biri ≥%12 seçilir', () => {
    const sayac = new Map<string, number>();
    for (let i = 0; i < 1000; i++) {
      const k = anahtar(randomPraise(`say.n5:${i}`));
      sayac.set(k, (sayac.get(k) ?? 0) + 1);
    }
    expect(sayac.size).toBe(OVGU_SAYISI);
    for (const n of sayac.values()) expect(n).toBeGreaterThanOrEqual(120);
  });

  it('aynı maddede ardışık denemeler farklı tekrar klibi çalar', () => {
    for (let i = 0; i < 200; i++) {
      const tohum = `madde-${i}`;
      for (let d = 1; d < 5; d++) {
        expect(anahtar(randomRetry(tohum, d))).not.toBe(anahtar(randomRetry(tohum, d + 1)));
      }
    }
  });

  it('dönen anahtarlar AUDIO_MANIFEST\'te var', () => {
    for (let i = 0; i < 300; i++) {
      expect(AUDIO_MANIFEST).toHaveProperty(anahtar(randomPraise(`t${i}`)));
      for (let d = 1; d <= TEKRAR_SAYISI; d++) expect(AUDIO_MANIFEST).toHaveProperty(anahtar(randomRetry(`t${i}`, d)));
    }
  });
});
