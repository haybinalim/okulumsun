/**
 * Üretim döngüsü (matematik ve Türkçe ortak): planı sırayla sentezler. generate-audio.ts'in döngüsünden
 * çıkarıldı; davranış aynı. Sentezleyici ve kayıt enjekte edilir → ağsız (mock) testlenir.
 */
import { onTahmin, type ButceDurumu } from './ucretsizKatman.ts';
import type { UretimPlani } from './uretimPlani.ts';
import type { Clip } from './klipler.ts';

export interface DongaGirdisi {
  readonly plan: UretimPlani;
  /** Tek klibi sentezleyip dosyaya yazar (istek burada gider). */
  readonly sentezle: (clip: Clip) => Promise<void>;
  /** Başarılı klipten sonra (özeti kaydet). */
  readonly kaydet: (clip: Clip, ozet: string) => Promise<void>;
  /** Ücretsiz katman aşımında durmadan önce (özetleri yaz). */
  readonly asimdaKaydet: () => Promise<void>;
  /** Verilirse çalışma başı kuru tahmin: bütçeyi aşacaksa HİÇ istek atılmaz. */
  readonly butce?: () => ButceDurumu;
  readonly ilerleme?: (made: number) => void;
}

export interface DongaSonucu {
  readonly made: number;
  readonly failures: readonly string[];
  readonly durduruldu: boolean;
}

export async function planiCalistir(g: DongaGirdisi): Promise<DongaSonucu> {
  const { plan } = g;
  if (g.butce && plan.uretilecek.length > 0) {
    onTahmin(plan.uretilecek.map((u) => u.clip.text), g.butce());
  }
  let made = 0;
  let ardisikHata = 0;
  let durduruldu = false;
  const failures: string[] = [];
  for (const { clip, ozet } of plan.uretilecek) {
    try {
      await g.sentezle(clip);
      await g.kaydet(clip, ozet);
      made++;
      g.ilerleme?.(made);
      ardisikHata = 0;
    } catch (err) {
      // Ücretsiz katman sınırı kalıcıdır: hemen dur, sonraki klipleri deneme.
      if ((err as Error).name === 'UcretsizKatmanAsimi' || /ÜCRETSİZ KATMAN KORUMASI/.test((err as Error).message)) {
        await g.asimdaKaydet();
        throw err;
      }
      failures.push(`${clip.key}: ${(err as Error).message.split('\n')[0]}`);
      // Kota/faturalandırma gibi kalıcı hatada 287 kez denemek yerine dur.
      if (++ardisikHata >= 3) {
        durduruldu = true;
        break;
      }
    }
  }
  return { made, failures, durduruldu };
}
