import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cspYonergeleri, guvenlikBasliklari, vercelBasliklari } from '../../scripts/yayin/basliklar';

/** Plan v2 Adım 22 / ADR-0003: Sıfır Veri Sözleşmesi madde 3'ün tarayıcı katmanı. */
describe('yayın başlıkları (vercel.json)', () => {
  const b = guvenlikBasliklari();
  const csp = cspYonergeleri(b['Content-Security-Policy']);

  it("CSP connect-src yalnız 'self'", () => {
    expect(csp['connect-src']).toEqual(["'self'"]);
  });

  it("CSP default-src, script-src, font-src yalnız 'self'; satır içi/eval betik yok", () => {
    for (const y of ['default-src', 'script-src', 'font-src', 'worker-src', 'manifest-src', 'base-uri']) {
      expect(csp[y], y).toEqual(["'self'"]);
    }
    expect(b['Content-Security-Policy']).not.toMatch(/unsafe-eval/);
    expect(csp['script-src']).not.toContain("'unsafe-inline'");
  });

  it("form-action 'none', object-src 'none', frame-ancestors 'self'", () => {
    expect(csp['form-action']).toEqual(["'none'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['frame-ancestors']).toEqual(["'self'"]);
  });

  it('hiçbir yönerge harici alan adına izin vermez', () => {
    for (const [y, kaynaklar] of Object.entries(csp)) {
      for (const k of kaynaklar) expect(k, y).toMatch(/^('self'|'none'|'unsafe-inline'|data:|blob:)$/);
    }
  });

  it('Permissions-Policy microphone=() ve camera=() içerir', () => {
    expect(b['Permissions-Policy']).toContain('microphone=()');
    expect(b['Permissions-Policy']).toContain('camera=()');
    expect(b['Permissions-Policy']).toContain('geolocation=()');
  });

  it('referrer, nosniff, çerçeve ve COOP başlıkları var', () => {
    expect(b['Referrer-Policy']).toBe('no-referrer');
    expect(b['X-Content-Type-Options']).toBe('nosniff');
    expect(b['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(b['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(b['Strict-Transport-Security']).toMatch(/max-age=\d{8,}/);
  });

  it('index.html ve sw.js no-cache, hash\'li varlıklar immutable', () => {
    const kurallar = vercelBasliklari();
    const nocache = kurallar.find((k) => k.headers.some((h) => h.value === 'no-cache'));
    expect(nocache?.source).toMatch(/index\.html/);
    expect(nocache?.source).toMatch(/sw\.js/);
    const assets = kurallar.find((k) => k.source.startsWith('/assets/'));
    expect(assets?.headers[0].value).toContain('immutable');
  });

  it('Vercel Git otomatik yayını kapalı: yayın yalnız yeşil CI sonrası (K11)', () => {
    const v = JSON.parse(readFileSync('vercel.json', 'utf8')) as { git?: { deploymentEnabled?: boolean } };
    expect(v.git?.deploymentEnabled).toBe(false);
    const wf = readFileSync('.github/workflows/deploy-vercel.yml', 'utf8');
    expect(wf).toMatch(/workflow_run:/);
    expect(wf).toMatch(/conclusion == 'success'/);
  });

  it('GitHub Pages yalnız elle tetiklenen yedek', () => {
    const wf = readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
    expect(wf).toMatch(/workflow_dispatch/);
    expect(wf).not.toMatch(/^\s*push:/m);
  });
});
