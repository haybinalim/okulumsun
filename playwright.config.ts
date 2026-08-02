import { defineConfig, devices } from '@playwright/test';

/** Yalnız akıllı tahta profilinde anlamlı olan testler. */
const BOARD_ONLY = '**/board-*.spec.ts';

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
      testIgnore: BOARD_ONLY,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
