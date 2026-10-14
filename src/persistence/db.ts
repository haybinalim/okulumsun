/**
 * INDEXEDDB VERİTABANI — plan §10, ADR-0015 (Kabul, Seçenek 3: kendi ince sarmalayıcımız).
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
 * Biçim Dexie 4 `version(1)` ile BİREBİR aynıdır (eski sürümlerin yazdığı veri okunur, Dexie'ye dönüş
 * mümkün): ad `okulumsun`, IndexedDB sürümü **10** (Dexie sürümü ×10 yazar), aynı depo/anahtar/indeksler.
 * Kanıt: `tests/unit/indexeddbUyum.spec.ts`. Sürümü 10'dan BÜYÜK yapmak Dexie'ye dönüşü kapatır; ileride
 * v2 şeması gerekirse Dexie uyumu için 20 yazılır (ADR-0015 kabul koşulu).
 *
 * Şema sürümü 1. Migrasyonlar `src/persistence/migrations/` altında.
 */

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

// ---------------------------------------------------------------- şema

/** Veritabanı adı (Dexie sürümüyle aynı). */
export const DB_ADI = 'okulumsun';
/** IndexedDB sürümü = Dexie `version(1)` × 10. DEĞİŞTİRME (dosya başı). */
export const IDB_SURUMU = 10;

interface DepoTanimi {
  readonly keyPath: string;
  readonly autoIncrement: boolean;
  readonly indeksler: readonly string[];
}

/** Dexie `stores()` karşılığı: 'skillId, box, lastAnsweredAt' / '++seq, ts, skillId' … */
export const SEMA: Readonly<Record<string, DepoTanimi>> = {
  learner_mastery: { keyPath: 'skillId', autoIncrement: false, indeksler: ['box', 'lastAnsweredAt'] },
  learner_profile: { keyPath: 'id', autoIncrement: false, indeksler: [] },
  active_session: { keyPath: 'id', autoIncrement: false, indeksler: [] },
  events: { keyPath: 'seq', autoIncrement: true, indeksler: ['ts', 'skillId'] },
  sessions: { keyPath: 'sessionId', autoIncrement: false, indeksler: ['bitisTs'] },
};

/** Sarmalayıcı hataları: `ad` hata türünü, `cause` altta yatan DOMException'ı taşır. */
export class DbHatasi extends Error {
  readonly tur: 'acilamadi' | 'engellendi' | 'islem-iptal';
  constructor(tur: DbHatasi['tur'], mesaj: string, cause?: unknown) {
    super(mesaj, { cause });
    this.name = 'DbHatasi';
    this.tur = tur;
  }
}

// ---------------------------------------------------------------- bağlantı

let acik: Promise<IDBDatabase> | null = null;

function bagla(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((ok, hata) => {
    let bitti = false;
    const bitir = (h: DbHatasi) => {
      if (bitti) return;
      bitti = true;
      hata(h);
    };
    let r: IDBOpenDBRequest;
    try {
      r = indexedDB.open(DB_ADI, IDB_SURUMU);
    } catch (e) {
      bitir(new DbHatasi('acilamadi', 'IndexedDB açılamadı', e));
      return;
    }
    r.onupgradeneeded = () => {
      // Yalnız eksik depoları kur; mevcut (Dexie'nin kurduğu) depolara dokunma.
      const d = r.result;
      for (const [ad, t] of Object.entries(SEMA)) {
        if (d.objectStoreNames.contains(ad)) continue;
        const s = d.createObjectStore(ad, { keyPath: t.keyPath, autoIncrement: t.autoIncrement });
        for (const i of t.indeksler) s.createIndex(i, i);
      }
    };
    r.onsuccess = () => {
      const d = r.result;
      if (bitti) {
        // Engellenip reddedildikten sonra geç gelen bağlantı: sızdırma.
        d.close();
        return;
      }
      bitti = true;
      // Başka sekme sürüm yükseltmek / silmek isterse bağlantıyı bırak; sonraki çağrı yeniden açar.
      d.onversionchange = () => {
        d.close();
        if (acik) acik = null;
      };
      // Tarayıcı bağlantıyı beklenmedik kapatırsa (depolama silindi vb.) sonraki çağrı yeniden açar.
      d.onclose = () => {
        if (acik) acik = null;
      };
      ok(d);
    };
    r.onerror = () =>
      bitir(new DbHatasi('acilamadi', `IndexedDB açılamadı: ${r.error?.name ?? 'bilinmeyen'}`, r.error));
    // Eski sürüm başka sekmede açıkken yükseltme bekler; sonsuz beklemek yerine reddet (çağıran tekrar dener).
    r.onblocked = () => bitir(new DbHatasi('engellendi', 'IndexedDB başka bir sekme tarafından engellendi'));
  });
}

/** Tek paylaşılan bağlantı; başarısız açılış önbelleğe alınmaz (sonraki çağrı yeniden dener). */
function ac(): Promise<IDBDatabase> {
  if (!acik) {
    const p = bagla();
    acik = p;
    p.catch(() => {
      if (acik === p) acik = null;
    });
  }
  return acik;
}

/** Bağlantıyı kapat (testler ve `deleteDatabase` öncesi). Sonraki çağrı yeniden açar. */
export async function dbKapat(): Promise<void> {
  const p = acik;
  acik = null;
  if (!p) return;
  try {
    (await p).close();
  } catch {
    // açılmamıştı
  }
}

function islemBaslat(d: IDBDatabase, ad: string, kip: IDBTransactionMode): IDBTransaction {
  return d.transaction(ad, kip);
}

/**
 * Tek depoda tek işlem. Sonuç işlem TAMAMLANINCA (`oncomplete`) döner; yazma kalıcıdır.
 * İstek hatası veya işlem iptali `DbHatasi('islem-iptal')` ile reddedilir.
 */
async function islem<T>(ad: string, kip: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest | void): Promise<T> {
  let d = await ac();
  let tx: IDBTransaction;
  try {
    tx = islemBaslat(d, ad, kip);
  } catch (e) {
    // Bağlantı kapanıyor (versionchange/onclose yarışı): bir kez yeniden aç.
    if ((e as DOMException)?.name !== 'InvalidStateError') throw e;
    if (acik) acik = null;
    d = await ac();
    tx = islemBaslat(d, ad, kip);
  }
  return new Promise<T>((ok, hata) => {
    let sonuc: T = undefined as T;
    tx.oncomplete = () => ok(sonuc);
    tx.onabort = () => hata(new DbHatasi('islem-iptal', `IndexedDB işlemi iptal edildi (${ad})`, tx.error));
    try {
      const r = f(tx.objectStore(ad));
      if (r) r.onsuccess = () => (sonuc = r.result as T);
    } catch (e) {
      // Senkron hata (DataError vb.): işlemi iptal et; onabort reddeder.
      try {
        tx.abort();
      } catch {
        // zaten bitmiş
      }
      hata(new DbHatasi('islem-iptal', `IndexedDB isteği geçersiz (${ad})`, e));
    }
  });
}

// ---------------------------------------------------------------- tablo

/** Dexie `Table`'ın kullandığımız alt kümesi + 3 sorgu karşılığı. */
export class Tablo<T, K extends IDBValidKey> {
  readonly ad: string;
  constructor(ad: string) {
    this.ad = ad;
  }
  get(k: K): Promise<T | undefined> {
    return islem(this.ad, 'readonly', (s) => s.get(k));
  }
  put(v: T): Promise<K> {
    return islem(this.ad, 'readwrite', (s) => s.put(v));
  }
  add(v: T): Promise<K> {
    return islem(this.ad, 'readwrite', (s) => s.add(v));
  }
  delete(k: K): Promise<void> {
    return islem(this.ad, 'readwrite', (s) => s.delete(k));
  }
  clear(): Promise<void> {
    return islem(this.ad, 'readwrite', (s) => s.clear());
  }
  count(): Promise<number> {
    return islem(this.ad, 'readonly', (s) => s.count());
  }
  toArray(): Promise<T[]> {
    return islem(this.ad, 'readonly', (s) => s.getAll());
  }
  /** Tek işlemde toplu yazma (biri başarısızsa hiçbiri kalmaz). */
  bulkPut(v: readonly T[]): Promise<void> {
    return islem(this.ad, 'readwrite', (s) => {
      for (const x of v) s.put(x);
    });
  }
  /** Tek işlemde toplu silme. */
  bulkDelete(k: readonly K[]): Promise<void> {
    return islem(this.ad, 'readwrite', (s) => {
      for (const x of k) s.delete(x);
    });
  }
  /** `orderBy(<birincil anahtar>).limit(n).toArray()` karşılığı: birincil anahtar sırasında ilk n kayıt. */
  ilkN(n: number): Promise<T[]> {
    if (n <= 0) return Promise.resolve([]);
    return islem(this.ad, 'readonly', (s) => s.getAll(null, n));
  }
  /** `where(indeks).above(x).toArray()` karşılığı (açık alt uç, indeks sırasında). */
  ustu(indeks: string, x: IDBValidKey): Promise<T[]> {
    return islem(this.ad, 'readonly', (s) => s.index(indeks).getAll(IDBKeyRange.lowerBound(x, true)));
  }
  /** `where(indeks).below(x).toArray()` karşılığı (açık üst uç, indeks sırasında). */
  alti(indeks: string, x: IDBValidKey): Promise<T[]> {
    return islem(this.ad, 'readonly', (s) => s.index(indeks).getAll(IDBKeyRange.upperBound(x, true)));
  }
}

// ---------------------------------------------------------------- db

/** Uygulama boyunca tek DB örneği. Bağlantı ilk çağrıda tembel açılır. */
export const db = {
  learner_mastery: new Tablo<MasteryRecord, SkillId>('learner_mastery'),
  learner_profile: new Tablo<LearnerProfileRecord, string>('learner_profile'),
  active_session: new Tablo<AktifOturum, string>('active_session'),
  events: new Tablo<EventRecord, number>('events'),
  sessions: new Tablo<SessionRecord, string>('sessions'),
} as const;

/** localStorage anahtarları — plan §10. */
export const LS_KEYS = {
  activeProfileId: 'okulumsun.activeProfileId',
  contentPackVersion: 'okulumsun.contentPackVersion',
  dbSchemaVersion: 'okulumsun.dbSchemaVersion',
} as const;

/** Mevcut şema sürümü. */
export const MEVCUT_SEMA_SURUMU = 1;
