// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tamEkranIste, tamEkranDestekleniyorMu } from '../../src/platform/tamEkran';

describe('tamEkran', () => {
  afterEach(() => vi.restoreAllMocks());
  it("destek yoksa 'desteklenmiyor' döner, fırlatmaz", async () => {
    const el = document.documentElement as unknown as { requestFullscreen?: unknown };
    el.requestFullscreen = undefined;
    expect(tamEkranDestekleniyorMu()).toBe(false);
    await expect(tamEkranIste()).resolves.toBe('desteklenmiyor');
  });
  it("reddedilince 'reddedildi' döner", async () => {
    (document.documentElement as unknown as { requestFullscreen: unknown }).requestFullscreen = vi.fn().mockRejectedValue(new Error('x'));
    await expect(tamEkranIste()).resolves.toBe('reddedildi');
  });
  it("kabul edilince 'acildi' döner", async () => {
    (document.documentElement as unknown as { requestFullscreen: unknown }).requestFullscreen = vi.fn().mockResolvedValue(undefined);
    await expect(tamEkranIste()).resolves.toBe('acildi');
  });
});
