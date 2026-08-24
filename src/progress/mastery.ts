/**
 * USTALIK MOTORU — plan §6.1.
 *
 * SAF VE SENKRONDUR. `Date.now()`, IndexedDB, `Math.random()` ÇAĞRILMAZ.
 * Zaman ve kalıcılık dışarıdan verilir; böylece 1000 oturumluk simülasyon
 * testi (§15) yazılabilir ve her senaryo deterministik tekrar üretilebilir.
 *
 * ÜÇ ANA FONKSİYON:
 *  · `qHesapla`    — bir cevap olayını q değerine çevirir (null = skorlama yok)
 *  · `masteryGuncelle` — bir kaydı bir cevapla günceller (yeni kayıt döndürür)
 *  · `durumTuret`  — kayıttan mastery durumunu türetir (saklanmaz, türetilir)
 */

import type { Difficulty } from '../exercises/types';
import type { SkillId } from '../exercises/types';
import type { HataEtiketi } from '../exercises/distractors';
import type { SkillNode } from '../content/schema/skill';

// ---------------------------------------------------------------- sabitler

/** Plan §6.1: yarı ömürler (gün). Kutu 0..5 ile indekslenir. */
export const HALF_LIFE = [1, 2, 4, 8, 16, 32] as const;

/** Plan §6.1: strength artış katsayısı. */
export const STRENGTH_ARTIS = 0.35;

/** Plan §6.1: strength azalış katsayısı. */
export const STRENGTH_AZALIS = 0.30;

/** Plan §6.1: zorluk katsayıları —düğüm difficulty'sine göre. */
export const ZORLUK_KATSAYILARI: readonly number[] = [0.8, 0.9, 1.0, 1.1, 1.2];

/** Plan §6.1: ustalık eşiği. */
export const USTALIK_STRENGTH_ESIGI = 0.85;
export const USTALIK_STREAK_ESIGI = 3;
export const USTALIK_DISTINCT_DAYS_ESIGI = 2;

/** Plan §6.1: rusty eşiği (strengthEff). */
export const RUSTY_ESIGI = 0.55;

/** Plan §6.1: struggling eşiği. */
export const STRUGGLING_ATTEMPTS_ESIGI = 6;
export const STRUGGLING_BASARI_ESIGI = 0.45;

/** Plan §6.1: çocuğa gösterim eşikleri (strength tabanlı, aşınmasız). */
export const BUYUME_ESIKLERI = {
  tohum: 0.25,
  filiz: 0.55,
  cicek: 0.85,
} as const;

/** GOREV_ANLASILMADI etiketi — skorlama yok. */
const SKORLAMA_YOK_ETIKETI: HataEtiketi = 'GOREV_ANLASILMADI';

// ---------------------------------------------------------------- tipler

/** Leitner kutusu. */
export type Box = 0 | 1 | 2 | 3 | 4 | 5;

/** Ustalık durumu — türetilir, saklanmaz (plan §6.1 durum makinesi). */
export type MasteryDurumu =
  | 'struggling'
  | 'mastered'
  | 'rusty'
  | 'learning'
  | 'ready'
  | 'locked';

/** Çocuğa gösterilen 4 seviye. */
export type BuyumeSeviyesi = 'tohum' | 'filiz' | 'ciçek' | 'meyve';

/** Düğüm başına ustalık kaydı — bu geliştirme sürümünde yalnız bellek içinde yaşar. */
export interface MasteryRecord {
  readonly skillId: SkillId;
  readonly strength: number; // 0..1
  readonly enYuksekStrength: number; // 0..1, rusty tespiti için
  readonly box: Box;
  readonly streak: number;
  readonly attempts: number;
  readonly distinctDays: number;
  readonly lastAnsweredAt: number | null; // epoch ms
  readonly son6: readonly boolean[]; // en fazla 6, sonuncu en yeni
  /** Askı bitiş zamanı — kural 4 (§6.4) için. */
  readonly askidaBitis: number | null;
}

/** Yeni bir MasteryRecord oluşturur. */
export function yeniKayit(skillId: SkillId): MasteryRecord {
  return {
    skillId,
    strength: 0,
    enYuksekStrength: 0,
    box: 0,
    streak: 0,
    attempts: 0,
    distinctDays: 0,
    lastAnsweredAt: null,
    son6: [],
    askidaBitis: null,
  };
}

/** Bir cevap olayı — madde kapandığında üretilir (plan §6.1). */
export interface CevapOlayi {
  readonly skillIds: readonly SkillId[];
  readonly dogru: boolean;
  readonly kullanilanYardimKademesi: 0 | 1 | 2 | 3;
  readonly latencyMs: number;
  readonly estimatedSec: number;
  readonly nodeDifficulty: Difficulty;
  readonly tani: HataEtiketi | null;
  /** Yalnız tahmin şablonları: e = |tahmin−gerçek|/max(gerçek,1). */
  readonly yakinlik?: number;
  readonly zamanMs: number;
}

// ------------------------------------------------------ yardımcı fonksiyonlar

/**
 * YEREL saatle gün anahtarı — plan §6.1 "gunAnahtari".
 *
 * UTC KULLANMA: 23:30'da çözülen soru ertesi güne yazılırsa distinctDays
 * sahte biçimde şişer ve ustalık koşulu delinir.
 */
export function gunAnahtari(ms: number): string {
  const d = new Date(ms);
  const yil = d.getFullYear();
  const ay = String(d.getMonth() + 1).padStart(2, '0');
  const gun = String(d.getDate()).padStart(2, '0');
  return `${yil}-${ay}-${gun}`;
}

/** İki zaman damgası arasındaki tam gün farkı (plan §6.1 Δgün). */
function gunFarki(eskiMs: number, yeniMs: number): number {
  const eskiAnahtar = gunAnahtari(eskiMs);
  const yeniAnahtar = gunAnahtari(yeniMs);
  if (eskiAnahtar === yeniAnahtar) return 0;
  // Tarihleri yerel gece yarısına hizala, sonra gün farkı al.
  const eski = new Date(eskiAnahtar + 'T00:00:00');
  const yeni = new Date(yeniAnahtar + 'T00:00:00');
  return Math.round((yeni.getTime() - eski.getTime()) / 86_400_000);
}

/** strengthEff hesaplar (plan §6.1). */
export function strengthEffHesapla(
  strength: number,
  box: Box,
  sonCevapMs: number | null,
  simdiMs: number,
): number {
  if (sonCevapMs === null) return strength;
  const dg = gunFarki(sonCevapMs, simdiMs);
  if (dg <= 0) return strength;
  return strength * Math.pow(2, -dg / HALF_LIFE[box]);
}

/** [0, 1] aralığına kelepçeler. */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ------------------------------------------------------------- q hesaplama

/**
 * Bir cevap olayını q değerine çevirir (plan §6.1).
 *
 * Dönüş: `null` = skorlama yok (GOREV_ANLASILMADI), `number` = q ∈ [0, 1].
 */
export function qHesapla(olay: CevapOlayi): number | null {
  // GOREV_ANLASILMADI — skorlama yok.
  if (olay.tani === SKORLAMA_YOK_ETIKETI) return null;

  // Yakınlık şablonları — doğru/yanlış ikiliği YOK.
  if (olay.yakinlik !== undefined) {
    const e = olay.yakinlik;
    if (e <= 0.15) return 1.0;
    if (e <= 0.30) return 0.85;
    if (e <= 0.50) return 0.45;
    return 0.2; // ASLA 0.00 değil (plan §6.1)
  }

  // Yanlış cevap.
  if (!olay.dogru) return 0.0;

  // Doğru cevap — yardım kademesine göre q.
  const k = olay.kullanilanYardimKademesi;
  if (k === 0) {
    // İpucusuz doğru — hızlı mı?
    const hizli = olay.latencyMs <= olay.estimatedSec * 1000;
    return hizli ? 1.0 : 0.85;
  }
  if (k === 1 || k === 2) return 0.45;
  // k === 3 (tam gösterimden sonra)
  return 0.2;
}

// --------------------------------------------------------- mastery güncelleme

/**
 * Bir kaydı bir cevapla günceller (plan §6.1).
 *
 * SAF: girdiyi değiştirmez, yeni kayıt döndürür.
 * `q = null` (GOREV_ANLASILMADI) ise kayıt OLDUĞU GİBİ döner.
 */
export function masteryGuncelle(kayit: MasteryRecord, olay: CevapOlayi): MasteryRecord {
  const q = qHesapla(olay);
  if (q === null) return kayit; // Skorlama yok — hiçbir şey değişmez.

  const zorlukKat = ZORLUK_KATSAYILARI[olay.nodeDifficulty - 1] ?? 1.0;

  // --- strength güncellemesi
  let yeniStrength: number;
  if (olay.dogru) {
    yeniStrength = kayit.strength + STRENGTH_ARTIS * zorlukKat * q * (1 - kayit.strength);
  } else {
    yeniStrength = kayit.strength - STRENGTH_AZALIS * kayit.strength;
  }
  yeniStrength = clamp01(yeniStrength);

  // --- Leitner kutusu (yalnız günler arası hareket eder)
  let yeniBox = kayit.box;
  const ayniGun =
    kayit.lastAnsweredAt !== null && gunAnahtari(kayit.lastAnsweredAt) === gunAnahtari(olay.zamanMs);
  if (!ayniGun) {
    // Farklı gündeki ilk cevap — kutuyu değerlendir.
    if (q >= 0.85) yeniBox = Math.min(kayit.box + 1, 5) as Box;
    else if (q === 0) yeniBox = Math.max(kayit.box - 1, 0) as Box;
    // Aradaki q değerleri → kutu değişmez.
  }

  // --- Sayaçlar
  const yeniAttempts = kayit.attempts + 1;

  let yeniStreak: number;
  if (q >= 0.85) yeniStreak = kayit.streak + 1;
  else if (q === 0) yeniStreak = 0;
  else yeniStreak = kayit.streak; // ipuçlu doğru → değişmez

  const yeniDistinctDays =
    kayit.lastAnsweredAt !== null && gunAnahtari(kayit.lastAnsweredAt) !== gunAnahtari(olay.zamanMs)
      ? kayit.distinctDays + 1
      : kayit.distinctDays;
  // İlk cevapta distinctDays = 1 olmalı (0'dan 1'e).
  const ilkCevap = kayit.lastAnsweredAt === null;
  const sonDistinctDays = ilkCevap ? 1 : yeniDistinctDays;

  // --- son6 halka tampon (en fazla 6, sonuncu en yeni)
  const basarili = q >= 0.45;
  const yeniSon6 = [...kayit.son6, basarili].slice(-6);

  // --- enYuksekStrength
  const yeniEnYuksek = Math.max(kayit.enYuksekStrength, yeniStrength);

  return {
    skillId: kayit.skillId,
    strength: yeniStrength,
    enYuksekStrength: yeniEnYuksek,
    box: yeniBox,
    streak: yeniStreak,
    attempts: yeniAttempts,
    distinctDays: sonDistinctDays,
    lastAnsweredAt: olay.zamanMs,
    son6: yeniSon6,
    askidaBitis: kayit.askidaBitis,
  };
}

// ----------------------------------------------------------- durum türetme

/**
 * Kayıttan mastery durumunu türetir (plan §6.1 durum makinesi).
 *
 * Saklanmaz — her okumada türetilir. Sıra önemlidir, ilk eşleşen kazanır:
 *  1. struggling  (attempts ≥ 6 ve son6 başarı < 0.45)
 *  2. mastered    (strength ≥ 0.85 ve streak ≥ 3 ve distinctDays ≥ 2)
 *  3. rusty       (enYuksekStrength ≥ 0.85 ve strengthEff < 0.55)
 *  4. learning    (attempts ≥ 1)
 *  5. ready       (hard ön-koşullar mastered veya isEntryPoint)
 *  6. locked
 */
export function durumTuret(
  kayit: MasteryRecord,
  dugum: SkillNode,
  simdiMs: number,
  onKosulDurumlari: ReadonlyMap<SkillId, MasteryDurumu>,
): MasteryDurumu {
  // Askıda mı? (kural 4 — 1 gün askı)
  if (kayit.askidaBitis !== null && kayit.askidaBitis > simdiMs) {
  // Askıdaki düğüm seçilemez ama durumu yine de türetilebilir.
  // Askı, planlayıcıda elenir; burada durumu değiştirmez.
  }

  // strengthEff — mastered ve rusty kontrolleri için önceden hesapla.
  const sEff = strengthEffHesapla(kayit.strength, kayit.box, kayit.lastAnsweredAt, simdiMs);

  // 1. struggling
  if (kayit.attempts >= STRUGGLING_ATTEMPTS_ESIGI && kayit.son6.length >= 1) {
    const basariOrani = kayit.son6.filter(Boolean).length / kayit.son6.length;
    if (basariOrani < STRUGGLING_BASARI_ESIGI) return 'struggling';
  }

  // 2. mastered — strength aşınmasız ama taze olmalı (strengthEff ≥ 0.55).
  //    Aksi hâlde rusty asla ulaşılamaz olurdu: strength hiç azalmaz,
  //    sadece strengthEff düşer. Plan §15 senaryo ④ bunu gerektirir.
  if (
    kayit.strength >= USTALIK_STRENGTH_ESIGI &&
    kayit.streak >= USTALIK_STREAK_ESIGI &&
    kayit.distinctDays >= USTALIK_DISTINCT_DAYS_ESIGI &&
    sEff >= RUSTY_ESIGI
  ) {
    return 'mastered';
  }

  // 3. rusty — daha önce mastered olmuş ama aşınmış
  if (kayit.enYuksekStrength >= USTALIK_STRENGTH_ESIGI && sEff < RUSTY_ESIGI) {
    return 'rusty';
  }

  // 4. learning
  if (kayit.attempts >= 1) return 'learning';

  // 5. ready — hard ön-koşullar mastered veya giriş noktası
  if (dugum.isEntryPoint) return 'ready';
  const hardOnKosullar = dugum.prerequisites.filter((p) => p.type === 'hard');
  if (hardOnKosullar.length === 0) return 'ready';
  const tumMastered = hardOnKosullar.every((p) => onKosulDurumlari.get(p.id) === 'mastered');
  if (tumMastered) return 'ready';

  // 6. locked
  return 'locked';
}

/**
 * Çocuğa gösterilecek büyüme seviyesi (plan §6.1, strength tabanlı).
 */
export function buyumeSeviyesi(kayit: MasteryRecord, durum: MasteryDurumu): BuyumeSeviyesi {
  if (durum === 'mastered') return 'meyve';
  if (kayit.strength >= BUYUME_ESIKLERI.cicek) return 'ciçek';
  if (kayit.strength >= BUYUME_ESIKLERI.filiz) return 'filiz';
  return 'tohum';
}

/**
 * Leitner vadesi gelmiş mi? (plan §6.1 — review kovası adaylığı)
 *
 * Düğüm, son cevabından halfLife[box] gün sonra "vadesi gelmiş" sayılır.
 */
export function vadeGelmisMi(kayit: MasteryRecord, simdiMs: number): boolean {
  if (kayit.lastAnsweredAt === null) return false;
  const dg = gunFarki(kayit.lastAnsweredAt, simdiMs);
  return dg >= HALF_LIFE[kayit.box];
}
