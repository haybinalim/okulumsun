/**
 * OTURUM SEÇİCİ — plan §6.4.
 *
 * SAF VE SENKRONDUR. `Date.now()`, IndexedDB, `Math.random()` ÇAĞRILMAZ.
 * Girdisi: MasteryRecord[], SkillNode[], oturum geçmişi, oturumTohumu.
 * Çıktısı: seçilmiş skillId + şablon + madde tohumu.
 *
 * Bu ayrım olmadan 1000 oturumluk simülasyon testi (§15) yazılamz.
 */

import type { SkillId, TemplateId } from '../exercises/types';
import type { SkillNode } from '../content/schema/skill';
import { REGISTRY } from '../exercises/registry';
import { hash32, createRng, type Rng } from '../exercises/rng';
import {
  type MasteryRecord,
  type MasteryDurumu,
  durumTuret,
  strengthEffHesapla,
  vadeGelmisMi,
} from './mastery';

// ---------------------------------------------------------------- sabitler

/** Plan §6.4: oturum başına soru sayısı. */
export const OTURUM_SORU_SAYISI = 8;

/** Plan §6.4: oturum başına en fazla yeni düğüm. */
export const OTURUM_BASI_YENI_DUGUM = 2;

/** Plan §6.4: remediation tetik eşiği — son 6 maddede aynı etiket ≥ 2. */
export const REMEDIATION_TETIK = 2;

/** Plan §6.4: ardışık yanlış → warmup eşiği. */
export const ARDISIK_YANLIS_WARMUP = 2;

/** Plan §6.4: düğüm askı süresi — 3 başarısızlıktan sonra 1 gün. */
export const DUGUM_ASKI_SURESI_GUN = 1;
export const DUGUM_ASKI_BASARISIZLIK_ESIGI = 3;

/** Kova dağılımı — plan §6.4 (oturum başına sabit adet). */
export interface KovaDagilimi {
  readonly warmup: number;
  readonly frontier: number;
  readonly new: number;
  readonly review: number;
  readonly kapanis: number;
}

export const KOVA_DAGILIMI: KovaDagilimi = {
  warmup: 1,
  frontier: 4,
  new: 1,
  review: 1,
  kapanis: 1,
};

// ---------------------------------------------------------------- tipler

/** Seçilen bir soru adayı. */
export interface SecilenSoru {
  readonly skillId: SkillId;
  readonly templateId: TemplateId;
  readonly seed: number;
  readonly kova: KovaAdi;
}

/** Kova adları. */
export type KovaAdi = 'warmup' | 'frontier' | 'new' | 'review' | 'remediation' | 'kapanis';

/** Çocuğun okuma seviyesi — plan §6.3. */
export type ReadingLevel = 0 | 1 | 2 | 3;

/** Planlayıcı girdisi. */
export interface PlanlayiciGirdi {
  readonly duzen: readonly SkillNode[];
  readonly kayitlar: ReadonlyMap<SkillId, MasteryRecord>;
  readonly readingLevel: ReadingLevel;
  readonly simdiMs: number;
  readonly oturumTohumu: number;
  readonly profilTohumu: number;
  /** Bu oturumda şimdiye kadar sorulan düğümler (novelty için). */
  readonly oturumGecmisi: readonly SecilenSoru[];
  /** Son maddelerin doğru/yanlış dizisi (en yeni son). */
  readonly sonCevaplar: readonly boolean[];
  /** Son 6 maddenin tanı etiketleri (remediation tetiki için). */
  readonly sonTaniEtiketleri: readonly string[];
  /** Aktif tanı etiketi varsa (remediation kovası için). */
  readonly aktifTaniEtiketi: string | null;
}

/** Düğüm sayacı — tohum türetme için (plan §5.4). */
export interface DugumSayaci {
  readonly skillId: SkillId;
  readonly sayac: number;
}

// ------------------------------------------------------ yardımcı fonksiyonlar

/** Bir düğümün durumunu hesaplar (ön-koşul durumlarını içinden çıkarır). */
function durumHesapla(
  dugum: SkillNode,
  kayitlar: ReadonlyMap<SkillId, MasteryRecord>,
  simdiMs: number,
): MasteryDurumu {
  const kayit = kayitlar.get(dugum.id);
  if (!kayit) {
    // Kayıt yok — ready veya locked.
    if (dugum.isEntryPoint) return 'ready';
    const hardOnKosullar = dugum.prerequisites.filter((p) => p.type === 'hard');
    if (hardOnKosullar.length === 0) return 'ready';
    // Ön koşulların tamamının kaydı var ve mastered ise ready.
    const tumMastered = hardOnKosullar.every((p) => {
      const pk = kayitlar.get(p.id);
      if (!pk) return false;
      return (
        pk.strength >= 0.85 &&
        pk.streak >= 3 &&
        pk.distinctDays >= 2
      );
    });
    return tumMastered ? 'ready' : 'locked';
  }

  // Ön-koşul durumlarını topla.
  const onKosulDurumlari = new Map<SkillId, MasteryDurumu>();
  for (const p of dugum.prerequisites) {
    if (p.type === 'hard') {
      const pDugum = { id: p.id, prerequisites: [], isEntryPoint: false } as unknown as SkillNode;
      onKosulDurumlari.set(p.id, durumHesapla(pDugum, kayitlar, simdiMs));
    }
  }
  return durumTuret(kayit, dugum, simdiMs, onKosulDurumlari);
}

/** Bir düğümün şablonlarından kayıt defterinde olanları döndürür. */
function hazirSablonlar(dugum: SkillNode): readonly TemplateId[] {
  return dugum.exerciseTemplates.filter((t) => REGISTRY.has(t));
}

/** Madde tohumu türetir — plan §5.4. */
export function tohumTuret(
  profilTohumu: number,
  skillId: SkillId,
  templateId: TemplateId,
  dugumSayaci: number,
): number {
  return hash32(`${profilTohumu}|${skillId}|${templateId}|${dugumSayaci}`);
}

/** Bir düğümün son 4 maddede başarı oranına göre hedef zorluk. */
function hedefZorluk(sonCevaplar: readonly boolean[]): number {
  if (sonCevaplar.length < 4) return 3; // varsayılan orta
  const son4 = sonCevaplar.slice(-4);
  const basari = son4.filter(Boolean).length / son4.length;
  if (basari >= 0.75) return 4; // kolay gidiyor → zorlaştır
  if (basari <= 0.25) return 2; // zorlanıyor → kolaylaştır
  return 3;
}

// ------------------------------------------------------- skorlama çarpanları

/** Plan §6.4: urgency. */
function urgency(kayit: MasteryRecord, simdiMs: number): number {
  const sEff = strengthEffHesapla(kayit.strength, kayit.box, kayit.lastAnsweredAt, simdiMs);
  return Math.max(0.05, 1 - sEff);
}

/** Plan §6.4: novelty. */
function novelty(skillId: SkillId, gecmis: readonly SecilenSoru[]): number {
  const sayac = gecmis.filter((s) => s.skillId === skillId).length;
  if (sayac === 0) return 1.0;
  if (sayac === 1) return 0.5;
  if (sayac === 2) return 0.2;
  return 0;
}

/** Plan §6.4: readingFit. */
function readingFit(dugum: SkillNode, readingLevel: ReadingLevel): number {
  return dugum.readingLoadCeiling <= readingLevel ? 1.0 : 0;
}

/** Plan §6.4: assetReady. */
function assetReady(dugum: SkillNode): number {
  return hazirSablonlar(dugum).length > 0 ? 1.0 : 0;
}

/** Plan §6.4: interleave. */
function interleave(skillId: SkillId, duzen: readonly SkillNode[], gecmis: readonly SecilenSoru[]): number {
  if (gecmis.length === 0) return 1.0;
  const sonSkill = gecmis[gecmis.length - 1].skillId;
  if (sonSkill === skillId) return 0.6;
  const dugum = duzen.find((d) => d.id === skillId);
  const sonDugum = duzen.find((d) => d.id === sonSkill);
  if (!dugum || !sonDugum) return 1.0;
  return dugum.tema !== sonDugum.tema ? 1.0 : 0.6;
}

/** Plan §6.4: difficultyFit. */
function difficultyFit(dugum: SkillNode, sonCevaplar: readonly boolean[]): number {
  const hedef = hedefZorluk(sonCevaplar);
  return Math.max(0, 1 - Math.abs(dugum.difficulty - hedef) / 5);
}

/** Bir adayın toplam puanı. 0 ise elenir. */
function adayPuani(
  dugum: SkillNode,
  kayit: MasteryRecord | undefined,
  girdi: PlanlayiciGirdi,
): number {
  const u = kayit ? urgency(kayit, girdi.simdiMs) : 1.0;
  const n = novelty(dugum.id, girdi.oturumGecmisi);
  const r = readingFit(dugum, girdi.readingLevel);
  const a = assetReady(dugum);
  const i = interleave(dugum.id, girdi.duzen, girdi.oturumGecmisi);
  const d = difficultyFit(dugum, girdi.sonCevaplar);
  return u * n * r * a * i * d;
}

// ----------------------------------------------------------- kova adayları

interface Aday {
  readonly dugum: SkillNode;
  readonly kayit: MasteryRecord | undefined;
  readonly puan: number;
}

/** Bir kova için adayları toplar. */
function kovaAdaylari(
  kova: KovaAdi,
  girdi: PlanlayiciGirdi,
  asigiKaldir: boolean,
): readonly Aday[] {
  const adaylar: Aday[] = [];

  for (const dugum of girdi.duzen) {
    // Sadece hazir düğümler (planlandi düğümlerde şablon yok).
    if (dugum.durum !== 'hazir') continue;
    // Şablonu defterde yoksa atla.
    if (hazirSablonlar(dugum).length === 0) continue;
    // Askıdaki düğümleri ele (kural 4).
    const kayit = girdi.kayitlar.get(dugum.id);
    if (!asigiKaldir && kayit && kayit.askidaBitis !== null && kayit.askidaBitis > girdi.simdiMs) continue;

    const durum = kayit ? durumHesapla(dugum, girdi.kayitlar, girdi.simdiMs) : 'ready';
    if (!kayit && !dugum.isEntryPoint) {
      // Kayıt yok ve giriş noktası değil — ön koşul kontrolü.
      const hard = dugum.prerequisites.filter((p) => p.type === 'hard');
      if (hard.length > 0) {
        const tumMastered = hard.every((p) => {
          const pk = girdi.kayitlar.get(p.id);
          return pk && pk.strength >= 0.85 && pk.streak >= 3 && pk.distinctDays >= 2;
        });
        if (!tumMastered) continue;
      }
    }

    const kovaUygun = kovaSec(kova, durum, kayit, girdi);
    if (!kovaUygun) continue;

    const puan = adayPuani(dugum, kayit, girdi);
    if (puan > 0) adaylar.push({ dugum, kayit, puan });
  }

  return adaylar;
}

/** Bir durum hangi kovaya girer? */
function kovaSec(
  kova: KovaAdi,
  durum: MasteryDurumu,
  kayit: MasteryRecord | undefined,
  girdi: PlanlayiciGirdi,
): boolean {
  switch (kova) {
    case 'warmup':
    case 'kapanis':
      return durum === 'mastered';
    case 'frontier':
      if (durum !== 'learning') return false;
      if (!kayit) return false;
      {
        const sEff = strengthEffHesapla(kayit.strength, kayit.box, kayit.lastAnsweredAt, girdi.simdiMs);
        return sEff >= 0.3 && sEff <= 0.85;
      }
    case 'new':
      return durum === 'ready';
    case 'review':
      if (!kayit) return false;
      return durum === 'rusty' || vadeGelmisMi(kayit, girdi.simdiMs);
    case 'remediation':
      // Aktif tanı etiketi olan düğümler.
      return girdi.aktifTaniEtiketi !== null && kayit !== undefined;
    default:
      return false;
  }
}

// ----------------------------------------------------------- seçim fonksiyonu

/** En yüksek puanlı 3 adaydan ağırlıklı rastgele seç. */
function agirlikliSec(adaylar: readonly Aday[], rng: Rng): Aday | null {
  if (adaylar.length === 0) return null;
  if (adaylar.length === 1) return adaylar[0];

  // Puana göre sırala, en yüksek 3'ü al.
  const sirali = [...adaylar].sort((a, b) => b.puan - a.puan);
  const top3 = sirali.slice(0, 3);

  // Ağırlıklı rastgele.
  const toplam = top3.reduce((s, a) => s + a.puan, 0);
  let cek = rng.next() * toplam;
  for (const a of top3) {
    cek -= a.puan;
    if (cek <= 0) return a;
  }
  return top3[0];
}

/** Soğuk başlangıç: mastered yoksa en yüksek strength'li düğüm. */
function sogukBaslangicAdayi(
  duzen: readonly SkillNode[],
  kayitlar: ReadonlyMap<SkillId, MasteryRecord>,
): SkillNode | null {
  let enIyi: SkillNode | null = null;
  let enYuksek = -1;
  for (const d of duzen) {
    if (d.durum !== 'hazir') continue;
    if (hazirSablonlar(d).length === 0) continue;
    const k = kayitlar.get(d.id);
    const s = k?.strength ?? 0;
    if (s > enYuksek) {
      enYuksek = s;
      enIyi = d;
    }
  }
  if (enIyi) return enIyi;
  // Hiç kayıt yoksa en düşük difficulty'li giriş noktası.
  const girislar = duzen
    .filter((d) => d.durum === 'hazir' && d.isEntryPoint && hazirSablonlar(d).length > 0)
    .sort((a, b) => a.difficulty - b.difficulty);
  return girislar[0] ?? null;
}

// ---------------------------------------------------------- oturum planlama

/**
 * 8 soruluk oturumu planlar (plan §6.4).
 *
 * Çıktı: 8 seçilen soru. Boş kova devri uygulanır; hiç aday yoksa oturum
 * kısa kapanır (uydurma soru üretilmez).
 */
export function oturumPlanla(girdi: PlanlayiciGirdi): readonly SecilenSoru[] {
  const rng = createRng(girdi.oturumTohumu);
  const sonuc: SecilenSoru[] = [];

  // Sıra: warmup(1) → frontier(4) → new(1) → review(1) → kapanis(1)
  // Remediation tetiklenirse frontier'dan 2 soru alınır.
  const remediationTetik =
    girdi.aktifTaniEtiketi !== null &&
    girdi.sonTaniEtiketleri.filter((e) => e === girdi.aktifTaniEtiketi).length >= REMEDIATION_TETIK;

  const plan: readonly { kova: KovaAdi; adet: number }[] = remediationTetik
    ? [
        { kova: 'warmup', adet: 1 },
        { kova: 'remediation', adet: 2 },
        { kova: 'frontier', adet: 2 },
        { kova: 'new', adet: 1 },
        { kova: 'review', adet: 1 },
        { kova: 'kapanis', adet: 1 },
      ]
    : [
        { kova: 'warmup', adet: 1 },
        { kova: 'frontier', adet: 4 },
        { kova: 'new', adet: 1 },
        { kova: 'review', adet: 1 },
        { kova: 'kapanis', adet: 1 },
      ];

  // Yeni düğüm sayacı (kural: oturum başına en fazla 2).
  let yeniDugumSayaci = 0;

  for (const { kova, adet } of plan) {
    for (let i = 0; i < adet; i++) {
      // Sert kural 3: 2 ardışık yanlış → warmup zorunlu.
      if (kova !== 'warmup' && kova !== 'kapanis') {
        const son2 = girdi.sonCevaplar.slice(-2);
        if (son2.length >= ARDISIK_YANLIS_WARMUP && son2.every((c) => !c)) {
          // Warmup zorunlu — bu slot'u warmup'a çevir.
          const aday = secVeEkle('warmup', girdi, rng, sonuc);
          if (aday) {
            sonuc.push(aday);
            if (kovaSec('new', 'ready', girdi.kayitlar.get(aday.skillId), girdi)) yeniDugumSayaci++;
          }
          continue;
        }
      }

      // Yeni kova tavanı.
      if (kova === 'new' && yeniDugumSayaci >= OTURUM_BASI_YENI_DUGUM) continue;

      const aday = secVeEkle(kova, girdi, rng, sonuc);
      if (aday) {
        sonuc.push(aday);
        if (kova === 'new') yeniDugumSayaci++;
      } else {
        // Devir: boş kova → sırayla frontier → new → warmup.
        for (const devirKova of ['frontier', 'new', 'warmup'] as const) {
          if (devirKova === kova) continue;
          const devirAday = secVeEkle(devirKova, girdi, rng, sonuc);
          if (devirAday) {
            sonuc.push(devirAday);
            if (devirKova === 'new') yeniDugumSayaci++;
            break;
          }
        }
      }
    }
  }

  // Sert kural 5: oturum ustalaşılmış bir soruyla bitsin.
  if (sonuc.length > 0) {
    const son = sonuc[sonuc.length - 1];
    const sonKayit = girdi.kayitlar.get(son.skillId);
    const sonDugum = girdi.duzen.find((d) => d.id === son.skillId);
    if (sonDugum) {
      const sonDurum = sonKayit ? durumHesapla(sonDugum, girdi.kayitlar, girdi.simdiMs) : 'ready';
      if (sonDurum !== 'mastered') {
        // Kapanışı mastered ile değiştir.
        const kapanisAdaylari = kovaAdaylari('kapanis', girdi, false);
        if (kapanisAdaylari.length > 0) {
          const secilen = agirlikliSec(kapanisAdaylari, rng);
          if (secilen) {
            sonuc[sonuc.length - 1] = soruOlustur(secilen, 'kapanis', girdi, sonuc.length);
          }
        } else {
          // Soğuk başlangıç: mastered yoksa en yüksek strength.
          const soguk = sogukBaslangicAdayi(girdi.duzen, girdi.kayitlar);
          if (soguk) {
            sonuc[sonuc.length - 1] = soruOlustur(
              { dugum: soguk, kayit: girdi.kayitlar.get(soguk.id), puan: 0 },
              'kapanis',
              girdi,
              sonuc.length,
            );
          }
        }
      }
    }
  }

  return sonuc;
}

/** Bir kovadan soru seçer ve SecilenSoru oluşturur. */
function secVeEkle(
  kova: KovaAdi,
  girdi: PlanlayiciGirdi,
  rng: Rng,
  gecmis: readonly SecilenSoru[],
): SecilenSoru | null {
  // warmup/kapanis için soğuk başlangış desteği.
  if (kova === 'warmup' || kova === 'kapanis') {
    const adaylar = kovaAdaylari(kova, girdi, false);
    if (adaylar.length > 0) {
      const secilen = agirlikliSec(adaylar, rng);
      if (secilen) return soruOlustur(secilen, kova, girdi, gecmis.length);
    }
    // Soğuk başlangıç: mastered yoksa en yüksek strength.
    const soguk = sogukBaslangicAdayi(girdi.duzen, girdi.kayitlar);
    if (soguk) {
      return soruOlustur(
        { dugum: soguk, kayit: girdi.kayitlar.get(soguk.id), puan: 0 },
        kova,
        girdi,
        gecmis.length,
      );
    }
    return null;
  }

  const adaylar = kovaAdaylari(kova, girdi, false);
  if (adaylar.length === 0) return null;
  const secilen = agirlikliSec(adaylar, rng);
  if (!secilen) return null;
  return soruOlustur(secilen, kova, girdi, gecmis.length);
}

/** Adaydan SecilenSoru oluşturur. */
function soruOlustur(
  aday: Aday,
  kova: KovaAdi,
  girdi: PlanlayiciGirdi,
  soruIndeksi: number,
): SecilenSoru {
  const sablonlar = hazirSablonlar(aday.dugum);
  const rng = createRng(hash32(`${girdi.oturumTohumu}:sablon:${soruIndeksi}`));
  const templateId = rng.pick(sablonlar);

  // Tohum türetme (plan §5.4).
  const dugumSayaci = aday.kayit?.attempts ?? 0;
  const seed = tohumTuret(girdi.profilTohumu, aday.dugum.id, templateId, dugumSayaci + soruIndeksi);

  return {
    skillId: aday.dugum.id,
    templateId,
    seed,
    kova,
  };
}
