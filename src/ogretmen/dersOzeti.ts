/**
 * DERS SONU ÖZETİ — SAF (plan v2 Adım 40, aşama 1).
 *
 * Tahta oturumunda biriken olaylardan "sınıf en çok nerede zorlandı?" cevabını üretir.
 * Saat, rastgelelik ve depolama yok; çıktıda sayı/yüzde alanı yok (yalnız düzey).
 */
import { HATA_TANIMLARI, type HataEtiketi } from '../exercises/distractors';
import type { SkillId } from '../exercises/types';
import type { SkillNode } from '../content/schema/skill';
import { fizikselEtkinlik } from '../progress/ilerlemeOzeti';
import type { MaddeSonuc } from '../progress/itemLifecycle';
import { SET_EN_FAZLA_DUGUM, SET_SURUMU, type GunlukSet } from './gunlukSet';

export const DERS_OZETI_EN_FAZLA = 3;
export const DUGUM_ICIN_EN_AZ_MADDE = 2;

export interface DersOlayi {
  readonly skillId: SkillId;
  readonly ilkDenemeDogru: boolean;
  readonly yardimKademesi: 0 | 1 | 2 | 3;
  readonly tani: HataEtiketi | null;
}

export type RahatlikDuzeyi = 'rahat' | 'destekle' | 'zorlandi';

export interface ZorlanilanBeceri {
  readonly skillId: SkillId;
  readonly baslik: string;
  readonly duzey: Exclude<RahatlikDuzeyi, 'rahat'>;
  readonly baskinTani: { readonly etiket: HataEtiketi; readonly aciklama: string } | null;
  readonly sinifEtkinligi: string;
}

export interface DersOzeti {
  readonly zorlanilanlar: readonly ZorlanilanBeceri[];
  readonly rahatlar: readonly { readonly skillId: SkillId; readonly baslik: string }[];
  readonly yarinIcinSet: GunlukSet | null;
}

/**
 * Bir düğümün olaylarından nitel düzey. Zorluk puanı yalnız sıralama içindir; ekrana verilmez.
 * Tema sonu turu (Adım 46) da aynı eşikleri kullanır.
 */
export function duzeyVePuan(olaylar: readonly DersOlayi[]): { duzey: RahatlikDuzeyi; puan: number } {
  const n = olaylar.length;
  const yanlis = olaylar.filter((o) => !o.ilkDenemeDogru).length / n;
  const yardim = olaylar.filter((o) => o.yardimKademesi >= 2).length / n;
  const puan = yanlis + yardim / 2;
  if (yanlis >= 0.5 || yardim >= 0.5) return { duzey: 'zorlandi', puan };
  if (yanlis >= 0.25 || yardim >= 0.25) return { duzey: 'destekle', puan };
  return { duzey: 'rahat', puan };
}

function baskinTani(olaylar: readonly DersOlayi[]): ZorlanilanBeceri['baskinTani'] {
  const sayac = new Map<HataEtiketi, number>();
  for (const o of olaylar) if (o.tani) sayac.set(o.tani, (sayac.get(o.tani) ?? 0) + 1);
  let en: HataEtiketi | null = null;
  let enSayi = 0;
  for (const [etiket, sayi] of [...sayac].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (sayi > enSayi) {
      en = etiket;
      enSayi = sayi;
    }
  }
  if (!en) return null;
  const tanim = HATA_TANIMLARI[en] as { aciklama: string } | undefined;
  return tanim ? { etiket: en, aciklama: tanim.aciklama } : null;
}

/**
 * Kapanan maddenin sonucundan ders olayı (plan v2 Adım 40 aşama 3): tanı ve yardım kademesi
 * `MaddeSonuc`'tan taşınır. `yanlisOldu` madde boyunca en az bir yanlış deneme olduğunu bildirir
 * (tek konu/set akışında sonuç `dogru` kalır; Sınıf Turu `turSonucu` ile `dogru:false` yapar).
 */
export function dersOlayiUret(skillId: SkillId, sonuc: MaddeSonuc, yanlisOldu: boolean): DersOlayi {
  return {
    skillId,
    ilkDenemeDogru: sonuc.dogru && !yanlisOldu,
    yardimKademesi: sonuc.kullanilanYardimKademesi,
    tani: sonuc.tani,
  };
}

export function dersOzetiHesapla(
  olaylar: readonly DersOlayi[],
  dugumler: readonly SkillNode[],
  tohum: number,
): DersOzeti {
  const grup = new Map<SkillId, DersOlayi[]>();
  for (const o of olaylar) grup.set(o.skillId, [...(grup.get(o.skillId) ?? []), o]);
  const dugumBul = new Map(dugumler.map((d) => [d.id as SkillId, d]));

  const zorlar: { b: ZorlanilanBeceri; puan: number }[] = [];
  const rahatlar: { skillId: SkillId; baslik: string }[] = [];
  for (const [skillId, liste] of [...grup].sort((a, b) => a[0].localeCompare(b[0]))) {
    const dugum = dugumBul.get(skillId);
    if (!dugum || liste.length < DUGUM_ICIN_EN_AZ_MADDE) continue;
    const { duzey, puan } = duzeyVePuan(liste);
    if (duzey === 'rahat') {
      rahatlar.push({ skillId, baslik: dugum.baslik });
    } else {
      zorlar.push({
        puan,
        b: {
          skillId,
          baslik: dugum.baslik,
          duzey,
          baskinTani: baskinTani(liste),
          sinifEtkinligi: fizikselEtkinlik(dugum.tema),
        },
      });
    }
  }
  zorlar.sort((a, b) => b.puan - a.puan || a.b.skillId.localeCompare(b.b.skillId));
  const zorlanilanlar = zorlar.slice(0, DERS_OZETI_EN_FAZLA).map((z) => z.b);
  const setDugumleri = zorlanilanlar.map((z) => z.skillId).slice(0, SET_EN_FAZLA_DUGUM);
  return {
    zorlanilanlar,
    rahatlar,
    yarinIcinSet:
      setDugumleri.length > 0
        ? { surum: SET_SURUMU, dugumler: setDugumleri, tohum: tohum >>> 0 }
        : null,
  };
}
