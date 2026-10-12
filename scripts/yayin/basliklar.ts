/**
 * Yayın başlıklarının tek kaynağı `vercel.json` (plan v2 Adım 22, ADR-0003).
 * Bu modül onu okur; `vite preview` aynı başlıkları sunar, böylece e2e CSP
 * denetimi üretimle aynı politikayı sınar.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface VercelBaslik {
  source: string;
  headers: { key: string; value: string }[];
}

const VERCEL_JSON = fileURLToPath(new URL('../../vercel.json', import.meta.url));

export function vercelBasliklari(): VercelBaslik[] {
  return (JSON.parse(readFileSync(VERCEL_JSON, 'utf8')) as { headers: VercelBaslik[] }).headers;
}

/** Tüm yollara uygulanan güvenlik başlıkları (`/(.*)` kuralı). */
export function guvenlikBasliklari(): Record<string, string> {
  const kural = vercelBasliklari().find((b) => b.source === '/(.*)');
  if (!kural) throw new Error('vercel.json: "/(.*)" başlık kuralı yok');
  return Object.fromEntries(kural.headers.map((h) => [h.key, h.value]));
}

/** CSP'yi yönerge → kaynak listesi olarak ayrıştırır. */
export function cspYonergeleri(csp: string): Record<string, string[]> {
  return Object.fromEntries(
    csp
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const [ad, ...degerler] = p.split(/\s+/);
        return [ad, degerler];
      }),
  );
}
