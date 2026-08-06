/**
 * MADDE YAŞAM DÖNGÜSÜ — plan §7.2 "Madde yaşam döngüsü" tablosu.
 *
 * Bu modül SAF VE SENKRONDUR — `Date.now()`, `setTimeout`, DOM, React hiçbirini
 * çağırmaz. Zamanlayıcı (`useHelpTimer`) ve UI bu makineyi olaylarla besler;
 * makine kararları döndürür. Böylece her senaryo birim testte deterministik
 * tekrar üretilebilir.
 *
 * DURUM MAKİNESİ (plan §7.2 tablosu):
 *
 *   bekliyor → deneme1 → (doğru) → kapandı (q yüksek)
 *                      → (yanlış) → deneme2 → (doğru) → kapandı (q=0.45/0.20)
 *                                         → (yanlış) → kapandı (q=0.00)
 *   deneme1/deneme2 + K3 + doğru dokunuş → kapandı (q=0.20)
 *   herhangi + GOREV_ANLASILMADI → kapandı (q=null, skorlama yok)
 *
 * Yardım kademeleri zamanlayıcıdan veya maskota dokunmadan gelir:
 *   K1: 15 sn hareketsizlik veya maskota dokunma
 *   K2: K1'den +30 sn
 *   K3: K2'den +30 sn (cevabı gösterir, çocuk birlikte uygular)
 */

import type { HataEtiketi } from '../exercises/distractors';
import type { CevapOlayi } from './mastery';
import type { SkillId, Difficulty, ItemId } from '../exercises/types';

// ---------------------------------------------------------------- sabitler

/** Plan §7.2: hareketsizlik zamanlayıcıları (milisaniye). */
export const K1_GECIKME_MS = 15_000;
export const K2_GECIKME_MS = 30_000;
export const K3_GECIKME_MS = 30_000;

/** Plan §6.6: GOREV_ANLASILMADI tespitinde audioReplay eşiği. */
export const GOREV_AUDIOREPLAY_ESIGI = 3;

/** Plan §6.6: çok kısa yanıt süresi eşiği (saniye). */
export const GOREV_KISA_YANIT_SN = 2;

// ---------------------------------------------------------------- durumlar

/** Madde yaşam döngüsü durumu. */
export type MaddeDurumu = 'bekliyor' | 'deneme1' | 'deneme2' | 'kapandi';

/** Yardım kademesi: 0 = yok, 1/2/3 = K1/K2/K3. */
export type YardimKademesi = 0 | 1 | 2 | 3;

/**
 * Madde yaşam döngüsü durumu — saf veri.
 *
 * Bir soru ekrana geldiğinde `baslat` ile oluşturulur; her olayda `guncelle`
 * yeni bir kayıt döndürür (immutable). Kapanınca `cevapOlayi` üretir.
 */
export interface MaddeYasamDongusu {
  readonly maddeId: ItemId;
  readonly skillIds: readonly SkillId[];
  readonly estimatedSec: number;
  readonly nodeDifficulty: Difficulty;
  readonly baslangicMs: number;

  readonly durum: MaddeDurumu;
  readonly yardimKademesi: YardimKademesi;
  readonly tekrarSayisi: number; // audioReplay sayacı (GOREV_ANLASILMADI için)
  readonly sonDokunusMs: number;
  readonly sonYardimMs: number | null;
}

// ---------------------------------------------------------------- olaylar

/** Makineye beslenen olaylar. */
export type MaddeOlayi =
  | { readonly tur: 'dokunma'; readonly zamanMs: number }
  | { readonly tur: 'tekrarDinle'; readonly zamanMs: number }
  | { readonly tur: 'yardim'; readonly kademe: 1 | 2 | 3; readonly zamanMs: number }
  | {
      readonly tur: 'onayla';
      readonly dogru: boolean;
      readonly tani: HataEtiketi | null;
      readonly latencyMs: number;
      readonly zamanMs: number;
    }
  | { readonly tur: 'gorevAnlasilmadi'; readonly tani: HataEtiketi; readonly zamanMs: number };

// ---------------------------------------------------------------- sonuç

/** Madde kapandığında üretilen sonuç. */
export interface MaddeSonuc {
  readonly dogru: boolean;
  readonly kullanilanYardimKademesi: YardimKademesi;
  readonly latencyMs: number;
  readonly tani: HataEtiketi | null;
  readonly zamanMs: number;
}

// ----------------------------------------------------------- fonksiyonlar

/** Yeni bir madde yaşam döngüsü başlatır (plan: `bekliyor` → `deneme1`). */
export function baslat(params: {
  readonly maddeId: ItemId;
  readonly skillIds: readonly SkillId[];
  readonly estimatedSec: number;
  readonly nodeDifficulty: Difficulty;
  readonly baslangicMs: number;
}): MaddeYasamDongusu {
  return {
    maddeId: params.maddeId,
    skillIds: params.skillIds,
    estimatedSec: params.estimatedSec,
    nodeDifficulty: params.nodeDifficulty,
    baslangicMs: params.baslangicMs,
    durum: 'deneme1',
    yardimKademesi: 0,
    tekrarSayisi: 0,
    sonDokunusMs: params.baslangicMs,
    sonYardimMs: null,
  };
}

/**
 * Zamanlayıcıdan gelen yardım kademesini uygular.
 *
 * Kademeler yalnız İLERİ gider (plan: "kademe geri gitmez").
 * K3'te `cevabiGoster` true olur — UI doğru cevabı gösterir.
 */
function yardimYukselt(
  kayit: MaddeYasamDongusu,
  hedefKademe: 1 | 2 | 3,
  zamanMs: number,
): MaddeYasamDongusu {
  if (hedefKademe <= kayit.yardimKademesi) return kayit; // geri gitmez
  return {
    ...kayit,
    yardimKademesi: hedefKademe,
    sonYardimMs: zamanMs,
    sonDokunusMs: zamanMs,
  };
}

/**
 * GOREV_ANLASILMADI tespiti — plan §6.6 sinyalleri.
 *
 * Tek başına bir sinyal bile bayrağı açar (misconceptions.json tespit.aciklama):
 * yanlış pozitif maliyeti düşüktür — madde sayılmaz, çocuk bir kez daha dinler.
 *
 * Sinyaller:
 *  1. Çeldirici etiketi GOREV_ANLASILMADI (jeneratör üretti)
 *  2. audioReplay ≥ 3 (çocuk soruyu üç kez dinledi — anlamadı)
 *  3. Çok kısa yanıt (< 2 sn, talimat bitmeden dokundu)
 */
export function gorevAnlasilmadiMi(
  kayit: MaddeYasamDongusu,
  olay: Extract<MaddeOlayi, { tur: 'onayla' }>,
): boolean {
  // Sinyal 1: jeneratör etiketi
  if (olay.tani === 'GOREV_ANLASILMADI') return true;

  // Sinyal 2: audioReplay ≥ 3
  if (kayit.tekrarSayisi >= GOREV_AUDIOREPLAY_ESIGI) return true;

  // Sinyal 3: çok kısa yanıt
  if (olay.latencyMs < GOREV_KISA_YANIT_SN * 1000) return true;

  return false;
}

/**
 * Bir olayı işler ve yeni durum döndürür.
 *
 * Kapalı maddeye olay gelirse değişmez.
 * Dönüş: { kayit, kapandi, sonuc }
 */
export interface GuncellemeSonuc {
  readonly kayit: MaddeYasamDongusu;
  readonly kapandi: boolean;
  readonly sonuc: MaddeSonuc | null;
}

export function guncelle(kayit: MaddeYasamDongusu, olay: MaddeOlayi): GuncellemeSonuc {
  if (kayit.durum === 'kapandi') {
    return { kayit, kapandi: true, sonuc: null };
  }

  switch (olay.tur) {
    case 'dokunma':
      return {
        kayit: { ...kayit, sonDokunusMs: olay.zamanMs },
        kapandi: false,
        sonuc: null,
      };

    case 'tekrarDinle':
      return {
        kayit: {
          ...kayit,
          tekrarSayisi: kayit.tekrarSayisi + 1,
          sonDokunusMs: olay.zamanMs,
        },
        kapandi: false,
        sonuc: null,
      };

    case 'yardim':
      return {
        kayit: yardimYukselt(kayit, olay.kademe, olay.zamanMs),
        kapandi: false,
        sonuc: null,
      };

    case 'gorevAnlasilmadi':
      return {
        kayit: { ...kayit, durum: 'kapandi' },
        kapandi: true,
        sonuc: {
          dogru: false,
          kullanilanYardimKademesi: kayit.yardimKademesi,
          latencyMs: olay.zamanMs - kayit.baslangicMs,
          tani: olay.tani,
          zamanMs: olay.zamanMs,
        },
      };

    case 'onayla': {
      // GOREV_ANLASILMADI kontrolü (§6.6)
      if (gorevAnlasilmadiMi(kayit, olay)) {
        return {
          kayit: { ...kayit, durum: 'kapandi' },
          kapandi: true,
          sonuc: {
            dogru: false,
            kullanilanYardimKademesi: kayit.yardimKademesi,
            latencyMs: olay.latencyMs,
            tani: 'GOREV_ANLASILMADI',
            zamanMs: olay.zamanMs,
          },
        };
      }

      const latency = olay.latencyMs;
      const k = kayit.yardimKademesi;

      if (olay.dogru) {
        // Doğru — kapat
        return {
          kayit: { ...kayit, durum: 'kapandi' },
          kapandi: true,
          sonuc: {
            dogru: true,
            kullanilanYardimKademesi: k,
            latencyMs: latency,
            tani: null,
            zamanMs: olay.zamanMs,
          },
        };
      }

      // Yanlış — deneme1'de deneme2'ye geç, K1 otomatik açılır (§7.1)
      if (kayit.durum === 'deneme1') {
        const k1AcikMi = k >= 1;
        const yeniKademe: YardimKademesi = k1AcikMi ? k : 1;
        return {
          kayit: {
            ...kayit,
            durum: 'deneme2',
            yardimKademesi: yeniKademe,
            sonDokunusMs: olay.zamanMs,
            sonYardimMs: k1AcikMi ? kayit.sonYardimMs : olay.zamanMs,
          },
          kapandi: false,
          sonuc: null,
        };
      }

      // deneme2'de yanlış — kapat, doğruyu göster
      return {
        kayit: { ...kayit, durum: 'kapandi' },
        kapandi: true,
        sonuc: {
          dogru: false,
          kullanilanYardimKademesi: k,
          latencyMs: latency,
          tani: olay.tani,
          zamanMs: olay.zamanMs,
        },
      };
    }
  }
}

/**
 * Kapalı maddenin sonucunu `CevapOlayi`'na çevirir (plan §6.1).
 *
 * `tani === 'GOREV_ANLASILMADI'` ise `qHesapla` null döndürür — mastery
 * güncellenmez. Bu fonksiyon yalnızca veriyi paketler; karar mastery.ts'te.
 */
export function cevapOlayiYap(
  sonuc: MaddeSonuc,
  skillIds: readonly SkillId[],
  estimatedSec: number,
  nodeDifficulty: Difficulty,
): CevapOlayi {
  return {
    skillIds,
    dogru: sonuc.dogru,
    kullanilanYardimKademesi: sonuc.kullanilanYardimKademesi,
    latencyMs: sonuc.latencyMs,
    estimatedSec,
    nodeDifficulty,
    tani: sonuc.tani,
    zamanMs: sonuc.zamanMs,
  };
}

// ------------------------------------------------------ tanı takipçisi

/**
 * TANI TAKİPÇİSİ — plan §6.6 "Son 6 maddede aynı etiket ≥2 → remediation".
 *
 * Son 6 maddenin tanı etiketlerini halka tampon olarak tutar. Bir etiket
 * ≥2 kez görülürse `aktifTani` döndürür; bu değer planlayıcının
 * `aktifTaniEtiketi` parametresine verilir ve remediation kovası tetiklenir.
 *
 * GOREV_ANLASILMADI sayılmaz — o bir ölçüm geçersizliği, kavram yanılgısı değil.
 */
export class TaniTakipcisi {
  private son6: readonly (HataEtiketi | null)[] = [];

  /** Madde kapandığında çağrılır. `tani === null` doğru cevap anlamına gelir. */
  ekle(tani: HataEtiketi | null): void {
    this.son6 = [...this.son6, tani].slice(-6);
  }

  /** Son 6 maddenin etiket listesi (test ve rapor için). */
  gecmis(): readonly (HataEtiketi | null)[] {
    return this.son6;
  }

  /**
   * Aktif tanı etiketi — son 6'da ≥2 kez görülen, GOREV_ANLASILMADI olmayan.
   * Birden fazla varsa en çok görüleni döndürür; eşitlikte en son görüleni.
   * Yoksa null.
   */
  aktifTani(): HataEtiketi | null {
    const sayac = new Map<HataEtiketi, number>();
    for (const t of this.son6) {
      if (t === null || t === 'GOREV_ANLASILMADI') continue;
      sayac.set(t, (sayac.get(t) ?? 0) + 1);
    }
    let enIyi: HataEtiketi | null = null;
    let enYuksek = 0;
    for (const [t, n] of sayac) {
      if (n > enYuksek || (n === enYuksek && t === this.son6[this.son6.length - 1])) {
        enYuksek = n;
        enIyi = t;
      }
    }
    return enYuksek >= 2 ? enIyi : null;
  }

  /** Sıfırla (yeni oturumda). */
  sifirla(): void {
    this.son6 = [];
  }
}
