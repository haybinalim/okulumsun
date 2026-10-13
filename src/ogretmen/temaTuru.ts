/**
 * TEMA SONU TURU — SAF (plan v2 Adım 46, KG-66).
 *
 * Temanın sonunda 8–10 soruluk kısa tur: temanın hazır düğümlerini baştan sona dolaşır. Sonuç çocuğa
 * kutlama, yetişkine düğüm başına nitel düzey (ders özeti mantığı, aşama 2). Puan/skor yok, saklama yok.
 *
 * Plan "her hazır düğümden ≥1" diyor; ama Tema 2'de 24, Tema 4'te 15 hazır düğüm var ve tur ≤10 madde.
 * Karar (KG-66): düğüm sayısı ≤10 ise HEPSİ; fazlaysa öğretim sırasını (verilen sıra) baştan sona eşit
 * aralıkla örnekleyen 10 düğüm. <8 düğümde set turlar hâlinde döner (`setSorusu`), her düğüm ≥1 kez gelir.
 * Dönen set bellekte yaşar; 4'ten çok düğüm taşıyabildiği için `setKodla` ile kodlanmaz (bağlantı yok).
 * Saat ve rastgelelik yok; tohumu UI verir.
 */
import type { SkillNode } from '../content/schema/skill';
import type { SkillId } from '../exercises/types';
import { duzeyVePuan, type DersOlayi, type RahatlikDuzeyi } from './dersOzeti';
import { SET_SURUMU, type GunlukSet } from './gunlukSet';

export const TEMA_TURU_MADDE = { enAz: 8, enFazla: 10 } as const;

export type TemaNo = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface TemaTuruPlani extends GunlukSet {
  readonly maddeSayisi: number;
}

/** `n` öğeden baştan sona eşit aralıklı `k` indeks (ilk ve son dâhil, artan, yinelenmez). */
export function esitAralikliIndeksler(n: number, k: number): number[] {
  if (n <= k) return Array.from({ length: n }, (_, i) => i);
  if (k === 1) return [0];
  return Array.from({ length: k }, (_, i) => Math.round((i * (n - 1)) / (k - 1)));
}

/**
 * `dugumler`: aday düğümler, öğretim sırasıyla (çağıran yalnız sete konabilir — hazır ve kayıtlı
 * şablonlu — düğümleri verir). Temanın düğümü yoksa `null`.
 */
export function temaTuruPlani(tema: TemaNo, dugumler: readonly SkillNode[], tohum: number): TemaTuruPlani | null {
  const temanin = dugumler.filter((d) => d.tema === tema && d.durum === 'hazir');
  if (temanin.length === 0) return null;
  const secilen = esitAralikliIndeksler(temanin.length, TEMA_TURU_MADDE.enFazla).map((i) => temanin[i].id);
  const maddeSayisi = Math.min(TEMA_TURU_MADDE.enFazla, Math.max(TEMA_TURU_MADDE.enAz, secilen.length));
  return { surum: SET_SURUMU, dugumler: secilen, tohum: tohum >>> 0, maddeSayisi };
}

export interface TemaTuruDuzeyi {
  readonly skillId: SkillId;
  readonly baslik: string;
  readonly duzey: RahatlikDuzeyi;
}

/**
 * Tur sonu yetişkin özeti (aşama 2, KG-67): planın her düğümü için ders özeti eşikleriyle nitel düzey.
 * Ders özetinden farkı: tek madde de yeterli (turda düğüm başına çoğunlukla 1 soru). Olayı olmayan
 * düğüm atlanır. Sıra plan sırasıdır (öğretim sırası). Sayı/yüzde alanı yok.
 */
export function temaTuruOzeti(
  plan: Pick<GunlukSet, 'dugumler'>,
  olaylar: readonly DersOlayi[],
  dugumler: readonly SkillNode[],
): TemaTuruDuzeyi[] {
  const sonuc: TemaTuruDuzeyi[] = [];
  for (const skillId of plan.dugumler) {
    const liste = olaylar.filter((o) => o.skillId === skillId);
    const dugum = dugumler.find((d) => d.id === skillId);
    if (liste.length === 0 || !dugum) continue;
    sonuc.push({ skillId, baslik: dugum.baslik, duzey: duzeyVePuan(liste).duzey });
  }
  return sonuc;
}
