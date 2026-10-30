/**
 * DERS PAKETİ VERİ BÜTÇESİ (ADR-0016; Okuma Yazma planı Adım 61). `npm run boyut:ders [-- --js dist-tur]`.
 *
 * K5 (`npm run boyut`) yalnız JS kodunu ölçer. Ders verisi (içerik JSON'u, SVG, ses) JS dışındadır ve ayrı ölçülür:
 * - çekirdek: önceden önbelleğe alınacak dosyalar (`manifest.json` → `cekirdek`), tavan `cekirdekBayt`;
 * - harf grubu: grup açıldığında indirilecek dosyalar (`gruplar`), grup başına tavan `grupBayt`;
 * - Türkçe tembel JS: bayraklı derleme (`--js dist-tur`) ile üretim derlemesi (`dist/`) arasındaki JS farkı, tavan `kodBayt`.
 * Bütçe dosyası `docs/ders-veri-butcesi.json`. `zorunlu: false` iken (yayına kadar) aşım yalnız uyarıdır; Adım 73'te sert.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { dersVerisiDosyalari, DERS_VERISI_KOKU } from './yayin/dersVerisi.ts';

export interface DersVeriManifesti {
  readonly ders: string;
  readonly programSurumu: string;
  readonly cekirdek: readonly string[];
  readonly gruplar: Readonly<Record<string, readonly string[]>>;
}

export interface DersButcesi {
  readonly cekirdekBayt: number;
  readonly grupBayt: number;
  readonly kodBayt: number;
}

export interface VeriOlcumu {
  readonly cekirdekBayt: number;
  readonly gruplar: Readonly<Record<string, number>>;
  /** Manifestte geçmeyen dosyalar (önbellek planına girmez). */
  readonly listesiz: readonly string[];
  /** Manifestte geçip diskte olmayan dosyalar. */
  readonly eksik: readonly string[];
}

/** SAF: dosya boyutları (göreli yol → bayt) ve manifestten ölçüm. */
export function veriyiOlc(boyutlar: ReadonlyMap<string, number>, manifest: DersVeriManifesti): VeriOlcumu {
  const listede = new Set<string>([...manifest.cekirdek, ...Object.values(manifest.gruplar).flat()]);
  const topla = (liste: readonly string[]) => liste.reduce((t, d) => t + (boyutlar.get(d) ?? 0), 0);
  return {
    cekirdekBayt: topla(manifest.cekirdek),
    gruplar: Object.fromEntries(Object.entries(manifest.gruplar).map(([g, l]) => [g, topla(l)])),
    listesiz: [...boyutlar.keys()].filter((d) => !listede.has(d)).sort(),
    eksik: [...listede].filter((d) => !boyutlar.has(d)).sort(),
  };
}

/** SAF: bütçe karşılaştırması; `kodBayt` ölçülmediyse (bayraklı derleme yok) `null`. */
export function butceyiDegerlendir(
  olcum: VeriOlcumu,
  kodBayt: number | null,
  butce: DersButcesi,
): { readonly asimlar: string[]; readonly notlar: string[] } {
  const asimlar: string[] = [];
  const notlar: string[] = [];
  if (olcum.cekirdekBayt > butce.cekirdekBayt)
    asimlar.push(`çekirdek ${olcum.cekirdekBayt} B > ${butce.cekirdekBayt} B`);
  for (const [g, b] of Object.entries(olcum.gruplar))
    if (b > butce.grupBayt) asimlar.push(`grup ${g}: ${b} B > ${butce.grupBayt} B`);
  if (kodBayt !== null && kodBayt > butce.kodBayt) asimlar.push(`Türkçe JS ${kodBayt} B > ${butce.kodBayt} B`);
  for (const d of olcum.eksik) asimlar.push(`manifestte var, diskte yok: ${d}`);
  for (const d of olcum.listesiz) notlar.push(`manifestte yok (önbellek planı dışında): ${d}`);
  if (kodBayt === null) notlar.push('Türkçe JS ölçülmedi (bayraklı derleme için --js dist-tur).');
  return { asimlar, notlar };
}

/** `assets/*.js` toplamı. */
export function jsToplami(klasor: string): number {
  const assets = path.join(klasor, 'assets');
  return readdirSync(assets)
    .filter((d) => d.endsWith('.js'))
    .reduce((t, d) => t + statSync(path.join(assets, d)).size, 0);
}

function main(): void {
  const kok = process.cwd();
  const butceDosyasi = JSON.parse(readFileSync(path.join(kok, 'docs/ders-veri-butcesi.json'), 'utf8')) as {
    zorunlu: boolean;
    dersler: Record<string, DersButcesi>;
  };
  const manifest = JSON.parse(
    readFileSync(path.join(kok, DERS_VERISI_KOKU, 'manifest.json'), 'utf8'),
  ) as DersVeriManifesti;
  const boyutlar = new Map(
    dersVerisiDosyalari(kok).map((d) => [d, statSync(path.join(kok, DERS_VERISI_KOKU, d)).size] as const),
  );
  const olcum = veriyiOlc(boyutlar, manifest);
  const jsIdx = process.argv.indexOf('--js');
  let kodBayt: number | null = null;
  if (jsIdx > 0) {
    const bayrakli = path.resolve(kok, process.argv[jsIdx + 1] ?? 'dist-tur');
    if (!existsSync(path.join(kok, 'dist/assets')) || !existsSync(path.join(bayrakli, 'assets')))
      throw new Error('Önce üretim (dist/) ve bayraklı (VITE_DERS_TUR=1 … --outDir dist-tur) derleme gerekir.');
    kodBayt = jsToplami(bayrakli) - jsToplami(path.join(kok, 'dist'));
  }
  const { asimlar, notlar } = butceyiDegerlendir(olcum, kodBayt, butceDosyasi.dersler.tur);
  const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`;
  console.log(
    `Türkçe ders verisi: çekirdek ${kb(olcum.cekirdekBayt)}; gruplar ${Object.entries(olcum.gruplar)
      .map(([g, b]) => `${g}: ${kb(b)}`)
      .join(', ')}${kodBayt === null ? '' : `; Türkçe JS ${kb(kodBayt)}`} (program ${manifest.programSurumu}).`,
  );
  for (const n of notlar) console.log(`  · ${n}`);
  if (asimlar.length === 0) console.log('✓ Ders veri bütçesi içinde (ADR-0016).');
  else if (!butceDosyasi.zorunlu)
    for (const a of asimlar) console.warn(`::warning::Ders veri bütçesi: ${a} (yayına kadar uyarı, ADR-0016)`);
  else {
    for (const a of asimlar) console.error(`✗ Ders veri bütçesi: ${a}`);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('ders-veri-butcesi.ts')) main();
