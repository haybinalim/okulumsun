/**
 * VELİ İLERLEME ÖZETİ — araştırma raporu §3.5 / Aşama C.
 *
 * Bu modül SAFTIR: IndexedDB, React, `Date.now()` ve ağ çağrısı içermez.
 * Yalnızca cihazda zaten tutulan ustalık ve oturum kayıtlarını açıklanabilir,
 * puansız ve eyleme dönük bir özete çevirir. Hata tanısı kaydedilmediyse
 * çocuğa/veliye var olmayan bir hata türü yakıştırmaz; yalnız gözlenen durum
 * için güvenli bir destek cümlesi üretir.
 */

import type { SkillId } from '../exercises/types';
import type { SkillNode } from '../content/schema/skill';
import type { SessionRecord } from '../persistence/db';
import {
  durumTuret,
  gunAnahtari,
  yeniKayit,
  type MasteryDurumu,
  type MasteryRecord,
} from './mastery';

/** Araştırma raporunun "en fazla üç eylem" sınırı. */
export const OZET_EYLEM_SINIRI = 3;

export type DestekDurumu = Extract<MasteryDurumu, 'struggling' | 'rusty'>;

/** Veliye gösterilen tek, açıklanabilir destek maddesi. */
export interface DestekGerektirenBeceri {
  readonly skillId: SkillId;
  readonly baslik: string;
  readonly durum: DestekDurumu;
  /** Kaydedilmiş tanı yoksa, yalnızca gözlenen durumun güvenli açıklaması. */
  readonly hataEtiketi: string;
  /** Ekran dışına taşınabilen kısa, somut yetişkin etkinliği. */
  readonly onerilenEylem: string;
}

/** Bir sonraki küçük adıma hazır beceri. Ustalık rozeti veya puanı değildir. */
export interface HazirBeceri {
  readonly skillId: SkillId;
  readonly baslik: string;
  readonly kazanımAdi: string;
}

export interface IlerlemeOzeti {
  readonly destekGerektiren: readonly DestekGerektirenBeceri[];
  readonly hazirOlanlar: readonly HazirBeceri[];
  readonly toplamCalisma: {
    readonly gun: number;
    readonly oturum: number;
  };
  readonly sonCalisma: Date | null;
}

/**
 * Tüm düğümlerin türetilmiş durumlarını çözer.
 *
 * `durumTuret` bir düğümün ön koşul durumlarını girdi olarak aldığından,
 * bağımlılıklar sabitlenene kadar en çok düğüm sayısı kadar tur atılır.
 * Böylece özet, beceri JSON'ının dizilim sırasına bağımlı kalmaz.
 */
export function tumDurumlariTuret(
  kayitlar: readonly MasteryRecord[],
  dugumler: readonly SkillNode[],
  simdiMs: number,
): ReadonlyMap<SkillId, MasteryDurumu> {
  const kayitHaritasi = new Map(kayitlar.map((kayit) => [kayit.skillId, kayit]));
  let durumlar = new Map<SkillId, MasteryDurumu>();

  for (let tur = 0; tur < dugumler.length; tur += 1) {
    const sonraki = new Map<SkillId, MasteryDurumu>();
    let degisti = false;

    for (const dugum of dugumler) {
      const kayit = kayitHaritasi.get(dugum.id) ?? yeniKayit(dugum.id);
      const durum = durumTuret(kayit, dugum, simdiMs, durumlar);
      sonraki.set(dugum.id, durum);
      if (durumlar.get(dugum.id) !== durum) degisti = true;
    }

    durumlar = sonraki;
    if (!degisti) break;
  }

  return durumlar;
}

/** Temaya göre, yetişkinin çocuğun yanında yapabileceği fiziksel küçük adım. */
export function fizikselEtkinlik(tema: SkillNode['tema']): string {
  const oneriler: Record<SkillNode['tema'], string> = {
    1: 'Bir nesneyi kutunun içine ve dışına koyup konumunu birlikte söyleyin.',
    2: 'Onluk çerçeve ve küçük nesnelerle sayıp sayı kartıyla eşleştirin.',
    3: 'İki sınıf nesnesini aynı bloklarla ölçüp hangisinin uzun olduğunu karşılaştırın.',
    4: 'İki küçük nesne grubunu birleştirip sonucu birlikte sayın.',
    5: '5, 10 ve 20 TL banknot görsellerini değerleriyle eşleştirin.',
    6: 'Şekilleri sınıfta bulun, kenar ve köşelerini birlikte işaret edin.',
    7: 'Küçük nesneleri sayıp aynı sayıyı parmakla gösterin.',
  };
  return oneriler[tema];
}

function destekNedeni(durum: DestekDurumu): string {
  return durum === 'struggling'
    ? 'Son denemelerde aynı beceride tekrar eden zorlanma görüldü.'
    : 'Bu beceri için kısa bir hatırlama turu önerilir.';
}

function destekOnceligi(kayit: MasteryRecord, durum: DestekDurumu): number {
  const sonBasariOrani = kayit.son6.length === 0
    ? 1
    : kayit.son6.filter(Boolean).length / kayit.son6.length;
  const durumTabani = durum === 'struggling' ? 1_000 : 500;
  return durumTabani + (1 - sonBasariOrani) * 100 + Math.min(kayit.attempts, 99);
}

function sonCalismaMs(
  kayitlar: readonly MasteryRecord[],
  oturumlar: readonly SessionRecord[],
): number | null {
  const zamanlar = [
    ...kayitlar.map((kayit) => kayit.lastAnsweredAt).filter((zaman): zaman is number => zaman !== null),
    ...oturumlar.map((oturum) => oturum.bitisMs),
  ];
  return zamanlar.length === 0 ? null : Math.max(...zamanlar);
}

/**
 * Yerel kayıtları yetişkin için kısa bir öğrenme eylem özetine dönüştürür.
 *
 * `oturumlar` isteğe bağlıdır; böylece çekirdek özet yalnız ustalık kayıtlarıyla
 * da kullanılabilir. Uygulama paneli bunu son 90 günün yerel oturumlarıyla verir.
 */
export function ilerlemeOzetiniHesapla(
  kayitlar: readonly MasteryRecord[],
  dugumler: readonly SkillNode[],
  simdiMs: number,
  oturumlar: readonly SessionRecord[] = [],
): IlerlemeOzeti {
  const kayitHaritasi = new Map(kayitlar.map((kayit) => [kayit.skillId, kayit]));
  const durumlar = tumDurumlariTuret(kayitlar, dugumler, simdiMs);

  const destekGerektiren = dugumler
    .flatMap((dugum) => {
      const durum = durumlar.get(dugum.id);
      const kayit = kayitHaritasi.get(dugum.id);
      if (!kayit || (durum !== 'struggling' && durum !== 'rusty')) return [];

      const destek: DestekGerektirenBeceri = {
        skillId: dugum.id,
        baslik: dugum.baslik,
        durum,
        hataEtiketi: destekNedeni(durum),
        onerilenEylem: fizikselEtkinlik(dugum.tema),
      };
      return [{ destek, oncelik: destekOnceligi(kayit, durum) }];
    })
    .sort((a, b) => b.oncelik - a.oncelik || a.destek.baslik.localeCompare(b.destek.baslik, 'tr'))
    .slice(0, OZET_EYLEM_SINIRI)
    .map(({ destek }) => destek);

  // "Hazır" yalnız daha önce tamamlanan bir beceriden sonra açılan yeni adımdır.
  // Başlangıç düğümlerini sıralamak, paneli konu kataloğuna dönüştürürdü.
  const hazirOlanlar = dugumler
    .filter((dugum) => {
      if (durumlar.get(dugum.id) !== 'ready' || dugum.durum !== 'hazir') return false;
      return dugum.prerequisites.some((onKosul) => onKosul.type === 'hard');
    })
    .slice(0, OZET_EYLEM_SINIRI)
    .map((dugum) => ({
      skillId: dugum.id,
      baslik: dugum.baslik,
      kazanımAdi: dugum.mebOutcomes.join(', '),
    }));

  const calismaGunleri = new Set(
    kayitlar
      .map((kayit) => kayit.lastAnsweredAt)
      .filter((zaman): zaman is number => zaman !== null)
      .map(gunAnahtari),
  );
  const sonMs = sonCalismaMs(kayitlar, oturumlar);

  return {
    destekGerektiren,
    hazirOlanlar,
    toplamCalisma: {
      gun: calismaGunleri.size,
      oturum: oturumlar.length,
    },
    sonCalisma: sonMs === null ? null : new Date(sonMs),
  };
}
