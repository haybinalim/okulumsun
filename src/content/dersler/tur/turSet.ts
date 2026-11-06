/**
 * SET HAZIRLA (TÜRKÇE) — öğretilen kümeyle kısa etkinlik seti (Okuma Yazma planı §2.4.11 madde 5, §2.4.13; Adım 71). SAF.
 *
 * Üç düzey:
 *  - destek: aynı harfler, az çeldirici, çok tekrar (§2.4.13 okuma güçlüğü riski); ses-harf ve harf ayırt etme, kolay hece;
 *  - sınıf: günün dersinin tekrarı; resim, hece, eksik harf, okuma;
 *  - zenginleştirme: daha uzun hece ve sözcük, dikte, yazıca yakın çeldiriciler.
 * Her adım şablon kodu + zorluk + tohum; set tohumdan deterministiktir (aynı tohum → aynı set, eve link). Bu kümeyle
 * kurulamayan adım atlanır ve bildirilir; set en az bir adım kurulamazsa boştur. Hiçbir şey saklanmaz.
 *
 * Adım 79 (kullanıcı isteği 2026-11-06): 8 adım, yeni etkinlik türleri karışımda (sesin yeri, hece say, aynı sesle
 * eşleştir, harf avı, harfi parçalardan kur, hatalı sözcük). Aynı set içinde aynı hedef (sözcük/harf/hece) aynı
 * şablonda iki kez gelmez: tohum sırayla kaydırılır (en çok 4 deneme).
 */
import { TUR_SABLONLARI } from './sablonlar';
import {
  TurUretimHatasi,
  type TurHavuzCumlesi,
  type TurHavuzSozcugu,
  type TurSablonKodu,
  type TurZorluk,
} from './sablonlar/turSoru';
import type { TurHamleGlifi } from '../../schema/turHamle';

export type SetDuzeyi = 'destek' | 'sinif' | 'zengin';
export const SET_DUZEYLERI: readonly SetDuzeyi[] = ['destek', 'sinif', 'zengin'];

export const DUZEY_ADI: Readonly<Record<SetDuzeyi, string>> = {
  destek: 'Destek',
  sinif: 'Sınıf',
  zengin: 'Zenginleştirme',
};

export const DUZEY_ACIKLAMASI: Readonly<Record<SetDuzeyi, string>> = {
  destek: 'Aynı harfler, az seçenek, çok tekrar; sesin yeri, harf avı, hece sayma.',
  sinif: 'Günün dersinin tekrarı: resim, eşleştirme, hece, eksik harf, okuma.',
  zengin: 'Daha uzun hece ve sözcük, hatalı sözcük, harfi parçalardan kurma, dikte.',
};

export interface SetAdimi {
  readonly sablon: TurSablonKodu;
  readonly zorluk: TurZorluk;
  readonly tohum: number;
}

/**
 * Tarif adımı. `yedek`: adım bu kümeyle kurulamazsa (ör. cümle etkinliği 1. grupta, D-08) yerine denenen adım; set
 * yine 8 adım kalır (Adım 74).
 */
export interface TarifAdimi {
  readonly sablon: TurSablonKodu;
  readonly zorluk: TurZorluk;
  readonly yedek?: { readonly sablon: TurSablonKodu; readonly zorluk: TurZorluk };
}

/** Setteki adım sayısı (Adım 79: 6 → 8). */
export const SET_ADIM_SAYISI = 8;

/** Düzey tarifleri: sırayla denenir (8 adım; ses → harf → hece → sözcük → yazma). */
export const SET_TARIFLERI: Readonly<Record<SetDuzeyi, readonly TarifAdimi[]>> = {
  destek: [
    { sablon: 'T-03', zorluk: 1 },
    { sablon: 'T-18', zorluk: 1 },
    { sablon: 'T-02', zorluk: 1 },
    { sablon: 'T-20', zorluk: 1 },
    { sablon: 'T-01', zorluk: 1 },
    { sablon: 'T-17', zorluk: 1 },
    { sablon: 'T-04', zorluk: 1 },
    { sablon: 'T-09', zorluk: 1 },
  ],
  sinif: [
    { sablon: 'T-01', zorluk: 2 },
    { sablon: 'T-19', zorluk: 2 },
    { sablon: 'T-02', zorluk: 3 },
    { sablon: 'T-17', zorluk: 2 },
    { sablon: 'T-04', zorluk: 3 },
    { sablon: 'T-06', zorluk: 2 },
    { sablon: 'T-05', zorluk: 2 },
    // Adım 74: 2. gruptan cümle okuma; kurulamazsa sözcük okuma.
    { sablon: 'T-10', zorluk: 2, yedek: { sablon: 'T-08', zorluk: 2 } },
  ],
  zengin: [
    { sablon: 'T-18', zorluk: 4 },
    { sablon: 'T-19', zorluk: 5 },
    { sablon: 'T-04', zorluk: 5 },
    { sablon: 'T-12', zorluk: 4, yedek: { sablon: 'T-05', zorluk: 4 } },
    { sablon: 'T-16', zorluk: 4 },
    { sablon: 'T-11', zorluk: 4, yedek: { sablon: 'T-08', zorluk: 4 } },
    { sablon: 'T-09', zorluk: 4 },
    { sablon: 'T-07', zorluk: 5 },
  ],
};

export interface TurSeti {
  readonly duzey: SetDuzeyi;
  readonly adimlar: readonly SetAdimi[];
  /** Bu kümeyle kurulamadığı için atlanan tarif adımları. */
  readonly atlanan: readonly Omit<SetAdimi, 'tohum'>[];
}

const DENEME = 4;

export function turSetiKur(girdi: {
  readonly havuz: readonly TurHavuzSozcugu[];
  readonly kume: ReadonlySet<string>;
  readonly duzey: SetDuzeyi;
  readonly tohum: number;
  /** Hamle verisi (T-09 için); yoksa T-09 adımı atlanır. */
  readonly hamleler?: readonly TurHamleGlifi[];
  /** Cümle havuzu (T-10, T-11, T-12; cümle parçası yüklü olmalı); yoksa cümle adımı yedeğiyle kurulur. */
  readonly cumleler?: readonly TurHavuzCumlesi[];
}): TurSeti {
  const adimlar: SetAdimi[] = [];
  const atlanan: Omit<SetAdimi, 'tohum'>[] = [];
  const gorulen = new Set<string>();
  SET_TARIFLERI[girdi.duzey].forEach((tarif, i) => {
    if (adimiKur({ sablon: tarif.sablon, zorluk: tarif.zorluk }, i)) return;
    if (tarif.yedek && adimiKur(tarif.yedek, i)) return;
    atlanan.push({ sablon: tarif.sablon, zorluk: tarif.zorluk });
  });
  return { duzey: girdi.duzey, adimlar, atlanan };

  /** Adımı kurar (aynı hedef tekrarı olmadan); kurulamazsa `false`. */
  function adimiKur(t: Omit<SetAdimi, 'tohum'>, i: number): boolean {
    let yedek: number | null = null;
    for (let d = 0; d < DENEME; d++) {
      const tohum = girdi.tohum * 10 + i + d * 100;
      try {
        const soru = TUR_SABLONLARI[t.sablon].uret({
          havuz: girdi.havuz,
          kume: girdi.kume,
          zorluk: t.zorluk,
          tohum,
          hamleler: girdi.hamleler,
          cumleler: girdi.cumleler,
        });
        // Aynı şablonda aynı hedef setde ikinci kez gelmesin (çeşitlilik); yoksa ilk kurulan tohum kalır.
        const anahtar = `${t.sablon}|${soru.hedefMetin}`;
        yedek ??= tohum;
        if (gorulen.has(anahtar) && d < DENEME - 1) continue;
        gorulen.add(anahtar);
        adimlar.push({ ...t, tohum });
        return true;
      } catch (e) {
        if (!(e instanceof TurUretimHatasi)) throw e;
      }
    }
    if (yedek === null) return false;
    adimlar.push({ ...t, tohum: yedek });
    return true;
  }
}

/** Eve link set kodu: düzey harfi + tohum (`s3`, `d12`); katı çözücü. */
const DUZEY_HARFI: Readonly<Record<SetDuzeyi, string>> = { destek: 'd', sinif: 's', zengin: 'z' };

export function setKodu(duzey: SetDuzeyi, tohum: number): string {
  return `${DUZEY_HARFI[duzey]}${tohum}`;
}

export function setKoduCoz(ham: string | null): { duzey: SetDuzeyi; tohum: number } | null {
  const m = ham === null ? null : /^([dsz])([1-9][0-9]{0,2})$/.exec(ham);
  if (!m) return null;
  const duzey = SET_DUZEYLERI.find((d) => DUZEY_HARFI[d] === m[1])!;
  return { duzey, tohum: Number(m[2]) };
}
