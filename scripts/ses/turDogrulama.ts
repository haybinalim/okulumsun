/**
 * Türkçe klip ÇIKTI DOĞRULAMASI + yeniden deneme (yalnız `--ders tur`; matematik hattı değişmez).
 *
 * NEDEN: Chirp 3 HD tek başına verilen kısa hece/sözcüğü bozuk üretebiliyor (24/111 hece, 9/125 sözcük:
 * ~0,2-0,3 sn, max_volume -30...-60 dB = neredeyse sessiz). Çocuk okuyamaz; sessiz klip = ölü ekran.
 * Her klip üretildikten sonra ölçülür; geçmezse sentez girdisi "Ka." biçimine çevrilip yeniden denenir.
 *
 * SAF + enjekte edilebilir: ölçüm (`OlcumFn`), sentez ve dosya silme dışarıdan verilir → ağsız/ffmpeg'siz testlenir.
 * Gerçek ölçüm (`ffmpegOlcum`) ffprobe + ffmpeg `volumedetect` kullanır; araç yoksa ya da çıktı okunamazsa HATA
 * fırlatır (ölçülemeyen klip "geçti" sayılmaz).
 */
import { execFile } from 'node:child_process';
import { rename, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import type { Clip } from './klipler.ts';
import { geciciKlipYolu } from './geciciAd.ts';

const exec = promisify(execFile);

/**
 * EŞİKLER — tek yer. Gerekçe (deneme: 111 hece + 125 sözcük + cümle/yönerge):
 * - `ENAZ_SURE_SN` 0,35: bozuk klipler 0,19-0,30 sn; eşik bunun üstünde, sağlam kısa klibin altında.
 * - `ENAZ_MAX_SES_DB` -15: bozuklar -30...-60 dB; normal konuşma klipleri tepe düzeyde çok daha yüksek. -15 bozuk ile sağlam arasında pay bırakır.
 * - `HECE_SOZCUK_ENCOK_SURE_SN` 1,6: tek hece/sözcük bundan uzunsa fazladan ses şüphesi ("ok" → "oke" gibi
 *   uzama/ek ünlü). Yalnız hece/sözcük için; cümle ve yönerge doğal olarak uzundur. Kesin tanı değildir:
 *   "oke" gibi kısa fazlalık ölçümle yakalanamaz → kulakla reddedilen klipler `reddedilen.json`'dadır.
 */
export const ESIKLER = {
  ENAZ_SURE_SN: 0.35,
  ENAZ_MAX_SES_DB: -15,
  HECE_SOZCUK_ENCOK_SURE_SN: 1.6,
} as const;

/** İlk sentezden sonra kaç kez daha denenir ("Ka." biçimiyle). Toplam en çok 1 + 3 istek. */
export const YENIDEN_DENEME_SAYISI = 3;

export interface Olcum {
  readonly sure: number;
  /** ffmpeg volumedetect `max_volume` (dB); tam sessizlikte -Infinity. */
  readonly maxSesDb: number;
}
export type OlcumFn = (dosyaYolu: string) => Promise<Olcum>;

/** Ölçüm sonucu eşikleri geçiyor mu? Geçerse `null`, geçmezse kısa neden. */
export function olcumSorunu(anahtar: string, o: Olcum): string | null {
  if (!Number.isFinite(o.sure) || Number.isNaN(o.maxSesDb)) return 'ölçüm sayısal değil';
  if (o.sure < ESIKLER.ENAZ_SURE_SN) return `süre ${o.sure.toFixed(2)} sn < ${ESIKLER.ENAZ_SURE_SN}`;
  if (o.maxSesDb < ESIKLER.ENAZ_MAX_SES_DB) return `max_volume ${o.maxSesDb.toFixed(1)} dB < ${ESIKLER.ENAZ_MAX_SES_DB}`;
  if (/^tur\.(hece|sozcuk)\./.test(anahtar) && o.sure > ESIKLER.HECE_SOZCUK_ENCOK_SURE_SN) {
    return `süre ${o.sure.toFixed(2)} sn > ${ESIKLER.HECE_SOZCUK_ENCOK_SURE_SN} (fazladan ses şüphesi)`;
  }
  return null;
}

/**
 * Yeniden deneme girdisi: yalnız ilk harf büyük (tr-TR: i→İ, ı→I) + metin harf/rakamla bitiyorsa sonuna nokta.
 * Başka bitişte (`.`, `!`, `?`, `…`, `,`, `)`, `;` vb.) nokta EKLENMEZ: "ka,." gibi bozuk girdi üretmemek için ve
 * metin zaten bir noktalamayla bittiği için (Chirp'e "cümle sonu" ipucu veriyor).
 * YALNIZ sentez girdisidir; klip metni, `klipler.json` ve özet (hash) bundan etkilenmez (bkz. generate-audio).
 */
export function yenidenDenemeMetni(metin: string): string {
  const t = metin.trim();
  if (t === '') return t;
  const [ilk, ...geri] = [...t];
  const buyuk = ilk.toLocaleUpperCase('tr-TR') + geri.join('');
  return /[\p{L}\p{N}]$/u.test(buyuk) ? `${buyuk}.` : buyuk;
}

/** 3 yeniden denemede de geçmeyen klip. `name` döngüde (uretimDongusu) kota/altyapı hatasından ayırt edilir. */
export class DogrulamaBasarisiz extends Error {
  override readonly name = 'DogrulamaBasarisiz';
  constructor(readonly anahtar: string, readonly sorunlar: readonly string[]) {
    super(`${anahtar}: doğrulamadan geçmedi (${sorunlar.length} deneme): ${sorunlar.join(' | ')}`);
  }
}

export interface KlipUretimi {
  readonly clip: Clip;
  /** Yeni sentezin yazılacağı GEÇİCİ yol (uzantı .m4a: ffprobe/ffmpeg biçimi tanır). Klibin gerçek dosyası değildir. */
  readonly gecici: string;
  /** Verilen girdi metniyle sentezleyip `yol`a yazar (her çağrı bir istektir). */
  readonly sentezle: (girdi: string, yol: string) => Promise<void>;
  readonly olc: (yol: string) => Promise<Olcum>;
  /** Geçici dosyayı klibin gerçek yerine atomik taşır (yalnız doğrulamadan geçen çıktı). */
  readonly yerlestir: (gecici: string) => Promise<void>;
  /** Yolu siler (yoksa sessiz). */
  readonly sil: (yol: string) => Promise<void>;
  /**
   * Diskteki ESKİ dosya `--yeniden-dogrula` ölçümüyle bozuk saptandıysa verilir: yalnız tüm denemeler doğrulamada
   * başarısız olunca silinir. Verilmezse eski dosyaya hiçbir koşulda dokunulmaz.
   */
  readonly eskiBozuguSil?: () => Promise<void>;
  /** Geçmeyen her deneme sonrası (günlük için). */
  readonly gecmedi?: (deneme: number, neden: string) => void;
}

/**
 * Üret (GEÇİCİ yola) → ölç → geçerse atomik yerine koy; geçmezse "Ka." biçimiyle en çok 3 kez yeniden dene.
 * ESKİ DOSYA KORUNUR: sentez, ölçüm, kota ya da ağ hatasında ve doğrulama başarısızlığında yalnız geçici dosya silinir;
 * iyi klip bir koşunun yarıda kesilmesiyle kaybolmaz (yeniden üretim kota harcar). İstisna: eski dosya yeniden
 * doğrulamada ZATEN bozuk saptanmışsa (`eskiBozuguSil`) ve 1 + 3 deneme doğrulamada başarısız olduysa silinir — bozuk
 * dosya diskte kalırsa `durum: "var"` olur ve çocuğa bozuk ses çalar; doğru durum `eksik`. Kota/ağ/altyapı hatasında
 * o durumda bile SİLİNMEZ: klip henüz karara bağlanmadı, sonraki koşu yeniden dener. Geçici dosya her yolda silinir.
 * Kabul edilen deneme numarasını döner.
 */
export async function klibiUretVeDogrula(g: KlipUretimi): Promise<number> {
  const sorunlar: string[] = [];
  try {
    for (let deneme = 0; deneme <= YENIDEN_DENEME_SAYISI; deneme++) {
      await g.sentezle(deneme === 0 ? g.clip.text : yenidenDenemeMetni(g.clip.text), g.gecici);
      const neden = olcumSorunu(g.clip.key, await g.olc(g.gecici));
      if (neden === null) {
        await g.yerlestir(g.gecici);
        return deneme + 1;
      }
      sorunlar.push(neden);
      g.gecmedi?.(deneme + 1, neden);
    }
  } finally {
    await g.sil(g.gecici);
  }
  if (g.eskiBozuguSil) await g.eskiBozuguSil();
  throw new DogrulamaBasarisiz(g.clip.key, sorunlar);
}

export interface TurSentezGirdisi {
  readonly clip: Clip;
  /** Klibin gerçek dosya yolu. */
  readonly hedef: string;
  readonly synth: (girdi: string, yol: string) => Promise<void>;
  readonly olc: OlcumFn;
  /** `--yeniden-dogrula` ile bozuk saptanan klip mi (eski dosya yalnız bu durumda silinebilir). */
  readonly eskiBozuk: boolean;
  /** Özet kaydı (bellekte): yalnız eski dosya silinince bu klibin özeti de silinir. */
  readonly ozetler: Record<string, string>;
  readonly gecmedi?: (deneme: number, neden: string) => void;
}

/**
 * `generate-audio.ts` Türkçe `sentezle` kapanışı (testlenebilsin diye çıkarıldı; gerçek dosya sistemiyle çalışır).
 * Başarıda planiCalistir ardından özeti yazar (`kaydet`); burada özete yalnız dosya silinirse dokunulur
 * (özet var + dosya yok tutarsızlığı kalmasın). Diğer hatalarda eski dosya VE özet olduğu gibi kalır.
 */
export async function turKlibiSentezle(g: TurSentezGirdisi): Promise<number> {
  try {
    return await klibiUretVeDogrula({
      clip: g.clip,
      gecici: geciciKlipYolu(g.hedef),
      sentezle: g.synth,
      olc: g.olc,
      yerlestir: (gecici) => rename(gecici, g.hedef),
      sil: (yol) => rm(yol, { force: true }),
      eskiBozuguSil: g.eskiBozuk
        ? async () => {
            await rm(g.hedef, { force: true });
            delete g.ozetler[g.clip.key];
          }
        : undefined,
      gecmedi: g.gecmedi,
    });
  } catch (err) {
    // Geçici yol başka bir hatayla (ör. yerleştirme) arkada kalmasın.
    await rm(geciciKlipYolu(g.hedef), { force: true });
    throw err;
  }
}

/** Diskteki mevcut klipleri İSTEK ATMADAN ölçer; geçmeyenleri döner (`--yeniden-dogrula`). Ölçüm hatası fırlar. */
export async function mevcutlariDogrula(
  klipler: readonly Clip[],
  diskteVarMi: (dosya: string) => boolean,
  dosyaYolu: (dosya: string) => string,
  olc: OlcumFn,
): Promise<{ readonly olculen: number; readonly gecmeyen: readonly { readonly anahtar: string; readonly neden: string }[] }> {
  const gecmeyen: { anahtar: string; neden: string }[] = [];
  let olculen = 0;
  for (const c of klipler) {
    if (!diskteVarMi(c.file)) continue;
    olculen++;
    const neden = olcumSorunu(c.key, await olc(dosyaYolu(c.file)));
    if (neden !== null) gecmeyen.push({ anahtar: c.key, neden });
  }
  return { olculen, gecmeyen };
}

/** `ffmpeg -af volumedetect` stderr'inden max_volume (dB). Bulunamazsa hata (sessizce "geçti" sayılmaz). */
export function maxSesAyikla(stderr: string): number {
  const m = /max_volume:\s*(-?inf|-?\d+(?:\.\d+)?)\s*dB/i.exec(stderr);
  if (!m) throw new Error('ffmpeg volumedetect çıktısında max_volume yok');
  return /inf/i.test(m[1]) ? -Infinity : Number.parseFloat(m[1]);
}

/** Gerçek ölçüm: ffprobe süre + ffmpeg volumedetect. Araç yoksa / çıktı okunamazsa FIRLATIR. */
export function ffmpegOlcum(ffprobe = 'ffprobe', ffmpeg = 'ffmpeg'): OlcumFn {
  return async (dosya) => {
    const { stdout } = await exec(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', dosya]);
    const sure = Number.parseFloat(stdout.trim());
    if (!Number.isFinite(sure)) throw new Error(`ffprobe süre okunamadı: ${dosya}`);
    const { stderr } = await exec(ffmpeg, ['-hide_banner', '-nostats', '-i', dosya, '-vn', '-af', 'volumedetect', '-f', 'null', '-']);
    return { sure, maxSesDb: maxSesAyikla(stderr) };
  };
}
