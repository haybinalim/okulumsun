/**
 * Tekil soru sayısı ölçümü (plan v2 Adım 38, G41, KG-51). `npm run tekil-soru -- [--yaz]`
 *
 * Her şablon için 10.000 tohum (zorluk aralığında döngüyle, tahta modu) üretir ve İÇERİĞİ farklı soruları sayar.
 * `itemId` tohumdan türetildiği için (types.ts `makeItemId`) benzersiz itemId sayısı soru çeşitliliğini değil
 * tohum sayısını ölçer. Bunun yerine TEMKİNLİ bir içerik imzası sayılır: kimlik/tohum/zorluk/süre, ipuçları,
 * yerleşim (`konum`, `bolge`), renk, öğe kimlikleri (`id`, `validation`) ve tekrar eden `assets` atılır; diziler sırasız
 * karşılaştırılır (şık sırası veya sahnede yer değişimi yeni soru sayılmaz; örüntüde sıra farkı da sayılmaz →
 * eksik sayım). Sonuç bir ALT SINIRDIR. `--yaz` → `docs/tekil-soru-sayisi.json`.
 * Deterministik: aynı kod → aynı sayı (Math.random yok).
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { REGISTRY } from '../src/exercises/registry.ts';
import { createRng } from '../src/exercises/rng.ts';
import type { ExerciseGenerator } from '../src/exercises/types.ts';

export const TOHUM_SAYISI = 10_000;
const ATILAN = new Set([
  'itemId',
  'seed',
  'difficulty',
  'estimatedSec',
  'hints',
  'ogretimselSozlesme',
  'assets',
  'validation',
  'konum',
  'bolge',
  'renk',
  'id',
  'tekrarSes',
]);

function kanonik(v: unknown): unknown {
  if (Array.isArray(v))
    return v
      .map(kanonik)
      .map((x) => JSON.stringify(x))
      .sort();
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(v).sort()) if (!ATILAN.has(k)) o[k] = kanonik((v as Record<string, unknown>)[k]);
    return o;
  }
  return v;
}

export function soruImzasi(soru: object): string {
  return JSON.stringify(kanonik(soru));
}

export function tekilSay(g: ExerciseGenerator, tohumSayisi = TOHUM_SAYISI): number {
  const [enAz, enCok] = g.zorlukAraligi;
  const aralik = enCok - enAz + 1;
  const imzalar = new Set<string>();
  for (let t = 0; t < tohumSayisi; t++) {
    const difficulty = (enAz + (t % aralik)) as typeof enAz;
    imzalar.add(soruImzasi(g.uret({ seed: t, difficulty, mod: 'tahta' }, createRng(t))));
  }
  return imzalar.size;
}

export interface TekilSoruOlcumu {
  readonly $aciklama: string;
  readonly tohumSayisi: number;
  readonly toplam: number;
  readonly sablonlar: Readonly<Record<string, number>>;
}

export function olc(tohumSayisi = TOHUM_SAYISI): TekilSoruOlcumu {
  const sablonlar: Record<string, number> = {};
  for (const [id, g] of [...REGISTRY.entries()].sort(([a], [b]) => a.localeCompare(b)))
    sablonlar[id] = tekilSay(g, tohumSayisi);
  return {
    $aciklama:
      'scripts/tekil-soru-sayisi.ts çıktısı (plan v2 Adım 38, KG-51): şablon başına 10.000 tohumda içeriği farklı soru sayısı; alt sınır.',
    tohumSayisi,
    toplam: Object.values(sablonlar).reduce((a, b) => a + b, 0),
    sablonlar,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const o = olc();
  console.table(o.sablonlar);
  console.log(`Toplam tekil soru (alt sınır, ${o.tohumSayisi} tohum/şablon): ${o.toplam}`);
  if (process.argv.includes('--yaz')) {
    writeFileSync('docs/tekil-soru-sayisi.json', JSON.stringify(o, null, 2) + '\n');
    console.log('docs/tekil-soru-sayisi.json yazıldı.');
  }
}
