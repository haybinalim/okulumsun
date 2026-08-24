/**
 * REPOSITORY — öğrenci ve veli verisi erişim sınırı.
 *
 * Geliştirme sürümünde öğrenci/veli profili, ilerleme, oturum ve yanıt olayı
 * saklanmaz. Bu katman, kalıcılığı durdurmakla kalmaz; önceki sürümlerden kalmış
 * yerel kayıtların okunmasını da engeller. Uygulama açılışında bu kayıtlar silinir.
 */

import { db, type LearnerProfileRecord, type EventRecord, type SessionRecord } from './db';
import type { MasteryRecord } from '../progress/mastery';
import type { AktifOturum, OturumOzeti } from '../progress/session';
import type { SkillId } from '../exercises/types';
import { persistenceEnabled, type Mod } from '../store/appStore';
import { OGRENCI_VERISI_SAKLANIR_MI } from './veriSaklamaPolitikasi';

// ---------------------------------------------------------- profile

/** Varsayılan, yalnız bellekte kullanılan profil. */
export const VARSAYILAN_PROFILE: LearnerProfileRecord = {
  id: 'aktif',
  readingLevel: 0,
  okulAyiIndex: 0,
  sesHizi: 1.0,
  deviceOverride: null,
  avatarId: null,
  accentId: null,
  persistRequested: false,
  persistGranted: null,
};

/** Önceki sürümlerden kalmış öğrenci/veli kayıtlarını tek seferde sil. */
export async function kaliciOgrenciVerileriniSil(): Promise<void> {
  await Promise.all([
    db.learner_mastery.clear(),
    db.learner_profile.clear(),
    db.active_session.clear(),
    db.events.clear(),
    db.sessions.clear(),
  ]);
}

/** Profil oku — saklama kapalıyken her zaman bellekteki varsayılanı döner. */
export async function profilOku(): Promise<LearnerProfileRecord> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return VARSAYILAN_PROFILE;
  const profil = await db.learner_profile.get('aktif');
  return profil ?? VARSAYILAN_PROFILE;
}

/** Profil yaz — geçici saklama politikası nedeniyle no-op. */
export async function profilYaz(profil: LearnerProfileRecord, mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  await db.learner_profile.put(profil);
}

// ---------------------------------------------------------- mastery

/** Tüm ustalık kayıtlarını oku — saklama kapalıyken boş döner. */
export async function masteryOku(): Promise<readonly MasteryRecord[]> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return [];
  return db.learner_mastery.toArray();
}

/** Tek düğümün ustalık kaydını oku — saklama kapalıyken bulunmaz. */
export async function masteryTekOku(skillId: SkillId): Promise<MasteryRecord | undefined> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return undefined;
  return db.learner_mastery.get(skillId);
}

/** Ustalık kaydı yaz — geçici saklama politikası nedeniyle no-op. */
export async function masteryYaz(kayit: MasteryRecord, mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  await db.learner_mastery.put(kayit);
}

/** Birden çok ustalık kaydı yaz — geçici saklama politikası nedeniyle no-op. */
export async function masteryTopluYaz(kayitlar: readonly MasteryRecord[], mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  await db.learner_mastery.bulkPut(kayitlar as MasteryRecord[]);
}

// ---------------------------------------------------------- active_session

/** Duraklatılmış oturum var mı? Saklama kapalıyken her zaman hayır. */
export async function aktifOturumVar(): Promise<boolean> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return false;
  return (await db.active_session.count()) > 0;
}

/** Duraklatılmış oturumu oku — saklama kapalıyken bulunmaz. */
export async function aktifOturumOku(): Promise<AktifOturum | undefined> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return undefined;
  return db.active_session.get('aktif');
}

/** Aktif oturumu yaz — geçici saklama politikası nedeniyle no-op. */
export async function aktifOturumYaz(oturum: AktifOturum, mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  await db.active_session.put({ ...oturum, id: 'aktif' } as AktifOturum & { id: string });
}

/** Aktif oturumu sil — saklama kapalıyken no-op. */
export async function aktifOturumSil(): Promise<void> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return;
  await db.active_session.delete('aktif');
}

// ---------------------------------------------------------- events

/** Cevap olayı yaz — geçici saklama politikası nedeniyle no-op. */
export async function olayYaz(event: Omit<EventRecord, 'seq'>, mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  await db.events.add(event as EventRecord);
}

/** Olay kayıtlarını buda — saklama kapalıyken no-op. */
export async function olaylariBuda(maxKayit = 2000): Promise<void> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return;
  const sayi = await db.events.count();
  if (sayi <= maxKayit) return;

  const silinecek = sayi - maxKayit;
  const eskiKayitlar = await db.events.orderBy('seq').limit(silinecek).toArray();
  const silinecekIdler = eskiKayitlar.map((k) => k.seq!).filter(Boolean);
  await db.events.bulkDelete(silinecekIdler);
}

// ---------------------------------------------------------- sessions

/** Oturum özetlerini oku — saklama kapalıyken boş döner. */
export async function oturumOzetleriniOku(gunSiniri = 90): Promise<readonly SessionRecord[]> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return [];
  const esim = Date.now() - gunSiniri * 24 * 60 * 60 * 1000;
  return db.sessions.where('bitisTs').above(esim).toArray();
}

/** Oturum özeti yaz — geçici saklama politikası nedeniyle no-op. */
export async function oturumOzetiYaz(ozet: OturumOzeti, mod: Mod): Promise<void> {
  if (!persistenceEnabled(mod)) return;
  const kayit: SessionRecord = {
    ...ozet,
    sessionId: `${ozet.baslangicMs}-${ozet.bitisMs}`,
    bitisTs: ozet.bitisMs,
  };
  await db.sessions.put(kayit);
}

/** Oturum özetlerini buda — saklama kapalıyken no-op. */
export async function oturumOzetleriniBuda(gunSiniri = 90): Promise<void> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return;
  const esim = Date.now() - gunSiniri * 24 * 60 * 60 * 1000;
  const eskiKayitlar = await db.sessions.where('bitisTs').below(esim).toArray();
  const silinecekIdler = eskiKayitlar.map((k) => k.sessionId);
  await db.sessions.bulkDelete(silinecekIdler);
}

/** Oturum kapanışında budama — saklama kapalıyken no-op. */
export async function oturumKapanisindaBuda(): Promise<void> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return;
  await olaylariBuda();
  await oturumOzetleriniBuda();
}
