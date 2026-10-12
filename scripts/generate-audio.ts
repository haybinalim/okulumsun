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
 * SES KAYNAĞI (Adım 15, KG-01/KG-08/KG-15):
 *   Aktif kaynak src/content/sesKaynagi.json'da tanımlıdır; TTS_PROVIDER verilmezse
 *   betik o kaynağın sağlayıcısını kullanır. Özet, sağlayıcıya ek olarak MODEL
 *   KİMLİĞİNİ de içerir: model değişince tüm klipler yenilenir ve audio:audit
 *   kökeni denetleyebilir. Ayrıntı: docs/ses/SES_KAYNAKLARI.md
 *   piper — yalnız geliştirme aracı (GPL-3.0). Türkçe tr_TR-dfki modeli CC BY-NC-SA
 *           (ticari değil), fahrettin/fettah kaldırıldı → üretimde KULLANILMAZ.
 *   say   — macOS Yelda; YALNIZ `--prototip` bayrağıyla, çıktı public/audio-prototip/
 *           (gitignore). Apple lisansı ticari dağıtıma izin vermez.
 *   eleven— KG-01 gereği kullanılmaz; çağrılırsa hata fırlatır.
 *   google— Google Cloud TTS Chirp 3 HD tr-TR (KG-01); Adım 31'de bağlanacak.
 *
 * ARTIMLI ÜRETİM: yalnız metni değişen anahtarlar yeniden sentezlenir (hash
 * karşılaştırması). Ücretli sağlayıcılarda bu, maliyeti sıfıra yakın tutar.
 *
 * Kullanım:
 *   npm run audio                       (aktif kaynak: src/content/sesKaynagi.json)
 *   npm run audio -- --prototip         (macOS say; çıktı public/audio-prototip/, dağıtılmaz)
 *   npm run audio -- --force            (hash'i yoksay, hepsini yeniden üret)
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { klipleriTopla, type Clip } from './ses/klipler.ts';
import {
  klipOzeti,
  ozetDosyasiniOku,
  sesKaynaginiDogrula,
  type SesKaynagi,
} from './ses/sesKaynagi.ts';

const exec = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content/tr.json');
const SES_KAYNAGI = path.join(ROOT, 'src/content/sesKaynagi.json');
const OUT_MANIFEST = path.join(ROOT, 'src/audio/audioManifest.generated.ts');

const FORCE = process.argv.includes('--force');
/** macOS `say` yalnız prototip içindir; çıktısı dağıtılan klasöre asla yazılmaz. */
const PROTOTIP = process.argv.includes('--prototip');
const OUT_AUDIO = path.join(ROOT, PROTOTIP ? 'public/audio-prototip' : 'public/audio');
const CACHE = path.join(OUT_AUDIO, '.hashes.json');

type Provider = 'say' | 'piper' | 'eleven' | 'google';

/** Aktif kaynağı okur; `--prototip` → say. `TTS_PROVIDER` yalnız kaynağın sağlayıcısını geçersiz kılar. */
async function aktifKaynagiOku(): Promise<{ kaynak: SesKaynagi; provider: Provider }> {
  if (PROTOTIP) {
    return {
      kaynak: {
        saglayici: 'say',
        modelKimligi: `say:${SAY_VOICE}@${SAY_RATE}`,
        lisansUrl: 'https://www.apple.com/legal/sla/',
        ticariDagitimIzni: false,
        cocukUrunundeKullanim: 'bilinmiyor',
        atifSarti: null,
      },
      provider: 'say',
    };
  }
  const { $not: _not, ...ham } = JSON.parse(await readFile(SES_KAYNAGI, 'utf8')) as Record<string, unknown>;
  const kaynak = sesKaynaginiDogrula(ham);
  const istenen = process.env.TTS_PROVIDER ?? kaynak.saglayici;
  if (istenen === 'say') {
    throw new Error('macOS say yalnız --prototip bayrağıyla kullanılabilir (çıktı public/audio-prototip/).');
  }
  if (istenen !== 'piper' && istenen !== 'eleven' && istenen !== 'google') {
    throw new Error(`Desteklenmeyen TTS_PROVIDER: ${istenen}`);
  }
  if (istenen !== kaynak.saglayici) {
    throw new Error(
      `TTS_PROVIDER=${istenen} aktif kaynakla (${kaynak.saglayici}) uyuşmuyor. ` +
        'Önce src/content/sesKaynagi.json güncellenmeli (model kimliği özete girer).',
    );
  }
  return { kaynak, provider: istenen };
}

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

async function synth(provider: Provider, text: string, out: string): Promise<void> {
  switch (provider) {
    case 'say':
      return synthSay(text, out);
    case 'piper':
      return synthPiper(text, out);
    case 'eleven':
      throw new Error('ElevenLabs kullanılmaz (KG-01, ADR-0004).');
    case 'google':
      throw new Error('Google Cloud TTS sağlayıcısı Adım 31\'de bağlanacak (KG-01).');
  }
}

// ------------------------------------------------------------------- manifesto

function buildManifest(clips: readonly Clip[]): string {
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
  const { kaynak, provider } = await aktifKaynagiOku();
  const clips = klipleriTopla(JSON.parse(await readFile(CONTENT, 'utf8')) as Record<string, unknown>);
  console.log(
    `${clips.length} klip · kaynak: ${kaynak.modelKimligi}${PROTOTIP ? ' · --prototip' : ''}${FORCE ? ' · --force' : ''}`,
  );
  if (!kaynak.ticariDagitimIzni) {
    console.warn('UYARI LİSANS: aktif ses kaynağının ticari dağıtım izni yok (ADR-0004).');
  }

  // Geriye uyum: eski düz biçim de okunur; yazarken yeni biçim ({ $kaynak, ... }) kullanılır.
  const hashes: Record<string, string> =
    !FORCE && existsSync(CACHE)
      ? { ...ozetDosyasiniOku(JSON.parse(await readFile(CACHE, 'utf8'))).ozetler }
      : {};

  let made = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const clip of clips) {
    const out = path.join(OUT_AUDIO, clip.file);
    // Özete sağlayıcı + model kimliği girer: model değişince tüm klipler yenilenir.
    const hash = klipOzeti(kaynak, clip.text);

    if (hashes[clip.key] === hash && existsSync(out)) {
      skipped++;
      continue;
    }

    await mkdir(path.dirname(out), { recursive: true });
    try {
      await synth(provider, clip.text, out);
      hashes[clip.key] = hash;
      made++;
      if (made % 25 === 0) console.log(`  ${made} üretildi...`);
    } catch (err) {
      failures.push(`${clip.key}: ${(err as Error).message.split('\n')[0]}`);
    }
  }

  await mkdir(OUT_AUDIO, { recursive: true });
  await writeFile(CACHE, JSON.stringify({ $kaynak: kaynak, ...hashes }, null, 2));
  // Prototip çıktısı dağıtılmadığı için manifesto yalnız gerçek üretimde yazılır.
  if (!PROTOTIP) {
    await mkdir(path.dirname(OUT_MANIFEST), { recursive: true });
    await writeFile(OUT_MANIFEST, buildManifest(clips));
  }

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
