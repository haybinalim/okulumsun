/**
 * Ses üretim hattı.
 *
 * src/content/tr.json  ->  public/audio/**.m4a  +  src/audio/audioManifest.generated.ts
 *
 * NEDEN ÖNCEDEN ÜRETİLMİŞ DOSYA, WEB SPEECH DEĞİL:
 * Çocuk okuyamıyor; ses susarsa uygulama tamamen kullanılamaz hâle gelir.
 * Web Speech API bunu garanti edemiyor — iOS'ta zil anahtarı kapalıyken susuyor,
 * bazı Android'lerde tr-TR sesi hiç yok, Chrome'un Google sesleri sunucu taraflı
 * (çevrimdışı sessizlik), 15sn üstü konuşmalarda motor donuyor. Bu yüzden
 * ses bir çalışma zamanı bağımlılığı değil, derleme zamanı varlığı.
 *
 * SAĞLAYICI SEÇİMİ (TTS_PROVIDER):
 *   say   — macOS Yelda. Bedava, sınırsız, çevrimdışı, hesap gerekmez.
 *           Prototip varsayılanı; kalite orta ama akışı bugün test ettirir.
 *   piper — Piper TTS (MIT). Üretim hedefi: yerel, bedava, dağıtım lisansı net.
 *   eleven— ElevenLabs. Ücretsiz kredi sınırlı; yalnız maskot replikleri için.
 *           UYARI: ücretsiz katmanın ticari dağıtım şartları yayın öncesi
 *           doğrulanmalı. Doğrulanamazsa piper tek başına yeterli.
 *
 * ARTIMLI ÜRETİM: yalnız metni değişen anahtarlar yeniden sentezlenir (hash
 * karşılaştırması). Ücretli sağlayıcılarda bu, maliyeti sıfıra yakın tutar.
 *
 * Kullanım:
 *   npm run audio            (varsayılan: say)
 *   TTS_PROVIDER=piper npm run audio
 *   npm run audio -- --force (hash'i yoksay, hepsini yeniden üret)
 */

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content/tr.json');
const OUT_AUDIO = path.join(ROOT, 'public/audio');
const OUT_MANIFEST = path.join(ROOT, 'src/audio/audioManifest.generated.ts');
const CACHE = path.join(ROOT, 'public/audio/.hashes.json');

const FORCE = process.argv.includes('--force');
const PROVIDER = (process.env.TTS_PROVIDER ?? 'say') as 'say' | 'piper' | 'eleven';

/**
 * Konuşma hızı: normalden ~%10 yavaş.
 * macOS varsayılanı ~175 kelime/dakika; 158 bunun %90'ı.
 * 6 yaşındaki çocuk normal hızda talimatı takip edemiyor.
 */
const SAY_RATE = 158;
const SAY_VOICE = 'Yelda';

/**
 * Yerel, dağıtılmayan Türkçe Piper modeli. Model dosyası kaynak depoya eklenmez;
 * `PIPER_MODEL` ile başka bir ses/model yolu da verilebilir.
 */
const DEFAULT_PIPER_MODEL = path.join(ROOT, '.tools', 'piper', 'tr_TR-dfki-medium.onnx');

/** Service worker'ın önden önbelleğe alacağı ad alanları. */
const CORE_NAMESPACES = ['ui', 'geri', 'yardim', 'soru', 'op', 'sayi'];

interface Clip {
  key: string;
  text: string;
  file: string;
  core: boolean;
}

// ---------------------------------------------------------------- içerik okuma

/** Türkçe sayı adları — 0-100. Ritmik sayma kazanımı (MAT.1.1.5) 100'e kadar. */
function turkishNumber(n: number): string {
  const ones = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
  const tens = [
    '',
    'on',
    'yirmi',
    'otuz',
    'kırk',
    'elli',
    'altmış',
    'yetmiş',
    'seksen',
    'doksan',
  ];
  if (n === 100) return 'yüz';
  if (n < 10) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? tens[t] : `${tens[t]} ${ones[o]}`;
}

async function collectClips(): Promise<Clip[]> {
  const raw = JSON.parse(await readFile(CONTENT, 'utf8')) as Record<string, unknown>;
  const clips: Clip[] = [];

  for (const [ns, value] of Object.entries(raw)) {
    // '$' ile başlayan anahtarlar insan için not; ses üretilmez.
    if (ns.startsWith('$') || typeof value !== 'object' || value === null) continue;
    const core = CORE_NAMESPACES.includes(ns);
    const group = value as Record<string, string>;

    // Sayılar elle yazılmaz, üretilir.
    if (group.$uret === 'sayilar') {
      for (let n = 0; n <= 100; n++) {
        clips.push({ key: `sayi.${n}`, text: turkishNumber(n), file: `sayi/${n}.m4a`, core });
      }
      continue;
    }

    for (const [k, text] of Object.entries(group)) {
      if (k.startsWith('$') || typeof text !== 'string') continue;
      clips.push({ key: `${ns}.${k}`, text, file: `${ns}/${k}.m4a`, core });
    }
  }
  return clips;
}

// ------------------------------------------------------------------ sentezleme

async function synthSay(text: string, out: string): Promise<void> {
  const tmp = `${out}.aiff`;
  await exec('say', ['-v', SAY_VOICE, '-r', String(SAY_RATE), '-o', tmp, text]);
  // 24 kHz mono AAC: konuşma için fazlasıyla yeterli, m4a her tarayıcıda çalar.
  // (Opus daha küçük ama Safari'de kap desteği tutarsız — risk almaya değmez.)
  await exec('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', tmp,
    '-ac', '1', '-ar', '24000',
    '-c:a', 'aac', '-b:a', '40k',
    out,
  ]);
  await rm(tmp, { force: true });
}

async function synthPiper(text: string, out: string): Promise<void> {
  const model = path.resolve(ROOT, process.env.PIPER_MODEL ?? DEFAULT_PIPER_MODEL);
  const config = `${model}.json`;
  if (!existsSync(model) || !existsSync(config)) {
    throw new Error(
      `Piper modeli bulunamadı: ${model}. ` +
      'Model ve .onnx.json eşini .tools/piper/ altına koyun veya PIPER_MODEL ile model yolunu verin.',
    );
  }

  const tmp = `${out}.wav`;
  // `execFile` doğrudan stdin girdisi kabul etmez; metni güvenli biçimde pipe ederiz.
  await exec('sh', [
    '-c',
    `printf '%s' ${JSON.stringify(text)} | piper --model ${JSON.stringify(model)} ` +
      `--config ${JSON.stringify(config)} --output_file ${JSON.stringify(tmp)} --length-scale 1.1`,
  ]);
  await exec('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', tmp,
    '-ac', '1', '-ar', '24000',
    '-c:a', 'aac', '-b:a', '40k',
    out,
  ]);
  await rm(tmp, { force: true });
}

async function synth(text: string, out: string): Promise<void> {
  switch (PROVIDER) {
    case 'say':
      return synthSay(text, out);
    case 'piper':
      return synthPiper(text, out);
    case 'eleven':
      throw new Error(
        'ElevenLabs sağlayıcısı henüz bağlanmadı. Bağlamadan önce ücretsiz katmanın\n' +
          'üretilen sesi bir uygulamada dağıtma iznini verdiği doğrulanmalı.',
      );
  }
}

// ------------------------------------------------------------------- manifesto

function buildManifest(clips: Clip[]): string {
  const lines = clips
    .map((c) => `  '${c.key}': { file: '${c.file}', core: ${c.core} },`)
    .join('\n');

  return `// ÜRETİLMİŞ DOSYA — elle düzenlemeyin.
// Kaynak: src/content/tr.json · Üretici: scripts/generate-audio.ts
// Yeniden üretmek için: npm run audio

export interface AudioClip {
  /** public/audio/ altındaki göreli yol. */
  readonly file: string;
  /** Service worker tarafından önden önbelleğe alınsın mı. */
  readonly core: boolean;
}

export const AUDIO_MANIFEST = {
${lines}
} as const satisfies Record<string, AudioClip>;

/**
 * Konuşulabilir her metnin anahtarı.
 * Bu birleşim tipi sayesinde var olmayan bir sese başvurmak DERLEME hatası olur —
 * çalışma anında sessiz kalan bir ekran değil.
 */
export type SpeechKey = keyof typeof AUDIO_MANIFEST;

export const CORE_KEYS: readonly SpeechKey[] = Object.entries(AUDIO_MANIFEST)
  .filter(([, v]) => v.core)
  .map(([k]) => k as SpeechKey);
`;
}

// ------------------------------------------------------------------------ ana

async function main(): Promise<void> {
  const clips = await collectClips();
  console.log(`${clips.length} klip · sağlayıcı: ${PROVIDER}${FORCE ? ' · --force' : ''}`);

  const hashes: Record<string, string> =
    !FORCE && existsSync(CACHE) ? JSON.parse(await readFile(CACHE, 'utf8')) : {};

  let made = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const clip of clips) {
    const out = path.join(OUT_AUDIO, clip.file);
    // Hash'e sağlayıcıyı da kat: sağlayıcı değişince tüm klipler yenilenmeli.
    const hash = createHash('sha256').update(`${PROVIDER}:${clip.text}`).digest('hex').slice(0, 16);

    if (hashes[clip.key] === hash && existsSync(out)) {
      skipped++;
      continue;
    }

    await mkdir(path.dirname(out), { recursive: true });
    try {
      await synth(clip.text, out);
      hashes[clip.key] = hash;
      made++;
      if (made % 25 === 0) console.log(`  ${made} üretildi...`);
    } catch (err) {
      failures.push(`${clip.key}: ${(err as Error).message.split('\n')[0]}`);
    }
  }

  await writeFile(CACHE, JSON.stringify(hashes, null, 2));
  await mkdir(path.dirname(OUT_MANIFEST), { recursive: true });
  await writeFile(OUT_MANIFEST, buildManifest(clips));

  console.log(`\nüretilen: ${made} · atlanan: ${skipped} · toplam: ${clips.length}`);
  console.log(`manifesto: ${path.relative(ROOT, OUT_MANIFEST)}`);

  if (failures.length) {
    console.error(`\n${failures.length} klip üretilemedi:`);
    for (const f of failures.slice(0, 10)) console.error(`  ${f}`);
    // Eksik ses = o ekranda sessizlik = kullanılamaz ürün. Sessizce geçilmez.
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
