import { test, expect, type Page } from '@playwright/test';

/**
 * AKILLI TAHTA GEOMETRİ KORUMASI
 *
 * Fiziksel akıllı tahtaya ~1 ay erişim yok. Bu test, o süre boyunca iki kuralın
 * sessizce ihlal edilmesini engelleyen tek şey:
 *
 *  1. ERİŞİM BÖLGESİ. 86" bir tahtada 1. sınıf öğrencisi (≈120 cm) ekranın üst
 *     kısmına fiziksel olarak ULAŞAMAZ. Üst %35'te dokunulabilir öğe olursa
 *     ürün tahtada kullanılamaz — ve bu, ekran görüntüsüne bakarak fark
 *     edilmez, çünkü görsel olarak gayet normal durur.
 *
 *     Ölçüt öğenin ÜST KENARI değil MERKEZİ: çocuk büyük bir butonun kenarına
 *     değil ortasına nişan alır. Üstü sınırın biraz üstüne taşan ama gövdesi
 *     erişilebilir olan büyük bir daire gerçekte sorunsuz kullanılır; merkezi
 *     sınırın üstünde kalan öğe ise gerçekten ulaşılamaz.
 *
 *  2. HEDEF BOYUTU. Tahta profilinde her dokunma hedefi en az 64×1.6 = 102px.
 *     IR dokunmatik tahtalarda isabet zaten kayıyor; küçük hedef ıskalanır.
 *
 * Bu test geometriyi kanıtlar, fiziksel dokunma isabetini KANITLAMAZ.
 * Gerçek tahta doğrulaması yapıldığında (2. ay) eşikler ayarlanabilir.
 */

const DEAD_TOP_RATIO = 0.35;
const MIN_TARGET_BOARD = Math.round(64 * 1.6);
/** Alt piksel yerleşim farkları için tolerans — 101.99px ihlal değildir. */
const TOLERANCE = 1;

interface Offender {
  label: string;
  reason: string;
  box: { x: number; y: number; w: number; h: number };
}

async function findOffenders(page: Page): Promise<Offender[]> {
  return page.evaluate(
    ({ deadTopRatio, minTarget, tolerance }) => {
      const deadTop = window.innerHeight * deadTopRatio;
      const out: Offender[] = [];

      const nodes = document.querySelectorAll<HTMLElement>(
        'button, a, input, select, [role="button"], [tabindex]:not([tabindex="-1"])',
      );

      for (const el of nodes) {
        // Geliştirme aracının kendi arayüzü ürünün parçası değil.
        if (el.closest('[data-harness]')) continue;

        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue; // gizli öğe
        if (getComputedStyle(el).visibility === 'hidden') continue;

        const label =
          el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 32) ?? '(etiketsiz)';
        const box = {
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };

        const center = r.top + r.height / 2;
        if (center < deadTop) {
          out.push({
            label,
            reason: `erişilemez üst bölgede (merkez y=${Math.round(center)} < ${Math.round(deadTop)})`,
            box,
          });
          continue;
        }
        const min = minTarget - tolerance;
        if (r.width < min || r.height < min) {
          out.push({ label, reason: `çok küçük (${box.w}×${box.h}, min ${minTarget})`, box });
        }
      }
      return out;
    },
    { deadTopRatio: DEAD_TOP_RATIO, minTarget: MIN_TARGET_BOARD, tolerance: TOLERANCE },
  );
}

function report(offenders: Offender[]): string {
  return offenders.map((o) => `  • "${o.label}" — ${o.reason}`).join('\n');
}

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
    expect(offenders.find((o) => o.label === 'TUZAK-ust-bolge')!.reason).toContain(
      'erişilemez',
    );
    expect(offenders.find((o) => o.label === 'TUZAK-kucuk')!.reason).toContain('çok küçük');
  });
});
