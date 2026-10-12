/**
 * PWA manifesti ve ek varlıklar — tek kaynak (plan v2 Adım 25, KG-36).
 * `vite.config.ts` ve `tests/unit/manifest.spec.ts` buradan okur.
 */
import type { ManifestOptions } from 'vite-plugin-pwa';
import { COLOR } from '../../src/design/tokens.ts';

export const PWA_EK_VARLIKLAR: string[] = ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'];

export const PWA_MANIFESTI: Partial<ManifestOptions> = {
  name: 'okulumsun',
  short_name: 'okulumsun',
  description: 'MEB ilkokul matematik müfredatına yönelik eğitim uygulaması',
  // Adım 25 (KG-36): tek renk, tokens'tan — index.html theme-color ile aynı (manifest.spec.ts).
  theme_color: COLOR.bg,
  background_color: COLOR.bg,
  display: 'standalone',
  // PLAN §3: tahta yatay, tablet iki yön.
  orientation: 'any',
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
      // Ayrı maskable ikon: motif %80 güvenli alanın içinde (`npm run ikon:uret`).
      src: 'icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};
