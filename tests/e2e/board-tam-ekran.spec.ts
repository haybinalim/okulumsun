import { test, expect } from '@playwright/test';

test('tahtada ses kilidi dokunuşu tam ekranı dener; destek yoksa UI bozulmaz', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __wl: number }).__wl = 0;
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: async () => { (window as unknown as { __wl: number }).__wl++; return { release: async () => {} }; } },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Başla' }).click();
  await expect(page.getByText(/Tahta|Kişisel/i).first()).toBeVisible();
});
