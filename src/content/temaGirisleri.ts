/**
 * Derin tema girişi içeriği (plan v2 Adım 45, KG-111). `temaGirisleri.json` derleme zamanında şemayla doğrulanır
 * (KG-87, scripts/yayin/icerikDogrulama.ts); buraya ayrıştırılmış veri gelir. Yalnız tembel/tema girişi ekranından
 * içe aktarılır.
 */
import girislerHam from './temaGirisleri.json';
import type { TemaGirisiIcerigi, TemaGirisleri } from './schema/temaGirisi';

const GIRISLER = (girislerHam as unknown as TemaGirisleri).girisler;

/** Temanın derin girişi (şema 7 temanın hepsini garanti eder); bilinmeyen tema `null`. */
export function temaGirisiIcerigi(tema: number): TemaGirisiIcerigi | null {
  return GIRISLER.find((g) => g.tema === tema) ?? null;
}
