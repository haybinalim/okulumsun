/**
 * KALICILIK TESTLERİ — plan §10, §14 Adım 9.
 *
 * Bitti tanımı:
 *  · "Çevrimdışı tam oturum e2e geçer"
 *  · "Yedek dışa/içe aktarım e2e geçer"
 *  · "Sayfa yenilenince duraklatılmış oturum kaldığı sorudan sürer"
 *  · "Lighthouse PWA kurulabilir raporu" (bu test birim test değil, build kontrolü)
 *
 * Bu testler fake-indexeddb kullanır — tarayıcı olmadan IndexedDB simüle edilir.
 * Tahta modunda yazma yapılmadığı tekrar testle kanıtlanır.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

import { db, MEVCUT_SEMA_SURUMU, type LearnerProfileRecord } from '../../src/persistence/db';
import {
  VARSAYILAN_PROFILE,
  profilOku,
  profilYaz,
  aktifOturumVar,
  aktifOturumYaz,
  aktifOturumSil,
  aktifOturumOku,
  masteryYaz,
  masteryOku,
  olayYaz,
  olaylariBuda,
  oturumOzetiYaz,
  oturumOzetleriniOku,
  oturumOzetleriniBuda,
  oturumKapanisindaBuda,
} from '../../src/persistence/repository';
import {
  yedekOlustur,
  yedekSerialize,
  yedekDosyaAdi,
  yedekCozumle,
  yedeIceAktar,
  type YedekDosyasi,
} from '../../src/persistence/backup';
import { persistIste, depolamaTahmini, pwaKuruluMu } from '../../src/persistence/persist';
import { persistenceEnabled } from '../../src/store/appStore';
import type { MasteryRecord } from '../../src/progress/mastery';
import type { AktifOturum } from '../../src/progress/session';
import type { SkillId } from '../../src/exercises/types';

// ----------------------------------------------------- yardımcılar

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
    guncelSoruIndeksi: 3,
    cevaplar: [],
    durum: 'devam',
  };
}

// ----------------------------------------------------- temizlik

async function temizle() {
  await Promise.all([
    db.learner_mastery.clear(),
    db.learner_profile.clear(),
    db.active_session.clear(),
    db.events.clear(),
    db.sessions.clear(),
  ]);
}

// ============================================================ DB şema

describe('Dexie DB şema', () => {
  it('MEVCUT_SEMA_SURUMU 1', () => {
    expect(MEVCUT_SEMA_SURUMU).toBe(1);
  });

  it('db örneği 5 store içerir', () => {
    expect(db.learner_mastery).toBeDefined();
    expect(db.learner_profile).toBeDefined();
    expect(db.active_session).toBeDefined();
    expect(db.events).toBeDefined();
    expect(db.sessions).toBeDefined();
  });
});

// ============================================================ Profile

describe('Profil kalıcılığı', () => {
  beforeEach(temizle);

  it('profil yoksa varsayılan döner', async () => {
    const profil = await profilOku();
    expect(profil.readingLevel).toBe(0);
    expect(profil.okulAyiIndex).toBe(0);
  });

  it('kişisel modda profil yazılır', async () => {
    const profil: LearnerProfileRecord = {
      ...VARSAYILAN_PROFILE,
      readingLevel: 2,
      okulAyiIndex: 5,
    };
    await profilYaz(profil, KISISEL);
    const okunan = await profilOku();
    expect(okunan.readingLevel).toBe(2);
    expect(okunan.okulAyiIndex).toBe(5);
  });

  it('tahta modunda profil YAZILMAZ', async () => {
    const profil: LearnerProfileRecord = {
      ...VARSAYILAN_PROFILE,
      readingLevel: 3,
    };
    await profilYaz(profil, TAHTA);
    const okunan = await profilOku();
    // Varsayılan dönmeli — tahta modunda yazılmadı
    expect(okunan.readingLevel).toBe(0);
  });
});

// ============================================================ Mastery

describe('Mastery kalıcılığı', () => {
  beforeEach(temizle);

  it('kişisel modda mastery yazılır ve okunur', async () => {
    const kayit = ornekMastery('mat.sayma.test' as SkillId);
    await masteryYaz(kayit, KISISEL);
    const okunan = await masteryOku();
    expect(okunan).toHaveLength(1);
    expect(okunan[0].skillId).toBe('mat.sayma.test');
  });

  it('tahta modunda mastery YAZILMAZ', async () => {
    const kayit = ornekMastery('mat.sayma.tahta' as SkillId);
    await masteryYaz(kayit, TAHTA);
    const okunan = await masteryOku();
    expect(okunan).toHaveLength(0);
  });
});

// ============================================================ Active session

describe('Aktif oturum kalıcılığı', () => {
  beforeEach(temizle);

  it('kişisel modda aktif oturum yazılır', async () => {
    await aktifOturumYaz(ornekAktifOturum(), KISISEL);
    expect(await aktifOturumVar()).toBe(true);
  });

  it('tahta modunda aktif oturum YAZILMAZ', async () => {
    await aktifOturumYaz(ornekAktifOturum(), TAHTA);
    expect(await aktifOturumVar()).toBe(false);
  });

  it('aktif oturum silinir', async () => {
    await aktifOturumYaz(ornekAktifOturum(), KISISEL);
    await aktifOturumSil();
    expect(await aktifOturumVar()).toBe(false);
  });

  it('aktif oturum okunur', async () => {
    const oturum = ornekAktifOturum();
    await aktifOturumYaz(oturum, KISISEL);
    const okunan = await aktifOturumOku();
    expect(okunan).toBeDefined();
    expect(okunan?.guncelSoruIndeksi).toBe(3);
  });
});

// ============================================================ Events budama

describe('Events halka tampon budama', () => {
  beforeEach(temizle);

  it('2000 kayıt altında budama yapmaz', async () => {
    for (let i = 0; i < 100; i++) {
      await olayYaz({
        ts: Date.now(),
        skillId: 'mat.test' as SkillId,
        dogru: true,
        tani: null,
        latencyMs: 1000,
        yardimKademesi: 0,
      }, KISISEL);
    }
    await olaylariBuda(2000);
    const tumu = await db.events.toArray();
    expect(tumu).toHaveLength(100);
  });

  it('2000 kayıt üstünde eskileri siler', async () => {
    for (let i = 0; i < 2100; i++) {
      await olayYaz({
        ts: i,
        skillId: 'mat.test' as SkillId,
        dogru: true,
        tani: null,
        latencyMs: 1000,
        yardimKademesi: 0,
      }, KISISEL);
    }
    await olaylariBuda(2000);
    const tumu = await db.events.toArray();
    expect(tumu).toHaveLength(2000);
  });

  it('tahta modunda olay YAZILMAZ', async () => {
    await olayYaz({
      ts: Date.now(),
      skillId: 'mat.test' as SkillId,
      dogru: true,
      tani: null,
      latencyMs: 1000,
      yardimKademesi: 0,
    }, TAHTA);
    const tumu = await db.events.toArray();
    expect(tumu).toHaveLength(0);
  });
});

// ============================================================ Sessions budama

describe('Sessions budama', () => {
  beforeEach(temizle);

  it('90 günden eski oturum özetleri silinir', async () => {
    const simdi = Date.now();
    const yeniOzet = {
      baslangicMs: simdi - 1000,
      bitisMs: simdi,
      soruSayisi: 8,
      dogruSayisi: 6,
      yeniDugumSayisi: 2,
      masteredOlanDugumler: [],
    };
    const eskiOzet = {
      baslangicMs: simdi - 100 * 24 * 60 * 60 * 1000,
      bitisMs: simdi - 99 * 24 * 60 * 60 * 1000,
      soruSayisi: 8,
      dogruSayisi: 4,
      yeniDugumSayisi: 1,
      masteredOlanDugumler: [],
    };

    await oturumOzetiYaz(yeniOzet, KISISEL);
    await oturumOzetiYaz(eskiOzet, KISISEL);

    await oturumOzetleriniBuda(90);
    const ozetler = await oturumOzetleriniOku(90);
    expect(ozetler).toHaveLength(1);
  });

  it('tahta modunda oturum özeti YAZILMAZ', async () => {
    await oturumOzetiYaz({
      baslangicMs: Date.now() - 1000,
      bitisMs: Date.now(),
      soruSayisi: 8,
      dogruSayisi: 6,
      yeniDugumSayisi: 2,
      masteredOlanDugumler: [],
    }, TAHTA);
    const ozetler = await oturumOzetleriniOku(90);
    expect(ozetler).toHaveLength(0);
  });
});

// ============================================================ Yedekleme

describe('Yedekleme — dışa aktarım', () => {
  beforeEach(temizle);

  it('yedek oluşturulur', async () => {
    // Veri ekle
    await masteryYaz(ornekMastery('mat.yedek.test' as SkillId), KISISEL);
    await profilYaz({ ...VARSAYILAN_PROFILE, readingLevel: 1 }, KISISEL);

    const yedek = await yedekOlustur('0.1.0');
    expect(yedek.format).toBe('okulumsun-yedek');
    expect(yedek.formatVersion).toBe(1);
    expect(yedek.dbSchemaVersion).toBe(MEVCUT_SEMA_SURUMU);
    expect(yedek.uygulamaSurumu).toBe('0.1.0');
    expect(yedek.veri.learner_mastery).toHaveLength(1);
    expect(yedek.veri.learner_profile).not.toBeNull();
    expect(yedek.veri.learner_profile?.readingLevel).toBe(1);
  });

  it('yedek serialize edilebilir', async () => {
    const yedek = await yedekOlustur('0.1.0');
    const json = yedekSerialize(yedek);
    expect(json).toContain('okulumsun-yedek');
    expect(JSON.parse(json).format).toBe('okulumsun-yedek');
  });

  it('yedek dosya adı YYYY-AA-GG formatında', () => {
    const ad = yedekDosyaAdi(new Date('2026-08-06').getTime());
    expect(ad).toBe('okulumsun-yedek-2026-08-06.json');
  });

  it('yedek active_session içERMEZ', async () => {
    await aktifOturumYaz(ornekAktifOturum(), KISISEL);
    const yedek = await yedekOlustur('0.1.0');
    expect((yedek.veri as Record<string, unknown>).active_session).toBeUndefined();
  });
});

describe('Yedekleme — içe aktarım', () => {
  beforeEach(temizle);

  it('geçerli yedek içe aktarılır', async () => {
    // Önce veri ekle
    await masteryYaz(ornekMastery('mat.ice.test' as SkillId), KISISEL);
    const yedek = await yedekOlustur('0.1.0');

    // Veriyi temizle
    await temizle();
    expect(await masteryOku()).toHaveLength(0);

    // İçe aktar
    const sonuc = await yedeIceAktar(yedek);
    expect(sonuc.ok).toBe(true);
    const mastery = await masteryOku();
    expect(mastery).toHaveLength(1);
    expect(mastery[0].skillId).toBe('mat.ice.test');
  });

  it('format eşleşmiyorsa reddedilir', async () => {
    const gecersiz = {
      format: 'baska-format',
      formatVersion: 1,
      dbSchemaVersion: 1,
      olusturulmaTs: Date.now(),
      uygulamaSurumu: '0.1.0',
      veri: { learner_profile: null, learner_mastery: [], sessions: [] },
    } as unknown as YedekDosyasi;
    const sonuc = await yedeIceAktar(gecersiz);
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) expect(sonuc.sebep).toBe('format-eslesmiyor');
  });

  it('dbSchemaVersion büyükse reddedilir', async () => {
    const yedek: YedekDosyasi = {
      format: 'okulumsun-yedek',
      formatVersion: 1,
      dbSchemaVersion: 999,
      olusturulmaTs: Date.now(),
      uygulamaSurumu: '0.1.0',
      veri: { learner_profile: null, learner_mastery: [], sessions: [] },
    };
    const sonuc = await yedeIceAktar(yedek);
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) expect(sonuc.sebep).toBe('db-surumu-buyuk');
  });

  it('yedekCozumle geçersiz JSON için null döner', () => {
    expect(yedekCozumle('not json')).toBeNull();
  });

  it('yedekCozumle geçerli JSON için yedek döner', async () => {
    const yedek = await yedekOlustur('0.1.0');
    const json = yedekSerialize(yedek);
    const cozumlenen = yedekCozumle(json);
    expect(cozumlenen).not.toBeNull();
    expect(cozumlenen?.format).toBe('okulumsun-yedek');
  });

  it('içe aktarım mevcut veriyi DEĞİŞTİRİR (birleştirmez)', async () => {
    // Eski veri
    await masteryYaz(ornekMastery('mat.eski' as SkillId), KISISEL);
    expect(await masteryOku()).toHaveLength(1);

    // Yedek oluştur (farklı veriyle)
    await temizle();
    await masteryYaz(ornekMastery('mat.yeni' as SkillId), KISISEL);
    const yedek = await yedekOlustur('0.1.0');

    // Eski veriyi geri yükle
    await temizle();
    await masteryYaz(ornekMastery('mat.eski' as SkillId), KISISEL);

    // İçe aktar — eski silinmeli
    await yedeIceAktar(yedek);
    const mastery = await masteryOku();
    expect(mastery).toHaveLength(1);
    expect(mastery[0].skillId).toBe('mat.yeni');
  });
});

// ============================================================ Tahta modu garanti

describe('Tahta modu — hiçbir şey yazılmaz', () => {
  beforeEach(temizle);

  it('persistenceEnabled(tahta) false', () => {
    expect(persistenceEnabled('tahta')).toBe(false);
  });

  it('persistenceEnabled(kisisel) true', () => {
    expect(persistenceEnabled('kisisel')).toBe(true);
  });

  it('tahta modunda tüm yazma fonksiyonları no-op', async () => {
    await profilYaz({ ...VARSAYILAN_PROFILE, readingLevel: 3 }, TAHTA);
    await masteryYaz(ornekMastery('mat.tahta' as SkillId), TAHTA);
    await aktifOturumYaz(ornekAktifOturum(), TAHTA);
    await olayYaz({
      ts: Date.now(),
      skillId: 'mat.tahta' as SkillId,
      dogru: true,
      tani: null,
      latencyMs: 1000,
      yardimKademesi: 0,
    }, TAHTA);
    await oturumOzetiYaz({
      baslangicMs: 0,
      bitisMs: 1,
      soruSayisi: 8,
      dogruSayisi: 8,
      yeniDugumSayisi: 0,
      masteredOlanDugumler: [],
    }, TAHTA);

    // Hiçbir şey yazılmamış olmalı
    expect(await profilOku()).toEqual(VARSAYILAN_PROFILE);
    expect(await masteryOku()).toHaveLength(0);
    expect(await aktifOturumVar()).toBe(false);
    expect(await db.events.toArray()).toHaveLength(0);
    expect(await oturumOzetleriniOku(90)).toHaveLength(0);
  });
});

// ============================================================ Budama toplu

describe('Oturum kapanışında budama', () => {
  beforeEach(temizle);

  it('oturumKapanisindaBuda events ve sessions budar', async () => {
    // 2000+ olay ekle
    for (let i = 0; i < 2100; i++) {
      await db.events.add({
        ts: i,
        skillId: 'mat.test' as SkillId,
        dogru: true,
        tani: null,
        latencyMs: 1000,
        yardimKademesi: 0,
      });
    }
    // Eski oturum özeti ekle
    const simdi = Date.now();
    await db.sessions.put({
      baslangicMs: simdi - 100 * 24 * 60 * 60 * 1000,
      bitisMs: simdi - 99 * 24 * 60 * 60 * 1000,
      soruSayisi: 8,
      dogruSayisi: 4,
      yeniDugumSayisi: 1,
      masteredOlanDugumler: [],
      sessionId: 'eski',
      bitisTs: simdi - 99 * 24 * 60 * 60 * 1000,
    });

    await oturumKapanisindaBuda();

    expect(await db.events.toArray()).toHaveLength(2000);
    expect(await db.sessions.toArray()).toHaveLength(0);
  });
});

// ============================================================ Persist API

describe('Kalıcılık garantisi API', () => {
  it('persistIste boolean veya null döner', async () => {
    const sonuc = await persistIste();
    // Test ortamında navigator.storage olmayabilir
    expect(typeof sonuc === 'boolean' || sonuc === null).toBe(true);
  });

  it('depolamaTahmini null veya obje döner', async () => {
    const sonuc = await depolamaTahmini();
    expect(sonuc === null || (sonuc && typeof sonuc.kullanim === 'number')).toBe(true);
  });

  it('pwaKuruluMu boolean döner', () => {
    const sonuc = pwaKuruluMu();
    expect(typeof sonuc).toBe('boolean');
  });
});
