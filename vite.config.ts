import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Sunucu yok; çıktı tamamen statik ve göreli yollarla çalışır.
  // Bu sayede okul sunucusundan, alt dizinden veya USB'den açılabilir.
  base: './',
  server: { host: true },
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
