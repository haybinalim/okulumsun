/**
 * REPOSITORY — plan §10 kalıcılık işlemleri.
 *
 * Tüm IndexedDB okuma/yazma buradan geçer.
 *
 * TAHTA MODU KURALI (§3.3): tahta modunda HİÇBİR ŞEY yazılmaz.
 * `persistenceEnabled(mod)` false ise tüm yazma fonksiyonları no-op döner.
 * Bu, kod düzeyinde garanti edilir ve testle kanıtlanır.
 */

import { db, type LearnerProfileRecord, type EventRecord, type SessionRecord } from './db';
import type { MasteryRecord } from '../progress/mastery';
import type { AktifOturum, OturumOzeti } from '../progress/session';
import type { SkillId } from '../exercises/types';
import { persistenceEnabled, type Mod } from '../store/appStore';

// ---------------------------------------------------------- profile

/** Varsayılan learner_profile — yeni kullanıcı. */
export const VARSAYILAN_PROFILE: LearnerProfileRecord = {
  id: 'aktif',
  readingLevel: 0,
  okulAyiIndex: 0, // Eylül
  sesHizi: 1.0,
  deviceOverride: null,
  avatarId: null,
  accentId: null,
  persistRequested: false,
  persistGranted: null,
};

/** Profil oku — yoksa varsayılan döner. */
export async function profilOku(): Promise<LearnerProfileRecord> {
  const profil = await db.learner_profile.get('aktif');
  return profil ?? VARSAYILAN_PROFILE;
}

/** Profil yaz — tahta modunda no-op. */
export async function profilYaz(profil: LearnerProfileRecord, mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  await db.learner_profile.put(profil);
}

// ---------------------------------------------------------- mastery

/** Tüm ustalık kayıtlarını oku. */
export async function masteryOku(): Promise<readonly MasteryRecord[]> {
  return db.learner_mastery.toArray();
}

/** Tek düğümün ustalık kaydını oku. */
export async function masteryTekOku(skillId: SkillId): Promise<MasteryRecord | undefined> {
  return db.learner_mastery.get(skillId);
}

/** Ustalık kaydı yaz (upsert) — tahta modunda no-op. */
export async function masteryYaz(kayit: MasteryRecord, mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  await db.learner_mastery.put(kayit);
}

/** Birden çok ustalık kaydı yaz — tahta modunda no-op. */
export async function masteryTopluYaz(kayitlar: readonly MasteryRecord[], mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  await db.learner_mastery.bulkPut(kayitlar as MasteryRecord[]);
}

// ---------------------------------------------------------- active_session

/** Duraklatılmış oturum var mı? */
export async function aktifOturumVar(): Promise<boolean> {
  const sayi = await db.active_session.count();
  return sayi > 0;
}

/** Duraklatılmış oturumu oku. */
export async function aktifOturumOku(): Promise<AktifOturum | undefined> {
  return db.active_session.get('aktif');
}

/**
 * Aktif oturumu yaz (duraklat) — tahta modunda no-op.
 *
 * Her sorunun CEVAP ANINDA çağrılır (soru geçişinde değil).
 * 24 saatten eski oturum açılışta sessizce atılır.
 */
export async function aktifOturumYaz(oturum: AktifOturum, mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  await db.active_session.put({ ...oturum, id: 'aktif' } as AktifOturum & { id: string });
}

/**
 * Aktif oturumu sil — oturum tamamlandığında.
 * Tahta modunda zaten yazılmamıştır, yine de güvenli.
 */
export async function aktifOturumSil(): Promise<void> {
  await db.active_session.delete('aktif');
}

// ---------------------------------------------------------- events

/** Cevap olayı yaz (append-only) — tahta modunda no-op. */
export async function olayYaz(event: Omit<EventRecord, 'seq'>, mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  await db.events.add(event as EventRecord);
}

/**
 * events store'unu budama — her oturum kapanışında.
 * Son 2000 kayıt tutulur, eskiler silinir.
 */
export async function olaylariBuda(maxKayit = 2000): Promise<void> {
  const sayi = await db.events.count();
  if (sayi <= maxKayit) return;

  const silinecek = sayi - maxKayit;
  const eskiKayitlar = await db.events.orderBy('seq').limit(silinecek).toArray();
  const silinecekIdler = eskiKayitlar.map((k) => k.seq!).filter(Boolean);
  await db.events.bulkDelete(silinecekIdler);
}

// ---------------------------------------------------------- sessions

/** Tüm oturum özetlerini oku (son 90 gün). */
export async function oturumOzetleriniOku(gunSiniri = 90): Promise<readonly SessionRecord[]> {
  const esim = Date.now() - gunSiniri * 24 * 60 * 60 * 1000;
  return db.sessions.where('bitisTs').above(esim).toArray();
}

/** Oturum özeti yaz — tahta modunda no-op. */
export async function oturumOzetiYaz(ozet: OturumOzeti, mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  const kayit: SessionRecord = {
    ...ozet,
    sessionId: `${ozet.baslangicMs}-${ozet.bitisMs}`,
    bitisTs: ozet.bitisMs,
  };
  await db.sessions.put(kayit);
}

/**
 * sessions store'unu budama — her oturum kapanışında.
 * 90 günden eski kayıtları sil.
 */
export async function oturumOzetleriniBuda(gunSiniri = 90): Promise<void> {
  const esim = Date.now() - gunSiniri * 24 * 60 * 60 * 1000;
  const eskiKayitlar = await db.sessions.where('bitisTs').below(esim).toArray();
  const silinecekIdler = eskiKayitlar.map((k) => k.sessionId);
  await db.sessions.bulkDelete(silinecekIdler);
}

// ---------------------------------------------------------- budama (toplu)

/** Oturum kapanışında tüm budamayı yap. */
export async function oturumKapanisindaBuda(): Promise<void> {
  await olaylariBuda();
  await oturumOzetleriniBuda();
}
