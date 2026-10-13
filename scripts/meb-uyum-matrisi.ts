/**
 * MEB uyum matrisi üreticisi (plan v2 Adım 56 aşama 2). `npm run uyum-matrisi`
 * → `docs/basvuru/meb-uyum-matrisi.md` + `.csv`. Deterministik; saat ve rastgelelik yok.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { REGISTRY } from '../src/exercises/registry.ts';
import { DUGUM_KODLARI } from '../src/ogretmen/dugumKodlari.ts';
import {
  uyumCsv,
  uyumMarkdown,
  uyumMatrisi,
  uyumOzeti,
  type UyumBecerisi,
  type UyumKazanimi,
} from './basvuru/uyumMatrisi.ts';

export function matrisiUret(): { md: string; csv: string; ozet: ReturnType<typeof uyumOzeti> } {
  const kazanimlar = (JSON.parse(readFileSync('src/content/kazanimlar.json', 'utf8')) as { kazanimlar: UyumKazanimi[] })
    .kazanimlar;
  const beceriler = JSON.parse(readFileSync('src/content/skills.json', 'utf8')) as UyumBecerisi[];
  const kodlar = DUGUM_KODLARI as Readonly<Record<string, string>>;
  const satirlar = uyumMatrisi(
    kazanimlar,
    beceriler,
    (t) => REGISTRY.has(t as never),
    (id) => kodlar[id] ?? null,
  );
  return { md: uyumMarkdown(satirlar), csv: uyumCsv(satirlar), ozet: uyumOzeti(satirlar) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { md, csv, ozet } = matrisiUret();
  mkdirSync('docs/basvuru', { recursive: true });
  writeFileSync('docs/basvuru/meb-uyum-matrisi.md', md);
  writeFileSync('docs/basvuru/meb-uyum-matrisi.csv', csv);
  console.log(
    `✓ Uyum matrisi: ${ozet.kapsanan}/${ozet.kazanim} kazanım, ${ozet.beceri} beceri, ${ozet.sablon} şablon.`,
  );
}
