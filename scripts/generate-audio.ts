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
 *   google— Google Cloud TTS Chirp 3 HD tr-TR (KG-01, ADR-0004 Kabul). Aktif kaynak (Adım 31):
 *           tr-TR-Chirp3-HD-Puck, hız 0,9 (KG-107). İstemci scripts/ses/googleTts.ts. Anahtar:
 *           GOOGLE_TTS_API_KEY (ortam veya gitignore'daki .env.local), asla depoya girmez.
 *           Vekil modu: GOOGLE_TTS_API_KEY=proxy GOOGLE_TTS_UC_NOKTA=<Google uç noktası>
 *           NODE_USE_ENV_PROXY=1 (anahtarı vekil ekler).
 *
 * ARTIMLI ÜRETİM: yalnız metni değişen anahtarlar yeniden sentezlenir (hash
 * karşılaştırması). Ücretli sağlayıcılarda bu, maliyeti sıfıra yakın tutar.
 *
 * Kullanım:
 *   npm run audio                       (aktif kaynak: src/content/sesKaynagi.json)
 *   npm run audio -- --prototip         (macOS say; çıktı public/audio-prototip/, dağıtılmaz)
 *   npm run audio -- --force            (hash'i yoksay, hepsini yeniden üret)
 *   npm run audio -- --en-cok 60        (en çok 60 klip üret ve dur; özetler her klipten sonra
 *                                        yazıldığı için kesilen çalışma kaldığı yerden sürer)
 *   npm run audio -- --ornek [--ses Kore,Aoede,Puck]
 *                                       (KG-04: ses seçimi için ses başına 10 örnek +
 *                                        "on yedi elma" birleştirme örneği; çıktı
 *                                        public/audio-prototip/ornek/<ses>/, dağıtılmaz)
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, rm, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { klipleriTopla, type Clip } from './ses/klipler.ts';
import {
  klipOzeti,
  ozetDosyasiniOku,
  sesKaynagiDosyasiniAyir,
  type SesKaynagi,
} from './ses/sesKaynagi.ts';
import {
  VARSAYILAN_ORNEK_SESLER,
  googleIstegi,
  googleSentezle,
  googleSesAdi,
  modelKimligindenSes,
} from './ses/googleTts.ts';

const exec = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content/tr.json');
const SES_KAYNAGI = path.join(ROOT, 'src/content/sesKaynagi.json');
const OUT_MANIFEST = path.join(ROOT, 'src/audio/audioManifest.generated.ts');

const FORCE = process.argv.includes('--force');
/** Bu çalışmada en çok kaç klip sentezlensin (kota/süre sınırlı ortamlar için). */
const EN_COK = Number.parseInt(process.argv[process.argv.indexOf('--en-cok') + 1] ?? '', 10);
/** macOS `say` yalnız prototip içindir; çıktısı dağıtılan klasöre asla yazılmaz. */
const PROTOTIP = process.argv.includes('--prototip');
/** KG-04: ses seçimi örnekleri. Manifest ve .hashes.json'a dokunmaz. */
const ORNEK = process.argv.includes('--ornek');
const OUT_AUDIO = path.join(ROOT, PROTOTIP ? 'public/audio-prototip' : 'public/audio');
const OUT_ORNEK = path.join(ROOT, 'public/audio-prototip/ornek');

/** Örnek dinleme kümesi: yönerge, geri bildirim, sayı ve birleştirme parçaları (gerçek klip anahtarları). */
const ORNEK_ANAHTARLAR = [
  'soru.hangisi-gelir',
  'soru-olcme.hangisi-agir',
  'veri.grafik',
  'esit.ayni-mi',
  'konum.yaninda',
  'geri.dogru-1',
  'geri.tekrar-1',
  'sayi.7',
  'sayi.17',
  'nesne.elma',
] as const;

function argDegeri(ad: string): string | undefined {
  const i = process.argv.indexOf(ad);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** `GOOGLE_TTS_API_KEY`: önce ortam, sonra gitignore'daki `.env.local`. Değer hiçbir yere yazdırılmaz. */
async function googleAnahtari(): Promise<string> {
  if (process.env.GOOGLE_TTS_API_KEY) return process.env.GOOGLE_TTS_API_KEY;
  const dosya = path.join(ROOT, '.env.local');
  if (existsSync(dosya)) {
    const satir = (await readFile(dosya, 'utf8')).split('\n').find((s) => s.startsWith('GOOGLE_TTS_API_KEY='));
    if (satir) return satir.slice('GOOGLE_TTS_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
  }
  return '';
}
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
  const { aktif: kaynak } = sesKaynagiDosyasiniAyir(
    JSON.parse(await readFile(SES_KAYNAGI, 'utf8')) as Record<string, unknown>,
  );
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

/** WAV baytlarını 24 kHz mono AAC m4a'ya çevirir (diğer sağlayıcılarla aynı biçim). */
async function wavdanM4a(wav: Buffer, out: string): Promise<void> {
  const tmp = `${out}.wav`;
  await writeFile(tmp, wav);
  await exec('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-ac', '1', '-ar', '24000', '-c:a', 'aac', '-b:a', '40k', out]);
  await rm(tmp, { force: true });
}

/** Chirp 3 HD kotası 200 istek/dk/proje → istekler arası ≥350 ms. */
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Gizlilik kanıtı (Adım 31 alt görev 10): yalnız sayılar yazdırılır, içerik değil. */
const sayac = { istek: 0, karakter: 0 };

async function synthGoogle(text: string, out: string, sesAdi: string): Promise<void> {
  sayac.istek++;
  sayac.karakter += [...text].length;
  const wav = await googleSentezle(googleIstegi(text, sesAdi), await googleAnahtari());
  await wavdanM4a(wav, out);
  await bekle(350);
}

let aktifGoogleSesi = '';

async function synth(provider: Provider, text: string, out: string): Promise<void> {
  switch (provider) {
    case 'say':
      return synthSay(text, out);
    case 'piper':
      return synthPiper(text, out);
    case 'eleven':
      throw new Error('ElevenLabs kullanılmaz (KG-01, ADR-0004).');
    case 'google':
      return synthGoogle(text, out, aktifGoogleSesi);
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

/** KG-04: aday seslerle örnek üretimi. Ücretsiz kotanın çok altında (~3 × 150 karakter). */
async function ornekUret(): Promise<void> {
  const sesler = (argDegeri('--ses') ?? VARSAYILAN_ORNEK_SESLER.join(',')).split(',').map((s) => googleSesAdi(s.trim()));
  if (!(await googleAnahtari())) {
    throw new Error('GOOGLE_TTS_API_KEY tanımlı değil (.env.local veya ortam değişkeni). Bkz. ADR-0004.');
  }
  const tumKlipler = klipleriTopla(JSON.parse(await readFile(CONTENT, 'utf8')) as Record<string, unknown>);
  const secilen = ORNEK_ANAHTARLAR.map((k) => {
    const c = tumKlipler.find((x) => x.key === k);
    if (!c) throw new Error(`Örnek anahtarı içerikte yok: ${k}`);
    return c;
  });
  for (const ses of sesler) {
    const dizin = path.join(OUT_ORNEK, ses);
    await mkdir(dizin, { recursive: true });
    for (const c of secilen) await synthGoogle(c.text, path.join(dizin, `${c.key}.m4a`), ses);
    // PLAN §4.3 sayı birleştirme: "on yedi" + "elma" ardışık çalınınca tını tutarlı mı?
    const parcalar = ['sayi.17', 'nesne.elma'].map((k) => path.join(dizin, `${k}.m4a`));
    await exec('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', parcalar[0], '-i', parcalar[1],
      '-filter_complex', '[0:a][1:a]concat=n=2:v=0:a=1', '-c:a', 'aac', '-b:a', '40k',
      path.join(dizin, 'birlesim-on-yedi-elma.m4a'),
    ]);
    console.log(`  ${ses}: ${secilen.length} örnek + birleştirme → ${path.relative(ROOT, dizin)}`);
  }
}

/** Vekil modunda Node'un ortam vekilini kullanması gerekir; yoksa istek vekile uğramaz. */
function vekilUyarisi(): void {
  if (process.env.GOOGLE_TTS_API_KEY === 'proxy' && process.env.NODE_USE_ENV_PROXY !== '1') {
    console.warn('UYARI: GOOGLE_TTS_API_KEY=proxy ama NODE_USE_ENV_PROXY=1 değil — istekler vekile gitmeyebilir.');
  }
}

/** Özet dosyasını atomik yazar (kesilen çalışma yarım JSON bırakmaz). */
async function ozetleriYaz(kaynak: SesKaynagi, hashes: Record<string, string>): Promise<void> {
  const gecici = `${CACHE}.tmp`;
  await writeFile(gecici, JSON.stringify({ $kaynak: kaynak, ...hashes }, null, 2));
  await rename(gecici, CACHE);
}

async function main(): Promise<void> {
  vekilUyarisi();
  if (ORNEK) return ornekUret();
  const { kaynak, provider } = await aktifKaynagiOku();
  if (provider === 'google') aktifGoogleSesi = modelKimligindenSes(kaynak.modelKimligi);
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
  let kalan = 0;
  let ardisikHata = 0;
  const failures: string[] = [];
  // Manifestte olmayan (tr.json'dan silinmiş) anahtarların özetleri atılır.
  const gecerli = new Set(clips.map((c) => c.key));
  for (const k of Object.keys(hashes)) if (!gecerli.has(k)) delete hashes[k];

  for (const clip of clips) {
    const out = path.join(OUT_AUDIO, clip.file);
    // Özete sağlayıcı + model kimliği girer: model değişince tüm klipler yenilenir.
    const hash = klipOzeti(kaynak, clip.text);

    if (hashes[clip.key] === hash && existsSync(out)) {
      skipped++;
      continue;
    }

    if (Number.isFinite(EN_COK) && made >= EN_COK) {
      kalan++;
      continue;
    }
    await mkdir(path.dirname(out), { recursive: true });
    try {
      await synth(provider, clip.text, out);
      hashes[clip.key] = hash;
      made++;
      // Her klipten sonra: kesilen çalışma kaldığı yerden sürer.
      if (!PROTOTIP) await ozetleriYaz(kaynak, hashes);
      if (made % 25 === 0) console.log(`  ${made} üretildi...`);
      ardisikHata = 0;
    } catch (err) {
      failures.push(`${clip.key}: ${(err as Error).message.split('\n')[0]}`);
      // Kota/faturalandırma gibi kalıcı hatada 287 kez denemek yerine dur.
      if (++ardisikHata >= 3) {
        console.error('Art arda 3 klip üretilemedi; durduruldu (kota, faturalandırma veya anahtar).');
        break;
      }
    }
  }

  await mkdir(OUT_AUDIO, { recursive: true });
  await ozetleriYaz(kaynak, hashes);
  // Prototip çıktısı dağıtılmadığı için manifesto yalnız gerçek üretimde yazılır.
  if (!PROTOTIP) {
    await mkdir(path.dirname(OUT_MANIFEST), { recursive: true });
    await writeFile(OUT_MANIFEST, buildManifest(clips));
  }

  console.log(`\nüretilen: ${made} · atlanan: ${skipped}${kalan ? ` · sonraki çalışmaya kalan: ${kalan}` : ''} · toplam: ${clips.length}`);
  if (provider === 'google') console.log(`sağlayıcıya giden: ${sayac.istek} istek · ${sayac.karakter} karakter (içerik yazdırılmaz)`);
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
