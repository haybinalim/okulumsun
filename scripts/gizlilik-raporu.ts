/**
 * Gizlilik kanıt raporu betiği (plan v2 Adım 39 aşama 2, KG-54). `npm run gizlilik:rapor`
 * Önce `npx playwright test --project=onizleme tests/e2e/onizleme-gizlilik-ag.spec.ts` koşmalı; e2e kayıtları
 * `test-results/gizlilik-kanit/*.json`'a yazar. Çıktı: `docs/gizlilik/kanit-raporu.md`. Kayıt yoksa çıkış 1.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { raporUret, type KanitKaydi } from './gizlilik/kanitRaporu.ts';

const kok = process.cwd();
const dizin = path.join(kok, 'test-results/gizlilik-kanit');
const dosyalar = existsSync(dizin) ? readdirSync(dizin).filter((d) => d.endsWith('.json')) : [];
if (dosyalar.length === 0) {
  console.error('✗ test-results/gizlilik-kanit/ boş — önce onizleme-gizlilik-ag e2e testini koşun.');
  process.exit(1);
}
const kayitlar = dosyalar.map((d) => JSON.parse(readFileSync(path.join(dizin, d), 'utf8')) as KanitKaydi);
const surum = (JSON.parse(readFileSync(path.join(kok, 'package.json'), 'utf8')) as { version: string }).version;
let derleme = process.env.GITHUB_SHA?.slice(0, 7) ?? '';
if (!derleme) {
  try {
    derleme = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    derleme = 'bilinmiyor';
  }
}
mkdirSync(path.join(kok, 'docs/gizlilik'), { recursive: true });
const rapor = raporUret(kayitlar, { surum, derleme });
writeFileSync(path.join(kok, 'docs/gizlilik/kanit-raporu.md'), rapor);
console.log(`docs/gizlilik/kanit-raporu.md yazıldı (${kayitlar.length} akış).`);
if (!rapor.includes('**Sonuç: TEMİZ**')) process.exit(1);
