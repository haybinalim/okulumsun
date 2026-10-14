/**
 * Maskot tema hikâyeleri yükleyicisi (plan v2 Adım 54). `maskotHikayeleri.json` derleme zamanında şemayla doğrulanır
 * (KG-87, scripts/yayin/icerikDogrulama.ts); buraya ayrıştırılmış veri gelir.
 *
 * Uygulamaya BAĞLI DEĞİL (KG-91): ses kaynağı (Adım 31) ve maskot sesi kararı (K-12) gelene kadar hiçbir ekran bu
 * modülü içe aktarmaz; üretim paketine girmez. Bağlanınca tembel yüklenen ekranlardan içe aktarılır.
 */
import hikayelerHam from './maskotHikayeleri.json';
import type { HikayeSahnesi, MaskotHikayeleri, TemaHikayesi } from './schema/maskotHikayesi';

const HIKAYELER = (hikayelerHam as unknown as MaskotHikayeleri).hikayeler;

/** Temanın hikâyesi (şema 7 temanın hepsini garanti eder); bilinmeyen tema `null`. */
export function temaHikayesi(tema: number): TemaHikayesi | null {
  return HIKAYELER.find((h) => h.tema === tema) ?? null;
}

/**
 * Oturum sonunda gösterilecek sahne (Adım 54 alt görev 4 tasarımı): tema girişinde 1. sahne, sonra her tamamlanan
 * oturumda bir sonraki; 3. sahneden sonra 3'te kalır. `tamamlananOturum` yalnız bellekte sayılır (Seçenek A).
 */
export function siradakiSahne(tema: number, tamamlananOturum: number): HikayeSahnesi | null {
  const h = temaHikayesi(tema);
  if (!h) return null;
  const i = Math.min(Math.max(0, Math.floor(tamamlananOturum)), h.sahneler.length - 1);
  return h.sahneler[i];
}
