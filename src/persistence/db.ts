/**
 * DEXIE INDEXEDDB VERİTABANI — plan §10.
 *
 * Store'lar:
 *  · learner_mastery   — düğüm başına ustalık kaydı (§6.1)
 *  · learner_profile   — readingLevel, ayarlar, okul ayı (tek kayıt: id='aktif')
 *  · active_session    — duraklatılmış oturumun TAM durumu (tek kayıt: id='aktif')
 *  · events            — append-only cevap logu, son 2000 kayıt halka tampon
 *  · sessions          — oturum özeti, son 90 gün
 *
 * `content_*` store'ları YOKTUR — içerik JSON'ları paketle gelir, salt-okunur.
 * IndexedDB'ye kopyalamak ikinci bir gerçek kaynak yaratır.
 *
 * Şema sürümü 1. Migrasyonlar `src/persistence/migrations/` altında.
 */

import Dexie, { type Table } from 'dexie';
import type { MasteryRecord } from '../progress/mastery';
import type { AktifOturum, OturumOzeti } from '../progress/session';
import type { SkillId } from '../exercises/types';

// ---------------------------------------------------------------- tipler

/** learner_profile store'u — tek kayıt (id='aktif'). */
export interface LearnerProfileRecord {
  readonly id: 'aktif';
  readonly readingLevel: 0 | 1 | 2 | 3;
  readonly okulAyiIndex: number; // 0–9
  readonly sesHizi: number;
  readonly deviceOverride: 'board' | 'tablet' | 'phone' | null;
  readonly avatarId: string | null;
  readonly accentId: string | null;
  readonly persistRequested: boolean; // storage.persist() çağrıldı mı
  readonly persistGranted: boolean | null; // sonuç (null = henüz çağrılmadı)
}

/** events store'u — append-only cevap logu. */
export interface EventRecord {
  seq?: number; // auto-increment
  readonly ts: number;
  readonly skillId: SkillId;
  readonly dogru: boolean;
  readonly tani: string | null;
  readonly latencyMs: number;
  readonly yardimKademesi: number;
}

/** sessions store'u — oturum özeti + ID. */
export interface SessionRecord extends OturumOzeti {
  readonly sessionId: string;
  readonly bitisTs: number;
}

// ---------------------------------------------------------------- db

export class OkulumsunDB extends Dexie {
  learner_mastery!: Table<MasteryRecord, SkillId>;
  learner_profile!: Table<LearnerProfileRecord, string>;
  active_session!: Table<AktifOturum, string>;
  events!: Table<EventRecord, number>;
  sessions!: Table<SessionRecord, string>;

  constructor() {
    super('okulumsun');

    // Şema sürüm 1 — plan §10'da birebir tanımlı.
    this.version(1).stores({
      learner_mastery: 'skillId, box, lastAnsweredAt',
      learner_profile: 'id',
      active_session: 'id',
      events: '++seq, ts, skillId',
      sessions: 'sessionId, bitisTs',
    });
  }
}

/** Uygulama boyunca tek DB örneği. */
export const db = new OkulumsunDB();

/** localStorage anahtarları — plan §10. */
export const LS_KEYS = {
  activeProfileId: 'okulumsun.activeProfileId',
  contentPackVersion: 'okulumsun.contentPackVersion',
  dbSchemaVersion: 'okulumsun.dbSchemaVersion',
} as const;

/** Mevcut şema sürümü. */
export const MEVCUT_SEMA_SURUMU = 1;
