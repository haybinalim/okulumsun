/**
 * Bayatlık kapısı K8 (plan v2 Adım 19): belgelerdeki sayılar koddan üretilir ve
 * makineyle karşılaştırılır. Serbest metin OKUNMAZ; yalnız makine okunur bloklar:
 *
 *   <!-- durum:anahtar=değer durum:anahtar=değer … -->   (PROGRESS.md, PLAN.md §14)
 *   <!-- agac:basla --> … <!-- agac:bitir -->              (PLAN.md §12, üretilmiş ağaç)
 *
 * Kullanım:
 *   npm run durum                 sayıları tablo olarak yazdırır
 *   npm run durum -- --denetle    blokları karşılaştırır; uyuşmazlıkta çıkış 1 (CI, K8)
 *   npm run durum -- --agac       PLAN §12 ağaç bloğunu yeniden yazar
 *
 * `birim_test` (vitest test sayısı) burada koşturulmaz: PR şablonundaki doğrulama
 * çıktısıyla elle girilir; dosya sayısı (`birim_dosya`) makineyle denetlenir.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { kazanimlariDogrula } from '../src/content/schema/kazanim';
import { REGISTRY } from '../src/exercises/registry';
import { AUDIO_MANIFEST } from '../src/audio/audioManifest.generated';

export interface DurumSayilari {
  readonly kazanim: number;
  readonly beceri: number;
  readonly hazirBeceri: number;
  readonly sablonSkills: number;
  readonly sablonDefter: number;
  readonly hataEtiketi: number;
  readonly sesAnahtari: number;
  readonly sesDosyasi: number;
  readonly birimDosya: number;
  readonly e2eDosya: number;
  /** `docs/ADR/NNNN-*.md`, şablon (0000) hariç. */
  readonly adrSayisi: number;
  readonly surum: string;
}

/** Belgedeki blok anahtarı → sayı. `sablon` ve `ses` iki kaynağın eşitliğini de gerektirir. */
export const BLOK_ANAHTARLARI: Readonly<Record<string, (s: DurumSayilari) => number>> = {
  kazanim: (s) => s.kazanim,
  beceri: (s) => s.beceri,
  hazir_beceri: (s) => s.hazirBeceri,
  sablon: (s) => s.sablonDefter,
  hata_etiketi: (s) => s.hataEtiketi,
  ses: (s) => s.sesDosyasi,
  birim_dosya: (s) => s.birimDosya,
  e2e_dosya: (s) => s.e2eDosya,
  adr: (s) => s.adrSayisi,
};

/** Yalnız makine kaynaklı olmayan, elle girilen anahtarlar (denetlenmez). */
export const ELLE_GIRILEN: readonly string[] = ['birim_test'];

/** Ağaçta gösterilmeyen kök klasörler (git'te izlense bile). */
const ATLANAN = new Set(['node_modules', 'dist', 'reports']);
/** Bir alt düzeyi de gösterilen kök klasörler. */
const ALT_DUZEY = ['docs', 'public', 'scripts', 'src', 'tests'];

function json(kok: string, yol: string): unknown {
  return JSON.parse(readFileSync(path.join(kok, yol), 'utf8'));
}

function dosyalar(dizin: string, uzanti: string): string[] {
  if (!existsSync(dizin)) return [];
  const sonuc: string[] = [];
  for (const ad of readdirSync(dizin)) {
    const tam = path.join(dizin, ad);
    if (statSync(tam).isDirectory()) sonuc.push(...dosyalar(tam, uzanti));
    else if (ad.endsWith(uzanti)) sonuc.push(tam);
  }
  return sonuc;
}

export async function sayilariTopla(kok: string): Promise<DurumSayilari> {
  const kazanimlar = kazanimlariDogrula(json(kok, 'src/content/kazanimlar.json')).kazanimlar;
  const skills = json(kok, 'src/content/skills.json') as { durum: string; exerciseTemplates: string[] }[];
  const hatalar = (json(kok, 'src/content/misconceptions.json') as { hatalar: unknown[] }).hatalar;
  const spec = (alt: string) => readdirSync(path.join(kok, alt)).filter((d) => d.endsWith('.spec.ts')).length;
  return {
    kazanim: kazanimlar.length,
    beceri: skills.length,
    hazirBeceri: skills.filter((s) => s.durum === 'hazir').length,
    sablonSkills: new Set(skills.flatMap((s) => s.exerciseTemplates)).size,
    sablonDefter: REGISTRY.size,
    hataEtiketi: hatalar.length,
    sesAnahtari: Object.keys(AUDIO_MANIFEST).length,
    sesDosyasi: dosyalar(path.join(kok, 'public/audio'), '.m4a').length,
    birimDosya: spec('tests/unit'),
    e2eDosya: spec('tests/e2e'),
    adrSayisi: readdirSync(path.join(kok, 'docs/ADR')).filter((d) => /^\d{4}-.+\.md$/.test(d) && !d.startsWith('0000-')).length,
    surum: (json(kok, 'package.json') as { version: string }).version,
  };
}

/** `<!-- durum:a=1 durum:b=2 -->` bloğunu okur. Blok yoksa veya bozuksa boş nesne. */
export function blokOku(markdown: string): Readonly<Record<string, string>> {
  const blok = /<!--((?:\s+durum:[a-z0-9_]+=[^\s>]+)+)\s*-->/.exec(markdown);
  if (!blok) return {};
  const sonuc: Record<string, string> = {};
  for (const [, ad, deger] of blok[1].matchAll(/durum:([a-z0-9_]+)=([^\s>]+)/g)) sonuc[ad] = deger;
  return sonuc;
}

const AGAC_BAS = '<!-- agac:basla -->';
const AGAC_BIT = '<!-- agac:bitir -->';

/**
 * Bugünkü depo ağacı: kök klasörler + `src/`, `scripts/`, `tests/`, `docs/`, `public/` bir alt düzey.
 * Yalnız klasör adları (dosya sayısı yok): her yeni belge ağacı bayatlatmasın, yeni/silinen klasör yakalansın.
 */
export function agacUret(kok: string): string {
  // Yalnız git'in izlediği dosyalar: yerelde gitignore'lu klasörler (çıktılar, modeller) ağaca girmez,
  // yerel ve CI aynı ağacı üretir.
  const izlenen = execFileSync('git', ['ls-files'], { cwd: kok, encoding: 'utf8' }).split('\n').filter(Boolean);
  const klasorler = new Map<string, Set<string>>();
  for (const dosya of izlenen) {
    const parca = dosya.split('/');
    if (parca.length < 2 || parca[0].startsWith('.') || ATLANAN.has(parca[0])) continue;
    if (!klasorler.has(parca[0])) klasorler.set(parca[0], new Set());
    if (parca.length >= 3 && ALT_DUZEY.includes(parca[0])) klasorler.get(parca[0])!.add(parca[1]);
  }
  const sirala = (x: Iterable<string>) => [...x].sort((a, b) => a.localeCompare(b, 'en'));
  const satirlar = ['okulumsun/'];
  const ust = sirala(klasorler.keys());
  ust.forEach((ad, i) => {
    const son = i === ust.length - 1;
    satirlar.push(`${son ? '└──' : '├──'} ${ad}/`);
    const icler = sirala(klasorler.get(ad)!);
    icler.forEach((ic, j) => {
      satirlar.push(`${son ? '    ' : '│   '}${j === icler.length - 1 ? '└──' : '├──'} ${ic}/`);
    });
  });
  return `${AGAC_BAS}\n\`\`\`\n${satirlar.join('\n')}\n\`\`\`\n${AGAC_BIT}`;
}

export function agacBloguOku(markdown: string): string | null {
  const b = markdown.indexOf(AGAC_BAS);
  const s = markdown.indexOf(AGAC_BIT);
  return b < 0 || s < b ? null : markdown.slice(b, s + AGAC_BIT.length);
}

/**
 * Belgeleri sayılarla karşılaştırır. Boş dizi = temiz.
 * `belgeler`: dosya adı → içerik. `agac` verilirse PLAN.md'deki ağaç bloğu da karşılaştırılır.
 */
export function denetle(
  s: DurumSayilari,
  belgeler: Readonly<Record<string, string>>,
  agac?: string,
): readonly string[] {
  const sorunlar: string[] = [];
  if (s.sablonDefter !== s.sablonSkills) {
    sorunlar.push(`kod: şablon defteri ${s.sablonDefter} ≠ skills.json benzersiz şablon ${s.sablonSkills}`);
  }
  if (s.sesAnahtari !== s.sesDosyasi) {
    sorunlar.push(`kod: ses manifesti ${s.sesAnahtari} anahtar ≠ public/audio ${s.sesDosyasi} dosya`);
  }
  for (const [dosya, metin] of Object.entries(belgeler)) {
    const blok = blokOku(metin);
    if (Object.keys(blok).length === 0) {
      sorunlar.push(`${dosya}: makine okunur durum bloğu yok veya bozuk`);
      continue;
    }
    for (const [anahtar, deger] of Object.entries(blok)) {
      if (ELLE_GIRILEN.includes(anahtar)) continue;
      const kaynak = BLOK_ANAHTARLARI[anahtar];
      if (!kaynak) {
        sorunlar.push(`${dosya}: bilinmeyen anahtar durum:${anahtar}`);
        continue;
      }
      const gercek = kaynak(s);
      if (String(gercek) !== deger) sorunlar.push(`${dosya}: durum:${anahtar} beklenen ${gercek}, yazılan ${deger}`);
    }
    if (agac !== undefined && dosya.endsWith('PLAN.md')) {
      const yazili = agacBloguOku(metin);
      if (yazili === null) sorunlar.push(`${dosya}: üretilmiş ağaç bloğu yok (npm run durum -- --agac)`);
      else if (yazili !== agac) sorunlar.push(`${dosya}: §12 ağacı bayat (npm run durum -- --agac)`);
    }
  }
  return sorunlar;
}

const BELGELER = ['docs/PROGRESS.md', 'docs/PLAN.md'];

async function main(): Promise<void> {
  const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const s = await sayilariTopla(kok);

  if (process.argv.includes('--agac')) {
    const plan = path.join(kok, 'docs/PLAN.md');
    const metin = readFileSync(plan, 'utf8');
    const eski = agacBloguOku(metin);
    if (eski === null) throw new Error(`docs/PLAN.md içinde ${AGAC_BAS} … ${AGAC_BIT} bloğu yok.`);
    writeFileSync(plan, metin.replace(eski, agacUret(kok)));
    console.log('PLAN §12 ağacı yeniden üretildi.');
    return;
  }

  if (process.argv.includes('--denetle')) {
    const belgeler = Object.fromEntries(BELGELER.map((b) => [b, readFileSync(path.join(kok, b), 'utf8')]));
    const sorunlar = denetle(s, belgeler, agacUret(kok));
    if (sorunlar.length === 0) {
      console.log(`✓ Durum blokları kodla eşleşiyor (${BELGELER.join(', ')}).`);
      return;
    }
    console.error(`✗ ${sorunlar.length} bayat değer (K8):`);
    for (const x of sorunlar) console.error(`  ${x}`);
    process.exitCode = 1;
    return;
  }

  console.table({
    kazanım: s.kazanim,
    beceri: `${s.beceri} (${s.hazirBeceri} hazır)`,
    şablon: `${s.sablonDefter} defter · ${s.sablonSkills} skills.json`,
    'hata etiketi': s.hataEtiketi,
    ses: `${s.sesAnahtari} anahtar · ${s.sesDosyasi} dosya`,
    'test dosyası': `${s.birimDosya} birim · ${s.e2eDosya} e2e`,
    ADR: s.adrSayisi,
    sürüm: s.surum,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
