import { defineConfig, devices } from '@playwright/test';

/** Yalnız akıllı tahta profilinde anlamlı olan testler. */
const BOARD_ONLY = '**/board-*.spec.ts';
/** Üretim derlemesi + `vite preview` üzerinde koşan testler (Adım 22, 26). */
const ONIZLEME = '**/onizleme-*.spec.ts';

/**
 * Önizleme sunucusu: e2e kancası açık test derlemesi (`VITE_E2E_KANCASI=1`, ayrı
 * `dist-e2e/` klasörü; üretim `dist/` etkilenmez) + vercel.json güvenlik başlıkları.
 * `E2E_HEDEF_URL` verilirse onizleme testleri o adrese koşar (yayın doğrulaması;
 * kanca gerektiren testler orada kendini atlar).
 */
export const ONIZLEME_URL = process.env.E2E_HEDEF_URL ?? 'http://localhost:4173/';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-failure',
  },
  projects: [
    {
      /*
       * Akıllı tahta taklidi. Fiziksel tahtaya ~1 ay erişim yok, bu yüzden
       * erişim bölgesi ve hedef boyutu kurallarını koruyan tek şey bu proje.
       *
       * `hasTouch`, `pointer: coarse` ve `hover: none` medya sorgularını
       * tetikler — deviceProfile.ts'in tahta tespiti tam olarak bunlara bakıyor,
       * yani gerçek tespit yolu da sınanmış oluyor.
       */
      name: 'board',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        hasTouch: true,
      },
      testIgnore: ONIZLEME,
    },
    {
      /*
       * Tablet — ikinci öncelikli cihaz ve önümüzdeki bir ay elle test
       * edilebilen tek dokunmatik hedef.
       *
       * iPad profili WebKit ister; bilerek Chromium üzerinde çalıştırıyoruz,
       * çünkü doğrulanan şey tarayıcı motoru değil yerleşim geometrisi.
       * Tek tarayıcı indirmek CI kurulumunu da hafif tutuyor.
       */
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1080, height: 810 },
        hasTouch: true,
      },
      testIgnore: [BOARD_ONLY, ONIZLEME],
    },
    {
      /* Üretim derlemesi: CSP, service worker, çevrimdışı, manifest, gizlilik (Adım 26). */
      name: 'onizleme',
      testMatch: ONIZLEME,
      retries: 1, // SW kayıt zamanlaması kararsız olabilir (plan v2 Adım 26 riskleri)
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1080, height: 810 },
        hasTouch: true,
        baseURL: ONIZLEME_URL,
        serviceWorkers: 'allow',
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    ...(process.env.E2E_HEDEF_URL
      ? []
      : [
          {
            command:
              'VITE_E2E_KANCASI=1 npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort',
            url: 'http://localhost:4173',
            reuseExistingServer: true,
            timeout: 180_000,
          },
        ]),
  ],
});
