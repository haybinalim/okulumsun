/**
 * K9 — gizlilik statik taraması (plan v2 Adım 24). `npm run gizlilik:tara`
 * `src/**` ve `scripts/**` (.ts/.tsx; `tests/` hariç) taranır; bulgu varsa çıkış 1.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { kirmiziTara } from './denetim/kirmiziYok.ts';
import { tara, type Bulgu } from './gizlilik/kurallar.ts';

const kok = process.cwd();

function dosyalar(dizin: string): string[] {
  const sonuc: string[] = [];
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) {
      if (ad === 'node_modules' || ad === 'claude-cikti') continue;
      sonuc.push(...dosyalar(yol));
    } else if (/\.(ts|tsx)$/.test(ad) && !/\.d\.ts$/.test(ad)) {
      sonuc.push(yol);
    }
  }
  return sonuc;
}

const bulgular: Bulgu[] = [];
let sayi = 0;
for (const dizin of ['src', 'scripts']) {
  for (const yol of dosyalar(join(kok, dizin))) {
    const goreli = relative(kok, yol).split(sep).join('/');
    // Kural tanımları yasak desenleri metin olarak içerir.
    if (goreli === 'scripts/gizlilik/kurallar.ts') continue;
    sayi++;
    const icerik = readFileSync(yol, 'utf8');
    bulgular.push(...tara(goreli, icerik));
    for (const k of kirmiziTara(goreli, icerik)) bulgular.push({ dosya: k.dosya, satir: k.satir, kural: `kırmızı yasak ${k.desen}` } as Bulgu);
  }
}

if (bulgular.length > 0) {
  console.error(`✗ K9 gizlilik taraması: ${bulgular.length} bulgu`);
  for (const b of bulgular) console.error(`  ${b.dosya}:${b.satir}: ${b.kural}`);
  process.exit(1);
}
console.log(`✓ K9 gizlilik taraması temiz (${sayi} dosya).`);
