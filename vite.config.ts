import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { guvenlikBasliklari } from './scripts/yayin/basliklar.ts';
import pkg from './package.json' with { type: 'json' };
import { PWA_EK_VARLIKLAR, PWA_MANIFESTI } from './scripts/yayin/pwaAyari.ts';
import { icerikDogrulama } from './scripts/yayin/icerikDogrulama.ts';
import { dersVerisi } from './scripts/yayin/dersVerisi.ts';

// Adım 23: sürüm kimliği. GitHub Actions → GITHUB_SHA, Vercel → VERCEL_GIT_COMMIT_SHA.
const derlemeSha = process.env.GITHUB_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA;

export default defineConfig({
  define: {
    __UYGULAMA_SURUMU__: JSON.stringify(pkg.version),
    __DERLEME_KIMLIGI__: JSON.stringify(derlemeSha ? derlemeSha.slice(0, 7) : 'yerel'),
  },
  plugins: [
    // KG-87: içerik JSON'ları derleme zamanında zod ile doğrulanır; üretim paketinde zod yok.
    icerikDogrulama(),
    // ADR-0016: Türkçe ders verisi yalnız `VITE_DERS_TUR=1` ile `dist/tur/`'a kopyalanır / geliştirmede sunulur.
    dersVerisi(),
    react(),
    tailwindcss(),
    VitePWA({
      // Tam çevrimdışı — tüm varlıklar precache.
      registerType: 'autoUpdate',
      includeAssets: PWA_EK_VARLIKLAR,
      manifest: PWA_MANIFESTI,
      workbox: {
        // Tüm varlıklar precache → tam çevrimdışı.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,m4a}'],
        // Kâğıt arşivi (Adım 48) uygulamanın parçası değil; çevrimdışı önbelleği şişirmesin.
        // Türkçe ders verisi (ADR-0016) precache'e girmez; grup bazlı önbellek Adım 73'te.
        globIgnores: ['kagitlar/**', 'tur/**'],
        // Önbellek sürümü — içerik değişince otomatik güncellenir.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB (ses klipleri)
        // Uygulamadan bağımsız statik sayfalar SPA yedeğine düşmesin (plan v2 Adım 38/39/48).
        navigateFallbackDenylist: [/^\/ogretmen/, /^\/gizlilik/, /^\/kagitlar/],
      },
    }),
  ],
  // Sunucu yok; çıktı tamamen statik ve göreli yollarla çalışır.
  // Bu sayede okul sunucusundan, alt dizinden veya USB'den açılabilir.
  base: './',
  // Geçici Manus önizleme alan adları dinamik olduğundan geliştirme sunucusu
  // bunları kabul eder. Bu ayar üretim çıktısına taşınmaz; uygulama statiktir.
  server: { host: true, allowedHosts: true },
  // `vite preview` üretim güvenlik başlıklarını (vercel.json) sunar; e2e CSP denetimi bunu kullanır.
  // HSTS yerel http'de anlamsız, çıkarılır.
  preview: {
    headers: Object.fromEntries(
      Object.entries(guvenlikBasliklari()).filter(([k]) => k !== 'Strict-Transport-Security'),
    ),
  },
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
