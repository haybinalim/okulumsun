import { test, expect } from '@playwright/test';
import { findOffenders, report, MIN_TARGET_BOARD } from './yardimci/geometri';

/** Tahta geometri koruması — kurallar ve gerekçe: ./yardimci/geometri.ts. */
/*
 * Bu dosya YALNIZ `board` projesinde çalışır — eşikler 1.6 ölçeğine göre.
 * Kısıt playwright.config.ts'teki testMatch/testIgnore ile kuruluyor;
 * dosya adındaki `board-` öneki oradaki desenle eşleşiyor.
 */
test.describe('akıllı tahta geometrisi', () => {
  test('ses kilidi ekranı erişim bölgesine ve hedef boyutuna uyuyor', async ({ page }) => {
    await page.goto('/?device=board');
    await expect(page.getByRole('button', { name: 'Başla' })).toBeVisible();

    const offenders = await findOffenders(page);
    expect(offenders, `Erişim/boyut ihlali:\n${report(offenders)}`).toEqual([]);
  });

  test('kilit açıldıktan sonraki ekran da uyuyor', async ({ page }) => {
    await page.goto('/?device=board');
    await page.getByRole('button', { name: 'Başla' }).click();
    // Kilit ekranı gitti, asıl ekran geldi.
    await expect(page.getByRole('button', { name: 'Başla' })).toHaveCount(0);

    const offenders = await findOffenders(page);
    expect(offenders, `Erişim/boyut ihlali:\n${report(offenders)}`).toEqual([]);
  });

  test('tahta profili gerçekten uygulanıyor', async ({ page }) => {
    await page.goto('/?device=board');

    const applied = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        device: document.documentElement.dataset.device,
        scale: s.getPropertyValue('--scale').trim(),
        tapMin: s.getPropertyValue('--size-tap-min').trim(),
      };
    });

    expect(applied.device).toBe('board');
    expect(applied.scale).toBe('1.6');
    expect(applied.tapMin).toBe(`${MIN_TARGET_BOARD}px`);
  });

  /**
   * Koruma testinin kendisi çalışıyor mu?
   *
   * Yalnız "ihlal yok" diyen bir test, tarayıcı seçicisi bozulduğunda da
   * sessizce yeşil kalır ve bir ay boyunca hiçbir şeyi korumaz.
   * Bu test, bilerek ihlal enjekte edip yakalandığını doğruluyor.
   */
  test('koruma gerçek ihlalleri yakalıyor', async ({ page }) => {
    await page.goto('/?device=board');

    await page.evaluate(() => {
      const high = document.createElement('button');
      high.setAttribute('aria-label', 'TUZAK-ust-bolge');
      high.style.cssText = 'position:fixed;top:20px;left:20px;width:200px;height:200px;';
      document.body.appendChild(high);

      const small = document.createElement('button');
      small.setAttribute('aria-label', 'TUZAK-kucuk');
      small.style.cssText = 'position:fixed;bottom:80px;left:600px;width:60px;height:60px;';
      document.body.appendChild(small);
    });

    const offenders = await findOffenders(page);
    const labels = offenders.map((o) => o.label);

    expect(labels).toContain('TUZAK-ust-bolge');
    expect(labels).toContain('TUZAK-kucuk');
    expect(offenders.find((o) => o.label === 'TUZAK-ust-bolge')!.reason).toContain('erişilemez');
    expect(offenders.find((o) => o.label === 'TUZAK-kucuk')!.reason).toContain('çok küçük');
  });
});
