/**
 * Lisans envanteri kapısı K10 (plan v2 Adım 21).
 *
 *   npm run lisans:denetle            denetler; sorun varsa çıkış 1 (CI)
 *   npm run lisans:denetle -- --yaz   LICENSES.md üretilmiş bölümünü yeniden yazar
 *
 * Denetimler: (1) package.json "dependencies" her biri envanterde; (2) envanterdeki her npm
 * paketinin lisans adı node_modules/<paket>/package.json "license" ile aynı; (3) public/fonts
 * altındaki her font ailesi envanterde; (4) LICENSES.md tablo bölümü envanterden üretilen metinle
 * aynı; (5) ses satırı sesKaynagi.json aktif kaynağıyla aynı; (6) package.json "license" alanı var.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  UCUNCU_TARAF_VARLIKLAR,
  lisansTablolariMetni,
  sesVarligi,
  type UcuncuTarafVarlik,
} from '../src/content/ucuncuTarafVarliklar';

const BAS = '<!-- lisans:basla -->';
const BIT = '<!-- lisans:bitir -->';

export function uretilmisBolum(liste: readonly UcuncuTarafVarlik[] = UCUNCU_TARAF_VARLIKLAR): string {
  return `${BAS}\n${lisansTablolariMetni(liste)}\n${BIT}`;
}

export function bolumOku(markdown: string): string | null {
  const b = markdown.indexOf(BAS);
  const s = markdown.indexOf(BIT);
  return b < 0 || s < b ? null : markdown.slice(b, s + BIT.length);
}

/** `Andika-Bold-latin-ext.woff2` → `Andika`. */
export function fontAilesi(dosya: string): string {
  return dosya.replace(/\.(woff2?|ttf|otf)$/, '').split('-')[0];
}

const json = (yol: string) => JSON.parse(readFileSync(yol, 'utf8')) as Record<string, unknown>;

export function denetle(kok: string, liste: readonly UcuncuTarafVarlik[] = UCUNCU_TARAF_VARLIKLAR): string[] {
  const sorunlar: string[] = [];
  const paket = json(path.join(kok, 'package.json')) as { license?: string; dependencies?: Record<string, string> };
  const adlar = new Set(liste.map((v) => v.ad));

  if (!paket.license) sorunlar.push('package.json: "license" alanı yok (ADR-0013)');

  for (const dep of Object.keys(paket.dependencies ?? {})) {
    if (!adlar.has(dep)) sorunlar.push(`envanterde yok: bağımlılık "${dep}" (src/content/ucuncuTarafVarliklar.ts)`);
  }

  for (const v of liste.filter((x) => x.tur === 'bagimlilik' || x.tur === 'arac')) {
    const pj = path.join(kok, 'node_modules', v.ad, 'package.json');
    if (!existsSync(pj)) continue; // npm dışı araç (Piper)
    const gercek = json(pj).license;
    if (gercek !== v.lisans) sorunlar.push(`lisans uyuşmuyor: ${v.ad} envanter "${v.lisans}", node_modules "${String(gercek)}"`);
  }

  const fontDizini = path.join(kok, 'public/fonts');
  const aileler = new Set(
    existsSync(fontDizini) ? readdirSync(fontDizini).filter((d) => /\.(woff2?|ttf|otf)$/.test(d)).map(fontAilesi) : [],
  );
  for (const aile of aileler) {
    if (!liste.some((v) => v.tur === 'font' && v.ad === aile)) sorunlar.push(`envanterde yok: font "${aile}" (public/fonts)`);
  }

  const ses = sesVarligi(json(path.join(kok, 'src/content/sesKaynagi.json')) as { modelKimligi: string; ticariDagitimIzni: boolean });
  const sesSatiri = liste.find((v) => v.tur === 'ses');
  if (!sesSatiri || JSON.stringify(sesSatiri) !== JSON.stringify(ses)) {
    sorunlar.push('ses satırı sesKaynagi.json aktif kaynağıyla aynı değil');
  }

  const lisanslar = readFileSync(path.join(kok, 'LICENSES.md'), 'utf8');
  const bolum = bolumOku(lisanslar);
  if (bolum === null) sorunlar.push(`LICENSES.md: ${BAS} … ${BIT} bölümü yok`);
  else if (bolum !== uretilmisBolum(liste)) sorunlar.push('LICENSES.md: tablo bölümü envanterle aynı değil (npm run lisans:denetle -- --yaz)');

  return sorunlar;
}

function main(): void {
  const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  if (process.argv.includes('--yaz')) {
    const yol = path.join(kok, 'LICENSES.md');
    const metin = readFileSync(yol, 'utf8');
    const eski = bolumOku(metin);
    if (eski === null) throw new Error(`LICENSES.md içinde ${BAS} … ${BIT} yok.`);
    writeFileSync(yol, metin.replace(eski, uretilmisBolum()));
    console.log('LICENSES.md üçüncü taraf bölümü yeniden üretildi.');
    return;
  }
  const sorunlar = denetle(kok);
  if (sorunlar.length === 0) {
    console.log(`✓ Lisans envanteri temiz (${UCUNCU_TARAF_VARLIKLAR.length} varlık).`);
    return;
  }
  console.error(`✗ ${sorunlar.length} lisans envanteri sorunu (K10):`);
  for (const s of sorunlar) console.error(`  ${s}`);
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
