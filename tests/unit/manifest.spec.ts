import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PWA_EK_VARLIKLAR, PWA_MANIFESTI } from '../../scripts/yayin/pwaAyari';
import { COLOR } from '../../src/design/tokens';
import { ikonSekilleri, svgYaz } from '../../scripts/ikon-uret';

type ManifestIkon = { src: string; sizes: string; purpose?: string };

const pub = join(process.cwd(), 'public');

describe('PWA manifesti (Adım 25)', () => {
  const manifest = PWA_MANIFESTI;
  const includeAssets = PWA_EK_VARLIKLAR;
  const ikonlar = manifest.icons as ManifestIkon[];

  it('manifest ikonlarının her dosyası public/ altında var ve boyutu doğru', () => {
    for (const i of ikonlar) {
      const yol = join(pub, i.src);
      expect(existsSync(yol), i.src).toBe(true);
      const png = readFileSync(yol);
      const [g, y] = [png.readUInt32BE(16), png.readUInt32BE(20)];
      expect(`${g}x${y}`).toBe(i.sizes);
    }
    expect(ikonlar.some((i) => i.purpose === 'maskable' && i.src !== 'icon-512.png')).toBe(true);
  });

  it('includeAssets dosyaları var', () => {
    for (const a of includeAssets) expect(existsSync(join(pub, a)), a).toBe(true);
  });

  it("orientation 'any'", () => {
    expect(manifest.orientation).toBe('any');
  });

  it('theme_color ve background_color tokens.COLOR.bg ile aynı; index.html theme-color da', () => {
    expect(manifest.theme_color).toBe(COLOR.bg);
    expect(manifest.background_color).toBe(COLOR.bg);
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain(`<meta name="theme-color" content="${COLOR.bg}" />`);
    expect(html).toContain('href="./favicon.svg"');
    expect(html).toContain('href="./apple-touch-icon.png"');
  });

  it('favicon.svg üreticiyle güncel (npm run ikon:uret)', () => {
    expect(readFileSync(join(pub, 'favicon.svg'), 'utf8')).toBe(
      svgYaz(ikonSekilleri({ yuvarlak: true, icerikOrani: 0.8 })),
    );
  });
});
