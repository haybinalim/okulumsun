/**
 * MASKOT HİKÂYESİ AKIŞI (plan v2 Adım 54 aşama 2, KG-116) — SAF.
 *
 * Karakter kitabı §6: derin tema girişinin İLK sahnesi hikâyenin 1. sahnesidir (önce maskot kendini tanıtır,
 * `maskot.selam`); kişisel modda her tamamlanan oturumun sonunda bir sonraki sahne (2, sonra 3'te kalır). Tahtada
 * hikâye yalnız tema girişinde. Sayaç yalnız bellekte (`appStore.temaOturumlari`, Seçenek A).
 *
 * Bu modül hikâye JSON'unu İÇE AKTARMAZ (ana pakete girmez): ses anahtarı `hikaye.t<tema>-<sahne>` biçimindedir
 * (şema garanti eder) ve manifestte olduğu buradan denetlenir. Sahne görseli/pozu tembel ekranlardan okunur.
 */
import { AUDIO_MANIFEST } from '../audio/audioManifest.generated';
import type { SpeakSource, SpeechKey } from '../audio/speech';

/** Her temada sahne sayısı (şema: tam 3). */
export const HIKAYE_SAHNE_SAYISI = 3;
/** Selam ile 1. sahne / "oturum bitti" ile sahne arası (doğal nefes payı; KG-110 giriş arasıyla aynı). */
export const HIKAYE_ARA_MS = 450;
/** Giriş hikâyesi anlatımı bittikten sonra derin girişin 1. adımına geçmeden önceki bekleme (ms). */
export const HIKAYE_SONRASI_MS = 1200;

/** `hikaye.t<tema>-<sahne>`; manifestte yoksa (bilinmeyen tema/sahne) `null`. */
export function hikayeAnahtari(tema: number, sahneNo: number): SpeechKey | null {
  if (!Number.isInteger(tema) || !Number.isInteger(sahneNo) || sahneNo < 1 || sahneNo > HIKAYE_SAHNE_SAYISI)
    return null;
  const k = `hikaye.t${tema}-${sahneNo}`;
  return k in AUDIO_MANIFEST ? (k as SpeechKey) : null;
}

/** Derin tema girişinin açılışı: "Merhaba! Ben <ad>." + hikâyenin 1. sahnesi. Hikâyesi olmayan temada `null`. */
export function girisHikayesiSesi(tema: number): SpeakSource | null {
  const k = hikayeAnahtari(tema, 1);
  return k ? { kind: 'sequence', keys: ['maskot.selam', k], ilkAraMs: HIKAYE_ARA_MS } : null;
}

/**
 * Kişisel oturum sonunda gösterilecek sahne no: bu temada tamamlanan oturum sayısı n (bu oturum dahil) için
 * 1. oturum → 2. sahne, 2. ve sonrası → 3. sahne (giriş 1. sahneydi; `siradakiSahne(tema, n)` ile aynı sıra).
 * n < 1 → `null` (oturum tamamlanmadı).
 */
export function oturumSonuSahneNo(tamamlananTemaOturumu: number): number | null {
  if (!Number.isFinite(tamamlananTemaOturumu) || tamamlananTemaOturumu < 1) return null;
  return Math.min(Math.floor(tamamlananTemaOturumu) + 1, HIKAYE_SAHNE_SAYISI);
}

/** Oturum sonu sesi: "oturum bitti" + (varsa) sıradaki hikâye sahnesi. Hikâye yoksa yalnız "oturum bitti". */
export function oturumSonuSesi(tema: number | null, tamamlananTemaOturumu: number): SpeakSource {
  const no = tema === null ? null : oturumSonuSahneNo(tamamlananTemaOturumu);
  const k = tema !== null && no !== null ? hikayeAnahtari(tema, no) : null;
  return k
    ? {
        kind: 'sequence',
        keys: ['ui.oturum-bitti', k],
        ilkAraMs: HIKAYE_ARA_MS,
      }
    : { kind: 'key', key: 'ui.oturum-bitti' };
}

/** Oturum sonunda hikâye sahnesi var mı (kişisel mod, tema seçili, set değil). */
export function oturumSonuHikayesiVar(
  mod: 'tahta' | 'kisisel' | null,
  tema: number | null,
  tamamlananTemaOturumu: number,
): boolean {
  if (mod !== 'kisisel' || tema === null) return false;
  const no = oturumSonuSahneNo(tamamlananTemaOturumu);
  return no !== null && hikayeAnahtari(tema, no) !== null;
}

/** Store yardımcısı: tamamlanan oturumu temanın sayacına ekler (yeni nesne; yalnız bellek). */
export function temaOturumuEkle(
  sayac: Readonly<Record<number, number>>,
  tema: number,
): Readonly<Record<number, number>> {
  return { ...sayac, [tema]: (sayac[tema] ?? 0) + 1 };
}
