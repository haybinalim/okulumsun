import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Tam çevrimdışı — tüm varlıklar precache.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'okulumsun',
        short_name: 'okulumsun',
        description: 'MEB ilkokul matematik müfredatına yönelik eğitim uygulaması',
        theme_color: '#7C3AED',
        background_color: '#FAF9F6',
        display: 'standalone',
        orientation: 'portrait',
        // Scope ve start_url göreli — USB'den file:// açılışta çalışır.
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Tüm varlıklar precache → tam çevrimdışı.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,m4a}'],
        // Önbellek sürümü — içerik değişince otomatik güncellenir.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB (ses klipleri)
      },
    }),
  ],
  // Sunucu yok; çıktı tamamen statik ve göreli yollarla çalışır.
  // Bu sayede okul sunucusundan, alt dizinden veya USB'den açılabilir.
  base: './',
  // Geçici Manus önizleme alan adları dinamik olduğundan geliştirme sunucusu
  // bunları kabul eder. Bu ayar üretim çıktısına taşınmaz; uygulama statiktir.
  server: { host: true, allowedHosts: true },
  test: {
    /**
     * YALNIZ birim testleri. `tests/e2e/**` Playwright'a aittir ve vitest
     * tarafından toplanırsa "Playwright Test did not expect test.describe()"
     * hatasıyla TÜM test koşusunu düşürür (iki farklı koşucu, aynı `.spec.ts`
     * uzantısı). e2e için `npm run e2e`.
     */
    include: ['tests/unit/**/*.spec.ts'],
    // Property-based testler 2000+ tohum üretiyor; varsayılan 5 sn yetmez.
    testTimeout: 60_000,
  },
});
