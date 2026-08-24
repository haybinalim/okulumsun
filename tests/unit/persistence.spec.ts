/**
 * GEÇİCİ VERİ SAKLAMA POLİTİKASI TESTLERİ.
 *
 * Geliştirme sürümünde öğrenci/veli profili, ustalık, oturum ve yanıt olayları
 * tarayıcıda saklanmaz. Bu testler hem yeni yazmaları hem de eski kayıtların
 * görünür olmasını engelleyen sözleşmeyi kanıtlar.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

import { db, MEVCUT_SEMA_SURUMU, type LearnerProfileRecord } from '../../src/persistence/db';
import {
  VARSAYILAN_PROFILE,
  aktifOturumOku,
  aktifOturumVar,
  aktifOturumYaz,
  kaliciOgrenciVerileriniSil,
  masteryOku,
  masteryYaz,
  olayYaz,
  oturumOzetleriniOku,
  oturumOzetiYaz,
  profilOku,
  profilYaz,
} from '../../src/persistence/repository';
import { yedekCozumle, yedekOlustur, yedeIceAktar, type YedekDosyasi } from '../../src/persistence/backup';
import { depolamaTahmini, persistDurumu, persistIste } from '../../src/persistence/persist';
import { OGRENCI_VERISI_SAKLANIR_MI } from '../../src/persistence/veriSaklamaPolitikasi';
import { persistenceEnabled } from '../../src/store/appStore';
import type { MasteryRecord } from '../../src/progress/mastery';
import type { AktifOturum } from '../../src/progress/session';
import type { SkillId } from '../../src/exercises/types';

const KISISEL = 'kisisel' as const;
const TAHTA = 'tahta' as const;

function ornekMastery(skillId: SkillId): MasteryRecord {
  return {
    skillId,
    strength: 0.5,
    enYuksekStrength: 0.6,
    box: 1,
    streak: 2,
    attempts: 5,
    distinctDays: 1,
    lastAnsweredAt: Date.now(),
    son6: [true, false, true],
    askidaBitis: null,
  };
}

function ornekAktifOturum(): AktifOturum {
  return {
    oturumTohumu: 42,
    profilTohumu: 7,
    baslangicMs: Date.now(),
    secilenSorular: [],
    guncelSoruIndeksi: 0,
    cevaplar: [],
    durum: 'devam',
  };
}

async function temizle() {
  await Promise.all([
    db.learner_mastery.clear(),
    db.learner_profile.clear(),
    db.active_session.clear(),
    db.events.clear(),
    db.sessions.clear(),
  ]);
}

describe('Geçici veri saklama politikası', () => {
  beforeEach(temizle);

  it('öğrenci veya veli verisi saklama politikası kapalıdır', () => {
    expect(OGRENCI_VERISI_SAKLANIR_MI).toBe(false);
    expect(persistenceEnabled(KISISEL)).toBe(false);
    expect(persistenceEnabled(TAHTA)).toBe(false);
    expect(persistenceEnabled(null)).toBe(false);
  });

  it('Dexie şeması yalnız mevcut kullanıcı verilerini temizlemek için erişilebilir kalır', () => {
    expect(MEVCUT_SEMA_SURUMU).toBe(1);
    expect(db.learner_mastery).toBeDefined();
    expect(db.learner_profile).toBeDefined();
    expect(db.active_session).toBeDefined();
    expect(db.events).toBeDefined();
    expect(db.sessions).toBeDefined();
  });

  it('kişisel modda profil, ustalık, oturum, olay ve oturum özeti yazmaz', async () => {
    const profil: LearnerProfileRecord = { ...VARSAYILAN_PROFILE, readingLevel: 2 };
    await profilYaz(profil, KISISEL);
    await masteryYaz(ornekMastery('mat.gizlilik.test' as SkillId), KISISEL);
    await aktifOturumYaz(ornekAktifOturum(), KISISEL);
    await olayYaz({
      ts: Date.now(),
      skillId: 'mat.gizlilik.test' as SkillId,
      dogru: true,
      tani: null,
      latencyMs: 1000,
      yardimKademesi: 0,
    }, KISISEL);
    await oturumOzetiYaz({
      baslangicMs: 1,
      bitisMs: 2,
      soruSayisi: 1,
      dogruSayisi: 1,
      yeniDugumSayisi: 0,
      masteredOlanDugumler: [],
    }, KISISEL);

    expect(await profilOku()).toEqual(VARSAYILAN_PROFILE);
    expect(await masteryOku()).toEqual([]);
    expect(await aktifOturumVar()).toBe(false);
    expect(await aktifOturumOku()).toBeUndefined();
    expect(await oturumOzetleriniOku()).toEqual([]);
    expect(await db.events.count()).toBe(0);
  });

  it('önceki sürümlerden kalan kayıtları okuma katmanından gizler ve temizler', async () => {
    await db.learner_profile.put({ ...VARSAYILAN_PROFILE, readingLevel: 3 });
    await db.learner_mastery.put(ornekMastery('mat.eski.kayit' as SkillId));
    await db.active_session.put({ ...ornekAktifOturum(), id: 'aktif' });
    await db.events.add({
      ts: Date.now(),
      skillId: 'mat.eski.kayit' as SkillId,
      dogru: false,
      tani: null,
      latencyMs: 50,
      yardimKademesi: 0,
    });

    expect(await profilOku()).toEqual(VARSAYILAN_PROFILE);
    expect(await masteryOku()).toEqual([]);
    expect(await aktifOturumOku()).toBeUndefined();

    await kaliciOgrenciVerileriniSil();
    expect(await db.learner_profile.count()).toBe(0);
    expect(await db.learner_mastery.count()).toBe(0);
    expect(await db.active_session.count()).toBe(0);
    expect(await db.events.count()).toBe(0);
    expect(await db.sessions.count()).toBe(0);
  });

  it('yedek oluşturma ve içe aktarma yollarını kapatır', async () => {
    await expect(yedekOlustur('0.1.0')).rejects.toThrow('saklama bu geliştirme sürümünde kapalı');

    const yedek: YedekDosyasi = {
      format: 'okulumsun-yedek',
      formatVersion: 1,
      dbSchemaVersion: MEVCUT_SEMA_SURUMU,
      olusturulmaTs: Date.now(),
      uygulamaSurumu: '0.1.0',
      veri: { learner_profile: null, learner_mastery: [], sessions: [] },
    };
    await expect(yedeIceAktar(yedek)).resolves.toEqual({ ok: false, sebep: 'saklama-kapali' });
    expect(yedekCozumle('geçersiz json')).toBeNull();
  });

  it('kalıcı depolama izni ve kullanım tahmini istemez', async () => {
    await expect(persistIste()).resolves.toBeNull();
    await expect(persistDurumu()).resolves.toBeNull();
    await expect(depolamaTahmini()).resolves.toBeNull();
  });
});
