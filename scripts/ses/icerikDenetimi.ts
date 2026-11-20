/**
 * Ses KLİPLERİNİN İÇERİK DENETİMİ — yerel, ücretsiz, çevrimdışı konuşmadan-yazıya (whisper.cpp).
 *
 * `audio:audit` yalnız var/boyut/süre/köken bakar; klibin DOĞRU METNİ söyleyip söylemediğini (ör. "Mine süt alır."
 * yerine "Mina…") bu betik sınar: her klip whisper ile yazıya çevrilir, beklenen `text` ile karşılaştırılır.
 * Beklenen metin üretimle AYNI kaynaktan gelir (`klipleriTopla` + Türkçe `turKlipleriniAyir`); ikinci liste yok.
 *
 * Kullanım:  npm run audio:stt [-- --yalniz <desen>] [--esik 0.85] [--model small] [--onbellek-yok]
 *   --yalniz <desen>   anahtar bu metni içerenler (ya da `*` joker: `tur.hece.*`, `ui.*`); birden çok kez verilebilir
 *   --esik <0..1>      benzerlik eşiği (varsayılan 0.85)
 *   --model <ad>       ggml modeli (varsayılan small): <OKULUMSUN_STT_DIZIN>/ggml-<ad>.bin
 *   --ipucu <metin>   whisper başlangıç ipucu (varsayılan "Türkçe kısa cümle."); --ipucu-yok kapatır
 *   --kisa-hepsi-kulak  kısa klipte tam eşleşme bile `gecti` sayılmaz (hepsi kulak listesine)
 *   --onbellek-yok     önbelleği okuma/yazma
 *   --rapor <yol>      JSON rapor yolu (varsayılan test-results/ses-icerik-raporu.json)
 *   --es-zamanli <n>   aynı anda en çok n whisper süreci (varsayılan 3)
 *
 * Çıkış: 0 tümü geçti/kulak · 1 şüpheli ya da eksik dosya var · 2 araç/model yok ya da çalışma hatası (sessiz başarı YOK).
 * Ortam: OKULUMSUN_STT_DIZIN (model + önbellek; varsayılan ~/.cache/okulumsun-stt), OKULUMSUN_STT_MODEL (tam model yolu),
 * WHISPER_CLI (varsayılan whisper-cli), FFMPEG (varsayılan ffmpeg).
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { klipleriTopla } from './klipler.ts';
import { karar, KISA_HARF_ESIGI, VARSAYILAN_ESIK, type Durum } from './sttKarsilastirma.ts';
import { retListesiniOku, turKlipleriniAyir, TUR_KLIP_MANIFESTI, TUR_SES_DIZINI } from './turKlipleri.ts';

const exec = promisify(execFile);

export const VARSAYILAN_MODEL = 'small';
/** whisper `--prompt`: Türkçe kısa söz bekletir; kısa klipte dil/yazım sapmasını ve uydurma çıktıyı azaltır (deneyle ölçüldü). */
export const VARSAYILAN_IPUCU = 'Türkçe kısa cümle.';
export const VARSAYILAN_RAPOR = 'test-results/ses-icerik-raporu.json';

export interface GirisKlip {
  readonly key: string;
  /** Beklenen metin (klibin `text`i). */
  readonly text: string;
  /** Ses dosyasının MUTLAK yolu. */
  readonly dosya: string;
}

export type SatirDurumu = Durum | 'eksik';

export interface Satir {
  readonly anahtar: string;
  readonly beklenen: string;
  readonly duyulan: string;
  readonly benzerlik: number;
  readonly durum: SatirDurumu;
  readonly neden?: string;
  /** Duyulan metin önbellekten geldi (whisper çalışmadı). */
  readonly onbellek: boolean;
}

/** Bir ses dosyasını yazıya çevirir. Araç/model hatasında FIRLATIR; boş metin geçerli (şüpheli) bir sonuçtur. */
export type SttFn = (dosyaYolu: string) => Promise<string>;

/** Önbellek: klip anahtarı → { ses dosyasının sha256'sı, model, duyulan }. Ses ya da model değişince girdi geçersizdir. */
export interface OnbellekGirdisi {
  readonly sha: string;
  readonly model: string;
  readonly duyulan: string;
}
export type Onbellek = Record<string, OnbellekGirdisi>;

export function dosyaOzeti(icerik: Uint8Array): string {
  return createHash('sha256').update(icerik).digest('hex');
}

/** Geçerli girdi varsa duyulan metni verir; ses (sha) ya da model farklıysa `undefined`. */
export function onbellekten(onb: Onbellek, anahtar: string, sha: string, model: string): string | undefined {
  const g = onb[anahtar];
  return g !== undefined && g.sha === sha && g.model === model ? g.duyulan : undefined;
}

export function onbellekOku(yol: string): Onbellek {
  if (!existsSync(yol)) return {};
  try {
    const ham = JSON.parse(readFileSync(yol, 'utf8')) as unknown;
    return typeof ham === 'object' && ham !== null && !Array.isArray(ham) ? (ham as Onbellek) : {};
  } catch {
    return {}; // bozuk önbellek yalnız yavaşlatır, sonucu etkilemez: baştan çözülür
  }
}

export interface DenetimSecenekleri {
  readonly stt: SttFn;
  readonly model: string;
  readonly esik?: number;
  readonly kisaHarf?: number;
  /** Kısa klipte tam eşleşme `gecti` sayılır (varsayılan true); false → kısa klibin hepsi `kulak`. */
  readonly kisaTamEslesmeGecer?: boolean;
  /** Verilirse okunur ve doldurulur (çağıran diske yazar). */
  readonly onbellek?: Onbellek;
  readonly esZamanli?: number;
}

/** Tüm klipleri dener; sıra girdi sırasıdır. Dosya yoksa `eksik` (sessizce atlanmaz). Araç hatası fırlatır. */
export async function denetle(klipler: readonly GirisKlip[], s: DenetimSecenekleri): Promise<Satir[]> {
  const esik = s.esik ?? VARSAYILAN_ESIK;
  const kisaHarf = s.kisaHarf ?? KISA_HARF_ESIGI;
  const sonuc: Satir[] = new Array<Satir>(klipler.length);
  let sonraki = 0;
  let cozulen = 0;
  let bosCozulen = 0;

  const isle = async (i: number): Promise<void> => {
    const k = klipler[i];
    if (!existsSync(k.dosya)) {
      sonuc[i] = { anahtar: k.key, beklenen: k.text, duyulan: '', benzerlik: 0, durum: 'eksik', neden: 'ses dosyası yok', onbellek: false };
      return;
    }
    const sha = dosyaOzeti(await readFile(k.dosya));
    let duyulan = s.onbellek ? onbellekten(s.onbellek, k.key, sha, s.model) : undefined;
    const onbellekte = duyulan !== undefined;
    if (duyulan === undefined) {
      duyulan = (await s.stt(k.dosya)).trim();
      cozulen++;
      if (duyulan === '') bosCozulen++;
      // Boş sonuç önbelleğe GİRMEZ: geçici bir araç aksaklığı kalıcı hükme dönüşmesin.
      if (s.onbellek && duyulan !== '') s.onbellek[k.key] = { sha, model: s.model, duyulan };
    }
    const r = karar(k.text, duyulan, esik, kisaHarf, s.kisaTamEslesmeGecer ?? true);
    sonuc[i] = { anahtar: k.key, beklenen: k.text, duyulan, benzerlik: r.benzerlik, durum: r.durum, neden: r.neden, onbellek: onbellekte };
  };

  const isci = async (): Promise<void> => {
    while (sonraki < klipler.length) await isle(sonraki++);
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(s.esZamanli ?? 3, klipler.length)) }, isci));

  // Hepsi boşsa araç sessizce bozuktur (yanlış model/dil, bozuk wav); "şüpheli yığını" diye gizlenmez.
  if (cozulen >= 10 && bosCozulen === cozulen) {
    throw new Error(`STT ${cozulen} kliptir yalnız boş metin döndürdü; whisper/model/ffmpeg çalışmıyor olabilir (sonuç güvenilmez).`);
  }
  return sonuc;
}

/** `--yalniz` süzgeci: desen `*` içeriyorsa joker (tüm anahtar), yoksa alt dize. Desen verilmediyse hepsi. */
export function anahtarSuz<T extends { readonly key: string }>(klipler: readonly T[], desenler: readonly string[]): T[] {
  if (desenler.length === 0) return [...klipler];
  const eslestir = desenler.map((d) => {
    if (!d.includes('*')) return (a: string) => a.includes(d);
    const re = new RegExp(`^${d.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
    return (a: string) => re.test(a);
  });
  return klipler.filter((k) => eslestir.some((f) => f(k.key)));
}

export interface Ozet {
  readonly toplam: number;
  readonly gecti: number;
  readonly supheli: number;
  readonly kulak: number;
  readonly eksik: number;
  readonly onbellekten: number;
}

export function ozetle(satirlar: readonly Satir[]): Ozet {
  const say = (d: SatirDurumu) => satirlar.filter((s) => s.durum === d).length;
  return {
    toplam: satirlar.length,
    gecti: say('gecti'),
    supheli: say('supheli'),
    kulak: say('kulak'),
    eksik: say('eksik'),
    onbellekten: satirlar.filter((s) => s.onbellek).length,
  };
}

/** Çıkış kodu: şüpheli ya da eksik dosya varsa 1, yoksa 0 (kulak başarısızlık DEĞİL). Hiç klip yoksa 1 (boş koşu başarı sayılmaz). */
export function cikisKodu(o: Ozet): 0 | 1 {
  return o.toplam === 0 || o.supheli > 0 || o.eksik > 0 ? 1 : 0;
}

// ---------------------------------------------------------------------------------------------------------------
// Whisper çalıştırıcı (gerçek süreç; birim testte kullanılmaz)
// ---------------------------------------------------------------------------------------------------------------

export function sttDizini(): string {
  return process.env.OKULUMSUN_STT_DIZIN ?? path.join(os.homedir(), '.cache', 'okulumsun-stt');
}

export function modelYolu(model: string): string {
  return process.env.OKULUMSUN_STT_MODEL ?? path.join(sttDizini(), `ggml-${model}.bin`);
}

async function aracVarMi(komut: string, arg: string[]): Promise<boolean> {
  try {
    await exec(komut, arg);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code !== 'ENOENT'; // çalıştı ama sıfır olmayan çıkış → araç var
  }
}

/** Whisper + ffmpeg + model hazır değilse açık, eyleme dönük hata fırlatır. */
export async function sttHazirMi(model: string): Promise<{ whisper: string; ffmpeg: string; modelDosyasi: string }> {
  const whisper = process.env.WHISPER_CLI ?? 'whisper-cli';
  const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
  const modelDosyasi = modelYolu(model);
  if (!(await aracVarMi(whisper, ['-h']))) throw new Error(`${whisper} bulunamadı. Kurulum: brew install whisper-cpp (docs/ses/icerik-dogrulama.md)`);
  if (!(await aracVarMi(ffmpeg, ['-version']))) throw new Error(`${ffmpeg} bulunamadı. Kurulum: brew install ffmpeg`);
  if (!existsSync(modelDosyasi)) {
    throw new Error(
      `STT modeli yok: ${modelDosyasi}\nTek seferlik indirme: mkdir -p ${sttDizini()} && curl -L -o ${modelDosyasi} https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${model}.bin`,
    );
  }
  return { whisper, ffmpeg, modelDosyasi };
}

/** Gerçek STT: m4a → 16 kHz tek kanal wav (ffmpeg) → whisper-cli (Türkçe). Hata fırlatır; boş çıktı döndürebilir. */
export async function whisperSttOlustur(model: string, ipucu: string = VARSAYILAN_IPUCU): Promise<SttFn> {
  const { whisper, ffmpeg, modelDosyasi } = await sttHazirMi(model);
  return async (dosyaYolu) => {
    const gecici = await mkdtemp(path.join(os.tmpdir(), 'okulumsun-stt-'));
    try {
      const wav = path.join(gecici, 'k.wav');
      await exec(ffmpeg, ['-loglevel', 'error', '-y', '-i', dosyaYolu, '-ar', '16000', '-ac', '1', wav]);
      const { stdout } = await exec(whisper, ['-m', modelDosyasi, '-l', 'tr', '-nt', '-np', ...(ipucu ? ['--prompt', ipucu] : []), '-f', wav], { maxBuffer: 8 * 1024 * 1024 });
      return stdout.replace(/\s+/g, ' ').trim();
    } finally {
      await rm(gecici, { recursive: true, force: true });
    }
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Klip listesi (üretimle aynı kaynak)
// ---------------------------------------------------------------------------------------------------------------

/** Matematik (public/audio) + Türkçe (ders-verisi/tur/ses; yalnız durum "var" ve reddedilmemiş) klipleri. */
export function denetlenecekKlipler(kok: string): GirisKlip[] {
  const tr = JSON.parse(readFileSync(path.join(kok, 'src/content/tr.json'), 'utf8')) as Record<string, unknown>;
  const sonuc: GirisKlip[] = klipleriTopla(tr).map((c) => ({ key: c.key, text: c.text, dosya: path.join(kok, 'public/audio', c.file) }));

  const turYol = path.join(kok, TUR_KLIP_MANIFESTI);
  if (existsSync(turYol)) {
    const ham = JSON.parse(readFileSync(turYol, 'utf8')) as { klipler: { anahtar: string; durum: string }[] };
    const sesli = new Set(ham.klipler.filter((k) => k.durum === 'var').map((k) => k.anahtar));
    const ret = retListesiniOku(kok);
    for (const c of turKlipleriniAyir(ham)) {
      if (sesli.has(c.key) && !(c.key in ret)) sonuc.push({ key: c.key, text: c.text, dosya: path.join(kok, TUR_SES_DIZINI, c.file) });
    }
  }
  return sonuc;
}

// ---------------------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------------------

function secenek(argv: readonly string[], ad: string): string | undefined {
  const i = argv.indexOf(ad);
  return i >= 0 ? argv[i + 1] : undefined;
}

function cokluSecenek(argv: readonly string[], ad: string): string[] {
  return argv.flatMap((a, i) => (a === ad && argv[i + 1] !== undefined ? [argv[i + 1]] : []));
}

export async function main(argv: readonly string[]): Promise<number> {
  const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const model = secenek(argv, '--model') ?? VARSAYILAN_MODEL;
  const esikHam = secenek(argv, '--esik');
  const esik = esikHam === undefined ? VARSAYILAN_ESIK : Number(esikHam);
  if (!Number.isFinite(esik) || esik < 0 || esik > 1) throw new Error(`--esik 0 ile 1 arasında olmalı: "${esikHam}"`);
  const esZamanli = Number.parseInt(secenek(argv, '--es-zamanli') ?? '3', 10);
  const raporYolu = path.resolve(kok, secenek(argv, '--rapor') ?? VARSAYILAN_RAPOR);
  const onbellekYok = argv.includes('--onbellek-yok');
  const ipucu = argv.includes('--ipucu-yok') ? '' : (secenek(argv, '--ipucu') ?? VARSAYILAN_IPUCU);
  // Önbellek anahtarı model + ipucu: ikisinden biri değişince eski çözümler geçersizdir.
  const modelKimligi = ipucu ? `${model}+${createHash('sha256').update(ipucu).digest('hex').slice(0, 8)}` : model;
  const onbellekYolu = path.join(sttDizini(), `onbellek-${model}.json`);

  const tumu = denetlenecekKlipler(kok);
  const klipler = anahtarSuz(tumu, cokluSecenek(argv, '--yalniz'));
  if (klipler.length === 0) throw new Error(`Süzgeçle eşleşen klip yok (toplam ${tumu.length}).`);

  const onbellek: Onbellek | undefined = onbellekYok ? undefined : onbellekOku(onbellekYolu);
  const baslangic = Date.now();
  const stt = await whisperSttOlustur(model, ipucu);
  console.log(`STT: model ${model} · ipucu "${ipucu}" · ${klipler.length}/${tumu.length} klip · eşik ${esik} · önbellek ${onbellek ? onbellekYolu : 'kapalı'}`);
  const satirlar = await denetle(klipler, { stt, model: modelKimligi, esik, kisaTamEslesmeGecer: !argv.includes('--kisa-hepsi-kulak'), onbellek, esZamanli: Number.isFinite(esZamanli) ? esZamanli : 3 });
  if (onbellek) {
    await mkdir(path.dirname(onbellekYolu), { recursive: true });
    await writeFile(onbellekYolu, JSON.stringify(onbellek));
  }

  const o = ozetle(satirlar);
  const sureSn = (Date.now() - baslangic) / 1000;
  await mkdir(path.dirname(raporYolu), { recursive: true });
  await writeFile(
    raporYolu,
    JSON.stringify({ olusturma: new Date().toISOString(), model, ipucu, esik, kisaHarfEsigi: KISA_HARF_ESIGI, sureSn, ozet: o, klipler: satirlar }, null, 2),
  );

  const yaz = (baslik: string, d: SatirDurumu, sinir: number) => {
    const liste = satirlar.filter((s) => s.durum === d);
    if (liste.length === 0) return;
    console.log(`\n${baslik} (${liste.length}):`);
    for (const s of liste.slice(0, sinir)) {
      console.log(`  ${s.anahtar}  [${s.benzerlik.toFixed(2)}]  beklenen: "${s.beklenen}"  duyulan: "${s.duyulan}"${s.neden ? `  — ${s.neden}` : ''}`);
    }
    if (liste.length > sinir) console.log(`  … ${liste.length - sinir} kayıt daha (rapor: ${path.relative(kok, raporYolu)})`);
  };
  yaz('EKSİK DOSYA', 'eksik', 50);
  yaz('ŞÜPHELİ', 'supheli', 50);
  console.log(
    `\nKULAK GEREKLİ: ${o.kulak} klip (beklenen metinde en çok ${KISA_HARF_ESIGI} harf ve STT tam eşleşmedi; STT güvenilmez, başarısız sayılmaz — listesi raporda).`,
  );
  console.log(
    `\n${o.toplam} klip · geçti ${o.gecti} · şüpheli ${o.supheli} · kulak ${o.kulak} · eksik ${o.eksik} · önbellekten ${o.onbellekten} · ${sureSn.toFixed(1)} sn`,
  );
  console.log(`Rapor: ${path.relative(kok, raporYolu)}`);
  return cikisKodu(o);
}

// Yalnız doğrudan çalıştırılınca (testler içe aktarır).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (kod) => {
      process.exitCode = kod;
    },
    (err: unknown) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 2;
    },
  );
}
