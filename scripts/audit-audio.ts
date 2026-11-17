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
 *   - KÖKEN (Adım 15): her klibin özeti aktif ses kaynağıyla (sağlayıcı + model
 *     kimliği) üretilmiş mi; aktif kaynağın ticari dağıtım izni var mı.
 *     İzin yoksa çıkış 1 (ADR-0004; Adım 31'den beri geçiş istisnası yok — K4 tam).
 *
 * Kullanım: npm run audio:audit
 */

import { readFile, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { klipleriTopla } from './ses/klipler.ts';
import { GECICI_KLIP_SONEKI } from './ses/geciciAd.ts';
import { kokenDenetle, ozetDosyasiniOku, sesKaynagiDosyasiniAyir } from './ses/sesKaynagi.ts';
import { TUR_SES_DIZINI, retListesiniOku, telaffuzListesiniOku, turKlipDosyasi, turKlipleriniAyir } from './ses/turKlipleri.ts';

const exec = promisify(execFile);
/** Depo kökü. `OKULUMSUN_DENETIM_KOKU` yalnız testler içindir (geçici ağaç; depodaki gerçek klasörlere dokunulmaz). */
const ROOT = process.env.OKULUMSUN_DENETIM_KOKU
  ? path.resolve(process.env.OKULUMSUN_DENETIM_KOKU)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO = path.join(ROOT, 'public/audio');
const MANIFEST = path.join(ROOT, 'src/audio/audioManifest.generated.ts');
const CONTENT = path.join(ROOT, 'src/content/tr.json');
const SES_KAYNAGI = path.join(ROOT, 'src/content/sesKaynagi.json');
const HASHES = path.join(AUDIO, '.hashes.json');

/** Bu boyutun altı neredeyse kesin sessizlik (AAC başlığı bile daha büyük). */
const MIN_BYTES = 800;
/** Türkçe konuşma kabaca 12 karakter/saniye. Bunun yarısından kısaysa yutulmuş. */
const CHARS_PER_SEC = 12;
/** CI tanısı için gerektiğinde geçersiz bir yol verilerek hata akışı sınanabilir. */
const FFPROBE_COMMAND = process.env.AUDIO_AUDIT_FFPROBE ?? 'ffprobe';

type DurationResult = {
  seconds: number | null;
  /** ffprobe çağrısı veya çıktısı geçersiz olduğunda CI tanısı için ayrıntı. */
  diagnostic?: string;
};

function formatProbeError(file: string, error: unknown): string {
  const e = error as NodeJS.ErrnoException & {
    code?: string | number;
    signal?: string | null;
    stdout?: string;
    stderr?: string;
  };
  const fields = [
    `komut=${FFPROBE_COMMAND} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${JSON.stringify(file)}`,
    `dosya=${file}`,
    e.code !== undefined ? `kod=${String(e.code)}` : null,
    e.signal ? `sinyal=${e.signal}` : null,
    e.path ? `yol=${e.path}` : null,
    e.stderr?.trim() ? `stderr=${e.stderr.trim()}` : null,
    e.stdout?.trim() ? `stdout=${e.stdout.trim()}` : null,
    e.message ? `ileti=${e.message}` : null,
  ].filter((field): field is string => field !== null);

  return fields.join(' | ');
}

async function duration(file: string): Promise<DurationResult> {
  try {
    const { stdout } = await exec(FFPROBE_COMMAND, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file,
    ]);
    const d = Number.parseFloat(stdout.trim());
    return Number.isFinite(d)
      ? { seconds: d }
      : {
          seconds: null,
          diagnostic: `komut=${FFPROBE_COMMAND} | dosya=${file} | ileti=ffprobe sayısal olmayan süre döndürdü | stdout=${JSON.stringify(stdout.trim())}`,
        };
  } catch (error) {
    return { seconds: null, diagnostic: formatProbeError(file, error) };
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

/**
 * Türkçe klipler (Okuma Yazma, `ders-verisi/tur/ses/`): manifestte `var` olan her klibin dosyası olmalı, makul
 * boyut/süre, köken özeti `.hashes.json`'da klibin kaynağıyla eşleşmeli; manifestte olmayan .m4a yetimdir.
 * `eksik` klip burada hata DEĞİL (yayın kapısı: `npm run validate -- --yayin`, D-21).
 */
async function turDenetle(problems: string[], durationDiagnostics: string[]): Promise<void> {
  const manifestYolu = path.join(ROOT, TUR_SES_DIZINI, 'klipler.json');
  if (!existsSync(manifestYolu)) {
    problems.push(`TÜRKÇE     ${TUR_SES_DIZINI}/klipler.json yok — \`npm run tur:klip\``);
    return;
  }
  const ham = JSON.parse(await readFile(manifestYolu, 'utf8')) as { klipler: { anahtar: string; durum: string; dosya?: string }[] };
  const clips = turKlipleriniAyir(ham);
  const sesli = ham.klipler.filter((k) => k.durum === 'var');
  const metin = new Map(clips.map((c) => [c.key, c.text]));
  const dizin = path.join(ROOT, TUR_SES_DIZINI);
  let bayt = 0;
  for (const k of sesli) {
    const dosya = turKlipDosyasi(k.anahtar);
    if (k.dosya !== dosya) problems.push(`TÜRKÇE     ${k.anahtar}: manifest dosyası "${k.dosya}" ≠ beklenen "${dosya}"`);
    const tam = path.join(dizin, dosya);
    if (!existsSync(tam)) {
      problems.push(`TÜRKÇE EKSİK ${k.anahtar} -> ${dosya} (manifestte var)`);
      continue;
    }
    const { size } = await stat(tam);
    bayt += size;
    if (size < MIN_BYTES) {
      problems.push(`TÜRKÇE SESSİZ? ${k.anahtar} (${size} bayt)`);
      continue;
    }
    const sonuc = await duration(tam);
    if (sonuc.seconds === null) {
      problems.push(`TÜRKÇE OKUNAMADI ${k.anahtar} -> ${dosya}`);
      durationDiagnostics.push(`  ${k.anahtar} -> ${dosya}\n    ${sonuc.diagnostic ?? 'Tanı ayrıntısı üretilemedi.'}`);
    } else {
      const beklenen = (metin.get(k.anahtar) ?? '').length / CHARS_PER_SEC;
      if (sonuc.seconds < beklenen * 0.5) problems.push(`TÜRKÇE KISA ${k.anahtar} — ${sonuc.seconds.toFixed(2)}sn, beklenen ~${beklenen.toFixed(2)}sn`);
    }
  }
  const bilinen = new Set(sesli.map((k) => turKlipDosyasi(k.anahtar)));
  // Ret listesi (kulakla reddedilen): üretilmez, durum eksik; manifestte `var` kalmışsa ya da anahtar bilinmiyorsa tutarsızdır.
  const ret = retListesiniOku(ROOT);
  const retDosyalari = new Set(Object.keys(ret).map(turKlipDosyasi));
  for (const k of Object.keys(ret)) {
    if (!metin.has(k)) problems.push(`TÜRKÇE REDDEDİLEN ${k} — reddedilen.json'da ama klipler.json'da yok`);
    if (sesli.some((s) => s.anahtar === k)) problems.push(`TÜRKÇE REDDEDİLEN ${k} — reddedilmiş ama manifestte "var" (\`npm run tur:klip\`)`);
  }
  // Telaffuz ayarı (sentez girdisi): anahtar manifestte olmalı; ayarlı klipler raporda sayılır, köken özeti ayarı da içerir.
  const telaffuz = telaffuzListesiniOku(ROOT);
  for (const k of Object.keys(telaffuz)) {
    if (!metin.has(k)) problems.push(`TÜRKÇE TELAFFUZ ${k} — telaffuz.json'da ama klipler.json'da yok`);
  }
  const yetim = (await walk(dizin)).filter((f) => !bilinen.has(f));
  for (const y of yetim.slice(0, 10)) {
    problems.push(
      retDosyalari.has(y)
        ? `TÜRKÇE REDDEDİLEN DOSYA ${y} (kulakla reddedilmiş; durum eksik ama dosya diskte ve yayına girer — silin)`
        : `TÜRKÇE YETİM ${y} (manifestte var değil; \`npm run tur:klip\`)`,
    );
  }
  if (sesli.length > 0) {
    const { aktif, anahtarSesleri } = sesKaynagiDosyasiniAyir(JSON.parse(await readFile(SES_KAYNAGI, 'utf8')) as Record<string, unknown>);
    const hashYolu = path.join(dizin, '.hashes.json');
    const ozetler = existsSync(hashYolu) ? ozetDosyasiniOku(JSON.parse(await readFile(hashYolu, 'utf8'))).ozetler : {};
    const ayarli = clips.map((c) => {
      const v = telaffuz[c.key];
      return v ? { ...c, telaffuz: v.ssml !== undefined ? { ssml: v.ssml } : { metin: v.metin! } } : c;
    });
    const koken = kokenDenetle(aktif, ayarli.filter((c) => bilinen.has(c.file)), ozetler, anahtarSesleri);
    for (const k of koken.ozetsiz) problems.push(`TÜRKÇE ÖZETSİZ ${k} (ders-verisi/tur/ses/.hashes.json'da yok)`);
    for (const k of koken.eslesmeyen) problems.push(`TÜRKÇE KÖKEN ${k} — özet klibin kaynağıyla eşleşmiyor (metin/ses değişti: \`npm run audio -- --ders tur\`)`);
  }
  console.log(`Türkçe: ${sesli.length}/${ham.klipler.length} klip sesli · eksik ${ham.klipler.length - sesli.length} · reddedildi ${Object.keys(ret).length} · telaffuz ayarlı ${Object.keys(telaffuz).length} · ${(bayt / 1048576).toFixed(2)} MB`);
}

async function main(): Promise<void> {
  const manifestSrc = await readFile(MANIFEST, 'utf8');
  const entries = [...manifestSrc.matchAll(/'([^']+)':\s*\{\s*file:\s*'([^']+)'/g)].map(
    ([, key, file]) => ({ key, file }),
  );

  // Klip metinleri üreticiyle AYNI modülden gelir (ikinci düzleştirme yazmak yasak).
  const clips = klipleriTopla(JSON.parse(await readFile(CONTENT, 'utf8')) as Record<string, unknown>);
  const metinler = new Map(clips.map((c) => [c.key, c.text]));
  const textOf = (key: string): string | null => {
    if (key.startsWith('sayi.')) return null; // sayı adları üretiliyor, süre denetimi dışı
    return metinler.get(key) ?? null;
  };

  const problems: string[] = [];
  const durationDiagnostics: string[] = [];
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
      const result = await duration(full);
      if (result.seconds === null) {
        problems.push(`OKUNAMADI  ${key} -> ${file}`);
        durationDiagnostics.push(
          `  ${key} -> ${file}\n    ${result.diagnostic ?? 'Tanı ayrıntısı üretilemedi.'}`,
        );
      } else {
        const expected = text.length / CHARS_PER_SEC;
        if (result.seconds < expected * 0.5) {
          problems.push(
            `KISA       ${key} — ${result.seconds.toFixed(2)}sn, beklenen ~${expected.toFixed(2)}sn ("${text}")`,
          );
        }
      }
    }
  }

  // Yetim dosyalar: manifestodan çıkarılmış ama diskte kalmış klipler.
  const onDisk = await walk(AUDIO);
  const known = new Set(entries.map((e) => e.file));
  const orphans = onDisk.filter((f) => !known.has(f));
  // Üretim betiğinin yarıda kesilmesinden (kill -9) kalan geçici klip: dist'e ve precache'e sızar → CI kırmızı.
  for (const g of orphans.filter((f) => f.endsWith(GECICI_KLIP_SONEKI))) {
    problems.push(`GEÇİCİ     ${g} (yarım kalmış üretim; silin ve \`npm run audio -- --yeniden-dogrula\` çalıştırın)`);
  }

  // Manifest ile içerik aynı klip kümesini tanımlamalı.
  const manifestAnahtarlari = new Set(entries.map((e) => e.key));
  for (const c of clips) if (!manifestAnahtarlari.has(c.key)) problems.push(`MANİFESTSİZ ${c.key}`);
  for (const k of manifestAnahtarlari) if (!metinler.has(k)) problems.push(`İÇERİKSİZ  ${k}`);

  // Köken denetimi.
  // Köken her zaman AKTİF kaynağa göre denetlenir (`bekleyen` varsa yalnız doğrulanır).
  // Anahtar bazlı sesler (KG-114): maskot/hikâye klipleri kendi sesinin özetiyle denetlenir.
  const { aktif, anahtarSesleri } = sesKaynagiDosyasiniAyir(JSON.parse(await readFile(SES_KAYNAGI, 'utf8')) as Record<string, unknown>);
  const ozetDosyasi = existsSync(HASHES)
    ? ozetDosyasiniOku(JSON.parse(await readFile(HASHES, 'utf8')))
    : { kaynak: null, ozetler: {} };
  const koken = kokenDenetle(aktif, clips, ozetDosyasi.ozetler, anahtarSesleri);
  for (const k of koken.ozetsiz) problems.push(`ÖZETSİZ    ${k} (.hashes.json'da yok)`);
  for (const k of koken.eslesmeyen) problems.push(`KÖKEN      ${k} — özet klibin kaynağıyla eşleşmiyor`);

  console.log(`${checked}/${entries.length} klip denetlendi · ${(totalBytes / 1048576).toFixed(2)} MB`);
  console.log(
    `köken: ${aktif.modelKimligi} · yeni özet ${koken.yeniEslesen} · eski 'piper:' özeti ${koken.eskiEslesen}`,
  );
  for (const a of anahtarSesleri) {
    const n = clips.filter((c) => a.onekler.some((o) => c.key.startsWith(o))).length;
    console.log(`anahtar sesi (${a.karar}): ${a.onekler.join(', ')} → ${a.modelKimligi} hız ${a.hiz} · ${n} klip`);
  }
  await turDenetle(problems, durationDiagnostics);
  // K4 (Adım 31): ticari izinsiz kaynak her zaman kırmızı; geçiş istisnası kaldırıldı.
  if (koken.lisansUyarisi) problems.push(koken.lisansUyarisi);
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
  if (durationDiagnostics.length) {
    console.error(`\n${durationDiagnostics.length} süre analizi hata ayrıntısı:`);
    for (const diagnostic of durationDiagnostics) console.error(diagnostic);
  }
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
