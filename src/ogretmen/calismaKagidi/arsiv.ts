/**
 * ÇALIŞMA KÂĞIDI ARŞİVİ — SAF (plan v2 Adım 48 aşama 1, KG-69).
 *
 * Her hazır düğüm × sabit tohum için tek düğümlü, 6 maddelik, 2×3 bir kâğıt. Kayıt listesi, dosya adı şeması ve
 * kâğıt isteği buradan gelir; PDF/HTML üretimi `scripts/calisma-kagidi-arsivi.ts` (aşama 2). Saat ve rastgelelik yok.
 *
 * Yanıt biçimi: düğümün "daire içine al" ile kâğıda girebilen şablonu varsa o (uygulamadaki varsayılan), yoksa
 * "yazmalı da olur"; ikisiyle de kâğıda giremeyen düğüm arşive girmez.
 */
import type { SkillNode } from '../../content/schema/skill';
import { REGISTRY } from '../../exercises/registry';
import type { SkillId } from '../../exercises/types';
import { DUGUM_KODLARI } from '../dugumKodlari';
import { SET_SURUMU } from '../gunlukSet';
import { ARSIV_TOHUMLARI } from './arsivTohumlari';
import { hash32 } from '../../exercises/rng';
import { kagitKodu, kagitaGirmeyenDugumler, type KagitIstegi, type KagitPlani, type YanitTercihi } from './kagitPlani';

export const ARSIV_KOK_DIZINI = 'kagitlar';
export const ARSIV_MADDE_SAYISI = 6;

export interface ArsivKaydi {
  readonly skillId: SkillId;
  readonly dugumKodu: string;
  /** Düğümün ilk MEB öğrenme çıktısı kodu (ör. `MAT.1.3.1`); dizin adı bundan türetilir. */
  readonly kazanim: string;
  readonly tohum: number;
  readonly yanitTercihi: YanitTercihi;
  /** `OK-…` kâğıt kodu (uygulamadaki çalışma kâğıdıyla aynı biçim). */
  readonly kagitKodu: string;
  /** Kökten göreli yol: `kagitlar/mat-1-3-1/a1-101.pdf`. */
  readonly yol: string;
}

/** `MAT.1.3.1` → `mat-1-3-1` (adres güvenli, küçük harf). */
export function kazanimDizini(kazanim: string): string {
  return kazanim
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function arsivYolu(kazanim: string, dugumKodu: string, tohum: number): string {
  return `${ARSIV_KOK_DIZINI}/${kazanimDizini(kazanim)}/${dugumKodu}-${tohum}.pdf`;
}

/** Kaydın kâğıt isteği (uygulamadaki `kagitPlaniUret` ile aynı üretim). */
export function arsivIstegi(k: Pick<ArsivKaydi, 'skillId' | 'tohum' | 'yanitTercihi'>): KagitIstegi {
  return {
    set: { surum: SET_SURUMU, dugumler: [k.skillId], tohum: k.tohum >>> 0 },
    maddeSayisi: ARSIV_MADDE_SAYISI,
    duzen: '2x3',
    yanitTercihi: k.yanitTercihi,
  };
}

/** Düğüm için arşiv yanıt biçimi; kâğıda hiç giremiyorsa `null`. */
export function arsivYanitTercihi(skillId: SkillId, kayitli: (t: string) => boolean): YanitTercihi | null {
  for (const tercih of ['daireIcineAl', 'yazmaliOlabilir'] as const) {
    const set = { surum: SET_SURUMU, dugumler: [skillId], tohum: 0 };
    if (kagitaGirmeyenDugumler(set, tercih, kayitli).length === 0) return tercih;
  }
  return null;
}

/** Arşiv kayıtları: verilen sırayla (öğretim sırası) her hazır, kodlu, kâğıda girebilen düğüm × her tohum. */
export function arsivKayitlari(
  dugumler: readonly SkillNode[],
  kayitli: (t: string) => boolean = (t) => REGISTRY.has(t),
  tohumlar: readonly number[] = ARSIV_TOHUMLARI,
): ArsivKaydi[] {
  const kayitlar: ArsivKaydi[] = [];
  for (const d of dugumler) {
    const dugumKodu = DUGUM_KODLARI[d.id];
    const kazanim = d.mebOutcomes[0];
    if (d.durum !== 'hazir' || !dugumKodu || !kazanim) continue;
    const yanitTercihi = arsivYanitTercihi(d.id, kayitli);
    if (!yanitTercihi) continue;
    for (const tohum of tohumlar) {
      const k = { skillId: d.id, tohum, yanitTercihi };
      kayitlar.push({
        ...k,
        dugumKodu,
        kazanim,
        kagitKodu: kagitKodu(arsivIstegi(k)),
        yol: arsivYolu(kazanim, dugumKodu, tohum),
      });
    }
  }
  return kayitlar;
}

/**
 * Kâğıdın metin özeti (sayfa maddeleri + cevap anahtarı): aynı kayıt → aynı özet. PDF baytları Chromium sürümüne
 * göre değişebildiği için determinizm bu özetle denetlenir; PDF'nin içine de `data-arsiv-ozet` olarak yazılır.
 */
export function kagitMetinOzeti(plan: Pick<KagitPlani, 'sayfalar' | 'cevapAnahtari'>): string {
  return hash32(JSON.stringify([plan.sayfalar, plan.cevapAnahtari])).toString(36);
}
