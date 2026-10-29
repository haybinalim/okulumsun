import type { Page } from '@playwright/test';

/**
 * AKILLI TAHTA GEOMETRİ KORUMASI — ortak yardımcı (Adım 26'da board-geometry.spec.ts'ten çıkarıldı)
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
 * YEDEK HEDEF (KG-127): `data-yedek-hedef` taşıyan öğe (üstteki soru hoparlörü) ölü bölge kuralından muaftır,
 * çünkü aynı eylemin erişim bölgesinde bir eşi vardır. Bu muafiyet ancak eş gerçekten oradaysa geçerlidir:
 * yedek hedef varken merkezi ölü bölgenin altında bir "Tekrar dinle" düğmesi yoksa ihlal sayılır. Boyut
 * kuralı yedek hedefe de uygulanır.
 *
 * Bu test geometriyi kanıtlar, fiziksel dokunma isabetini KANITLAMAZ.
 * Gerçek tahta doğrulaması yapıldığında (2. ay) eşikler ayarlanabilir.
 */

export const DEAD_TOP_RATIO = 0.35;
export const MIN_TARGET_BOARD = Math.round(64 * 1.6);
/** Alt piksel yerleşim farkları için tolerans — 101.99px ihlal değildir. */
const TOLERANCE = 1;

export interface Offender {
  label: string;
  reason: string;
  box: { x: number; y: number; w: number; h: number };
}

export async function findOffenders(
  page: Page,
  esik: { deadTopRatio: number; minTarget: number } = { deadTopRatio: DEAD_TOP_RATIO, minTarget: MIN_TARGET_BOARD },
): Promise<Offender[]> {
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
        // Yetişkin girişi (ör. Ayarlar dişlisi) bilerek çocuğun erişimi dışında tutulur.
        if (el.closest('[data-yetiskin]')) continue;

        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue; // gizli öğe
        if (getComputedStyle(el).visibility === 'hidden') continue;

        const label = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 32) ?? '(etiketsiz)';
        const box = {
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };

        const center = r.top + r.height / 2;
        const yedek = el.closest('[data-yedek-hedef]') !== null;
        if (center < deadTop && !yedek) {
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
      // KG-127: yedek hedefin erişilebilir eşi ("Tekrar dinle") ölü bölgenin altında olmalı.
      if (document.querySelector('[data-yedek-hedef]')) {
        const es = [...document.querySelectorAll<HTMLElement>('button[aria-label="Tekrar dinle"]')].some((b) => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.top + r.height / 2 >= deadTop;
        });
        if (!es) out.push({ label: 'Tekrar dinle', reason: 'yedek hedefin erişilebilir eşi yok', box: { x: 0, y: 0, w: 0, h: 0 } });
      }
      return out;
    },
    { ...esik, tolerance: TOLERANCE },
  );
}

export function report(offenders: Offender[]): string {
  return offenders.map((o) => `  • "${o.label}" — ${o.reason}`).join('\n');
}

/**
 * Aktif cihaz profilinin eşikleri: tahtada üst %35 ölü bölge + `--size-tap-min`;
 * diğer profillerde yalnız `--size-tap-min`.
 */
export async function profilEsikleri(page: Page): Promise<{ deadTopRatio: number; minTarget: number }> {
  const { device, tapMin } = await page.evaluate(() => ({
    device: document.documentElement.dataset.device ?? '',
    tapMin: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-tap-min')),
  }));
  return { deadTopRatio: device === 'board' ? DEAD_TOP_RATIO : 0, minTarget: Math.round(tapMin) };
}

/** Boş dizge = ihlal yok; değilse okunur ihlal listesi. */
export async function geometriIhlalleri(page: Page): Promise<string> {
  const ihlaller = await findOffenders(page, await profilEsikleri(page));
  return ihlaller.length === 0 ? '' : report(ihlaller);
}
