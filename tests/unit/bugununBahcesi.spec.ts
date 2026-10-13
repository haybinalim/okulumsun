// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../src/store/appStore';
import { depolamaCasusuKur } from './yardimci/depolamaCasusu';

describe('bugünün bahçesi', () => {
  beforeEach(() => useAppStore.getState().sifirla());
  it('tamamlanan oturumla artar', () => {
    const { oturumuTamamla } = useAppStore.getState();
    oturumuTamamla();
    oturumuTamamla();
    expect(useAppStore.getState().bugunTamamlanan).toBe(2);
  });
  it('yenilemede (sıfırla) sıfırlanır ve depoya yazılmaz', () => {
    const casus = depolamaCasusuKur();
    useAppStore.getState().oturumuTamamla();
    expect(casus.cagrilar()).toHaveLength(0);
    casus.sok();
    useAppStore.getState().sifirla();
    expect(useAppStore.getState().bugunTamamlanan).toBe(0);
  });
});
