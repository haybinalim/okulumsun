/**
 * K5 — JS boyut bütçesi (plan v2 Adım 26). `npm run boyut` (önce `npm run build`).
 *
 * `dist/assets/*.js` toplamını ve en büyük parçayı ölçer, `docs/boyut-butcesi.json`
 * tabanıyla karşılaştırır. Sürüm v0.3.0'a kadar yalnız uyarır; sonra tabanı %10'dan
 * fazla aşan derleme hata verir. `--taban` mevcut ölçümü yeni taban olarak yazar.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface BoyutOlcumu {
  readonly toplamBayt: number;
  readonly enBuyukParca: { readonly dosya: string; readonly bayt: number };
}

export interface BoyutTabani extends BoyutOlcumu {
  readonly olcumTarihi: string;
  /** Bu sürümden itibaren aşım hata olur. */
  readonly zorunluSurum: string;
  readonly toleransYuzde: number;
}

export function olc(klasor: string): BoyutOlcumu {
  const dosyalar = readdirSync(klasor).filter((d) => d.endsWith('.js'));
  if (dosyalar.length === 0) throw new Error(`${klasor} içinde .js yok — önce npm run build`);
  let toplam = 0;
  let enBuyuk = { dosya: '', bayt: 0 };
  for (const d of dosyalar) {
    const bayt = statSync(join(klasor, d)).size;
    toplam += bayt;
    if (bayt > enBuyuk.bayt) enBuyuk = { dosya: d.replace(/-[\w-]{8}\.js$/, '.js'), bayt };
  }
  return { toplamBayt: toplam, enBuyukParca: enBuyuk };
}

/** "0.10.2" ≥ "0.3.0" karşılaştırması. */
export function surumBuyukEsit(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  return true;
}

export function degerlendir(
  olcum: BoyutOlcumu,
  taban: BoyutTabani,
  surum: string,
): { readonly durum: 'tamam' | 'uyari' | 'hata'; readonly mesajlar: string[] } {
  const sinir = (v: number) => Math.round(v * (1 + taban.toleransYuzde / 100));
  const mesajlar: string[] = [];
  if (olcum.toplamBayt > sinir(taban.toplamBayt))
    mesajlar.push(`JS toplamı ${olcum.toplamBayt} B > taban ${taban.toplamBayt} B +%${taban.toleransYuzde}`);
  if (olcum.enBuyukParca.bayt > sinir(taban.enBuyukParca.bayt))
    mesajlar.push(`en büyük parça ${olcum.enBuyukParca.bayt} B > taban ${taban.enBuyukParca.bayt} B +%${taban.toleransYuzde}`);
  if (mesajlar.length === 0) return { durum: 'tamam', mesajlar };
  return { durum: surumBuyukEsit(surum, taban.zorunluSurum) ? 'hata' : 'uyari', mesajlar };
}

function main(): void {
  const kok = process.cwd();
  const tabanYolu = join(kok, 'docs/boyut-butcesi.json');
  const olcum = olc(join(kok, 'dist/assets'));
  const surum = (JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as { version: string }).version;
  if (process.argv.includes('--taban')) {
    const yeni: BoyutTabani = {
      ...olcum,
      olcumTarihi: new Date().toISOString().slice(0, 10),
      zorunluSurum: '0.3.0',
      toleransYuzde: 10,
    };
    writeFileSync(tabanYolu, `${JSON.stringify(yeni, null, 2)}\n`);
    console.log(`✓ Boyut tabanı yazıldı: ${olcum.toplamBayt} B (en büyük ${olcum.enBuyukParca.bayt} B).`);
    return;
  }
  const taban = JSON.parse(readFileSync(tabanYolu, 'utf8')) as BoyutTabani;
  const { durum, mesajlar } = degerlendir(olcum, taban, surum);
  const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`;
  console.log(`JS toplamı ${kb(olcum.toplamBayt)}, en büyük parça ${olcum.enBuyukParca.dosya} ${kb(olcum.enBuyukParca.bayt)}.`);
  if (durum === 'tamam') console.log('✓ Boyut bütçesi içinde (K5).');
  else if (durum === 'uyari') for (const m of mesajlar) console.warn(`::warning::K5 boyut bütçesi: ${m} (v${taban.zorunluSurum}'a kadar uyarı)`);
  else {
    for (const m of mesajlar) console.error(`✗ K5 boyut bütçesi: ${m}`);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('boyut-butcesi.ts')) main();
