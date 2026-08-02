/**
 * Ses varlıklarını denetler.
 *
 * Neden gerekli: bozuk veya sessiz bir klip hiçbir hata vermez — sadece o ekran
 * sessiz kalır. Çocuk okuyamadığı için o ekranda ne yapacağını hiç öğrenemez.
 * Bu, uygulamanın en sinsi başarısızlık biçimi, o yüzden makineyle aranıyor.
 *
 * Denetlenenler:
 *   - Manifestodaki her anahtarın dosyası diskte var mı
 *   - Dosya makul boyutta mı (çok küçük = sentez sessiz üretmiş)
 *   - Süre metin uzunluğuyla tutarlı mı (çok kısa = kelime yutulmuş)
 *   - Diskte manifestoda olmayan yetim dosya var mı
 *
 * Kullanım: npm run audio:audit
 */

import { readFile, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO = path.join(ROOT, 'public/audio');
const MANIFEST = path.join(ROOT, 'src/audio/audioManifest.generated.ts');
const CONTENT = path.join(ROOT, 'src/content/tr.json');

/** Bu boyutun altı neredeyse kesin sessizlik (AAC başlığı bile daha büyük). */
const MIN_BYTES = 800;
/** Türkçe konuşma kabaca 12 karakter/saniye. Bunun yarısından kısaysa yutulmuş. */
const CHARS_PER_SEC = 12;

async function duration(file: string): Promise<number | null> {
  try {
    const { stdout } = await exec('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file,
    ]);
    const d = Number.parseFloat(stdout.trim());
    return Number.isFinite(d) ? d : null;
  } catch {
    return null;
  }
}

async function walk(dir: string, base = ''): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await walk(path.join(dir, entry.name), rel)));
    else if (entry.name.endsWith('.m4a')) out.push(rel);
  }
  return out;
}

async function main(): Promise<void> {
  const manifestSrc = await readFile(MANIFEST, 'utf8');
  const entries = [...manifestSrc.matchAll(/'([^']+)':\s*\{\s*file:\s*'([^']+)'/g)].map(
    ([, key, file]) => ({ key, file }),
  );

  // Süre kontrolü için özgün metinleri geri bul.
  const content = JSON.parse(await readFile(CONTENT, 'utf8')) as Record<
    string,
    Record<string, string>
  >;
  const textOf = (key: string): string | null => {
    const [ns, ...rest] = key.split('.');
    const k = rest.join('.');
    if (ns === 'sayi') return null; // sayı adları üretiliyor, ayrı doğrulanıyor
    const v = content[ns]?.[k];
    return typeof v === 'string' ? v : null;
  };

  const problems: string[] = [];
  let totalBytes = 0;
  let checked = 0;

  for (const { key, file } of entries) {
    const full = path.join(AUDIO, file);
    if (!existsSync(full)) {
      problems.push(`EKSİK      ${key} -> ${file}`);
      continue;
    }
    const { size } = await stat(full);
    totalBytes += size;
    checked++;

    if (size < MIN_BYTES) {
      problems.push(`SESSİZ?    ${key} (${size} bayt)`);
      continue;
    }

    const text = textOf(key);
    if (text) {
      const d = await duration(full);
      if (d === null) {
        problems.push(`OKUNAMADI  ${key}`);
      } else {
        const expected = text.length / CHARS_PER_SEC;
        if (d < expected * 0.5) {
          problems.push(
            `KISA       ${key} — ${d.toFixed(2)}sn, beklenen ~${expected.toFixed(2)}sn ("${text}")`,
          );
        }
      }
    }
  }

  // Yetim dosyalar: manifestodan çıkarılmış ama diskte kalmış klipler.
  const onDisk = await walk(AUDIO);
  const known = new Set(entries.map((e) => e.file));
  const orphans = onDisk.filter((f) => !known.has(f));

  console.log(`${checked}/${entries.length} klip denetlendi · ${(totalBytes / 1048576).toFixed(2)} MB`);
  if (orphans.length) {
    console.log(`\n${orphans.length} yetim dosya (manifestoda yok):`);
    for (const o of orphans.slice(0, 10)) console.log(`  ${o}`);
  }

  if (problems.length === 0) {
    console.log('\n✓ Sorun yok.');
    return;
  }

  console.error(`\n${problems.length} sorun:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
