/**
 * `generate-audio.ts` döngüsünün klip başına sentez kapanışı (matematik + Türkçe ortak). Betikten ayrıldı:
 * `generate-audio.ts` import edilince `main()` çalışır; bu modül yan etkisizdir, bu yüzden test edilebilir ve
 * "matematik de doğrulanır" kararı (`dogrulamaAcik`) tek yerdedir.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { sentezGirdisi, type Clip } from './klipler.ts';
import { turKlibiSentezle, type OlcumFn } from './turDogrulama.ts';

/** Sentez ayarı: komut satırından TEK yerde türer; kapanış ve günlük aynı nesneyi kullanır. */
export interface SentezAyari {
  /** `--prototip` (macOS say, dağıtılmaz). */
  readonly prototip: boolean;
  /** `--ders tur`. Matematikte eski bozuk dosya silinmez (manifest o dosyayı bekler). */
  readonly tur: boolean;
  /** Üretilen klipler ölçülsün mü? Her şey ölçülür; yalnız `--prototip` hariç. Matematik DAHİL. */
  readonly dogrula: boolean;
}

export function sentezAyari(argv: readonly string[]): SentezAyari {
  const prototip = argv.includes('--prototip');
  const i = argv.indexOf('--ders');
  const tur = i >= 0 && argv[i + 1] === 'tur';
  return { prototip, tur, dogrula: !prototip };
}

export interface KlipSentezleyiciGirdisi {
  readonly ayar: SentezAyari;
  /** Klip dosyalarının kök dizini (`public/audio` ya da Türkçe ses dizini). */
  readonly cikisDizini: string;
  /** Verilen girdiyi sentezleyip yola yazar (her çağrı bir istektir). */
  readonly synth: (clip: Clip, girdi: string, yol: string) => Promise<void>;
  readonly olc: OlcumFn;
  /** `--yeniden-dogrula` ile bozuk saptanan klip anahtarları. */
  readonly eskiBozuklar: ReadonlySet<string>;
  /** Özet kaydı (bellekte). */
  readonly ozetler: Record<string, string>;
  readonly gecmedi?: (clip: Clip, deneme: number, neden: string) => void;
}

export function klipSentezleyici(g: KlipSentezleyiciGirdisi): (clip: Clip) => Promise<void> {
  return async (clip) => {
    const out = path.join(g.cikisDizini, clip.file);
    await mkdir(path.dirname(out), { recursive: true });
    if (!g.ayar.dogrula) return g.synth(clip, sentezGirdisi(clip), out);
    // GEÇİCİ yola üret → ölç → geçerse atomik yerine koy; geçmezse "Bir." biçimiyle yeniden dene (turDogrulama.ts).
    // Hata/başarısızlıkta eski dosya ve özet korunur. Girdi biçimi YALNIZ sentezde değişir: özet gerçek metinden.
    await turKlibiSentezle({
      clip,
      hedef: out,
      synth: (girdi, yol) => g.synth(clip, girdi, yol),
      olc: g.olc,
      eskiBozuk: g.ayar.tur && g.eskiBozuklar.has(clip.key),
      ozetler: g.ozetler,
      gecmedi: g.gecmedi ? (n, neden) => g.gecmedi!(clip, n, neden) : undefined,
    });
  };
}
