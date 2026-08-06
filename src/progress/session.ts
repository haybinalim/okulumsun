/**
 * OTURUM YAŞAM DÖNGÜSÜ — plan §6.4 + §7.3.
 *
 * `scheduler.ts` ve `mastery.ts` saf TS'dir; bu modül onları birleştirir ve
 * dış dünya (zaman, kalıcılık) ile köprü kurar. `session.ts` kalıcılık
 * katmanına (§10, Adım 9) yazacak — ama bu adımda yalnız in-memory çalışır.
 *
 * SORUMLULUK:
 *  · 8 soruluk oturumu başlatır, soru sırasını planlar.
 *  · Her cevapta mastery kaydını günceller.
 *  · Sert kuralları uygular (ardışık yanlış → warmup, askıya alma).
 *  · Oturum sonunda özet üretir.
 */

import type { SkillId } from '../exercises/types';
import type { SkillNode } from '../content/schema/skill';
import {
  type MasteryRecord,
  type CevapOlayi,
  type MasteryDurumu,
  yeniKayit,
  masteryGuncelle,
  durumTuret,
} from './mastery';
import {
  oturumPlanla,
  type SecilenSoru,
  type PlanlayiciGirdi,
  type ReadingLevel,
  DUGUM_ASKI_SURESI_GUN,
  DUGUM_ASKI_BASARISIZLIK_ESIGI,
} from './scheduler';

// ---------------------------------------------------------------- tipler

/** Oturum durumu. */
export type OturumDurumu = 'devam' | 'tamam' | 'duraklatildi';

/** Tek bir sorunun oturum içi durumu. */
export interface SoruDurumu {
  readonly secilen: SecilenSoru;
  readonly siraNo: number; // 0..7
  readonly cevaplandi: boolean;
  readonly dogru: boolean;
  readonly kullanilanYardimKademesi: 0 | 1 | 2 | 3;
  readonly tani: string | null;
  readonly latencyMs: number;
}

/** Oturum özeti — tamamlandığında üretilir (plan §10 sessions store). */
export interface OturumOzeti {
  readonly baslangicMs: number;
  readonly bitisMs: number;
  readonly soruSayisi: number;
  readonly dogruSayisi: number;
  readonly yeniDugumSayisi: number;
  readonly masteredOlanDugumler: readonly SkillId[];
}

/** Aktif oturum — §10 active_session store'una yazılacak. */
export interface AktifOturum {
  readonly oturumTohumu: number;
  readonly profilTohumu: number;
  readonly baslangicMs: number;
  readonly secilenSorular: readonly SecilenSoru[];
  readonly guncelSoruIndeksi: number;
  readonly cevaplar: readonly SoruDurumu[];
  readonly durum: OturumDurumu;
}

// ---------------------------------------------------------- oturum yönetimi

/**
 * Yeni bir oturum başlatır.
 *
 * Planlayıcı saf `oturumPlanla`'yı çağırır; bu fonksiyon sonucu bir
 * AktifOturum'a sarar. Kalıcılık (Adım 9) geldiğinde `active_session`'a yazılır.
 */
export function oturumBaslat(
  duzen: readonly SkillNode[],
  kayitlar: ReadonlyMap<SkillId, MasteryRecord>,
  readingLevel: ReadingLevel,
  simdiMs: number,
  oturumTohumu: number,
  profilTohumu: number,
  sonCevaplar: readonly boolean[],
  sonTaniEtiketleri: readonly string[],
  aktifTaniEtiketi: string | null,
): AktifOturum {
  const girdi: PlanlayiciGirdi = {
    duzen,
    kayitlar,
    readingLevel,
    simdiMs,
    oturumTohumu,
    profilTohumu,
    oturumGecmisi: [],
    sonCevaplar,
    sonTaniEtiketleri,
    aktifTaniEtiketi,
  };

  const secilenSorular = oturumPlanla(girdi);

  return {
    oturumTohumu,
    profilTohumu,
    baslangicMs: simdiMs,
    secilenSorular,
    guncelSoruIndeksi: 0,
    cevaplar: [],
    durum: 'devam',
  };
}

/**
 * Bir soruyu cevaplar — mastery kaydını günceller, oturumu ilerletir.
 *
 * Dönüş: güncellenmiş oturum + güncellenmiş kayıt haritası.
 * Cevap olayı `zamanMs` içermeli — `Date.now()` İÇERİDE çağrılmaz.
 */
export function soruCevapla(
  oturum: AktifOturum,
  kayitlar: ReadonlyMap<SkillId, MasteryRecord>,
  duzen: readonly SkillNode[],
  cevap: {
    readonly dogru: boolean;
    readonly kullanilanYardimKademesi: 0 | 1 | 2 | 3;
    readonly latencyMs: number;
    readonly tani: string | null;
    readonly zamanMs: number;
  },
  simdiMs: number,
): { oturum: AktifOturum; kayitlar: Map<SkillId, MasteryRecord> } {
  const siraNo = oturum.guncelSoruIndeksi;
  const secilen = oturum.secilenSorular[siraNo];
  if (!secilen) throw new Error(`soruCevapla: geçersiz soru indeksi ${siraNo}`);

  const dugum = duzen.find((d) => d.id === secilen.skillId);
  if (!dugum) throw new Error(`soruCevapla: ${secilen.skillId} düğümü bulunamadı`);

  // Cevap olayını oluştur.
  const olay: CevapOlayi = {
    skillIds: [secilen.skillId],
    dogru: cevap.dogru,
    kullanilanYardimKademesi: cevap.kullanilanYardimKademesi,
    latencyMs: cevap.latencyMs,
    estimatedSec: dugum.estimatedItemsToMastery,
    nodeDifficulty: dugum.difficulty,
    tani: cevap.tani as CevapOlayi['tani'],
    zamanMs: cevap.zamanMs,
  };

  // Mastery kaydını güncelle.
  const yeniKayitlar = new Map(kayitlar);
  const eskiKayit = yeniKayitlar.get(secilen.skillId) ?? yeniKayit(secilen.skillId);
  let yeniKayit_ = masteryGuncelle(eskiKayit, olay);

  // Kural 4: 3 başarısızlık → 1 gün askı.
  if (!cevap.dogru) {
    const basarisizlikSayisi = oturum.cevaplar
      .filter((c) => c.secilen.skillId === secilen.skillId && !c.dogru)
      .length + 1; // bu cevap dahil
    if (basarisizlikSayisi >= DUGUM_ASKI_BASARISIZLIK_ESIGI) {
      yeniKayit_ = {
        ...yeniKayit_,
        askidaBitis: simdiMs + DUGUM_ASKI_SURESI_GUN * 86_400_000,
      };
    }
  }

  yeniKayitlar.set(secilen.skillId, yeniKayit_);

  // Soru durumunu kaydet.
  const soruDurumu: SoruDurumu = {
    secilen,
    siraNo,
    cevaplandi: true,
    dogru: cevap.dogru,
    kullanilanYardimKademesi: cevap.kullanilanYardimKademesi,
    tani: cevap.tani,
    latencyMs: cevap.latencyMs,
  };

  const yeniCevaplar = [...oturum.cevaplar, soruDurumu];
  const yeniIndeks = siraNo + 1;
  const tamam = yeniIndeks >= oturum.secilenSorular.length;

  return {
    oturum: {
      ...oturum,
      guncelSoruIndeksi: yeniIndeks,
      cevaplar: yeniCevaplar,
      durum: tamam ? 'tamam' : 'devam',
    },
    kayitlar: yeniKayitlar,
  };
}

/**
 * Oturum özeti üretir — tamamlandığında çağrılır (plan §10 sessions store).
 */
export function oturumOzeti(oturum: AktifOturum, kayitlar: ReadonlyMap<SkillId, MasteryRecord>, duzen: readonly SkillNode[], simdiMs: number): OturumOzeti {
  const dogruSayisi = oturum.cevaplar.filter((c) => c.dogru).length;
  const yeniDugumSayisi = new Set(
    oturum.cevaplar
      .filter((c) => {
        const k = kayitlar.get(c.secilen.skillId);
        return k && k.attempts === 1; // ilk cevap
      })
      .map((c) => c.secilen.skillId),
  ).size;

  // Mastered olan düğümleri topla.
  const masteredOlan: SkillId[] = [];
  for (const c of oturum.cevaplar) {
    const k = kayitlar.get(c.secilen.skillId);
    const d = duzen.find((dn) => dn.id === c.secilen.skillId);
    if (!k || !d) continue;
    const onKosul = new Map<SkillId, MasteryDurumu>();
    const durum = durumTuret(k, d, simdiMs, onKosul);
    if (durum === 'mastered') masteredOlan.push(c.secilen.skillId);
  }

  return {
    baslangicMs: oturum.baslangicMs,
    bitisMs: simdiMs,
    soruSayisi: oturum.cevaplar.length,
    dogruSayisi,
    yeniDugumSayisi,
    masteredOlanDugumler: [...new Set(masteredOlan)],
  };
}

/**
 * Duraklatılmış oturumu tazeliğini kontrol eder (plan §10).
 *
 * 24 saatten eski duraklatılmış oturum sessizce atılır — dünkü yarım oturumu
 * dayatmak cezalandırıcıdır.
 */
export function tazeMi(oturum: AktifOturum, simdiMs: number): boolean {
  return simdiMs - oturum.baslangicMs < 24 * 86_400_000;
}
