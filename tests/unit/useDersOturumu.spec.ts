import { beforeEach, describe, expect, it } from 'vitest';
import { useDersOturumu } from '../../src/ui/useDersOturumu';

describe('useDersOturumu (Adım 40 aşama 2)', () => {
  beforeEach(() => useDersOturumu.getState().dersiKapat());

  it('olayları bellekte biriktirir, dersiKapat temizler', () => {
    const olay = { skillId: 'x' as never, ilkDenemeDogru: true, yardimKademesi: 0 as const, tani: null };
    useDersOturumu.getState().kaydet(olay);
    useDersOturumu.getState().kaydet(olay);
    expect(useDersOturumu.getState().olaylar).toHaveLength(2);
    useDersOturumu.getState().dersiKapat();
    expect(useDersOturumu.getState().olaylar).toHaveLength(0);
  });

});
