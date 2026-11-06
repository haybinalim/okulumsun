/**
 * DERS PAKETİ VERİ BÜTÇESİ (ADR-0016; Okuma Yazma planı Adım 61). `npm run boyut:ders [-- --js dist-tur]`.
 *
 * K5 (`npm run boyut`) yalnız JS kodunu ölçer. Ders verisi (içerik JSON'u, SVG, ses) JS dışındadır ve ayrı ölçülür:
 * - çekirdek: önceden önbelleğe alınacak dosyalar (`manifest.json` → `cekirdek`), tavan `cekirdekBayt`;
 * - harf grubu: grup açıldığında indirilecek dosyalar (`gruplar`), grup başına tavan `grupBayt`;
 * - Türkçe tembel JS: bayraklı derleme (`--js dist-tur`) ile üretim derlemesi (`dist/`) arasındaki JS farkı. KG-156
 *   (Adım 74, kullanıcı teyidi bekliyor): fark ikiye ayrılır — ek parçalar (`ekParcalar`: dosya adı öneki; ör. cümle
 *   parçası `turCumle-*.js`, yalnız gerektiğinde indirilir) her biri ≤ `ekParcaBayt`; geri kalan Türkçe temel JS ≤ `kodBayt`.
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
  /** Türkçe temel JS (ek parçalar hariç). */
  readonly kodBayt: number;
  /** Her ek parçanın tavanı (KG-156). */
  readonly ekParcaBayt?: number;
  /** Ek parça dosya adı önekleri (`<önek>-<karma>.js`). */
  readonly ekParcalar?: readonly string[];
}

/** Türkçe JS ölçümü: temel (ek parçalar hariç) + ek parçalar (önek → bayt). */
export interface KodOlcumu {
  readonly temel: number;
  readonly ekler: Readonly<Record<string, number>>;
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

/** SAF: bütçe karşılaştırması; Türkçe JS ölçülmediyse (bayraklı derleme yok) `null`; sayı = ek parçasız temel. */
export function butceyiDegerlendir(
  olcum: VeriOlcumu,
  kod: number | KodOlcumu | null,
  butce: DersButcesi,
): { readonly asimlar: string[]; readonly notlar: string[] } {
  const kodBayt = kod === null ? null : typeof kod === 'number' ? kod : kod.temel;
  const ekler = kod !== null && typeof kod !== 'number' ? kod.ekler : {};
  const asimlar: string[] = [];
  const notlar: string[] = [];
  if (olcum.cekirdekBayt > butce.cekirdekBayt)
    asimlar.push(`çekirdek ${olcum.cekirdekBayt} B > ${butce.cekirdekBayt} B`);
  for (const [g, b] of Object.entries(olcum.gruplar))
    if (b > butce.grupBayt) asimlar.push(`grup ${g}: ${b} B > ${butce.grupBayt} B`);
  if (kodBayt !== null && kodBayt > butce.kodBayt) asimlar.push(`Türkçe JS ${kodBayt} B > ${butce.kodBayt} B`);
  for (const [ad, b] of Object.entries(ekler))
    if (butce.ekParcaBayt !== undefined && b > butce.ekParcaBayt) asimlar.push(`Türkçe ek parça ${ad}: ${b} B > ${butce.ekParcaBayt} B`);
  for (const d of olcum.eksik) asimlar.push(`manifestte var, diskte yok: ${d}`);
  for (const d of olcum.listesiz) notlar.push(`manifestte yok (önbellek planı dışında): ${d}`);
  if (kodBayt === null) notlar.push('Türkçe JS ölçülmedi (bayraklı derleme için --js dist-tur).');
  return { asimlar, notlar };
}

/**
 * SAF: bayraklı derlemenin JS dosyaları (ad → bayt) ve üretim JS toplamından Türkçe JS ölçümü. Ek parça: adı
 * `<önek>-<karma>.js` olan dosya (`ekParcalar`); aynı önekli birden çok dosya toplanır. Temel = fark − ek parçalar.
 */
export function kodOlc(bayrakli: ReadonlyMap<string, number>, uretimToplami: number, onekler: readonly string[]): KodOlcumu {
  const ekler: Record<string, number> = {};
  let toplam = 0;
  for (const [ad, b] of bayrakli) {
    toplam += b;
    const onek = onekler.find((o) => new RegExp(`^${o}-[A-Za-z0-9_-]+\\.js$`).test(ad));
    if (onek) ekler[onek] = (ekler[onek] ?? 0) + b;
  }
  const ek = Object.values(ekler).reduce((t, b) => t + b, 0);
  return { temel: toplam - uretimToplami - ek, ekler };
}

/** `assets/*.js`: ad → bayt. */
export function jsDosyalari(klasor: string): Map<string, number> {
  const assets = path.join(klasor, 'assets');
  return new Map(
    readdirSync(assets)
      .filter((d) => d.endsWith('.js'))
      .map((d) => [d, statSync(path.join(assets, d)).size] as const),
  );
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
  let kod: KodOlcumu | null = null;
  if (jsIdx > 0) {
    const bayrakli = path.resolve(kok, process.argv[jsIdx + 1] ?? 'dist-tur');
    if (!existsSync(path.join(kok, 'dist/assets')) || !existsSync(path.join(bayrakli, 'assets')))
      throw new Error('Önce üretim (dist/) ve bayraklı (VITE_DERS_TUR=1 … --outDir dist-tur) derleme gerekir.');
    kod = kodOlc(jsDosyalari(bayrakli), jsToplami(path.join(kok, 'dist')), butceDosyasi.dersler.tur.ekParcalar ?? []);
  }
  const { asimlar, notlar } = butceyiDegerlendir(olcum, kod, butceDosyasi.dersler.tur);
  const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`;
  console.log(
    `Türkçe ders verisi: çekirdek ${kb(olcum.cekirdekBayt)}; gruplar ${Object.entries(olcum.gruplar)
      .map(([g, b]) => `${g}: ${kb(b)}`)
      .join(', ')}${
      kod === null
        ? ''
        : `; Türkçe temel JS ${kb(kod.temel)} (ek parçalar hariç), ek parçalar ${
            Object.entries(kod.ekler)
              .map(([a, b]) => `${a} ${kb(b)}`)
              .join(', ') || 'yok'
          }; toplam ${kb(kod.temel + Object.values(kod.ekler).reduce((t, b) => t + b, 0))}`
    } (program ${manifest.programSurumu}).`,
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
