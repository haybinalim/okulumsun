import { describe, expect, it } from 'vitest';
import { klipleriTopla, turkishNumber } from '../../scripts/ses/klipler';
import { AUDIO_MANIFEST } from '../../src/audio/audioManifest.generated';
import tr from '../../src/content/tr.json';

describe('ses klibi çıkarımı', () => {
  const klipler = klipleriTopla(tr as Record<string, unknown>);

  it('gerçek tr.json\'dan 287 klip üretir', () => {
    expect(klipler).toHaveLength(287);
  });

  it('Türkçe sayı adları', () => {
    expect(turkishNumber(0)).toBe('sıfır');
    expect(turkishNumber(17)).toBe('on yedi');
    expect(turkishNumber(40)).toBe('kırk');
    expect(turkishNumber(100)).toBe('yüz');
    expect(turkishNumber(200)).toBe('iki yüz');
    expect(() => turkishNumber(150)).toThrow(RangeError);
  });

  it('generate-audio manifestiyle aynı anahtar kümesi ve dosyalar', () => {
    const manifest = AUDIO_MANIFEST as Record<string, { file: string; core: boolean }>;
    expect(new Set(klipler.map((k) => k.key))).toEqual(new Set(Object.keys(manifest)));
    for (const k of klipler) {
      expect(manifest[k.key]).toEqual({ file: k.file, core: k.core });
    }
  });

  it('$ ile başlayan notlar klip üretmez', () => {
    expect(klipler.some((k) => k.key.includes('$'))).toBe(false);
  });
});
