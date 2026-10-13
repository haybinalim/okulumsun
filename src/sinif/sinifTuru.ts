/**
 * SINIF TURU — SAF durum makinesi (plan v2 Adım 36, aşama 1; ADR-0008).
 *
 * Tahtada 2–4 takım sırayla soru çözer; ortak hedef "sınıf kavanozu". Tamamlanan her tur
 * (doğru, ipuçlu ya da birlikte çözülmüş) bir yaprak + takıma bir yıldız getirir. Puan, skor,
 * hız ve kazanan YOKTUR. Modül saftır: saat, rastgelelik, depolama ve ağ yok.
 */
import type { Renk, SkillId } from '../exercises/types';
import type { MaddeSonuc } from '../progress/itemLifecycle';
import { setSorusu, type GunlukSet, type SetSorusu } from '../ogretmen/gunlukSet';

export const TAKIM_SAYISI_ARALIGI = [2, 4] as const;
export const VARSAYILAN_TUR_PER_TAKIM = 3;

export interface Takim {
  readonly renk: Renk;
  readonly yildiz: number;
}

export type TurAsamasi = 'siraDuyurusu' | 'soru' | 'kutlama' | 'bitti';

export interface SinifTuruDurumu {
  readonly takimlar: readonly Takim[];
  readonly siradaki: number;
  readonly turNo: number;
  readonly kavanozHedefi: number;
  readonly kavanoz: number;
  readonly kaynak: GunlukSet;
  readonly asama: TurAsamasi;
  /** Yalnız bellek (Adım 40 ders sonu özeti). */
  readonly sonuclar: readonly MaddeSonuc[];
}

export type SinifTuruOlayi =
  | { readonly tur: 'duyuruBitti' }
  | { readonly tur: 'maddeKapandi'; readonly sonuc: MaddeSonuc; readonly skillId: SkillId }
  | { readonly tur: 'kutlamaBitti' }
  | { readonly tur: 'ogretmenBitirdi' };

export function sinifTuruBaslat(
  renkler: readonly Renk[],
  kaynak: GunlukSet,
  turPerTakim: number = VARSAYILAN_TUR_PER_TAKIM,
): SinifTuruDurumu {
  const [en, çok] = TAKIM_SAYISI_ARALIGI;
  if (renkler.length < en || renkler.length > çok) {
    throw new Error(`sinifTuruBaslat: takım sayısı ${en}–${çok} olmalı (${renkler.length}).`);
  }
  if (new Set(renkler).size !== renkler.length) throw new Error('sinifTuruBaslat: renkler yinelenemez.');
  if (!Number.isInteger(turPerTakim) || turPerTakim < 1) throw new Error('sinifTuruBaslat: geçersiz tur sayısı.');
  return {
    takimlar: renkler.map((renk) => ({ renk, yildiz: 0 })),
    siradaki: 0,
    turNo: 0,
    kavanozHedefi: renkler.length * turPerTakim,
    kavanoz: 0,
    kaynak,
    asama: 'siraDuyurusu',
    sonuclar: [],
  };
}

function gecersiz(d: SinifTuruDurumu, o: SinifTuruOlayi): never {
  throw new Error(`sinifTuruIlerlet: '${o.tur}' olayı '${d.asama}' aşamasında geçersiz.`);
}

export function sinifTuruIlerlet(d: SinifTuruDurumu, o: SinifTuruOlayi): SinifTuruDurumu {
  if (o.tur === 'ogretmenBitirdi') return d.asama === 'bitti' ? d : { ...d, asama: 'bitti' };
  switch (d.asama) {
    case 'siraDuyurusu':
      if (o.tur !== 'duyuruBitti') return gecersiz(d, o);
      return { ...d, asama: 'soru' };
    case 'soru': {
      if (o.tur !== 'maddeKapandi') return gecersiz(d, o);
      // Doğru ya da yanlış fark etmez: tamamlanan her tur yıldız + yaprak getirir.
      const takimlar = d.takimlar.map((t, i) => (i === d.siradaki ? { ...t, yildiz: t.yildiz + 1 } : t));
      return {
        ...d,
        takimlar,
        kavanoz: d.kavanoz + 1,
        turNo: d.turNo + 1,
        asama: 'kutlama',
        sonuclar: [...d.sonuclar, o.sonuc],
      };
    }
    case 'kutlama':
      if (o.tur !== 'kutlamaBitti') return gecersiz(d, o);
      if (d.kavanoz >= d.kavanozHedefi) return { ...d, asama: 'bitti' };
      return { ...d, siradaki: (d.siradaki + 1) % d.takimlar.length, asama: 'siraDuyurusu' };
    case 'bitti':
      return gecersiz(d, o);
  }
}

/** Sıradaki turun sorusu; her tur ayrı sıra numarası → set akışı determinist. */
export function sinifTuruSorusu(d: SinifTuruDurumu, kayitli: (t: string) => boolean): SetSorusu {
  return setSorusu(d.kaynak, d.turNo, kayitli);
}
