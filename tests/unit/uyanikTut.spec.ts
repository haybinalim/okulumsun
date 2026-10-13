// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { uyanikTut } from '../../src/platform/uyanikTut';

describe('uyanikTut', () => {
  it('destek yoksa desteklenmiyor', async () => {
    Object.defineProperty(navigator, 'wakeLock', { value: undefined, configurable: true });
    expect((await uyanikTut()).durum()).toBe('desteklenmiyor');
  });
  it('visibilitychange visible olunca yeniden ister; birak sonrası pasif', async () => {
    const request = vi.fn().mockResolvedValue({ release: vi.fn().mockResolvedValue(undefined) });
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
    const t = await uyanikTut();
    expect(t.durum()).toBe('aktif');
    expect(request).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(request).toHaveBeenCalledTimes(2);
    await t.birak();
    expect(t.durum()).toBe('pasif');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(request).toHaveBeenCalledTimes(2);
  });
});
