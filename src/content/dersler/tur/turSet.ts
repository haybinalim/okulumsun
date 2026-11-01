/**
 * SET HAZIRLA (TÜRKÇE) — öğretilen kümeyle kısa etkinlik seti (Okuma Yazma planı §2.4.11 madde 5, §2.4.13; Adım 71). SAF.
 *
 * Üç düzey:
 *  - destek: aynı harfler, az çeldirici, çok tekrar (§2.4.13 okuma güçlüğü riski); ses-harf ve harf ayırt etme, kolay hece;
 *  - sınıf: günün dersinin tekrarı; resim, hece, eksik harf, okuma;
 *  - zenginleştirme: daha uzun hece ve sözcük, dikte, yazıca yakın çeldiriciler.
 * Her adım şablon kodu + zorluk + tohum; set tohumdan deterministiktir (aynı tohum → aynı set, eve link). Bu kümeyle
 * kurulamayan adım atlanır ve bildirilir; set en az bir adım kurulamazsa boştur. Hiçbir şey saklanmaz.
 */
import { TUR_SABLONLARI } from './sablonlar';
import { TurUretimHatasi, type TurHavuzSozcugu, type TurSablonKodu, type TurZorluk } from './sablonlar/turSoru';

export type SetDuzeyi = 'destek' | 'sinif' | 'zengin';
export const SET_DUZEYLERI: readonly SetDuzeyi[] = ['destek', 'sinif', 'zengin'];

export const DUZEY_ADI: Readonly<Record<SetDuzeyi, string>> = {
  destek: 'Destek',
  sinif: 'Sınıf',
  zengin: 'Zenginleştirme',
};

export const DUZEY_ACIKLAMASI: Readonly<Record<SetDuzeyi, string>> = {
  destek: 'Aynı harfler, az seçenek, çok tekrar.',
  sinif: 'Günün dersinin tekrarı: resim, hece, eksik harf, okuma.',
  zengin: 'Daha uzun hece ve sözcük, dikte.',
};

export interface SetAdimi {
  readonly sablon: TurSablonKodu;
  readonly zorluk: TurZorluk;
  readonly tohum: number;
}

/** Düzey tarifleri: sırayla denenir (6 adım). */
export const SET_TARIFLERI: Readonly<Record<SetDuzeyi, readonly Omit<SetAdimi, 'tohum'>[]>> = {
  destek: [
    { sablon: 'T-03', zorluk: 1 },
    { sablon: 'T-02', zorluk: 1 },
    { sablon: 'T-01', zorluk: 1 },
    { sablon: 'T-03', zorluk: 2 },
    { sablon: 'T-04', zorluk: 1 },
    { sablon: 'T-02', zorluk: 2 },
  ],
  sinif: [
    { sablon: 'T-01', zorluk: 2 },
    { sablon: 'T-02', zorluk: 3 },
    { sablon: 'T-04', zorluk: 3 },
    { sablon: 'T-06', zorluk: 2 },
    { sablon: 'T-05', zorluk: 2 },
    { sablon: 'T-08', zorluk: 2 },
  ],
  zengin: [
    { sablon: 'T-04', zorluk: 5 },
    { sablon: 'T-05', zorluk: 4 },
    { sablon: 'T-06', zorluk: 4 },
    { sablon: 'T-08', zorluk: 4 },
    { sablon: 'T-07', zorluk: 3 },
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
}): TurSeti {
  const adimlar: SetAdimi[] = [];
  const atlanan: Omit<SetAdimi, 'tohum'>[] = [];
  SET_TARIFLERI[girdi.duzey].forEach((t, i) => {
    for (let d = 0; d < DENEME; d++) {
      const tohum = girdi.tohum * 10 + i + d * 100;
      try {
        TUR_SABLONLARI[t.sablon].uret({ havuz: girdi.havuz, kume: girdi.kume, zorluk: t.zorluk, tohum });
        adimlar.push({ ...t, tohum });
        return;
      } catch (e) {
        if (!(e instanceof TurUretimHatasi)) throw e;
      }
    }
    atlanan.push(t);
  });
  return { duzey: girdi.duzey, adimlar, atlanan };
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
